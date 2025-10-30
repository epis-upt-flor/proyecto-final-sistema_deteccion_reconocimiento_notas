from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional, List

class SheetMusicUpload(BaseModel):
    title: str
    composer: Optional[str] = None
    
    @validator('title')
    def title_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('El título no puede estar vacío')
        return v.strip()

class SheetMusicResponse(BaseModel):
    sheet_id: int
    user_id: int
    title: str
    composer: Optional[str]
    original_filename: str
    file_type: str
    file_url: str
    midi_url: Optional[str]
    is_converted: bool
    is_favorite: bool
    conversion_status: str
    upload_date: datetime

    class Config:
        from_attributes = True

class SheetMusicListResponse(BaseModel):
    sheets: List[SheetMusicResponse]
    total: int

class FavoriteToggleResponse(BaseModel):
    sheet_id: int
    is_favorite: bool
    message: str