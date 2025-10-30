import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const API_BASE_URL = 'http://localhost:8000';

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
}

const AuthCard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/login';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAuthMode = () => {
    if (isLogin) {
      navigate('/register', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  // Función para login
const handleLogin = async (credentials: LoginData): Promise<void> => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error en el login');
    }

    const data: AuthResponse = await response.json();

    // Guardar token en localStorage
    localStorage.setItem('auth_token', data.access_token);

    // Redirigir al dashboard
    window.location.href = '/app/dashboard';

  } catch (error) {
    setError(error instanceof Error ? error.message : 'Error desconocido');
  } finally {
    setIsLoading(false);
  }
};

  // Función para registro (ya estaba correcta, solo por consistencia)
const handleRegister = async (userData: RegisterData): Promise<void> => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error en el registro');
    }

    // Registro exitoso, redirigir a login con mensaje
    navigate('/login?message=Registro+exitoso.+Por+favor+inicia+sesión');

  } catch (error) {
    setError(error instanceof Error ? error.message : 'Error desconocido');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="w-full max-w-5xl">
        <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-xl overflow-hidden min-h-[500px]">
          
          {/* Sección del formulario (60%) */}
          <div className="w-full md:w-7/12 p-8 md:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center">
                <svg 
                  className="w-9 h-9 mr-2 text-indigo-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                ChopinPlay
              </h2>
              <p className="text-lg text-slate-600 mt-2">
                {isLogin ? 'Inicia sesión con tu cuenta' : 'Regístrate para comenzar'}
              </p>
            </div>

            {/* Mostrar error */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'register'}
                initial={{ x: isLogin ? -25 : 25, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: isLogin ? 25 : -25, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                {isLogin ? 
                  <LoginForm 
                    isLoading={isLoading}
                    onSubmit={handleLogin}
                    toggleAuthMode={toggleAuthMode}
                  /> : 
                  <RegisterForm 
                    isLoading={isLoading}
                    onSubmit={handleRegister}
                    toggleAuthMode={toggleAuthMode}
                  />
                }
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sección de información (40%) */}
          <div className="hidden md:block w-5/12 bg-[url('https://i.pinimg.com/736x/3e/d0/36/3ed0368b9f1b8081d458966966ccd362.jpg')] bg-cover bg-center relative">
            <div className="absolute inset-0 bg-indigo-900/75"></div>
            
            <div className="relative z-10 h-full flex items-center justify-center p-10">
              <div className="text-center w-full max-w-xs">
                <svg 
                  className="w-16 h-16 mx-auto mb-6 text-amber-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="1.5" 
                    d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V3h-2z"
                  />
                </svg>
                
                <h3 className="text-2xl font-light text-white mb-6 leading-tight">
                  {isLogin 
                    ? '"Donde la música cobra vida"'
                    : '"Comienza tu viaje musical hoy"'}
                </h3>
                
                <div className="w-24 h-px bg-white/40 mx-auto my-6"></div>
                
                <p className="text-base text-indigo-100 px-4">
                  {isLogin
                    ? 'Vuelve a tu espacio musical personalizado'
                    : 'Únete a nuestra comunidad de músicos y aprendices'}
                </p>
              </div>
            </div>

            <div className="absolute inset-0 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute text-amber-200 opacity-40"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    fontSize: `${Math.random() * 1.5 + 0.8}rem`,
                    animation: `float ${Math.random() * 8 + 5}s linear infinite`,
                    animationDelay: `${Math.random() * 3}s`
                  }}
                >
                  {i % 2 === 0 ? '♩' : '♪'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente LoginForm
const LoginForm = ({ isLoading, onSubmit, toggleAuthMode }: { 
  isLoading: boolean; 
  onSubmit: (data: LoginData) => void;
  toggleAuthMode: () => void;
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label className="block text-base font-medium text-slate-700 mb-2">Usuario:</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Tu nombre de usuario"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-base font-medium text-slate-700 mb-2">Contraseña:</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="••••••••"
          required
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </>
        ) : (
          <>
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            Iniciar Sesión
          </>
        )}
      </button>

      <div className="text-center pt-4">
        <button 
          type="button"
          onClick={toggleAuthMode}
          className="text-sm text-indigo-600 hover:text-indigo-500 inline-flex items-center"
        >
          ¿No tienes cuenta? Regístrate
          <svg 
            className="w-4 h-4 ml-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </form>
  );
};

// Componente RegisterForm
const RegisterForm = ({ isLoading, onSubmit, toggleAuthMode }: { 
  isLoading: boolean; 
  onSubmit: (data: RegisterData) => void;
  toggleAuthMode: () => void;
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    fecha_nacimiento: ''
  });

  const validateDate = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación frontend
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    // Validar formato de fecha
    if (!validateDate(formData.fecha_nacimiento)) {
      alert('Por favor ingresa una fecha válida en formato YYYY-MM-DD');
      return;
    }

    const { confirmPassword, ...submitData } = formData;
    onSubmit(submitData as RegisterData);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-base font-medium text-slate-700 mb-2">Usuario:</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Nombre de usuario"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block text-base font-medium text-slate-700 mb-2">Fecha Nacimiento:</label>
          <input
            type="date"
            value={formData.fecha_nacimiento}
            onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
            className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-base font-medium text-slate-700 mb-2">Nombres:</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Tus nombres"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block text-base font-medium text-slate-700 mb-2">Apellidos:</label>
          <input
            type="text"
            value={formData.apellido}
            onChange={(e) => setFormData({...formData, apellido: e.target.value})}
            className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Tus apellidos"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label className="block text-base font-medium text-slate-700 mb-2">Correo Electrónico:</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="tucorreo@ejemplo.com"
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-base font-medium text-slate-700 mb-2">Contraseña:</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="••••••••"
            required
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial
          </p>
        </div>
        
        <div>
          <label className="block text-base font-medium text-slate-700 mb-2">Confirmar Contraseña:</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="••••••••"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </>
        ) : (
          <>
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Registrarse
          </>
        )}
      </button>

      <div className="text-center pt-4">
        <button 
          type="button"
          onClick={toggleAuthMode}
          className="text-sm text-indigo-600 hover:text-indigo-500 inline-flex items-center"
        >
          ¿Ya tienes cuenta? Inicia sesión
          <svg 
            className="w-4 h-4 ml-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default AuthCard;