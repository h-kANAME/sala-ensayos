import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clientesService } from '../../services/clientesService';
import './ListaClientes.css';

const ListaClientes = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarClientes();
    }, []);

    const cargarClientes = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await clientesService.obtenerClientes();
            setClientes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error cargando clientes:', err);
            setError(err.message);
            setClientes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
            try {
                console.log('🗑️ Eliminando cliente ID:', id);
                const response = await clientesService.eliminarCliente(id);
                console.log('✅ Cliente eliminado:', response);
                cargarClientes(); // Recargar lista
            } catch (err) {
                console.error('❌ Error eliminando cliente:', err);
                setError(err.message);
            }
        }
    };

    if (loading) return <div className="loading">Cargando clientes...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="lista-clientes">
            <div className="header">
                <h2>Gestión de Clientes</h2>
                <button className="btn btn-primary" onClick={() => navigate('/clientes/nuevo')}>
                    + Nuevo Cliente
                </button>
            </div>

            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre de Banda</th>
                            <th>Contacto</th>
                            <th>Tipo</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes && clientes.length > 0 ? (
                            clientes.map(cliente => (
                                <tr key={cliente.id}>
                                    <td>{cliente.id}</td>
                                    <td>{cliente.nombre_banda}</td>
                                    <td>{cliente.contacto_nombre}</td>
                                    <td>
                                        <span className={`badge ${cliente.tipo_agrupacion === 'Extended' ? 'badge-extended' : 'badge-standard'}`}>
                                            {cliente.tipo_agrupacion || 'Standard'}
                                        </span>
                                    </td>
                                    <td>{cliente.contacto_email || '-'}</td>
                                    <td>{cliente.contacto_telefono || '-'}</td>
                                    <td>
                                        <button 
                                            className="btn btn-warning btn-sm"
                                            onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
                                        >
                                            Editar
                                        </button>
                                        {isAdmin && (
                                            <button 
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleEliminar(cliente.id)}
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                    {error ? 'Error cargando clientes' : 'No hay clientes registrados'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListaClientes;