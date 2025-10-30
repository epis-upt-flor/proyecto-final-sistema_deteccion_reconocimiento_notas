from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from core.database import Base

class SheetMusicModel(Base):
    __tablename__ = "partitura"
    
    id_partitura = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    compositor = Column(String)
    archivo_imagen = Column(String)
    midi_referencia = Column(String)
    fecha_registro = Column(DateTime(timezone=False), server_default=func.now())
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"))
    favorito = Column(Boolean, default=False)