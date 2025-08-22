import React from 'react';
import Layout from '../components/common/Layout';
import FormularioProducto from '../components/productos/FormularioProducto';

const ProductoNuevo = () => {
    return (
        <Layout>
            <div className="page-container">
                <FormularioProducto />
            </div>
        </Layout>
    );
};

export default ProductoNuevo;