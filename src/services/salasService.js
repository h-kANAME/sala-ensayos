import api from './api';

export const salasService = {
    // Obtener todas las salas
    obtenerSalas: async () => {
        try {
            const response = await api.get('/controllers/SalaController.php');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo salas');
        }
    },

    // Obtener sala por ID
    obtenerSalaPorId: async (id) => {
        try {
            const response = await api.get('/controllers/SalaController.php', {
                params: { id }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo sala');
        }
    }
};