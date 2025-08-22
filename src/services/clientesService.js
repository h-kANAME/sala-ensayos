import { api } from './api';

export const clientesService = {
    // Obtener todos los clientes
    obtenerClientes: async () => {
        try {
            console.log('🔍 clientesService.obtenerClientes() - Iniciando...');
            const response = await api.get('/clientes');
            console.log('✅ clientesService - Response recibida:', response);
            return response.data || response;
        } catch (error) {
            console.error('❌ clientesService - Error:', error);
            console.error('❌ Response data:', error.response?.data);
            console.error('❌ Status:', error.response?.status);
            throw new Error(error.response?.data?.message || error.message || 'Error obteniendo clientes');
        }
    },

    // Obtener cliente por ID
    obtenerClientePorId: async (id) => {
        try {
            const response = await api.get(`/clientes/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo cliente');
        }
    },

    // Crear nuevo cliente
    crearCliente: async (clienteData) => {
        try {
            const response = await api.post('/clientes', clienteData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error creando cliente');
        }
    },

    // Actualizar cliente
    actualizarCliente: async (id, clienteData) => {
        try {
            const response = await api.put(`/clientes/${id}`, clienteData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error actualizando cliente');
        }
    },

    // Eliminar cliente
    eliminarCliente: async (id) => {
        try {
            const response = await api.delete(`/clientes/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error eliminando cliente');
        }
    }
};