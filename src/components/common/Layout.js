import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
    const { user, logout, isAdmin } = useAuth();
    const [navCollapsed, setNavCollapsed] = useState(true);

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
                <button 
                    className={`nav-toggle ${navCollapsed ? '' : 'active'}`}
                    onClick={() => setNavCollapsed(!navCollapsed)}
                >
                    🗺️ Menú
                </button>
                <ul className={`nav-menu ${navCollapsed ? 'collapsed' : ''}`}>
                    <li><Link to="/dashboard" onClick={() => setNavCollapsed(true)}>📊 Dashboard</Link></li>
                    <li><Link to="/clientes" onClick={() => setNavCollapsed(true)}>👥 Clientes</Link></li>
                    
                    {/* Solo admins pueden acceder a Productos, Tarifas y Reportes */}
                    {isAdmin && (
                        <>
                            <li><Link to="/productos" onClick={() => setNavCollapsed(true)}>📦 Productos</Link></li>
                            <li><Link to="/tarifas" onClick={() => setNavCollapsed(true)}>💰 Tarifas</Link></li>
                            <li><a href="#reportes" onClick={() => setNavCollapsed(true)}>📈 Reportes</a></li>
                        </>
                    )}
                    
                    {/* Todos pueden acceder a Ventas */}
                    <li><Link to="/ventas" onClick={() => setNavCollapsed(true)}>💵 Ventas</Link></li>
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