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
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './AdminDashboard.css';

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
  ArcElement
);

// Interfaces TypeScript
interface PlatformMetric {
  totalUsers: number;
  totalSheets: number;
  totalPracticeHours: number;
  activeUsersToday: number;
  newUsersThisWeek: number;
  averageSessionDuration: string;
}

interface PopularSheet {
  id: number;
  title: string;
  composer: string;
  practiceCount: number;
  averageAccuracy: number;
  difficulty: 'Fácil' | 'Intermedio' | 'Avanzado';
}

interface CommonError {
  id: number;
  note: string;
  section: string;
  errorCount: number;
  errorType: 'pitch' | 'rhythm' | 'duration';
  affectedUsers: number;
  difficulty: 'Fácil' | 'Intermedio' | 'Avanzado';
}

const AdminDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Datos mockeados de la plataforma
  const platformMetrics: PlatformMetric = {
    totalUsers: 1248,
    totalSheets: 567,
    totalPracticeHours: 2845,
    activeUsersToday: 187,
    newUsersThisWeek: 42,
    averageSessionDuration: '22m'
  };

  // Partituras populares
  const popularSheets: PopularSheet[] = [
    { id: 1, title: 'Claro de Luna', composer: 'Debussy', practiceCount: 284, averageAccuracy: 82, difficulty: 'Intermedio' },
    { id: 2, title: 'Para Elisa', composer: 'Beethoven', practiceCount: 267, averageAccuracy: 85, difficulty: 'Fácil' },
    { id: 3, title: 'Sonata No. 16', composer: 'Mozart', practiceCount: 198, averageAccuracy: 78, difficulty: 'Intermedio' },
    { id: 4, title: 'Nocturno Op. 9 No. 2', composer: 'Chopin', practiceCount: 156, averageAccuracy: 72, difficulty: 'Avanzado' },
    { id: 5, title: 'Invención No. 1', composer: 'Bach', practiceCount: 143, averageAccuracy: 88, difficulty: 'Fácil' }
  ];

  // Errores comunes
  const commonErrors: CommonError[] = [
    { id: 1, note: 'C5', section: 'Compases 17-24', errorCount: 342, errorType: 'pitch', affectedUsers: 187, difficulty: 'Intermedio' },
    { id: 2, note: 'E4', section: 'Compases 9-16', errorCount: 298, errorType: 'rhythm', affectedUsers: 156, difficulty: 'Fácil' },
    { id: 3, note: 'G4', section: 'Compases 33-40', errorCount: 267, errorType: 'pitch', affectedUsers: 143, difficulty: 'Avanzado' },
    { id: 4, note: 'A4', section: 'Compases 25-32', errorCount: 234, errorType: 'duration', affectedUsers: 128, difficulty: 'Intermedio' },
    { id: 5, note: 'D5', section: 'Compases 17-24', errorCount: 198, errorType: 'rhythm', affectedUsers: 112, difficulty: 'Avanzado' }
  ];

  // Datos para gráfico de usuarios activos
  const activeUsersData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Usuarios Activos',
        data: [154, 168, 172, 187, 195, 143, 128],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  // Datos para gráfico de prácticas por día
  const practiceByDayData = {
    labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    datasets: [
      {
        label: 'Sesiones de Práctica',
        data: [124, 136, 142, 156, 168, 198, 187],
        backgroundColor: 'rgba(153, 102, 255, 0.8)',
      },
    ],
  };

  // Datos para gráfico de distribución de dificultad
  const difficultyDistributionData = {
    labels: ['Fácil', 'Intermedio', 'Avanzado'],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const activeUsersOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Usuarios Activos por Día (Última Semana)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de Usuarios'
        }
      },
    },
  };

  const practiceByDayOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sesiones de Práctica por Día de la Semana',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de Sesiones'
        }
      },
    },
  };

  const difficultyDistributionOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribución de Dificultad de Partituras',
      },
    },
  };

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'pitch': return '#e74c3c';
      case 'rhythm': return '#f39c12';
      case 'duration': return '#3498db';
      default: return '#7f8c8d';
    }
  };

  const getErrorTypeIcon = (type: string) => {
    switch (type) {
      case 'pitch': return 'fa-music';
      case 'rhythm': return 'fa-metronome';
      case 'duration': return 'fa-clock';
      default: return 'fa-exclamation-circle';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil': return '#27ae60';
      case 'Intermedio': return '#f39c12';
      case 'Avanzado': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-content">
          <h1>Panel de Administración</h1>
          <p>Estadísticas generales y métricas de la plataforma</p>
        </div>
        <div className="header-controls">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value as any)}
            className="date-range-selector"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>
          <span className="last-update">
            Actualizado: {new Date().toLocaleDateString('es-ES')}
          </span>
        </div>
      </header>

      {/* Métricas Principales */}
      <section className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="metric-content">
            <h3>Total de Usuarios</h3>
            <span className="metric-value">{platformMetrics.totalUsers.toLocaleString()}</span>
            <span className="metric-change positive">
              <i className="fas fa-arrow-up"></i>
              +{platformMetrics.newUsersThisWeek} esta semana
            </span>
          </div>
        </div>

        <div className="metric-card secondary">
          <div className="metric-icon">
            <i className="fas fa-music"></i>
          </div>
          <div className="metric-content">
            <h3>Partituras Subidas</h3>
            <span className="metric-value">{platformMetrics.totalSheets.toLocaleString()}</span>
            <span className="metric-subtext">Total en la plataforma</span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="metric-content">
            <h3>Horas de Práctica</h3>
            <span className="metric-value">{platformMetrics.totalPracticeHours.toLocaleString()}</span>
            <span className="metric-subtext">Tiempo total practicado</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <i className="fas fa-user-check"></i>
          </div>
          <div className="metric-content">
            <h3>Usuarios Activos Hoy</h3>
            <span className="metric-value">{platformMetrics.activeUsersToday}</span>
            <span className="metric-change">
              {Math.round((platformMetrics.activeUsersToday / platformMetrics.totalUsers) * 100)}% del total
            </span>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="metric-content">
            <h3>Duración Promedio</h3>
            <span className="metric-value">{platformMetrics.averageSessionDuration}</span>
            <span className="metric-subtext">Por sesión</span>
          </div>
        </div>

        <div className="metric-card danger">
          <div className="metric-icon">
            <i className="fas fa-bullseye"></i>
          </div>
          <div className="metric-content">
            <h3>Precisión Promedio</h3>
            <span className="metric-value">78%</span>
            <span className="metric-change positive">
              <i className="fas fa-arrow-up"></i>
              +5% desde el mes pasado
            </span>
          </div>
        </div>
      </section>

      {/* Gráficos de Uso */}
      <section className="charts-section">
        <div className="chart-row">
          <div className="chart-container">
            <Line data={activeUsersData} options={activeUsersOptions} />
          </div>
          <div className="chart-container">
            <Bar data={practiceByDayData} options={practiceByDayOptions} />
          </div>
        </div>
        
        <div className="chart-row">
          <div className="chart-container">
            <Doughnut data={difficultyDistributionData} options={difficultyDistributionOptions} />
          </div>
          <div className="quick-stats">
            <h3>Estadísticas Rápidas</h3>
            <div className="stats-list">
              <div className="stat-item">
                <i className="fas fa-calendar"></i>
                <div className="stat-info">
                  <span className="stat-label">Día más activo</span>
                  <span className="stat-value">Sábado (198 sesiones)</span>
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-trophy"></i>
                <div className="stat-info">
                  <span className="stat-label">Racha máxima</span>
                  <span className="stat-value">42 días (Usuario #234)</span>
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-star"></i>
                <div className="stat-info">
                  <span className="stat-label">Partitura mejor valorada</span>
                  <span className="stat-value">Claro de Luna (4.8/5)</span>
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-bolt"></i>
                <div className="stat-info">
                  <span className="stat-label">Sesión más larga</span>
                  <span className="stat-value">2h 45m (Usuario #567)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabla de Partituras Populares */}
      <section className="popular-sheets">
        <div className="section-header">
          <h2>Partituras Más Populares</h2>
          <span className="section-subtitle">Top 5 por número de prácticas</span>
        </div>
        <div className="table-container">
          <table className="popular-table">
            <thead>
              <tr>
                <th>Posición</th>
                <th>Partitura</th>
                <th>Compositor</th>
                <th>Prácticas</th>
                <th>Precisión</th>
                <th>Dificultad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {popularSheets.map((sheet, index) => (
                <tr key={sheet.id}>
                  <td className="position-cell">
                    <span className={`position-badge position-${index + 1}`}>
                      #{index + 1}
                    </span>
                  </td>
                  <td className="sheet-cell">
                    <div className="sheet-info">
                      <i className="fas fa-music"></i>
                      <span>{sheet.title}</span>
                    </div>
                  </td>
                  <td>{sheet.composer}</td>
                  <td className="practice-cell">
                    <span className="practice-count">{sheet.practiceCount}</span>
                    <div className="practice-bar">
                      <div 
                        className="practice-fill"
                        style={{ width: `${(sheet.practiceCount / popularSheets[0].practiceCount) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="accuracy-value"
                      style={{ 
                        color: sheet.averageAccuracy >= 80 ? '#27ae60' : 
                               sheet.averageAccuracy >= 60 ? '#f39c12' : '#e74c3c' 
                      }}
                    >
                      {sheet.averageAccuracy}%
                    </span>
                  </td>
                  <td>
                    <span 
                      className="difficulty-badge"
                      style={{ backgroundColor: getDifficultyColor(sheet.difficulty) }}
                    >
                      {sheet.difficulty}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn view-btn" title="Ver detalles">
                        <i className="fas fa-eye"></i>
                      </button>
                      <button className="action-btn stats-btn" title="Ver estadísticas">
                        <i className="fas fa-chart-bar"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Panel de Errores Comunes */}
      <section className="common-errors">
        <div className="section-header">
          <h2>Errores Más Comunes</h2>
          <span className="section-subtitle">Problemas frecuentes en todas las partituras</span>
        </div>
        <div className="errors-grid">
          {commonErrors.map((error, index) => (
            <div key={error.id} className="error-card">
              <div 
                className="error-icon"
                style={{ backgroundColor: getErrorTypeColor(error.errorType) }}
              >
                <i className={`fas ${getErrorTypeIcon(error.errorType)}`}></i>
              </div>
              <div className="error-content">
                <h3>Nota: {error.note}</h3>
                <p className="error-section">{error.section}</p>
                <div className="error-stats">
                  <div className="error-stat">
                    <span className="stat-value">{error.errorCount}</span>
                    <span className="stat-label">Veces cometido</span>
                  </div>
                  <div className="error-stat">
                    <span className="stat-value">{error.affectedUsers}</span>
                    <span className="stat-label">Usuarios afectados</span>
                  </div>
                </div>
                <div className="error-meta">
                  <span 
                    className="error-type"
                    style={{ color: getErrorTypeColor(error.errorType) }}
                  >
                    {error.errorType === 'pitch' ? 'Altura' :
                     error.errorType === 'rhythm' ? 'Ritmo' : 'Duración'}
                  </span>
                  <span 
                    className="error-difficulty"
                    style={{ color: getDifficultyColor(error.difficulty) }}
                  >
                    {error.difficulty}
                  </span>
                </div>
              </div>
              <div className="error-priority">
                <span className={`priority-badge priority-${index + 1}`}>
                  #{index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Resumen de Rendimiento */}
      <section className="performance-summary">
        <div className="summary-grid">
          <div className="summary-card">
            <h3>Rendimiento General de la Plataforma</h3>
            <div className="performance-metrics">
              <div className="performance-metric">
                <span className="metric-label">Disponibilidad</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: '99.8%' }}></div>
                </div>
                <span className="metric-value">99.8%</span>
              </div>
              <div className="performance-metric">
                <span className="metric-label">Tiempo de respuesta</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: '95%' }}></div>
                </div>
                <span className="metric-value">128ms</span>
              </div>
              <div className="performance-metric">
                <span className="metric-label">Satisfacción de usuarios</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: '92%' }}></div>
                </div>
                <span className="metric-value">4.6/5</span>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <h3>Acciones Rápidas</h3>
            <div className="quick-actions">
              <button className="btn btn-primary">
                <i className="fas fa-download"></i>
                Generar Reporte
              </button>
              <button className="btn btn-secondary">
                <i className="fas fa-sync"></i>
                Actualizar Datos
              </button>
              <button className="btn btn-warning">
                <i className="fas fa-exclamation-triangle"></i>
                Ver Alertas
              </button>
              <button className="btn btn-danger">
                <i className="fas fa-cog"></i>
                Configuración
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;