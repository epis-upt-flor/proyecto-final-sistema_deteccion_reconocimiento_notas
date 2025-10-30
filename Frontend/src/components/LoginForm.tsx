const LoginForm = ({ toggleAuthMode }: { toggleAuthMode: () => void }) => (
  <form className="space-y-6">
    <div>
      <label className="block text-base font-medium text-slate-700 mb-2">Usuario:</label>
      <input
        type="text"
        className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Tu nombre de usuario"
        required
      />
    </div>

    <div>
      <label className="block text-base font-medium text-slate-700 mb-2">Contraseña:</label>
      <input
        type="password"
        className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="••••••••"
        required
      />
    </div>

    <button
      type="submit"
      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
    >
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

export default LoginForm;