import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import CalendarioReservas from '../components/reservas/CalendarioReservas';
import CalendarioPorSala from '../components/calendario-salas/CalendarioPorSala';
import './Dashboard.css';

const Dashboard = () => {
    const { isAdmin, user, loading } = useAuth();
    const [vistaActiva, setVistaActiva] = useState('reservas'); // Valor por defecto
    
    // Ajustar vista activa basada en el rol del usuario
    useEffect(() => {
        if (!loading && user) {
            console.log('🎯 Dashboard: Configurando vista para usuario:', user.rol);
            setVistaActiva(isAdmin ? 'estadisticas' : 'reservas');
        }
    }, [isAdmin, user, loading]);

    const renderContenido = () => {
        switch (vistaActiva) {
            case 'reservas':
                return <CalendarioReservas />;
            case 'calendario-salas':
                return <CalendarioPorSala />;
            case 'estadisticas':
            default:
                return (
                    <>
                        <div className="dashboard-header">
                            <h2>Panel de Control</h2>
                            <p>Gestión integral de la sala de ensayos</p>
                        </div>

                        <div className="stats-grid">
                            {/* ... estadísticas existentes ... */}
                        </div>

                        <div className="dashboard-sections">
                            {/* ... secciones existentes ... */}
                        </div>
                    </>
                );
        }
    };

    return (
        <Layout>
            <div className="dashboard">
                <div className="dashboard-tabs">
                    {isAdmin && (
                        <button 
                            className={vistaActiva === 'estadisticas' ? 'active' : ''}
                            onClick={() => setVistaActiva('estadisticas')}
                        >
                            📊 Estadísticas
                        </button>
                    )}
                    <button 
                        className={vistaActiva === 'reservas' ? 'active' : ''}
                        onClick={() => setVistaActiva('reservas')}
                    >
                        📅 Gestión Reservas
                    </button>
                    <button 
                        className={vistaActiva === 'calendario-salas' ? 'active' : ''}
                        onClick={() => setVistaActiva('calendario-salas')}
                    >
                        🗓️ Calendario Salas
                    </button>
                </div>

                {renderContenido()}
            </div>
        </Layout>
    );
};

export default Dashboard;