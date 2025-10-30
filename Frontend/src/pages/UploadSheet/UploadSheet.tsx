import { useState } from 'react';
import axios from 'axios';
import './UploadSheet.css';

export default function UploadSheet() {
  const [titulo, setTitulo] = useState('');
  const [compositor, setCompositor] = useState('');
  const [midiFile, setMidiFile] = useState<File | null>(null);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(0);

  const userId = localStorage.getItem('userId') || '1';
  const API_BASE = 'http://localhost:8000';

  const handleMidiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMidiFile(e.target.files[0]);
      setError('');
    }
  };

  const handleImagenUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagenFile(e.target.files[0]);
    }
  };

  const uploadSheet = async () => {
    if (!titulo.trim()) {
      setError('Ingresa el título de la pieza');
      return;
    }

    if (!compositor.trim()) {
      setError('Ingresa el compositor');
      return;
    }

    if (!midiFile) {
      setError('Sube un archivo MIDI');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('title', titulo);
    formData.append('composer', compositor);
    formData.append('file', midiFile);

    // Opcional: enviar imagen si existe
    if (imagenFile) {
      formData.append('imagen_file', imagenFile);
    }

    try {
      const response = await axios.post(
        `${API_BASE}/sheets/upload`,
        formData,
        { 
          headers: { 'Content-Type': 'multipart/form-data' },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      setSuccessMessage(`✅ "${titulo}" guardado en tu biblioteca`);
      setTitulo('');
      setCompositor('');
      setMidiFile(null);
      setImagenFile(null);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error('Error completo:', err.response);
      setError(err.response?.data?.detail || err.message || 'Error al subir la partitura');
    } finally {
      setIsUploading(false);
    }
  };

  const ProgressStep = ({ step, index, currentStep }: { step: string; index: number; currentStep: number }) => (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{
        width: '35px',
        height: '35px',
        borderRadius: '50%',
        backgroundColor: index <= currentStep ? '#4361ee' : '#ddd',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        margin: '0 auto 8px',
        fontSize: '0.9rem'
      }}>
        {index + 1}
      </div>
      <div style={{
        fontSize: '0.85rem',
        color: index <= currentStep ? '#4361ee' : '#666',
        fontWeight: index === currentStep ? '600' : 'normal'
      }}>
        {step}
      </div>
    </div>
  );

  const FilePreview = ({ file, emoji }: { file: File; emoji: string }) => (
    <div style={{
      background: '#f8f9fa',
      padding: '12px',
      borderRadius: '6px',
      marginTop: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
      <div>
        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{file.name}</div>
        <div style={{ color: '#666', fontSize: '0.85rem' }}>
          {(file.size / 1024).toFixed(2)} KB
        </div>
      </div>
    </div>
  );

  const nextSection = () => {
    if (activeSection === 0) {
      if (!titulo.trim() || !compositor.trim()) {
        setError('Completa los datos de la pieza');
        return;
      }
    }
    if (activeSection < 1) setActiveSection(activeSection + 1);
  };

  const prevSection = () => {
    if (activeSection > 0) setActiveSection(activeSection - 1);
  };

  return (
    <div className="upload-sheet-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 20px',
      backgroundColor: 'white'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '800px',
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        margin: '0 auto'
      }}>
        <div className="header" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="title" style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#2d3748',
            marginBottom: '10px'
          }}>
            Subir Nueva Partitura
          </h1>
          <p className="subtitle" style={{ 
            fontSize: '1.1rem', 
            color: '#718096',
            margin: 0
          }}>
            Agrega una nueva obra musical a tu biblioteca
          </p>
        </div>

        {/* Indicador de progreso */}
        <div style={{ 
          marginBottom: '40px',
          padding: '0 20px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '10px', 
            position: 'relative',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            {['Información', 'Archivos'].map((step, index) => (
              <ProgressStep key={index} step={step} index={index} currentStep={activeSection} />
            ))}
          </div>
        </div>

        {/* Sección 1: Información de la pieza */}
        {activeSection === 0 && (
          <div className="card" style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '20px'
          }}>
            <div className="card-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 className="section-title" style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#2d3748',
                marginBottom: '8px'
              }}>
                Información de la pieza
              </h2>
              <p className="section-description" style={{ 
                color: '#718096',
                margin: 0
              }}>
                Proporciona los detalles básicos de la obra musical
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '24px',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <div className="form-group">
                <label className="form-label" style={{
                  display: 'block',
                  fontWeight: '600',
                  color: '#4a5568',
                  marginBottom: '8px',
                  fontSize: '0.95rem'
                }}>Título *</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Nocturne Op. 9 No. 2"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4299e1'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{
                  display: 'block',
                  fontWeight: '600',
                  color: '#4a5568',
                  marginBottom: '8px',
                  fontSize: '0.95rem'
                }}>Compositor *</label>
                <input
                  type="text"
                  value={compositor}
                  onChange={(e) => setCompositor(e.target.value)}
                  placeholder="Ej: Frédéric Chopin"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4299e1'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
            <div className="navigation" style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '32px'
            }}>
              <button onClick={nextSection} style={{
                background: '#4299e1',
                color: 'white',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3182ce';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#4299e1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Sección 2: Archivos de la pieza */}
        {activeSection === 1 && (
          <div className="card" style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '20px'
          }}>
            <div className="card-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 className="section-title" style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#2d3748',
                marginBottom: '8px'
              }}>
                Archivos de la partitura
              </h2>
              <p className="section-description" style={{ 
                color: '#718096',
                margin: 0
              }}>
                Sube el archivo MIDI y opcionalmente una imagen de la partitura
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '32px',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <div className="form-group">
                <label className="form-label" style={{
                  display: 'block',
                  fontWeight: '600',
                  color: '#4a5568',
                  marginBottom: '12px',
                  fontSize: '0.95rem'
                }}>Archivo MIDI (requerido) *</label>
                <div className="file-upload-area" style={{
                  border: '2px dashed #cbd5e0',
                  borderRadius: '8px',
                  padding: '32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: '#f7fafc'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4299e1'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e0'}>
                  <input
                    type="file"
                    accept=".mid,.midi"
                    onChange={handleMidiUpload}
                    style={{ display: 'none' }}
                    id="midi-upload"
                  />
                  <label htmlFor="midi-upload" style={{ cursor: 'pointer' }}>
                    <p style={{ 
                      fontWeight: '600', 
                      color: '#4a5568',
                      marginBottom: '8px',
                      fontSize: '1.1rem'
                    }}>Haz clic para subir archivo MIDI</p>
                    <p style={{ 
                      color: '#718096',
                      fontSize: '0.9rem',
                      margin: 0
                    }}>Formatos: .mid, .midi</p>
                  </label>
                </div>
                {midiFile && <FilePreview file={midiFile} emoji="🎵" />}
              </div>

              <div className="form-group">
                <label className="form-label" style={{
                  display: 'block',
                  fontWeight: '600',
                  color: '#4a5568',
                  marginBottom: '12px',
                  fontSize: '0.95rem'
                }}>Imagen de partitura (opcional)</label>
                <div className="file-upload-area" style={{
                  border: '2px dashed #cbd5e0',
                  borderRadius: '8px',
                  padding: '32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: '#f7fafc'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4299e1'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e0'}>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={handleImagenUpload}
                    style={{ display: 'none' }}
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" style={{ cursor: 'pointer' }}>
                    <p style={{ 
                      fontWeight: '600', 
                      color: '#4a5568',
                      marginBottom: '8px',
                      fontSize: '1.1rem'
                    }}>Haz clic para subir imagen</p>
                    <p style={{ 
                      color: '#718096',
                      fontSize: '0.9rem',
                      margin: 0
                    }}>Formatos: .png, .jpg, .jpeg</p>
                  </label>
                </div>
                {imagenFile && <FilePreview file={imagenFile} emoji="🖼️" />}
              </div>
            </div>
            <div className="navigation" style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '32px'
            }}>
              <button onClick={prevSection} style={{
                background: '#e2e8f0',
                color: '#4a5568',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#cbd5e0';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                Anterior
              </button>
              <button
                onClick={uploadSheet}
                disabled={isUploading || !titulo || !compositor || !midiFile}
                style={{
                  background: isUploading || !titulo || !compositor || !midiFile 
                    ? '#cbd5e0' 
                    : '#48bb78',
                  color: 'white',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isUploading || !titulo || !compositor || !midiFile ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isUploading || !titulo || !compositor || !midiFile ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isUploading && titulo && compositor && midiFile) {
                    e.currentTarget.style.background = '#38a169';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isUploading && titulo && compositor && midiFile) {
                    e.currentTarget.style.background = '#48bb78';
                  }
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isUploading ? 'Subiendo...' : 'Guardar Partitura'}
              </button>
            </div>
          </div>
        )}

        {/* Mensajes */}
        {error && (
          <div style={{
            background: '#fed7d7',
            color: '#c53030',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.95rem',
            borderLeft: '4px solid #f56565'
          }}>
            <span>❌</span>
            <div>{error}</div>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: '#c6f6d5',
            color: '#276749',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.95rem',
            borderLeft: '4px solid #48bb78'
          }}>
            <span>✅</span>
            <div>{successMessage}</div>
          </div>
        )}
      </div>
    </div>
  );
}