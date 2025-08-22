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

        {/* Rutas preparadas para futuros módulos:
            /reservas, /productos, /ventas, /reportes
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
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;