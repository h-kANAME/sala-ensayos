import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productosService } from '../../services/productosService';
import './FormularioProducto.css';

const FormularioProducto = ({ productoId }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        categoria: 'Consumible',
        precio: '',
        stock: '0',
        stock_minimo: '0',
        activo: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const esEdicion = !!productoId;

    useEffect(() => {
        if (esEdicion) {
            cargarProducto();
        }
    }, [productoId]);

    const cargarProducto = async () => {
        try {
            setLoading(true);
            setError('');
            const producto = await productosService.obtenerProductoPorId(productoId);
            
            setFormData({
                nombre: producto.nombre || '',
                descripcion: producto.descripcion || '',
                categoria: producto.categoria || 'Consumible',
                precio: producto.precio?.toString() || '',
                stock: producto.stock?.toString() || '0',
                stock_minimo: producto.stock_minimo?.toString() || '0',
                activo: producto.activo !== undefined ? producto.activo : true
            });
        } catch (err) {
            console.error('Error cargando producto:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validaciones
        if (!formData.nombre.trim()) {
            setError('El nombre del producto es requerido');
            return;
        }
        
        if (!formData.precio || parseFloat(formData.precio) < 0) {
            setError('El precio debe ser un número válido mayor o igual a 0');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const productoData = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim(),
                categoria: formData.categoria,
                precio: parseFloat(formData.precio),
                stock: parseInt(formData.stock) || 0,
                stock_minimo: parseInt(formData.stock_minimo) || 0,
                activo: formData.activo
            };

            if (esEdicion) {
                await productosService.actualizarProducto(productoId, productoData);
                setSuccess('Producto actualizado exitosamente');
            } else {
                await productosService.crearProducto(productoData);
                setSuccess('Producto creado exitosamente');
            }

            // Redirigir después de 2 segundos
            setTimeout(() => {
                navigate('/productos');
            }, 2000);

        } catch (err) {
            console.error('Error guardando producto:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && esEdicion && !formData.nombre) {
        return <div className="loading">Cargando producto...</div>;
    }

    return (
        <div className="formulario-producto">
            <div className="form-header">
                <h2>{esEdicion ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => navigate('/productos')}
                >
                    ← Volver a Productos
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                    <label htmlFor="nombre">Nombre del Producto *</label>
                    <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ingrese el nombre del producto"
                        required
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="descripcion">Descripción</label>
                    <textarea
                        id="descripcion"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        placeholder="Descripción del producto (opcional)"
                        rows="3"
                        disabled={loading}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="categoria">Categoría *</label>
                        <select
                            id="categoria"
                            name="categoria"
                            value={formData.categoria}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        >
                            <option value="Consumible">Consumible</option>
                            <option value="Equipo">Equipo</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="precio">Precio *</label>
                        <input
                            type="number"
                            id="precio"
                            name="precio"
                            value={formData.precio}
                            onChange={handleChange}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="stock">Stock Inicial</label>
                        <input
                            type="number"
                            id="stock"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="stock_minimo">Stock Mínimo</label>
                        <input
                            type="number"
                            id="stock_minimo"
                            name="stock_minimo"
                            value={formData.stock_minimo}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="activo"
                            checked={formData.activo}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        <span className="checkbox-text">Producto activo</span>
                    </label>
                    <small className="form-help">
                        Los productos inactivos no aparecerán en las listas de selección
                    </small>
                </div>

                <div className="form-actions">
                    <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => navigate('/productos')}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : (esEdicion ? 'Actualizar Producto' : 'Crear Producto')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FormularioProducto;