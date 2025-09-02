import React, { useState, useEffect } from 'react';
import './PublicReservationLanding.css';
import BandSearch from './BandSearch';
import AvailabilityCalendar from './AvailabilityCalendar';
import VerificationForm from './VerificationForm';
import emailjs from '@emailjs/browser';

const STEPS = {
  SEARCH_BAND: 1,
  SELECT_DATETIME: 2,
  VERIFICATION: 3,
  CONFIRMED: 4
};

const PublicReservationLanding = () => {
  const [currentStep, setCurrentStep] = useState(STEPS.SEARCH_BAND);
  const [selectedBand, setSelectedBand] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reservationData, setReservationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Configuración EmailJS - estas deberían venir de variables de entorno
  const emailConfig = {
    serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || '',
    templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || '',
    publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || '' // Antes se llamaba userId
  };

  const handleBandSelected = (band) => {
    setSelectedBand(band);
    setError('');
    setCurrentStep(STEPS.SELECT_DATETIME);
  };

  const handleSlotSelected = async (slot) => {
    setSelectedSlot(slot);
    setLoading(true);
    setError('');

    try {
      // Iniciar proceso de reserva en el backend
      const response = await fetch('/api/public-reservas/start-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cliente_id: selectedBand.id,
          sala_id: slot.sala_id,
          fecha_reserva: slot.fecha,
          hora_inicio: slot.hora_inicio,
          hora_fin: slot.hora_fin,
          horas_reservadas: slot.horas_reservadas || 1
        })
      });

      const data = await response.json();

      if (data.success) {
        setReservationData(data.data);
        
        // Enviar código por email usando EmailJS
        if (emailConfig.serviceId && emailConfig.templateId && emailConfig.publicKey) {
          await sendVerificationEmail(data.data);
        }
        
        setCurrentStep(STEPS.VERIFICATION);
      } else {
        setError(data.message || 'Error al iniciar la reserva');
      }
    } catch (error) {
      console.error('Error al iniciar reserva:', error);
      setError('Error de conexión. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async (data) => {
    try {
      const templateParams = {
        to_email: data.email_destino,
        banda_nombre: data.banda_nombre,
        codigo_verificacion: data.codigo_para_envio,
        fecha_reserva: selectedSlot.fecha,
        hora_reserva: selectedSlot.hora_inicio,
        sala_nombre: data.sala_nombre,
        importe_total: data.importe_total
      };

      await emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        templateParams,
        emailConfig.publicKey
      );

      console.log('Email enviado exitosamente');
    } catch (error) {
      console.error('Error enviando email:', error);
      // No fallar el proceso por error de email
    }
  };

  const handleVerificationSuccess = () => {
    setCurrentStep(STEPS.CONFIRMED);
  };

  const handleRestart = () => {
    // Reiniciar todo el proceso al paso 1
    setCurrentStep(STEPS.SEARCH_BAND);
    setSelectedBand(null);
    setSelectedSlot(null);
    setReservationData(null);
    setLoading(false);
    setError('');
  };

  const handleStartOver = () => {
    setCurrentStep(STEPS.SEARCH_BAND);
    setSelectedBand(null);
    setSelectedSlot(null);
    setReservationData(null);
    setError('');
  };

  const renderProgressIndicator = () => {
    return (
      <div className="progress-indicator">
        <div className={`step ${currentStep >= STEPS.SEARCH_BAND ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Buscar Banda</div>
        </div>
        <div className={`step ${currentStep >= STEPS.SELECT_DATETIME ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Seleccionar Horario</div>
        </div>
        <div className={`step ${currentStep >= STEPS.VERIFICATION ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Verificar Código</div>
        </div>
        <div className={`step ${currentStep >= STEPS.CONFIRMED ? 'active' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">Confirmado</div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case STEPS.SEARCH_BAND:
        return (
          <BandSearch 
            onBandSelected={handleBandSelected}
            error={error}
          />
        );
      
      case STEPS.SELECT_DATETIME:
        return (
          <AvailabilityCalendar
            selectedBand={selectedBand}
            onSlotSelected={handleSlotSelected}
            onBack={() => setCurrentStep(STEPS.SEARCH_BAND)}
            loading={loading}
            error={error}
          />
        );
      
      case STEPS.VERIFICATION:
        return (
          <VerificationForm
            reservationData={reservationData}
            selectedBand={selectedBand}
            selectedSlot={selectedSlot}
            onVerificationSuccess={handleVerificationSuccess}
            onBack={() => setCurrentStep(STEPS.SELECT_DATETIME)}
            onRestart={handleRestart}
            error={error}
          />
        );
      
      case STEPS.CONFIRMED:
        return (
          <div className="confirmation-step">
            <div className="confirmation-icon">✅</div>
            <h2>¡Reserva Confirmada!</h2>
            <div className="confirmation-details">
              <p><strong>Banda:</strong> {selectedBand?.nombre_banda}</p>
              <p><strong>Fecha:</strong> {selectedSlot?.fecha}</p>
              <p><strong>Horario:</strong> {selectedSlot?.hora_inicio} - {selectedSlot?.hora_fin}</p>
              <p><strong>Sala:</strong> {reservationData?.sala_nombre}</p>
              <p><strong>Importe:</strong> ${reservationData?.importe_total}</p>
            </div>
            <p className="confirmation-note">
              Recibirás un email de confirmación con todos los detalles.
            </p>
            <button 
              className="btn btn-primary"
              onClick={handleStartOver}
            >
              Hacer otra reserva
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="public-reservation-container">
      <div className="header">
        <h1>Reserva tu Sala de Ensayo</h1>
        <p className="subtitle">Sistema de reservas online - Fácil, rápido y seguro</p>
      </div>

      {renderProgressIndicator()}

      <div className="step-content">
        {renderCurrentStep()}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Procesando tu reserva...</p>
        </div>
      )}
    </div>
  );
};

export default PublicReservationLanding;