from abc import ABC, abstractmethod
from typing import List, Optional
from .entities import SheetMusic

class SheetMusicRepositoryInterface(ABC):
    @abstractmethod
    def get_by_id(self, sheet_id: int) -> Optional[SheetMusic]:
        pass
    
    @abstractmethod
    def get_by_user_id(self, user_id: int) -> List[SheetMusic]:
        pass
    
    @abstractmethod
    def get_favorites_by_user(self, user_id: int) -> List[SheetMusic]:
        pass
    
    @abstractmethod
    def create(self, sheet_music: SheetMusic) -> SheetMusic:
        pass
    
    @abstractmethod
    def update(self, sheet_music: SheetMusic) -> SheetMusic:
        pass
    
    @abstractmethod
    def delete(self, sheet_id: int) -> bool:
        pass
    
    @abstractmethod
    def user_owns_sheet(self, user_id: int, sheet_id: int) -> bool:
        pass

class FileStorageInterface(ABC):
    @abstractmethod
    def upload_file(self, file_data: bytes, filename: str, content_type: str) -> str:
        """Subir archivo y retornar URL"""
        pass
    
    @abstractmethod
    def delete_file(self, file_url: str) -> bool:
        """Eliminar archivo"""
        pass
    
    @abstractmethod
    def get_file_url(self, filename: str) -> str:
        """Obtener URL pública del archivo"""
        pass

class SheetConverterInterface(ABC):
    @abstractmethod
    def can_convert(self, file_type: str) -> bool:
        """Verificar si puede convertir este tipo de archivo"""
        pass
    
    @abstractmethod
    def convert_to_midi(self, file_data: bytes, file_type: str) -> bytes:
        """Convertir archivo a MIDI - será implementado con IA"""
        pass