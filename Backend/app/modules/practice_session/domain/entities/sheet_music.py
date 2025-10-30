from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class SheetMusic:
    id_partitura: Optional[int]
    titulo: str
    compositor: str
    archivo_imagen: Optional[str]
    midi_referencia: str
    fecha_registro: datetime
    id_usuario: int
    favorito: bool = False
    
    def to_dict(self):
        return {
            'id': self.id_partitura,
            'titulo': self.titulo,
            'compositor': self.compositor,
            'imagen_url': self.archivo_imagen,
            'midi_url': self.midi_referencia,
            'fecha_registro': self.fecha_registro.isoformat(),
            'favorito': self.favorito
        }