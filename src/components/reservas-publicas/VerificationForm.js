import React, { useState, useEffect, useRef } from 'react';
import './VerificationForm.css';

const VerificationForm = ({ 
  reservationData, 
  selectedBand, 
  selectedSlot, 
  onVerificationSuccess, 
  onBack, 
  error 
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [attempts, setAttempts] = useState(3);
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (reservationData?.fecha_expiracion) {
      const expirationTime = new Date(reservationData.fecha_expiracion).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, expirationTime - now);
      
      setTimeRemaining(Math.floor(remaining / 1000));
      
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const remaining = Math.max(0, expirationTime - now);
        setTimeRemaining(Math.floor(remaining / 1000));
        
        if (remaining <= 0) {
          clearInterval(timer);
          setVerificationError('El código de verificación ha expirado');
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [reservationData]);

  useEffect(() => {
    // Focus en el primer input al cargar
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index, value) => {
    // Solo permitir números
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1); // Solo el último caracter
    setCode(newCode);
    setVerificationError('');
    
    // Auto-focus al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        // Si el input está vacío, ir al anterior
        inputRefs.current[index - 1]?.focus();
      } else {
        // Limpiar el input actual
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    }
    
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    if (e.key === 'Enter') {
      handleVerification();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, ''); // Solo números
    
    if (pastedText.length === 6) {
      const newCode = pastedText.split('');
      setCode(newCode);
      setVerificationError('');
      inputRefs.current[5]?.focus(); // Focus en el último input
    }
  };

  const handleVerification = async () => {
    const codeString = code.join('');
    
    if (codeString.length !== 6) {
      setVerificationError('Por favor, ingresa el código completo de 6 dígitos');
      return;
    }
    
    if (timeRemaining <= 0) {
      setVerificationError('El código de verificación ha expirado');
      return;
    }
    
    setLoading(true);
    setVerificationError('');
    
    try {
      const response = await fetch('/api/public-reservas/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reserva_id: reservationData.reserva_id,
          codigo: codeString
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        onVerificationSuccess();
      } else {
        setVerificationError(data.message || 'Código incorrecto');
        setAttempts(prev => Math.max(0, prev - 1));
        
        // Limpiar el código para permitir nuevo intento
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setVerificationError('Error de conexión. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString + 'T12:00:00').toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="verification-form">
      <div className="verification-header">
        <h2>Paso 3: Verificar tu email</h2>
        <p className="verification-info">
          Hemos enviado un código de verificación de 6 dígitos a <strong>{reservationData?.email_destino}</strong>
        </p>
      </div>

      {/* Resumen de la reserva */}
      <div className="reservation-summary">
        <h3>Resumen de tu reserva</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Banda:</span>
            <span className="summary-value">{selectedBand?.nombre_banda}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Sala:</span>
            <span className="summary-value">{reservationData?.sala_nombre}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Fecha:</span>
            <span className="summary-value">{formatDate(selectedSlot?.fecha)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Horario:</span>
            <span className="summary-value">
              {selectedSlot?.hora_inicio?.substring(0, 5)} - {selectedSlot?.hora_fin?.substring(0, 5)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Importe:</span>
            <span className="summary-value">${reservationData?.importe_total}</span>
          </div>
        </div>
      </div>

      {/* Código de verificación */}
      <div className="verification-section">
        <h3>Ingresa el código de verificación</h3>
        <div className="code-input-container">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              className="code-input"
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              maxLength={1}
              disabled={loading || timeRemaining <= 0}
            />
          ))}
        </div>

        {/* Timer de expiración */}
        {timeRemaining > 0 ? (
          <div className="timer-container">
            <div className="timer">
              ⏱️ El código expira en: <strong>{formatTime(timeRemaining)}</strong>
            </div>
          </div>
        ) : (
          <div className="expired-message">
            ⚠️ El código de verificación ha expirado
          </div>
        )}

        {/* Intentos restantes */}
        {attempts < 3 && attempts > 0 && (
          <div className="attempts-warning">
            ⚠️ Intentos restantes: {attempts}
          </div>
        )}

        {/* Botón de verificación */}
        <button
          className="btn btn-primary verify-button"
          onClick={handleVerification}
          disabled={loading || code.join('').length !== 6 || timeRemaining <= 0}
        >
          {loading ? (
            <>
              <div className="button-spinner"></div>
              Verificando...
            </>
          ) : (
            'Confirmar reserva'
          )}
        </button>
      </div>

      {/* Errores */}
      {(error || verificationError) && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error || verificationError}
        </div>
      )}

      {/* Ayuda */}
      <div className="verification-help">
        <h4>¿No recibiste el código?</h4>
        <ul>
          <li>Revisa tu bandeja de entrada y carpeta de spam</li>
          <li>Verifica que el email {reservationData?.email_destino} sea correcto</li>
          <li>El código puede tardar hasta 5 minutos en llegar</li>
          <li>Si el problema persiste, intenta crear la reserva nuevamente</li>
        </ul>
      </div>

      {/* Acciones */}
      <div className="verification-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Volver al calendario
        </button>
      </div>
    </div>
  );
};

export default VerificationForm;