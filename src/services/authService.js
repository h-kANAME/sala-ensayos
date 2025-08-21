import { api } from './api';

export const authService = {
    login: async (credentials) => {
        try {
            const response = await api.post('/auth/login.php', credentials);
            return response;
        } catch (error) {
            throw new Error(error.message || 'Error en el login');
        }
    },

    verifyToken: async () => {
        try {
            const response = await api.get('/auth/verify.php');
            return response;
        } catch (error) {
            throw new Error(error.message || 'Error verificando token');
        }
    },

    logout: async () => {
        try {
            const response = await api.post('/auth/logout.php');
            return response;
        } catch (error) {
            throw new Error('Error en logout');
        }
    }
};

export default authService;