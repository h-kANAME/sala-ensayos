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
  const token = localStorage.getItem('authToken');
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
      
      // Intentar parsear el JSON de error para obtener el mensaje específico
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorText;
      } catch (parseError) {
        errorMessage = errorText;
      }
      
      // Crear error con información estructurada
      const error = new Error(errorMessage);
      error.response = {
        status: response.status,
        data: { message: errorMessage }
      };
      throw error;
    }

    // Verificar si hay contenido antes de intentar parsear JSON
    const responseText = await response.text();
    
    let data;
    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Error parsing JSON:', parseError);
        console.error('❌ Response text:', responseText);
        // Si no es JSON válido, usar el texto como respuesta
        data = { message: responseText };
      }
    } else {
      // Respuesta vacía, crear objeto por defecto
      data = { success: true, message: 'Operación completada exitosamente' };
    }
    
    console.log('✅ Response data:', data);
    console.log('✅ Response data type:', typeof data);
    console.log('✅ Response is array:', Array.isArray(data));
    
    return { data };
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