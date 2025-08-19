import React, { useState } from 'react';
import { reservasService } from '../../services/reservasService';
import './CheckInButton.css';

const CheckInButton = ({ reserva, onCheckInSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCheckIn = async () => {
        if (!window.confirm(`¿Registrar check-in para ${reserva.cliente_nombre}?`)) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await reservasService.registrarCheckIn(reserva.id);
            
            if (result.success) {
                alert('✅ Check-in registrado exitosamente');
                if (onCheckInSuccess) {
                    onCheckInSuccess();
                }
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!window.confirm(`¿Registrar check-out para ${reserva.cliente_nombre}?`)) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await reservasService.registrarCheckOut(reserva.id);
            
            if (result.success) {
                alert('✅ Check-out registrado exitosamente');
                if (onCheckInSuccess) {
                    onCheckInSuccess();
                }
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getTiempoTranscurrido = () => {
        if (!reserva.hora_ingreso) return null;
        
        const ingreso = new Date(reserva.hora_ingreso);
        const ahora = new Date();
        const diffMs = ahora - ingreso;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        
        return `${diffHours}h ${remainingMins}m`;
    };

    if (error) {
        return (
            <div className="checkin-error">
                <span>Error: {error}</span>
                <button onClick={() => setError('')} className="btn-cerrar-error">×</button>
            </div>
        );
    }

    return (
        <div className="checkin-container">
            {reserva.estado_actual === 'pendiente' && (
                <button 
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="btn-checkin"
                >
                    {loading ? 'Procesando...' : 'Check-in'}
                </button>
            )}
            
            {reserva.estado_actual === 'presente' && (
                <div className="en-curso">
                    <span className="badge-en-curso">En curso</span>
                    <span className="tiempo">{getTiempoTranscurrido()}</span>
                    <button 
                        onClick={handleCheckOut}
                        disabled={loading}
                        className="btn-checkout"
                    >
                        {loading ? 'Procesando...' : 'Check-out'}
                    </button>
                </div>
            )}
            
            {reserva.estado_actual === 'finalizada' && (
                <span className="badge-finalizada">Finalizada</span>
            )}
            
            {reserva.estado_actual === 'ausente' && (
                <span className="badge-ausente">Ausente</span>
            )}
        </div>
    );
};

export default CheckInButton;