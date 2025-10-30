from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from core.database import Base

class SheetMusicModel(Base):
    __tablename__ = "sheet_music"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)  # FK a auth_users
    title = Column(String(200), nullable=False)
    composer = Column(String(150), nullable=True)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False)  # pdf, jpeg, png
    file_url = Column(Text, nullable=False)  # URL en Azure Blob
    midi_url = Column(Text, nullable=True)   # URL del MIDI convertido
    is_converted = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    conversion_status = Column(String(20), default="pending")  # pending, processing, completed, failed
    upload_date = Column(DateTime, default=func.now())
    updated_date = Column(DateTime, default=func.now(), onupdate=func.now())