import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import ListaProductos from '../components/productos/ListaProductos';
import GestionStock from '../components/productos/GestionStock';
import './Productos.css';

const Productos = () => {
    const { user, loading } = useAuth();
    const [vistaActiva, setVistaActiva] = useState('abm');

    console.log('🎯 Productos: Usuario y vista activa:', { user: user?.username, vistaActiva });

    if (loading) {
        return (
            <Layout>
                <div className="loading">Cargando...</div>
            </Layout>
        );
    }

    const renderContenido = () => {
        switch (vistaActiva) {
            case 'stock':
                return <GestionStock />;
            case 'abm':
            default:
                return <ListaProductos />;
        }
    };

    return (
        <Layout>
            <div className="productos">
                <div className="productos-tabs">
                    <button 
                        className={vistaActiva === 'abm' ? 'active' : ''}
                        onClick={() => setVistaActiva('abm')}
                    >
                        📋 ABM Productos
                    </button>
                    <button 
                        className={vistaActiva === 'stock' ? 'active' : ''}
                        onClick={() => setVistaActiva('stock')}
                    >
                        📦 Gestión de Stock
                    </button>
                </div>

                {renderContenido()}
            </div>
        </Layout>
    );
};

export default Productos;