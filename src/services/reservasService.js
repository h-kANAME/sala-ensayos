import { api } from './api';

export const reservasService = {
  // Obtener todas las reservas
  obtenerTodas: async () => {
    console.log('🔍 Obteniendo todas las reservas...');
    return await api.get('/reservas');
  },

  // Obtener reservas por rango de fechas
  obtenerPorRango: async (fechaInicio, fechaFin) => {
    console.log(`🔍 Obteniendo reservas desde ${fechaInicio} hasta ${fechaFin}`);
    return await api.get(`/reservas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
  },

  // Obtener reserva por ID
  obtenerPorId: async (id) => {
    console.log(`🔍 Obteniendo reserva ID: ${id}`);
    return await api.get(`/reservas?id=${id}`);
  },

  // Crear nueva reserva
  crear: async (datosReserva) => {
    console.log('➕ Creando nueva reserva...');
    console.log('📋 Datos de reserva:', datosReserva);
    
    // Validar datos requeridos
    const camposRequeridos = ['cliente_id', 'sala_id', 'usuario_id', 'fecha_reserva', 'hora_inicio', 'hora_fin'];
    const camposFaltantes = camposRequeridos.filter(campo => !datosReserva[campo]);
    
    if (camposFaltantes.length > 0) {
      console.error('❌ Campos faltantes:', camposFaltantes);
      throw new Error(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`);
    }

    return await api.post('/reservas', datosReserva);
  },

  // Actualizar estado de reserva
  actualizarEstado: async (id, estado) => {
    console.log(`🔄 Actualizando reserva ${id} a estado: ${estado}`);
    return await api.put(`/reservas/${id}/estado`, { estado });
  },

  // Registrar ingreso
  registrarIngreso: async (id) => {
    console.log(`🚪 Registrando ingreso para reserva ${id}`);
    return await api.post(`/reservas/${id}/checkin`);
  },

  // Registrar salida
  registrarSalida: async (id) => {
    console.log(`🚶 Registrando salida para reserva ${id}`);
    return await api.post(`/reservas/${id}/checkout`);
  },

  // Alias para compatibilidad con CheckInButton
  registrarCheckIn: async (id) => {
    console.log(`🚪 Registrando check-in para reserva ${id}`);
    return await api.post(`/checkin?action=checkin`, { id });
  },

  // Alias para compatibilidad con CheckInButton
  registrarCheckOut: async (id) => {
    console.log(`🚶 Registrando check-out para reserva ${id}`);
    return await api.post(`/checkin?action=checkout`, { id });
  },

  // Obtener reservas de hoy
  obtenerHoy: async () => {
    console.log('📅 Obteniendo reservas de hoy...');
    const hoy = new Date().toISOString().split('T')[0];
    return await api.get(`/reservas?fecha_inicio=${hoy}&fecha_fin=${hoy}`);
  },

  // Verificar disponibilidad
  verificarDisponibilidad: async (salaId, fecha, horaInicio, horaFin, excluirId = null) => {
    console.log(`🔍 Verificando disponibilidad - Sala: ${salaId}, Fecha: ${fecha}`);
    
    let url = `/reservas/disponibilidad?sala_id=${salaId}&fecha=${fecha}&hora_inicio=${horaInicio}&hora_fin=${horaFin}`;
    if (excluirId) {
      url += `&excluir_id=${excluirId}`;
    }
    
    return await api.get(url);
  },

  // Actualizar reserva
  actualizar: async (id, datosReserva) => {
    console.log(`✏️ Actualizando reserva ID: ${id}`);
    console.log('📋 Datos de actualización:', datosReserva);
    return await api.put(`/reservas/${id}`, datosReserva);
  },

  // Eliminar reserva
  eliminarReserva: async (id) => {
    console.log(`🗑️ Eliminando reserva ID: ${id}`);
    return await api.delete(`/reservas/${id}`);
  }
};