import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import './SessionDetail.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface SessionDetail {
  sessionId: number;
  evaluationId: number;
  sheetName: string;
  composer: string;
  date: string;
  duration: string;
  durationMinutes: number;
  
  // Métricas principales
  accuracy: number;
  rhythm: number;
  f1Score: number | null;
  desviacionTiempoMs: number | null;
  
  // Desglose de notas
  notasCorrectas: number;
  notasIncorrectas: number;
  notasOmitidas: number;
  notasExtra: number;
  totalNotas: number;
  
  // Feedback
  feedback: string | null;
  
  // URLs de archivos
  audioUrl: string | null;
  midiReferenceUrl: string | null;
  midiInterpretationUrl: string | null;
  sheetImageUrl: string | null;
}

const API_BASE = 'http://localhost:8000';

const SessionDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'feedback' | 'audio'>('overview');

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetail();
    }
  }, [sessionId]);

  const fetchSessionDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/v1/history/session/${sessionId}/detail`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los detalles de la sesión');
      }

      const data = await response.json();
      setSessionDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Session detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return '#27ae60';
    if (accuracy >= 70) return '#f39c12';
    return '#e74c3c';
  };

  const getNotesChartData = () => {
    if (!sessionDetail) return null;

    return {
      labels: ['Correctas', 'Incorrectas', 'Omitidas', 'Extra'],
      datasets: [
        {
          label: 'Notas',
          data: [
            sessionDetail.notasCorrectas,
            sessionDetail.notasIncorrectas,
            sessionDetail.notasOmitidas,
            sessionDetail.notasExtra
          ],
          backgroundColor: [
            'rgba(39, 174, 96, 0.8)',
            'rgba(231, 76, 60, 0.8)',
            'rgba(241, 196, 15, 0.8)',
            'rgba(155, 89, 182, 0.8)'
          ],
          borderColor: [
            'rgb(39, 174, 96)',
            'rgb(231, 76, 60)',
            'rgb(241, 196, 15)',
            'rgb(155, 89, 182)'
          ],
          borderWidth: 2
        }
      ]
    };
  };

  const getPerformanceChartData = () => {
    if (!sessionDetail) return null;

    return {
      labels: ['Precisión', 'Ritmo'],
      datasets: [
        {
          label: 'Rendimiento (%)',
          data: [sessionDetail.accuracy, sessionDetail.rhythm],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderColor: [
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)'
          ],
          borderWidth: 2
        }
      ]
    };
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: any) => value + '%'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };

  const parseFeedback = (feedback: string | null) => {
    if (!feedback) return null;

    const lines = feedback.split('\n');
    const sections: { [key: string]: string[] } = {};
    let currentSection = 'general';
    
    lines.forEach(line => {
      if (line.includes('Resumen:')) {
        currentSection = 'resumen';
        sections[currentSection] = [];
      } else if (line.includes('Errores de notas:')) {
        currentSection = 'errores';
        sections[currentSection] = [];
      } else if (line.includes('Timing:')) {
        currentSection = 'timing';
        sections[currentSection] = [];
      } else if (line.trim()) {
        if (!sections[currentSection]) {
          sections[currentSection] = [];
        }
        sections[currentSection].push(line);
      }
    });

    return sections;
  };

  if (loading) {
    return (
      <div className="session-detail">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando detalles de la sesión...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionDetail) {
    return (
      <div className="session-detail">
        <div className="error-container">
          <i className="fas fa-exclamation-circle"></i>
          <h3>Error al cargar los detalles</h3>
          <p>{error || 'No se encontraron detalles para esta sesión'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/app/history')}>
            <i className="fas fa-arrow-left"></i>
            Volver al Historial
          </button>
        </div>
      </div>
    );
  }

  const feedbackSections = parseFeedback(sessionDetail.feedback);

  return (
    <div className="session-detail">
      {/* Header */}
      <header className="detail-header">
        <button className="back-button" onClick={() => navigate('/app/history')}>
          <i className="fas fa-arrow-left"></i>
          Volver al Historial
        </button>

        <div className="header-info">
          <div className="session-title">
            <h1>{sessionDetail.sheetName}</h1>
            <p className="composer">{sessionDetail.composer}</p>
          </div>
          <div className="session-meta">
            <span className="date">
              <i className="fas fa-calendar"></i>
              {new Date(sessionDetail.date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            <span className="duration">
              <i className="fas fa-clock"></i>
              {sessionDetail.duration}
            </span>
          </div>
        </div>

        <div className="header-metrics">
          <div className="metric-card">
            <div className="metric-value" style={{ color: getAccuracyColor(sessionDetail.accuracy) }}>
              {sessionDetail.accuracy}%
            </div>
            <div className="metric-label">Precisión</div>
          </div>
          <div className="metric-card">
            <div className="metric-value" style={{ color: getAccuracyColor(sessionDetail.rhythm) }}>
              {sessionDetail.rhythm}%
            </div>
            <div className="metric-label">Ritmo</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">
              {sessionDetail.notasCorrectas}/{sessionDetail.totalNotas}
            </div>
            <div className="metric-label">Notas Correctas</div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-chart-pie"></i>
          Resumen
        </button>
        <button
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <i className="fas fa-music"></i>
          Análisis de Notas
        </button>
        <button
          className={`tab ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          <i className="fas fa-comments"></i>
          Feedback
        </button>
        <button
          className={`tab ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          <i className="fas fa-file-audio"></i>
          Archivos
        </button>
      </div>

      {/* Content */}
      <div className="detail-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="charts-grid">
              <div className="chart-card">
                <h3>Rendimiento General</h3>
                <div className="chart-wrapper">
                  <Bar data={getPerformanceChartData()!} options={barChartOptions} />
                </div>
              </div>

              <div className="chart-card">
                <h3>Distribución de Notas</h3>
                <div className="chart-wrapper">
                  <Doughnut data={getNotesChartData()!} options={doughnutOptions} />
                </div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <i className="fas fa-check-circle" style={{ color: '#27ae60' }}></i>
                <div>
                  <strong>{sessionDetail.notasCorrectas}</strong>
                  <span>Notas Correctas</span>
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-times-circle" style={{ color: '#e74c3c' }}></i>
                <div>
                  <strong>{sessionDetail.notasIncorrectas}</strong>
                  <span>Notas Incorrectas</span>
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-exclamation-circle" style={{ color: '#f39c12' }}></i>
                <div>
                  <strong>{sessionDetail.notasOmitidas}</strong>
                  <span>Notas Omitidas</span>
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-plus-circle" style={{ color: '#9b59b6' }}></i>
                <div>
                  <strong>{sessionDetail.notasExtra}</strong>
                  <span>Notas Extra</span>
                </div>
              </div>
            </div>

            <div className="technical-metrics">
              <h3>Métricas Técnicas</h3>
              <div className="metrics-list">
                <div className="metric-row">
                  <span className="metric-name">F1 Score:</span>
                  <span className="metric-value">{sessionDetail.f1Score?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-name">Desviación de Tiempo:</span>
                  <span className="metric-value">{sessionDetail.desviacionTiempoMs?.toFixed(2) || 'N/A'} ms</span>
                </div>
                <div className="metric-row">
                  <span className="metric-name">Total de Notas Esperadas:</span>
                  <span className="metric-value">{sessionDetail.totalNotas}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="notes-tab">
            <div className="notes-analysis">
              <h3>Análisis Detallado de Notas</h3>
              
              <div className="accuracy-breakdown">
                <div className="breakdown-item success">
                  <div className="breakdown-header">
                    <i className="fas fa-check-circle"></i>
                    <h4>Notas Correctas</h4>
                  </div>
                  <div className="breakdown-stats">
                    <span className="count">{sessionDetail.notasCorrectas}</span>
                    <span className="percentage">
                      {((sessionDetail.notasCorrectas / sessionDetail.totalNotas) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p>Notas tocadas correctamente en el momento adecuado</p>
                </div>

                <div className="breakdown-item error">
                  <div className="breakdown-header">
                    <i className="fas fa-times-circle"></i>
                    <h4>Notas Incorrectas</h4>
                  </div>
                  <div className="breakdown-stats">
                    <span className="count">{sessionDetail.notasIncorrectas}</span>
                    <span className="percentage">
                      {((sessionDetail.notasIncorrectas / sessionDetail.totalNotas) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p>Notas tocadas en el momento pero con tono incorrecto</p>
                </div>

                <div className="breakdown-item warning">
                  <div className="breakdown-header">
                    <i className="fas fa-exclamation-circle"></i>
                    <h4>Notas Omitidas</h4>
                  </div>
                  <div className="breakdown-stats">
                    <span className="count">{sessionDetail.notasOmitidas}</span>
                    <span className="percentage">
                      {((sessionDetail.notasOmitidas / sessionDetail.totalNotas) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p>Notas que deberían haberse tocado pero no se detectaron</p>
                </div>

                <div className="breakdown-item extra">
                  <div className="breakdown-header">
                    <i className="fas fa-plus-circle"></i>
                    <h4>Notas Extra</h4>
                  </div>
                  <div className="breakdown-stats">
                    <span className="count">{sessionDetail.notasExtra}</span>
                    <span className="percentage">
                      {sessionDetail.totalNotas > 0 
                        ? ((sessionDetail.notasExtra / sessionDetail.totalNotas) * 100).toFixed(1)
                        : '0.0'}%
                    </span>
                  </div>
                  <p>Notas adicionales que no estaban en la partitura</p>
                </div>
              </div>

              <div className="notes-chart-large">
                <h4>Visualización de Distribución</h4>
                <div className="large-chart-wrapper">
                  <Doughnut data={getNotesChartData()!} options={doughnutOptions} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="feedback-tab">
            <h3>Análisis y Retroalimentación</h3>
            
            {feedbackSections ? (
              <div className="feedback-content">
                {feedbackSections.resumen && (
                  <div className="feedback-section">
                    <h4><i className="fas fa-info-circle"></i> Resumen</h4>
                    <div className="feedback-text">
                      {feedbackSections.resumen.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {feedbackSections.errores && (
                  <div className="feedback-section errors">
                    <h4><i className="fas fa-exclamation-triangle"></i> Errores Detectados</h4>
                    <div className="feedback-text">
                      {feedbackSections.errores.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {feedbackSections.timing && (
                  <div className="feedback-section timing">
                    <h4><i className="fas fa-clock"></i> Análisis de Timing</h4>
                    <div className="feedback-text">
                      {feedbackSections.timing.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-feedback">
                <i className="fas fa-comment-slash"></i>
                <p>No hay feedback disponible para esta sesión</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="audio-tab">
            <h3>Archivos de la Sesión</h3>

            <div className="files-grid">
              {sessionDetail.sheetImageUrl && (
                <div className="file-card">
                  <div className="file-header">
                    <i className="fas fa-file-image"></i>
                    <h4>Imagen de Partitura</h4>
                  </div>
                  <div className="file-preview">
                    <img src={sessionDetail.sheetImageUrl} alt="Partitura" />
                  </div>
                  <a 
                    href={sessionDetail.sheetImageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    <i className="fas fa-external-link-alt"></i>
                    Ver Completo
                  </a>
                </div>
              )}

              {sessionDetail.audioUrl && (
                <div className="file-card">
                  <div className="file-header">
                    <i className="fas fa-file-audio"></i>
                    <h4>Grabación de Audio</h4>
                  </div>
                  <audio controls className="audio-player">
                    <source src={sessionDetail.audioUrl} type="audio/wav" />
                    Tu navegador no soporta el elemento de audio.
                  </audio>
                  <a 
                    href={sessionDetail.audioUrl} 
                    download
                    className="btn btn-outline btn-sm"
                  >
                    <i className="fas fa-download"></i>
                    Descargar Audio
                  </a>
                </div>
              )}

              {sessionDetail.midiReferenceUrl && (
                <div className="file-card">
                  <div className="file-header">
                    <i className="fas fa-file-audio"></i>
                    <h4>MIDI de Referencia</h4>
                  </div>
                  <p className="file-description">
                    Archivo MIDI original de la partitura
                  </p>
                  <a 
                    href={sessionDetail.midiReferenceUrl} 
                    download
                    className="btn btn-outline btn-sm"
                  >
                    <i className="fas fa-download"></i>
                    Descargar MIDI
                  </a>
                </div>
              )}

              {sessionDetail.midiInterpretationUrl && (
                <div className="file-card">
                  <div className="file-header">
                    <i className="fas fa-file-audio"></i>
                    <h4>MIDI de Interpretación</h4>
                  </div>
                  <p className="file-description">
                    Transcripción MIDI de tu interpretación
                  </p>
                  <a 
                    href={sessionDetail.midiInterpretationUrl} 
                    download
                    className="btn btn-outline btn-sm"
                  >
                    <i className="fas fa-download"></i>
                    Descargar MIDI
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetail;