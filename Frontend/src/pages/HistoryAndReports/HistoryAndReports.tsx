import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './HistoryAndReports.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
);

interface PracticeSession {
  id: number;
  date: string;
  sheetId: number;
  sheetName: string;
  composer: string;
  duration: string;
  durationMinutes: number;
  accuracy: number;
  rhythm: number;
  notasCorrectas: number;
  notasIncorrectas: number;
  notasOmitidas: number;
  notasExtra: number;
  totalNotas: number;
  f1Score: number;
  desviacionTiempoMs: number;
  feedback: string | null;
  hasEvaluation: boolean;
  evaluationId?: number;
}

interface Summary {
  totalSessions: number;
  totalPracticeTime: string;
  totalMinutes: number;
  averageAccuracy: number;
  maxAccuracy: number;
  minAccuracy: number;
  averageRhythm: number;
  totalCorrectNotes: number;
  totalErrors: number;
  uniqueSheets: number;
}

interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  sheetName: string;
  minAccuracy: number;
  maxAccuracy: number;
  datePreset: '7d' | '30d' | '90d' | 'all';
}

const API_BASE = 'http://localhost:8000';

const HistoryAndReports: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'rhythm'>('accuracy');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const userId = localStorage.getItem('userId') || '8';
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: { start: '', end: '' },
    sheetName: '',
    minAccuracy: 0,
    maxAccuracy: 100,
    datePreset: '30d'
  });

  useEffect(() => {
    fetchHistoryData();
  }, [userId, filters.dateRange, filters.sheetName, filters.minAccuracy, filters.maxAccuracy]);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.dateRange.start) params.append('start_date', filters.dateRange.start);
      if (filters.dateRange.end) params.append('end_date', filters.dateRange.end);
      if (filters.sheetName) params.append('sheet_name', filters.sheetName);
      if (filters.minAccuracy > 0) params.append('min_accuracy', filters.minAccuracy.toString());
      if (filters.maxAccuracy < 100) params.append('max_accuracy', filters.maxAccuracy.toString());

      // ✅ CORREGIDO: Sintaxis correcta con backticks
      const [sessionsRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/history/sessions/${userId}?${params.toString()}`),
        fetch(`${API_BASE}/api/v1/history/sessions/${userId}/summary?${params.toString()}`)
      ]);

      if (!sessionsRes.ok || !summaryRes.ok) {
        throw new Error('Error al obtener datos del historial');
      }

      const sessionsData = await sessionsRes.json();
      const summaryData = await summaryRes.json();

      setSessions(sessionsData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('History error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyDatePreset = (preset: '7d' | '30d' | '90d' | 'all') => {
    const now = new Date();
    let startDate = '';
    
    switch (preset) {
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
        break;
      case '30d':
        startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
        break;
      case '90d':
        startDate = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
        break;
      case 'all':
        startDate = '';
        break;
    }
    
    setFilters(prev => ({
      ...prev,
      datePreset: preset,
      dateRange: { start: startDate, end: '' }
    }));
  };

  // ✅ CORREGIDO: Navegación al detalle de la sesión
  const handleViewSessionDetail = (sessionId: number, evaluationId?: number) => {
    console.log('Navegando a detalle de sesión:', sessionId, 'evaluationId:', evaluationId);
    
    if (!evaluationId) {
      alert('Esta sesión no tiene evaluación disponible');
      return;
    }
    
    // ✅ CORREGIDO: Sintaxis correcta con backticks
    navigate(`/app/session-detail/${sessionId}`, { 
      state: { evaluationId, sessionId } 
    });
  };

  const getChartData = () => {
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = sortedSessions.map(session => {
      const date = new Date(session.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const data = sortedSessions.map(session => {
      return selectedMetric === 'accuracy' ? session.accuracy : session.rhythm;
    });

    return {
      labels,
      datasets: [
        {
          label: selectedMetric === 'accuracy' ? 'Precisión (%)' : 'Ritmo (%)',
          data,
          borderColor: selectedMetric === 'accuracy' ? 'rgb(75, 192, 192)' : 'rgb(153, 102, 255)',
          backgroundColor: selectedMetric === 'accuracy' ? 'rgba(75, 192, 192, 0.2)' : 'rgba(153, 102, 255, 0.2)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#2c3e50'
        }
      },
      title: {
        display: true,
        text: `Progresión de ${selectedMetric === 'accuracy' ? 'Precisión' : 'Ritmo'}`,
        color: '#2c3e50',
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
          color: '#2c3e50'
        },
        grid: {
          color: 'rgba(0,0,0,0.1)'
        }
      },
      x: {
        ticks: {
          color: '#2c3e50'
        },
        grid: {
          color: 'rgba(0,0,0,0.1)'
        }
      }
    },
  };

  const toggleSessionSelection = (sessionId: number) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const selectAllSessions = () => {
    if (selectedSessions.length === sessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(sessions.map(session => session.id));
    }
  };

  const handleFilterChange = (field: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: { start: '', end: '' },
      sheetName: '',
      minAccuracy: 0,
      maxAccuracy: 100,
      datePreset: 'all'
    });
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Partitura', 'Compositor', 'Duración', 'Precisión', 'Ritmo', 'Notas Correctas', 'Errores'];
    const csvData = sessions.map(s => [
      s.date,
      s.sheetName,
      s.composer,
      s.duration,
      `${s.accuracy}%`,
      `${s.rhythm}%`,
      s.notasCorrectas,
      s.notasIncorrectas + s.notasOmitidas + s.notasExtra
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_chopinplay_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return '#27ae60';
    if (accuracy >= 70) return '#f39c12';
    return '#e74c3c';
  };

  if (loading) {
    return (
      <div className="history-reports">
        <div className="loading-container">
          <p>Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-reports">
        <div className="error-container">
          <h3>Error al cargar el historial</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchHistoryData}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="history-reports">
      {/* Header */}
      <header className="history-header">
        <div className="header-content">
          <h1>Historial e Informes</h1>
          <p>Analiza tu progreso y genera reportes detallados</p>
        </div>
        {summary && (
          <div className="header-stats">
            <div className="stat">
              <span className="stat-value">{summary.totalSessions}</span>
              <span className="stat-label">Sesiones</span>
            </div>
            <div className="stat">
              <span className="stat-value">{summary.averageAccuracy}%</span>
              <span className="stat-label">Precisión Promedio</span>
            </div>
            <div className="stat">
              <span className="stat-value">{summary.totalPracticeTime}</span>
              <span className="stat-label">Tiempo Total</span>
            </div>
          </div>
        )}
      </header>

      {/* Controles principales */}
      <div className="main-controls">
        <div className="controls-left">
          <button 
            className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="fas fa-filter"></i>
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          
          <div className="metric-selector">
            <label>Métrica:</label>
            <select 
              value={selectedMetric} 
              onChange={(e) => setSelectedMetric(e.target.value as any)}
            >
              <option value="accuracy">Precisión</option>
              <option value="rhythm">Ritmo</option>
            </select>
          </div>

          <div className="date-range-selector">
            <label>Rango:</label>
            <select 
              value={filters.datePreset} 
              onChange={(e) => applyDatePreset(e.target.value as any)}
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="all">Todo el historial</option>
            </select>
          </div>
        </div>

        <div className="controls-right">
          <button className="btn btn-success" onClick={exportToCSV}>
            <i className="fas fa-download"></i>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros avanzados */}
      {showFilters && (
        <div className="advanced-filters">
          <h3>Filtros Avanzados</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Rango de Fechas</label>
              <div className="date-inputs">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                  placeholder="Desde"
                />
                <span>a</span>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                  placeholder="Hasta"
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Partitura</label>
              <input
                type="text"
                value={filters.sheetName}
                onChange={(e) => handleFilterChange('sheetName', e.target.value)}
                placeholder="Buscar por nombre..."
              />
            </div>

            <div className="filter-group">
              <label>Precisión ({filters.minAccuracy}% - {filters.maxAccuracy}%)</label>
              <div className="range-slider">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minAccuracy}
                  onChange={(e) => handleFilterChange('minAccuracy', Number(e.target.value))}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.maxAccuracy}
                  onChange={(e) => handleFilterChange('maxAccuracy', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn btn-outline" onClick={clearFilters}>
              <i className="fas fa-times"></i>
              Limpiar Filtros
            </button>
            <span className="filter-count">
              {sessions.length} sesiones encontradas
            </span>
          </div>
        </div>
      )}

      {/* Gráfico de Progresión */}
      {sessions.length > 0 && (
        <section className="chart-section">
          <div className="chart-container">
            <Line data={getChartData()} options={chartOptions} />
          </div>
        </section>
      )}

      {/* Tabla de Sesiones */}
      <section className="sessions-section">
        <div className="section-header">
          <h2>Sesiones de Práctica</h2>
          <div className="table-actions">
            <button 
              className="btn btn-outline"
              onClick={selectAllSessions}
              disabled={sessions.length === 0}
            >
              <i className={`fas ${selectedSessions.length === sessions.length ? 'fa-check-square' : 'fa-square'}`}></i>
              {selectedSessions.length === sessions.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="sessions-table">
            <thead>
              <tr>
                <th className="select-column">
                  <input
                    type="checkbox"
                    checked={selectedSessions.length === sessions.length && sessions.length > 0}
                    onChange={selectAllSessions}
                    disabled={sessions.length === 0}
                  />
                </th>
                <th>Fecha</th>
                <th>Partitura</th>
                <th>Compositor</th>
                <th>Duración</th>
                <th>Precisión</th>
                <th>Ritmo</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className={selectedSessions.includes(session.id) ? 'selected' : ''}>
                  <td className="select-column">
                    <input
                      type="checkbox"
                      checked={selectedSessions.includes(session.id)}
                      onChange={() => toggleSessionSelection(session.id)}
                    />
                  </td>
                  <td>
                    {new Date(session.date).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="sheet-name">{session.sheetName}</td>
                  <td>{session.composer}</td>
                  <td>{session.duration}</td>
                  <td>
                    <span 
                      className="accuracy-value"
                      style={{ color: getAccuracyColor(session.accuracy) }}
                    >
                      {session.accuracy}%
                    </span>
                  </td>
                  <td>{session.rhythm}%</td>
                  <td>
                    <span className="notes-info">
                      {session.notasCorrectas}/{session.totalNotas}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view-btn" 
                        title="Ver detalles"
                        onClick={() => handleViewSessionDetail(session.id, session.evaluationId)}
                        disabled={!session.hasEvaluation}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button className="action-btn chart-btn" title="Ver gráficos">
                        <i className="fas fa-chart-bar"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sessions.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-search"></i>
              <h3>No se encontraron sesiones</h3>
              <p>Intenta ajustar tus filtros de búsqueda o comienza a practicar</p>
            </div>
          )}
        </div>
      </section>

      {/* Resumen estadístico adicional */}
      {summary && summary.totalSessions > 0 && (
        <section className="summary-section">
          <h2>Resumen Estadístico</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <i className="fas fa-trophy"></i>
              <div>
                <h4>Mejor Precisión</h4>
                <span>{summary.maxAccuracy}%</span>
              </div>
            </div>
            <div className="summary-card">
              <i className="fas fa-chart-line"></i>
              <div>
                <h4>Peor Precisión</h4>
                <span>{summary.minAccuracy}%</span>
              </div>
            </div>
            <div className="summary-card">
              <i className="fas fa-music"></i>
              <div>
                <h4>Partituras Únicas</h4>
                <span>{summary.uniqueSheets}</span>
              </div>
            </div>
            <div className="summary-card">
              <i className="fas fa-check-circle"></i>
              <div>
                <h4>Notas Correctas</h4>
                <span>{summary.totalCorrectNotes.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Resumen de selección */}
      {selectedSessions.length > 0 && (
        <div className="selection-summary">
          <div className="summary-content">
            <span className="selected-count">
              {selectedSessions.length} sesiones seleccionadas
            </span>
            <div className="summary-actions">
              <button className="btn btn-sm btn-outline" onClick={() => setSelectedSessions([])}>
                <i className="fas fa-times"></i>
                Limpiar selección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryAndReports;