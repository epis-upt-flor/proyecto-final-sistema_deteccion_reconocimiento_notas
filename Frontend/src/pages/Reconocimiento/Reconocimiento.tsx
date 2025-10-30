import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Reconocimiento.css';

interface SheetMusic {
  id: number;
  titulo: string;
  compositor: string;
  midi_url: string;
  imagen_url: string | null;
}

interface AnalysisResult {
  analysis: {
    correct_notes: number;
    wrong_notes: number;
    missed_notes: number;
    extra_notes: number;
    total_expected: number;
    accuracy: number;
    timing_errors: TimingError[];
    pitch_errors: PitchError[];
  };
  sheet_music: {
    id: number;
    titulo: string;
    compositor: string;
    midi_url: string;
    imagen_url: string | null;
  };
}

interface TimingError {
  note: string;
  expected_time: number;
  actual_time: number;
  error: number;
}

interface PitchError {
  expected: string;
  actual: string;
  time: number;
}

export default function Reconocimiento() {
  const { sheetId } = useParams<{ sheetId: string }>();
  const navigate = useNavigate();
  
  const [sheetMusic, setSheetMusic] = useState<SheetMusic | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId') || '1';
  const API_BASE = 'http://localhost:8000';

  // Cargar información de la partitura seleccionada
  useEffect(() => {
    if (!sheetId) {
      setError('No se especificó una partitura');
      setLoading(false);
      return;
    }

    fetchSheetMusic();
  }, [sheetId]);

  const fetchSheetMusic = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/sheets/${sheetId}`);
      
      setSheetMusic({
        id: response.data.sheet_id,
        titulo: response.data.title,
        compositor: response.data.composer,
        midi_url: response.data.midi_url,
        imagen_url: response.data.file_url
      });
    } catch (err) {
      setError('Error al cargar la partitura');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      setError('');
    }
  };

  const analyzePerformance = async () => {
    if (!audioFile) {
      setError('Sube tu interpretación en audio');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('sheet_id', sheetId!);
    formData.append('user_id', userId);

    try {
      const response = await axios.post<AnalysisResult>(
        `${API_BASE}/api/practice-sessions/analyze-and-save`,
        formData,
        { 
          headers: { 'Content-Type': 'multipart/form-data' },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al analizar la interpretación');
      console.error('Error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadMidi = () => {
    if (result?.sheet_music.midi_url) {
      window.open(result.sheet_music.midi_url, '_blank');
    }
  };

  const goBack = () => {
    navigate('/app/library');
  };

  const analyzeAgain = () => {
    setAudioFile(null);
    setResult(null);
    setError('');
  };

  const FilePreview = ({ file, emoji }: { file: File; emoji: string }) => (
    <div style={{
      background: '#f8f9fa',
      padding: '16px',
      borderRadius: '8px',
      marginTop: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      border: '1px solid #e9ecef'
    }}>
      <span style={{ fontSize: '1.5rem' }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '4px' }}>{file.name}</div>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          {(file.size / (1024 * 1024)).toFixed(2)} MB
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="reconocimiento-container" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>Cargando partitura...</p>
        </div>
      </div>
    );
  }

  if (!sheetMusic && !loading) {
    return (
      <div className="reconocimiento-container" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '3rem' }}>❌</span>
          <h2 style={{ marginTop: '20px', color: '#2d3748' }}>Error al cargar</h2>
          <p style={{ color: '#718096', marginTop: '12px' }}>{error || 'No se pudo cargar la partitura'}</p>
          <button
            onClick={goBack}
            style={{
              marginTop: '24px',
              padding: '12px 32px',
              background: '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Volver a la biblioteca
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reconocimiento-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 20px',
      backgroundColor: 'white'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#2d3748',
            marginBottom: '10px'
          }}>
            Análisis de Interpretación
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#718096',
            margin: 0
          }}>
            Sube tu grabación y analiza tu interpretación
          </p>
        </div>

        {/* Partitura seleccionada */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          border: '2px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '2rem' }}>🎵</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '1.3rem',
                color: '#2d3748',
                fontWeight: '600'
              }}>
                {sheetMusic?.titulo}
              </h3>
              <p style={{ margin: 0, color: '#718096', fontSize: '1rem' }}>
                {sheetMusic?.compositor}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        {!result ? (
          <>
            {/* Subir audio */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '32px',
              marginBottom: '24px'
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#2d3748',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Tu interpretación
              </h2>
              <p style={{ 
                color: '#718096',
                margin: '0 0 24px 0',
                textAlign: 'center'
              }}>
                Sube un archivo de audio con tu interpretación
              </p>

              <div style={{
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                <div style={{
                  border: '2px dashed #cbd5e0',
                  borderRadius: '8px',
                  padding: '40px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: '#ffffff'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4299e1'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e0'}>
                  <input
                    type="file"
                    accept=".wav,.mp3,.m4a"
                    onChange={handleAudioUpload}
                    style={{ display: 'none' }}
                    id="audio-upload"
                  />
                  <label htmlFor="audio-upload" style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎤</div>
                    <p style={{ 
                      fontWeight: '600', 
                      color: '#4a5568',
                      marginBottom: '8px',
                      fontSize: '1.1rem'
                    }}>
                      Haz clic para subir archivo de audio
                    </p>
                    <p style={{ 
                      color: '#718096',
                      fontSize: '0.9rem',
                      margin: 0
                    }}>
                      Formatos: WAV, MP3, M4A
                    </p>
                  </label>
                </div>

                {audioFile && <FilePreview file={audioFile} emoji="🎵" />}
              </div>
            </div>

            {/* Botones de acción */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <button
                onClick={goBack}
                style={{
                  padding: '12px 32px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#cbd5e0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                }}
              >
                Volver
              </button>

              <button
                onClick={analyzePerformance}
                disabled={!audioFile || isAnalyzing}
                style={{
                  padding: '12px 32px',
                  background: !audioFile || isAnalyzing ? '#cbd5e0' : '#48bb78',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: !audioFile || isAnalyzing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: !audioFile || isAnalyzing ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (audioFile && !isAnalyzing) {
                    e.currentTarget.style.background = '#38a169';
                  }
                }}
                onMouseLeave={(e) => {
                  if (audioFile && !isAnalyzing) {
                    e.currentTarget.style.background = '#48bb78';
                  }
                }}
              >
                {isAnalyzing ? 'Analizando...' : 'Analizar Interpretación'}
              </button>
            </div>
          </>
        ) : (
          /* Resultados */
          <>
            {/* Info de la sesión */}
            <div style={{
              padding: '24px',
              background: '#c6f6d5',
              borderRadius: '12px',
              marginBottom: '32px',
              borderLeft: '4px solid #48bb78'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '2rem' }}>✅</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#276749' }}>
                    Análisis completado
                  </h3>
                  <p style={{ margin: '0', color: '#22543d', fontSize: '1rem' }}>
                    <strong>{result.sheet_music.titulo}</strong> - {result.sheet_music.compositor}
                  </p>
                </div>
                <button
                  onClick={downloadMidi}
                  style={{
                    padding: '10px 20px',
                    background: '#38a169',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Descargar MIDI
                </button>
              </div>
            </div>

            {/* Métricas principales */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '32px',
              marginBottom: '24px'
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#2d3748',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                Resultados del Análisis
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '24px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#4299e1',
                    marginBottom: '8px'
                  }}>
                    {result.analysis.accuracy.toFixed(1)}%
                  </div>
                  <div style={{ color: '#718096', fontSize: '1rem', fontWeight: '600' }}>
                    Precisión
                  </div>
                </div>

                <div style={{
                  textAlign: 'center',
                  padding: '24px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#48bb78',
                    marginBottom: '8px'
                  }}>
                    {result.analysis.correct_notes}
                  </div>
                  <div style={{ color: '#718096', fontSize: '1rem', fontWeight: '600' }}>
                    Correctas
                  </div>
                </div>

                <div style={{
                  textAlign: 'center',
                  padding: '24px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#f56565',
                    marginBottom: '8px'
                  }}>
                    {result.analysis.wrong_notes}
                  </div>
                  <div style={{ color: '#718096', fontSize: '1rem', fontWeight: '600' }}>
                    Incorrectas
                  </div>
                </div>

                <div style={{
                  textAlign: 'center',
                  padding: '24px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#ed8936',
                    marginBottom: '8px'
                  }}>
                    {result.analysis.missed_notes}
                  </div>
                  <div style={{ color: '#718096', fontSize: '1rem', fontWeight: '600' }}>
                    Omitidas
                  </div>
                </div>
              </div>

              {/* Errores de notas */}
              {result.analysis.pitch_errors.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    color: '#2d3748',
                    marginBottom: '16px'
                  }}>
                    Errores de Notas
                  </h3>
                  <p style={{
                    color: '#718096',
                    marginBottom: '20px',
                    fontSize: '1rem'
                  }}>
                    Se encontraron {result.analysis.pitch_errors.length} errores en tu interpretación
                  </p>

                  <div style={{
                    background: '#ffffff',
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {result.analysis.pitch_errors.slice(0, 5).map((error, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '16px 0',
                          borderBottom: idx < 4 ? '1px solid #e2e8f0' : 'none'
                        }}
                      >
                        <div style={{
                          fontWeight: '600',
                          fontSize: '1rem',
                          color: '#4a5568'
                        }}>
                          {error.time.toFixed(1)}s
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '1rem'
                        }}>
                          <span style={{
                            color: '#f56565',
                            fontWeight: '600'
                          }}>
                            {error.actual}
                          </span>
                          <span style={{ color: '#718096' }}>→</span>
                          <span style={{
                            color: '#48bb78',
                            fontWeight: '600'
                          }}>
                            {error.expected}
                          </span>
                        </div>
                      </div>
                    ))}
                    {result.analysis.pitch_errors.length > 5 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '16px',
                        color: '#718096',
                        fontSize: '1rem'
                      }}>
                        Y {result.analysis.pitch_errors.length - 5} errores más...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botones finales */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <button
                onClick={goBack}
                style={{
                  padding: '12px 32px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Volver a la biblioteca
              </button>

              <button
                onClick={analyzeAgain}
                style={{
                  padding: '12px 32px',
                  background: '#4299e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Analizar otra vez
              </button>
            </div>
          </>
        )}

        {/* Mensajes de error */}
        {error && (
          <div style={{
            background: '#fed7d7',
            color: '#c53030',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '1rem',
            borderLeft: '4px solid #f56565'
          }}>
            <span style={{ fontSize: '1.3rem' }}>❌</span>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Error</div>
              <div>{error}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}