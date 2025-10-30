// src/pages/PracticeSetup/PracticeSetup.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { indexedDBCache } from "../../utils/indexedDBCache";

const API_BASE = "http://localhost:8000";

interface CacheInfo {
  sectionsCount: number;
  cachedAt: string;
  measuresPerSection: number;
}

export default function PracticeSetup() {
  const { sheetMusicId } = useParams();
  const navigate = useNavigate();
  
  const [measuresPerSection, setMeasuresPerSection] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetInfo, setSheetInfo] = useState<any>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);

  // Cargar información de la partitura y verificar cache
  useEffect(() => {
    const fetchSheetInfo = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await axios.get(
          `${API_BASE}/sheets/${sheetMusicId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSheetInfo(response.data);
        
        // Verificar si ya tenemos secciones en IndexedDB
        await checkIndexedDBCache();
      } catch (err) {
        console.error("Error fetching sheet info:", err);
      }
    };

    if (sheetMusicId) {
      fetchSheetInfo();
    }
  }, [sheetMusicId]);

  // Verificar cache en IndexedDB
  const checkIndexedDBCache = async () => {
    if (!sheetMusicId) return;
    
    try {
      const cached = await indexedDBCache.getSections(parseInt(sheetMusicId));
      
      if (cached) {
        const now = Date.now();
        const cacheAge = now - cached.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        if (cacheAge < maxAge) {
          setCacheInfo({
            sectionsCount: cached.sectionsCount,
            cachedAt: new Date(cached.timestamp).toLocaleString(),
            measuresPerSection: cached.measuresPerSection
          });
        } else {
          // Cache expirado, limpiar
          await indexedDBCache.deleteSections(parseInt(sheetMusicId));
          console.log("🧹 Cache expirado, eliminado");
        }
      }
    } catch (e) {
      console.error("Error checking IndexedDB cache:", e);
    }
  };

  // Manejar cambios en el input de compases
  const handleMeasuresChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= 16) {
      setMeasuresPerSection(value);
    }
  };

  const incrementMeasures = () => {
    setMeasuresPerSection(prev => (prev < 16 ? prev + 1 : prev));
  };

  const decrementMeasures = () => {
    setMeasuresPerSection(prev => (prev > 1 ? prev - 1 : prev));
  };

  // Preparar práctica y guardar en IndexedDB
  const handleStartPractice = async () => {
    console.log("🔍 Iniciando práctica optimizada...");
    console.log("📋 Parámetros:", { sheetMusicId, measuresPerSection });
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("📡 Haciendo petición a /api/practice-sessions/sections/prepare");
      
      const token = localStorage.getItem("auth_token");
      const response = await axios.post(
        `${API_BASE}/api/practice-sessions/sections/prepare`,
        {
          sheet_music_id: parseInt(sheetMusicId || "0"),
          measures_per_section: measuresPerSection
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("✅ Respuesta del backend:", response.data);
      
      if (response.data.success) {
        // Guardar secciones en IndexedDB
        await saveSectionsToIndexedDB(response.data.metadata);
        
        console.log("💾 Secciones guardadas en IndexedDB");
        navigate(`/app/section-practice/${sheetMusicId}`, {
          state: { sections: response.data.metadata }
        });
      } else {
        setError(response.data.error || "Error desconocido al preparar la práctica");
      }
    } catch (err: any) {
      console.error("❌ Error en la petición:", err);
      setError(err.response?.data?.detail || err.message || "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar secciones en IndexedDB
  const saveSectionsToIndexedDB = async (metadata: any) => {
    if (!sheetMusicId) return;
    
    try {
      await indexedDBCache.saveSections(parseInt(sheetMusicId), metadata);
      
      // Actualizar info de cache en el UI
      setCacheInfo({
        sectionsCount: metadata.total_sections,
        cachedAt: new Date().toLocaleString(),
        measuresPerSection: metadata.measures_per_section
      });
      
      console.log(`💾 IndexedDB actualizado: ${metadata.total_sections} secciones`);
    } catch (e) {
      console.error("Error guardando en IndexedDB:", e);
      throw e;
    }
  };

  // Usar cache existente
  const useCachedSections = async () => {
    if (!sheetMusicId || !cacheInfo) return;
    
    try {
      const cached = await indexedDBCache.getSections(parseInt(sheetMusicId));
      
      if (cached) {
        console.log("🔄 Usando secciones cacheadas...");
        navigate(`/app/section-practice/${sheetMusicId}`, {
          state: { sections: cached.metadata }
        });
      } else {
        setError("Cache no encontrado");
      }
    } catch (err) {
      console.error("Error usando cache:", err);
      setError("Error cargando cache");
    }
  };

  // Limpiar cache
  const clearCache = async () => {
    if (!sheetMusicId) return;
    
    try {
      await indexedDBCache.deleteSections(parseInt(sheetMusicId));
      setCacheInfo(null);
      console.log("🗑️ Cache limpiado para esta partitura");
    } catch (err) {
      console.error("Error limpiando cache:", err);
    }
  };

  return (
    <div className="practice-setup">
      <div className="practice-setup-header">
        <h1>🎹 Configurar Práctica por Secciones</h1>
        <p>Divide tu partitura en secciones manejables para practicar paso a paso</p>
      </div>

      <div className="setup-content">
        {sheetInfo && (
          <div className="sheet-info">
            <div className="sheet-image">
              <i className="fas fa-music"></i>
            </div>
            <div className="sheet-details">
              <h2>{sheetInfo.title || sheetInfo.titulo}</h2>
              <p className="sheet-composer">Por {sheetInfo.composer || sheetInfo.compositor || "Desconocido"}</p>
              <div className="sheet-meta">
                <span className="difficulty-badge intermedio">Intermedio</span>
                <span className="accuracy-badge">
                  <i className="fas fa-bullseye"></i>
                  Mejor precisión: {sheetInfo.bestAccuracy || 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Información de Cache */}
        {cacheInfo && (
          <div className="cache-section" style={{
            background: '#e8f5e8',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #4caf50'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>
              <i className="fas fa-database"></i> Secciones en Cache (IndexedDB)
            </h4>
            <p style={{ margin: '5px 0', color: '#555' }}>
              <strong>{cacheInfo.sectionsCount} secciones</strong> de {cacheInfo.measuresPerSection} compases
            </p>
            <p style={{ margin: '5px 0', fontSize: '0.9em', color: '#777' }}>
              Cacheado: {cacheInfo.cachedAt}
            </p>
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <button
                onClick={useCachedSections}
                style={{
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-play"></i> Usar Cache
              </button>
              <button
                onClick={clearCache}
                style={{
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-trash"></i> Limpiar
              </button>
            </div>
          </div>
        )}

        <div className="config-section">
          <h3>💡 ¿Cómo funciona?</h3>
          <div className="config-description">
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>Dividiremos tu MIDI en secciones de N compases</li>
              <li>Practicarás cada sección individualmente</li>
              <li>Escucha la referencia, luego toca y graba</li>
              <li>Recibe análisis detallado por sección</li>
              <li>Avanza cuando domines cada sección (&gt;80%)</li>
              <li><strong>Novedad:</strong> Todo se guarda en IndexedDB (sin límite de localStorage)</li>
            </ul>
          </div>
        </div>

        <div className="config-section">
          <h3>Compases por sección</h3>
          <div className="measures-config" style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: '4px solid #3498db'
          }}>
            <div className="config-input-group" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '15px'
            }}>
              <label style={{ fontWeight: '600', color: '#2c3e50', minWidth: '200px' }}>
                Número de compases por sección:
              </label>
              <div className="measures-input" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  className="measure-btn" 
                  onClick={decrementMeasures}
                  disabled={measuresPerSection <= 1}
                  style={{
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    width: '35px',
                    height: '35px',
                    borderRadius: '6px',
                    cursor: measuresPerSection <= 1 ? 'not-allowed' : 'pointer',
                    opacity: measuresPerSection <= 1 ? 0.5 : 1
                  }}
                >
                  -
                </button>
                <input
                  type="number"
                  value={measuresPerSection}
                  onChange={handleMeasuresChange}
                  min="1"
                  max="16"
                  style={{
                    width: '80px',
                    padding: '10px',
                    border: '2px solid #bdc3c7',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                />
                <button 
                  className="measure-btn" 
                  onClick={incrementMeasures}
                  disabled={measuresPerSection >= 16}
                  style={{
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    width: '35px',
                    height: '35px',
                    borderRadius: '6px',
                    cursor: measuresPerSection >= 16 ? 'not-allowed' : 'pointer',
                    opacity: measuresPerSection >= 16 ? 0.5 : 1
                  }}
                >
                  +
                </button>
              </div>
            </div>
            <div className="config-note" style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '6px',
              padding: '12px',
              marginTop: '15px',
              fontSize: '0.9rem',
              color: '#856404'
            }}>
              <i className="fas fa-lightbulb"></i>
              Recomendado: 4 compases. Secciones más pequeñas = práctica más detallada
            </div>
          </div>
        </div>

        <div className="config-section">
          <h3>📊 Vista previa</h3>
          <div className="preview-section" style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: '4px solid #27ae60'
          }}>
            <p>
              Tu pieza será dividida automáticamente en secciones de{" "}
              <strong>{measuresPerSection}</strong> compases. El número total de
              secciones dependerá de la longitud de la pieza.
            </p>
            {cacheInfo && cacheInfo.measuresPerSection === measuresPerSection && (
              <p style={{ color: '#27ae60', fontWeight: '600' }}>
                <i className="fas fa-bolt"></i> Ya tienes esta configuración en cache
              </p>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="loading-section" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner" style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <h3>Preparando práctica...</h3>
            <p>📂 Descargando MIDI de Azure...</p>
            <p>✂️ Dividiendo en secciones...</p>
            <p>🔊 Generando audio de referencia...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {error && (
          <div className="error-section" style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <h3>❌ Error al preparar la práctica</h3>
            <p>{error}</p>
            <button 
              className="retry-button" 
              onClick={handleStartPractice}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="action-section" style={{ textAlign: 'center', marginTop: '30px' }}>
          {cacheInfo && cacheInfo.measuresPerSection === measuresPerSection ? (
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                className="start-button"
                onClick={useCachedSections}
                style={{
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  padding: '15px 30px',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-bolt"></i> Usar Cache
              </button>
              <button
                className="start-button"
                onClick={handleStartPractice}
                disabled={isLoading}
                style={{
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '15px 30px',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {isLoading ? "Preparando..." : "🔄 Regenerar"}
              </button>
            </div>
          ) : (
            <button
              className="start-button"
              onClick={handleStartPractice}
              disabled={isLoading}
              style={{
                background: isLoading ? '#bdc3c7' : '#27ae60',
                color: 'white',
                border: 'none',
                padding: '15px 40px',
                fontSize: '1.2rem',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {isLoading ? "Preparando..." : "▶️ Comenzar Práctica"}
            </button>
          )}
        </div>
      </div>

      <div className="tips-section" style={{ marginTop: '40px' }}>
        <h3>💡 Consejos para practicar</h3>
        <div className="tips-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          <div className="tip-card" style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <i className="fas fa-headphones" style={{ fontSize: '2rem', color: '#3498db', marginBottom: '10px' }}></i>
            <h4>Escucha primero</h4>
            <p>Reproduce cada sección varias veces antes de tocar</p>
          </div>
          <div className="tip-card" style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <i className="fas fa-clock" style={{ fontSize: '2rem', color: '#e67e22', marginBottom: '10px' }}></i>
            <h4>Tómate tu tiempo</h4>
            <p>Puedes esperar después de presionar "Grabar"</p>
          </div>
          <div className="tip-card" style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <i className="fas fa-waveform" style={{ fontSize: '2rem', color: '#9b59b6', marginBottom: '10px' }}></i>
            <h4>Sé consistente</h4>
            <p>Intenta mantener el mismo tempo que la referencia</p>
          </div>
          <div className="tip-card" style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <i className="fas fa-medal" style={{ fontSize: '2rem', color: '#e74c3c', marginBottom: '10px' }}></i>
            <h4>No te apresures</h4>
            <p>Domina cada sección antes de avanzar</p>
          </div>
        </div>
      </div>

      {/* Información de optimización */}
      <div className="optimization-info" style={{
        marginTop: '30px',
        padding: '15px',
        background: '#e3f2fd',
        borderRadius: '8px',
        border: '1px solid #2196f3'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
          <i className="fas fa-rocket"></i> Optimizado con IndexedDB
        </h4>
        <p style={{ margin: '5px 0', fontSize: '0.9em', color: '#555' }}>
          <strong>Sin límites:</strong> IndexedDB puede almacenar hasta 50MB+ de audio
        </p>
        <p style={{ margin: '5px 0', fontSize: '0.9em', color: '#555' }}>
          <strong>Más rápido:</strong> Las secciones se cargan instantáneamente desde tu navegador
        </p>
        <p style={{ margin: '5px 0', fontSize: '0.9em', color: '#555' }}>
          <strong>Funciona offline:</strong> Practica sin conexión después de la primera carga
        </p>
      </div>
    </div>
  );
}