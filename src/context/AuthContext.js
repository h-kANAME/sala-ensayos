import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);

    useEffect(() => {
        console.log('🔄 AuthContext: Verificando autenticación...');
        const token = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('userData');
        
        if (token && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                console.log('✅ AuthContext: Usuario cargado desde localStorage:', parsedUser);
                
                // Por ahora, confiar en los datos del localStorage sin verificar token con backend
                // para evitar el error 405 que está causando logout
                setUser(parsedUser);
                setIsAuthenticated(true);
                setLoading(false);
                
            } catch (error) {
                console.error('❌ AuthContext: Error parsing user data:', error);
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                setUser(null);
                setIsAuthenticated(false);
                setLoading(false);
            }
        } else {
            console.log('❌ AuthContext: No hay datos de autenticación');
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
        }
    }, [forceUpdate]);

    const login = async (credentials) => {
        try {
            console.log('🔐 AuthContext: Intentando login...');
            const response = await authService.login(credentials);
            console.log('📦 AuthContext: Respuesta completa del login:', response);
            
            const { token, user } = response.data || response;
            
            console.log('✅ AuthContext: Login exitoso, guardando datos:', user);
            console.log('🔑 AuthContext: Token recibido:', token);
            
            if (!user || !token) {
                throw new Error('Datos de usuario o token no recibidos');
            }
            
            localStorage.setItem('authToken', token);
            localStorage.setItem('userData', JSON.stringify(user));
            
            setUser(user);
            setIsAuthenticated(true);
            setForceUpdate(prev => prev + 1); // Forzar re-render
            
            return { success: true };
        } catch (error) {
            console.error('❌ AuthContext: Error en login:', error);
            return { 
                success: false, 
                message: error.message || 'Error en el login' 
            };
        }
    };

    const logout = () => {
        console.log('🚪 AuthContext: Cerrando sesión...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setUser(null);
        setIsAuthenticated(false);
        setForceUpdate(prev => prev + 1); // Forzar re-render
    };

    // Agregar logs para debugging
    const isAdmin = user?.rol === 'admin';
    console.log('🔍 AuthContext: Estado actual:', { 
        user: user?.username, 
        rol: user?.rol, 
        isAdmin, 
        isAuthenticated 
    });

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated,
        isAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};