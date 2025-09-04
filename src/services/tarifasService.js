import { api } from './api';

export const tarifasService = {
    // Obtener todas las tarifas
    obtenerTarifas: async () => {
        try {
            console.log('🔍 tarifasService.obtenerTarifas() - Iniciando...');
            const response = await api.get('/tarifas');
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error obteniendo tarifas');
        }
    },

    // Obtener tarifa por ID
    obtenerTarifaPorId: async (id) => {
        try {
            console.log(`🔍 tarifasService.obtenerTarifaPorId(${id}) - Iniciando...`);
            const response = await api.get(`/tarifas/${id}`);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error obteniendo tarifa');
        }
    },

    // Crear nueva tarifa
    crearTarifa: async (tarifaData) => {
        try {
            console.log('➕ tarifasService.crearTarifa() - Iniciando...', tarifaData);
            const response = await api.post('/tarifas', tarifaData);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error creando tarifa');
        }
    },

    // Actualizar tarifa
    actualizarTarifa: async (id, tarifaData) => {
        try {
            console.log(`✏️ tarifasService.actualizarTarifa(${id}) - Iniciando...`, tarifaData);
            const response = await api.put(`/tarifas/${id}`, tarifaData);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error actualizando tarifa');
        }
    },

    // Eliminar tarifa
    eliminarTarifa: async (id) => {
        try {
            console.log(`🗑️ tarifasService.eliminarTarifa(${id}) - Iniciando...`);
            const response = await api.delete(`/tarifas/${id}`);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error eliminando tarifa');
        }
    },

    // Obtener estadísticas de tarifas
    obtenerEstadisticas: async () => {
        try {
            console.log('📊 tarifasService.obtenerEstadisticas() - Iniciando...');
            const response = await api.get('/tarifas/estadisticas');
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error obteniendo estadísticas');
        }
    }
};

export default tarifasService;