const RegisterForm = ({ toggleAuthMode }: { toggleAuthMode: () => void }) => (
  <form className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-base font-medium text-slate-700 mb-2">Usuario:</label>
        <input
          type="text"
          className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Nombre de usuario"
          required
        />
      </div>
      
      <div>
        <label className="block text-base font-medium text-slate-700 mb-2">Fecha Nacimiento:</label>
        <input
          type="date"
          className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-base font-medium text-slate-700 mb-2">Nombres:</label>
        <input
          type="text"
          className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Tus nombres"
          required
        />
      </div>
      
      <div>
        <label className="block text-base font-medium text-slate-700 mb-2">Apellidos:</label>
        <input
          type="text"
          className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Tus apellidos"
          required
        />
      </div>
    </div>

    <div>
      <label className="block text-base font-medium text-slate-700 mb-2">Correo Electrónico:</label>
      <input
        type="email"
        className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="tucorreo@ejemplo.com"
        required
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-base font-medium text-slate-700 mb-2">Contraseña:</label>
        <input
          type="password"
          className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="••••••••"
          required
        />
      </div>
      
      <div>
        <label className="block text-base font-medium text-slate-700 mb-2">Confirmar Contraseña:</label>
        <input
          type="password"
          className="w-full px-4 py-3 text-base bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="••••••••"
          required
        />
      </div>
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
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      Registrarse
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

export default RegisterForm;