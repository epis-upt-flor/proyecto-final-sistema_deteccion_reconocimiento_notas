from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, desc
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from core.database import get_db

router = APIRouter(prefix="/api/v1/history")

@router.get("/sessions/{user_id}")
async def get_user_sessions(
    user_id: int,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    sheet_name: Optional[str] = Query(None),
    min_accuracy: Optional[float] = Query(None),
    max_accuracy: Optional[float] = Query(None),
    limit: Optional[int] = Query(100),
    offset: Optional[int] = Query(0),
    db: Session = Depends(get_db)
):
    """
    Obtiene el historial completo de sesiones del usuario con filtros opcionales
    """
    try:
        # Construir query base
        base_query = """
            SELECT 
                sp.id_sesion,
                sp.fecha_inicio,
                sp.fecha_fin,
                p.id_partitura,
                p.titulo as sheet_name,
                p.compositor,
                e.id_evaluacion,
                e.accuracy_percentage,
                e.precision_ritmo,
                e.duracion_minutos,
                e.notas_correctas,
                e.notas_incorrectas,
                e.notas_omitidas,
                e.notas_extra,
                e.total_notas_esperadas,
                e.feedback,
                e.f1_score,
                e.desviacion_tiempo_ms
            FROM sesion_practica sp
            LEFT JOIN partitura p ON sp.id_partitura = p.id_partitura
            LEFT JOIN evaluacion e ON sp.id_sesion = e.id_sesion
            WHERE sp.id_usuario = :user_id
        """
        
        params = {"user_id": user_id}
        
        # Aplicar filtros
        if start_date:
            base_query += " AND sp.fecha_inicio >= :start_date"
            params["start_date"] = start_date
            
        if end_date:
            base_query += " AND sp.fecha_inicio <= :end_date"
            params["end_date"] = end_date
            
        if sheet_name:
            base_query += " AND LOWER(p.titulo) LIKE LOWER(:sheet_name)"
            params["sheet_name"] = f"%{sheet_name}%"
            
        if min_accuracy is not None:
            base_query += " AND e.accuracy_percentage >= :min_accuracy"
            params["min_accuracy"] = min_accuracy
            
        if max_accuracy is not None:
            base_query += " AND e.accuracy_percentage <= :max_accuracy"
            params["max_accuracy"] = max_accuracy
        
        # Ordenar y limitar
        base_query += " ORDER BY sp.fecha_inicio DESC LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset
        
        results = db.execute(text(base_query), params).fetchall()
        
        sessions = []
        for row in results:
            # Calcular duración
            duration_minutes = row.duracion_minutos
            if not duration_minutes and row.fecha_fin and row.fecha_inicio:
                duration_minutes = int((row.fecha_fin - row.fecha_inicio).total_seconds() / 60)
            
            sessions.append({
                "id": row.id_sesion,
                "evaluationId": row.id_evaluacion,  # ✅ AGREGADO
                "date": row.fecha_inicio.strftime("%Y-%m-%d %H:%M:%S"),
                "sheetId": row.id_partitura,
                "sheetName": row.sheet_name or "Partitura desconocida",
                "composer": row.compositor or "Desconocido",
                "duration": f"{duration_minutes or 0} min",
                "durationMinutes": duration_minutes or 0,
                "accuracy": round(float(row.accuracy_percentage or 0), 1),
                "rhythm": round(float(row.precision_ritmo or 0), 1),
                "notasCorrectas": row.notas_correctas or 0,
                "notasIncorrectas": row.notas_incorrectas or 0,
                "notasOmitidas": row.notas_omitidas or 0,
                "notasExtra": row.notas_extra or 0,
                "totalNotas": row.total_notas_esperadas or 0,
                "f1Score": float(row.f1_score or 0),
                "desviacionTiempoMs": float(row.desviacion_tiempo_ms or 0),
                "feedback": row.feedback,
                "hasEvaluation": row.id_evaluacion is not None
            })
        
        return sessions
        
    except Exception as e:
        print(f"Error en get_user_sessions: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener sesiones: {str(e)}")


@router.get("/sessions/{user_id}/count")
async def get_sessions_count(
    user_id: int,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    sheet_name: Optional[str] = Query(None),
    min_accuracy: Optional[float] = Query(None),
    max_accuracy: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Obtiene el conteo total de sesiones con los filtros aplicados
    """
    try:
        base_query = """
            SELECT COUNT(DISTINCT sp.id_sesion) as total
            FROM sesion_practica sp
            LEFT JOIN partitura p ON sp.id_partitura = p.id_partitura
            LEFT JOIN evaluacion e ON sp.id_sesion = e.id_sesion
            WHERE sp.id_usuario = :user_id
        """
        
        params = {"user_id": user_id}
        
        if start_date:
            base_query += " AND sp.fecha_inicio >= :start_date"
            params["start_date"] = start_date
            
        if end_date:
            base_query += " AND sp.fecha_inicio <= :end_date"
            params["end_date"] = end_date
            
        if sheet_name:
            base_query += " AND LOWER(p.titulo) LIKE LOWER(:sheet_name)"
            params["sheet_name"] = f"%{sheet_name}%"
            
        if min_accuracy is not None:
            base_query += " AND e.accuracy_percentage >= :min_accuracy"
            params["min_accuracy"] = min_accuracy
            
        if max_accuracy is not None:
            base_query += " AND e.accuracy_percentage <= :max_accuracy"
            params["max_accuracy"] = max_accuracy
        
        result = db.execute(text(base_query), params).fetchone()
        
        return {"total": result.total}
        
    except Exception as e:
        print(f"Error en get_sessions_count: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al contar sesiones: {str(e)}")


@router.get("/sessions/{user_id}/summary")
async def get_sessions_summary(
    user_id: int,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Obtiene un resumen estadístico de las sesiones del usuario
    """
    try:
        summary_query = text("""
            SELECT 
                COUNT(DISTINCT sp.id_sesion) as total_sessions,
                COALESCE(SUM(e.duracion_minutos), 0) as total_minutes,
                COALESCE(AVG(e.accuracy_percentage), 0) as avg_accuracy,
                COALESCE(MAX(e.accuracy_percentage), 0) as max_accuracy,
                COALESCE(MIN(e.accuracy_percentage), 0) as min_accuracy,
                COALESCE(AVG(e.precision_ritmo), 0) as avg_rhythm,
                COALESCE(SUM(e.notas_correctas), 0) as total_correct_notes,
                COALESCE(SUM(e.notas_incorrectas + e.notas_omitidas + e.notas_extra), 0) as total_errors,
                COUNT(DISTINCT sp.id_partitura) as unique_sheets
            FROM sesion_practica sp
            LEFT JOIN evaluacion e ON sp.id_sesion = e.id_sesion
            WHERE sp.id_usuario = :user_id
            AND (:start_date IS NULL OR sp.fecha_inicio >= :start_date)
            AND (:end_date IS NULL OR sp.fecha_inicio <= :end_date)
        """)
        
        result = db.execute(summary_query, {
            "user_id": user_id,
            "start_date": start_date,
            "end_date": end_date
        }).fetchone()
        
        total_minutes = int(result.total_minutes or 0)
        hours = total_minutes // 60
        minutes = total_minutes % 60
        
        return {
            "totalSessions": result.total_sessions,
            "totalPracticeTime": f"{hours}h {minutes}m",
            "totalMinutes": total_minutes,
            "averageAccuracy": round(float(result.avg_accuracy), 1),
            "maxAccuracy": round(float(result.max_accuracy), 1),
            "minAccuracy": round(float(result.min_accuracy), 1),
            "averageRhythm": round(float(result.avg_rhythm), 1),
            "totalCorrectNotes": result.total_correct_notes,
            "totalErrors": result.total_errors,
            "uniqueSheets": result.unique_sheets
        }
        
    except Exception as e:
        print(f"Error en get_sessions_summary: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener resumen: {str(e)}")


@router.get("/sessions/detail/{session_id}")
async def get_session_detail(session_id: int, db: Session = Depends(get_db)):
    """
    Obtiene los detalles completos de una sesión específica
    """
    try:
        detail_query = text("""
            SELECT 
                sp.id_sesion,
                sp.fecha_inicio,
                sp.fecha_fin,
                sp.archivo_audio,
                sp.midi_interpretacion,
                p.id_partitura,
                p.titulo as sheet_name,
                p.compositor,
                p.archivo_imagen,
                p.midi_referencia,
                e.id_evaluacion,
                e.accuracy_percentage,
                e.precision_notas,
                e.precision_ritmo,
                e.f1_score,
                e.desviacion_tiempo_ms,
                e.duracion_minutos,
                e.notas_correctas,
                e.notas_incorrectas,
                e.notas_omitidas,
                e.notas_extra,
                e.total_notas_esperadas,
                e.feedback,
                e.fecha_eval
            FROM sesion_practica sp
            LEFT JOIN partitura p ON sp.id_partitura = p.id_partitura
            LEFT JOIN evaluacion e ON sp.id_sesion = e.id_sesion
            WHERE sp.id_sesion = :session_id
        """)
        
        result = db.execute(detail_query, {"session_id": session_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")
        
        # Calcular duración
        duration_minutes = result.duracion_minutos
        if not duration_minutes and result.fecha_fin and result.fecha_inicio:
            duration_minutes = int((result.fecha_fin - result.fecha_inicio).total_seconds() / 60)
        
        return {
            "session": {
                "id": result.id_sesion,
                "dateStart": result.fecha_inicio.strftime("%Y-%m-%d %H:%M:%S"),
                "dateEnd": result.fecha_fin.strftime("%Y-%m-%d %H:%M:%S") if result.fecha_fin else None,
                "audioUrl": result.archivo_audio,
                "midiUrl": result.midi_interpretacion,
                "durationMinutes": duration_minutes or 0
            },
            "sheet": {
                "id": result.id_partitura,
                "name": result.sheet_name or "Partitura desconocida",
                "composer": result.compositor or "Desconocido",
                "imageUrl": result.archivo_imagen,
                "midiReference": result.midi_referencia
            },
            "evaluation": {
                "id": result.id_evaluacion,
                "accuracyPercentage": round(float(result.accuracy_percentage or 0), 2),
                "precisionNotas": round(float(result.precision_notas or 0), 2),
                "precisionRitmo": round(float(result.precision_ritmo or 0), 2),
                "f1Score": round(float(result.f1_score or 0), 2),
                "desviacionTiempoMs": round(float(result.desviacion_tiempo_ms or 0), 2),
                "notasCorrectas": result.notas_correctas or 0,
                "notasIncorrectas": result.notas_incorrectas or 0,
                "notasOmitidas": result.notas_omitidas or 0,
                "notasExtra": result.notas_extra or 0,
                "totalNotasEsperadas": result.total_notas_esperadas or 0,
                "feedback": result.feedback,
                "fechaEval": result.fecha_eval.strftime("%Y-%m-%d %H:%M:%S") if result.fecha_eval else None
            } if result.id_evaluacion else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en get_session_detail: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener detalle de sesión: {str(e)}")


@router.get("/sheets/{user_id}")
async def get_user_practiced_sheets(user_id: int, db: Session = Depends(get_db)):
    """
    Obtiene la lista de partituras que el usuario ha practicado
    """
    try:
        sheets_query = text("""
            SELECT DISTINCT
                p.id_partitura,
                p.titulo,
                p.compositor,
                COUNT(sp.id_sesion) as practice_count,
                AVG(e.accuracy_percentage) as avg_accuracy,
                MAX(sp.fecha_inicio) as last_practice
            FROM sesion_practica sp
            JOIN partitura p ON sp.id_partitura = p.id_partitura
            LEFT JOIN evaluacion e ON sp.id_sesion = e.id_sesion
            WHERE sp.id_usuario = :user_id
            GROUP BY p.id_partitura, p.titulo, p.compositor
            ORDER BY last_practice DESC
        """)
        
        results = db.execute(sheets_query, {"user_id": user_id}).fetchall()
        
        sheets = []
        for row in results:
            sheets.append({
                "id": row.id_partitura,
                "titulo": row.titulo,
                "compositor": row.compositor,
                "practiceCount": row.practice_count,
                "avgAccuracy": round(float(row.avg_accuracy or 0), 1),
                "lastPractice": row.last_practice.strftime("%Y-%m-%d %H:%M:%S")
            })
        
        return sheets
        
    except Exception as e:
        print(f"Error en get_user_practiced_sheets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener partituras: {str(e)}")


# ✅ NUEVAS RUTAS AGREGADAS PARA SESSION DETAIL

@router.get("/session/{session_id}/detail")
async def get_session_detail_new(
    session_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene los detalles completos de una sesión de práctica específica
    incluyendo toda la información de evaluación y archivos
    """
    try:
        detail_query = text("""
            SELECT 
                sp.id_sesion,
                sp.fecha_inicio,
                sp.fecha_fin,
                sp.archivo_audio,
                sp.midi_interpretacion,
                p.id_partitura,
                p.titulo as sheet_name,
                p.compositor,
                p.archivo_imagen,
                p.midi_referencia,
                e.id_evaluacion,
                e.accuracy_percentage,
                e.precision_notas,
                e.precision_ritmo,
                e.f1_score,
                e.desviacion_tiempo_ms,
                e.duracion_minutos,
                e.notas_correctas,
                e.notas_incorrectas,
                e.notas_omitidas,
                e.notas_extra,
                e.total_notas_esperadas,
                e.feedback
            FROM sesion_practica sp
            LEFT JOIN partitura p ON sp.id_partitura = p.id_partitura
            LEFT JOIN evaluacion e ON sp.id_sesion = e.id_sesion
            WHERE sp.id_sesion = :session_id
        """)
        
        result = db.execute(detail_query, {"session_id": session_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")
        
        if not result.id_evaluacion:
            raise HTTPException(status_code=404, detail="Evaluación no encontrada para esta sesión")
        
        # Calcular duración
        duration_minutes = result.duracion_minutos or 0
        hours = duration_minutes // 60
        minutes = duration_minutes % 60
        
        if hours > 0:
            duration_str = f"{hours}h {minutes}min"
        else:
            duration_str = f"{minutes}min"
        
        # Construir respuesta completa
        return {
            "sessionId": result.id_sesion,
            "evaluationId": result.id_evaluacion,
            "sheetName": result.sheet_name or "Partitura desconocida",
            "composer": result.compositor or "Desconocido",
            "date": result.fecha_inicio.isoformat() if result.fecha_inicio else None,
            "duration": duration_str,
            "durationMinutes": duration_minutes,
            
            # Métricas principales
            "accuracy": float(result.accuracy_percentage or 0),
            "rhythm": float(result.precision_ritmo or 0),
            "f1Score": float(result.f1_score) if result.f1_score else None,
            "desviacionTiempoMs": float(result.desviacion_tiempo_ms) if result.desviacion_tiempo_ms else None,
            
            # Desglose de notas
            "notasCorrectas": result.notas_correctas or 0,
            "notasIncorrectas": result.notas_incorrectas or 0,
            "notasOmitidas": result.notas_omitidas or 0,
            "notasExtra": result.notas_extra or 0,
            "totalNotas": result.total_notas_esperadas or 0,
            
            # Feedback
            "feedback": result.feedback,
            
            # URLs de archivos
            "audioUrl": result.archivo_audio,
            "midiReferenceUrl": result.midi_referencia,
            "midiInterpretationUrl": result.midi_interpretacion,
            "sheetImageUrl": result.archivo_imagen
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en get_session_detail_new: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener detalle de sesión: {str(e)}")


@router.get("/session/{session_id}/comparison")
async def get_session_comparison(
    session_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene datos de comparación entre la interpretación y la referencia
    para análisis detallado
    """
    try:
        comparison_query = text("""
            SELECT 
                sp.id_sesion,
                sp.archivo_audio,
                sp.midi_interpretacion,
                p.midi_referencia,
                e.id_evaluacion,
                e.notas_correctas,
                e.notas_incorrectas,
                e.notas_omitidas,
                e.notas_extra,
                e.total_notas_esperadas,
                e.desviacion_tiempo_ms,
                e.precision_ritmo,
                e.accuracy_percentage,
                e.f1_score
            FROM sesion_practica sp
            LEFT JOIN partitura p ON sp.id_partitura = p.id_partitura
            LEFT JOIN evaluacion e ON sp.id_sesion = e.id_sesion
            WHERE sp.id_sesion = :session_id
        """)
        
        result = db.execute(comparison_query, {"session_id": session_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")
        
        if not result.id_evaluacion:
            raise HTTPException(status_code=404, detail="Evaluación no encontrada")
        
        return {
            "sessionId": result.id_sesion,
            "evaluationId": result.id_evaluacion,
            "midiReferenceUrl": result.midi_referencia,
            "midiInterpretationUrl": result.midi_interpretacion,
            "audioUrl": result.archivo_audio,
            
            # Métricas de comparación
            "notesMatch": {
                "correct": result.notas_correctas or 0,
                "incorrect": result.notas_incorrectas or 0,
                "omitted": result.notas_omitidas or 0,
                "extra": result.notas_extra or 0,
                "total": result.total_notas_esperadas or 0
            },
            
            "timing": {
                "averageDeviation": float(result.desviacion_tiempo_ms) if result.desviacion_tiempo_ms else 0,
                "rhythmPrecision": float(result.precision_ritmo or 0)
            },
            
            "overall": {
                "accuracy": float(result.accuracy_percentage or 0),
                "f1Score": float(result.f1_score) if result.f1_score else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en get_session_comparison: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener comparación: {str(e)}")


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
    try:
        history_query = text("""
            SELECT 
                sp.id_sesion,
                sp.fecha_inicio,
                p.titulo as sheet_name,
                e.id_evaluacion,
                e.accuracy_percentage,
                e.precision_ritmo,
                e.duracion_minutos,
                e.notas_correctas,
                e.total_notas_esperadas
            FROM sesion_practica sp
            LEFT JOIN partitura p ON sp.id_partitura = p.id_partitura
            LEFT JOIN evaluacion e ON sp.id_sesion = e.id_sesion
            WHERE sp.id_usuario = :user_id
            AND sp.id_partitura = :sheet_id
            ORDER BY sp.fecha_inicio DESC
        """)
        
        results = db.execute(history_query, {
            "user_id": user_id,
            "sheet_id": sheet_id
        }).fetchall()
        
        if not results:
            return {
                "sheetId": sheet_id,
                "sheetName": None,
                "totalSessions": 0,
                "sessions": []
            }
        
        sheet_name = results[0].sheet_name if results else "Desconocida"
        
        sessions_data = []
        for row in results:
            duration_minutes = row.duracion_minutos or 0
            hours = duration_minutes // 60
            minutes = duration_minutes % 60
            duration_str = f"{hours}h {minutes}min" if hours > 0 else f"{minutes}min"
            
            sessions_data.append({
                "sessionId": row.id_sesion,
                "evaluationId": row.id_evaluacion,
                "date": row.fecha_inicio.isoformat() if row.fecha_inicio else None,
                "duration": duration_str,
                "accuracy": float(row.accuracy_percentage or 0),
                "rhythm": float(row.precision_ritmo or 0),
                "notasCorrectas": row.notas_correctas or 0,
                "totalNotas": row.total_notas_esperadas or 0
            })
        
        return {
            "sheetId": sheet_id,
            "sheetName": sheet_name,
            "totalSessions": len(sessions_data),
            "sessions": sessions_data
        }
        
    except Exception as e:
        print(f"Error en get_sheet_practice_history: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener historial: {str(e)}")