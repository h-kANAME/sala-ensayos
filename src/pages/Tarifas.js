import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import ListaTarifas from '../components/tarifas/ListaTarifas';
import EstadisticasTarifas from '../components/tarifas/EstadisticasTarifas';
import './Tarifas.css';

const Tarifas = () => {
    const { isAdmin, loading } = useAuth();
    const [vistaActiva, setVistaActiva] = useState('lista');

    if (loading) {
        return (
            <Layout>
                <div className="loading">Cargando...</div>
            </Layout>
        );
    }

    const renderContenido = () => {
        switch (vistaActiva) {
            case 'estadisticas':
                return <EstadisticasTarifas />;
            case 'lista':
            default:
                return <ListaTarifas />;
        }
    };

    if (!isAdmin) {
        return (
            <Layout>
                <div className="tarifas">
                    <div className="error-container">
                        <div className="error-message">
                            <h3>🚫 Acceso Denegado</h3>
                            <p>Solo los administradores pueden gestionar las tarifas del sistema.</p>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="tarifas">
                <div className="tarifas-header">
                    <h2>💰 Gestión de Tarifas</h2>
                    <p>Administre las tarifas del sistema por tipo de agrupación y duración</p>
                </div>

                <div className="tarifas-tabs">
                    <button 
                        className={vistaActiva === 'lista' ? 'active' : ''}
                        onClick={() => setVistaActiva('lista')}
                    >
                        📋 ABM Tarifas
                    </button>
                    <button 
                        className={vistaActiva === 'estadisticas' ? 'active' : ''}
                        onClick={() => setVistaActiva('estadisticas')}
                    >
                        📊 Estadísticas
                    </button>
                </div>

                <div className="tarifas-contenido">
                    {renderContenido()}
                </div>
            </div>
        </Layout>
    );
};

export default Tarifas;