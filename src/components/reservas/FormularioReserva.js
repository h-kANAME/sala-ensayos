import React, { useState, useEffect } from 'react';
import { reservasService } from '../../services/reservasService';
import { clientesService } from '../../services/clientesService';
import { salasService } from '../../services/salasService';
import './FormularioReserva.css';

const FormularioReserva = ({ onReservaCreada, onReservaGuardada, onCancelar, fechaSeleccionada = null, reservaEditando = null, datosIniciales = null }) => {
  // Estados para el formulario
  const [formData, setFormData] = useState({
    cliente_id: '',
    sala_id: '',
    fecha_reserva: fechaSeleccionada || new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
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
  const [conflictoBanda, setConflictoBanda] = useState({ sin_conflicto: true, reservas_conflicto: '' });
  
  // Estado para formato de hora (24h o AM/PM)
  const [formatoHora, setFormatoHora] = useState('24h'); // '24h' o 'ampm'

  // Cargar clientes y salas al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // Cargar datos de reserva para edición
  useEffect(() => {
    if (reservaEditando) {
      console.log('📝 Cargando datos para edición:', reservaEditando);
      setFormData({
        cliente_id: reservaEditando.cliente_id || '',
        sala_id: reservaEditando.sala_id || '',
        fecha_reserva: reservaEditando.fecha_reserva || '',
        hora_inicio: reservaEditando.hora_inicio || '',
        hora_fin: reservaEditando.hora_fin || '',
        notas: reservaEditando.notas || '',
        estado: reservaEditando.estado || 'pendiente'
      });
    }
  }, [reservaEditando]);

  // Cargar datos iniciales (para crear desde calendario)
  useEffect(() => {
    if (datosIniciales && !reservaEditando) {
      console.log('📋 Cargando datos iniciales:', datosIniciales);
      setFormData(prevData => ({
        ...prevData,
        ...datosIniciales
      }));
    }
  }, [datosIniciales, reservaEditando]);

  // Actualizar fecha si se recibe una nueva
  useEffect(() => {
    if (fechaSeleccionada) {
      setFormData(prev => ({ 
        ...prev, 
        fecha_reserva: fechaSeleccionada 
      }));
    }
  }, [fechaSeleccionada]);

  // Función para determinar la fecha correcta basada en la hora de inicio
  const calcularFechaCorrecta = (fechaSeleccionada, horaInicio) => {
    // SIMPLIFICADO: La fecha seleccionada es la fecha que se guarda
    // Una reserva del 27/08 a la 1 AM se guarda como 27/08 a la 1 AM
    return fechaSeleccionada;
  };

  // Funciones para manejo de formatos de hora
  const convertirA24h = (hora12, periodo) => {
    const [horas, minutos] = hora12.split(':').map(Number);
    let horas24 = horas;
    
    if (periodo === 'AM') {
      if (horas === 12) horas24 = 0;
    } else { // PM
      if (horas !== 12) horas24 = horas + 12;
    }
    
    return `${horas24.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  };

  const convertirA12h = (hora24) => {
    const [horas, minutos] = hora24.split(':').map(Number);
    const periodo = horas >= 12 ? 'PM' : 'AM';
    let horas12 = horas % 12;
    if (horas12 === 0) horas12 = 12;
    
    return {
      hora: `${horas12.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`,
      periodo
    };
  };

  // Validar disponibilidad cuando cambian los datos relevantes
  useEffect(() => {
    const { cliente_id, sala_id, fecha_reserva, hora_inicio, hora_fin } = formData;
    
    if (sala_id && fecha_reserva && hora_inicio && hora_fin) {
      validarDisponibilidad();
    }

    if (cliente_id && fecha_reserva && hora_inicio && hora_fin) {
      validarConflictoBanda();
    }
  }, [formData.cliente_id, formData.sala_id, formData.fecha_reserva, formData.hora_inicio, formData.hora_fin]);

  const cargarDatos = async () => {
    try {
      console.log('🔄 Cargando clientes y salas...');
      
      // Cargar clientes y salas usando los servicios apropiados
      const [clientesResponse, salasResponse] = await Promise.all([
        clientesService.obtenerClientes(),
        salasService.obtenerSalas()
      ]);

      console.log('👥 Clientes cargados:', clientesResponse);
      console.log('🏠 Salas cargadas:', salasResponse);

      // Extraer los arrays correctamente (considerar formato { data: [...] })
      const clientesArray = Array.isArray(clientesResponse) ? clientesResponse : (clientesResponse.data || []);
      const salasArray = Array.isArray(salasResponse) ? salasResponse : (salasResponse.data || []);
      
      setClientes(clientesArray);
      setSalas(salasArray);
      
      console.log('📊 Arrays procesados - Clientes:', clientesArray.length, 'Salas:', salasArray.length);
      
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      setError('Error al cargar clientes y salas: ' + error.message);
      
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
      const excluirId = reservaEditando?.id || null;
      const response = await reservasService.verificarDisponibilidad(
        sala_id,
        fecha_reserva,
        hora_inicio,
        hora_fin,
        excluirId
      );
      
      // Manejar diferentes formatos de respuesta
      const disponibleValue = response?.data?.disponible ?? response?.disponible ?? true;
      setDisponible(disponibleValue);
      
    } catch (error) {
      console.error('❌ Error al validar disponibilidad:', error);
      setDisponible(true); // Asumir disponible si hay error
    } finally {
      setValidandoDisponibilidad(false);
    }
  };

  const validarConflictoBanda = async () => {
    const { cliente_id, fecha_reserva, hora_inicio, hora_fin } = formData;
    
    if (!cliente_id || !fecha_reserva || !hora_inicio || !hora_fin) {
      setConflictoBanda({ sin_conflicto: true, reservas_conflicto: '' });
      return;
    }
    
    try {
      console.log('🔍 Validando conflicto de banda...');
      const excluirId = reservaEditando?.id || null;
      const response = await reservasService.verificarConflictoBanda(
        cliente_id,
        fecha_reserva,
        hora_inicio,
        hora_fin,
        excluirId
      );
      
      // Manejar diferentes formatos de respuesta
      const resultado = response?.data || response;
      setConflictoBanda({
        sin_conflicto: resultado?.sin_conflicto ?? true,
        reservas_conflicto: resultado?.reservas_conflicto ?? ''
      });
      
    } catch (error) {
      console.error('❌ Error al validar conflicto de banda:', error);
      setConflictoBanda({ sin_conflicto: true, reservas_conflicto: '' }); // Asumir sin conflicto si hay error
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

    if (!conflictoBanda.sin_conflicto) {
      setError(`Esta banda ya tiene reserva en: ${conflictoBanda.reservas_conflicto || 'el mismo horario en otra sala'}`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const esEdicion = !!reservaEditando;
      console.log(esEdicion ? '✏️ Actualizando reserva con datos:' : '📝 Creando reserva con datos:', formData);
      
      // Obtener usuario_id del localStorage (asumiendo que se guarda al login)
      const usuarioId = localStorage.getItem('usuario_id') || '1';
      
      // Calcular la fecha correcta según la regla de negocio para horarios nocturnos
      const fechaCorrecta = calcularFechaCorrecta(formData.fecha_reserva, formData.hora_inicio);
      
      const datosReserva = {
        ...formData,
        fecha_reserva: fechaCorrecta,
        usuario_id: usuarioId
      };
      
      console.log('📅 Fecha original:', formData.fecha_reserva, 'Fecha corregida:', fechaCorrecta, 'Hora:', formData.hora_inicio);

      let resultado;
      if (esEdicion) {
        resultado = await reservasService.actualizar(reservaEditando.id, datosReserva);
        setSuccess('Reserva actualizada exitosamente');
      } else {
        resultado = await reservasService.crear(datosReserva);
        setSuccess('Reserva creada exitosamente');
      }
      
      console.log(`✅ Reserva ${esEdicion ? 'actualizada' : 'creada'}:`, resultado);
      
      // Limpiar formulario solo si es creación
      if (!esEdicion) {
        setFormData({
          cliente_id: '',
          sala_id: '',
          fecha_reserva: fechaSeleccionada || new Date().toISOString().split('T')[0],
          hora_inicio: '',
          hora_fin: '',
          notas: '',
          estado: 'pendiente'
        });
      }

      // Notificar al componente padre
      if (onReservaCreada) {
        setTimeout(() => {
          onReservaCreada(resultado);
        }, 1500); // Dar tiempo para ver el mensaje de éxito
      }
      
      // Notificar al componente padre (para calendario)
      if (onReservaGuardada) {
        setTimeout(() => {
          onReservaGuardada(resultado);
        }, 1500);
      }

    } catch (error) {
      console.error(`❌ Error al ${reservaEditando ? 'actualizar' : 'crear'} reserva:`, error);
      setError(error.message || `Error al ${reservaEditando ? 'actualizar' : 'crear'} la reserva`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="formulario-reserva">
      <h3>{reservaEditando ? 'Editar Reserva' : 'Nueva Reserva'}</h3>
      
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
                {sala.nombre}
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

        <div className="form-group formato-hora">
          <label>Formato de Hora:</label>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                value="24h"
                checked={formatoHora === '24h'}
                onChange={(e) => setFormatoHora(e.target.value)}
              />
              24 Horas (23:00)
            </label>
            <label className="radio-option">
              <input
                type="radio"
                value="ampm"
                checked={formatoHora === 'ampm'}
                onChange={(e) => setFormatoHora(e.target.value)}
              />
              AM/PM (11:00 PM)
            </label>
          </div>
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
              step="300"
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
              step="300"
              required
            />
          </div>
        </div>

        {formatoHora === 'ampm' && formData.hora_inicio && formData.hora_fin && (
          <div className="hora-preview">
            <p><strong>Vista previa:</strong></p>
            <p>Inicio: {convertirA12h(formData.hora_inicio).hora} {convertirA12h(formData.hora_inicio).periodo}</p>
            <p>Fin: {convertirA12h(formData.hora_fin).hora} {convertirA12h(formData.hora_fin).periodo}</p>
          </div>
        )}

        {formData.fecha_reserva && formData.hora_inicio && (
          <div className="fecha-preview">
            <p><strong>📅 Esta reserva aparecerá en:</strong></p>
            <p>Fecha seleccionada: {new Date(formData.fecha_reserva + 'T00:00:00').toLocaleDateString('es-ES')}</p>
            <p>Aparecerá en calendario del: {new Date(calcularFechaCorrecta(formData.fecha_reserva, formData.hora_inicio) + 'T00:00:00').toLocaleDateString('es-ES')}</p>
          </div>
        )}

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

        {formData.cliente_id && formData.fecha_reserva && formData.hora_inicio && formData.hora_fin && (
          <div className={`availability-status ${conflictoBanda.sin_conflicto ? 'available' : 'unavailable'}`}>
            {conflictoBanda.sin_conflicto 
              ? '✅ Sin conflicto de banda' 
              : `❌ Esta banda ya tiene reserva en: ${conflictoBanda.reservas_conflicto || 'horario coincidente'}`
            }
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
            disabled={loading || !disponible || !conflictoBanda.sin_conflicto || validandoDisponibilidad}
            className="btn btn-primary"
          >
            {loading 
              ? (reservaEditando ? '⏳ Actualizando...' : '⏳ Creando...') 
              : (reservaEditando ? 'Actualizar Reserva' : 'Crear Reserva')
            }
          </button>
          <button
            type="button"
            onClick={onCancelar}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
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