import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ventasService } from '../../services/ventasService';
import { clientesService } from '../../services/clientesService';
import { productosService } from '../../services/productosService';
import './FormularioVenta.css';

const FormularioVenta = ({ onVentaCreada, onCancelar }) => {
    const { user, isAdmin } = useAuth();
    
    // Estados para el formulario
    const [formData, setFormData] = useState({
        cliente_id: '',
        usuario_id: user?.id || '',
        tipo_pago: 'efectivo',
        monto_efectivo: null,
        monto_transferencia: null,
        notas: '',
        items: []
    });

    // Estados para los datos
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Estados para manejo de productos
    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

    // Estados para validación y configuración
    const [permitirNegativo, setPermitirNegativo] = useState(false);
    const [verificacionStock, setVerificacionStock] = useState(null);
    const [mostrarModalStock, setMostrarModalStock] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        cargarDatos();
    }, []);

    // Filtrar productos en tiempo real
    useEffect(() => {
        if (busquedaProducto.trim()) {
            const filtrados = productos.filter(producto =>
                producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
                (producto.descripcion && producto.descripcion.toLowerCase().includes(busquedaProducto.toLowerCase()))
            );
            setProductosFiltrados(filtrados);
            setMostrarSugerencias(true);
        } else {
            setProductosFiltrados([]);
            setMostrarSugerencias(false);
        }
    }, [busquedaProducto, productos]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [clientesData, productosData] = await Promise.all([
                clientesService.obtenerClientes(),
                productosService.obtenerProductos()
            ]);

            setClientes(Array.isArray(clientesData) ? clientesData : []);
            setProductos(Array.isArray(productosData) ? productosData.filter(p => p.activo) : []);
        } catch (err) {
            console.error('Error cargando datos:', err);
            setError('Error cargando datos: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Si cambia el tipo de pago, resetear los montos
        if (name === 'tipo_pago') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                monto_efectivo: value === 'mixto' ? 0 : null,
                monto_transferencia: value === 'mixto' ? 0 : null
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
        
        setError('');
    };

    const handleMontoChange = (campo, valor) => {
        const monto = parseFloat(valor) || 0;
        setFormData(prev => ({
            ...prev,
            [campo]: monto
        }));
        setError('');
    };

    const agregarProducto = (producto) => {
        const itemExistente = formData.items.find(item => item.producto_id === producto.id);
        
        if (itemExistente) {
            // Si ya existe, incrementar cantidad
            setFormData(prev => ({
                ...prev,
                items: prev.items.map(item =>
                    item.producto_id === producto.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                )
            }));
        } else {
            // Agregar nuevo item
            const nuevoItem = {
                producto_id: producto.id,
                producto_nombre: producto.nombre,
                producto_descripcion: producto.descripcion,
                precio_unitario: producto.precio,
                cantidad: 1,
                stock_disponible: producto.stock
            };
            
            setFormData(prev => ({
                ...prev,
                items: [...prev.items, nuevoItem]
            }));
        }
        
        setBusquedaProducto('');
        setMostrarSugerencias(false);
    };

    const actualizarCantidadItem = (index, nuevaCantidad) => {
        // Permitir cadena vacía para que el usuario pueda borrar y escribir
        if (nuevaCantidad === '' || nuevaCantidad === '0') {
            setFormData(prev => ({
                ...prev,
                items: prev.items.map((item, i) =>
                    i === index ? { ...item, cantidad: nuevaCantidad === '' ? '' : parseInt(nuevaCantidad) } : item
                )
            }));
            return;
        }

        const cantidad = parseInt(nuevaCantidad);
        
        // Solo eliminar si es explícitamente negativo (no cuando está vacío)
        if (cantidad < 0) {
            eliminarItem(index);
            return;
        }

        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, cantidad: cantidad || 1 } : item
            )
        }));
    };

    const actualizarPrecioItem = (index, nuevoPrecio) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, precio_unitario: parseFloat(nuevoPrecio) || 0 } : item
            )
        }));
    };

    const eliminarItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const calcularTotal = () => {
        return formData.items.reduce((total, item) => {
            const cantidad = parseFloat(item.cantidad) || 0;
            const precio = parseFloat(item.precio_unitario) || 0;
            return total + (cantidad * precio);
        }, 0);
    };

    const validarPago = () => {
        const total = calcularTotal();
        
        if (formData.tipo_pago === 'mixto') {
            const efectivo = parseFloat(formData.monto_efectivo) || 0;
            const transferencia = parseFloat(formData.monto_transferencia) || 0;
            
            if (efectivo <= 0 || transferencia <= 0) {
                return 'Los montos de pago mixto deben ser mayores a cero';
            }
            
            const suma = efectivo + transferencia;
            if (Math.abs(suma - total) > 0.01) {
                return 'La suma de efectivo y transferencia debe ser igual al total';
            }
            
            if (suma > total) {
                return 'La suma de los montos no puede superar el total a cobrar';
            }
        }
        
        return null;
    };

    const verificarStock = async () => {
        if (formData.items.length === 0) {
            setError('Debe agregar al menos un producto');
            return false;
        }

        try {
            const itemsParaVerificar = formData.items.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad
            }));

            const resultado = await ventasService.verificarStock(itemsParaVerificar);
            setVerificacionStock(resultado);

            if (resultado.tiene_problemas && !permitirNegativo) {
                setMostrarModalStock(true);
                return false;
            }

            return true;
        } catch (err) {
            setError('Error verificando stock: ' + err.message);
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.items.length === 0) {
            setError('Debe agregar al menos un producto');
            return;
        }

        if (!formData.cliente_id || !formData.tipo_pago) {
            setError('Por favor complete todos los campos requeridos');
            return;
        }

        // Validar pago
        const errorPago = validarPago();
        if (errorPago) {
            setError(errorPago);
            return;
        }

        // Verificar stock si no se permite negativo
        if (!permitirNegativo) {
            const stockOk = await verificarStock();
            if (!stockOk) return;
        }

        try {
            setLoading(true);
            setError('');

            // Validar que todos los items tengan cantidad válida
            const itemsValidados = formData.items.map(item => {
                const cantidad = parseInt(item.cantidad) || 1;
                const precio = parseFloat(item.precio_unitario) || 0;
                
                return {
                    producto_id: item.producto_id,
                    cantidad: cantidad,
                    precio_unitario: precio
                };
            });

            const ventaData = {
                ...formData,
                total: calcularTotal(),
                permitir_negativo: permitirNegativo,
                items: itemsValidados
            };

            // Debug: Mostrar datos que se van a enviar
            console.log('🚀 Enviando datos de venta:', ventaData);

            const response = await ventasService.crearVenta(ventaData);
            
            if (response.success) {
                setSuccess('Venta creada exitosamente');
                if (onVentaCreada) {
                    onVentaCreada(response);
                }
            }
        } catch (err) {
            console.error('Error creando venta:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const continuarConProblemasStock = () => {
        setMostrarModalStock(false);
        setPermitirNegativo(true);
        // El formulario se enviará automáticamente después de esto
        setTimeout(() => {
            handleSubmit({ preventDefault: () => {} });
        }, 100);
    };

    const formatearMoneda = (cantidad) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(cantidad);
    };

    if (loading && !productos.length) {
        return <div className="loading">Cargando formulario...</div>;
    }

    return (
        <div className="formulario-venta">
            <div className="header">
                <h2>Nueva Venta</h2>
                {isAdmin && (
                    <div className="config-section">
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={permitirNegativo}
                                onChange={(e) => setPermitirNegativo(e.target.checked)}
                            />
                            <span className="slider"></span>
                            <span className="label">Permitir productos negativos</span>
                        </label>
                    </div>
                )}
            </div>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <form onSubmit={handleSubmit} className="venta-form">
                {/* Información general */}
                <div className="form-section">
                    <h3>Información General</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="cliente_id">Cliente *</label>
                            <select
                                id="cliente_id"
                                name="cliente_id"
                                value={formData.cliente_id}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Seleccionar cliente</option>
                                {clientes.map(cliente => (
                                    <option key={cliente.id} value={cliente.id}>
                                        {cliente.nombre_banda} - {cliente.contacto_nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="tipo_pago">Tipo de Pago *</label>
                            <select
                                id="tipo_pago"
                                name="tipo_pago"
                                value={formData.tipo_pago}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="mixto">Mixto</option>
                            </select>
                        </div>

                        {/* Campos para pago mixto */}
                        {formData.tipo_pago === 'mixto' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="monto_efectivo">Monto Efectivo *</label>
                                    <input
                                        type="number"
                                        id="monto_efectivo"
                                        name="monto_efectivo"
                                        value={formData.monto_efectivo || ''}
                                        onChange={(e) => handleMontoChange('monto_efectivo', e.target.value)}
                                        min="0"
                                        step="0.01"
                                        max={calcularTotal()}
                                        required
                                        placeholder="0.00"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="monto_transferencia">Monto Transferencia *</label>
                                    <input
                                        type="number"
                                        id="monto_transferencia"
                                        name="monto_transferencia"
                                        value={formData.monto_transferencia || ''}
                                        onChange={(e) => handleMontoChange('monto_transferencia', e.target.value)}
                                        min="0"
                                        step="0.01"
                                        max={calcularTotal()}
                                        required
                                        placeholder="0.00"
                                    />
                                </div>
                                
                                <div className="pago-mixto-resumen">
                                    <div className="resumen-row">
                                        <span>Total a cobrar:</span>
                                        <span className="total-amount">{formatearMoneda(calcularTotal())}</span>
                                    </div>
                                    <div className="resumen-row">
                                        <span>Efectivo:</span>
                                        <span>{formatearMoneda(parseFloat(formData.monto_efectivo) || 0)}</span>
                                    </div>
                                    <div className="resumen-row">
                                        <span>Transferencia:</span>
                                        <span>{formatearMoneda(parseFloat(formData.monto_transferencia) || 0)}</span>
                                    </div>
                                    <hr />
                                    <div className="resumen-row total-row">
                                        <span>Total ingresado:</span>
                                        <span className={
                                            Math.abs((parseFloat(formData.monto_efectivo) || 0) + (parseFloat(formData.monto_transferencia) || 0) - calcularTotal()) <= 0.01 
                                                ? 'total-correcto' 
                                                : 'total-incorrecto'
                                        }>
                                            {formatearMoneda((parseFloat(formData.monto_efectivo) || 0) + (parseFloat(formData.monto_transferencia) || 0))}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="notas">Notas</label>
                        <textarea
                            id="notas"
                            name="notas"
                            value={formData.notas}
                            onChange={handleInputChange}
                            rows="3"
                            placeholder="Notas adicionales..."
                        />
                    </div>
                </div>

                {/* Productos */}
                <div className="form-section">
                    <h3>Productos</h3>
                    
                    {/* Búsqueda de productos */}
                    <div className="producto-search">
                        <div className="search-input-container">
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={busquedaProducto}
                                onChange={(e) => setBusquedaProducto(e.target.value)}
                                className="search-input"
                            />
                            
                            {mostrarSugerencias && productosFiltrados.length > 0 && (
                                <div className="sugerencias">
                                    {productosFiltrados.slice(0, 10).map(producto => (
                                        <div
                                            key={producto.id}
                                            className="sugerencia"
                                            onClick={() => agregarProducto(producto)}
                                        >
                                            <div className="producto-info">
                                                <strong>{producto.nombre}</strong>
                                                <span className="precio">{formatearMoneda(producto.precio)}</span>
                                                <span className="stock">Stock: {producto.stock}</span>
                                            </div>
                                            {producto.descripcion && (
                                                <div className="descripcion">{producto.descripcion}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lista de productos seleccionados */}
                    {formData.items.length > 0 && (
                        <div className="items-section">
                            <h4>Productos Seleccionados</h4>
                            <div className="items-table">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unit.</th>
                                            <th>Stock</th>
                                            <th>Subtotal</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.map((item, index) => (
                                            <tr key={index} className={item.cantidad > item.stock_disponible ? 'stock-insuficiente' : ''}>
                                                <td>
                                                    <div>
                                                        <strong>{item.producto_nombre}</strong>
                                                        {item.producto_descripcion && (
                                                            <div className="descripcion">{item.producto_descripcion}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.cantidad}
                                                        onChange={(e) => actualizarCantidadItem(index, e.target.value)}
                                                        className="cantidad-input"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={item.precio_unitario}
                                                        onChange={(e) => actualizarPrecioItem(index, e.target.value)}
                                                        className="precio-input"
                                                    />
                                                </td>
                                                <td>
                                                    <span className={item.cantidad > item.stock_disponible ? 'stock-warning' : ''}>
                                                        {item.stock_disponible}
                                                        {item.cantidad > item.stock_disponible && (
                                                            <span className="warning-icon" title="Cantidad supera stock disponible">
                                                                ⚠️
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="subtotal">
                                                    {formatearMoneda(item.cantidad * item.precio_unitario)}
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => eliminarItem(index)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="total-row">
                                            <td colSpan="4"><strong>Total:</strong></td>
                                            <td className="total">{formatearMoneda(calcularTotal())}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Botones */}
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onCancelar}>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || formData.items.length === 0}
                    >
                        {loading ? 'Procesando...' : 'Crear Venta'}
                    </button>
                </div>
            </form>

            {/* Modal de confirmación de stock */}
            {mostrarModalStock && verificacionStock && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>⚠️ Problemas de Stock Detectados</h3>
                        </div>
                        
                        <div className="modal-body">
                            <p>Se han detectado los siguientes problemas de stock:</p>
                            
                            <div className="problemas-stock">
                                {verificacionStock.verificaciones
                                    .filter(v => !v.disponible)
                                    .map((item, index) => {
                                        const producto = productos.find(p => p.id === item.producto_id);
                                        return (
                                            <div key={index} className="problema-item">
                                                <strong>{producto?.nombre}</strong>
                                                <div>Stock actual: {item.stock_actual}</div>
                                                <div>Cantidad requerida: {item.cantidad_requerida}</div>
                                                <div className="stock-resultante">
                                                    Stock resultante: <span className="negativo">{item.stock_resultante}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                            
                            <p>¿Desea continuar con la venta permitiendo stock negativo?</p>
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => setMostrarModalStock(false)}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn btn-warning"
                                onClick={continuarConProblemasStock}
                            >
                                Continuar con Stock Negativo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormularioVenta;