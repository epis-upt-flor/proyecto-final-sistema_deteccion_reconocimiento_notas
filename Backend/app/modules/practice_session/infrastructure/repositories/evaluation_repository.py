from sqlalchemy.orm import Session
from modules.practice_session.infrastructure.models.evaluation_model import EvaluationModel
from modules.practice_session.domain.entities.evaluation import Evaluation
from typing import List, Optional

class EvaluationRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def save(self, evaluation: Evaluation) -> Evaluation:
        db_eval = EvaluationModel(
            id_sesion=evaluation.id_sesion,
            precision_notas=evaluation.precision_notas,
            precision_ritmo=evaluation.precision_ritmo,
            f1_score=evaluation.f1_score,
            desviacion_tiempo_ms=evaluation.desviacion_tiempo_ms,
            feedback=evaluation.feedback,
            fecha_eval=evaluation.fecha_eval,
            notas_correctas=evaluation.notas_correctas,
            notas_incorrectas=evaluation.notas_incorrectas,
            notas_omitidas=evaluation.notas_omitidas,
            notas_extra=evaluation.notas_extra,
            total_notas_esperadas=evaluation.total_notas_esperadas,
            accuracy_percentage=evaluation.accuracy_percentage,
            duracion_minutos=evaluation.duracion_minutos
        )
        self.db.add(db_eval)
        self.db.commit()
        self.db.refresh(db_eval)
        
        evaluation.id_evaluacion = db_eval.id_evaluacion
        return evaluation
    
    def find_by_session_id(self, session_id: int) -> Optional[Evaluation]:
        result = self.db.query(EvaluationModel).filter(
            EvaluationModel.id_sesion == session_id
        ).first()
        
        if not result:
            return None
        
        return Evaluation(
            id_evaluacion=result.id_evaluacion,
            id_sesion=result.id_sesion,
            precision_notas=float(result.precision_notas),
            precision_ritmo=float(result.precision_ritmo),
            f1_score=float(result.f1_score),
            desviacion_tiempo_ms=float(result.desviacion_tiempo_ms),
            feedback=result.feedback,
            fecha_eval=result.fecha_eval,
            notas_correctas=result.notas_correctas,
            notas_incorrectas=result.notas_incorrectas,
            notas_omitidas=result.notas_omitidas,
            notas_extra=result.notas_extra,
            total_notas_esperadas=result.total_notas_esperadas,
            accuracy_percentage=float(result.accuracy_percentage),
            duracion_minutos=result.duracion_minutos
        )