from azure.storage.blob import BlobServiceClient, ContentSettings
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

class AzureStorageService:
    def __init__(self):
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        self.container_name = os.getenv("AZURE_CONTAINER_NAME")
        self.blob_service_client = BlobServiceClient.from_connection_string(
            self.connection_string
        )
        self.container_client = self.blob_service_client.get_container_client(
            self.container_name
        )
    
    def upload_file(self, file_data: bytes, filename: str, folder: str = "") -> str:
        """Sube un archivo a Azure Blob Storage y retorna la URL"""
        unique_filename = f"{uuid.uuid4()}_{filename}"
        blob_name = f"{folder}/{unique_filename}" if folder else unique_filename
        
        content_type = self._get_content_type(filename)
        
        blob_client = self.container_client.get_blob_client(blob_name)
        blob_client.upload_blob(
            file_data,
            overwrite=True,
            content_settings=ContentSettings(content_type=content_type)
        )
        
        return blob_client.url
    
    def download_file(self, blob_name: str, local_path: str) -> bool:
        """Descarga un archivo de Azure Blob Storage a una ruta local"""
        try:
            blob_client = self.container_client.get_blob_client(blob_name)
            
            with open(local_path, "wb") as download_file:
                download_file.write(blob_client.download_blob().readall())
            
            return True
        except Exception as e:
            print(f"Error descargando archivo {blob_name}: {e}")
            return False
    
    def file_exists(self, blob_name: str) -> bool:
        """Verifica si un archivo existe en Azure Blob Storage"""
        try:
            blob_client = self.container_client.get_blob_client(blob_name)
            return blob_client.exists()
        except Exception:
            return False
    
    def delete_file(self, blob_url: str):
        """Elimina un archivo de Azure Blob Storage"""
        blob_name = blob_url.split(f"{self.container_name}/")[-1]
        blob_client = self.container_client.get_blob_client(blob_name)
        blob_client.delete_blob()
    
    def _get_content_type(self, filename: str) -> str:
        ext = filename.lower().split('.')[-1]
        content_types = {
            'mid': 'audio/midi',
            'midi': 'audio/midi',
            'pdf': 'application/pdf',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
        }
        return content_types.get(ext, 'application/octet-stream')