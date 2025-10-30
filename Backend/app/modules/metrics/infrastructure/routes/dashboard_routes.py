from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta
from typing import List, Dict
from core.database import get_db

router = APIRouter(prefix="/api/v1/dashboard")


@router.get("/stats/{user_id}")
async def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """
    Obtiene estadísticas generales del usuario usando consultas directas a la BD
    """
    try:
        # Estadísticas básicas - CORREGIDAS para reflejar datos reales
        stats_query = text("""
            SELECT 
                COUNT(DISTINCT sp.id_sesion) as total_sessions,
                COUNT(DISTINCT sp.id_partitura) as unique_sheets,
                COALESCE(AVG(e.accuracy_percentage), 0) as avg_accuracy,
                COALESCE(SUM(COALESCE(e.duracion_minutos, 0)), 0) as total_minutes,
                MAX(sp.fecha_inicio) as last_session_date
            FROM sesion_practica sp
            LEFT JOIN evaluacion e ON sp.id_sesion = e.id_sesion
            WHERE sp.id_usuario = :user_id
        """)
        
        result = db.execute(stats_query, {"user_id": user_id}).fetchone()
        
        if not result or result.total_sessions == 0:
            return {
                "averageAccuracy": 0,
                "totalPracticeTime": "0h 0m",
                "sheetsPracticed": 0,
                "lastSession": "Sin sesiones"
            }
        
        # Formatear tiempo de práctica
        total_minutes = int(result.total_minutes or 0)
        hours = total_minutes // 60
        minutes = total_minutes % 60
        
        # Formatear última sesión - AJUSTADO para manejar zonas horarias
        last_session_date = "Sin sesiones"
        if result.last_session_date:
            # Convertir a aware datetime si es naive
            if result.last_session_date.tzinfo is None:
                from datetime import timezone
                last_session = result.last_session_date.replace(tzinfo=timezone.utc)
            else:
                last_session = result.last_session_date
            
            # Calcular diferencia considerando zona horaria
            now = datetime.now(timezone.utc)
            time_diff = now - last_session
            days_ago = time_diff.days
            hours_ago = time_diff.seconds // 3600
            
            if days_ago == 0:
                if hours_ago == 0:
                    minutes_ago = (time_diff.seconds // 60)
                    if minutes_ago < 1:
                        last_session_date = "Hace unos segundos"
                    else:
                        last_session_date = f"Hace {minutes_ago} minutos"
                else:
                    last_session_date = f"Hace {hours_ago} horas"
            elif days_ago == 1:
                last_session_date = "Ayer"
            else:
                last_session_date = f"Hace {days_ago} días"
        
        return {
            "averageAccuracy": round(float(result.avg_accuracy), 1),
            "totalPracticeTime": f"{hours}h {minutes}m",
            "sheetsPracticed": result.unique_sheets,
            "lastSession": last_session_date
        }
        
    except Exception as e:
        print(f"Error en stats: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en stats: {str(e)}")


@router.get("/progress/{user_id}")
async def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """
    Obtiene el progreso del usuario en los últimos 7 días basado en accuracy_percentage
    """
    try:
        # Obtener progreso de los últimos 7 días - MEJORADO
        progress_query = text("""
            SELECT 
                DATE(e.fecha_eval) as date,
                AVG(e.accuracy_percentage) as avg_accuracy,
                COUNT(*) as session_count
            FROM evaluacion e
            JOIN sesion_practica sp ON e.id_sesion = sp.id_sesion
            WHERE sp.id_usuario = :user_id 
            AND e.fecha_eval >= CURRENT_DATE - INTERVAL '7 days'
            AND e.accuracy_percentage IS NOT NULL
            GROUP BY DATE(e.fecha_eval)
            ORDER BY date
        """)
        
        results = db.execute(progress_query, {"user_id": user_id}).fetchall()
        
        # Crear diccionario de fechas con datos
        data_dict = {}
        for row in results:
            date_str = row.date.strftime("%d/%m")
            data_dict[date_str] = round(float(row.avg_accuracy or 0), 1)
        
        # Generar lista de los últimos 7 días
        labels = []
        data = []
        today = datetime.now()
        
        for i in range(7):
            date = today - timedelta(days=6-i)
            date_str = date.strftime("%d/%m")
            labels.append(date_str)
            # Si no hay datos para ese día, usar 0
            data.append(data_dict.get(date_str, 0))
        
        return {
            "labels": labels,
            "data": data
        }
        
    except Exception as e:
        print(f"Error en progress: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en progress: {str(e)}")


@router.get("/accuracy-distribution/{user_id}")
async def get_accuracy_distribution(user_id: int, db: Session = Depends(get_db)):
    """
    Obtiene la distribución TOTAL de notas correctas vs incorrectas de TODAS las sesiones
    """
    try:
        # Sumar TODAS las notas correctas e incorrectas de todas las evaluaciones
        accuracy_query = text("""
            SELECT 
                COALESCE(SUM(e.notas_correctas), 0) as total_correct,
                COALESCE(SUM(e.notas_incorrectas + e.notas_omitidas + e.notas_extra), 0) as total_incorrect
            FROM evaluacion e
            JOIN sesion_practica sp ON e.id_sesion = sp.id_sesion
            WHERE sp.id_usuario = :user_id
            AND e.notas_correctas IS NOT NULL
        """)
        
        result = db.execute(accuracy_query, {"user_id": user_id}).fetchone()
        
        total_correct = int(result.total_correct or 0)
        total_incorrect = int(result.total_incorrect or 0)
        
        # Si no hay datos, retornar valores por defecto
        if total_correct == 0 and total_incorrect == 0:
            return {
                "correct": 0,
                "incorrect": 0
            }
        
        return {
            "correct": total_correct,
            "incorrect": total_incorrect
        }
        
    except Exception as e:
        print(f"Error en accuracy distribution: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en accuracy distribution: {str(e)}")


@router.get("/recent-sessions/{user_id}")
async def get_recent_sessions(user_id: int, db: Session = Depends(get_db)):
    """
    Obtiene las 5 sesiones más recientes del usuario con sus evaluaciones
    """
    try:
        # CORREGIDO: Obtener sesiones con evaluaciones reales
        sessions_query = text("""
            SELECT 
                sp.id_sesion,
                p.titulo,
                sp.fecha_inicio,
                COALESCE(e.accuracy_percentage, 0) as accuracy_percentage,
                COALESCE(e.precision_ritmo, 0) as precision_ritmo,
                COALESCE(e.duracion_minutos, 0) as duration_minutes,
                e.notas_correctas,
                e.total_notas_esperadas
            FROM sesion_practica sp
            LEFT JOIN partitura p ON sp.id_partitura = p.id_partitura
            LEFT JOIN evaluacion e ON sp.id_sesion = e.id_sesion
            WHERE sp.id_usuario = :user_id
            ORDER BY sp.fecha_inicio DESC
            LIMIT 5
        """)
        
        results = db.execute(sessions_query, {"user_id": user_id}).fetchall()
        
        recent_sessions = []
        for row in results:
            duration_minutes = int(row.duration_minutes or 0)
            
            # Formatear fecha de forma más legible
            fecha_inicio = row.fecha_inicio
            fecha_str = fecha_inicio.strftime("%d/%m/%Y %H:%M")
            
            recent_sessions.append({
                "id": row.id_sesion,
                "sheetName": row.titulo or "Partitura no encontrada",
                "date": fecha_str,
                "accuracy": round(float(row.accuracy_percentage or 0), 1),
                "rhythm": round(float(row.precision_ritmo or 0), 1),
                "duration": f"{duration_minutes} min",
                "notasCorrectas": row.notas_correctas or 0,
                "notasTotales": row.total_notas_esperadas or 0
            })
        
        return recent_sessions
        
    except Exception as e:
        print(f"Error en recent sessions: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en recent sessions: {str(e)}")