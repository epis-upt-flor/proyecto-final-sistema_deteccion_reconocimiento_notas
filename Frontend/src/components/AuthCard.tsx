import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';

const AuthCard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = new URLSearchParams(location.search).get('action') !== 'register';

  const toggleAuthMode = () => {
    navigate(`?action=${isLogin ? 'register' : 'login'}`, { replace: true });
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
                    toggleAuthMode={toggleAuthMode}
                  /> : 
                  <RegisterForm 
                    toggleAuthMode={toggleAuthMode}
                  />
                }
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sección decorativa (40%) */}
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
                  {isLogin ? '"Donde la música cobra vida"' : '"Comienza tu viaje musical hoy"'}
                </h3>
                <div className="w-24 h-px bg-white/40 mx-auto my-6"></div>
                <p className="text-base text-indigo-100 px-4">
                  {isLogin ? 'Vuelve a tu espacio musical personalizado' : 'Únete a nuestra comunidad de músicos y aprendices'}
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

export default AuthCard;