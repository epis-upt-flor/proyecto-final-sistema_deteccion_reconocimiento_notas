import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SheetMusicLibrary.css';

// Interfaces TypeScript
interface SheetMusic {
  id: number;
  title: string;
  composer: string;
  image: string;
  difficulty: 'Fácil' | 'Intermedio' | 'Avanzado';
  bestAccuracy: number;
  lastPractice: string;
  tags: string[];
  isFavorite: boolean;
}

interface SheetMusicLibraryProps {
  onSelectSheet: (sheetId: number) => void;
  onUploadSheet: () => void;
}

const API_BASE = 'http://localhost:8000';

const SheetMusicLibrary: React.FC<SheetMusicLibraryProps> = ({ onSelectSheet, onUploadSheet }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sheets, setSheets] = useState<SheetMusic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Obtener token de autenticación
  const token = localStorage.getItem('auth_token');
  
  // Función para obtener imagen por defecto
  const getDefaultImage = (sheet: SheetMusic) => {
    if (sheet.image && sheet.image !== '/api/placeholder/200/250') {
      return sheet.image;
    }
    
    const difficultyGradients = {
      'Fácil': 'linear-gradient(135deg, #2ecc71, #1abc9c)',
      'Intermedio': 'linear-gradient(135deg, #3498db, #9b59b6)',
      'Avanzado': 'linear-gradient(135deg, #e74c3c, #d35400)'
    };
    
    const composerColors: {[key: string]: string} = {
      'Bach': '#8e44ad',
      'Mozart': '#3498db',
      'Beethoven': '#e67e22',
      'Chopin': '#c0392b',
      'Debussy': '#16a085',
      'default': '#7f8c8d'
    };
    
    const composer = sheet.composer?.split(' ')[0] || 'default';
    const color = composerColors[composer] || composerColors.default;
    
    return difficultyGradients[sheet.difficulty] || `linear-gradient(135deg, ${color}, #2c3e50)`;
  };
  
  // Cargar partituras del usuario
  useEffect(() => {
    fetchUserSheets();
  }, []);
  
  const fetchUserSheets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE}/sheets/my-sheets`, {
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const sheetsWithAccuracy = await Promise.all(
        data.sheets.map(async (sheet: any) => {
          try {
            const accuracyResponse = await fetch(
              `${API_BASE}/sheets/${sheet.sheet_id}/best-accuracy`,
              { headers }
            );
            
            const accuracyData = accuracyResponse.ok ? await accuracyResponse.json() : { bestAccuracy: 0 };
            
            return {
              id: sheet.sheet_id,
              title: sheet.title,
              composer: sheet.composer || 'Desconocido',
              image: sheet.file_url || '/api/placeholder/200/250',
              difficulty: 'Intermedio',
              bestAccuracy: Math.round(accuracyData.bestAccuracy) || 0,
              lastPractice: 'Nunca',
              tags: [],
              isFavorite: sheet.is_favorite || false
            };
          } catch (err) {
            return {
              id: sheet.sheet_id,
              title: sheet.title,
              composer: sheet.composer || 'Desconocido',
              image: sheet.file_url || '/api/placeholder/200/250',
              difficulty: 'Intermedio',
              bestAccuracy: 0,
              lastPractice: 'Nunca',
              tags: [],
              isFavorite: sheet.is_favorite || false
            };
          }
        })
      );
      
      setSheets(sheetsWithAccuracy);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error fetching sheets:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrar partituras
  const filteredSheets = sheets.filter(sheet => {
    const matchesSearch = sheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sheet.composer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'all' || sheet.difficulty === selectedDifficulty;
    const matchesTag = selectedTag === 'all' || sheet.tags.includes(selectedTag);
    
    return matchesSearch && matchesDifficulty && matchesTag;
  });
  
  // Obtener tags únicos
  const allTags = Array.from(new Set(sheets.flatMap(sheet => sheet.tags)));
  
  // Toggle favorito
  const toggleFavorite = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `${API_BASE}/sheets/${id}/toggle-favorite`,
        { 
          method: 'POST',
          headers: headers
        }
      );
      
      if (response.ok) {
        setSheets(sheets.map(sheet => 
          sheet.id === id ? { ...sheet, isFavorite: !sheet.isFavorite } : sheet
        ));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };
  
  // Manejar click en partitura
  const handleSheetClick = (sheetId: number) => {
    onSelectSheet(sheetId);
  };
  
  // ✅ MODIFICADO: Navegar a practice-setup en lugar de reconocimiento
  const handlePracticeClick = (sheetId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/app/practice-setup/${sheetId}`);
  };
  
  // Manejar subida de partitura
  const handleUploadClick = () => {
    onUploadSheet();
  };
  
  // Manejar eliminar partitura
  const handleDeleteSheet = async (sheetId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de que deseas eliminar esta partitura?')) {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE}/sheets/${sheetId}`, {
          method: 'DELETE',
          headers: headers
        });
        
        if (response.ok) {
          setSheets(sheets.filter(sheet => sheet.id !== sheetId));
        } else {
          alert('Error al eliminar la partitura');
        }
      } catch (err) {
        console.error('Error deleting sheet:', err);
        alert('Error al eliminar la partitura');
      }
    }
  };
  
  if (loading) {
    return (
      <div className="sheet-music-library">
        <header className="library-header">
          <h1>Biblioteca de Partituras</h1>
          <p>Cargando tus partituras...</p>
        </header>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="sheet-music-library">
        <header className="library-header">
          <h1>Biblioteca de Partituras</h1>
          <p>Error al cargar</p>
        </header>
        <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
          <p>Error: {error}</p>
          <button onClick={fetchUserSheets}>Reintentar</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="sheet-music-library">
      <header className="library-header">
        <h1>Biblioteca de Partituras</h1>
        <p>Gestiona y organiza todas tus partituras ({sheets.length} total)</p>
      </header>
      
      {/* Barra de Acciones Superior */}
      <div className="action-bar">
        <div className="left-actions">
          <button className="btn-primary" onClick={handleUploadClick}>
            <i className="fas fa-upload"></i>
            Subir Nueva Partitura
          </button>
        </div>
        <div className="right-actions">
          <button 
            className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <i className="fas fa-th"></i>
          </button>
          <button 
            className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <i className="fas fa-list"></i>
          </button>
        </div>
      </div>
      
      {/* Filtros y Búsqueda */}
      <div className="filters-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar por título o compositor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <select 
            value={selectedDifficulty} 
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="all">Todas las dificultades</option>
            <option value="Fácil">Fácil</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
        </div>
        <div className="filter-group">
          <select 
            value={selectedTag} 
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            <option value="all">Todas las etiquetas</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Vista de Partituras */}
      <div className="sheets-container">
        {filteredSheets.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-music"></i>
            <h3>No se encontraron partituras</h3>
            <p>{sheets.length === 0 ? 'Comienza subiendo tu primera partitura' : 'Intenta ajustar tus filtros de búsqueda'}</p>
            {sheets.length === 0 && (
              <button className="btn-primary" onClick={handleUploadClick} style={{ marginTop: '20px' }}>
                <i className="fas fa-upload"></i>
                Subir Partitura
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid-view">
            {filteredSheets.map(sheet => (
              <div 
                key={sheet.id} 
                className="sheet-card"
                onClick={() => handleSheetClick(sheet.id)}
              >
                <div className="sheet-image">
                  {sheet.image && sheet.image !== '/api/placeholder/200/250' ? (
                    <img src={sheet.image} alt={sheet.title} />
                  ) : (
                    <div 
                      className="sheet-image-default"
                      style={{ background: getDefaultImage(sheet) }}
                    >
                      <i className="fas fa-music"></i>
                      <span>{sheet.title}</span>
                    </div>
                  )}
                  <div className="sheet-overlay">
                    <button 
                      className="play-btn"
                      onClick={(e) => handlePracticeClick(sheet.id, e)}
                    >
                      <i className="fas fa-play"></i>
                    </button>
                  </div>
                </div>
                <div className="sheet-content">
                  <h3 className="sheet-title">{sheet.title}</h3>
                  <p className="sheet-composer">{sheet.composer}</p>
                  <div className="sheet-meta">
                    <span className={`difficulty-badge ${sheet.difficulty.toLowerCase()}`}>
                      {sheet.difficulty}
                    </span>
                    <span className="accuracy-badge">
                      <i className="fas fa-bullseye"></i>
                      {sheet.bestAccuracy}%
                    </span>
                  </div>
                  <div className="sheet-tags">
                    {sheet.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                    {sheet.tags.length > 2 && <span className="tag">+{sheet.tags.length - 2}</span>}
                  </div>
                  <div className="sheet-actions">
                    <button 
                      className={`fav-btn ${sheet.isFavorite ? 'favorited' : ''}`}
                      onClick={(e) => toggleFavorite(sheet.id, e)}
                      title={sheet.isFavorite ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                    >
                      <i className="fas fa-heart"></i>
                    </button>
                    <button 
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSheetClick(sheet.id);
                      }}
                      title="Ver detalles"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className="action-btn"
                      onClick={(e) => handleDeleteSheet(sheet.id, e)}
                      title="Eliminar"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                    <button 
                      className="practice-btn"
                      onClick={(e) => handlePracticeClick(sheet.id, e)}
                      title="Practicar"
                    >
                      <i className="fas fa-play-circle"></i>
                      Practicar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="list-view">
            <table className="sheets-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Compositor</th>
                  <th>Dificultad</th>
                  <th>Mejor Precisión</th>
                  <th>Última Práctica</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSheets.map(sheet => (
                  <tr 
                    key={sheet.id} 
                    className="sheet-row"
                    onClick={() => handleSheetClick(sheet.id)}
                  >
                    <td>
                      <div className="sheet-info">
                        {sheet.image && sheet.image !== '/api/placeholder/200/250' ? (
                          <img src={sheet.image} alt={sheet.title} />
                        ) : (
                          <div 
                            className="sheet-info-default"
                            style={{ background: getDefaultImage(sheet) }}
                          >
                            <i className="fas fa-music"></i>
                          </div>
                        )}
                        <span>{sheet.title}</span>
                      </div>
                    </td>
                    <td>{sheet.composer}</td>
                    <td>
                      <span className={`difficulty-badge ${sheet.difficulty.toLowerCase()}`}>
                        {sheet.difficulty}
                      </span>
                    </td>
                    <td>
                      <span className="accuracy-value">
                        {sheet.bestAccuracy}%
                      </span>
                    </td>
                    <td>{sheet.lastPractice}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className={`fav-btn ${sheet.isFavorite ? 'favorited' : ''}`}
                          onClick={(e) => toggleFavorite(sheet.id, e)}
                          title={sheet.isFavorite ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                        >
                          <i className="fas fa-heart"></i>
                        </button>
                        <button 
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSheetClick(sheet.id);
                          }}
                          title="Ver detalles"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button 
                          className="action-btn"
                          onClick={(e) => handleDeleteSheet(sheet.id, e)}
                          title="Eliminar"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                        <button 
                          className="practice-btn"
                          onClick={(e) => handlePracticeClick(sheet.id, e)}
                          title="Practicar"
                        >
                          <i className="fas fa-play-circle"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetMusicLibrary;