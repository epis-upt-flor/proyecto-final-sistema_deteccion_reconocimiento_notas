from datetime import datetime
from typing import Optional

class SheetMusic:
    def __init__(
        self,
        sheet_id: int,
        user_id: int,
        title: str,
        composer: Optional[str] = None,
        original_filename: str = "",
        file_type: str = "pdf",  # pdf, jpg, png
        file_url: str = "",
        midi_url: Optional[str] = None,
        is_converted: bool = False,
        is_favorite: bool = False,
        upload_date: Optional[datetime] = None,
        conversion_status: str = "pending"  # pending, processing, completed, failed
    ):
        self.sheet_id = sheet_id
        self.user_id = user_id
        self.title = title
        self.composer = composer
        self.original_filename = original_filename
        self.file_type = file_type
        self.file_url = file_url
        self.midi_url = midi_url
        self.is_converted = is_converted
        self.is_favorite = is_favorite
        self.upload_date = upload_date or datetime.now()
        self.conversion_status = conversion_status
    
    def mark_as_favorite(self):
        """Marcar partitura como favorita"""
        self.is_favorite = True
    
    def unmark_as_favorite(self):
        """Desmarcar partitura como favorita"""
        self.is_favorite = False
    
    def mark_conversion_completed(self, midi_url: str):
        """Marcar conversión como completada"""
        self.midi_url = midi_url
        self.is_converted = True
        self.conversion_status = "completed"
    
    def mark_conversion_failed(self):
        """Marcar conversión como fallida"""
        self.conversion_status = "failed"
        self.is_converted = False
    
    def can_be_practiced(self) -> bool:
        """Verificar si la partitura puede ser usada para práctica"""
        return self.is_converted and self.midi_url is not None