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
  BarElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './SheetMusicDetail.css';

// Registrar componentes de Chart.js
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

// Interfaces TypeScript
interface PracticeSession {
  id: number;
  date: string;
  accuracy: number;
  rhythm: number;
  duration: string;
  mistakes: number;
  tempo: number;
}

interface SheetMusic {
  id: number;
  title: string;
  composer: string;
  image: string;
  difficulty: 'Fácil' | 'Intermedio' | 'Avanzado';
  bestAccuracy: number;
  bestRhythm: number;
  timesPracticed: number;
  totalPracticeTime: string;
  tags: string[];
  isFavorite: boolean;
  uploadDate: string;
  sessions: PracticeSession[];
}

interface SheetMusicDetailProps {
  sheetId: number | null;
  onPractice: () => void;
  onBack: () => void;
}

const SheetMusicDetail: React.FC<SheetMusicDetailProps> = ({ 
  sheetId, 
  onPractice, 
  onBack 
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);

  // Datos mockeados - ahora basados en el sheetId proporcionado
  const getSheetData = (id: number | null): SheetMusic => {
    // Datos de ejemplo para diferentes IDs
    const sheets: { [key: number]: SheetMusic } = {
      1: {
        id: 1,
        title: 'Claro de Luna',
        composer: 'Claude Debussy',
        image: '/api/placeholder/400/500',
        difficulty: 'Intermedio',
        bestAccuracy: 92,
        bestRhythm: 88,
        timesPracticed: 8,
        totalPracticeTime: '3h 45m',
        tags: ['Impresionismo', 'Piano Solo', 'Lento'],
        isFavorite: true,
        uploadDate: '2023-09-15',
        sessions: [
          { id: 1, date: '2023-10-20', accuracy: 92, rhythm: 88, duration: '35m', mistakes: 8, tempo: 72 },
          { id: 2, date: '2023-10-18', accuracy: 85, rhythm: 82, duration: '30m', mistakes: 12, tempo: 68 },
          { id: 3, date: '2023-10-15', accuracy: 78, rhythm: 75, duration: '25m', mistakes: 18, tempo: 65 },
          { id: 4, date: '2023-10-12', accuracy: 88, rhythm: 84, duration: '40m', mistakes: 10, tempo: 70 },
          { id: 5, date: '2023-10-08', accuracy: 82, rhythm: 79, duration: '35m', mistakes: 15, tempo: 66 },
          { id: 6, date: '2023-10-05', accuracy: 75, rhythm: 72, duration: '20m', mistakes: 22, tempo: 63 },
          { id: 7, date: '2023-10-01', accuracy: 68, rhythm: 65, duration: '15m', mistakes: 28, tempo: 60 },
          { id: 8, date: '2023-09-25', accuracy: 72, rhythm: 70, duration: '25m', mistakes: 25, tempo: 62 }
        ]
      },
      2: {
        id: 2,
        title: 'Para Elisa',
        composer: 'Ludwig van Beethoven',
        image: '/api/placeholder/400/500',
        difficulty: 'Fácil',
        bestAccuracy: 85,
        bestRhythm: 82,
        timesPracticed: 12,
        totalPracticeTime: '5h 20m',
        tags: ['Clásico', 'Piano Solo'],
        isFavorite: false,
        uploadDate: '2023-08-20',
        sessions: [
          { id: 9, date: '2023-10-22', accuracy: 85, rhythm: 82, duration: '30m', mistakes: 10, tempo: 70 },
          { id: 10, date: '2023-10-19', accuracy: 88, rhythm: 85, duration: '35m', mistakes: 8, tempo: 72 },
          { id: 11, date: '2023-10-16', accuracy: 82, rhythm: 78, duration: '25m', mistakes: 12, tempo: 68 }
        ]
      }
    };

    return sheets[id || 1] || sheets[1];
  };

  const sheetData = getSheetData(sheetId);

  // Datos para el gráfico de progreso
  const progressData = {
    labels: sheetData.sessions.map(session => {
      const date = new Date(session.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }).reverse(),
    datasets: [
      {
        label: 'Precisión (%)',
        data: sheetData.sessions.map(session => session.accuracy).reverse(),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Ritmo (%)',
        data: sheetData.sessions.map(session => session.rhythm).reverse(),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.4,
        yAxisID: 'y',
      }
    ],
  };

  // Datos para el gráfico de errores
  const mistakesData = {
    labels: sheetData.sessions.map(session => {
      const date = new Date(session.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }).reverse(),
    datasets: [
      {
        label: 'Errores',
        data: sheetData.sessions.map(session => session.mistakes).reverse(),
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        yAxisID: 'y1',
      }
    ],
  };

  const progressOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Progreso de Precisión y Ritmo',
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 50,
        max: 100,
        title: {
          display: true,
          text: 'Porcentaje (%)'
        }
      },
    },
  };

  const mistakesOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Evolución de Errores',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de Errores'
        }
      },
    },
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Aquí iría la lógica real para actualizar en base de datos
  };

  const toggleSessionSelection = (sessionId: number) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const canCompare = selectedSessions.length >= 2;

  const handlePracticeClick = () => {
    onPractice();
  };

  const handleCompareSessions = () => {
    // Lógica para comparar sesiones seleccionadas
    console.log('Comparando sesiones:', selectedSessions);
  };

  const handleViewSessionDetails = (sessionId: number) => {
    // Lógica para ver detalles de sesión específica
    console.log('Viendo detalles de sesión:', sessionId);
  };

  const handleReplaySession = (sessionId: number) => {
    // Lógica para repetir una sesión
    console.log('Repitiendo sesión:', sessionId);
  };

  return (
    <div className="sheet-detail">
      {/* Header Información */}
      <div className="detail-header">
        <button onClick={onBack} className="back-button">
          <i className="fas fa-arrow-left"></i>
          Volver a Biblioteca
        </button>
      </div>

      <div className="sheet-header">
        <div className="sheet-image">
          <img src={sheetData.image} alt={sheetData.title} />
          <div className="image-overlay">
            <button className="play-btn" onClick={handlePracticeClick}>
              <i className="fas fa-play"></i>
              Vista Previa
            </button>
          </div>
        </div>
        
        <div className="sheet-info">
          <div className="sheet-meta">
            <span className={`difficulty-badge ${sheetData.difficulty.toLowerCase()}`}>
              {sheetData.difficulty}
            </span>
            <span className="upload-date">
              Subida el {new Date(sheetData.uploadDate).toLocaleDateString()}
            </span>
          </div>
          
          <h1>{sheetData.title}</h1>
          <h2 className="composer">por {sheetData.composer}</h2>
          
          <div className="sheet-tags">
            {sheetData.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>

          {/* Botones de Acción */}
          <div className="action-buttons">
            <button className="btn-primary" onClick={handlePracticeClick}>
              <i className="fas fa-play"></i>
              Practicar Ahora
            </button>
            
            <button 
              className={`fav-btn ${isFavorite ? 'favorited' : ''}`}
              onClick={toggleFavorite}
            >
              <i className="fas fa-heart"></i>
              {isFavorite ? 'Quitar de Favoritos' : 'Marcar como Favorita'}
            </button>
            
            <button className="btn-secondary">
              <i className="fas fa-edit"></i>
              Editar Metadatos
            </button>
            
            <button className="btn-danger">
              <i className="fas fa-trash"></i>
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="stats-section">
        <h2>Estadísticas de Práctica</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-bullseye"></i>
            </div>
            <div className="stat-content">
              <h3>Mejor Precisión</h3>
              <span className="stat-value">{sheetData.bestAccuracy}%</span>
              <span className="stat-label">Máximo alcanzado</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-metronome"></i>
            </div>
            <div className="stat-content">
              <h3>Mejor Ritmo</h3>
              <span className="stat-value">{sheetData.bestRhythm}%</span>
              <span className="stat-label">Consistencia rítmica</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-repeat"></i>
            </div>
            <div className="stat-content">
              <h3>Veces Practicada</h3>
              <span className="stat-value">{sheetData.timesPracticed}</span>
              <span className="stat-label">Sesiones totales</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>Tiempo Total</h3>
              <span className="stat-value">{sheetData.totalPracticeTime}</span>
              <span className="stat-label">Dedicación total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos de Desempeño */}
      <div className="charts-section">
        <div className="chart-container">
          <Line data={progressData} options={progressOptions} />
        </div>
        <div className="chart-container">
          <Bar data={mistakesData} options={mistakesOptions} />
        </div>
      </div>

      {/* Lista de Sesiones de Práctica */}
      <div className="sessions-section">
        <div className="section-header">
          <h2>Historial de Prácticas</h2>
          {canCompare && (
            <button className="compare-btn" onClick={handleCompareSessions}>
              <i className="fas fa-chart-line"></i>
              Comparar Sesiones Seleccionadas ({selectedSessions.length})
            </button>
          )}
        </div>

        <div className="sessions-table-container">
          <table className="sessions-table">
            <thead>
              <tr>
                <th></th>
                <th>Fecha</th>
                <th>Precisión</th>
                <th>Ritmo</th>
                <th>Duración</th>
                <th>Errores</th>
                <th>Tempo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sheetData.sessions.map(session => (
                <tr 
                  key={session.id} 
                  className={selectedSessions.includes(session.id) ? 'selected' : ''}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedSessions.includes(session.id)}
                      onChange={() => toggleSessionSelection(session.id)}
                    />
                  </td>
                  <td>{new Date(session.date).toLocaleDateString()}</td>
                  <td>
                    <div className="accuracy-cell">
                      <span className="value">{session.accuracy}%</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${session.accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`rhythm-value ${session.rhythm >= 80 ? 'good' : session.rhythm >= 60 ? 'medium' : 'poor'}`}>
                      {session.rhythm}%
                    </span>
                  </td>
                  <td>{session.duration}</td>
                  <td>
                    <span className={`mistakes-value ${session.mistakes <= 10 ? 'good' : session.mistakes <= 20 ? 'medium' : 'poor'}`}>
                      {session.mistakes}
                    </span>
                  </td>
                  <td>{session.tempo} BPM</td>
                  <td>
                    <div className="session-actions">
                      <button 
                        className="action-btn view-btn" 
                        title="Ver detalles"
                        onClick={() => handleViewSessionDetails(session.id)}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        className="action-btn replay-btn" 
                        title="Repetir práctica"
                        onClick={() => handleReplaySession(session.id)}
                      >
                        <i className="fas fa-redo"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de Mejora */}
      <div className="improvement-section">
        <h2>Resumen de Mejora</h2>
        <div className="improvement-cards">
          <div className="improvement-card positive">
            <i className="fas fa-arrow-up"></i>
            <div className="content">
              <h3>+24%</h3>
              <p>Mejora en precisión desde la primera práctica</p>
            </div>
          </div>
          <div className="improvement-card positive">
            <i className="fas fa-arrow-up"></i>
            <div className="content">
              <h3>+23%</h3>
              <p>Mejora en consistencia rítmica</p>
            </div>
          </div>
          <div className="improvement-card negative">
            <i className="fas fa-arrow-down"></i>
            <div className="content">
              <h3>-20</h3>
              <p>Reducción de errores promedio</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetMusicDetail;