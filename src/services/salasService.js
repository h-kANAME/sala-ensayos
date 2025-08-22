import { api } from './api';

export const salasService = {
    // Obtener todas las salas
    obtenerSalas: async () => {
        try {
            console.log('🏠 salasService.obtenerSalas() - Iniciando...');
            const response = await api.get('/salas');
            console.log('✅ salasService - Response recibida:', response);
            return response.data || response;
        } catch (error) {
            console.error('❌ salasService - Error:', error);
            console.error('❌ Response data:', error.response?.data);
            console.error('❌ Status:', error.response?.status);
            throw new Error(error.response?.data?.message || error.message || 'Error obteniendo salas');
        }
    },

    // Obtener sala por ID
    obtenerSalaPorId: async (id) => {
        try {
            const response = await api.get(`/salas/${id}`);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error obteniendo sala');
        }
    }
};