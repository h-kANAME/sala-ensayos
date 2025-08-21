import React, { useState, useEffect } from 'react';
import { reservasService } from '../../services/reservasService';
import { api } from '../../services/api';
import './FormularioReserva.css';

const FormularioReserva = ({ onReservaCreada, fechaSeleccionada = null }) => {
  // Estados para el formulario
  const [formData, setFormData] = useState({
    cliente_id: '',
    sala_id: '',
    fecha_reserva: fechaSeleccionada || new Date().toISOString().split('T')[0],
    hora_inicio: '',
    hora_fin: '',
    notas: '',
    estado: 'pendiente'
  });

  // Estados para los datos
  const [clientes, setClientes] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para validación
  const [disponible, setDisponible] = useState(true);
  const [validandoDisponibilidad, setValidandoDisponibilidad] = useState(false);

  // Cargar clientes y salas al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // Actualizar fecha si se recibe una nueva
  useEffect(() => {
    if (fechaSeleccionada) {
      setFormData(prev => ({ 
        ...prev, 
        fecha_reserva: fechaSeleccionada 
      }));
    }
  }, [fechaSeleccionada]);

  // Validar disponibilidad cuando cambian los datos relevantes
  useEffect(() => {
    const { sala_id, fecha_reserva, hora_inicio, hora_fin } = formData;
    
    if (sala_id && fecha_reserva && hora_inicio && hora_fin) {
      validarDisponibilidad();
    }
  }, [formData.sala_id, formData.fecha_reserva, formData.hora_inicio, formData.hora_fin]);

  const cargarDatos = async () => {
    try {
      console.log('🔄 Cargando clientes y salas...');
      
      // Cargar clientes y salas en paralelo
      const [clientesResponse, salasResponse] = await Promise.all([
        api.get('/clientes'),
        api.get('/salas')
      ]);

      console.log('👥 Clientes cargados:', clientesResponse);
      console.log('🏠 Salas cargadas:', salasResponse);

      // Asegurar que sean arrays
      setClientes(Array.isArray(clientesResponse) ? clientesResponse : []);
      setSalas(Array.isArray(salasResponse) ? salasResponse : []);
      
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      setError('Error al cargar clientes y salas');
      
      // Inicializar arrays vacíos en caso de error
      setClientes([]);
      setSalas([]);
    }
  };

  const validarDisponibilidad = async () => {
    const { sala_id, fecha_reserva, hora_inicio, hora_fin } = formData;
    
    if (!sala_id || !fecha_reserva || !hora_inicio || !hora_fin) {
      return;
    }

    setValidandoDisponibilidad(true);
    
    try {
      console.log('🔍 Validando disponibilidad...');
      const resultado = await reservasService.verificarDisponibilidad(
        sala_id,
        fecha_reserva,
        hora_inicio,
        hora_fin
      );
      
      setDisponible(resultado.disponible !== false);
      
    } catch (error) {
      console.error('❌ Error al validar disponibilidad:', error);
      setDisponible(true); // Asumir disponible si hay error
    } finally {
      setValidandoDisponibilidad(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar mensajes cuando el usuario edite
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!disponible) {
      setError('La sala no está disponible en el horario seleccionado');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📝 Creando reserva con datos:', formData);
      
      // Obtener usuario_id del localStorage (asumiendo que se guarda al login)
      const usuarioId = localStorage.getItem('usuario_id') || '1';
      
      const datosReserva = {
        ...formData,
        usuario_id: usuarioId
      };

      const resultado = await reservasService.crear(datosReserva);
      
      console.log('✅ Reserva creada:', resultado);
      
      setSuccess('Reserva creada exitosamente');
      
      // Limpiar formulario
      setFormData({
        cliente_id: '',
        sala_id: '',
        fecha_reserva: fechaSeleccionada || new Date().toISOString().split('T')[0],
        hora_inicio: '',
        hora_fin: '',
        notas: '',
        estado: 'pendiente'
      });

      // Notificar al componente padre
      if (onReservaCreada) {
        onReservaCreada(resultado);
      }

    } catch (error) {
      console.error('❌ Error al crear reserva:', error);
      setError(error.message || 'Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="formulario-reserva">
      <h3>Nueva Reserva</h3>
      
      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          ✅ {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="cliente_id">Cliente:</label>
          <select
            id="cliente_id"
            name="cliente_id"
            value={formData.cliente_id}
            onChange={handleInputChange}
            required
          >
            <option value="">Selecciona un cliente</option>
            {clientes && clientes.length > 0 && clientes.map(cliente => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre_banda} - {cliente.contacto_nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="sala_id">Sala:</label>
          <select
            id="sala_id"
            name="sala_id"
            value={formData.sala_id}
            onChange={handleInputChange}
            required
          >
            <option value="">Selecciona una sala</option>
            {salas && salas.length > 0 && salas.map(sala => (
              <option key={sala.id} value={sala.id}>
                {sala.nombre} - ${sala.tarifa_hora}/hora
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="fecha_reserva">Fecha:</label>
          <input
            type="date"
            id="fecha_reserva"
            name="fecha_reserva"
            value={formData.fecha_reserva}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="hora_inicio">Hora Inicio:</label>
            <input
              type="time"
              id="hora_inicio"
              name="hora_inicio"
              value={formData.hora_inicio}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="hora_fin">Hora Fin:</label>
            <input
              type="time"
              id="hora_fin"
              name="hora_fin"
              value={formData.hora_fin}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        {validandoDisponibilidad && (
          <div className="availability-check">
            🔍 Verificando disponibilidad...
          </div>
        )}

        {!validandoDisponibilidad && formData.sala_id && formData.hora_inicio && formData.hora_fin && (
          <div className={`availability-status ${disponible ? 'available' : 'unavailable'}`}>
            {disponible ? '✅ Horario disponible' : '❌ Horario no disponible'}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="notas">Notas:</label>
          <textarea
            id="notas"
            name="notas"
            value={formData.notas}
            onChange={handleInputChange}
            rows="3"
            placeholder="Notas adicionales (opcional)"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading || !disponible || validandoDisponibilidad}
            className="btn btn-primary"
          >
            {loading ? '⏳ Creando...' : 'Crear Reserva'}
          </button>
        </div>
      </form>

      {/* Debug info - solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <h4>Debug Info:</h4>
          <p>Clientes: {clientes?.length || 0} elementos</p>
          <p>Salas: {salas?.length || 0} elementos</p>
          <p>Disponible: {disponible ? 'Sí' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

export default FormularioReserva;