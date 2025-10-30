// src/pages/SectionPractice/SectionPractice.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { indexedDBCache } from "../../utils/indexedDBCache";

const API_BASE = "http://localhost:8000";

interface Section {
  section_number: number;
  midi_data: string;
  audio_data: string;
  duration: number;
  note_count: number;
  measures: string;
  start_measure?: number;
  end_measure?: number;
}

interface SectionMetadata {
  section_number: number;
  completed: boolean;
  accuracy?: number;
  attempts: number;
  bestAccuracy: number;
}

export default function SectionPractice() {
  const { sheetMusicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSection, setCurrentSection] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetInfo, setSheetInfo] = useState<any>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [sectionProgress, setSectionProgress] = useState<SectionMetadata[]>([]);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  // ESTADOS PARA PARTITURAS (IMAGEN + PDF)
  const [sheetMusicImageData, setSheetMusicImageData] = useState<string | null>(null);
  const [sheetMusicPdfUrl, setSheetMusicPdfUrl] = useState<string | null>(null);
  const [isLoadingSheetMusic, setIsLoadingSheetMusic] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSections();
  }, [sheetMusicId, location.state]);

  useEffect(() => {
    if (sections.length > 0) {
      loadProgressFromLocalStorage();
    }
  }, [sections, sheetMusicId]);

  // Efecto para cargar partitura AUTOMÁTICAMENTE cuando cambia la sección
  useEffect(() => {
    if (sections.length > 0) {
      loadSectionSheetMusic(currentSection);
    }
  }, [currentSection]);

  const loadSections = async () => {
    try {
      if (location.state?.sections) {
        const metadata = location.state.sections;
        setSections(metadata.sections);
        setSheetInfo({
          title: metadata.title,
          composer: metadata.composer
        });
        setIsLoading(false);
        console.log(`✅ ${metadata.sections.length} secciones cargadas desde navigation state`);
        return;
      }

      if (!sheetMusicId) {
        setError("ID de partitura no válido");
        setIsLoading(false);
        return;
      }

      const cached = await indexedDBCache.getSections(parseInt(sheetMusicId));
      
      if (cached && cached.metadata) {
        setSections(cached.metadata.sections);
        setSheetInfo({
          title: cached.metadata.title,
          composer: cached.metadata.composer
        });
        setIsLoading(false);
        console.log(`✅ ${cached.metadata.sections.length} secciones cargadas desde IndexedDB`);
      } else {
        setError("No se encontraron secciones en cache. Por favor, configura la práctica primero.");
        setTimeout(() => {
          navigate(`/app/practice-setup/${sheetMusicId}`);
        }, 3000);
      }
    } catch (err) {
      console.error("Error loading sections:", err);
      setError("Error cargando secciones");
      setIsLoading(false);
    }
  };

  // FUNCIÓN PARA CARGAR PARTITURA DE SECCIÓN (IMAGEN + PDF)
  const loadSectionSheetMusic = async (sectionNumber: number) => {
    if (!sheetMusicId) return;
    
    setIsLoadingSheetMusic(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${API_BASE}/api/practice-sessions/sections/${sheetMusicId}/sheet-music/${sectionNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      
      if (response.data.success) {
        // Guardar imagen (se muestra directamente)
        if (response.data.image_data) {
          setSheetMusicImageData(response.data.image_data);
          console.log(`✅ Imagen de partitura cargada para sección ${sectionNumber}`);
        }
        
        // Limpiar URL de PDF anterior
        if (sheetMusicPdfUrl) {
          URL.revokeObjectURL(sheetMusicPdfUrl);
        }
        
        // Preparar PDF para descarga (solo si existe)
        if (response.data.pdf_data) {
          const pdfBlob = base64ToBlob(response.data.pdf_data, 'application/pdf');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          setSheetMusicPdfUrl(pdfUrl);
        }
        
        console.log(`✅ Partitura cargada para sección ${sectionNumber}`);
      } else {
        setError("No se pudo cargar la partitura para esta sección");
      }
    } catch (err: any) {
      console.error("Error cargando partitura:", err);
      setError("Error al cargar la partitura");
    } finally {
      setIsLoadingSheetMusic(false);
    }
  };

  const loadFullSheetMusic = async () => {
    if (!sheetMusicId) return;
    
    setIsLoadingSheetMusic(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${API_BASE}/api/practice-sessions/sections/${sheetMusicId}/full-sheet-music`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      
      if (response.data.success && response.data.pdf_data) {
        // Limpiar URL anterior del modal
        if (sheetMusicPdfUrl && showPdfModal) {
          URL.revokeObjectURL(sheetMusicPdfUrl);
        }
        
        const pdfBlob = base64ToBlob(response.data.pdf_data, 'application/pdf');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setSheetMusicPdfUrl(pdfUrl);
        setShowPdfModal(true);
        console.log("✅ Partitura completa cargada");
      } else {
        setError("No se pudo cargar la partitura completa");
      }
    } catch (err: any) {
      console.error("Error cargando partitura completa:", err);
      setError("Error al cargar la partitura completa");
    } finally {
      setIsLoadingSheetMusic(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: mimeType });
  };

  const downloadSectionPDF = () => {
    if (!sheetMusicPdfUrl) return;
    
    const link = document.createElement('a');
    link.href = sheetMusicPdfUrl;
    link.download = `seccion_${currentSection}.pdf`;
    link.click();
  };

  const loadProgressFromLocalStorage = () => {
    if (!sheetMusicId) return;
    
    try {
      const progressKey = `sheet_${sheetMusicId}_progress`;
      const progressData = localStorage.getItem(progressKey);
      
      if (progressData) {
        setSectionProgress(JSON.parse(progressData));
      } else {
        const initialProgress: SectionMetadata[] = sections.map(section => ({
          section_number: section.section_number,
          completed: false,
          attempts: 0,
          bestAccuracy: 0
        }));
        setSectionProgress(initialProgress);
      }
    } catch (err) {
      console.error("Error loading progress:", err);
    }
  };

  const saveProgressToLocalStorage = (progress: SectionMetadata[]) => {
    if (!sheetMusicId) return;
    
    try {
      const progressKey = `sheet_${sheetMusicId}_progress`;
      localStorage.setItem(progressKey, JSON.stringify(progress));
    } catch (err) {
      console.error("Error saving progress:", err);
    }
  };

  const getCurrentSectionData = (): Section | undefined => {
    return sections.find(s => s.section_number === currentSection);
  };

  const getCurrentSectionProgress = (): SectionMetadata | undefined => {
    return sectionProgress.find(p => p.section_number === currentSection);
  };

  const playReferenceAudio = async () => {
    const section = getCurrentSectionData();
    
    console.log("🔍 DEBUG playReferenceAudio - Sección actual:", currentSection);
    console.log("🔍 DEBUG playReferenceAudio - Datos de sección:", section);
    console.log("🔍 DEBUG playReferenceAudio - ¿Tiene audio_data?:", !!section?.audio_data);
    
    if (!section) {
      console.error("❌ No hay datos de sección");
      setError("No se encontró la sección actual");
      return;
    }
    
    if (!section.audio_data) {
      console.error("❌ No hay audio_data en la sección");
      console.log("🔍 Estructura de la sección:", Object.keys(section));
      setError("No hay audio de referencia disponible para esta sección. Por favor, regenera las secciones.");
      return;
    }

    try {
      console.log("🎵 Intentando reproducir audio...");
      console.log("🔍 Tamaño de audio_data:", section.audio_data.length, "caracteres");
      
      // Detener audio anterior si existe
      if (audioRef.current) {
        console.log("⏹️ Deteniendo audio anterior");
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audioBlob = base64ToBlob(section.audio_data, 'audio/wav');
      console.log("✅ Blob de audio creado:", audioBlob.size, "bytes");
      
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log("✅ URL de audio creada:", audioUrl);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => {
        console.log(`🎵 Audio cargado exitosamente: ${audio.duration} segundos`);
      });

      audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        setAudioProgress(isNaN(progress) ? 0 : progress);
      });

      audio.addEventListener('ended', () => {
        console.log("✅ Audio terminó de reproducirse");
        setIsPlaying(false);
        setAudioProgress(0);
        URL.revokeObjectURL(audioUrl);
      });

      audio.addEventListener('error', (e) => {
        console.error("❌ Error reproduciendo audio:", e);
        console.error("❌ Detalles del error:", audio.error);
        setError(`Error al reproducir el audio: ${audio.error?.message || 'Error desconocido'}`);
        setIsPlaying(false);
        setAudioProgress(0);
        URL.revokeObjectURL(audioUrl);
      });

      console.log("▶️ Iniciando reproducción...");
      await audio.play();
      setIsPlaying(true);
      console.log("✅ Audio reproduciéndose");
    } catch (err) {
      console.error("❌ Error reproduciendo audio:", err);
      setError(`Error reproduciendo audio de referencia: ${err}`);
      setIsPlaying(false);
      setAudioProgress(0);
    }
  };

  const pauseReferenceAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stopReferenceAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setAudioProgress(0);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      recordingChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log("🎤 Grabación iniciada");
    } catch (err) {
      console.error("Error accediendo al micrófono:", err);
      setError("No se pudo acceder al micrófono. Por favor, permite el acceso al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      console.log("⏹️ Grabación detenida");
    }
  };

  const playRecording = () => {
    if (recordedAudio) {
      const audioUrl = URL.createObjectURL(recordedAudio);
      const audio = new Audio(audioUrl);
      audio.play();
      console.log("▶️ Reproduciendo grabación");
    }
  };

  const analyzeRecording = async () => {
    if (!recordedAudio || !sheetMusicId) {
      setError("No hay grabación para analizar");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setError(null);

    try {
      const formData = new FormData();
      
      const audioBlob = new Blob([recordedAudio], { type: 'audio/webm' });
      formData.append('audio', audioBlob, `section_${currentSection}.webm`);
      formData.append('sheet_music_id', String(sheetMusicId));
      formData.append('section_number', String(currentSection));

      const token = localStorage.getItem('auth_token');
      let userId = 8;
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          if (payload.user_id) {
            const extractedId = parseInt(String(payload.user_id), 10);
            if (!isNaN(extractedId) && extractedId > 0) {
              userId = extractedId;
            }
          } else if (payload.sub) {
            const extractedId = parseInt(String(payload.sub), 10);
            if (!isNaN(extractedId) && extractedId > 0) {
              userId = extractedId;
            }
          }
          
          if (isNaN(userId) || userId <= 0) {
            userId = 8;
          }
        } catch (e) {
          console.warn("⚠️ Usando user_id por defecto: 8");
          userId = 8;
        }
      }

      formData.append('user_id', String(userId));

      const response = await axios.post(
        `${API_BASE}/api/practice-sessions/sections/analyze`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: 60000
        }
      );

      if (response.data.success) {
        setAnalysisResult(response.data.analysis);
        updateSectionProgress(response.data.analysis);
        console.log("🎉 Análisis completado exitosamente");
      } else {
        const errorMsg = typeof response.data.error === 'string' 
          ? response.data.error 
          : JSON.stringify(response.data.error);
        setError("Error en el análisis: " + errorMsg);
      }
    } catch (err: any) {
      console.error("❌ Error en análisis:", err);
      
      let errorMessage = "Error analizando la grabación";
      
      if (err.response?.status === 422) {
        const details = err.response?.data?.detail;
        
        if (Array.isArray(details)) {
          errorMessage = "Error de validación:\n" + details.map((d: any) => {
            const location = Array.isArray(d.loc) ? d.loc.join(' → ') : 'Campo desconocido';
            return `- ${location}: ${d.msg}`;
          }).join('\n');
        } else if (typeof details === 'string') {
          errorMessage = details;
        }
      } else if (err.response?.data?.detail) {
        errorMessage = String(err.response.data.detail);
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateSectionProgress = (analysis: any) => {
    const currentProgress = getCurrentSectionProgress();
    if (!currentProgress) return;

    const newProgress = [...sectionProgress];
    const sectionIndex = newProgress.findIndex(p => p.section_number === currentSection);
    
    if (sectionIndex !== -1) {
      newProgress[sectionIndex] = {
        ...newProgress[sectionIndex],
        attempts: newProgress[sectionIndex].attempts + 1,
        accuracy: analysis.accuracy,
        bestAccuracy: Math.max(newProgress[sectionIndex].bestAccuracy, analysis.accuracy),
        completed: analysis.accuracy >= 80
      };
      
      setSectionProgress(newProgress);
      saveProgressToLocalStorage(newProgress);
    }
  };

  const goToPreviousSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
      resetSectionState();
    }
  };

  const goToNextSection = () => {
    if (currentSection < sections.length) {
      setCurrentSection(currentSection + 1);
      resetSectionState();
    }
  };

  const resetSectionState = () => {
    stopReferenceAudio();
    setIsRecording(false);
    setRecordingTime(0);
    setRecordedAudio(null);
    setAnalysisResult(null);
    setIsLoadingSheetMusic(false);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {
        console.warn("Error stopping recorder:", e);
      }
      mediaRecorderRef.current = null;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateOverallProgress = (): number => {
    if (sectionProgress.length === 0) return 0;
    const completed = sectionProgress.filter(p => p.completed).length;
    return (completed / sectionProgress.length) * 100;
  };

  const calculateAverageAccuracy = (): number => {
    if (sectionProgress.length === 0) return 0;
    
    const sectionsWithAccuracy = sectionProgress.filter(p => 
      p.accuracy !== undefined && p.accuracy !== null && !isNaN(p.accuracy) && p.attempts > 0
    );
    
    if (sectionsWithAccuracy.length === 0) return 0;
    
    const totalAccuracy = sectionsWithAccuracy.reduce((sum, p) => sum + (p.accuracy || 0), 0);
    const average = totalAccuracy / sectionsWithAccuracy.length;
    
    return Math.max(0, Math.min(100, average));
  };

  const finalizePractice = async () => {
    setIsFinalizing(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      let userId = 8;
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          if (payload.user_id) {
            const extractedId = parseInt(String(payload.user_id), 10);
            if (!isNaN(extractedId) && extractedId > 0) {
              userId = extractedId;
            }
          }
          
          if (isNaN(userId) || userId <= 0) {
            userId = 8;
          }
        } catch (e) {
          userId = 8;
        }
      }

      const completedSections = sectionProgress.filter(p => p.completed).length;
      const averageAccuracy = calculateAverageAccuracy();
      
      const sheetId = parseInt(sheetMusicId || '0');
      if (isNaN(sheetId) || sheetId <= 0) {
        throw new Error("ID de partitura no válido");
      }

      const finalizeData = {
        user_id: userId,
        sheet_music_id: sheetId,
        sections: sectionProgress,
        overall_accuracy: Math.max(0, Math.min(100, averageAccuracy)),
        completed_sections: completedSections,
        total_sections: sections.length,
        final_date: new Date().toISOString()
      };

      const response = await axios.post(
        `${API_BASE}/api/practice-sessions/sections/finalize`,
        finalizeData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setShowFinalizeModal(false);
        localStorage.removeItem(`sheet_${sheetMusicId}_progress`);
        setError("🎉 ¡Práctica completada y guardada exitosamente! Redirigiendo...");
        
        setTimeout(() => {
          navigate('/app/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      console.error("❌ Error finalizando práctica:", err);
      
      let errorMessage = "Error al guardar la práctica";
      
      if (err.response?.status === 422) {
        const details = err.response?.data?.detail;
        if (Array.isArray(details)) {
          errorMessage = details.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join('\n');
        } else if (typeof details === 'string') {
          errorMessage = details;
        }
      } else if (err.response?.data?.detail) {
        errorMessage = String(err.response.data.detail);
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsFinalizing(false);
    }
  };

  const currentSectionData = getCurrentSectionData();
  const currentProgress = getCurrentSectionProgress();
  const overallProgress = calculateOverallProgress();
  const averageAccuracy = calculateAverageAccuracy();

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div className="section-practice" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Errores */}
        {error && (
          <div style={{
            background: error.includes('🎉') ? '#d4edda' : '#f8d7da',
            color: error.includes('🎉') ? '#155724' : '#721c24',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: `1px solid ${error.includes('🎉') ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            <strong>{error.includes('🎉') ? '🎉 Éxito:' : '❌ Error:'}</strong> {error}
            <button
              onClick={() => setError(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: error.includes('🎉') ? '#155724' : '#721c24',
                float: 'right',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Header */}
        <div className="section-practice-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#2c3e50', marginBottom: '10px', fontSize: '2.5rem' }}>
            🎹 Práctica por Secciones
          </h1>
          {sheetInfo && (
            <p style={{ color: '#7f8c8d', fontSize: '1.1em' }}>
              {sheetInfo.title} - {sheetInfo.composer}
            </p>
          )}
          <div style={{ 
            marginTop: '15px',
            background: '#f8f9fa',
            padding: '10px 20px',
            borderRadius: '20px',
            display: 'inline-block'
          }}>
            <span style={{ fontWeight: '600', color: '#2c3e50' }}>
              Progreso General: {Math.round(overallProgress)}%
            </span>
            <div style={{
              width: '200px',
              height: '8px',
              background: '#ecf0f1',
              borderRadius: '4px',
              marginTop: '5px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${overallProgress}%`,
                height: '100%',
                background: '#27ae60',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        </div>

        <div className="practice-content" style={{ 
          display: 'grid', 
          gridTemplateColumns: '300px 1fr', 
          gap: '30px',
          marginBottom: '30px'
        }}>
          {/* Panel de secciones */}
          <div className="sections-panel" style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            height: 'fit-content'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '1.3rem', textAlign: 'center' }}>
              Secciones ({sections.length})
            </h3>
            <div className="sections-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sections.map((section) => {
                const progress = sectionProgress.find(p => p.section_number === section.section_number);
                const isCurrent = section.section_number === currentSection;
                const isCompleted = progress?.completed;
                
                return (
                  <div
                    key={section.section_number}
                    onClick={() => {
                      setCurrentSection(section.section_number);
                      resetSectionState();
                    }}
                    style={{
                      background: isCurrent 
                        ? (isCompleted ? '#27ae60' : '#3498db')
                        : (isCompleted ? '#e8f6f3' : '#f8f9fa'),
                      border: `2px solid ${
                        isCurrent 
                          ? (isCompleted ? '#27ae60' : '#3498db')
                          : (isCompleted ? '#27ae60' : '#e9ecef')
                      }`,
                      borderRadius: '8px',
                      padding: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      color: isCurrent ? 'white' : '#2c3e50'
                    }}
                  >
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '1.1rem', 
                      marginBottom: '5px' 
                    }}>
                      Sección {section.section_number}
                      {isCompleted && <span style={{ marginLeft: '8px' }}>✅</span>}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: '0.8' }}>
                      <div>Compases: {section.measures}</div>
                      <div>Duración: {Math.round(section.duration)}s</div>
                      {progress && progress.attempts > 0 && (
                        <div>Mejor: {progress.bestAccuracy}%</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #ecf0f1' }}>
              <button
                onClick={() => setShowFinalizeModal(true)}
                style={{
                  background: '#9b59b6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  width: '100%'
                }}
              >
                🎉 Finalizar Práctica
              </button>
              <p style={{ 
                marginTop: '10px', 
                color: '#7f8c8d', 
                fontSize: '0.8rem',
                textAlign: 'center'
              }}>
                Se guardará en tu historial
              </p>
            </div>
          </div>

          {/* Área de práctica principal */}
          <div className="practice-main" style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div className="current-section-header" style={{
              textAlign: 'center',
              marginBottom: '30px',
              paddingBottom: '20px',
              borderBottom: '2px solid #ecf0f1'
            }}>
              <h2 style={{ color: '#2c3e50', marginBottom: '10px', fontSize: '1.8rem' }}>
                Sección {currentSection} - {currentSectionData?.measures}
              </h2>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '30px',
                marginTop: '15px'
              }}>
                <div>
                  <span style={{
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    display: 'block'
                  }}>
                    {Math.round(currentSectionData?.duration || 0)}s
                  </span>
                  <span style={{
                    fontSize: '0.9rem',
                    color: '#7f8c8d'
                  }}>
                    Duración
                  </span>
                </div>
                <div>
                  <span style={{
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    display: 'block'
                  }}>
                    {currentSectionData?.note_count || 0}
                  </span>
                  <span style={{
                    fontSize: '0.9rem',
                    color: '#7f8c8d'
                  }}>
                    Notas
                  </span>
                </div>
                {currentProgress && (
                  <div>
                    <span style={{
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      display: 'block'
                    }}>
                      {currentProgress.bestAccuracy}%
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      color: '#7f8c8d'
                    }}>
                      Mejor
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* PARTITURA AUTOMÁTICA */}
            {sheetMusicImageData && !isLoadingSheetMusic && (
              <div style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '30px',
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <h4 style={{ color: '#2c3e50', margin: 0 }}>
                    🎼 Partitura - Sección {currentSection}
                  </h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {sheetMusicPdfUrl && (
                      <button
                        onClick={downloadSectionPDF}
                        style={{
                          background: '#3498db',
                          color: 'white',
                          border: 'none',
                          padding: '8px 15px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        📄 Descargar PDF
                      </button>
                    )}
                    <button
                      onClick={loadFullSheetMusic}
                      disabled={isLoadingSheetMusic}
                      style={{
                        background: '#9b59b6',
                        color: 'white',
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '6px',
                        cursor: isLoadingSheetMusic ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        opacity: isLoadingSheetMusic ? 0.5 : 1
                      }}
                    >
                      📖 Ver Completa
                    </button>
                  </div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid #3498db',
                  display: 'inline-block',
                  maxWidth: '100%'
                }}>
                  <img 
                    src={`data:image/png;base64,${sheetMusicImageData}`}
                    alt={`Partitura sección ${currentSection}`}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                    onError={() => {
                      console.error("Error cargando imagen de partitura");
                      setError("No se pudo mostrar la imagen de la partitura");
                    }}
                  />
                </div>
                <p style={{ 
                  marginTop: '10px', 
                  color: '#7f8c8d', 
                  fontSize: '0.9em' 
                }}>
                  Compases: {currentSectionData?.measures || 'N/A'}
                </p>
              </div>
            )}

            {/* Indicador de carga */}
            {isLoadingSheetMusic && (
              <div style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '40px',
                marginBottom: '30px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #3498db',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 15px'
                }}></div>
                <p style={{ color: '#7f8c8d' }}>Cargando partitura...</p>
              </div>
            )}

            {/* Controles de audio */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '30px'
            }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '15px', textAlign: 'center' }}>
                🎵 Audio de Referencia
              </h4>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '15px',
                marginBottom: '15px'
              }}>
                <button
                  onClick={isPlaying ? pauseReferenceAudio : playReferenceAudio}
                  disabled={!currentSectionData?.audio_data}
                  style={{
                    background: isPlaying ? '#e67e22' : '#3498db',
                    color: 'white',
                    border: 'none',
                    padding: '12px 25px',
                    borderRadius: '6px',
                    cursor: currentSectionData?.audio_data ? 'pointer' : 'not-allowed',
                    fontSize: '1rem',
                    fontWeight: '600',
                    opacity: currentSectionData?.audio_data ? 1 : 0.5
                  }}
                >
                  {isPlaying ? '⏸️ Pausar' : '▶️ Reproducir'} Referencia
                </button>
                <button
                  onClick={stopReferenceAudio}
                  disabled={!isPlaying}
                  style={{
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    padding: '12px 25px',
                    borderRadius: '6px',
                    cursor: isPlaying ? 'pointer' : 'not-allowed',
                    fontSize: '1rem',
                    fontWeight: '600',
                    opacity: isPlaying ? 1 : 0.5
                  }}
                >
                  ⏹️ Detener
                </button>
              </div>
              {currentSectionData?.audio_data && (
                <div style={{
                  background: 'white',
                  borderRadius: '6px',
                  padding: '10px',
                  marginTop: '15px'
                }}>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#ecf0f1',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${audioProgress}%`,
                      height: '100%',
                      background: '#3498db',
                      transition: 'width 0.1s ease'
                    }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Grabación */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '30px'
            }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '15px', textAlign: 'center' }}>
                🎤 Tu Interpretación
              </h4>
              {!isRecording && !recordedAudio && (
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={startRecording}
                    style={{
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      padding: '15px 30px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      margin: '0 auto'
                    }}
                  >
                    🎤 Comenzar Grabación
                  </button>
                  <p style={{ marginTop: '10px', color: '#7f8c8d', fontSize: '0.9em' }}>
                    Presiona para grabar tu interpretación de esta sección
                  </p>
                </div>
              )}
              {isRecording && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#e74c3c',
                    marginBottom: '15px'
                  }}>
                    ⏺️ {formatTime(recordingTime)}
                  </div>
                  <button
                    onClick={stopRecording}
                    style={{
                      background: '#c0392b',
                      color: 'white',
                      border: 'none',
                      padding: '12px 25px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    ⏹️ Detener Grabación
                  </button>
                </div>
              )}
              {recordedAudio && !isAnalyzing && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '15px'
                }}>
                  <button
                    onClick={playRecording}
                    style={{
                      background: '#3498db',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    ▶️ Reproducir
                  </button>
                  <button
                    onClick={analyzeRecording}
                    style={{
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    📊 Analizar
                  </button>
                  <button
                    onClick={() => setRecordedAudio(null)}
                    style={{
                      background: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Regrabar
                  </button>
                </div>
              )}
              {isAnalyzing && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3498db',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 15px'
                  }}></div>
                  <p>Analizando tu interpretación...</p>
                </div>
              )}
            </div>

            {/* Resultados */}
            {analysisResult && (
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '30px'
              }}>
                <h4 style={{ color: '#856404', marginBottom: '15px', textAlign: 'center' }}>
                  📊 Resultados del Análisis
                </h4>
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: analysisResult.accuracy >= 80 ? '#27ae60' : 
                           analysisResult.accuracy >= 70 ? '#f39c12' : '#e74c3c',
                    marginBottom: '10px'
                  }}>
                    {analysisResult.accuracy}%
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    color: '#856404'
                  }}>
                    Precisión General
                  </div>
                </div>
                <div style={{
                  background: 'white',
                  borderRadius: '6px',
                  padding: '15px',
                  marginTop: '15px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #f1f1f1'
                  }}>
                    <span style={{ color: '#7f8c8d' }}>
                      Precisión de Notas:
                    </span>
                    <span style={{ fontWeight: '600', color: '#2c3e50' }}>
                      {analysisResult.note_accuracy}%
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #f1f1f1'
                  }}>
                    <span style={{ color: '#7f8c8d' }}>
                      Precisión de Ritmo:
                    </span>
                    <span style={{ fontWeight: '600', color: '#2c3e50' }}>
                      {analysisResult.timing_accuracy}%
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0'
                  }}>
                    <span style={{ color: '#7f8c8d' }}>
                      Feedback:
                    </span>
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#2c3e50',
                      textAlign: 'right',
                      maxWidth: '70%'
                    }}>
                      {analysisResult.feedback}
                    </span>
                  </div>
                </div>
                {analysisResult.accuracy >= 80 && (
                  <div style={{
                    textAlign: 'center',
                    marginTop: '15px',
                    padding: '10px',
                    background: '#d4edda',
                    color: '#155724',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}>
                    🎉 ¡Excelente! Puedes avanzar a la siguiente sección
                  </div>
                )}
              </div>
            )}

            {/* Navegación */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '20px',
              borderTop: '2px solid #ecf0f1'
            }}>
              <button
                onClick={goToPreviousSection}
                disabled={currentSection === 1}
                style={{
                  background: currentSection === 1 ? '#bdc3c7' : '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '12px 25px',
                  borderRadius: '6px',
                  cursor: currentSection === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  opacity: currentSection === 1 ? 0.5 : 1
                }}
              >
                ⬅️ Anterior
              </button>
              <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                Sección {currentSection} de {sections.length}
              </div>
              <button
                onClick={goToNextSection}
                disabled={currentSection === sections.length}
                style={{
                  background: currentSection === sections.length ? '#bdc3c7' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '12px 25px',
                  borderRadius: '6px',
                  cursor: currentSection === sections.length ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  opacity: currentSection === sections.length ? 0.5 : 1
                }}
              >
                Siguiente ➡️
              </button>
            </div>
          </div>
        </div>

        {/* Modal para finalizar práctica */}
        {showFinalizeModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>
                🎉 Finalizar Práctica
              </h3>
              <div style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <h4 style={{ color: '#2c3e50', marginBottom: '10px' }}>Resumen:</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Secciones completadas:</span>
                  <span style={{ fontWeight: '600' }}>
                    {sectionProgress.filter(p => p.completed).length} / {sections.length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Progreso general:</span>
                  <span style={{ fontWeight: '600' }}>{Math.round(overallProgress)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Precisión promedio:</span>
                  <span style={{ fontWeight: '600' }}>{Math.round(averageAccuracy)}%</span>
                </div>
              </div>
              <p style={{ marginBottom: '20px', color: '#7f8c8d' }}>
                ¿Estás seguro de que quieres finalizar la práctica?<br />
                Se guardará tu progreso en el historial.
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '15px',
                marginTop: '25px'
              }}>
                <button
                  onClick={() => setShowFinalizeModal(false)}
                  disabled={isFinalizing}
                  style={{
                    background: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: isFinalizing ? 'not-allowed' : 'pointer',
                    opacity: isFinalizing ? 0.5 : 1
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={finalizePractice}
                  disabled={isFinalizing}
                  style={{
                    background: '#9b59b6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: isFinalizing ? 'not-allowed' : 'pointer',
                    opacity: isFinalizing ? 0.5 : 1
                  }}
                >
                  {isFinalizing ? 'Guardando...' : 'Finalizar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para partitura completa */}
        {showPdfModal && sheetMusicPdfUrl && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '90%',
              maxHeight: '90%',
              width: '800px',
              height: '600px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '2px solid #ecf0f1'
              }}>
                <h3 style={{ color: '#2c3e50', margin: 0 }}>
                  📄 Partitura Completa
                </h3>
                <button
                  onClick={() => {
                    if (sheetMusicPdfUrl) {
                      URL.revokeObjectURL(sheetMusicPdfUrl);
                    }
                    setShowPdfModal(false);
                  }}
                  style={{
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    padding: '8px 15px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cerrar
                </button>
              </div>
              <div style={{
                flex: 1,
                border: '1px solid #bdc3c7',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <iframe
                  src={sheetMusicPdfUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  title="Partitura Completa"
                />
              </div>
            </div>
          </div>
        )}

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #2196f3',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0', color: '#1976d2', fontSize: '0.9em' }}>
            <strong>🚀 Datos almacenados en IndexedDB:</strong> Capacidad de hasta 50MB+ para todas tus secciones
          </p>
        </div>
      </div>
    </>
  );
}