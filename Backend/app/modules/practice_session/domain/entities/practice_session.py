from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class PracticeSession:
    id_sesion: Optional[int]
    id_usuario: int
    id_partitura: int
    fecha_inicio: datetime
    fecha_fin: Optional[datetime]
    archivo_audio: Optional[str]  # URL en Azure Blob
    midi_interpretacion: Optional[str]  # URL del MIDI transcrito
    
    def to_dict(self):
        return {
            'id_sesion': self.id_sesion,
            'id_usuario': self.id_usuario,
            'id_partitura': self.id_partitura,
            'fecha_inicio': self.fecha_inicio.isoformat(),
            'fecha_fin': self.fecha_fin.isoformat() if self.fecha_fin else None,
            'archivo_audio': self.archivo_audio,
            'midi_interpretacion': self.midi_interpretacion
        }