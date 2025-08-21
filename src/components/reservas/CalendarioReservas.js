import React, { useState, useEffect } from 'react';
import { reservasService } from '../../services/reservasService';
import FormularioReserva from './FormularioReserva';
import './CalendarioReservas.css';
import CheckInButton from './CheckInButton';

const CalendarioReservas = () => {
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    useEffect(() => {
        cargarReservas();
    }, [fechaSeleccionada]);

    const cargarReservas = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('Cargando reservas...');

            // Obtener reservas del mes actual
            const primerDia = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), 1);
            const ultimoDia = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth() + 1, 0);

            const fechaInicioStr = primerDia.toISOString().split('T')[0];
            const fechaFinStr = ultimoDia.toISOString().split('T')[0];

            console.log('Rango de fechas:', fechaInicioStr, 'a', fechaFinStr);

            const reservasData = await reservasService.obtenerPorRango(fechaInicioStr, fechaFinStr);

            console.log('Reservas obtenidas:', reservasData);

            setReservas(reservasData);
            console.log('Datos de reservas recibidos:', reservasData);

        } catch (err) {
            console.error('Error cargando reservas:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const cambiarMes = (direccion) => {
        const nuevaFecha = new Date(fechaSeleccionada);
        nuevaFecha.setMonth(fechaSeleccionada.getMonth() + direccion);
        setFechaSeleccionada(nuevaFecha);
    };

    const handleReservaCreada = () => {
        setMostrarFormulario(false);
        cargarReservas(); // Recargar reservas
    };

    // DEBUG: Mostrar información en consola
    useEffect(() => {
        console.log('Estado actual - Loading:', loading, 'Reservas:', reservas.length, 'Error:', error);
    }, [loading, reservas, error]);

    if (mostrarFormulario) {
        return (
            <FormularioReserva
                onReservaCreada={handleReservaCreada}
                onCancelar={() => setMostrarFormulario(false)}
            />
        );
    }

    if (loading) {
        return (
            <div className="calendario-reservas">
                <div className="calendario-header">
                    <h2>Calendario de Reservas</h2>
                    <button
                        className="btn-nueva-reserva"
                        onClick={() => setMostrarFormulario(true)}
                    >
                        ＋ Nueva Reserva
                    </button>
                </div>
                <div className="loading">Cargando reservas...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="calendario-reservas">
                <div className="calendario-header">
                    <h2>Calendario de Reservas</h2>
                    <button
                        className="btn-nueva-reserva"
                        onClick={() => setMostrarFormulario(true)}
                    >
                        ＋ Nueva Reserva
                    </button>
                </div>
                <div className="error">
                    Error: {error}
                    <button onClick={cargarReservas} className="btn-reintentar">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="calendario-reservas">
            <div className="calendario-header">
                <h2>Calendario de Reservas</h2>
                <div className="header-actions">
                    <div className="controles-mes">
                        <button onClick={() => cambiarMes(-1)} className="btn-mes">←</button>
                        <span className="mes-actual">
                            {fechaSeleccionada.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => cambiarMes(1)} className="btn-mes">→</button>
                    </div>
                    <button
                        className="btn-nueva-reserva"
                        onClick={() => setMostrarFormulario(true)}
                    >
                        ＋ Nueva Reserva
                    </button>
                </div>
            </div>

            <div className="reservas-info">
                <p>Mostrando {reservas.length} reservas para este mes</p>
            </div>

            <div className="reservas-lista">
                <h3>Reservas del Mes</h3>

                {reservas.length === 0 ? (
                    <div className="sin-reservas">
                        <p>No hay reservas para este mes</p>
                        <button
                            onClick={() => setMostrarFormulario(true)}
                            className="btn-crear-primera"
                        >
                            Crear primera reserva
                        </button>
                    </div>
                ) : (
                    <div className="reservas-grid">
                        {reservas.map(reserva => (
                            <div key={reserva.id} className={`reserva-item ${reserva.estado_actual}`}>
                                <div className="reserva-header">
                                    <h4>{reserva.cliente_nombre || 'Cliente no especificado'}</h4>
                                    <span className={`badge-estado ${reserva.estado_actual}`}>
                                        {reserva.estado_actual}
                                    </span>
                                </div>
                                {/* { Estados: AUSENTE - PENDIENTE - PRESENTE - FINALIZADA} */}
                                <div className="reserva-info">
                                    <p>🎵 <strong>Sala:</strong> {reserva.sala_nombre}</p>

                                    <p>📅 <strong>Fecha:</strong> {new Date(reserva.fecha_reserva).toLocaleDateString('es-ES')}</p>
                                    <p>⏰ <strong>Horario:</strong> {reserva.hora_inicio} - {reserva.hora_fin}</p>
                                    <p>💰 <strong>Importe:</strong> ${reserva.importe_total}</p>
                                    {reserva.notas && (
                                        <p>📝 <strong>Notas:</strong> {reserva.notas}</p>
                                    )}
                                </div>

                                <div className="reserva-acciones">
                                    <CheckInButton
                                        reserva={reserva}
                                        onCheckInSuccess={cargarReservas}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarioReservas;