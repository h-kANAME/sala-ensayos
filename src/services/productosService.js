import { api } from './api';

export const productosService = {
    // Obtener todos los productos
    obtenerProductos: async () => {
        try {
            console.log('🔍 productosService.obtenerProductos() - Iniciando...');
            const response = await api.get('/productos');
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error obteniendo productos');
        }
    },

    // Obtener producto por ID
    obtenerProductoPorId: async (id) => {
        try {
            console.log(`🔍 productosService.obtenerProductoPorId(${id}) - Iniciando...`);
            const response = await api.get(`/productos/${id}`);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error obteniendo producto');
        }
    },

    // Crear nuevo producto
    crearProducto: async (productoData) => {
        try {
            console.log('➕ productosService.crearProducto() - Iniciando...', productoData);
            const response = await api.post('/productos', productoData);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error creando producto');
        }
    },

    // Actualizar producto
    actualizarProducto: async (id, productoData) => {
        try {
            console.log(`✏️ productosService.actualizarProducto(${id}) - Iniciando...`, productoData);
            const response = await api.put(`/productos/${id}`, productoData);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error actualizando producto');
        }
    },

    // Eliminar producto
    eliminarProducto: async (id) => {
        try {
            console.log(`🗑️ productosService.eliminarProducto(${id}) - Iniciando...`);
            const response = await api.delete(`/productos/${id}`);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error eliminando producto');
        }
    },

    // Actualizar stock (sumar cantidad)
    actualizarStock: async (id, cantidad) => {
        try {
            console.log(`📦 productosService.actualizarStock(${id}) - Sumando cantidad:`, cantidad);
            const response = await api.post(`/productos/stock/${id}`, { cantidad });
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error actualizando stock');
        }
    },

    // Buscar productos por nombre
    buscarProductos: async (termino) => {
        try {
            console.log(`🔍 productosService.buscarProductos("${termino}") - Iniciando...`);
            const response = await api.get(`/productos/buscar?q=${encodeURIComponent(termino)}`);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error buscando productos');
        }
    }
};

export default productosService;