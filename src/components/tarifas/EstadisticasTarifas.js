import React, { useState, useEffect } from 'react';
import { tarifasService } from '../../services/tarifasService';
import './EstadisticasTarifas.css';

const EstadisticasTarifas = () => {
    const [estadisticas, setEstadisticas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

    useEffect(() => {
        cargarEstadisticas();
        
        // Auto-actualizar cada 5 minutos
        const interval = setInterval(cargarEstadisticas, 5 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, []);

    const cargarEstadisticas = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await tarifasService.obtenerEstadisticas();
            setEstadisticas(data);
            setUltimaActualizacion(new Date());
        } catch (err) {
            console.error('Error cargando estadísticas:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatearPrecio = (precio) => {
        if (!precio || precio === 0) return '$0';
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(precio);
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="estadisticas-tarifas loading">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Cargando estadísticas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="estadisticas-tarifas error">
                <div className="error-container">
                    <div className="error-message">
                        <h3>❌ Error</h3>
                        <p>{error}</p>
                        <button onClick={cargarEstadisticas} className="btn btn-primary">
                            🔄 Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!estadisticas) {
        return (
            <div className="estadisticas-tarifas">
                <div className="sin-datos">
                    <h3>📊 No hay datos disponibles</h3>
                    <p>No se encontraron estadísticas para mostrar</p>
                </div>
            </div>
        );
    }

    const { resumen, estadisticasPorTipo, distribucionDuraciones, tendenciasMensuales } = estadisticas;

    return (
        <div className="estadisticas-tarifas">
            <div className="estadisticas-header">
                <h3>📊 Estadísticas de Tarifas y Reservas</h3>
                <div className="header-actions">
                    <span className="ultima-actualizacion">
                        📅 Actualizado: {ultimaActualizacion ? ultimaActualizacion.toLocaleTimeString('es-ES') : '-'}
                    </span>
                    <button onClick={cargarEstadisticas} className="btn btn-secondary btn-sm">
                        🔄 Actualizar
                    </button>
                </div>
            </div>

            {/* Resumen General */}
            <div className="resumen-general">
                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <h4>{resumen?.total_reservas || 0}</h4>
                        <p>Reservas (90 días)</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <h4>{resumen?.clientes_activos || 0}</h4>
                        <p>Clientes Activos</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h4>{formatearPrecio(resumen?.facturacion_total || 0)}</h4>
                        <p>Facturación Total</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-content">
                        <h4>{formatearPrecio(resumen?.ticket_promedio || 0)}</h4>
                        <p>Ticket Promedio</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-content">
                        <h4>{parseFloat(resumen?.duracion_promedio || 0).toFixed(1)}h</h4>
                        <p>Duración Promedio</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">⚙️</div>
                    <div className="stat-content">
                        <h4>{(resumen?.tarifas_activas || 0)}/{((resumen?.tarifas_activas || 0) + (resumen?.tarifas_inactivas || 0))}</h4>
                        <p>Tarifas Activas</p>
                    </div>
                </div>
            </div>

            {/* Estadísticas por Tipo de Agrupación */}
            <div className="seccion-estadisticas">
                <h4>📊 Rendimiento por Tipo de Agrupación</h4>
                <div className="comparacion-tipos">
                    {estadisticasPorTipo && estadisticasPorTipo.length > 0 ? (
                        estadisticasPorTipo.map((tipo, index) => (
                            <div key={index} className="tipo-card">
                                <div className="tipo-header">
                                    <span className={`tipo-badge ${tipo.tipo_agrupacion?.toLowerCase()}`}>
                                        {tipo.tipo_agrupacion === 'Standard' ? '👥' : '🎸'} {tipo.tipo_agrupacion}
                                    </span>
                                </div>
                                <div className="tipo-metricas">
                                    <div className="metrica">
                                        <span className="metrica-valor">{tipo.total_reservas}</span>
                                        <span className="metrica-label">Reservas</span>
                                    </div>
                                    <div className="metrica">
                                        <span className="metrica-valor">{formatearPrecio(tipo.facturacion_total)}</span>
                                        <span className="metrica-label">Facturación</span>
                                    </div>
                                    <div className="metrica">
                                        <span className="metrica-valor">{formatearPrecio(tipo.precio_promedio)}</span>
                                        <span className="metrica-label">Precio Prom.</span>
                                    </div>
                                    <div className="metrica">
                                        <span className="metrica-valor">{parseFloat(tipo.duracion_promedio).toFixed(1)}h</span>
                                        <span className="metrica-label">Duración Prom.</span>
                                    </div>
                                    <div className="metrica">
                                        <span className="metrica-valor">{tipo.clientes_unicos}</span>
                                        <span className="metrica-label">Clientes Únicos</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="sin-datos">No hay datos de tipos de agrupación disponibles</p>
                    )}
                </div>
            </div>

            {/* Distribución por Duraciones */}
            <div className="seccion-estadisticas">
                <h4>⏱️ Distribución por Duraciones</h4>
                <div className="duraciones-grid">
                    {distribucionDuraciones && distribucionDuraciones.length > 0 ? (
                        distribucionDuraciones.map((dur, index) => (
                            <div key={index} className="duracion-card">
                                <div className="duracion-header">
                                    <span className="duracion-tiempo">{dur.horas_reservadas}h</span>
                                    <span className={`tipo-badge-small ${dur.tipo_agrupacion?.toLowerCase()}`}>
                                        {dur.tipo_agrupacion}
                                    </span>
                                </div>
                                <div className="duracion-metricas">
                                    <div className="metrica-row">
                                        <span className="metrica-label">Reservas:</span>
                                        <span className="metrica-valor">{dur.cantidad}</span>
                                    </div>
                                    <div className="metrica-row">
                                        <span className="metrica-label">Facturación:</span>
                                        <span className="metrica-valor">{formatearPrecio(dur.facturacion)}</span>
                                    </div>
                                    <div className="metrica-row">
                                        <span className="metrica-label">Precio Prom.:</span>
                                        <span className="metrica-valor">{formatearPrecio(dur.precio_promedio)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="sin-datos">No hay datos de duraciones disponibles</p>
                    )}
                </div>
            </div>

            {/* Tendencias Mensuales */}
            <div className="seccion-estadisticas">
                <h4>📈 Tendencias Mensuales (Últimos 12 meses)</h4>
                <div className="tendencias-container">
                    {tendenciasMensuales && tendenciasMensuales.length > 0 ? (
                        <div className="tendencias-tabla">
                            <div className="tabla-header">
                                <div>Período</div>
                                <div>Tipo</div>
                                <div>Reservas</div>
                                <div>Facturación</div>
                                <div>Duración Prom.</div>
                            </div>
                            {tendenciasMensuales.slice(0, 12).map((tendencia, index) => (
                                <div key={index} className="tabla-row">
                                    <div>{tendencia.periodo}</div>
                                    <div>
                                        <span className={`tipo-badge-small ${tendencia.tipo_agrupacion?.toLowerCase()}`}>
                                            {tendencia.tipo_agrupacion}
                                        </span>
                                    </div>
                                    <div>{tendencia.total_reservas}</div>
                                    <div>{formatearPrecio(tendencia.facturacion)}</div>
                                    <div>{parseFloat(tendencia.duracion_promedio).toFixed(1)}h</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="sin-datos">No hay datos de tendencias disponibles</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EstadisticasTarifas;