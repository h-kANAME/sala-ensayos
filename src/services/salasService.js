import { api } from './api';

export const salasService = {
  // Obtener todas las salas
  obtenerSalas: async () => {
    console.log('🏠 Obteniendo todas las salas...');
    return await api.get('/salas');
  },

  // Obtener sala por ID
  obtenerSalaPorId: async (id) => {
    console.log(`🏠 Obteniendo sala ID: ${id}`);
    return await api.get(`/salas/${id}`);
  },

  // Crear nueva sala
  crearSala: async (datosSala) => {
    console.log('➕ Creando nueva sala...');
    console.log('📋 Datos de sala:', datosSala);
    return await api.post('/salas', datosSala);
  },

  // Actualizar sala
  actualizarSala: async (id, datosSala) => {
    console.log(`✏️ Actualizando sala ID: ${id}`);
    console.log('📋 Datos de actualización:', datosSala);
    return await api.put(`/salas/${id}`, datosSala);
  },

  // Eliminar sala
  eliminarSala: async (id) => {
    console.log(`🗑️ Eliminando sala ID: ${id}`);
    return await api.delete(`/salas/${id}`);
  }
};

export default salasService;