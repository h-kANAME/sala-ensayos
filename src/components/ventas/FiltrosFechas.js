import React, { useState, useEffect } from 'react';
import './FiltrosFechas.css';

const FiltrosFechas = ({ onFiltrosChange, filtrosIniciales }) => {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    // Inicializar con filtros proporcionados o fechas de hoy
    useEffect(() => {
        if (filtrosIniciales?.fecha_inicio && filtrosIniciales?.fecha_fin) {
            setFechaInicio(filtrosIniciales.fecha_inicio);
            setFechaFin(filtrosIniciales.fecha_fin);
        } else {
            const hoy = new Date().toISOString().split('T')[0];
            setFechaInicio(hoy);
            setFechaFin(hoy);
        }
    }, [filtrosIniciales]);

    const aplicarFiltros = () => {
        if (!fechaInicio || !fechaFin) {
            alert('Por favor selecciona ambas fechas');
            return;
        }

        if (fechaInicio > fechaFin) {
            alert('La fecha de inicio no puede ser mayor que la fecha fin');
            return;
        }

        onFiltrosChange({
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin
        });
    };

    return (
        <div className="filtros-fechas">
            <div className="filtros-container">
                <h3>Filtros por Fecha</h3>
                <div className="fechas-row">
                    <div className="fecha-campo">
                        <label>Fecha Inicio:</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                    </div>
                    <div className="fecha-campo">
                        <label>Fecha Fin:</label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                        />
                    </div>
                    <div className="boton-campo">
                        <button 
                            className="btn btn-primary"
                            onClick={aplicarFiltros}
                        >
                            Filtrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FiltrosFechas;