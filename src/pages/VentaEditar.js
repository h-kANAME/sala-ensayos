import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import { ventasService } from '../services/ventasService';

const VentaEditar = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [venta, setVenta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarVenta();
    }, [id]);

    const cargarVenta = async () => {
        try {
            setLoading(true);
            const ventaData = await ventasService.obtenerVentaPorId(id);
            setVenta(ventaData);
        } catch (err) {
            console.error('Error cargando venta:', err);
            setError('Error cargando venta: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="page-content">
                    <div className="loading">Cargando venta...</div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="page-content">
                    <div className="error">
                        {error}
                        <br />
                        <button 
                            className="btn btn-primary" 
                            onClick={() => navigate('/ventas')}
                            style={{ marginTop: '15px' }}
                        >
                            Volver a Ventas
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!venta) {
        return (
            <Layout>
                <div className="page-content">
                    <div className="error">
                        Venta no encontrada
                        <br />
                        <button 
                            className="btn btn-primary" 
                            onClick={() => navigate('/ventas')}
                            style={{ marginTop: '15px' }}
                        >
                            Volver a Ventas
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-content">
                <div className="info-message">
                    <h2>Edición de Ventas</h2>
                    <p>
                        La edición de ventas no está disponible por motivos de integridad de datos. 
                        Las ventas pueden ser anuladas, pero no modificadas.
                    </p>
                    <p>
                        <strong>Venta #{venta.id}</strong> - {venta.cliente_nombre} {venta.cliente_apellido}
                    </p>
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <button 
                            className="btn btn-primary" 
                            onClick={() => navigate('/ventas')}
                        >
                            Volver a Ventas
                        </button>
                        {!venta.anulada && (
                            <button 
                                className="btn btn-danger" 
                                onClick={() => {
                                    if (window.confirm('¿Está seguro de anular esta venta?')) {
                                        ventasService.anularVenta(venta.id)
                                            .then(() => {
                                                navigate('/ventas', {
                                                    state: { 
                                                        message: 'Venta anulada exitosamente' 
                                                    }
                                                });
                                            })
                                            .catch(err => {
                                                setError('Error anulando venta: ' + err.message);
                                            });
                                    }
                                }}
                            >
                                Anular Venta
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default VentaEditar;