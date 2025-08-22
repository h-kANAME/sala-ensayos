import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
    const { user, logout, isAdmin } = useAuth();

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
                    <li><Link to="/dashboard">Dashboard</Link></li>
                    {/* <li><a href="#reservas">Reservas</a></li> */}
                    <li><Link to="/clientes">Clientes</Link></li>
                    
                    {/* Solo admins pueden acceder a Productos y Reportes */}
                    {isAdmin && (
                        <>
                            <li><Link to="/productos">Productos</Link></li>
                            <li><a href="#reportes">Reportes</a></li>
                        </>
                    )}
                    
                    {/* Todos pueden acceder a Ventas */}
                    <li><Link to="/ventas">Ventas</Link></li>
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