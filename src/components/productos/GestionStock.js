import React, { useState, useEffect } from 'react';
import { productosService } from '../../services/productosService';
import './GestionStock.css';

const GestionStock = () => {
    const [productos, setProductos] = useState([]);
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidadASumar, setCantidadASumar] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingStock, setLoadingStock] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        cargarProductosActivos();
    }, []);

    useEffect(() => {
        if (terminoBusqueda.trim().length >= 2) {
            buscarProductos();
        } else if (terminoBusqueda.trim().length === 0) {
            cargarProductosActivos();
        }
    }, [terminoBusqueda]);

    const cargarProductosActivos = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await productosService.obtenerProductos();
            // Filtrar solo productos activos
            const productosActivos = Array.isArray(data) ? data.filter(p => p.activo) : [];
            setProductos(productosActivos);
        } catch (err) {
            console.error('Error cargando productos:', err);
            setError(err.message);
            setProductos([]);
        } finally {
            setLoading(false);
        }
    };

    const buscarProductos = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await productosService.buscarProductos(terminoBusqueda);
            setProductos(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error buscando productos:', err);
            setError(err.message);
            setProductos([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSeleccionarProducto = (producto) => {
        setProductoSeleccionado(producto);
        setCantidadASumar('');
        setError('');
        setSuccess('');
    };

    const handleActualizarStock = async (e) => {
        e.preventDefault();
        
        if (!productoSeleccionado) {
            setError('Selecciona un producto primero');
            return;
        }

        const cantidad = parseInt(cantidadASumar);
        if (!cantidad || cantidad <= 0) {
            setError('La cantidad debe ser un número mayor a 0');
            return;
        }

        try {
            setLoadingStock(true);
            setError('');
            setSuccess('');

            await productosService.actualizarStock(productoSeleccionado.id, cantidad);
            
            // Actualizar el producto en la lista local
            setProductos(prev => prev.map(p => 
                p.id === productoSeleccionado.id 
                    ? { ...p, stock: p.stock + cantidad }
                    : p
            ));

            // Actualizar producto seleccionado
            setProductoSeleccionado(prev => ({
                ...prev,
                stock: prev.stock + cantidad
            }));

            setSuccess(`Stock actualizado exitosamente. Nuevo stock: ${productoSeleccionado.stock + cantidad}`);
            setCantidadASumar('');

        } catch (err) {
            console.error('Error actualizando stock:', err);
            setError(err.message);
        } finally {
            setLoadingStock(false);
        }
    };

    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(precio);
    };

    return (
        <div className="gestion-stock">
            <div className="stock-header">
                <h2>Gestión de Stock</h2>
                <p className="stock-disclaimer">
                    ⚠️ <strong>Importante:</strong> La cantidad ingresada se <u>sumará</u> al stock actual del producto.
                </p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="stock-content">
                <div className="busqueda-section">
                    <h3>Buscar Producto</h3>
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Buscar producto por nombre..."
                            value={terminoBusqueda}
                            onChange={(e) => setTerminoBusqueda(e.target.value)}
                            className="search-input"
                        />
                        {loading && <div className="search-loading">Buscando...</div>}
                    </div>

                    <div className="productos-lista">
                        {productos.length > 0 ? (
                            productos.map(producto => (
                                <div 
                                    key={producto.id}
                                    className={`producto-card ${productoSeleccionado?.id === producto.id ? 'selected' : ''}`}
                                    onClick={() => handleSeleccionarProducto(producto)}
                                >
                                    <div className="producto-info">
                                        <h4>{producto.nombre}</h4>
                                        {producto.descripcion && (
                                            <p className="descripcion">{producto.descripcion}</p>
                                        )}
                                        <div className="producto-details">
                                            <span className={`categoria categoria-${producto.categoria.toLowerCase()}`}>
                                                {producto.categoria}
                                            </span>
                                            <span className="precio">{formatearPrecio(producto.precio)}</span>
                                        </div>
                                    </div>
                                    <div className="producto-stock">
                                        <div className="stock-actual">
                                            <span className="stock-label">Stock:</span>
                                            <span className={`stock-value ${producto.stock <= producto.stock_minimo ? 'stock-bajo' : ''}`}>
                                                {producto.stock}
                                            </span>
                                        </div>
                                        {producto.stock <= producto.stock_minimo && (
                                            <span className="stock-warning">⚠️ Stock bajo</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-productos">
                                {terminoBusqueda ? 'No se encontraron productos' : 'No hay productos disponibles'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="actualizacion-section">
                    <h3>Actualizar Stock</h3>
                    
                    {productoSeleccionado ? (
                        <div className="producto-seleccionado">
                            <h4>Producto Seleccionado:</h4>
                            <div className="selected-product-info">
                                <p><strong>{productoSeleccionado.nombre}</strong></p>
                                <p>Stock actual: <span className="current-stock">{productoSeleccionado.stock}</span></p>
                                <p>Stock mínimo: {productoSeleccionado.stock_minimo}</p>
                            </div>

                            <form onSubmit={handleActualizarStock} className="stock-form">
                                <div className="form-group">
                                    <label htmlFor="cantidad">Cantidad a agregar:</label>
                                    <input
                                        type="number"
                                        id="cantidad"
                                        value={cantidadASumar}
                                        onChange={(e) => setCantidadASumar(e.target.value)}
                                        placeholder="Ingrese cantidad"
                                        min="1"
                                        required
                                        disabled={loadingStock}
                                    />
                                </div>

                                {cantidadASumar && (
                                    <div className="stock-preview">
                                        <p>
                                            Stock resultante: {' '}
                                            <strong>{productoSeleccionado.stock + parseInt(cantidadASumar || 0)}</strong>
                                        </p>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={loadingStock || !cantidadASumar}
                                >
                                    {loadingStock ? 'Actualizando...' : 'Actualizar Stock'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="no-selection">
                            <p>Selecciona un producto de la lista para actualizar su stock</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GestionStock;