import { FaChartLine, FaHistory, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { GiPianoKeys } from 'react-icons/gi';
import { BsFillPatchCheckFill, BsGraphUp, BsClockHistory } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800">
      
      <header className="container mx-auto px-6 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium mb-8">
            <GiPianoKeys className="mr-2" /> Plataforma de Práctica para Piano
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 leading-tight">
            Practica <span className="font-semibold text-blue-600">Partituras</span> <br />
            con <span className="font-semibold text-blue-600">Retroalimentación</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Sube tus partituras de piano, practica con feedback inteligente y sigue tu progreso musical
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={handleLoginRedirect}
              className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 shadow-md"
            >
              <FaSignInAlt className="mr-2" /> Iniciar sesión
            </button>
            <button 
              onClick={handleRegisterRedirect}
              className="flex items-center justify-center bg-white border border-gray-300 hover:border-blue-300 text-gray-700 font-medium py-3 px-8 rounded-lg transition-all duration-200 shadow-sm"
            >
              <FaUserPlus className="mr-2" /> Registrarse
            </button>
          </div>
        </div>
      </header>

      
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light mb-4">
              Tu <span className="font-semibold text-blue-600">Estudio de Piano</span> Digital
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Todo lo que necesitas para practicar y mejorar como pianista autodidacta
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <FaChartLine className="text-3xl mb-4 text-blue-600" />,
                title: "Subida de Partituras",
                desc: "Carga partituras de piano en formato PDF o imagen para practicar",
                bg: "bg-blue-50 border border-blue-100"
              },
              {
                icon: <BsFillPatchCheckFill className="text-3xl mb-4 text-blue-600" />,
                title: "Práctica con Feedback",
                desc: "Sistema inteligente que analiza tu ejecución al piano y sugiere mejoras",
                bg: "bg-blue-50 border border-blue-100"
              },
              {
                icon: <BsGraphUp className="text-3xl mb-4 text-blue-600" />,
                title: "Métricas y Progreso",
                desc: "Seguimiento detallado de tu evolución como pianista",
                bg: "bg-blue-50 border border-blue-100"
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className={`${feature.bg} p-8 rounded-xl hover:shadow-lg transition-all duration-300`}
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center bg-white p-3 rounded-lg mb-4 shadow-sm">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light mb-4">
              Como <span className="font-semibold text-blue-600">Funciona</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Flujo simple para maximizar tu práctica de piano
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            {[
              {
                title: "Sube tu Partitura",
                desc: "Carga la partitura de piano que deseas practicar en segundos",
                icon: <FaChartLine className="text-xl" />,
                step: "1"
              },
              {
                title: "Practica con Feedback",
                desc: "Toca tu piano mientras el sistema analiza tu ejecución",
                icon: <GiPianoKeys className="text-xl" />,
                step: "2"
              },
              {
                title: "Revisa Métricas",
                desc: "Analiza tu progreso con gráficos y estadísticas detalladas",
                icon: <BsGraphUp className="text-xl" />,
                step: "3"
              },
              {
                title: "Mejora Continuamente",
                desc: "Usa el historial para identificar áreas de mejora en tu piano",
                icon: <FaHistory className="text-xl" />,
                step: "4"
              }
            ].map((step, index) => (
              <div 
                key={index} 
                className="flex items-start mb-12 last:mb-0"
              >
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-semibold text-lg mr-6 flex-shrink-0 shadow-md">
                  {step.step}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light mb-4">
              Para <span className="font-semibold text-blue-600">Pianistas</span> Autodidactas
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Seguimiento de Progreso</h3>
              <ul className="space-y-3">
                {[
                  "Historial completo de prácticas de piano",
                  "Métricas de precisión y timing",
                  "Evolución técnica documentada",
                  "Comparativa con sesiones anteriores"
                ].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <FaChartLine className="text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Herramientas de Análisis</h3>
              <ul className="space-y-3">
                {[
                  "Detección de errores en tiempo real",
                  "Sugerencias de práctica específicas para piano",
                  "Gráficos de rendimiento musical",
                  "Reportes de progreso automáticos"
                ].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <BsFillPatchCheckFill className="text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-8">
            Especializado en <span className="font-semibold">Piano</span>
          </h2>
          <div className="flex justify-center mb-8">
            <GiPianoKeys className="text-6xl" />
          </div>
          <p className="text-blue-100 max-w-2xl mx-auto">
            ChopinPlay está diseñado específicamente para pianistas, con herramientas 
            optimizadas para el aprendizaje y práctica del piano.
          </p>
        </div>
      </section>

      
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-light mb-6 text-gray-800">
              Comienza tu <span className="font-semibold">Práctica Musical</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Sube tu primera partitura de piano y descubre el poder de la práctica con feedback inteligente
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={handleLoginRedirect}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-10 rounded-lg transition-all duration-200 shadow-md"
              >
                <FaSignInAlt className="mr-2" /> Iniciar sesión
              </button>
              <button 
                onClick={handleRegisterRedirect}
                className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-medium py-3 px-10 rounded-lg transition-all duration-200 hover:border-blue-300"
              >
                <BsClockHistory className="mr-2" /> Ver Ejemplo
              </button>
            </div>
          </div>
        </div>
      </section>

      
      <footer className="py-12 bg-gray-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="flex justify-center space-x-6 mb-6">
            <GiPianoKeys className="text-3xl text-blue-400" />
          </div>
          <p className="text-gray-400">
            ChopinPlay - Plataforma de práctica musical para pianistas autodidactas
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;