import React, { useState, useEffect } from 'react';
import { salasService } from '../../services/salasService';
import { reservasService } from '../../services/reservasService';
import SalaSelector from './SalaSelector';
import MonthGrid from './MonthGrid';
import DayDetailModal from './DayDetailModal';
import './CalendarioPorSala.css';

const CalendarioPorSala = () => {
  // Estados principales
  const [salas, setSalas] = useState([]);
  const [salaSeleccionada, setSalaSeleccionada] = useState(null);
  const [fechaActual, setFechaActual] = useState(new Date());
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados del modal
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [mostrarDetalleModal, setMostrarDetalleModal] = useState(false);

  useEffect(() => {
    cargarSalas();
  }, []);

  useEffect(() => {
    if (salaSeleccionada) {
      cargarReservas();
    }
  }, [salaSeleccionada, fechaActual]);

  // Escuchar eventos de navegación del calendario
  useEffect(() => {
    const handleCalendarNavigate = (event) => {
      setFechaActual(event.detail.date);
    };

    window.addEventListener('calendar-navigate', handleCalendarNavigate);
    return () => window.removeEventListener('calendar-navigate', handleCalendarNavigate);
  }, []);

  const cargarSalas = async () => {
    try {
      console.log('🏠 Cargando salas...');
      const response = await salasService.obtenerSalas();
      const salasArray = Array.isArray(response) ? response : (response.data || []);
      setSalas(salasArray);
      
      // Seleccionar primera sala por defecto
      if (salasArray.length > 0) {
        setSalaSeleccionada(salasArray[0]);
      }
    } catch (error) {
      console.error('❌ Error al cargar salas:', error);
      setError('Error al cargar las salas');
    }
  };

  const cargarReservas = async () => {
    try {
      setLoading(true);
      setError('');

      // Calcular primer y último día del mes
      const primerDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
      const ultimoDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
      
      // Convertir a formato string
      const fechaInicio = primerDia.toISOString().split('T')[0];
      const fechaFin = ultimoDia.toISOString().split('T')[0];

      console.log(`🗓️ Cargando reservas para ${salaSeleccionada.nombre} - ${fechaInicio} a ${fechaFin}`);
      
      const response = await reservasService.obtenerPorRango(fechaInicio, fechaFin);
      const reservasArray = Array.isArray(response) ? response : (response.data || []);
      
      // Filtrar reservas por la sala seleccionada
      const reservasFiltradas = reservasArray.filter(
        reserva => reserva.sala_id === salaSeleccionada.id
      );
      
      setReservas(reservasFiltradas);
      console.log(`✅ ${reservasFiltradas.length} reservas cargadas para ${salaSeleccionada.nombre}`);
      
    } catch (error) {
      console.error('❌ Error al cargar reservas:', error);
      setError('Error al cargar las reservas');
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const navegarMes = (direccion) => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setMonth(fechaActual.getMonth() + direccion);
    setFechaActual(nuevaFecha);
  };

  const manejarClickDia = (fecha) => {
    setDiaSeleccionado(fecha);
    setMostrarDetalleModal(true);
  };

  const cerrarModal = () => {
    setMostrarDetalleModal(false);
    setDiaSeleccionado(null);
  };

  const actualizarReservas = () => {
    // Recargar reservas después de cambios
    cargarReservas();
  };

  return (
    <div className="calendario-por-sala">
      <div className="calendario-header">
        <div className="titulo-seccion">
          <h2>🗓️ Calendario por Sala</h2>
          <p>Vista mensual de disponibilidad y reservas</p>
        </div>
        
        <div className="controles-navegacion">
          <button 
            className="btn-navegacion"
            onClick={() => navegarMes(-1)}
            title="Mes anterior"
          >
            ← Anterior
          </button>
          
          <h3 className="mes-actual">
            {fechaActual.toLocaleString('es-ES', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h3>
          
          <button 
            className="btn-navegacion"
            onClick={() => navegarMes(1)}
            title="Mes siguiente"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      <div className="calendario-contenido">
        <SalaSelector 
          salas={salas}
          salaSeleccionada={salaSeleccionada}
          onSalaChange={setSalaSeleccionada}
        />
        
        <div className="calendario-principal">
          {loading ? (
            <div className="loading-calendario">
              <div className="spinner">⏳</div>
              <p>Cargando calendario...</p>
            </div>
          ) : (
            <MonthGrid 
              fechaActual={fechaActual}
              reservas={reservas}
              salaSeleccionada={salaSeleccionada}
              onDayClick={manejarClickDia}
            />
          )}
        </div>
      </div>

      {mostrarDetalleModal && (
        <DayDetailModal 
          fecha={diaSeleccionado}
          sala={salaSeleccionada}
          reservas={reservas}
          onClose={cerrarModal}
          onReservasUpdate={actualizarReservas}
        />
      )}
    </div>
  );
};

export default CalendarioPorSala;