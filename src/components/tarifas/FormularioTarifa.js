import React, { useState, useEffect } from 'react';
import './FormularioTarifa.css';

const FormularioTarifa = ({ tarifaEditando, onTarifaGuardada, onCancelar }) => {
    const [formData, setFormData] = useState({
        tipo_agrupacion: 'Standard',
        duracion_min: '',
        duracion_max: '',
        precio_fijo: '',
        precio_por_hora: '',
        activo: true
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [tipoPrecio, setTipoPrecio] = useState('fijo'); // 'fijo', 'variable', 'ambos'

    useEffect(() => {
        if (tarifaEditando) {
            setFormData({
                id_tarifa: tarifaEditando.id_tarifa,
                tipo_agrupacion: tarifaEditando.tipo_agrupacion,
                duracion_min: tarifaEditando.duracion_min,
                duracion_max: tarifaEditando.duracion_max || '',
                precio_fijo: tarifaEditando.precio_fijo || '',
                precio_por_hora: tarifaEditando.precio_por_hora || '',
                activo: tarifaEditando.activo == 1
            });

            // Determinar tipo de precio
            if (tarifaEditando.precio_fijo && tarifaEditando.precio_por_hora) {
                setTipoPrecio('ambos');
            } else if (tarifaEditando.precio_por_hora) {
                setTipoPrecio('variable');
            } else {
                setTipoPrecio('fijo');
            }
        }
    }, [tarifaEditando]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Limpiar error del campo modificado
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleTipoPrecioChange = (tipo) => {
        setTipoPrecio(tipo);
        
        // Limpiar campos según el tipo seleccionado
        if (tipo === 'fijo') {
            setFormData(prev => ({ ...prev, precio_por_hora: '' }));
        } else if (tipo === 'variable') {
            setFormData(prev => ({ ...prev, precio_fijo: '' }));
        }
    };

    const validarFormulario = () => {
        const nuevosErrors = {};

        if (!formData.tipo_agrupacion) {
            nuevosErrors.tipo_agrupacion = 'Seleccione un tipo de agrupación';
        }

        if (!formData.duracion_min || formData.duracion_min <= 0) {
            nuevosErrors.duracion_min = 'La duración mínima debe ser mayor a 0';
        }

        if (formData.duracion_max && parseFloat(formData.duracion_max) < parseFloat(formData.duracion_min)) {
            nuevosErrors.duracion_max = 'La duración máxima debe ser mayor o igual a la mínima';
        }

        if (tipoPrecio === 'fijo' || tipoPrecio === 'ambos') {
            if (!formData.precio_fijo || formData.precio_fijo <= 0) {
                nuevosErrors.precio_fijo = 'El precio fijo debe ser mayor a 0';
            }
        }

        if (tipoPrecio === 'variable' || tipoPrecio === 'ambos') {
            if (!formData.precio_por_hora || formData.precio_por_hora <= 0) {
                nuevosErrors.precio_por_hora = 'El precio por hora debe ser mayor a 0';
            }
        }

        setErrors(nuevosErrors);
        return Object.keys(nuevosErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validarFormulario()) {
            return;
        }

        setLoading(true);
        
        try {
            // Determinar URL base según el entorno
            const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const url = isDevelopment 
                ? 'http://localhost:8080/sala-ensayos/api/tarifas'
                : '/sala-ensayos/api/tarifas';
            const method = tarifaEditando ? 'PUT' : 'POST';
            
            // Preparar datos según el tipo de precio seleccionado
            const dataToSend = {
                ...formData,
                precio_fijo: (tipoPrecio === 'fijo' || tipoPrecio === 'ambos') ? formData.precio_fijo : null,
                precio_por_hora: (tipoPrecio === 'variable' || tipoPrecio === 'ambos') ? formData.precio_por_hora : null,
                duracion_max: formData.duracion_max || null
            };

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();
            
            if (data.success) {
                onTarifaGuardada();
            } else {
                alert('Error al guardar la tarifa: ' + data.message);
            }
        } catch (error) {
            alert('Error de conexión al guardar la tarifa');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderCamposPrecio = () => {
        switch (tipoPrecio) {
            case 'fijo':
                return (
                    <div className="campo-grupo">
                        <label htmlFor="precio_fijo">
                            Precio Fijo *
                            <span className="campo-ayuda">Precio fijo para esta duración específica</span>
                        </label>
                        <input
                            type="number"
                            id="precio_fijo"
                            name="precio_fijo"
                            value={formData.precio_fijo}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            placeholder="11000.00"
                            className={errors.precio_fijo ? 'error' : ''}
                        />
                        {errors.precio_fijo && <span className="error-message">{errors.precio_fijo}</span>}
                    </div>
                );

            case 'variable':
                return (
                    <div className="campo-grupo">
                        <label htmlFor="precio_por_hora">
                            Precio por Hora *
                            <span className="campo-ayuda">Precio por cada hora de reserva</span>
                        </label>
                        <input
                            type="number"
                            id="precio_por_hora"
                            name="precio_por_hora"
                            value={formData.precio_por_hora}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            placeholder="8500.00"
                            className={errors.precio_por_hora ? 'error' : ''}
                        />
                        {errors.precio_por_hora && <span className="error-message">{errors.precio_por_hora}</span>}
                    </div>
                );

            case 'ambos':
                return (
                    <>
                        <div className="campo-grupo">
                            <label htmlFor="precio_fijo">
                                Precio Fijo *
                                <span className="campo-ayuda">Precio fijo para esta duración específica</span>
                            </label>
                            <input
                                type="number"
                                id="precio_fijo"
                                name="precio_fijo"
                                value={formData.precio_fijo}
                                onChange={handleInputChange}
                                min="0"
                                step="0.01"
                                placeholder="11000.00"
                                className={errors.precio_fijo ? 'error' : ''}
                            />
                            {errors.precio_fijo && <span className="error-message">{errors.precio_fijo}</span>}
                        </div>

                        <div className="campo-grupo">
                            <label htmlFor="precio_por_hora">
                                Precio por Hora *
                                <span className="campo-ayuda">Precio por cada hora adicional</span>
                            </label>
                            <input
                                type="number"
                                id="precio_por_hora"
                                name="precio_por_hora"
                                value={formData.precio_por_hora}
                                onChange={handleInputChange}
                                min="0"
                                step="0.01"
                                placeholder="8500.00"
                                className={errors.precio_por_hora ? 'error' : ''}
                            />
                            {errors.precio_por_hora && <span className="error-message">{errors.precio_por_hora}</span>}
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className="formulario-tarifa">
            <div className="formulario-header">
                <h3>
                    {tarifaEditando ? '✏️ Editar Tarifa' : '➕ Nueva Tarifa'}
                </h3>
                <p>
                    {tarifaEditando 
                        ? 'Modifique los datos de la tarifa existente' 
                        : 'Configure una nueva tarifa para el sistema'
                    }
                </p>
            </div>

            <form onSubmit={handleSubmit} className="tarifa-form">
                <div className="campos-principales">
                    <div className="campo-grupo">
                        <label htmlFor="tipo_agrupacion">
                            Tipo de Agrupación *
                            <span className="campo-ayuda">Standard (1-5 miembros) o Extended (6+ miembros)</span>
                        </label>
                        <select
                            id="tipo_agrupacion"
                            name="tipo_agrupacion"
                            value={formData.tipo_agrupacion}
                            onChange={handleInputChange}
                            className={errors.tipo_agrupacion ? 'error' : ''}
                        >
                            <option value="Standard">👥 Standard (1-5 miembros)</option>
                            <option value="Extended">🎸 Extended (6+ miembros)</option>
                        </select>
                        {errors.tipo_agrupacion && <span className="error-message">{errors.tipo_agrupacion}</span>}
                    </div>

                    <div className="duracion-campos">
                        <div className="campo-grupo">
                            <label htmlFor="duracion_min">
                                Duración Mínima (horas) *
                                <span className="campo-ayuda">Duración mínima en horas (ej: 1.5)</span>
                            </label>
                            <input
                                type="number"
                                id="duracion_min"
                                name="duracion_min"
                                value={formData.duracion_min}
                                onChange={handleInputChange}
                                min="0.1"
                                step="0.1"
                                placeholder="1.0"
                                className={errors.duracion_min ? 'error' : ''}
                            />
                            {errors.duracion_min && <span className="error-message">{errors.duracion_min}</span>}
                        </div>

                        <div className="campo-grupo">
                            <label htmlFor="duracion_max">
                                Duración Máxima (horas)
                                <span className="campo-ayuda">Opcional. Déjelo vacío para "ilimitado"</span>
                            </label>
                            <input
                                type="number"
                                id="duracion_max"
                                name="duracion_max"
                                value={formData.duracion_max}
                                onChange={handleInputChange}
                                min="0.1"
                                step="0.1"
                                placeholder="Ilimitado"
                                className={errors.duracion_max ? 'error' : ''}
                            />
                            {errors.duracion_max && <span className="error-message">{errors.duracion_max}</span>}
                        </div>
                    </div>
                </div>

                <div className="precio-seccion">
                    <h4>💰 Configuración de Precios</h4>
                    
                    <div className="tipo-precio-selector">
                        <label>
                            <input
                                type="radio"
                                name="tipoPrecio"
                                value="fijo"
                                checked={tipoPrecio === 'fijo'}
                                onChange={() => handleTipoPrecioChange('fijo')}
                            />
                            <span className="radio-label">Precio Fijo</span>
                            <small>Un precio fijo para esta duración específica</small>
                        </label>

                        <label>
                            <input
                                type="radio"
                                name="tipoPrecio"
                                value="variable"
                                checked={tipoPrecio === 'variable'}
                                onChange={() => handleTipoPrecioChange('variable')}
                            />
                            <span className="radio-label">Precio por Hora</span>
                            <small>Precio calculado por hora de reserva</small>
                        </label>

                        <label>
                            <input
                                type="radio"
                                name="tipoPrecio"
                                value="ambos"
                                checked={tipoPrecio === 'ambos'}
                                onChange={() => handleTipoPrecioChange('ambos')}
                            />
                            <span className="radio-label">Ambos Precios</span>
                            <small>Precio fijo + precio por hora adicional</small>
                        </label>
                    </div>

                    {renderCamposPrecio()}
                </div>

                <div className="estado-seccion">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="activo"
                            checked={formData.activo}
                            onChange={handleInputChange}
                        />
                        <span className="checkmark"></span>
                        <span className="checkbox-text">
                            Tarifa Activa
                            <small>Solo las tarifas activas se usan en los cálculos</small>
                        </span>
                    </label>
                </div>

                <div className="formulario-acciones">
                    <button 
                        type="button" 
                        onClick={onCancelar}
                        className="btn-cancelar"
                        disabled={loading}
                    >
                        ❌ Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="btn-guardar"
                        disabled={loading}
                    >
                        {loading ? '⏳ Guardando...' : (tarifaEditando ? '💾 Actualizar' : '💾 Crear Tarifa')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FormularioTarifa;