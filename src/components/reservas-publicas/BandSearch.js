import React, { useState, useEffect, useRef } from 'react';
import './BandSearch.css';

const BandSearch = ({ onBandSelected, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchError, setSearchError] = useState('');
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounce search
  useEffect(() => {
    if (searchTerm.length < 2) {
      setBands([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      searchBands(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const searchBands = async (term) => {
    if (!term.trim()) return;
    
    setLoading(true);
    setSearchError('');
    
    try {
      const response = await fetch(`/api/public-reservas/search-bands?q=${encodeURIComponent(term)}`);
      const data = await response.json();
      
      if (data.success) {
        setBands(data.data);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else {
        setSearchError(data.message || 'Error al buscar bandas');
        setBands([]);
      }
    } catch (error) {
      console.error('Error searching bands:', error);
      setSearchError('Error de conexión. Verifique su conexión a internet.');
      setBands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedIndex(-1);
  };

  const handleBandSelect = (band) => {
    setSearchTerm(band.nombre_banda);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onBandSelected(band);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || bands.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < bands.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleBandSelect(bands[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleInputFocus = () => {
    if (bands.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (e) => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="band-search">
      <h2>Paso 1: Buscar tu banda</h2>
      <p className="step-description">
        Ingresa el nombre de tu banda para comenzar el proceso de reserva.
        Debe ser una banda registrada con email de contacto.
      </p>
      
      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Ejemplo: Los Rockeros, Banda de Jazz..."
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            autoComplete="off"
          />
          
          {loading && (
            <div className="search-loading">
              <div className="search-spinner"></div>
            </div>
          )}
        </div>

        {showSuggestions && bands.length > 0 && (
          <div ref={suggestionsRef} className="suggestions-dropdown">
            {bands.map((band, index) => (
              <div
                key={band.id}
                className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleBandSelect(band)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="band-name">{band.nombre_banda}</div>
                <div className="band-email">{band.contacto_email}</div>
              </div>
            ))}
          </div>
        )}

        {showSuggestions && bands.length === 0 && searchTerm.length >= 2 && !loading && (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <p>No se encontraron bandas con ese nombre</p>
            <p className="no-results-hint">
              Verifica que tu banda esté registrada con un email de contacto válido.
            </p>
          </div>
        )}
      </div>

      {(error || searchError) && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error || searchError}
        </div>
      )}

      {searchTerm.length < 2 && (
        <div className="search-hint">
          <div className="hint-icon">💡</div>
          <p>Ingresa al menos 2 caracteres para buscar tu banda</p>
        </div>
      )}

      <div className="search-help">
        <h3>¿No encuentras tu banda?</h3>
        <ul>
          <li>Verifica que el nombre esté escrito correctamente</li>
          <li>Tu banda debe estar registrada en nuestro sistema</li>
          <li>Debe tener un email de contacto registrado</li>
          <li>Contacta al administrador si necesitas registrar tu banda</li>
        </ul>
      </div>
    </div>
  );
};

export default BandSearch;