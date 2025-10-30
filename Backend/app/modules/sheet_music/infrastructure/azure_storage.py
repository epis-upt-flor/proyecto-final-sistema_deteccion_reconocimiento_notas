# Placeholder para Azure Blob Storage
from ..domain.repositories import FileStorageInterface

class AzureBlobStorage(FileStorageInterface):
    def __init__(self, connection_string: str, container_name: str):
        self.connection_string = connection_string
        self.container_name = container_name
        # TODO: Inicializar cliente de Azure Blob

    def upload_file(self, file_data: bytes, filename: str, content_type: str) -> str:
        # TODO: Implementar subida real a Azure Blob
        # Por ahora retornar URL dummy
        return f"https://chopinplay.blob.core.windows.net/sheets/{filename}"

    def delete_file(self, file_url: str) -> bool:
        # TODO: Implementar eliminación real
        return True

    def get_file_url(self, filename: str) -> str:
        return f"https://chopinplay.blob.core.windows.net/sheets/{filename}"

# Implementación temporal con almacenamiento local
class LocalFileStorage(FileStorageInterface):
    def __init__(self, base_path: str = "./uploads"):
        self.base_path = base_path
        import os
        os.makedirs(base_path, exist_ok=True)

    def upload_file(self, file_data: bytes, filename: str, content_type: str) -> str:
        import os
        import uuid
        
        # Generar nombre único
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(self.base_path, unique_filename)
        
        with open(file_path, "wb") as f:
            f.write(file_data)
        
        return f"/uploads/{unique_filename}"

    def delete_file(self, file_url: str) -> bool:
        import os
        try:
            # Extraer nombre del archivo de la URL
            filename = file_url.split("/")[-1]
            file_path = os.path.join(self.base_path, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
            return True
        except:
            return False

    def get_file_url(self, filename: str) -> str:
        return f"/uploads/{filename}"