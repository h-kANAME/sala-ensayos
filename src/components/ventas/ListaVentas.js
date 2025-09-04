import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ventasService } from '../../services/ventasService';
import FiltrosFechas from './FiltrosFechas';
import Paginador from './Paginador';
import './ListaVentas.css';

const ListaVentas = () => {
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [detalleVenta, setDetalleVenta] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    
    // Estados para paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalRegistros, setTotalRegistros] = useState(0);
    const registrosPorPagina = 10;
    
    // Estados para filtros
    const [filtrosActivos, setFiltrosActivos] = useState({});

    // Cargar ventas con filtros y paginación al inicializar
    useEffect(() => {
        const hoy = new Date().toISOString().split('T')[0];
        const filtrosIniciales = {
            fecha_inicio: hoy,
            fecha_fin: hoy
        };
        setFiltrosActivos(filtrosIniciales);
        cargarVentasConFiltros(filtrosIniciales, 1);
    }, []);

    const cargarVentasConFiltros = async (filtros = {}, pagina = 1) => {
        try {
            setLoading(true);
            setError('');
            
            const params = {
                ...filtros,
                pagina: pagina,
                limite: registrosPorPagina
            };
            
            const data = await ventasService.obtenerVentasConFiltros(params);
            
            setVentas(Array.isArray(data.ventas) ? data.ventas : []);
            setTotalRegistros(data.total || 0);
            setTotalPaginas(Math.ceil((data.total || 0) / registrosPorPagina));
            setPaginaActual(pagina);
            
        } catch (err) {
            console.error('Error cargando ventas:', err);
            setError(err.message);
            setVentas([]);
            setTotalRegistros(0);
            setTotalPaginas(0);
        } finally {
            setLoading(false);
        }
    };

    const handleAnular = async (id) => {
        if (window.confirm('¿Estás seguro de anular esta venta? Esta acción no se puede deshacer.')) {
            try {
                console.log('❌ Anulando venta ID:', id);
                const response = await ventasService.anularVenta(id);
                console.log('✅ Venta anulada:', response);
                cargarVentasConFiltros(filtrosActivos, paginaActual); // Recargar lista
            } catch (err) {
                console.error('❌ Error anulando venta:', err);
                setError(err.message);
            }
        }
    };

    const handleFiltrosChange = (nuevosFiltros) => {
        setFiltrosActivos(nuevosFiltros);
        cargarVentasConFiltros(nuevosFiltros, 1); // Resetear a página 1 al filtrar
    };

    const handleCambioPagina = (nuevaPagina) => {
        cargarVentasConFiltros(filtrosActivos, nuevaPagina);
    };

    const handleVerDetalle = async (venta) => {
        try {
            setVentaSeleccionada(venta);
            const items = await ventasService.obtenerItemsVenta(venta.id);
            setDetalleVenta({
                ...venta,
                items: Array.isArray(items) ? items : []
            });
            setMostrarModal(true);
        } catch (err) {
            console.error('Error obteniendo detalle de venta:', err);
            setError('Error obteniendo detalle de venta: ' + err.message);
        }
    };

    const cerrarModal = () => {
        setMostrarModal(false);
        setVentaSeleccionada(null);
        setDetalleVenta(null);
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatearMoneda = (cantidad) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(cantidad);
    };

    const formatearTipoPago = (venta) => {
        if (venta.tipo_pago === 'mixto') {
            const efectivo = formatearMoneda(venta.monto_efectivo || 0);
            const transferencia = formatearMoneda(venta.monto_transferencia || 0);
            return `Mixto (E: ${efectivo} - T: ${transferencia})`;
        }
        
        // Capitalizar primera letra
        return venta.tipo_pago.charAt(0).toUpperCase() + venta.tipo_pago.slice(1);
    };

    if (loading) return <div className="loading">Cargando ventas...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="lista-ventas">
            <div className="header">
                <h2>Gestión de Ventas</h2>
                <button className="btn btn-primary" onClick={() => navigate('/ventas/nueva')}>
                    + Nueva Venta
                </button>
            </div>

            {/* Filtros de Fechas */}
            <FiltrosFechas 
                onFiltrosChange={handleFiltrosChange}
                filtrosIniciales={filtrosActivos}
            />

            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Usuario</th>
                            <th>Total</th>
                            <th>Tipo Pago</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ventas && ventas.length > 0 ? (
                            ventas.map(venta => (
                                <tr key={venta.id} className={venta.anulada ? 'venta-anulada' : ''}>
                                    <td>{venta.id}</td>
                                    <td>{formatearFecha(venta.fecha_venta)}</td>
                                    <td>
                                        {venta.cliente_nombre && venta.cliente_apellido 
                                            ? `${venta.cliente_nombre} ${venta.cliente_apellido}`
                                            : 'Cliente no encontrado'
                                        }
                                    </td>
                                    <td>{venta.usuario_nombre || 'Usuario no encontrado'}</td>
                                    <td className="total">{formatearMoneda(venta.total)}</td>
                                    <td>
                                        <span className={`tipo-pago ${venta.tipo_pago}`} title={formatearTipoPago(venta)}>
                                            {formatearTipoPago(venta)}
                                        </span>
                                    </td>
                                    <td>
                                        {venta.anulada ? (
                                            <span className="estado anulada">Anulada</span>
                                        ) : (
                                            <span className="estado activa">Activa</span>
                                        )}
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-info btn-sm"
                                            onClick={() => handleVerDetalle(venta)}
                                        >
                                            Ver Detalle
                                        </button>
                                        {!venta.anulada && (
                                            <button 
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleAnular(venta.id)}
                                                title="Anular venta"
                                            >
                                                Anular
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                    {error ? 'Error cargando ventas' : 'No hay ventas registradas'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginador */}
            <Paginador
                paginaActual={paginaActual}
                totalPaginas={totalPaginas}
                totalRegistros={totalRegistros}
                registrosPorPagina={registrosPorPagina}
                onCambioPagina={handleCambioPagina}
            />

            {/* Modal de detalle de venta */}
            {mostrarModal && detalleVenta && (
                <div className="modal-overlay" onClick={cerrarModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Detalle de Venta #{detalleVenta.id}</h3>
                            <button className="btn-close" onClick={cerrarModal}>×</button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="venta-info">
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Fecha:</label>
                                        <span>{formatearFecha(detalleVenta.fecha_venta)}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Cliente:</label>
                                        <span>
                                            {detalleVenta.cliente_nombre && detalleVenta.cliente_apellido 
                                                ? `${detalleVenta.cliente_nombre} ${detalleVenta.cliente_apellido}`
                                                : 'Cliente no encontrado'
                                            }
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <label>Usuario:</label>
                                        <span>{detalleVenta.usuario_nombre || 'Usuario no encontrado'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Tipo de Pago:</label>
                                        <div className="pago-detalle">
                                            <span className={`tipo-pago ${detalleVenta.tipo_pago}`}>
                                                {formatearTipoPago(detalleVenta)}
                                            </span>
                                            {detalleVenta.tipo_pago === 'mixto' && (
                                                <div className="pago-mixto-detalle">
                                                    <small>
                                                        Efectivo: {formatearMoneda(detalleVenta.monto_efectivo || 0)}<br/>
                                                        Transferencia: {formatearMoneda(detalleVenta.monto_transferencia || 0)}
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <label>Estado:</label>
                                        <span className={`estado ${detalleVenta.anulada ? 'anulada' : 'activa'}`}>
                                            {detalleVenta.anulada ? 'Anulada' : 'Activa'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <label>Total:</label>
                                        <span className="total-detalle">{formatearMoneda(detalleVenta.total)}</span>
                                    </div>
                                </div>
                                
                                {detalleVenta.notas && (
                                    <div className="notas">
                                        <label>Notas:</label>
                                        <p>{detalleVenta.notas}</p>
                                    </div>
                                )}
                            </div>

                            <div className="items-section">
                                <h4>Productos Vendidos</h4>
                                <div className="items-table">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Cantidad</th>
                                                <th>Precio Unit.</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detalleVenta.items && detalleVenta.items.length > 0 ? (
                                                detalleVenta.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <div>
                                                                <strong>{item.producto_nombre}</strong>
                                                                {item.producto_descripcion && (
                                                                    <div className="descripcion">{item.producto_descripcion}</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>{item.cantidad}</td>
                                                        <td>{formatearMoneda(item.precio_unitario)}</td>
                                                        <td>{formatearMoneda(item.subtotal)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>
                                                        No hay items en esta venta
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={cerrarModal}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaVentas;