import api from './api';

export const reservasService = {
    // Obtener todas las reservas
    obtenerReservas: async () => {
        try {
            const response = await api.get('/controllers/ReservaController.php');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo reservas');
        }
    },

    // Obtener reservas por rango de fechas
    obtenerReservasPorRango: async (fechaInicio, fechaFin) => {
        try {
            const response = await api.get('/controllers/ReservaController.php', {
                params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo reservas');
        }
    },

    // Obtener reserva por ID
    obtenerReservaPorId: async (id) => {
        try {
            const response = await api.get('/controllers/ReservaController.php', {
                params: { id }
            });
            return response.data[0]; // Retorna el primer elemento del array
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo reserva');
        }
    },

    // Crear nueva reserva
    crearReserva: async (reservaData) => {
        try {
            const response = await api.post('/controllers/ReservaController.php', reservaData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error creando reserva');
        }
    },

    // Verificar disponibilidad
    verificarDisponibilidad: async (salaId, fecha, horaInicio, horaFin) => {
        try {
            // Esta función debería llamar a un endpoint específico para disponibilidad
            // Por ahora usamos la verificación que ya está en el create
            return true;
        } catch (error) {
            throw new Error('Error verificando disponibilidad');
        }
    },

    // Check-in
    registrarCheckIn: async (reservaId) => {
        try {
            const response = await api.post('/CheckinController.php?action=checkin', {
                id: reservaId
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error en check-in');
        }
    },

    // Check-out
    registrarCheckOut: async (reservaId) => {
        try {
            const response = await api.post('/CheckinController.php?action=checkout', {
                id: reservaId
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error en check-out');
        }
    },

    // Obtener reservas de hoy
    obtenerReservasHoy: async () => {
        try {
            const response = await api.get('/CheckinController.php?action=hoy');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error obteniendo reservas de hoy');
        }
    }
};