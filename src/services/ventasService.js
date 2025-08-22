import { api } from './api';

export const ventasService = {
    // Obtener todas las ventas
    obtenerVentas: async () => {
        try {
            console.log('🔍 ventasService.obtenerVentas() - Iniciando...');
            const response = await api.get('/ventas');
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error obteniendo ventas');
        }
    },

    // Obtener venta por ID
    obtenerVentaPorId: async (id) => {
        try {
            console.log(`🔍 ventasService.obtenerVentaPorId(${id}) - Iniciando...`);
            const response = await api.get(`/ventas/${id}`);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error obteniendo venta');
        }
    },

    // Obtener items de una venta
    obtenerItemsVenta: async (ventaId) => {
        try {
            console.log(`🔍 ventasService.obtenerItemsVenta(${ventaId}) - Iniciando...`);
            const response = await api.get(`/ventas/items/${ventaId}`);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error obteniendo items de venta');
        }
    },

    // Crear nueva venta
    crearVenta: async (ventaData) => {
        try {
            console.log('➕ ventasService.crearVenta() - Iniciando...', ventaData);
            const response = await api.post('/ventas', ventaData);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error creando venta');
        }
    },

    // Anular venta
    anularVenta: async (id) => {
        try {
            console.log(`❌ ventasService.anularVenta(${id}) - Iniciando...`);
            const response = await api.post(`/ventas/anular/${id}`);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error anulando venta');
        }
    },

    // Verificar stock de productos antes de venta
    verificarStock: async (items) => {
        try {
            console.log('📦 ventasService.verificarStock() - Iniciando...', items);
            const response = await api.post('/ventas/verificar-stock', { items });
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error verificando stock');
        }
    },

    // Obtener ventas por rango de fechas
    obtenerVentasPorFechas: async (fechaInicio, fechaFin) => {
        try {
            console.log(`📅 ventasService.obtenerVentasPorFechas(${fechaInicio}, ${fechaFin}) - Iniciando...`);
            const response = await api.get(`/ventas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
            return response.data || response;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Error obteniendo ventas por fechas');
        }
    }
};

export default ventasService;