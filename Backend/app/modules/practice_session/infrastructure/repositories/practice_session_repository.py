from sqlalchemy.orm import Session
from modules.practice_session.infrastructure.models.practice_session_model import PracticeSessionModel
from modules.practice_session.domain.entities.practice_session import PracticeSession
from typing import List, Optional

class PracticeSessionRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def save(self, session: PracticeSession) -> PracticeSession:
        db_session = PracticeSessionModel(
            id_usuario=session.id_usuario,
            id_partitura=session.id_partitura,
            fecha_inicio=session.fecha_inicio,
            fecha_fin=session.fecha_fin,
            archivo_audio=session.archivo_audio,
            midi_interpretacion=session.midi_interpretacion
        )
        self.db.add(db_session)
        self.db.commit()
        self.db.refresh(db_session)
        
        session.id_sesion = db_session.id_sesion
        return session
    
    def find_by_user_id(self, user_id: int) -> List[PracticeSession]:
        results = self.db.query(PracticeSessionModel).filter(
            PracticeSessionModel.id_usuario == user_id
        ).order_by(PracticeSessionModel.fecha_inicio.desc()).all()
        
        return [
            PracticeSession(
                id_sesion=r.id_sesion,
                id_usuario=r.id_usuario,
                id_partitura=r.id_partitura,
                fecha_inicio=r.fecha_inicio,
                fecha_fin=r.fecha_fin,
                archivo_audio=r.archivo_audio,
                midi_interpretacion=r.midi_interpretacion
            ) for r in results
        ]