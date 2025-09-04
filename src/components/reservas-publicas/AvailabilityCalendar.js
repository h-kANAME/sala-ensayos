import React, { useState, useEffect } from 'react';
import './AvailabilityCalendar.css';

const AvailabilityCalendar = ({ selectedBand, onSlotSelected, onBack, loading, error }) => {
  const [salas, setSalas] = useState([]);
  const [selectedSala, setSelectedSala] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [calendarError, setCalendarError] = useState('');

  // Generar fechas para los próximos 30 días
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // No incluir domingos (0) - asumiendo que la sala no opera los domingos
      if (date.getDay() !== 0) {
        dates.push({
          date: date.toISOString().split('T')[0],
          displayDate: date.toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        });
      }
    }
    
    return dates;
  };

  const availableDates = generateAvailableDates();

  useEffect(() => {
    loadSalas();
  }, []);

  useEffect(() => {
    if (selectedSala && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedSala, selectedDate]);

  const loadSalas = async () => {
    try {
      const response = await fetch('/api/public-reservas/salas');
      const data = await response.json();
      
      if (data.success) {
        setSalas(data.data);
        // Seleccionar automáticamente la primera sala si solo hay una
        if (data.data.length === 1) {
          setSelectedSala(data.data[0]);
        }
      } else {
        setCalendarError('Error al cargar las salas disponibles');
      }
    } catch (error) {
      console.error('Error loading salas:', error);
      setCalendarError('Error de conexión al cargar las salas');
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedSala || !selectedDate) return;
    
    setLoadingSlots(true);
    setCalendarError('');
    
    try {
      const response = await fetch(
        `/api/public-reservas/availability?sala_id=${selectedSala.id}&fecha=${selectedDate}`
      );
      const data = await response.json();
      
      if (data.success) {
        const slotsWithMetadata = data.data.map(slot => ({
          ...slot,
          sala_id: selectedSala.id,
          fecha: selectedDate,
          horas_reservadas: 1
        }));
        setAvailableSlots(slotsWithMetadata);
      } else {
        setCalendarError('Error al verificar disponibilidad');
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      setCalendarError('Error de conexión al verificar disponibilidad');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5); // HH:MM
  };

  const handleSlotClick = (slot) => {
    if (loading) return;
    
    const slotWithDetails = {
      ...slot,
      sala_nombre: selectedSala.nombre
    };
    
    onSlotSelected(slotWithDetails);
  };

  return (
    <div className="availability-calendar">
      <div className="calendar-header">
        <h2>Paso 2: Seleccionar fecha y horario</h2>
        <p className="selected-band">
          <strong>Banda seleccionada:</strong> {selectedBand?.nombre_banda}
        </p>
      </div>

      <div className="calendar-content">
        {/* Selector de Sala */}
        <div className="sala-selector">
          <h3>Selecciona la sala</h3>
          <div className="salas-grid">
            {salas.map(sala => (
              <div
                key={sala.id}
                className={`sala-card ${selectedSala?.id === sala.id ? 'selected' : ''}`}
                onClick={() => setSelectedSala(sala)}
              >
                <h4>{sala.nombre}</h4>
                <p className="sala-description">{sala.descripcion}</p>
                <div className="sala-details">
                  <span className="capacity">👥 {sala.capacidad} personas</span>
                </div>
                {sala.equipamiento && (
                  <p className="equipment">🎵 {sala.equipamiento}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selector de Fecha */}
        {selectedSala && (
          <div className="date-selector">
            <h3>Selecciona la fecha</h3>
            <div className="dates-grid">
              {availableDates.slice(0, 14).map(dateInfo => (
                <button
                  key={dateInfo.date}
                  className={`date-button ${selectedDate === dateInfo.date ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(dateInfo.date)}
                >
                  <div className="date-day">
                    {new Date(dateInfo.date + 'T12:00:00').toLocaleDateString('es-AR', { 
                      weekday: 'short' 
                    })}
                  </div>
                  <div className="date-number">
                    {new Date(dateInfo.date + 'T12:00:00').getDate()}
                  </div>
                  <div className="date-month">
                    {new Date(dateInfo.date + 'T12:00:00').toLocaleDateString('es-AR', { 
                      month: 'short' 
                    })}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Slots de Horario Disponibles */}
        {selectedSala && selectedDate && (
          <div className="time-slots">
            <h3>Horarios disponibles</h3>
            <p className="selected-info">
              <strong>{selectedSala.nombre}</strong> - {
                new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              }
            </p>

            {loadingSlots ? (
              <div className="loading-slots">
                <div className="loading-spinner"></div>
                <p>Cargando horarios disponibles...</p>
              </div>
            ) : (
              <div className="slots-grid">
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      className="time-slot-button"
                      onClick={() => handleSlotClick(slot)}
                      disabled={loading}
                    >
                      <div className="slot-time">
                        {formatTime(slot.hora_inicio)} - {formatTime(slot.hora_fin)}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="no-slots">
                    <div className="no-slots-icon">📅</div>
                    <p>No hay horarios disponibles para esta fecha</p>
                    <p className="no-slots-hint">Prueba con otra fecha o sala</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {(error || calendarError) && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error || calendarError}
        </div>
      )}

      <div className="calendar-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Volver a búsqueda
        </button>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;