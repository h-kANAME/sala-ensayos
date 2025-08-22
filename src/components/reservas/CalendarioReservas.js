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
    const [tipoVista, setTipoVista] = useState('diario'); // 'mensual', 'semanal', 'diario' - Default: diario
    const [reservaEditando, setReservaEditando] = useState(null); // Para edición

    useEffect(() => {
        cargarReservas();
    }, [fechaSeleccionada, tipoVista]);

    // Función para determinar en qué día debe aparecer una reserva según la hora
    const calcularDiaVisualizacion = (fechaReserva, horaInicio) => {
        const [horas] = horaInicio.split(':').map(Number);
        
        // Si la hora de inicio es entre 00:00 y 05:59, la reserva se visualiza en el día anterior
        // Esto corrige que una reserva guardada el 22/08 (00:30-01:30) aparezca el 21/08
        if (horas >= 0 && horas < 6) {
            const fecha = new Date(fechaReserva + 'T00:00:00');
            fecha.setDate(fecha.getDate() - 1);
            return fecha.toISOString().split('T')[0];
        }
        
        return fechaReserva;
    };

    const cargarReservas = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('Cargando reservas...', 'Tipo vista:', tipoVista);

            // Calcular rango de fechas según tipo de vista
            let primerDia, ultimoDia;
            
            switch (tipoVista) {
                case 'diario':
                    primerDia = new Date(fechaSeleccionada);
                    ultimoDia = new Date(fechaSeleccionada);
                    break;
                case 'semanal':
                    const diaInicio = fechaSeleccionada.getDay(); // 0 = Domingo
                    primerDia = new Date(fechaSeleccionada);
                    primerDia.setDate(fechaSeleccionada.getDate() - diaInicio);
                    ultimoDia = new Date(primerDia);
                    ultimoDia.setDate(primerDia.getDate() + 6);
                    break;
                case 'mensual':
                default:
                    primerDia = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), 1);
                    ultimoDia = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth() + 1, 0);
                    break;
            }

            // Expandir rango para incluir reservas nocturnas (día siguiente)
            const fechaExpandida = new Date(ultimoDia);
            fechaExpandida.setDate(ultimoDia.getDate() + 1);

            // Corregir timezone para evitar desfase de fechas
            const fechaInicioStr = new Date(primerDia.getTime() - primerDia.getTimezoneOffset() * 60000).toISOString().split('T')[0];
            const fechaFinStr = new Date(fechaExpandida.getTime() - fechaExpandida.getTimezoneOffset() * 60000).toISOString().split('T')[0];

            console.log('Rango de fechas:', fechaInicioStr, 'a', fechaFinStr);

            const reservasData = await reservasService.obtenerPorRango(fechaInicioStr, fechaFinStr);

            console.log('Reservas obtenidas:', reservasData);

            // Extraer el array de reservas correctamente
            let reservasArray = Array.isArray(reservasData) ? reservasData : (reservasData.data || []);
            
            console.log('Datos extraídos y filtrados (antes del filtro de visualización):', reservasArray);
            
            // Filtrar reservas según el día de visualización correcto
            const fechaInicioFiltro = new Date(primerDia.getTime() - primerDia.getTimezoneOffset() * 60000).toISOString().split('T')[0];
            const fechaFinFiltro = new Date(ultimoDia.getTime() - ultimoDia.getTimezoneOffset() * 60000).toISOString().split('T')[0];
            
            reservasArray = reservasArray.filter(reserva => {
                const diaVisualizacion = calcularDiaVisualizacion(reserva.fecha_reserva, reserva.hora_inicio);
                const estaEnRango = diaVisualizacion >= fechaInicioFiltro && diaVisualizacion <= fechaFinFiltro;
                
                if (tipoVista === 'diario') {
                    console.log(`Reserva ID ${reserva.id}: fecha_db=${reserva.fecha_reserva}, hora=${reserva.hora_inicio}, dia_visualizacion=${diaVisualizacion}, fecha_filtro=${fechaInicioFiltro}, incluir=${estaEnRango}`);
                }
                
                return estaEnRango;
            });
            
            console.log('Datos después del filtro de visualización:', reservasArray);
            
            // Ordenar de más reciente a más antigua
            reservasArray = reservasArray.sort((a, b) => {
                const fechaA = new Date(`${a.fecha_reserva}T${a.hora_inicio}`);
                const fechaB = new Date(`${b.fecha_reserva}T${b.hora_inicio}`);
                return fechaB - fechaA; // Orden descendente (más reciente primero)
            });
            
            setReservas(reservasArray);
            console.log('Array de reservas procesado y ordenado:', reservasArray);

        } catch (err) {
            console.error('Error cargando reservas:', err);
            setError(err.message);
            setReservas([]); // Establecer array vacío en caso de error
        } finally {
            setLoading(false);
        }
    };

    const cambiarPeriodo = (direccion) => {
        const nuevaFecha = new Date(fechaSeleccionada);
        
        switch (tipoVista) {
            case 'diario':
                nuevaFecha.setDate(fechaSeleccionada.getDate() + direccion);
                break;
            case 'semanal':
                nuevaFecha.setDate(fechaSeleccionada.getDate() + (direccion * 7));
                break;
            case 'mensual':
            default:
                nuevaFecha.setMonth(fechaSeleccionada.getMonth() + direccion);
                break;
        }
        
        setFechaSeleccionada(nuevaFecha);
    };

    const obtenerTextoPerido = () => {
        const opciones = { year: 'numeric', month: 'long' };
        
        switch (tipoVista) {
            case 'diario':
                return fechaSeleccionada.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            case 'semanal':
                const inicioSemana = new Date(fechaSeleccionada);
                const diaInicio = fechaSeleccionada.getDay();
                inicioSemana.setDate(fechaSeleccionada.getDate() - diaInicio);
                const finSemana = new Date(inicioSemana);
                finSemana.setDate(inicioSemana.getDate() + 6);
                return `${inicioSemana.toLocaleDateString('es-ES')} - ${finSemana.toLocaleDateString('es-ES')}`;
            case 'mensual':
            default:
                return fechaSeleccionada.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        }
    };

    const handleReservaCreada = () => {
        setMostrarFormulario(false);
        setReservaEditando(null);
        cargarReservas(); // Recargar reservas
    };

    const handleEditarReserva = (reserva) => {
        // No permitir edición si ya se hizo checkout (FINALIZADA)
        if (reserva.estado_actual === 'FINALIZADA') {
            alert('No se puede editar una reserva que ya finalizó (checkout realizado)');
            return;
        }
        
        console.log('✏️ Editando reserva:', reserva);
        setReservaEditando(reserva);
        setMostrarFormulario(true);
    };

    const handleEliminarReserva = async (id, estadoActual) => {
        // No permitir eliminación si ya se hizo checkout (FINALIZADA)
        if (estadoActual === 'FINALIZADA') {
            alert('No se puede eliminar una reserva que ya finalizó (checkout realizado)');
            return;
        }

        if (window.confirm('¿Estás seguro de eliminar esta reserva?')) {
            try {
                console.log('🗑️ Eliminando reserva ID:', id);
                const resultado = await reservasService.eliminarReserva(id);
                console.log('✅ Reserva eliminada:', resultado);
                cargarReservas(); // Recargar lista
            } catch (err) {
                console.error('❌ Error eliminando reserva:', err);
                // Mostrar el mensaje de error específico del backend
                const mensajeError = err.response?.data?.message || err.message || 'Error eliminando reserva';
                setError(mensajeError);
                alert('❌ ' + mensajeError);
            }
        }
    };

    // Función para verificar si una reserva puede ser editada/eliminada
    const puedeEditarEliminar = (estadoActual) => {
        return estadoActual !== 'FINALIZADA';
    };

    // DEBUG: Mostrar información en consola
    useEffect(() => {
        console.log('Estado actual - Loading:', loading, 'Reservas:', reservas.length, 'Error:', error);
    }, [loading, reservas, error]);

    if (mostrarFormulario) {
        return (
            <FormularioReserva
                onReservaCreada={handleReservaCreada}
                onCancelar={() => {
                    setMostrarFormulario(false);
                    setReservaEditando(null);
                }}
                reservaEditando={reservaEditando}
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
                    <div className="vista-selector">
                        <select 
                            value={tipoVista} 
                            onChange={(e) => setTipoVista(e.target.value)}
                            className="selector-vista"
                        >
                            <option value="diario">📅 Diario</option>
                            <option value="semanal">📊 Semanal</option>
                            <option value="mensual">🗓️ Mensual</option>
                        </select>
                    </div>
                    <div className="controles-periodo">
                        <button onClick={() => cambiarPeriodo(-1)} className="btn-periodo">←</button>
                        <span className="periodo-actual">
                            {obtenerTextoPerido()}
                        </span>
                        <button onClick={() => cambiarPeriodo(1)} className="btn-periodo">→</button>
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
                <p>Mostrando {Array.isArray(reservas) ? reservas.length : 0} reservas para este {tipoVista === 'mensual' ? 'mes' : tipoVista === 'semanal' ? 'semana' : 'día'}</p>
            </div>

            <div className="reservas-lista">
                <h3>Reservas {tipoVista === 'mensual' ? 'del Mes' : tipoVista === 'semanal' ? 'de la Semana' : 'del Día'}</h3>

                {!Array.isArray(reservas) || reservas.length === 0 ? (
                    <div className="sin-reservas">
                        <p>No hay reservas para este {tipoVista === 'mensual' ? 'mes' : tipoVista === 'semanal' ? 'semana' : 'día'}</p>
                        <button
                            onClick={() => setMostrarFormulario(true)}
                            className="btn-crear-primera"
                        >
                            Crear primera reserva
                        </button>
                    </div>
                ) : (
                    <div className="reservas-grid">
                        {(Array.isArray(reservas) ? reservas : []).map(reserva => (
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

                                    <p>📅 <strong>Fecha:</strong> {new Date(reserva.fecha_reserva + 'T00:00:00').toLocaleDateString('es-ES')}</p>
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
                                    <button 
                                        className="btn btn-primary btn-sm btn-action"
                                        onClick={() => handleEditarReserva(reserva)}
                                        title={puedeEditarEliminar(reserva.estado_actual) ? "Editar reserva" : "No se puede editar reserva finalizada"}
                                        disabled={!puedeEditarEliminar(reserva.estado_actual)}
                                    >
                                        ✏️ Editar
                                    </button>
                                    <button 
                                        className="btn btn-danger btn-sm btn-action"
                                        onClick={() => handleEliminarReserva(reserva.id, reserva.estado_actual)}
                                        title={puedeEditarEliminar(reserva.estado_actual) ? "Eliminar reserva" : "No se puede eliminar reserva finalizada"}
                                        disabled={!puedeEditarEliminar(reserva.estado_actual)}
                                    >
                                        🗑️ Eliminar
                                    </button>
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