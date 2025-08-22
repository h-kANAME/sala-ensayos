import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/common/Layout';
import FormularioProducto from '../components/productos/FormularioProducto';

const ProductoEditar = () => {
    const { id } = useParams();
    
    return (
        <Layout>
            <div className="page-container">
                <FormularioProducto productoId={id} />
            </div>
        </Layout>
    );
};

export default ProductoEditar;