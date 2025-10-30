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
  ArcElement
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import './UserProfile.css';

// Registrar componentes de Chart.js
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

// Interfaces TypeScript
interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  joinDate: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
}

interface AudioPreferences {
  inputDevice: string;
  sensitivity: number;
  noiseReduction: boolean;
  monitoring: boolean;
}

interface PracticePreferences {
  metronomeEnabled: boolean;
  metronomeVolume: number;
  defaultTempo: number;
  countIn: boolean;
  difficulty: 'Fácil' | 'Intermedio' | 'Avanzado';
  showNoteNames: boolean;
}

interface UserStats {
  totalPracticeHours: number;
  totalSessions: number;
  totalSheets: number;
  averageAccuracy: number;
  currentStreak: number;
  bestStreak: number;
}

const UserProfile: React.FC = () => {
  // Datos mockeados del usuario
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana.garcia@email.com',
    joinDate: '2023-01-15',
    level: 'Intermedio'
  });

  const [audioPreferences, setAudioPreferences] = useState<AudioPreferences>({
    inputDevice: 'micrófono_integrado',
    sensitivity: 75,
    noiseReduction: true,
    monitoring: true
  });

  const [practicePreferences, setPracticePreferences] = useState<PracticePreferences>({
    metronomeEnabled: true,
    metronomeVolume: 60,
    defaultTempo: 80,
    countIn: true,
    difficulty: 'Intermedio',
    showNoteNames: true
  });

  const [userStats] = useState<UserStats>({
    totalPracticeHours: 127,
    totalSessions: 284,
    totalSheets: 42,
    averageAccuracy: 78,
    currentStreak: 14,
    bestStreak: 30
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'audio' | 'practice'>('profile');

  // Datos para gráficos
  const accuracyData = {
    labels: ['Correctas', 'Errores'],
    datasets: [
      {
        data: [userStats.averageAccuracy, 100 - userStats.averageAccuracy],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const practiceTrendData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
    datasets: [
      {
        label: 'Horas de práctica',
        data: [8, 12, 15, 18, 22, 25, 28, 30, 32, 35],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const accuracyChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Precisión General',
      },
    },
  };

  const trendChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolución Mensual',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Horas de práctica'
        }
      },
    },
  };

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleAudioPreferenceChange = (field: keyof AudioPreferences, value: any) => {
    setAudioPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handlePracticePreferenceChange = (field: keyof PracticePreferences, value: any) => {
    setPracticePreferences(prev => ({ ...prev, [field]: value }));
  };

  const saveChanges = () => {
    setIsEditing(false);
    // Aquí iría la lógica para guardar en la base de datos
    console.log('Cambios guardados:', { userProfile, audioPreferences, practicePreferences });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    // Podría restaurar los valores originales aquí
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Principiante': return '#27ae60';
      case 'Intermedio': return '#f39c12';
      case 'Avanzado': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  const formatJoinDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="user-profile">
      {/* Header */}
      <header className="profile-header">
        <div className="header-content">
          <div className="avatar-section">
            <div className="avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="user-info">
              <h1>{userProfile.firstName} {userProfile.lastName}</h1>
              <p className="user-email">{userProfile.email}</p>
              <span 
                className="user-level"
                style={{ backgroundColor: getLevelColor(userProfile.level) }}
              >
                {userProfile.level}
              </span>
            </div>
          </div>
          <div className="header-actions">
            {isEditing ? (
              <div className="edit-actions">
                <button className="btn btn-success" onClick={saveChanges}>
                  <i className="fas fa-check"></i>
                  Guardar Cambios
                </button>
                <button className="btn btn-outline" onClick={cancelEdit}>
                  <i className="fas fa-times"></i>
                  Cancelar
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                <i className="fas fa-edit"></i>
                Editar Perfil
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="profile-content">
        {/* Navegación por pestañas */}
        <nav className="profile-tabs">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fas fa-user-circle"></i>
            Información Personal
          </button>
          <button 
            className={`tab ${activeTab === 'audio' ? 'active' : ''}`}
            onClick={() => setActiveTab('audio')}
          >
            <i className="fas fa-volume-up"></i>
            Audio
          </button>
          <button 
            className={`tab ${activeTab === 'practice' ? 'active' : ''}`}
            onClick={() => setActiveTab('practice')}
          >
            <i className="fas fa-music"></i>
            Práctica
          </button>
        </nav>

        <div className="tab-content">
          {/* Información Personal */}
          {activeTab === 'profile' && (
            <div className="tab-pane">
              <div className="form-section">
                <h2>Información Personal</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="firstName">Nombre</label>
                    <input
                      type="text"
                      id="firstName"
                      value={userProfile.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Apellidos</label>
                    <input
                      type="text"
                      id="lastName"
                      value={userProfile.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Correo Electrónico</label>
                    <input
                      type="email"
                      id="email"
                      value={userProfile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      disabled={!isEditing}
                    />
                    {isEditing && (
                      <span className="help-text">
                        Se enviará un correo de verificación al cambiar el email
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="level">Nivel</label>
                    <select
                      id="level"
                      value={userProfile.level}
                      onChange={(e) => handleProfileChange('level', e.target.value)}
                      disabled={!isEditing}
                    >
                      <option value="Principiante">Principiante</option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="Avanzado">Avanzado</option>
                    </select>
                  </div>
                </div>

                <div className="read-only-info">
                  <h3>Información de la Cuenta</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Miembro desde</span>
                      <span className="info-value">{formatJoinDate(userProfile.joinDate)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">ID de Usuario</span>
                      <span className="info-value">USR-789234</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Estado de verificación</span>
                      <span className="info-value verified">
                        <i className="fas fa-check-circle"></i>
                        Verificado
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferencias de Audio */}
          {activeTab === 'audio' && (
            <div className="tab-pane">
              <div className="form-section">
                <h2>Preferencias de Audio</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="inputDevice">Dispositivo de Entrada</label>
                    <select
                      id="inputDevice"
                      value={audioPreferences.inputDevice}
                      onChange={(e) => handleAudioPreferenceChange('inputDevice', e.target.value)}
                      disabled={!isEditing}
                    >
                      <option value="micrófono_integrado">Micrófono Integrado</option>
                      <option value="mic_externo_1">Micrófono Externo (USB)</option>
                      <option value="interface_audio">Interface de Audio</option>
                      <option value="piano_digital">Piano Digital (MIDI)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="sensitivity">
                      Sensibilidad del Micrófono: {audioPreferences.sensitivity}%
                    </label>
                    <input
                      type="range"
                      id="sensitivity"
                      min="0"
                      max="100"
                      value={audioPreferences.sensitivity}
                      onChange={(e) => handleAudioPreferenceChange('sensitivity', Number(e.target.value))}
                      disabled={!isEditing}
                    />
                    <div className="range-labels">
                      <span>Baja</span>
                      <span>Alta</span>
                    </div>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={audioPreferences.noiseReduction}
                        onChange={(e) => handleAudioPreferenceChange('noiseReduction', e.target.checked)}
                        disabled={!isEditing}
                      />
                      <span className="checkmark"></span>
                      Reducción de ruido automática
                    </label>
                    <span className="help-text">
                      Elimina automáticamente el ruido de fondo
                    </span>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={audioPreferences.monitoring}
                        onChange={(e) => handleAudioPreferenceChange('monitoring', e.target.checked)}
                        disabled={!isEditing}
                      />
                      <span className="checkmark"></span>
                      Monitoreo de audio en tiempo real
                    </label>
                    <span className="help-text">
                      Escucha tu interpretación mientras practicas
                    </span>
                  </div>
                </div>

                <div className="audio-test">
                  <h3>Prueba de Audio</h3>
                  <p>Ajusta la sensibilidad hasta que el medidor se mantenga en verde al tocar</p>
                  <div className="audio-meter">
                    <div className="meter-bar">
                      <div 
                        className="meter-level"
                        style={{ width: `${audioPreferences.sensitivity}%` }}
                      ></div>
                    </div>
                    <div className="meter-labels">
                      <span>Silencio</span>
                      <span>Óptimo</span>
                      <span>Saturación</span>
                    </div>
                  </div>
                  <button className="btn btn-outline" disabled={!isEditing}>
                    <i className="fas fa-play"></i>
                    Probar Micrófono
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preferencias de Práctica */}
          {activeTab === 'practice' && (
            <div className="tab-pane">
              <div className="form-section">
                <h2>Preferencias de Práctica</h2>
                <div className="form-grid">
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={practicePreferences.metronomeEnabled}
                        onChange={(e) => handlePracticePreferenceChange('metronomeEnabled', e.target.checked)}
                        disabled={!isEditing}
                      />
                      <span className="checkmark"></span>
                      Metrónomo activado por defecto
                    </label>
                  </div>

                  <div className="form-group">
                    <label htmlFor="metronomeVolume">
                      Volumen del metrónomo: {practicePreferences.metronomeVolume}%
                    </label>
                    <input
                      type="range"
                      id="metronomeVolume"
                      min="0"
                      max="100"
                      value={practicePreferences.metronomeVolume}
                      onChange={(e) => handlePracticePreferenceChange('metronomeVolume', Number(e.target.value))}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="defaultTempo">Tempo por defecto (BPM)</label>
                    <input
                      type="number"
                      id="defaultTempo"
                      min="40"
                      max="240"
                      value={practicePreferences.defaultTempo}
                      onChange={(e) => handlePracticePreferenceChange('defaultTempo', Number(e.target.value))}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={practicePreferences.countIn}
                        onChange={(e) => handlePracticePreferenceChange('countIn', e.target.checked)}
                        disabled={!isEditing}
                      />
                      <span className="checkmark"></span>
                      Count-in (compás de preparación)
                    </label>
                  </div>

                  <div className="form-group">
                    <label htmlFor="difficulty">Dificultad predeterminada</label>
                    <select
                      id="difficulty"
                      value={practicePreferences.difficulty}
                      onChange={(e) => handlePracticePreferenceChange('difficulty', e.target.value)}
                      disabled={!isEditing}
                    >
                      <option value="Fácil">Fácil</option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="Avanzado">Avanzado</option>
                    </select>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={practicePreferences.showNoteNames}
                        onChange={(e) => handlePracticePreferenceChange('showNoteNames', e.target.checked)}
                        disabled={!isEditing}
                      />
                      <span className="checkmark"></span>
                      Mostrar nombres de notas
                    </label>
                    <span className="help-text">
                      Muestra el nombre de las notas en la partitura
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Estadísticas Globales */}
        <aside className="stats-sidebar">
          <div className="stats-card">
            <h2>Estadísticas Globales</h2>
            
            <div className="stat-item">
              <div className="stat-icon total-hours">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-content">
                <h3>Total de Horas</h3>
                <span className="stat-value">{userStats.totalPracticeHours}h</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon total-sessions">
                <i className="fas fa-play-circle"></i>
              </div>
              <div className="stat-content">
                <h3>Sesiones</h3>
                <span className="stat-value">{userStats.totalSessions}</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon total-sheets">
                <i className="fas fa-music"></i>
              </div>
              <div className="stat-content">
                <h3>Partituras</h3>
                <span className="stat-value">{userStats.totalSheets}</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon accuracy">
                <i className="fas fa-bullseye"></i>
              </div>
              <div className="stat-content">
                <h3>Precisión Promedio</h3>
                <span className="stat-value">{userStats.averageAccuracy}%</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon streak">
                <i className="fas fa-fire"></i>
              </div>
              <div className="stat-content">
                <h3>Racha Actual</h3>
                <span className="stat-value">{userStats.currentStreak} días</span>
                <span className="stat-subtext">
                  Mejor racha: {userStats.bestStreak} días
                </span>
              </div>
            </div>

            {/* Gráficos de estadísticas */}
            <div className="stats-charts">
              <div className="chart-container">
                <Doughnut data={accuracyData} options={accuracyChartOptions} />
              </div>
              <div className="chart-container">
                <Line data={practiceTrendData} options={trendChartOptions} />
              </div>
            </div>

            <div className="achievements">
              <h3>Logros</h3>
              <div className="badges-grid">
                <div className="badge" title="100 horas de práctica">
                  <i className="fas fa-award"></i>
                </div>
                <div className="badge" title="Racha de 7 días">
                  <i className="fas fa-calendar"></i>
                </div>
                <div className="badge" title="20 partituras practicadas">
                  <i className="fas fa-star"></i>
                </div>
                <div className="badge" title="Precisión > 80%">
                  <i className="fas fa-bullseye"></i>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default UserProfile;