import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import FormularioVenta from '../components/ventas/FormularioVenta';

const VentaNueva = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleVentaCreada = (response) => {
        // Redirigir a la lista de ventas después de crear
        navigate('/ventas', {
            state: { 
                message: 'Venta creada exitosamente',
                ventaId: response.id 
            }
        });
    };

    const handleCancelar = () => {
        navigate('/ventas');
    };

    return (
        <Layout>
            <div className="page-content">
                <FormularioVenta
                    onVentaCreada={handleVentaCreada}
                    onCancelar={handleCancelar}
                />
            </div>
        </Layout>
    );
};

export default VentaNueva;