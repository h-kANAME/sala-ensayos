import React, { useState, useEffect } from 'react';
import { reservasService } from '../../services/reservasService';
import { clientesService } from '../../services/clientesService';
import { salasService } from '../../services/salasService';
import { useAuth } from '../../context/AuthContext';
import './FormularioReserva.css';

const FormularioReserva = ({ onReservaCreada, onCancelar }) => {
    const [formData, setFormData] = useState({
        cliente_id: '',
        sala_id: '',
        fecha_reserva: '',
        hora_inicio: '14:00',
        hora_fin: '16:00',
        notas: ''
    });
    
    const [clientes, setClientes] = useState([]);
    const [salas, setSalas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [disponibilidad, setDisponibilidad] = useState(null);
    const [calculando, setCalculando] = useState(false);
    
    const { user } = useAuth();

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        if (formData.sala_id && formData.fecha_reserva && formData.hora_inicio && formData.hora_fin) {
            verificarDisponibilidad();
        }
    }, [formData.sala_id, formData.fecha_reserva, formData.hora_inicio, formData.hora_fin]);

    const cargarDatos = async () => {
        try {
            const [clientesData, salasData] = await Promise.all([
                clientesService.obtenerClientes(),
                salasService.obtenerSalas()
            ]);
            
            setClientes(clientesData);
            setSalas(salasData);
        } catch (err) {
            setError('Error cargando datos: ' + err.message);
        }
    };

    const verificarDisponibilidad = async () => {
        if (!formData.sala_id || !formData.fecha_reserva || !formData.hora_inicio || !formData.hora_fin) {
            return;
        }

        setCalculando(true);
        try {
            // Esta verificación se hace automáticamente en el backend al crear
            // Pero podemos hacer una pre-verificación aquí
            setDisponibilidad('verificando');
            
            // Simulamos verificación (en producción sería una llamada API)
            setTimeout(() => {
                setDisponibilidad('disponible');
                setCalculando(false);
            }, 1000);
            
        } catch (err) {
            setDisponibilidad('error');
            setCalculando(false);
        }
    };

    const calcularImporte = () => {
        if (!formData.sala_id || !formData.hora_inicio || !formData.hora_fin) {
            return 0;
        }

        const sala = salas.find(s => s.id == formData.sala_id);
        if (!sala) return 0;

        const [horaInicio, minutoInicio] = formData.hora_inicio.split(':').map(Number);
        const [horaFin, minutoFin] = formData.hora_fin.split(':').map(Number);
        
        const minutosTotales = (horaFin * 60 + minutoFin) - (horaInicio * 60 + minutoInicio);
        const horas = minutosTotales / 60;
        
        return horas * sala.tarifa_hora;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const importeTotal = calcularImporte();
            const horasReservadas = (calculateHours()) || 2;

            const reservaData = {
                ...formData,
                usuario_id: user.id,
                horas_reservadas: horasReservadas,
                importe_total: importeTotal,
                estado: 'pendiente'
            };

            await reservasService.crearReserva(reservaData);
            onReservaCreada();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateHours = () => {
        if (!formData.hora_inicio || !formData.hora_fin) return 0;
        
        const [horaInicio, minutoInicio] = formData.hora_inicio.split(':').map(Number);
        const [horaFin, minutoFin] = formData.hora_fin.split(':').map(Number);
        
        const minutosTotales = (horaFin * 60 + minutoFin) - (horaInicio * 60 + minutoInicio);
        return (minutosTotales / 60).toFixed(1);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const importeTotal = calcularImporte();
    const horasReservadas = calculateHours();

    return (
        <div className="formulario-reserva">
            <h3>Nueva Reserva</h3>
            
            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label>Cliente *</label>
                        <select
                            name="cliente_id"
                            value={formData.cliente_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Seleccionar cliente</option>
                            {clientes.map(cliente => (
                                <option key={cliente.id} value={cliente.id}>
                                    {cliente.nombre_banda} - {cliente.contacto_nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Sala *</label>
                        <select
                            name="sala_id"
                            value={formData.sala_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Seleccionar sala</option>
                            {salas.map(sala => (
                                <option key={sala.id} value={sala.id}>
                                    {sala.nombre} - ${sala.tarifa_hora}/hora
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Fecha *</label>
                        <input
                            type="date"
                            name="fecha_reserva"
                            value={formData.fecha_reserva}
                            onChange={handleChange}
                            required
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="form-group">
                        <label>Hora Inicio *</label>
                        <input
                            type="time"
                            name="hora_inicio"
                            value={formData.hora_inicio}
                            onChange={handleChange}
                            required
                            min="09:00"
                            max="23:00"
                        />
                    </div>

                    <div className="form-group">
                        <label>Hora Fin *</label>
                        <input
                            type="time"
                            name="hora_fin"
                            value={formData.hora_fin}
                            onChange={handleChange}
                            required
                            min={formData.hora_inicio || '09:00'}
                            max="23:59"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Notas</label>
                    <textarea
                        name="notas"
                        value={formData.notas}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Observaciones adicionales..."
                    />
                </div>

                {/* Información de cálculo */}
                <div className="resumen-calculado">
                    <div className="resumen-item">
                        <span>Horas reservadas:</span>
                        <strong>{horasReservadas} horas</strong>
                    </div>
                    <div className="resumen-item">
                        <span>Importe total:</span>
                        <strong>${importeTotal.toFixed(2)}</strong>
                    </div>
                    <div className="resumen-item disponibilidad">
                        <span>Disponibilidad:</span>
                        <strong className={disponibilidad}>
                            {calculando ? 'Verificando...' : 
                             disponibilidad === 'disponible' ? '✅ Disponible' : 
                             disponibilidad === 'no-disponible' ? '❌ No disponible' : 
                             'Seleccione horario'}
                        </strong>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                    <button type="button" onClick={onCancelar} className="btn-cancelar">
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading || calculando || disponibilidad === 'no-disponible'}
                        className="btn-crear"
                    >
                        {loading ? 'Creando reserva...' : 'Crear Reserva'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FormularioReserva;