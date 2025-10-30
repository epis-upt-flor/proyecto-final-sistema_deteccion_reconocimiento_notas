import React, { useState, useEffect, useRef } from 'react';
import './PracticeView.css';

// Interfaces TypeScript
interface NoteFeedback {
  expectedNote: string;
  detectedNote: string;
  isCorrect: boolean;
  rhythmOffset: number;
  timestamp: number;
}

interface PracticeMetrics {
  currentAccuracy: number;
  currentRhythm: number;
  totalNotes: number;
  correctNotes: number;
  rhythmAccuracy: number;
}

const PracticeView: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [volume, setVolume] = useState(80);
  const [feedback, setFeedback] = useState<NoteFeedback | null>(null);
  const [metrics, setMetrics] = useState<PracticeMetrics>({
    currentAccuracy: 0,
    currentRhythm: 0,
    totalNotes: 0,
    correctNotes: 0,
    rhythmAccuracy: 0
  });
  const [progress, setProgress] = useState(0);

  // Datos mockeados de la partitura
  const sheetMusic = {
    title: 'Claro de Luna',
    composer: 'Claude Debussy',
    notes: [
      'C4', 'E4', 'G4', 'C5', 'E4', 'G4', 'C5', 'E4',
      'G4', 'C5', 'E4', 'G4', 'C5', 'D4', 'F4', 'A4',
      'D4', 'F4', 'A4', 'D4', 'F4', 'A4', 'D4', 'F4',
      'A4', 'C4', 'E4', 'G4', 'C5', 'E4', 'G4', 'C5'
    ],
    duration: 120, // segundos
    timeSignature: '4/4',
    bpm: 60
  };

  const practiceTimer = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimer = useRef<NodeJS.Timeout | null>(null);

  // Simular detección de notas (en una app real, esto vendría del modelo de IA)
  const simulateNoteDetection = () => {
    const expectedNote = sheetMusic.notes[currentNoteIndex];
    
    // Simular diferentes escenarios: correcto, incorrecto, o con error de ritmo
    const scenarios = [
      { note: expectedNote, offset: 0, correct: true }, // Correcto
      { note: expectedNote, offset: 50, correct: true }, // Correcto con ritmo ligeramente desfasado
      { note: expectedNote, offset: 120, correct: false }, // Error de ritmo
      { note: getRandomNote(expectedNote), offset: 0, correct: false } // Nota incorrecta
    ];
    
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    const newFeedback: NoteFeedback = {
      expectedNote,
      detectedNote: scenario.note,
      isCorrect: scenario.correct,
      rhythmOffset: scenario.offset,
      timestamp: Date.now()
    };
    
    setFeedback(newFeedback);
    
    // Actualizar métricas
    setMetrics(prev => {
      const newTotalNotes = prev.totalNotes + 1;
      const newCorrectNotes = prev.correctNotes + (scenario.correct ? 1 : 0);
      const newAccuracy = (newCorrectNotes / newTotalNotes) * 100;
      const newRhythmAccuracy = scenario.correct 
        ? Math.max(0, 100 - (Math.abs(scenario.offset) / 2))
        : prev.rhythmAccuracy;
      
      return {
        currentAccuracy: newAccuracy,
        currentRhythm: newRhythmAccuracy,
        totalNotes: newTotalNotes,
        correctNotes: newCorrectNotes,
        rhythmAccuracy: newRhythmAccuracy
      };
    });

    // Limpiar feedback después de un tiempo
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
    }
    
    feedbackTimer.current = setTimeout(() => {
      setFeedback(null);
    }, 2000);
  };

  const getRandomNote = (currentNote: string): string => {
    const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
    const otherNotes = notes.filter(note => note !== currentNote);
    return otherNotes[Math.floor(Math.random() * otherNotes.length)];
  };

  const startPractice = () => {
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentNoteIndex(0);
    setProgress(0);
    setMetrics({
      currentAccuracy: 0,
      currentRhythm: 0,
      totalNotes: 0,
      correctNotes: 0,
      rhythmAccuracy: 0
    });

    // Simular el progreso de la práctica
    const noteInterval = (sheetMusic.duration * 1000) / sheetMusic.notes.length;
    
    if (practiceTimer.current) {
      clearInterval(practiceTimer.current);
    }

    practiceTimer.current = setInterval(() => {
      setCurrentNoteIndex(prev => {
        const newIndex = prev + 1;
        const newProgress = (newIndex / sheetMusic.notes.length) * 100;
        
        setProgress(newProgress);
        
        if (newIndex >= sheetMusic.notes.length) {
          if (practiceTimer.current) {
            clearInterval(practiceTimer.current);
          }
          setIsPlaying(false);
          return prev;
        }
        
        // Simular detección de nota
        simulateNoteDetection();
        return newIndex;
      });
    }, noteInterval);
  };

  const pausePractice = () => {
    setIsPaused(!isPaused);
    if (practiceTimer.current) {
      if (isPaused) {
        // Reanudar
        startPractice();
      } else {
        // Pausar
        clearInterval(practiceTimer.current);
      }
    }
  };

  const stopPractice = () => {
    if (practiceTimer.current) {
      clearInterval(practiceTimer.current);
    }
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
    }
    setIsPlaying(false);
    setIsPaused(false);
    setFeedback(null);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  // Efecto de limpieza
  useEffect(() => {
    return () => {
      if (practiceTimer.current) {
        clearInterval(practiceTimer.current);
      }
      if (feedbackTimer.current) {
        clearTimeout(feedbackTimer.current);
      }
    };
  }, []);

  const getFeedbackColor = () => {
    if (!feedback) return '#f0f0f0';
    if (!feedback.isCorrect) return '#e74c3c'; // Rojo para incorrecto
    if (Math.abs(feedback.rhythmOffset) > 100) return '#f39c12'; // Ámbar para ritmo desfasado
    return '#2ecc71'; // Verde para correcto
  };

  const getFeedbackMessage = () => {
    if (!feedback) return 'Esperando...';
    if (!feedback.isCorrect) return 'Nota incorrecta';
    if (Math.abs(feedback.rhythmOffset) > 100) return 'Ritmo desfasado';
    if (Math.abs(feedback.rhythmOffset) > 50) return 'Bien, pero un poco tarde/temprano';
    return '¡Perfecto!';
  };

  return (
    <div className="practice-view">
      {/* Header */}
      <header className="practice-header">
        <h1>Practicando: {sheetMusic.title}</h1>
        <p className="composer">{sheetMusic.composer}</p>
        <div className="music-info">
          <span>Compás: {sheetMusic.timeSignature}</span>
          <span>Tempo: {sheetMusic.bpm} BPM</span>
          <span>Duración: {Math.floor(sheetMusic.duration / 60)}:
          {(sheetMusic.duration % 60).toString().padStart(2, '0')}</span>
        </div>
      </header>

      <div className="practice-container">
        {/* Visualizador de Partitura */}
        <div className="sheet-display">
          <div className="sheet-header">
            <h3>Partitura en tiempo real</h3>
            <div className="current-position">
              Nota {currentNoteIndex + 1} de {sheetMusic.notes.length}
            </div>
          </div>
          
          <div className="staff">
            <div className="notes-container">
              {sheetMusic.notes.map((note, index) => (
                <div
                  key={index}
                  className={`note ${index === currentNoteIndex ? 'current' : ''} ${index < currentNoteIndex ? 'played' : ''}`}
                >
                  <span className="note-text">{note}</span>
                  {index === currentNoteIndex && (
                    <div className="current-indicator">
                      <i className="fas fa-music"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Medidor de Progreso */}
          <div className="progress-meter">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {Math.round(progress)}% completado
            </div>
          </div>
        </div>

        {/* Panel de Retroalimentación */}
        <div className="feedback-panel">
          <h3>Retroalimentación en Tiempo Real</h3>
          
          {/* Semáforo Visual */}
          <div className="feedback-visual">
            <div 
              className="feedback-circle"
              style={{ backgroundColor: getFeedbackColor() }}
            >
              <i className="fas fa-music"></i>
            </div>
            <div className="feedback-message">
              {getFeedbackMessage()}
            </div>
          </div>

          {/* Indicadores de Notas */}
          <div className="note-indicators">
            <div className="note-indicator">
              <label>Nota esperada:</label>
              <div className="note-display expected">
                {feedback?.expectedNote || sheetMusic.notes[currentNoteIndex] || '--'}
              </div>
            </div>
            
            <div className="note-indicator">
              <label>Nota detectada:</label>
              <div className="note-display detected">
                {feedback?.detectedNote || '--'}
              </div>
            </div>
          </div>

          {/* Métricas Live */}
          <div className="live-metrics">
            <div className="metric">
              <label>Precisión:</label>
              <span className="metric-value accuracy">
                {metrics.currentAccuracy.toFixed(1)}%
              </span>
            </div>
            
            <div className="metric">
              <label>Ritmo:</label>
              <span className="metric-value rhythm">
                {feedback ? `${feedback.rhythmOffset > 0 ? '+' : ''}${feedback.rhythmOffset}ms` : '±0ms'}
              </span>
            </div>
            
            <div className="metric">
              <label>Notas correctas:</label>
              <span className="metric-value">
                {metrics.correctNotes}/{metrics.totalNotes}
              </span>
            </div>
          </div>

          {/* Panel de Control */}
          <div className="control-panel">
            <h3>Controles de Práctica</h3>
            
            <div className="control-buttons">
              <button
                className={`btn ${!isPlaying ? 'btn-primary' : 'btn-secondary'}`}
                onClick={isPlaying ? stopPractice : startPractice}
                disabled={isPlaying && !isPaused}
              >
                <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'}`}></i>
                {isPlaying ? 'Detener' : 'Comenzar'}
              </button>
              
              <button
                className="btn btn-warning"
                onClick={pausePractice}
                disabled={!isPlaying}
              >
                <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'}`}></i>
                {isPaused ? 'Reanudar' : 'Pausar'}
              </button>
            </div>

            {/* Control de Volumen */}
            <div className="volume-control">
              <label>
                <i className="fas fa-microphone"></i>
                Volumen del micrófono:
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
              <span className="volume-value">{volume}%</span>
            </div>

            {/* Estado actual */}
            <div className="practice-status">
              <div className={`status-indicator ${isPlaying ? (isPaused ? 'paused' : 'playing') : 'stopped'}`}>
                <i className={`fas ${
                  isPlaying ? (isPaused ? 'fa-pause-circle' : 'fa-play-circle') : 'fa-stop-circle'
                }`}></i>
                {isPlaying ? (isPaused ? 'En pausa' : 'Reproduciendo') : 'Detenido'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de rendimiento */}
      <div className="performance-summary">
        <h3>Resumen de Rendimiento</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon accuracy">
              <i className="fas fa-bullseye"></i>
            </div>
            <div className="summary-content">
              <h4>Precisión General</h4>
              <span className="summary-value">
                {metrics.currentAccuracy.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon rhythm">
              <i className="fas fa-metronome"></i>
            </div>
            <div className="summary-content">
              <h4>Precisión Rítmica</h4>
              <span className="summary-value">
                {metrics.rhythmAccuracy.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon speed">
              <i className="fas fa-tachometer-alt"></i>
            </div>
            <div className="summary-content">
              <h4>Velocidad</h4>
              <span className="summary-value">
                {sheetMusic.bpm} BPM
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeView;