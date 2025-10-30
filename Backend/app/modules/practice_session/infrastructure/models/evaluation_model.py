from sqlalchemy import Column, Integer, Numeric, Text, ForeignKey, DateTime
from core.database import Base

class EvaluationModel(Base):
    __tablename__ = "evaluacion"
    
    id_evaluacion = Column(Integer, primary_key=True, index=True)
    id_sesion = Column(Integer, ForeignKey("sesion_practica.id_sesion"))
    precision_notas = Column(Numeric)
    precision_ritmo = Column(Numeric)
    f1_score = Column(Numeric)
    desviacion_tiempo_ms = Column(Numeric)
    feedback = Column(Text)
    fecha_eval = Column(DateTime(timezone=False))
    notas_correctas = Column(Integer)
    notas_incorrectas = Column(Integer)
    notas_omitidas = Column(Integer)
    notas_extra = Column(Integer)
    total_notas_esperadas = Column(Integer)
    accuracy_percentage = Column(Numeric(5, 2))
    duracion_minutos = Column(Integer)