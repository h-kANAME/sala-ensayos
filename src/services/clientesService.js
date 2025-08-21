import { api } from './api';

export const clientesService = {
    // Obtener todos los clientes
    obtenerClientes: async () => {
        try {
            const response = await api.get('/controllers/ClienteController.php');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo clientes');
        }
    },

    // Obtener cliente por ID
    obtenerClientePorId: async (id) => {
        try {
            const response = await api.get('/controllers/ClienteController.php', {
                params: { id }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo cliente');
        }
    },

    // Crear nuevo cliente
    crearCliente: async (clienteData) => {
        try {
            const response = await api.post('/controllers/ClienteController.php', clienteData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error creando cliente');
        }
    },

    // Actualizar cliente
    actualizarCliente: async (id, clienteData) => {
        try {
            const response = await api.put('/controllers/ClienteController.php', {
                id,
                ...clienteData
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error actualizando cliente');
        }
    },

    // Eliminar cliente
    eliminarCliente: async (id) => {
        try {
            const response = await api.delete('/controllers/ClienteController.php', {
                data: { id }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error eliminando cliente');
        }
    }
};