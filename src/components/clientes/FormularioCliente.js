import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientesService } from '../../services/clientesService';
import './FormularioCliente.css';

const FormularioCliente = () => {
    const { id: clienteId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(!!clienteId);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        nombre_banda: '',
        contacto_nombre: '',
        contacto_email: '',
        contacto_telefono: '',
        tipo_agrupacion: 'Standard',
        direccion: '',
        notas: ''
    });

    useEffect(() => {
        if (clienteId) {
            cargarCliente();
        }
    }, [clienteId]);

    const cargarCliente = async () => {
        try {
            console.log('🔍 Cargando cliente ID:', clienteId);
            const response = await clientesService.obtenerClientePorId(clienteId);
            console.log('✅ Cliente cargado:', response);
            const cliente = response.data || response;
            setFormData(cliente);
        } catch (err) {
            console.error('❌ Error cargando cliente:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            if (clienteId) {
                await clientesService.actualizarCliente(clienteId, formData);
            } else {
                await clientesService.crearCliente(formData);
            }
            navigate('/clientes');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Cargando...</div>;

    return (
        <div className="formulario-cliente">
            <h2>{clienteId ? 'Editar' : 'Nuevo'} Cliente</h2>
            
            {error && <div className="error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nombre de la Banda/Grupo *:</label>
                    <input
                        type="text"
                        name="nombre_banda"
                        value={formData.nombre_banda}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Persona de Contacto *:</label>
                    <input
                        type="text"
                        name="contacto_nombre"
                        value={formData.contacto_nombre}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        name="contacto_email"
                        value={formData.contacto_email}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Teléfono:</label>
                    <input
                        type="tel"
                        name="contacto_telefono"
                        value={formData.contacto_telefono}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Tipo Agrupación *:</label>
                    <select
                        name="tipo_agrupacion"
                        value={formData.tipo_agrupacion}
                        onChange={handleChange}
                        required
                        className="form-select"
                    >
                        <option value="Standard">Standard (1-5 integrantes)</option>
                        <option value="Extended">Extended (6+ integrantes)</option>
                    </select>
                    <small className="form-help">
                        Standard: Tarifas para bandas de 1 a 5 integrantes<br/>
                        Extended: Tarifas para bandas de 6 o más integrantes
                    </small>
                </div>

                <div className="form-group">
                    <label>Dirección:</label>
                    <input
                        type="text"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Notas:</label>
                    <textarea
                        name="notas"
                        value={formData.notas}
                        onChange={handleChange}
                        rows="3"
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" onClick={() => navigate('/clientes')}>
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FormularioCliente;