import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="layout">
            <header className="layout-header">
                <div className="header-content">
                    <h1>Sala de Ensayos - Sistema de Gestión</h1>
                    <div className="user-info">
                        <span>Bienvenido, {user?.nombre_completo}</span>
                        <span className="user-role">({user?.rol})</span>
                        <button onClick={handleLogout} className="logout-btn">
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </header>

            <nav className="layout-nav">
                <ul className="nav-menu">
                    <li><a href="#dashboard">Dashboard</a></li>
                    <li><a href="#reservas">Reservas</a></li>
                    <li><a href="#clientes">Clientes</a></li>
                    <li><a href="#productos">Productos</a></li>
                    <li><a href="#ventas">Ventas</a></li>
                    <li><a href="#reportes">Reportes</a></li>
                </ul>
            </nav>

            <main className="layout-main">
                <div className="main-content">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;