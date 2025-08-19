import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import CalendarioReservas from '../components/reservas/CalendarioReservas';
import './Dashboard.css';

const Dashboard = () => {
    const [vistaActiva, setVistaActiva] = useState('estadisticas');

    const renderContenido = () => {
        switch (vistaActiva) {
            case 'reservas':
                return <CalendarioReservas />;
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
                    <button 
                        className={vistaActiva === 'estadisticas' ? 'active' : ''}
                        onClick={() => setVistaActiva('estadisticas')}
                    >
                        📊 Estadísticas
                    </button>
                    <button 
                        className={vistaActiva === 'reservas' ? 'active' : ''}
                        onClick={() => setVistaActiva('reservas')}
                    >
                        📅 Reservas
                    </button>
                </div>

                {renderContenido()}
            </div>
        </Layout>
    );
};

export default Dashboard;