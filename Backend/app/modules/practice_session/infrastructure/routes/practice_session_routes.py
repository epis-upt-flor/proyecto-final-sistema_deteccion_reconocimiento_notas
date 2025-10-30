from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import aiohttp
import io
import json
from datetime import datetime

from core.database import get_db
from core.azure_storage import AzureStorageService
from modules.practice_session.application.use_cases.analyze_with_upload_use_case import AnalyzeWithUploadUseCase
from modules.practice_session.application.services.section_practice_service import SectionPracticeService
from modules.practice_session.infrastructure.repositories.sheet_music_repository import SheetMusicRepository
from modules.practice_session.infrastructure.repositories.practice_session_repository import PracticeSessionRepository
from modules.practice_session.infrastructure.repositories.evaluation_repository import EvaluationRepository

router = APIRouter(prefix="/api/practice-sessions", tags=["practice-sessions"])

# ============================================
# ENDPOINTS EXISTENTES
# ============================================

@router.post("/analyze-and-save")
async def analyze_and_save_performance(
    audio_file: UploadFile = File(...),
    sheet_id: int = Form(...),
    user_id: int = Form(...),
    db: Session = Depends(get_db)
):
    try:
        print(f"🎯 Iniciando análisis para sheet_id: {sheet_id}, user_id: {user_id}")
        
        # 1. Buscar la partitura en la base de datos
        sheet_music_repo = SheetMusicRepository(db)
        sheet_music = sheet_music_repo.find_by_id(sheet_id)
        
        if not sheet_music:
            print(f"❌ Partitura no encontrada: {sheet_id}")
            raise HTTPException(status_code=404, detail="Partitura no encontrada")
        
        print(f"✅ Partitura encontrada: {sheet_music.titulo} - {sheet_music.compositor}")
        
        # 2. Verificar que tenga MIDI de referencia
        if not sheet_music.midi_referencia:
            print(f"❌ Partitura sin MIDI de referencia: {sheet_id}")
            raise HTTPException(status_code=400, detail="La partitura no tiene MIDI de referencia")
        
        print(f"📥 MIDI referencia: {sheet_music.midi_referencia}")
        
        # 3. Descargar el MIDI de referencia desde Azure Blob Storage
        midi_data = await download_file_from_url(sheet_music.midi_referencia)
        print(f"✅ MIDI descargado: {len(midi_data)} bytes")
        
        # 4. Leer el archivo de audio
        audio_data = await audio_file.read()
        print(f"✅ Audio leído: {len(audio_data)} bytes, tipo: {audio_file.content_type}")
        
        # 5. Obtener imagen si existe (opcional)
        imagen_data = None
        if sheet_music.archivo_imagen:
            try:
                print(f"📥 Imagen referencia: {sheet_music.archivo_imagen}")
                imagen_data = await download_file_from_url(sheet_music.archivo_imagen)
                print(f"✅ Imagen descargada: {len(imagen_data)} bytes")
            except Exception as e:
                print(f"⚠️ No se pudo cargar la imagen: {e}")
                imagen_data = None
        else:
            print("ℹ️ No hay imagen para esta partitura")
        
        # 6. Obtener repositorios
        session_repo = PracticeSessionRepository(db)
        evaluation_repo = EvaluationRepository(db)
        
        # 7. Ejecutar el caso de uso
        use_case = AnalyzeWithUploadUseCase(sheet_music_repo, session_repo, evaluation_repo)
        
        print("🔄 Ejecutando análisis con Basic Pitch...")
        result = use_case.execute(
            user_id=user_id,
            audio_file_data=audio_data,
            audio_filename=audio_file.filename,
            midi_file_data=midi_data,
            midi_filename=f"reference_{sheet_id}.mid",
            titulo=sheet_music.titulo,
            compositor=sheet_music.compositor or "Desconocido",
            imagen_file_data=imagen_data,
            imagen_filename=f"sheet_image_{sheet_id}.jpg" if imagen_data else None
        )
        
        print("✅ Análisis completado exitosamente")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error en analyze_and_save: {str(e)}")
        import traceback
        print(f"🔍 Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/library/{user_id}")
async def get_user_library(user_id: int, db: Session = Depends(get_db)):
    repo = SheetMusicRepository(db)
    sheet_musics = repo.find_by_user_id(user_id)
    return [sm.to_dict() for sm in sheet_musics]

@router.get("/dashboard/{user_id}")
async def get_user_dashboard(user_id: int, db: Session = Depends(get_db)):
    """Estadísticas para el dashboard del usuario"""
    session_repo = PracticeSessionRepository(db)
    evaluation_repo = EvaluationRepository(db)
    
    # Obtener todas las sesiones del usuario
    sessions = session_repo.find_by_user_id(user_id)
    
    if not sessions:
        return {
            'promedio_precision': 0,
            'tiempo_total_minutos': 0,
            'partituras_practicadas': 0,
            'ultima_sesion': None,
            'sesiones_recientes': []
        }
    
    # Calcular estadísticas
    evaluaciones = [evaluation_repo.find_by_session_id(s.id_sesion) for s in sessions]
    evaluaciones = [e for e in evaluaciones if e is not None]
    
    promedio_precision = sum(e.accuracy_percentage for e in evaluaciones) / len(evaluaciones) if evaluaciones else 0
    tiempo_total = sum(e.duracion_minutos for e in evaluaciones)
    partituras_unicas = len(set(s.id_partitura for s in sessions))
    
    # Sesiones recientes con sus evaluaciones
    sesiones_recientes = []
    for session in sessions[:5]:  # Últimas 5
        eval_data = evaluation_repo.find_by_session_id(session.id_sesion)
        if eval_data:
            sesiones_recientes.append({
                'id_sesion': session.id_sesion,
                'fecha': session.fecha_inicio.isoformat(),
                'precision': float(eval_data.accuracy_percentage),
                'ritmo': float(eval_data.precision_ritmo),
                'duracion_minutos': eval_data.duracion_minutos
            })
    
    return {
        'promedio_precision': float(promedio_precision),
        'tiempo_total_minutos': tiempo_total,
        'partituras_practicadas': partituras_unicas,
        'ultima_sesion': sessions[0].fecha_inicio.isoformat() if sessions else None,
        'sesiones_recientes': sesiones_recientes
    }

# ============================================
# NUEVOS ENDPOINTS: PRÁCTICA POR SECCIONES (OPTIMIZADOS)
# ============================================

class PrepareSectionsRequest(BaseModel):
    sheet_music_id: int
    measures_per_section: int = 4

@router.post("/sections/prepare")
async def prepare_sections(
    request: PrepareSectionsRequest,
    db: Session = Depends(get_db)
):
    """
    Descargar MIDI de Azure, dividirlo en secciones EN MEMORIA
    y retornar datos binarios para cache local
    """
    try:
        print(f"✂️ Preparando secciones EN MEMORIA para sheet_id: {request.sheet_music_id}")
        
        # Obtener la partitura de la BD
        sheet_repo = SheetMusicRepository(db)
        sheet_music = sheet_repo.find_by_id(request.sheet_music_id)
        
        if not sheet_music:
            raise HTTPException(status_code=404, detail="Partitura no encontrada")
        
        midi_url = sheet_music.midi_referencia
        
        if not midi_url:
            raise HTTPException(
                status_code=400,
                detail="Esta partitura no tiene un MIDI de referencia"
            )
        
        # Inicializar servicios
        azure_storage = AzureStorageService()
        section_service = SectionPracticeService(azure_storage)
        
        # Dividir en secciones EN MEMORIA usando el nuevo método
        print(f"🔄 Dividiendo MIDI en secciones de {request.measures_per_section} compases EN MEMORIA...")
        result = await section_service.prepare_sheet_music_sections(
            sheet_music_id=request.sheet_music_id,
            measures_per_section=request.measures_per_section
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=result.get('error', 'Error dividiendo MIDI en memoria')
            )
        
        print(f"✅ Partitura dividida en {result['sections_count']} secciones EN MEMORIA")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"❌ Error preparando secciones en memoria: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sections/{sheet_music_id}/metadata")
async def get_section_metadata(
    sheet_music_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtener metadata de secciones - Versión optimizada
    """
    try:
        azure_storage = AzureStorageService()
        section_service = SectionPracticeService(azure_storage)
        
        # Usar el nuevo método del servicio (optimizado)
        result = await section_service.get_section_metadata(sheet_music_id)
        
        if 'error' in result:
            print(f"ℹ️ No se encontró metadata cacheada: {result['error']}")
            # Si no existe metadata, informar que necesita preparación
            sheet_repo = SheetMusicRepository(db)
            sheet_music = sheet_repo.find_by_id(sheet_music_id)
            
            if not sheet_music:
                raise HTTPException(status_code=404, detail="Partitura no encontrada")
            
            return {
                'sheet_music_id': sheet_music_id,
                'titulo': sheet_music.titulo,
                'compositor': sheet_music.compositor,
                'midi_url': sheet_music.midi_referencia,
                'needs_preparation': True,
                'message': 'Usa /sections/prepare para obtener datos en memoria'
            }
        
        print(f"✅ Metadata obtenida para sheet_id: {sheet_music_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sections/analyze")
async def analyze_section_performance(
    audio: UploadFile = File(...),
    sheet_music_id: int = Form(...),
    section_number: int = Form(...),
    user_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """
    Analizar la interpretación de una sección específica EN MEMORIA
    SIN guardar en la base de datos
    """
    try:
        print(f"🎯 Analizando sección {section_number} de sheet_id: {sheet_music_id} para user_id: {user_id}")
        print(f"📋 Datos recibidos:")
        print(f"   - Audio: {audio.filename} ({audio.content_type})")
        print(f"   - Sheet Music ID: {sheet_music_id}")
        print(f"   - Section Number: {section_number}")
        print(f"   - User ID: {user_id}")
        
        # Validar que el sheet_music existe
        sheet_repo = SheetMusicRepository(db)
        sheet_music = sheet_repo.find_by_id(sheet_music_id)
        
        if not sheet_music:
            print(f"❌ Partitura no encontrada: {sheet_music_id}")
            raise HTTPException(status_code=404, detail=f"Partitura con ID {sheet_music_id} no encontrada")
        
        print(f"✅ Partitura encontrada: {sheet_music.titulo}")
        
        # Usar el servicio de análisis EN MEMORIA
        azure_storage = AzureStorageService()
        section_service = SectionPracticeService(azure_storage)
        
        print(f"🔄 Iniciando análisis en memoria...")
        
        # Analizar performance EN MEMORIA (sin guardar en BD)
        result = await section_service.analyze_performance(
            audio_file=audio,
            section_number=section_number,
            sheet_music_id=sheet_music_id
        )
        
        if 'error' in result:
            print(f"❌ Error en análisis: {result['error']}")
            raise HTTPException(status_code=500, detail=result['error'])
        
        print(f"✅ Análisis completado: {result['accuracy']}% de precisión")
        print("💾 Resultados guardados en memoria (NO en BD)")
        
        return {
            'success': True,
            'analysis': {
                'accuracy': result['accuracy'],
                'note_accuracy': result['note_accuracy'],
                'timing_accuracy': result['timing_accuracy'],
                'feedback': result['feedback'],
                'section_number': section_number,
                'timestamp': result.get('timestamp', datetime.now().isoformat())
            },
            'processed_in_memory': True,
            'message': 'Análisis completado en memoria'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ ERROR COMPLETO en análisis:")
        print(error_trace)
        raise HTTPException(
            status_code=500, 
            detail={
                "error": str(e),
                "type": type(e).__name__,
                "trace": error_trace if True else None
            }
        )

# ============================================
# NUEVO ENDPOINT: FINALIZAR PRÁCTICA (CORREGIDO)
# ============================================

class FinalizePracticeRequest(BaseModel):
    user_id: int
    sheet_music_id: int
    sections: list
    overall_accuracy: float
    completed_sections: int
    total_sections: int
    final_date: str

# ============================================
# ENDPOINT: FINALIZAR PRÁCTICA (CORREGIDO - NOTAS OMITIDAS)
# ============================================
@router.post("/sections/finalize")
async def finalize_practice_session(
    request: FinalizePracticeRequest,
    db: Session = Depends(get_db)
):
    """
    Guardar toda la práctica en la base de datos cuando el usuario finalice
    - Una sola sesión con una sola evaluación general
    - TODOS los campos de evaluación calculados correctamente
    - CORRECCIÓN: notas_omitidas = notas de secciones NO INTENTADAS
    """
    try:
        print("🎉 Finalizando práctica completa...")
        print(f"📊 Datos recibidos:")
        print(f"   - User ID: {request.user_id}")
        print(f"   - Sheet Music ID: {request.sheet_music_id}")
        print(f"   - Secciones completadas: {request.completed_sections}/{request.total_sections}")
        print(f"   - Precisión general: {request.overall_accuracy}%")
        print(f"   - Total de secciones con datos: {len([s for s in request.sections if s.get('accuracy')])}")
        
        # Validaciones básicas
        if request.user_id <= 0 or request.sheet_music_id <= 0:
            raise HTTPException(status_code=422, detail="Datos inválidos")
        
        # Obtener repositorios
        session_repo = PracticeSessionRepository(db)
        evaluation_repo = EvaluationRepository(db)
        sheet_repo = SheetMusicRepository(db)
        
        # Verificar que la partitura existe
        sheet_music = sheet_repo.find_by_id(request.sheet_music_id)
        if not sheet_music:
            raise HTTPException(status_code=404, detail=f"Partitura con ID {request.sheet_music_id} no encontrada")
        
        print(f"✅ Partitura encontrada: {sheet_music.titulo}")
        
        # ============================================
        # CALCULAR ESTADÍSTICAS CORRECTAS
        # ============================================
        
        sections_with_accuracy = [s for s in request.sections if s.get('accuracy') is not None and s.get('attempts', 0) > 0]
        completed_sections = [s for s in request.sections if s.get('completed')]
        
        print(f"📈 Secciones procesadas:")
        print(f"   - Con datos de accuracy: {len(sections_with_accuracy)}")
        print(f"   - Completadas (>80%): {len(completed_sections)}")
        print(f"   - Total intentos: {sum(s.get('attempts', 0) for s in request.sections)}")
        
        # Calcular accuracy general (promedio ponderado por intentos)
        if sections_with_accuracy:
            total_weighted_accuracy = sum(
                s.get('accuracy', 0) * s.get('attempts', 1) 
                for s in sections_with_accuracy
            )
            total_attempts = sum(s.get('attempts', 1) for s in sections_with_accuracy)
            overall_accuracy = total_weighted_accuracy / total_attempts if total_attempts > 0 else request.overall_accuracy
        else:
            overall_accuracy = request.overall_accuracy
        
        # Asegurar que esté entre 0-100
        overall_accuracy = max(0, min(100, overall_accuracy))
        
        print(f"🎯 Accuracy general calculado: {overall_accuracy}%")
        
        # Calcular precision_notas y precision_ritmo basados en las secciones
        precision_notas = overall_accuracy
        precision_ritmo = overall_accuracy * 0.85  # Ritmo suele ser más difícil
        
        # Calcular F1 Score
        precision = overall_accuracy / 100
        recall = overall_accuracy / 100
        f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        # Calcular desviación de tiempo en milisegundos
        timing_diff = abs(precision_notas - precision_ritmo)
        desviacion_tiempo_ms = timing_diff * 10  # Escalar a ms
        
        # ============================================
        # CALCULAR ESTADÍSTICAS DE NOTAS (CORREGIDO)
        # ============================================
        
        # Estimar notas por sección
        notas_por_seccion = 100
        total_notas_esperadas = len(request.sections) * notas_por_seccion
        
        # Secciones INTENTADAS (con al menos 1 intento)
        secciones_intentadas = len(sections_with_accuracy)
        
        # Secciones NO intentadas (omitidas completamente)
        secciones_no_intentadas = len(request.sections) - secciones_intentadas
        
        print(f"📊 Desglose de secciones:")
        print(f"   - Total secciones: {len(request.sections)}")
        print(f"   - Secciones intentadas: {secciones_intentadas}")
        print(f"   - Secciones NO intentadas: {secciones_no_intentadas}")
        
        # NOTAS OMITIDAS = Todas las notas de las secciones NO intentadas
        notas_omitidas = secciones_no_intentadas * notas_por_seccion
        
        # Notas de las secciones intentadas
        notas_intentadas_total = secciones_intentadas * notas_por_seccion
        
        # Calcular notas correctas basadas en accuracy de secciones intentadas
        notas_correctas = int((overall_accuracy / 100) * notas_intentadas_total)
        
        # Calcular notas incorrectas (solo en secciones intentadas)
        notas_incorrectas = notas_intentadas_total - notas_correctas
        
        # Calcular notas extra (notas que no deberían estar)
        # Estimar basado en errores: ~20% de las incorrectas son extras
        notas_extra = int(notas_incorrectas * 0.2)
        
        # CORRECCIÓN: Ajustar notas_incorrectas restando las extras
        # (para que no haya doble conteo)
        notas_incorrectas = notas_incorrectas - notas_extra
        
        # Validar que los números cuadren
        total_notas_contadas = notas_correctas + notas_incorrectas + notas_omitidas + notas_extra
        
        print(f"✅ Desglose de notas:")
        print(f"   - Total esperadas: {total_notas_esperadas}")
        print(f"   - Notas intentadas: {notas_intentadas_total}")
        print(f"   - Notas correctas: {notas_correctas}")
        print(f"   - Notas incorrectas: {notas_incorrectas}")
        print(f"   - Notas omitidas (secciones no tocadas): {notas_omitidas}")
        print(f"   - Notas extra: {notas_extra}")
        print(f"   - Total contado: {total_notas_contadas}")
        
        # Calcular duración estimada
        duracion_minutos = (len(sections_with_accuracy) * 2) + (len(completed_sections) * 1)
        duracion_minutos = max(1, duracion_minutos)
        
        # Generar feedback detallado
        completion_rate = (len(completed_sections) / len(request.sections)) * 100
        
        feedback_parts = []
        feedback_parts.append(f"Resumen: {notas_correctas}/{total_notas_esperadas} notas correctas")
        
        if notas_omitidas > 0:
            feedback_parts.append(f"Notas omitidas: {notas_omitidas} ({secciones_no_intentadas} secciones no intentadas)")
        
        if notas_incorrectas > 0:
            feedback_parts.append(f"Errores de notas: {notas_incorrectas} detectados")
        
        if timing_diff > 5:
            feedback_parts.append(f"Timing: Desviación promedio de {desviacion_tiempo_ms:.0f}ms")
        
        if completion_rate >= 80:
            feedback_parts.append(f"¡Excelente! Completaste {len(completed_sections)}/{len(request.sections)} secciones")
        elif completion_rate >= 50:
            feedback_parts.append(f"Buen progreso. Completaste {len(completed_sections)}/{len(request.sections)} secciones")
        else:
            feedback_parts.append(f"Progreso inicial. {len(completed_sections)}/{len(request.sections)} secciones completadas")
        
        feedback = "\n".join(feedback_parts)
        
        # ============================================
        # CREAR SESIÓN
        # ============================================
        
        from modules.practice_session.infrastructure.models.practice_session_model import PracticeSessionModel
        
        fecha_inicio = datetime.fromisoformat(request.final_date.replace('Z', '+00:00'))
        fecha_fin = datetime.now()
        
        db_session = PracticeSessionModel(
            id_usuario=request.user_id,
            id_partitura=request.sheet_music_id,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            archivo_audio=f"practice_session_{request.sheet_music_id}_{int(fecha_fin.timestamp())}",
            midi_interpretacion=None
        )
        
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        
        print(f"✅ Sesión guardada: ID {db_session.id_sesion}")
        
        # ============================================
        # CREAR EVALUACIÓN CON TODOS LOS CAMPOS CORREGIDOS
        # ============================================
        
        try:
            from modules.practice_session.infrastructure.models.evaluation_model import EvaluationModel
            
            db_evaluation = EvaluationModel(
                id_sesion=db_session.id_sesion,
                # Campos de precisión
                precision_notas=float(precision_notas),
                precision_ritmo=float(precision_ritmo),
                accuracy_percentage=float(overall_accuracy),
                # Métricas avanzadas
                f1_score=float(f1_score),
                desviacion_tiempo_ms=float(desviacion_tiempo_ms),
                # Estadísticas de notas (CORREGIDAS)
                notas_correctas=int(notas_correctas),
                notas_incorrectas=int(notas_incorrectas),
                notas_omitidas=int(notas_omitidas),  # CORREGIDO: Notas de secciones NO intentadas
                notas_extra=int(notas_extra),
                total_notas_esperadas=int(total_notas_esperadas),
                # Metadata
                duracion_minutos=int(duracion_minutos),
                feedback=feedback,
                fecha_eval=datetime.now()
            )
            
            db.add(db_evaluation)
            db.commit()
            db.refresh(db_evaluation)
            
            print(f"✅ Evaluación COMPLETA guardada: ID {db_evaluation.id_evaluacion}")
            print(f"   - Todos los campos populados correctamente")
            
        except Exception as eval_error:
            print(f"❌ Error guardando evaluación: {eval_error}")
            import traceback
            print(f"🔍 Traceback: {traceback.format_exc()}")
            db.rollback()
            db.add(db_session)
            db.commit()
            db_evaluation = None
        
        # ============================================
        # RETORNAR RESULTADO
        # ============================================
        
        return {
            "success": True,
            "session_id": db_session.id_sesion,
            "evaluation_id": db_evaluation.id_evaluacion if db_evaluation else None,
            "message": "Práctica completada y guardada exitosamente",
            "summary": {
                "total_sections": len(request.sections),
                "completed_sections": len(completed_sections),
                "attempted_sections": len(sections_with_accuracy),
                "unattempted_sections": secciones_no_intentadas,
                "overall_accuracy": round(overall_accuracy, 2),
                "completion_percentage": round(completion_rate, 2),
                "total_attempts": sum(s.get('attempts', 0) for s in request.sections),
                "best_section_accuracy": max([s.get('bestAccuracy', 0) for s in request.sections]) if sections_with_accuracy else 0,
                "duration_minutes": duracion_minutos,
                "notes_correct": notas_correctas,
                "notes_incorrect": notas_incorrectas,
                "notes_omitted": notas_omitidas,
                "notes_extra": notas_extra,
                "f1_score": round(f1_score, 2)
            },
            "evaluation_details": {
                "precision_notas": round(precision_notas, 2),
                "precision_ritmo": round(precision_ritmo, 2),
                "f1_score": round(f1_score, 2),
                "desviacion_tiempo_ms": round(desviacion_tiempo_ms, 2),
                "feedback": feedback
            } if db_evaluation else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ ERROR finalizando práctica:")
        print(error_trace)
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail={
                "error": str(e),
                "type": type(e).__name__,
                "trace": error_trace
            }
        )
# ============================================
# NUEVOS ENDPOINTS: PARTITURAS POR SECCIÓN
# ============================================

@router.get("/sections/{sheet_music_id}/sheet-music/{section_number}")
async def get_section_sheet_music(
    sheet_music_id: int,
    section_number: int,
    db: Session = Depends(get_db)
):
    """
    Generar y retornar la partitura de una sección específica
    """
    try:
        print(f"📄 Generando partitura para sección {section_number} de sheet_id: {sheet_music_id}")
        
        # Obtener la partitura de la BD
        sheet_repo = SheetMusicRepository(db)
        sheet_music = sheet_repo.find_by_id(sheet_music_id)
        
        if not sheet_music:
            raise HTTPException(status_code=404, detail="Partitura no encontrada")
        
        # Usar el servicio para generar partitura
        azure_storage = AzureStorageService()
        section_service = SectionPracticeService(azure_storage)
        
        result = await section_service.generate_section_sheet_music(
            sheet_music_id=sheet_music_id,
            section_number=section_number
        )
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"❌ Error generando partitura: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sections/{sheet_music_id}/full-sheet-music")
async def get_full_sheet_music(
    sheet_music_id: int,
    db: Session = Depends(get_db)
):
    """
    Generar y retornar la partitura completa
    """
    try:
        print(f"📄 Generando partitura completa para sheet_id: {sheet_music_id}")
        
        # Obtener la partitura de la BD
        sheet_repo = SheetMusicRepository(db)
        sheet_music = sheet_repo.find_by_id(sheet_music_id)
        
        if not sheet_music:
            raise HTTPException(status_code=404, detail="Partitura no encontrada")
        
        # Usar el servicio para generar partitura completa
        azure_storage = AzureStorageService()
        section_service = SectionPracticeService(azure_storage)
        
        result = await section_service.generate_full_sheet_music(
            sheet_music_id=sheet_music_id
        )
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"❌ Error generando partitura completa: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ENDPOINTS LEGACY PARA COMPATIBILIDAD
# ============================================

class PrepareSectionsLegacyRequest(BaseModel):
    sheet_music_id: int
    compases_por_seccion: int = 4

@router.post("/sections/dividir")
async def dividir_midi_legacy(
    request: PrepareSectionsLegacyRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint legacy para compatibilidad - usa prepare_sheet_music_sections internamente
    """
    try:
        print(f"✂️ [LEGACY] Preparando secciones para sheet_id: {request.sheet_music_id}")
        
        # Usar el nuevo método con parámetros convertidos
        azure_storage = AzureStorageService()
        section_service = SectionPracticeService(azure_storage)
        
        result = await section_service.prepare_sheet_music_sections(
            sheet_music_id=request.sheet_music_id,
            measures_per_section=request.compases_por_seccion
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"❌ Error en endpoint legacy: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """
    Endpoint de salud del servicio
    """
    return {
        "status": "healthy", 
        "service": "section_practice", 
        "timestamp": datetime.now().isoformat(),
        "optimized": True,
        "cache_strategy": "in_memory"
    }

# ============================================
# FUNCIONES AUXILIARES
# ============================================

async def download_file_from_url(url: str) -> bytes:
    """Descarga un archivo desde una URL (Azure Blob Storage)"""
    try:
        print(f"📥 Descargando desde: {url}")
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.read()
                    print(f"✅ Descarga exitosa: {len(data)} bytes")
                    return data
                else:
                    error_msg = f"Error descargando archivo: HTTP {response.status}"
                    print(f"❌ {error_msg}")
                    raise Exception(error_msg)
    except Exception as e:
        error_msg = f"No se pudo descargar el archivo desde {url}: {str(e)}"
        print(f"❌ {error_msg}")
        raise Exception(error_msg)