import React, { useState, useEffect } from 'react';
import FormularioReserva from '../reservas/FormularioReserva';

const DayDetailModal = ({ fecha, sala, reservas, onClose, onReservasUpdate }) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [reservaEditando, setReservaEditando] = useState(null);
  const [datosIniciales, setDatosIniciales] = useState(null);
  
  // Filtrar reservas del día seleccionado
  const fechaStr = fecha.toISOString().split('T')[0];
  const reservasDelDia = reservas.filter(reserva => reserva.fecha_reserva === fechaStr);
  
  // Generar horarios disponibles (cada hora de 09:00 a 23:00)
  const generarHorariosDisponibles = () => {
    const horarios = [];
    for (let hora = 9; hora < 23; hora++) {
      const horaInicio = `${hora.toString().padStart(2, '0')}:00`;
      const horaFin = `${(hora + 1).toString().padStart(2, '0')}:00`;
      
      // Verificar si esta franja está ocupada
      const estaOcupado = reservasDelDia.some(reserva => {
        return (horaInicio >= reserva.hora_inicio && horaInicio < reserva.hora_fin) ||
               (horaFin > reserva.hora_inicio && horaFin <= reserva.hora_fin) ||
               (horaInicio <= reserva.hora_inicio && horaFin >= reserva.hora_fin);
      });
      
      horarios.push({
        hora: horaInicio,
        horaFin,
        disponible: !estaOcupado,
        reserva: estaOcupado ? reservasDelDia.find(r => 
          (horaInicio >= r.hora_inicio && horaInicio < r.hora_fin) ||
          (horaFin > r.hora_inicio && horaFin <= r.hora_fin) ||
          (horaInicio <= r.hora_inicio && horaFin >= r.hora_fin)
        ) : null
      });
    }
    return horarios;
  };

  const horarios = generarHorariosDisponibles();

  const esHoy = () => {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  const esPasado = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha < hoy;
  };

  const manejarCrearReserva = (horaInicio = null, horaFin = null) => {
    // Para nueva reserva, pasar null y usar inicialData
    setReservaEditando(null);
    // Guardar datos iniciales para el formulario
    setDatosIniciales({
      sala_id: sala.id,
      fecha_reserva: fechaStr,
      hora_inicio: horaInicio || '09:00',
      hora_fin: horaFin || '10:00',
      cliente_id: '',
      usuario_id: '', // Se llenará en el formulario
      notas: ''
    });
    setMostrarFormulario(true);
  };

  const manejarEditarReserva = (reserva) => {
    setReservaEditando(reserva);
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setReservaEditando(null);
    setDatosIniciales(null);
  };

  const manejarReservaGuardada = () => {
    cerrarFormulario();
    onReservasUpdate(); // Actualizar datos en el componente padre
  };

  const obtenerEstadoBadge = (estado) => {
    const estados = {
      'pendiente': { texto: 'Pendiente', clase: 'pendiente', emoji: '⏳' },
      'presente': { texto: 'Presente', clase: 'presente', emoji: '✅' },
      'ausente': { texto: 'Ausente', clase: 'ausente', emoji: '❌' },
      'finalizada': { texto: 'Finalizada', clase: 'finalizada', emoji: '🏁' }
    };
    return estados[estado] || { texto: estado, clase: 'desconocido', emoji: '❓' };
  };

  // Cerrar modal con Escape
  useEffect(() => {
    const manejarEscape = (e) => {
      if (e.key === 'Escape') {
        if (mostrarFormulario) {
          cerrarFormulario();
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => document.removeEventListener('keydown', manejarEscape);
  }, [mostrarFormulario, onClose]);

  if (mostrarFormulario) {
    return (
      <div className="modal-overlay">
        <div className="modal-formulario">
          <FormularioReserva 
            reservaEditando={reservaEditando}
            datosIniciales={datosIniciales}
            onReservaGuardada={manejarReservaGuardada}
            onCancelar={cerrarFormulario}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="day-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-titulo">
            <h3>
              📅 {fecha.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <p>🏠 {sala.nombre}</p>
          </div>
          <button className="btn-cerrar" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-contenido">
          {/* Resumen del día */}
          <div className="dia-resumen">
            <div className="estadisticas-dia">
              <div className="stat-item">
                <span className="stat-numero">{reservasDelDia.length}</span>
                <span className="stat-label">Reservas</span>
              </div>
              <div className="stat-item">
                <span className="stat-numero">
                  {horarios.filter(h => h.disponible).length}
                </span>
                <span className="stat-label">Horas libres</span>
              </div>
              <div className="stat-item">
                <span className="stat-numero">
                  ${reservasDelDia.reduce((total, r) => total + parseFloat(r.importe_total || 0), 0)}
                </span>
                <span className="stat-label">Facturación</span>
              </div>
            </div>
            
            {!esPasado() && (
              <button 
                className="btn-crear-reserva"
                onClick={() => manejarCrearReserva()}
              >
                ➕ Nueva Reserva
              </button>
            )}
          </div>

          {/* Timeline de horarios */}
          <div className="horarios-timeline">
            <h4>Disponibilidad por Hora</h4>
            <div className="timeline">
              {horarios.map(horario => (
                <div 
                  key={horario.hora}
                  className={`timeline-slot ${horario.disponible ? 'disponible' : 'ocupado'}`}
                >
                  <div className="hora-label">
                    {horario.hora}
                  </div>
                  
                  {horario.disponible ? (
                    <div className="slot-disponible">
                      <span>Disponible</span>
                      {!esPasado() && (
                        <button 
                          className="btn-reservar-slot"
                          onClick={() => manejarCrearReserva(horario.hora, horario.horaFin)}
                        >
                          Reservar
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="slot-ocupado">
                      <div className="reserva-info">
                        <div className="cliente-info">
                          <strong>{horario.reserva.cliente_nombre}</strong>
                          {horario.reserva.contacto_nombre && (
                            <span> ({horario.reserva.contacto_nombre})</span>
                          )}
                        </div>
                        <div className="reserva-detalles">
                          <span className="horario">
                            De {horario.reserva.hora_inicio.substring(0, 5)} a {horario.reserva.hora_fin.substring(0, 5)}
                          </span>
                          <span className="importe">
                            ${horario.reserva.importe_total}
                          </span>
                        </div>
                        <div className="reserva-estado">
                          {(() => {
                            const estado = obtenerEstadoBadge(horario.reserva.estado_actual);
                            return (
                              <span className={`estado-badge ${estado.clase}`}>
                                {estado.emoji} {estado.texto}
                              </span>
                            );
                          })()}
                        </div>
                        {horario.reserva.notas && (
                          <div className="reserva-notas">
                            📝 {horario.reserva.notas}
                          </div>
                        )}
                      </div>
                      
                      {!esPasado() && (
                        <div className="reserva-acciones">
                          <button 
                            className="btn-editar-reserva"
                            onClick={() => manejarEditarReserva(horario.reserva)}
                          >
                            ✏️ Editar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {reservasDelDia.length === 0 && (
            <div className="sin-reservas">
              <div className="sin-reservas-icono">📭</div>
              <h4>Sin reservas para este día</h4>
              <p>
                {esPasado() 
                  ? 'No hubo actividad en esta fecha.'
                  : 'Toda la jornada está disponible para nuevas reservas.'
                }
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="atajos-teclado">
            <small>💡 Presiona <kbd>Esc</kbd> para cerrar</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayDetailModal;