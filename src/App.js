import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import ClienteNuevo from './pages/ClienteNuevo';
import ClienteEditar from './pages/ClienteEditar';
import Productos from './pages/Productos';
import ProductoNuevo from './pages/ProductoNuevo';
import ProductoEditar from './pages/ProductoEditar';
import Tarifas from './pages/Tarifas';
import Ventas from './pages/Ventas';
import VentaNueva from './pages/VentaNueva';
import VentaEditar from './pages/VentaEditar';
import ReservasPublicas from './pages/ReservasPublicas';
import Loading from './components/common/Loading';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  console.log('🛡️ ProtectedRoute: Verificando acceso...', { isAuthenticated, loading, user: user?.username });
  
  if (loading) {
    return <Loading />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function AppContent() {
  return (
    <div className="App">
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        {/* Ruta pública para reservas - sin autenticación */}
        <Route path="/reservas" element={<ReservasPublicas />} />

        {/* Rutas protegidas - Cada página incluye Layout internamente */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Módulo Clientes */}
        <Route path="/clientes" element={
          <ProtectedRoute>
            <Clientes />
          </ProtectedRoute>
        } />
        <Route path="/clientes/nuevo" element={
          <ProtectedRoute>
            <ClienteNuevo />
          </ProtectedRoute>
        } />
        <Route path="/clientes/editar/:id" element={
          <ProtectedRoute>
            <ClienteEditar />
          </ProtectedRoute>
        } />

        {/* Módulo Productos */}
        <Route path="/productos" element={
          <ProtectedRoute>
            <Productos />
          </ProtectedRoute>
        } />
        <Route path="/productos/nuevo" element={
          <ProtectedRoute>
            <ProductoNuevo />
          </ProtectedRoute>
        } />
        <Route path="/productos/editar/:id" element={
          <ProtectedRoute>
            <ProductoEditar />
          </ProtectedRoute>
        } />

        {/* Módulo Tarifas - Solo para administradores */}
        <Route path="/tarifas" element={
          <ProtectedRoute>
            <Tarifas />
          </ProtectedRoute>
        } />

        {/* Módulo Ventas */}
        <Route path="/ventas" element={
          <ProtectedRoute>
            <Ventas />
          </ProtectedRoute>
        } />
        <Route path="/ventas/nueva" element={
          <ProtectedRoute>
            <VentaNueva />
          </ProtectedRoute>
        } />
        <Route path="/ventas/editar/:id" element={
          <ProtectedRoute>
            <VentaEditar />
          </ProtectedRoute>
        } />

        {/* Rutas preparadas para futuros módulos:
            /reservas, /reportes
            Cada página debe seguir el patrón:
            - Página principal: /modulo
            - Nuevo: /modulo/nuevo  
            - Editar: /modulo/editar/:id
            - Todas las páginas incluyen Layout internamente
        */}

        {/* Redirecciones */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}

function App() {
  // Detectar si estamos en producción para configurar el basename
  const basename = window.location.hostname !== 'localhost' && 
                   window.location.hostname !== '127.0.0.1' ? '/sala-ensayos' : '';
                   
  return (
    <AuthProvider>
      <Router basename={basename}>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;