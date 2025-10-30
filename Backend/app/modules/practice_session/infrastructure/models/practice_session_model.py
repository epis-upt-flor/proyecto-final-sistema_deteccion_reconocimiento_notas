from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from core.database import Base

class PracticeSessionModel(Base):
    __tablename__ = "sesion_practica"
    
    id_sesion = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"))
    id_partitura = Column(Integer, ForeignKey("partitura.id_partitura"))
    fecha_inicio = Column(DateTime(timezone=False))
    fecha_fin = Column(DateTime(timezone=False))
    archivo_audio = Column(String)
    midi_interpretacion = Column(String)