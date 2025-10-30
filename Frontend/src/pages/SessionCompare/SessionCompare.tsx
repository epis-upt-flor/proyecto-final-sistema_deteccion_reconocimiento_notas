import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';
import './SessionCompare.css';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  RadialLinearScale,
  Filler
);

// Interfaces TypeScript
interface PracticeSession {
  id: number;
  date: string;
  sheetName: string;
  composer: string;
  duration: string;
  accuracy: number;
  rhythm: number;
  tempo: number;
  mistakes: number;
  sectionPerformance: SectionPerformance[];
  noteErrors: NoteError[];
}

interface SectionPerformance {
  section: string;
  accuracy: number;
  mistakes: number;
}

interface NoteError {
  note: string;
  count: number;
  type: 'pitch' | 'rhythm' | 'duration';
}

const SessionCompare: React.FC = () => {
  const [selectedSessions, setSelectedSessions] = useState<number[]>([1, 2, 3]);
  const [chartType, setChartType] = useState<'radar' | 'bar' | 'line'>('radar');

  // Datos mockeados de sesiones
  const sessions: PracticeSession[] = [
    {
      id: 1,
      date: '2023-10-20',
      sheetName: 'Claro de Luna',
      composer: 'Debussy',
      duration: '25m',
      accuracy: 92,
      rhythm: 88,
      tempo: 72,
      mistakes: 8,
      sectionPerformance: [
        { section: 'Intro (1-8)', accuracy: 95, mistakes: 2 },
        { section: 'Desarrollo (9-16)', accuracy: 88, mistakes: 5 },
        { section: 'Clímax (17-24)', accuracy: 85, mistakes: 6 },
        { section: 'Conclusión (25-32)', accuracy: 96, mistakes: 1 }
      ],
      noteErrors: [
        { note: 'C5', count: 3, type: 'pitch' },
        { note: 'E4', count: 2, type: 'rhythm' },
        { note: 'G4', count: 1, type: 'duration' }
      ]
    },
    {
      id: 2,
      date: '2023-10-18',
      sheetName: 'Claro de Luna',
      composer: 'Debussy',
      duration: '30m',
      accuracy: 85,
      rhythm: 82,
      tempo: 68,
      mistakes: 12,
      sectionPerformance: [
        { section: 'Intro (1-8)', accuracy: 90, mistakes: 3 },
        { section: 'Desarrollo (9-16)', accuracy: 82, mistakes: 7 },
        { section: 'Clímax (17-24)', accuracy: 78, mistakes: 9 },
        { section: 'Conclusión (25-32)', accuracy: 88, mistakes: 4 }
      ],
      noteErrors: [
        { note: 'C5', count: 5, type: 'pitch' },
        { note: 'A4', count: 3, type: 'rhythm' },
        { note: 'D5', count: 2, type: 'pitch' }
      ]
    },
    {
      id: 3,
      date: '2023-10-15',
      sheetName: 'Claro de Luna',
      composer: 'Debussy',
      duration: '35m',
      accuracy: 78,
      rhythm: 75,
      tempo: 65,
      mistakes: 18,
      sectionPerformance: [
        { section: 'Intro (1-8)', accuracy: 85, mistakes: 5 },
        { section: 'Desarrollo (9-16)', accuracy: 75, mistakes: 10 },
        { section: 'Clímax (17-24)', accuracy: 70, mistakes: 12 },
        { section: 'Conclusión (25-32)', accuracy: 80, mistakes: 6 }
      ],
      noteErrors: [
        { note: 'C5', count: 7, type: 'pitch' },
        { note: 'E4', count: 4, type: 'rhythm' },
        { note: 'G4', count: 3, type: 'pitch' }
      ]
    },
    {
      id: 4,
      date: '2023-10-12',
      sheetName: 'Claro de Luna',
      composer: 'Debussy',
      duration: '28m',
      accuracy: 89,
      rhythm: 85,
      tempo: 70,
      mistakes: 9,
      sectionPerformance: [
        { section: 'Intro (1-8)', accuracy: 92, mistakes: 2 },
        { section: 'Desarrollo (9-16)', accuracy: 86, mistakes: 5 },
        { section: 'Clímax (17-24)', accuracy: 83, mistakes: 7 },
        { section: 'Conclusión (25-32)', accuracy: 93, mistakes: 1 }
      ],
      noteErrors: [
        { note: 'C5', count: 4, type: 'pitch' },
        { note: 'F4', count: 2, type: 'rhythm' },
        { note: 'A4', count: 1, type: 'duration' }
      ]
    }
  ];

  // Colores para las sesiones
  const sessionColors = [
    'rgba(75, 192, 192, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(54, 162, 235, 0.8)'
  ];

  const sessionBorderColors = [
    'rgb(75, 192, 192)',
    'rgb(255, 99, 132)',
    'rgb(153, 102, 255)',
    'rgb(255, 159, 64)',
    'rgb(54, 162, 235)'
  ];

  // Datos para gráficos comparativos
  const getComparisonData = () => {
    const selectedSessionData = sessions.filter(session => 
      selectedSessions.includes(session.id)
    );

    return {
      labels: ['Precisión', 'Ritmo', 'Tempo', 'Duración (min)', 'Errores'],
      datasets: selectedSessionData.map((session, index) => ({
        label: `Sesión ${new Date(session.date).toLocaleDateString()}`,
        data: [
          session.accuracy,
          session.rhythm,
          session.tempo,
          parseInt(session.duration),
          session.mistakes
        ],
        backgroundColor: sessionColors[index],
        borderColor: sessionBorderColors[index],
        borderWidth: 2,
        fill: chartType === 'radar'
      }))
    };
  };

  // Datos para gráfico de líneas por sección
  const getSectionComparisonData = () => {
    const selectedSessionData = sessions.filter(session => 
      selectedSessions.includes(session.id)
    );

    const sections = selectedSessionData[0]?.sectionPerformance.map(sp => sp.section) || [];

    return {
      labels: sections,
      datasets: selectedSessionData.map((session, index) => ({
        label: `Sesión ${new Date(session.date).toLocaleDateString()}`,
        data: session.sectionPerformance.map(sp => sp.accuracy),
        borderColor: sessionBorderColors[index],
        backgroundColor: sessionColors[index].replace('0.8', '0.2'),
        tension: 0.4,
        fill: false
      }))
    };
  };

  // Datos para gráfico de errores por nota
  const getNoteErrorsData = () => {
    const selectedSessionData = sessions.filter(session => 
      selectedSessions.includes(session.id)
    );

    // Obtener todas las notas únicas
    const allNotes = Array.from(new Set(
      selectedSessionData.flatMap(session => 
        session.noteErrors.map(error => error.note)
      )
    ));

    return {
      labels: allNotes,
      datasets: selectedSessionData.map((session, index) => ({
        label: `Sesión ${new Date(session.date).toLocaleDateString()}`,
        data: allNotes.map(note => {
          const error = session.noteErrors.find(e => e.note === note);
          return error ? error.count : 0;
        }),
        backgroundColor: sessionColors[index],
        borderColor: sessionBorderColors[index],
        borderWidth: 1
      }))
    };
  };

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Comparación de Métricas Principales',
      },
    },
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    }
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Comparación de Métricas Principales',
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Precisión por Sección',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 50,
        max: 100,
        title: {
          display: true,
          text: 'Precisión (%)'
        }
      }
    }
  };

  const noteErrorsOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Errores por Nota',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de Errores'
        }
      }
    }
  };

  const toggleSessionSelection = (sessionId: number) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const getSessionDisplayDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return '#27ae60';
    if (accuracy >= 70) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <div className="session-compare">
      {/* Header */}
      <header className="compare-header">
        <div className="header-content">
          <h1>Comparación de Sesiones</h1>
          <p>Analiza y compara tu desempeño entre diferentes prácticas</p>
        </div>
        <div className="header-info">
          <span className="piece-info">
            <i className="fas fa-music"></i>
            Claro de Luna - Debussy
          </span>
        </div>
      </header>

      {/* Selector de Sesiones */}
      <section className="session-selector">
        <h2>Selecciona Sesiones para Comparar</h2>
        <div className="sessions-grid">
          {sessions.map((session, index) => (
            <div
              key={session.id}
              className={`session-card ${selectedSessions.includes(session.id) ? 'selected' : ''}`}
              onClick={() => toggleSessionSelection(session.id)}
            >
              <div className="session-color" style={{ backgroundColor: sessionColors[index] }}></div>
              <div className="session-content">
                <h3>Sesión {index + 1}</h3>
                <p className="session-date">{getSessionDisplayDate(session.date)}</p>
                <div className="session-stats">
                  <div className="stat">
                    <span className="stat-value" style={{ color: getAccuracyColor(session.accuracy) }}>
                      {session.accuracy}%
                    </span>
                    <span className="stat-label">Precisión</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{session.rhythm}%</span>
                    <span className="stat-label">Ritmo</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{session.duration}</span>
                    <span className="stat-label">Duración</span>
                  </div>
                </div>
              </div>
              <div className="session-checkbox">
                <input
                  type="checkbox"
                  checked={selectedSessions.includes(session.id)}
                  onChange={() => {}}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="selection-info">
          <span className="selected-count">
            {selectedSessions.length} sesiones seleccionadas
          </span>
          {selectedSessions.length < 2 && (
            <span className="warning-text">
              <i className="fas fa-exclamation-triangle"></i>
              Selecciona al menos 2 sesiones para comparar
            </span>
          )}
        </div>
      </section>

      {selectedSessions.length >= 2 && (
        <>
          {/* Controles de visualización */}
          <section className="visualization-controls">
            <h2>Tipo de Visualización</h2>
            <div className="chart-type-selector">
              <button
                className={`chart-type-btn ${chartType === 'radar' ? 'active' : ''}`}
                onClick={() => setChartType('radar')}
              >
                <i className="fas fa-chart-radar"></i>
                Radar
              </button>
              <button
                className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
              >
                <i className="fas fa-chart-bar"></i>
                Barras
              </button>
              <button
                className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
                onClick={() => setChartType('line')}
              >
                <i className="fas fa-chart-line"></i>
                Líneas
              </button>
            </div>
          </section>

          {/* Gráficos comparativos */}
          <section className="comparison-charts">
            {/* Gráfico principal */}
            <div className="chart-container main-chart">
              <h3>Comparación General</h3>
              {chartType === 'radar' && (
                <Radar data={getComparisonData()} options={radarOptions} />
              )}
              {chartType === 'bar' && (
                <Bar data={getComparisonData()} options={barOptions} />
              )}
              {chartType === 'line' && (
                <Line data={getSectionComparisonData()} options={lineOptions} />
              )}
            </div>

            {/* Gráfico de errores por nota */}
            <div className="chart-container">
              <h3>Errores por Nota</h3>
              <Bar data={getNoteErrorsData()} options={noteErrorsOptions} />
            </div>

            {/* Gráfico de líneas por sección (si no es el principal) */}
            {chartType !== 'line' && (
              <div className="chart-container">
                <h3>Precisión por Sección</h3>
                <Line data={getSectionComparisonData()} options={lineOptions} />
              </div>
            )}
          </section>

          {/* Tabla comparativa */}
          <section className="comparison-table">
            <h2>Tabla Comparativa Detallada</h2>
            <div className="table-container">
              <table className="sessions-comparison-table">
                <thead>
                  <tr>
                    <th>Métrica</th>
                    {sessions
                      .filter(session => selectedSessions.includes(session.id))
                      .map((session, index) => (
                        <th key={session.id} style={{ color: sessionBorderColors[index] }}>
                          Sesión {getSessionDisplayDate(session.date)}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
  <tr>
    <td>Precisión General</td>
    {sessions
      .filter(session => selectedSessions.includes(session.id))
      .map((session) => (
        <td key={session.id} style={{ color: getAccuracyColor(session.accuracy) }}>
          <strong>{session.accuracy}%</strong>
        </td>
      ))}
  </tr>
  <tr>
                    <td>Precisión Rítmica</td>
                    {sessions
                      .filter(session => selectedSessions.includes(session.id))
                      .map(session => (
                        <td key={session.id}>{session.rhythm}%</td>
                      ))}
                  </tr>
                  <tr>
                    <td>Tempo Promedio</td>
                    {sessions
                      .filter(session => selectedSessions.includes(session.id))
                      .map(session => (
                        <td key={session.id}>{session.tempo} BPM</td>
                      ))}
                  </tr>
                  <tr>
                    <td>Duración</td>
                    {sessions
                      .filter(session => selectedSessions.includes(session.id))
                      .map(session => (
                        <td key={session.id}>{session.duration}</td>
                      ))}
                  </tr>
                  <tr>
                    <td>Total de Errores</td>
                    {sessions
                      .filter(session => selectedSessions.includes(session.id))
                      .map(session => (
                        <td key={session.id}>{session.mistakes}</td>
                      ))}
                  </tr>
                  <tr>
                    <td>Mejor Sección</td>
                    {sessions
                      .filter(session => selectedSessions.includes(session.id))
                      .map(session => {
                        const bestSection = session.sectionPerformance.reduce((prev, current) => 
                          (prev.accuracy > current.accuracy) ? prev : current
                        );
                        return (
                          <td key={session.id}>
                            {bestSection.section} ({bestSection.accuracy}%)
                          </td>
                        );
                      })}
                  </tr>
                  <tr>
                    <td>Sección más Difícil</td>
                    {sessions
                      .filter(session => selectedSessions.includes(session.id))
                      .map(session => {
                        const worstSection = session.sectionPerformance.reduce((prev, current) => 
                          (prev.accuracy < current.accuracy) ? prev : current
                        );
                        return (
                          <td key={session.id}>
                            {worstSection.section} ({worstSection.accuracy}%)
                          </td>
                        );
                      })}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Análisis y Recomendaciones */}
          <section className="analysis-section">
            <h2>Análisis Comparativo</h2>
            <div className="analysis-cards">
              <div className="analysis-card">
                <i className="fas fa-trending-up" style={{ color: '#27ae60' }}></i>
                <h3>Mejora General</h3>
                <p>
                  La precisión ha mejorado un <strong>14%</strong> desde la primera 
                  sesión seleccionada hasta la más reciente.
                </p>
              </div>
              <div className="analysis-card">
                <i className="fas fa-metronome" style={{ color: '#f39c12' }}></i>
                <h3>Consistencia Rítmica</h3>
                <p>
                  El ritmo muestra una mejora constante, con un aumento del <strong>13%</strong> 
                  en la consistencia general.
                </p>
              </div>
              <div className="analysis-card">
                <i className="fas fa-bullseye" style={{ color: '#e74c3c' }}></i>
                <h3>Puntos de Dificultad</h3>
                <p>
                  La nota <strong>C5</strong> continúa siendo la más problemática, 
                  pero los errores han disminuido en un <strong>43%</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* Acciones */}
          <section className="action-buttons">
            <button className="btn btn-primary">
              <i className="fas fa-download"></i>
              Exportar Comparación
            </button>
            <button className="btn btn-secondary">
              <i className="fas fa-share"></i>
              Compartir Análisis
            </button>
            <button className="btn btn-outline">
              <i className="fas fa-redo"></i>
              Comparar Otras Sesiones
            </button>
          </section>
        </>
      )}
    </div>
  );
};

export default SessionCompare;