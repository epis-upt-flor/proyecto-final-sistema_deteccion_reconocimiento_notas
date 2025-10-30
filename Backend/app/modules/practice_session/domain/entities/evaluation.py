from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class Evaluation:
    id_evaluacion: Optional[int]
    id_sesion: int
    precision_notas: float  # accuracy_percentage
    precision_ritmo: float  # calculado de timing_errors
    f1_score: float
    desviacion_tiempo_ms: float  # promedio de timing_errors en ms
    feedback: str  # texto generado con los errores
    fecha_eval: datetime
    notas_correctas: int
    notas_incorrectas: int
    notas_omitidas: int
    notas_extra: int
    total_notas_esperadas: int
    accuracy_percentage: float
    duracion_minutos: int
    
    def to_dict(self):
        return {
            'id_evaluacion': self.id_evaluacion,
            'id_sesion': self.id_sesion,
            'precision_notas': float(self.precision_notas),
            'precision_ritmo': float(self.precision_ritmo),
            'f1_score': float(self.f1_score),
            'desviacion_tiempo_ms': float(self.desviacion_tiempo_ms),
            'feedback': self.feedback,
            'fecha_eval': self.fecha_eval.isoformat(),
            'notas_correctas': self.notas_correctas,
            'notas_incorrectas': self.notas_incorrectas,
            'notas_omitidas': self.notas_omitidas,
            'notas_extra': self.notas_extra,
            'total_notas_esperadas': self.total_notas_esperadas,
            'accuracy_percentage': float(self.accuracy_percentage),
            'duracion_minutos': self.duracion_minutos
        }