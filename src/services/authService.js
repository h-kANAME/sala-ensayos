import { api } from './api';

export const authService = {
    login: async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            return response;
        } catch (error) {
            throw new Error(error.message || 'Error en el login');
        }
    },

    verifyToken: async () => {
        try {
            const response = await api.get('/auth/verify');
            return response;
        } catch (error) {
            throw new Error(error.message || 'Error verificando token');
        }
    },

    logout: async () => {
        try {
            const response = await api.post('/auth/logout');
            return response;
        } catch (error) {
            throw new Error('Error en logout');
        }
    }
};

export default authService;