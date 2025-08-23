import React from 'react';
import './Paginador.css';

const Paginador = ({ 
    paginaActual, 
    totalPaginas, 
    totalRegistros, 
    registrosPorPagina, 
    onCambioPagina 
}) => {
    const generarBotonesPaginas = () => {
        const botones = [];
        const maxBotones = 5;
        let inicio = Math.max(1, paginaActual - Math.floor(maxBotones / 2));
        let fin = Math.min(totalPaginas, inicio + maxBotones - 1);
        
        // Ajustar inicio si estamos cerca del final
        if (fin - inicio + 1 < maxBotones) {
            inicio = Math.max(1, fin - maxBotones + 1);
        }

        // Botón primera página si no está visible
        if (inicio > 1) {
            botones.push(
                <button
                    key="primera"
                    className="btn-pagina"
                    onClick={() => onCambioPagina(1)}
                >
                    1
                </button>
            );
            if (inicio > 2) {
                botones.push(<span key="puntos-inicio" className="puntos">...</span>);
            }
        }

        // Botones de páginas
        for (let i = inicio; i <= fin; i++) {
            botones.push(
                <button
                    key={i}
                    className={`btn-pagina ${i === paginaActual ? 'activa' : ''}`}
                    onClick={() => onCambioPagina(i)}
                >
                    {i}
                </button>
            );
        }

        // Botón última página si no está visible
        if (fin < totalPaginas) {
            if (fin < totalPaginas - 1) {
                botones.push(<span key="puntos-fin" className="puntos">...</span>);
            }
            botones.push(
                <button
                    key="ultima"
                    className="btn-pagina"
                    onClick={() => onCambioPagina(totalPaginas)}
                >
                    {totalPaginas}
                </button>
            );
        }

        return botones;
    };

    if (totalPaginas <= 1) return null;

    const inicioRango = (paginaActual - 1) * registrosPorPagina + 1;
    const finRango = Math.min(paginaActual * registrosPorPagina, totalRegistros);

    return (
        <div className="paginador">
            <div className="paginador-info">
                Mostrando {inicioRango} - {finRango} de {totalRegistros} registros
            </div>
            
            <div className="paginador-controles">
                <button
                    className="btn-pagina"
                    disabled={paginaActual === 1}
                    onClick={() => onCambioPagina(paginaActual - 1)}
                >
                    ‹ Anterior
                </button>
                
                {generarBotonesPaginas()}
                
                <button
                    className="btn-pagina"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => onCambioPagina(paginaActual + 1)}
                >
                    Siguiente ›
                </button>
            </div>
        </div>
    );
};

export default Paginador;