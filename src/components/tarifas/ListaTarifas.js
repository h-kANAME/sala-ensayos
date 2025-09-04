import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tarifasService } from '../../services/tarifasService';
import './ListaTarifas.css';

const ListaTarifas = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [tarifas, setTarifas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarTarifas();
    }, []);

    const cargarTarifas = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await tarifasService.obtenerTarifas();
            setTarifas(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error cargando tarifas:', err);
            setError(err.message);
            setTarifas([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta tarifa?')) {
            try {
                console.log('🗑️ Eliminando tarifa ID:', id);
                const response = await tarifasService.eliminarTarifa(id);
                console.log('✅ Tarifa eliminada:', response);
                cargarTarifas(); // Recargar lista
            } catch (err) {
                console.error('❌ Error eliminando tarifa:', err);
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

    if (loading) return <div className="loading">Cargando tarifas...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="lista-tarifas">
            <div className="header">
                <h2>Gestión de Tarifas</h2>
                <button className="btn btn-primary" onClick={() => navigate('/tarifas/nueva')}>
                    + Nueva Tarifa
                </button>
            </div>

            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tipo Agrupación</th>
                            <th>Duración Min</th>
                            <th>Duración Max</th>
                            <th>Precio Fijo</th>
                            <th>Precio por Hora</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tarifas && tarifas.length > 0 ? (
                            tarifas.map(tarifa => (
                                <tr key={tarifa.id_tarifa || tarifa.id} className={!tarifa.activo ? 'tarifa-inactiva' : ''}>
                                    <td>{tarifa.id_tarifa || tarifa.id}</td>
                                    <td>
                                        <span className={`badge ${tarifa.tipo_agrupacion === 'Extended' ? 'badge-extended' : 'badge-standard'}`}>
                                            {tarifa.tipo_agrupacion || 'Standard'}
                                        </span>
                                    </td>
                                    <td>{tarifa.duracion_min}h</td>
                                    <td>{tarifa.duracion_max ? tarifa.duracion_max + 'h' : '∞'}</td>
                                    <td>{tarifa.precio_fijo ? formatearPrecio(tarifa.precio_fijo) : '-'}</td>
                                    <td>{tarifa.precio_por_hora ? formatearPrecio(tarifa.precio_por_hora) : '-'}</td>
                                    <td>
                                        <span className={`estado-badge ${tarifa.activo ? 'activo' : 'inactivo'}`}>
                                            {tarifa.activo ? '✅ Activa' : '❌ Inactiva'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-warning btn-sm"
                                            onClick={() => navigate(`/tarifas/editar/${tarifa.id_tarifa || tarifa.id}`)}
                                        >
                                            Editar
                                        </button>
                                        {isAdmin && (
                                            <button 
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleEliminar(tarifa.id_tarifa || tarifa.id)}
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
                                    {error ? 'Error cargando tarifas' : 'No hay tarifas registradas'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListaTarifas;