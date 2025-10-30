import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import './SessionResult.css';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Interfaces TypeScript
interface PracticeSession {
  id: number;
  accuracy: number;
  rhythm: number;
  duration: string;
  totalNotes: number;
  correctNotes: number;
  mistakes: number;
  date: string;
  bpm: number;
}

interface SectionPerformance {
  section: string;
  accuracy: number;
  mistakes: number;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
}

interface CommonMistake {
  note: string;
  count: number;
  section: string;
  type: 'Nota' | 'Ritmo' | 'Digitación';
}

const SessionResult: React.FC = () => {
  // Datos mockeados de la sesión
  const sessionData: PracticeSession = {
    id: 123,
    accuracy: 82.5,
    rhythm: 78.3,
    duration: '25m 43s',
    totalNotes: 320,
    correctNotes: 264,
    mistakes: 56,
    date: '2023-10-20 15:30',
    bpm: 72
  };

  // Datos de desempeño por sección
  const sectionPerformance: SectionPerformance[] = [
    { section: 'Compases 1-8', accuracy: 92, mistakes: 4, difficulty: 'Fácil' },
    { section: 'Compases 9-16', accuracy: 85, mistakes: 8, difficulty: 'Medio' },
    { section: 'Compases 17-24', accuracy: 78, mistakes: 12, difficulty: 'Difícil' },
    { section: 'Compases 25-32', accuracy: 88, mistakes: 6, difficulty: 'Medio' },
    { section: 'Compases 33-40', accuracy: 72, mistakes: 16, difficulty: 'Difícil' },
    { section: 'Compases 41-48', accuracy: 95, mistakes: 2, difficulty: 'Fácil' }
  ];

  // Errores comunes
  const commonMistakes: CommonMistake[] = [
    { note: 'C5', count: 8, section: 'Compases 17-24', type: 'Nota' },
    { note: 'E4', count: 6, section: 'Compases 33-40', type: 'Ritmo' },
    { note: 'G4', count: 5, section: 'Compases 9-16', type: 'Digitación' },
    { note: 'A4', count: 4, section: 'Compases 25-32', type: 'Nota' },
    { note: 'D5', count: 3, section: 'Compases 17-24', type: 'Ritmo' }
  ];

  // Datos para el gráfico de secciones
  const sectionChartData = {
    labels: sectionPerformance.map(section => section.section),
    datasets: [
      {
        label: 'Precisión (%)',
        data: sectionPerformance.map(section => section.accuracy),
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Errores',
        data: sectionPerformance.map(section => section.mistakes),
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }
    ],
  };

  // Datos para el gráfico de doughnut
  const accuracyChartData = {
    labels: ['Correctas', 'Errores'],
    datasets: [
      {
        data: [sessionData.correctNotes, sessionData.mistakes],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const sectionChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Desempeño por Sección',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Porcentaje/Errores'
        }
      },
    },
  };

  const accuracyChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribución de Notas',
      },
    },
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return '#27ae60';
    if (accuracy >= 70) return '#f39c12';
    return '#e74c3c';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil': return '#27ae60';
      case 'Medio': return '#f39c12';
      case 'Difícil': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  const getMistakeTypeColor = (type: string) => {
    switch (type) {
      case 'Nota': return '#e74c3c';
      case 'Ritmo': return '#f39c12';
      case 'Digitación': return '#3498db';
      default: return '#7f8c8d';
    }
  };

  return (
    <div className="session-result">
      {/* Header */}
      <header className="result-header">
        <div className="header-content">
          <h1>Resultados de la Práctica</h1>
          <p className="session-date">
            {new Date(sessionData.date).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className="header-stats">
          <div className="main-stat">
            <span className="stat-label">Precisión General</span>
            <span 
              className="stat-value accuracy"
              style={{ color: getAccuracyColor(sessionData.accuracy) }}
            >
              {sessionData.accuracy}%
            </span>
          </div>
        </div>
      </header>

      {/* Resumen General */}
      <section className="summary-section">
        <h2>Resumen General</h2>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon">
              <i className="fas fa-bullseye"></i>
            </div>
            <div className="summary-content">
              <h3>Precisión</h3>
              <span 
                className="summary-value"
                style={{ color: getAccuracyColor(sessionData.accuracy) }}
              >
                {sessionData.accuracy}%
              </span>
              <span className="summary-detail">
                {sessionData.correctNotes} de {sessionData.totalNotes} notas correctas
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">
              <i className="fas fa-metronome"></i>
            </div>
            <div className="summary-content">
              <h3>Ritmo</h3>
              <span 
                className="summary-value"
                style={{ color: getAccuracyColor(sessionData.rhythm) }}
              >
                {sessionData.rhythm}%
              </span>
              <span className="summary-detail">
                Consistencia rítmica
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="summary-content">
              <h3>Duración</h3>
              <span className="summary-value">{sessionData.duration}</span>
              <span className="summary-detail">
                Tiempo total de práctica
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">
              <i className="fas fa-tachometer-alt"></i>
            </div>
            <div className="summary-content">
              <h3>Velocidad</h3>
              <span className="summary-value">{sessionData.bpm} BPM</span>
              <span className="summary-detail">
                Tempo promedio
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Gráficos */}
      <section className="charts-section">
        <div className="chart-container">
          <Bar data={sectionChartData} options={sectionChartOptions} />
        </div>
        <div className="chart-container">
          <Doughnut data={accuracyChartData} options={accuracyChartOptions} />
        </div>
      </section>

      {/* Lista de Errores Comunes */}
      <section className="mistakes-section">
        <h2>Errores Comunes</h2>
        <div className="mistakes-list">
          {commonMistakes.map((mistake, index) => (
            <div key={index} className="mistake-card">
              <div className="mistake-header">
                <span className="note-badge">{mistake.note}</span>
                <span 
                  className="type-badge"
                  style={{ backgroundColor: getMistakeTypeColor(mistake.type) }}
                >
                  {mistake.type}
                </span>
              </div>
              <div className="mistake-content">
                <div className="mistake-count">
                  <span className="count">{mistake.count}</span>
                  <span className="label">veces</span>
                </div>
                <div className="mistake-info">
                  <p className="section">{mistake.section}</p>
                  <p className="description">
                    {mistake.type === 'Nota' ? 'Nota incorrecta' :
                     mistake.type === 'Ritmo' ? 'Error de timing' :
                     'Problema de digitación'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Análisis de Secciones */}
      <section className="sections-analysis">
        <h2>Análisis por Sección</h2>
        <div className="sections-table">
          <div className="table-header">
            <span>Sección</span>
            <span>Precisión</span>
            <span>Errores</span>
            <span>Dificultad</span>
          </div>
          {sectionPerformance.map((section, index) => (
            <div key={index} className="table-row">
              <span className="section-name">{section.section}</span>
              <span 
                className="section-accuracy"
                style={{ color: getAccuracyColor(section.accuracy) }}
              >
                {section.accuracy}%
              </span>
              <span className="section-mistakes">{section.mistakes}</span>
              <span 
                className="section-difficulty"
                style={{ color: getDifficultyColor(section.difficulty) }}
              >
                {section.difficulty}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Recomendaciones */}
      <section className="recommendations">
        <h2>Recomendaciones para Mejorar</h2>
        <div className="recommendations-grid">
          <div className="recommendation-card">
            <i className="fas fa-hand-point-up"></i>
            <h3>Enfócate en los compases 17-24 y 33-40</h3>
            <p>Estas secciones tienen la precisión más baja. Practícalas lentamente primero.</p>
          </div>
          <div className="recommendation-card">
            <i className="fas fa-music"></i>
            <h3>Presta atención al ritmo</h3>
            <p>Usa el metrónomo para mejorar tu consistencia rítmica, especialmente en pasajes rápidos.</p>
          </div>
          <div className="recommendation-card">
            <i className="fas fa-redo"></i>
            <h3>Repite los pasajes problemáticos</h3>
            <p>La nota C5 aparece como la más problemática. Practica este pasaje 3-5 veces seguidas.</p>
          </div>
        </div>
      </section>

      {/* Botones de Acción */}
      <section className="action-buttons-section">
        <div className="action-buttons">
          <button className="btn btn-primary">
            <i className="fas fa-redo"></i>
            Volver a Practicar
          </button>
          <button className="btn btn-secondary">
            <i className="fas fa-history"></i>
            Ver Historial Completo
          </button>
          <button className="btn btn-tertiary">
            <i className="fas fa-share"></i>
            Compartir Resultados
          </button>
          <button className="btn btn-outline">
            <i className="fas fa-home"></i>
            Ir al Dashboard
          </button>
        </div>
      </section>

      {/* Resumen de Progreso */}
      <section className="progress-summary">
        <h2>Resumen de Progreso</h2>
        <div className="progress-bars">
          <div className="progress-item">
            <span className="progress-label">Precisión vs Sesión Anterior</span>
            <div className="progress-comparison">
              <div className="progress-bar">
                <div 
                  className="progress-fill current"
                  style={{ width: `${sessionData.accuracy}%` }}
                ></div>
              </div>
              <span className="progress-value">+5.2%</span>
            </div>
          </div>
          <div className="progress-item">
            <span className="progress-label">Ritmo vs Sesión Anterior</span>
            <div className="progress-comparison">
              <div className="progress-bar">
                <div 
                  className="progress-fill current"
                  style={{ width: `${sessionData.rhythm}%` }}
                ></div>
              </div>
              <span className="progress-value">+3.8%</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SessionResult;