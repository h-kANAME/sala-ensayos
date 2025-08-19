import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(credentials);
        
        if (result.success) {
            navigate('/dashboard'); // Redirigir después de login exitoso
        } else {
            setError(result.message);
        }
        
        setLoading(false);
    };

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Sala de Ensayos - JAM</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Usuario:</label>
                        <input
                            type="text"
                            name="username"
                            value={credentials.username}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Ingresa tu usuario"
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña:</label>
                        <input
                            type="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Ingresa tu contraseña"
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="login-button"
                    >
                        {loading ? 'Iniciando sesión...' : 'Ingresar'}
                    </button>
                    
                    <div className="demo-credentials">
                        <p>Credenciales de demo:</p>
                        <p>Usuario: <strong>admin</strong> | Contraseña: <strong>password</strong></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;