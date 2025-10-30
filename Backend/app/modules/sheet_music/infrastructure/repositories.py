from sqlalchemy.orm import Session
from typing import List, Optional
from .models import SheetMusicModel
from ..domain.entities import SheetMusic
from ..domain.repositories import SheetMusicRepositoryInterface

class SheetMusicRepositoryImpl(SheetMusicRepositoryInterface):
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, model: SheetMusicModel) -> SheetMusic:
        return SheetMusic(
            sheet_id=model.id,
            user_id=model.user_id,
            title=model.title,
            composer=model.composer,
            original_filename=model.original_filename,
            file_type=model.file_type,
            file_url=model.file_url,
            midi_url=model.midi_url,
            is_converted=model.is_converted,
            is_favorite=model.is_favorite,
            upload_date=model.upload_date,
            conversion_status=model.conversion_status
        )

    def get_by_id(self, sheet_id: int) -> Optional[SheetMusic]:
        model = self.db.query(SheetMusicModel).filter(SheetMusicModel.id == sheet_id).first()
        return self._to_entity(model) if model else None

    def get_by_user_id(self, user_id: int) -> List[SheetMusic]:
        models = self.db.query(SheetMusicModel).filter(SheetMusicModel.user_id == user_id).all()
        return [self._to_entity(model) for model in models]

    def get_favorites_by_user(self, user_id: int) -> List[SheetMusic]:
        models = self.db.query(SheetMusicModel).filter(
            SheetMusicModel.user_id == user_id,
            SheetMusicModel.is_favorite == True
        ).all()
        return [self._to_entity(model) for model in models]

    def create(self, sheet_music: SheetMusic) -> SheetMusic:
        model = SheetMusicModel(
            user_id=sheet_music.user_id,
            title=sheet_music.title,
            composer=sheet_music.composer,
            original_filename=sheet_music.original_filename,
            file_type=sheet_music.file_type,
            file_url=sheet_music.file_url,
            midi_url=sheet_music.midi_url,
            is_converted=sheet_music.is_converted,
            is_favorite=sheet_music.is_favorite,
            conversion_status=sheet_music.conversion_status
        )
        
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._to_entity(model)

    def update(self, sheet_music: SheetMusic) -> SheetMusic:
        model = self.db.query(SheetMusicModel).filter(SheetMusicModel.id == sheet_music.sheet_id).first()
        if model:
            model.title = sheet_music.title
            model.composer = sheet_music.composer
            model.is_favorite = sheet_music.is_favorite
            model.midi_url = sheet_music.midi_url
            model.is_converted = sheet_music.is_converted
            model.conversion_status = sheet_music.conversion_status
            
            self.db.commit()
            return self._to_entity(model)
        return None

    def delete(self, sheet_id: int) -> bool:
        model = self.db.query(SheetMusicModel).filter(SheetMusicModel.id == sheet_id).first()
        if model:
            self.db.delete(model)
            self.db.commit()
            return True
        return False

    def user_owns_sheet(self, user_id: int, sheet_id: int) -> bool:
        model = self.db.query(SheetMusicModel).filter(
            SheetMusicModel.id == sheet_id,
            SheetMusicModel.user_id == user_id
        ).first()
        return model is not None