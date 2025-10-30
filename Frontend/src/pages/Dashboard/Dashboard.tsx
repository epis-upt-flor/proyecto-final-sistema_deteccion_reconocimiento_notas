// Dashboard.tsx
// Versión mejorada con datos reales de la BD
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Interfaces
interface PracticeSession {
  id: number;
  sheetName: string;
  date: string;
  accuracy: number;
  rhythm: number;
  duration: string;
  notasCorrectas?: number;
  notasTotales?: number;
}

interface Stats {
  averageAccuracy: number;
  totalPracticeTime: string;
  sheetsPracticed: number;
  lastSession: string;
}

interface ProgressData {
  labels: string[];
  data: number[];
}

interface AccuracyDistribution {
  correct: number;
  incorrect: number;
}

const API_BASE = 'http://localhost:8000'; // Cambia según tu configuración

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [accuracy, setAccuracy] = useState<AccuracyDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener ID del usuario (desde localStorage o contexto)
  const userId = localStorage.getItem('userId') || '8'; // ID 8 basado en tus datos

  useEffect(() => {
    fetchDashboardData();
    // Refrescar cada 30 segundos para actualizar "última sesión"
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching dashboard data for user:', userId);

      // Fetch en paralelo
      const [statsRes, progressRes, accuracyRes, sessionsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/dashboard/stats/${userId}`),
        fetch(`${API_BASE}/api/v1/dashboard/progress/${userId}`),
        fetch(`${API_BASE}/api/v1/dashboard/accuracy-distribution/${userId}`),
        fetch(`${API_BASE}/api/v1/dashboard/recent-sessions/${userId}`)
      ]);

      if (!statsRes.ok || !progressRes.ok || !accuracyRes.ok || !sessionsRes.ok) {
        const errorText = await statsRes.text();
        console.error('API Error:', errorText);
        throw new Error('Error al obtener datos del dashboard');
      }

      const statsData = await statsRes.json();
      const progressData = await progressRes.json();
      const accuracyData = await accuracyRes.json();
      const sessionsData = await sessionsRes.json();

      console.log('Stats:', statsData);
      console.log('Progress:', progressData);
      console.log('Accuracy:', accuracyData);
      console.log('Sessions:', sessionsData);

      setStats(statsData);
      setProgress(progressData);
      setAccuracy(accuracyData);
      setSessions(sessionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div style={{ textAlign: 'center', padding: '50px', color: '#e74c3c' }}>
          <h3>Error al cargar el dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} style={{ marginTop: '20px' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Datos para el gráfico de progreso
  const progressChartData = progress ? {
    labels: progress.labels,
    datasets: [
      {
        label: 'Precisión (%)',
        data: progress.data,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  } : null;

  // Datos para el gráfico de distribución de precisión
  const totalNotes = accuracy ? accuracy.correct + accuracy.incorrect : 0;
  const accuracyChartData = accuracy && totalNotes > 0 ? {
    labels: ['Notas Correctas', 'Errores'],
    datasets: [
      {
        data: [accuracy.correct, accuracy.incorrect],
        backgroundColor: [
          'rgba(46, 213, 115, 0.8)',
          'rgba(255, 71, 87, 0.8)',
        ],
        borderColor: [
          'rgba(46, 213, 115, 1)',
          'rgba(255, 71, 87, 1)',
        ],
        borderWidth: 2,
      },
    ],
  } : null;

  const progressOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Progresión de Precisión - Últimos 7 días',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Precisión: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      }
    }
  };

  const accuracyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: `Distribución Total de Notas (${totalNotes.toLocaleString()} notas)`,
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const percentage = totalNotes > 0 ? ((value / totalNotes) * 100).toFixed(1) : '0';
            return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard Principal</h1>
        <p>Bienvenido de vuelta, ¡veamos tu progreso!</p>
      </header>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon accuracy">
              <i className="fas fa-bullseye"></i>
            </div>
            <div className="stat-info">
              <h3>Precisión Promedio</h3>
              <span className="stat-value">{stats.averageAccuracy}%</span>
              <p className="stat-description">De todas tus sesiones</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon time">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <h3>Tiempo Total de Práctica</h3>
              <span className="stat-value">{stats.totalPracticeTime}</span>
              <p className="stat-description">Tiempo acumulado</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon sheets">
              <i className="fas fa-music"></i>
            </div>
            <div className="stat-info">
              <h3>Partituras Practicadas</h3>
              <span className="stat-value">{stats.sheetsPracticed}</span>
              <p className="stat-description">Diferentes partituras</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon last-session">
              <i className="fas fa-history"></i>
            </div>
            <div className="stat-info">
              <h3>Última Sesión</h3>
              <span className="stat-value">{stats.lastSession}</span>
              <p className="stat-description">Tu actividad reciente</p>
            </div>
          </div>
        </div>
      )}

      <div className="charts-container">
        {progressChartData && (
          <div className="chart-wrapper">
            <Line data={progressChartData} options={progressOptions} />
          </div>
        )}

        {accuracyChartData ? (
          <div className="chart-wrapper">
            <Doughnut data={accuracyChartData} options={accuracyOptions} />
          </div>
        ) : (
          <div className="chart-wrapper">
            <p style={{ textAlign: 'center', padding: '50px' }}>
              Aún no hay datos de notas para mostrar
            </p>
          </div>
        )}
      </div>

      {sessions.length > 0 ? (
        <div className="recent-sessions">
          <h2>Sesiones Recientes</h2>
          <div className="sessions-list">
            {sessions.map(session => (
              <div key={session.id} className="session-card">
                <div className="session-info">
                  <h4>{session.sheetName}</h4>
                  <p className="session-date">{session.date}</p>
                  <div className="session-metrics">
                    <span className="accuracy-badge">
                      Precisión: {session.accuracy}%
                    </span>
                    <span className="rhythm-badge">
                      Ritmo: {session.rhythm}%
                    </span>
                    <span className="duration-badge">
                      Duración: {session.duration}
                    </span>
                  </div>
                  {session.notasTotales && session.notasTotales > 0 && (
                    <p className="session-notes">
                      {session.notasCorrectas}/{session.notasTotales} notas correctas
                    </p>
                  )}
                </div>
                <div className="session-actions">
                  <button className="btn-primary">Ver Detalles</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="recent-sessions">
          <h2>Sesiones Recientes</h2>
          <p style={{ textAlign: 'center', padding: '30px', color: '#95a5a6' }}>
            No hay sesiones registradas aún. ¡Comienza a practicar!
          </p>
        </div>
      )}

      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="action-buttons">
          <button className="action-btn primary">
            <i className="fas fa-play"></i>
            <span>Practicar Ahora</span>
          </button>
          <button className="action-btn secondary">
            <i className="fas fa-history"></i>
            <span>Ver Historial</span>
          </button>
          <button className="action-btn tertiary">
            <i className="fas fa-book"></i>
            <span>Explorar Partituras</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;