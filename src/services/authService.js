import api from './api';

export const authService = {
    login: async (credentials) => {
        try {
            const response = await api.post('/auth/login.php', credentials);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error en el login');
        }
    },

    verifyToken: async () => {
        try {
            const response = await api.get('/auth/verify.php');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error verificando token');
        }
    },

    logout: async () => {
        try {
            const response = await api.post('/auth/logout.php');
            return response.data;
        } catch (error) {
            throw new Error('Error en logout');
        }
    }
};