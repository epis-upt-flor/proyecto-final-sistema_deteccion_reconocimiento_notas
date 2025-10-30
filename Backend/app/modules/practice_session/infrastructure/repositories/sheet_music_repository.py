from sqlalchemy.orm import Session
from modules.practice_session.infrastructure.models.sheet_music_model import SheetMusicModel
from modules.practice_session.domain.entities.sheet_music import SheetMusic
from typing import List, Optional

class SheetMusicRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def save(self, sheet_music: SheetMusic) -> SheetMusic:
        db_sheet = SheetMusicModel(
            titulo=sheet_music.titulo,
            compositor=sheet_music.compositor,
            archivo_imagen=sheet_music.archivo_imagen,
            midi_referencia=sheet_music.midi_referencia,
            id_usuario=sheet_music.id_usuario,
            favorito=sheet_music.favorito
        )
        self.db.add(db_sheet)
        self.db.commit()
        self.db.refresh(db_sheet)
        
        sheet_music.id_partitura = db_sheet.id_partitura
        sheet_music.fecha_registro = db_sheet.fecha_registro
        return sheet_music
    
    def find_by_user_id(self, user_id: int) -> List[SheetMusic]:
        results = self.db.query(SheetMusicModel).filter(
            SheetMusicModel.id_usuario == user_id
        ).all()
        
        return [
            SheetMusic(
                id_partitura=r.id_partitura,
                titulo=r.titulo,
                compositor=r.compositor,
                archivo_imagen=r.archivo_imagen,
                midi_referencia=r.midi_referencia,
                fecha_registro=r.fecha_registro,
                id_usuario=r.id_usuario,
                favorito=r.favorito
            ) for r in results
        ]
    
    def find_by_id(self, sheet_id: int):
        """Buscar partitura por ID - MÉTODO QUE FALTA"""
        print(f"🔍 Buscando partitura con ID: {sheet_id}")
        
        result = self.db.query(SheetMusicModel).filter(
            SheetMusicModel.id_partitura == sheet_id
        ).first()
        
        if result:
            print(f"✅ Partitura encontrada: {result.titulo}")
            return SheetMusic(
                id_partitura=result.id_partitura,
                titulo=result.titulo,
                compositor=result.compositor,
                archivo_imagen=result.archivo_imagen,
                midi_referencia=result.midi_referencia,
                fecha_registro=result.fecha_registro,
                id_usuario=result.id_usuario,
                favorito=result.favorito
            )
        
        print(f"❌ Partitura no encontrada en BD: {sheet_id}")
        return None
        