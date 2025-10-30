"""
Rutas para obtener detalles completos de una sesión de práctica
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.modules.practice_session.infrastructure.models.practice_session_model import PracticeSessionModel
from app.modules.practice_session.infrastructure.models.evaluation_model import EvaluationModel
from app.modules.sheet_music.infrastructure.models import SheetMusicModel

router = APIRouter(prefix="/api/v1/history", tags=["Session Detail"])

@router.get("/session/{session_id}/detail")
async def get_session_detail(
    session_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene los detalles completos de una sesión de práctica específica
    incluyendo toda la información de evaluación y archivos
    """
    
    # Obtener la sesión de práctica
    session = db.query(PracticeSessionModel).filter(
        PracticeSessionModel.id_sesion == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    # Obtener la evaluación asociada
    evaluation = db.query(EvaluationModel).filter(
        EvaluationModel.id_sesion == session_id
    ).first()
    
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada para esta sesión")
    
    # Obtener la partitura
    sheet = db.query(SheetMusicModel).filter(
        SheetMusicModel.id_partitura == session.id_partitura
    ).first()
    
    if not sheet:
        raise HTTPException(status_code=404, detail="Partitura no encontrada")
    
    # Calcular duración
    duration_minutes = evaluation.duracion_minutos or 0
    hours = duration_minutes // 60
    minutes = duration_minutes % 60
    
    if hours > 0:
        duration_str = f"{hours}h {minutes}min"
    else:
        duration_str = f"{minutes}min"
    
    # Construir respuesta completa
    return {
        "sessionId": session.id_sesion,
        "evaluationId": evaluation.id_evaluacion,
        "sheetName": sheet.titulo,
        "composer": sheet.compositor or "Desconocido",
        "date": session.fecha_inicio.isoformat() if session.fecha_inicio else None,
        "duration": duration_str,
        "durationMinutes": duration_minutes,
        
        # Métricas principales
        "accuracy": float(evaluation.accuracy_percentage or 0),
        "rhythm": float(evaluation.precision_ritmo or 0),
        "f1Score": float(evaluation.f1_score) if evaluation.f1_score else None,
        "desviacionTiempoMs": float(evaluation.desviacion_tiempo_ms) if evaluation.desviacion_tiempo_ms else None,
        
        # Desglose de notas
        "notasCorrectas": evaluation.notas_correctas or 0,
        "notasIncorrectas": evaluation.notas_incorrectas or 0,
        "notasOmitidas": evaluation.notas_omitidas or 0,
        "notasExtra": evaluation.notas_extra or 0,
        "totalNotas": evaluation.total_notas_esperadas or 0,
        
        # Feedback
        "feedback": evaluation.feedback,
        
        # URLs de archivos (INCLUYE PDF)
        "audioUrl": session.archivo_audio,
        "midiReferenceUrl": sheet.midi_referencia,
        "midiInterpretationUrl": session.midi_interpretacion,
        "sheetImageUrl": sheet.archivo_imagen,
        "sheetPdfUrl": sheet.archivo_pdf  # ✅ AGREGADO: URL del PDF
    }

@router.get("/session/{session_id}/comparison")
async def get_session_comparison(
    session_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene datos de comparación entre la interpretación y la referencia
    para análisis detallado
    """
    
    session = db.query(PracticeSessionModel).filter(
        PracticeSessionModel.id_sesion == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    evaluation = db.query(EvaluationModel).filter(
        EvaluationModel.id_sesion == session_id
    ).first()
    
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")
    
    # Aquí podrías agregar lógica adicional para comparación de MIDI
    # Por ahora retornamos los datos básicos de comparación
    
    return {
        "sessionId": session.id_sesion,
        "evaluationId": evaluation.id_evaluacion,
        "midiReferenceUrl": session.midi_interpretacion,  # URL del MIDI de referencia
        "midiInterpretationUrl": session.midi_interpretacion,  # URL del MIDI interpretado
        "audioUrl": session.archivo_audio,
        
        # Métricas de comparación
        "notesMatch": {
            "correct": evaluation.notas_correctas or 0,
            "incorrect": evaluation.notas_incorrectas or 0,
            "omitted": evaluation.notas_omitidas or 0,
            "extra": evaluation.notas_extra or 0,
            "total": evaluation.total_notas_esperadas or 0
        },
        
        "timing": {
            "averageDeviation": float(evaluation.desviacion_tiempo_ms) if evaluation.desviacion_tiempo_ms else 0,
            "rhythmPrecision": float(evaluation.precision_ritmo or 0)
        },
        
        "overall": {
            "accuracy": float(evaluation.accuracy_percentage or 0),
            "f1Score": float(evaluation.f1_score) if evaluation.f1_score else None
        }
    }

@router.get("/user/{user_id}/sessions/{sheet_id}/history")
async def get_sheet_practice_history(
    user_id: int,
    sheet_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene el historial de todas las sesiones de práctica
    de un usuario para una partitura específica
    """
    
    sessions = db.query(
        PracticeSessionModel,
        EvaluationModel,
        SheetMusicModel
    ).join(
        EvaluationModel,
        PracticeSessionModel.id_sesion == EvaluationModel.id_sesion
    ).join(
        SheetMusicModel,
        PracticeSessionModel.id_partitura == SheetMusicModel.id_partitura
    ).filter(
        PracticeSessionModel.id_usuario == user_id,
        PracticeSessionModel.id_partitura == sheet_id
    ).order_by(
        PracticeSessionModel.fecha_inicio.desc()
    ).all()
    
    if not sessions:
        return {
            "sheetId": sheet_id,
            "sheetName": None,
            "totalSessions": 0,
            "sessions": []
        }
    
    sheet_name = sessions[0][2].titulo if sessions else "Desconocida"
    
    sessions_data = []
    for session, evaluation, sheet in sessions:
        duration_minutes = evaluation.duracion_minutos or 0
        hours = duration_minutes // 60
        minutes = duration_minutes % 60
        duration_str = f"{hours}h {minutes}min" if hours > 0 else f"{minutes}min"
        
        sessions_data.append({
            "sessionId": session.id_sesion,
            "evaluationId": evaluation.id_evaluacion,
            "date": session.fecha_inicio.isoformat() if session.fecha_inicio else None,
            "duration": duration_str,
            "accuracy": float(evaluation.accuracy_percentage or 0),
            "rhythm": float(evaluation.precision_ritmo or 0),
            "notasCorrectas": evaluation.notas_correctas or 0,
            "totalNotas": evaluation.total_notas_esperadas or 0
        })
    
    return {
        "sheetId": sheet_id,
        "sheetName": sheet_name,
        "totalSessions": len(sessions_data),
        "sessions": sessions_data
    }