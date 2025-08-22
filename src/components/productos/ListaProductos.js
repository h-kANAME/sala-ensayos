import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productosService } from '../../services/productosService';
import './ListaProductos.css';

const ListaProductos = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await productosService.obtenerProductos();
            setProductos(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error cargando productos:', err);
            setError(err.message);
            setProductos([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este producto?')) {
            try {
                console.log('🗑️ Eliminando producto ID:', id);
                const response = await productosService.eliminarProducto(id);
                console.log('✅ Producto eliminado:', response);
                cargarProductos(); // Recargar lista
            } catch (err) {
                console.error('❌ Error eliminando producto:', err);
                setError(err.message);
            }
        }
    };

    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(precio);
    };

    if (loading) return <div className="loading">Cargando productos...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="lista-productos">
            <div className="header">
                <h2>Gestión de Productos</h2>
                <button className="btn btn-primary" onClick={() => navigate('/productos/nuevo')}>
                    + Nuevo Producto
                </button>
            </div>

            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Stock Mín.</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos && productos.length > 0 ? (
                            productos.map(producto => (
                                <tr key={producto.id} className={!producto.activo ? 'producto-inactivo' : ''}>
                                    <td>{producto.id}</td>
                                    <td>
                                        <div className="producto-nombre">
                                            <strong>{producto.nombre}</strong>
                                            {producto.descripcion && (
                                                <small className="descripcion">{producto.descripcion}</small>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`categoria-badge categoria-${producto.categoria.toLowerCase()}`}>
                                            {producto.categoria}
                                        </span>
                                    </td>
                                    <td className="precio">{formatearPrecio(producto.precio)}</td>
                                    <td>
                                        <span className={`stock ${producto.stock <= producto.stock_minimo ? 'stock-bajo' : ''}`}>
                                            {producto.stock}
                                        </span>
                                    </td>
                                    <td>{producto.stock_minimo}</td>
                                    <td>
                                        <span className={`estado-badge ${producto.activo ? 'activo' : 'inactivo'}`}>
                                            {producto.activo ? '✅ Activo' : '❌ Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-warning btn-sm"
                                            onClick={() => navigate(`/productos/editar/${producto.id}`)}
                                        >
                                            Editar
                                        </button>
                                        {isAdmin && (
                                            <button 
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleEliminar(producto.id)}
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                    {error ? 'Error cargando productos' : 'No hay productos registrados'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListaProductos;