import React from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import ListaVentas from '../components/ventas/ListaVentas';

const Ventas = () => {
    const { user } = useAuth();

    return (
        <Layout>
            <div className="page-content">
                <ListaVentas />
            </div>
        </Layout>
    );
};

export default Ventas;