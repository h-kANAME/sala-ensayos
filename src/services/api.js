// Configuración base de la API
const API_BASE_URL = 'http://localhost:8080/public/api';

// Función helper para hacer requests
const apiRequest = async (url, options = {}) => {
  console.log(`🚀 API Request: ${options.method || 'GET'} ${API_BASE_URL}${url}`);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  // Si hay un token, agregarlo
  const token = localStorage.getItem('token');
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  // Debug de datos enviados
  if (options.body) {
    console.log('📤 Datos enviados:', options.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, defaultOptions);
    
    console.log(`📥 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Response data:', data);
    
    return data;
  } catch (error) {
    console.error('🔥 API Error:', error);
    throw error;
  }
};

// Exportar función para otros servicios
export { apiRequest, API_BASE_URL };

// Funciones específicas de la API
export const api = {
  // GET request
  get: (url) => apiRequest(url, { method: 'GET' }),
  
  // POST request  
  post: (url, data) => apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // PUT request
  put: (url, data) => apiRequest(url, {
    method: 'PUT', 
    body: JSON.stringify(data),
  }),
  
  // DELETE request
  delete: (url) => apiRequest(url, { method: 'DELETE' }),
};