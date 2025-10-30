from typing import List, Optional, Tuple
from ..domain.entities import SheetMusic
from ..domain.repositories import (
    SheetMusicRepositoryInterface, 
    FileStorageInterface,
    SheetConverterInterface
)

class UploadSheetMusicUseCase:
    def __init__(
        self, 
        sheet_repo: SheetMusicRepositoryInterface,
        file_storage: FileStorageInterface,
        converter: SheetConverterInterface
    ):
        self.sheet_repo = sheet_repo
        self.file_storage = file_storage
        self.converter = converter

    def execute(
        self, 
        user_id: int, 
        file_data: bytes, 
        filename: str, 
        content_type: str,
        title: str,
        composer: Optional[str] = None
    ) -> Tuple[Optional[SheetMusic], Optional[str]]:
        try:
            # Determinar tipo de archivo
            file_type = self._get_file_type(filename, content_type)
            if not file_type:
                return None, "Tipo de archivo no soportado"
            
            # Subir archivo original
            file_url = self.file_storage.upload_file(file_data, filename, content_type)
            
            # Crear entidad de partitura
            sheet_music = SheetMusic(
                sheet_id=0,  # Se asignará en el repositorio
                user_id=user_id,
                title=title,
                composer=composer,
                original_filename=filename,
                file_type=file_type,
                file_url=file_url,
                conversion_status="pending"
            )
            
            # Guardar en base de datos
            created_sheet = self.sheet_repo.create(sheet_music)
            
            # TODO: Aquí se iniciará la conversión asíncrona cuando tengas IA
            # self._start_async_conversion(created_sheet.sheet_id, file_data, file_type)
            
            return created_sheet, None
            
        except Exception as e:
            return None, f"Error subiendo partitura: {str(e)}"
    
    def _get_file_type(self, filename: str, content_type: str) -> Optional[str]:
        """Determinar tipo de archivo basado en extensión y content-type"""
        filename_lower = filename.lower()
        if filename_lower.endswith('.pdf') or 'pdf' in content_type:
            return 'pdf'
        elif filename_lower.endswith(('.jpg', '.jpeg')) or 'jpeg' in content_type:
            return 'jpeg'
        elif filename_lower.endswith('.png') or 'png' in content_type:
            return 'png'
        return None

class GetUserSheetsUseCase:
    def __init__(self, sheet_repo: SheetMusicRepositoryInterface):
        self.sheet_repo = sheet_repo

    def execute(self, user_id: int, favorites_only: bool = False) -> List[SheetMusic]:
        if favorites_only:
            return self.sheet_repo.get_favorites_by_user(user_id)
        return self.sheet_repo.get_by_user_id(user_id)

class ToggleFavoriteUseCase:
    def __init__(self, sheet_repo: SheetMusicRepositoryInterface):
        self.sheet_repo = sheet_repo

    def execute(self, user_id: int, sheet_id: int) -> Tuple[Optional[SheetMusic], Optional[str]]:
        # Verificar que el usuario es dueño de la partitura
        if not self.sheet_repo.user_owns_sheet(user_id, sheet_id):
            return None, "No tienes permisos para modificar esta partitura"
        
        sheet_music = self.sheet_repo.get_by_id(sheet_id)
        if not sheet_music:
            return None, "Partitura no encontrada"
        
        # Toggle favorite status
        if sheet_music.is_favorite:
            sheet_music.unmark_as_favorite()
        else:
            sheet_music.mark_as_favorite()
        
        updated_sheet = self.sheet_repo.update(sheet_music)
        return updated_sheet, None

class DeleteSheetMusicUseCase:
    def __init__(
        self, 
        sheet_repo: SheetMusicRepositoryInterface,
        file_storage: FileStorageInterface
    ):
        self.sheet_repo = sheet_repo
        self.file_storage = file_storage

    def execute(self, user_id: int, sheet_id: int) -> Tuple[bool, Optional[str]]:
        # Verificar permisos
        if not self.sheet_repo.user_owns_sheet(user_id, sheet_id):
            return False, "No tienes permisos para eliminar esta partitura"
        
        sheet_music = self.sheet_repo.get_by_id(sheet_id)
        if not sheet_music:
            return False, "Partitura no encontrada"
        
        try:
            # Eliminar archivos del storage
            self.file_storage.delete_file(sheet_music.file_url)
            if sheet_music.midi_url:
                self.file_storage.delete_file(sheet_music.midi_url)
            
            # Eliminar de base de datos
            success = self.sheet_repo.delete(sheet_id)
            return success, None
            
        except Exception as e:
            return False, f"Error eliminando partitura: {str(e)}"

# Placeholder para cuando implementes IA
class ConvertSheetToMidiUseCase:
    def __init__(
        self,
        sheet_repo: SheetMusicRepositoryInterface,
        file_storage: FileStorageInterface,
        converter: SheetConverterInterface
    ):
        self.sheet_repo = sheet_repo
        self.file_storage = file_storage
        self.converter = converter

    def execute(self, sheet_id: int) -> Tuple[bool, Optional[str]]:
        """Este método será implementado cuando tengas los modelos de IA"""
        sheet_music = self.sheet_repo.get_by_id(sheet_id)
        if not sheet_music:
            return False, "Partitura no encontrada"
        
        # TODO: Implementar conversión real con IA
        # Por ahora, solo marcar como completada con URL dummy
        sheet_music.mark_conversion_completed("dummy_midi_url")
        self.sheet_repo.update(sheet_music)
        
        return True, None