import React from 'react';

const SalaSelector = ({ salas, salaSeleccionada, onSalaChange }) => {
  return (
    <div className="sala-selector">
      <h3>Seleccionar Sala</h3>
      <div className="salas-list">
        {salas.map(sala => (
          <div
            key={sala.id}
            className={`sala-item ${salaSeleccionada?.id === sala.id ? 'selected' : ''}`}
            onClick={() => onSalaChange(sala)}
          >
            <div className="sala-info">
              <h4>{sala.nombre}</h4>
              <p className="sala-descripcion">
                {sala.descripcion || 'Sala de ensayos'}
              </p>
              <div className="sala-detalles">
                {sala.equipamiento && (
                  <span className="equipamiento">
                    🎵 {sala.equipamiento}
                  </span>
                )}
              </div>
            </div>
            
            {salaSeleccionada?.id === sala.id && (
              <div className="sala-selected-indicator">
                ✓
              </div>
            )}
          </div>
        ))}
      </div>
      
      {salas.length === 0 && (
        <div className="no-salas">
          <p>⚠️ No hay salas disponibles</p>
        </div>
      )}
    </div>
  );
};

export default SalaSelector;