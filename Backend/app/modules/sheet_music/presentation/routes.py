from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from core.azure_storage import AzureStorageService
import tempfile
import os
import subprocess

router = APIRouter(prefix="/sheets", tags=["sheet-music"])

def get_current_user_id(request: Request) -> int:
    """
    Obtiene el user_id - versión simplificada para desarrollo
    """
    try:
        print("🔧 Usando usuario de desarrollo: 8")
        return 8
    except Exception as e:
        print(f"❌ Error obteniendo user_id: {e}, usando 8 por defecto")
        return 8

def convert_midi_to_pdf_musescore(midi_data: bytes, filename: str) -> bytes:
    """
    Convierte un archivo MIDI a PDF usando MuseScore directamente
    
    Args:
        midi_data: Bytes del archivo MIDI
        filename: Nombre del archivo MIDI
    
    Returns:
        bytes: Datos del PDF generado
    """
    try:
        print("🎼 Iniciando conversión MIDI a PDF con MuseScore...")
        
        # Buscar MuseScore en rutas comunes
        musescore_paths = [
            r'C:\Program Files\MuseScore 4\bin\MuseScore4.exe',
            r'C:\Program Files\MuseScore 3\bin\MuseScore3.exe',
            r'C:\Program Files (x86)\MuseScore 4\bin\MuseScore4.exe',
            r'C:\Program Files (x86)\MuseScore 3\bin\MuseScore3.exe',
        ]
        
        musescore_path = None
        for path in musescore_paths:
            if os.path.exists(path):
                musescore_path = path
                print(f"✅ MuseScore encontrado: {path}")
                break
        
        if not musescore_path:
            raise Exception("MuseScore no está instalado")
        
        # Crear archivos temporales
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mid') as midi_temp:
            midi_temp.write(midi_data)
            midi_temp_path = midi_temp.name
        
        pdf_temp_path = midi_temp_path.replace('.mid', '.pdf')
        
        try:
            print(f"📖 MIDI temporal: {midi_temp_path}")
            print(f"📄 Generando PDF: {pdf_temp_path}")
            
            # ✅ USAR SUBPROCESS DIRECTAMENTE (como en el código monolítico)
            result = subprocess.run(
                [musescore_path, midi_temp_path, '-o', pdf_temp_path, '--force'],
                capture_output=True,
                timeout=60,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            
            print(f"🔍 MuseScore return code: {result.returncode}")
            if result.stdout:
                print(f"📝 MuseScore stdout: {result.stdout.decode('utf-8', errors='ignore')}")
            if result.stderr:
                print(f"⚠️  MuseScore stderr: {result.stderr.decode('utf-8', errors='ignore')}")
            
            # Verificar que se generó el PDF
            if not os.path.exists(pdf_temp_path):
                raise Exception(f"MuseScore no generó el PDF. Return code: {result.returncode}")
            
            # Leer el PDF
            with open(pdf_temp_path, 'rb') as pdf_file:
                pdf_data = pdf_file.read()
            
            if len(pdf_data) == 0:
                raise Exception("PDF generado está vacío")
            
            print(f"✅ PDF generado - Tamaño: {len(pdf_data)} bytes")
            return pdf_data
            
        finally:
            # Limpiar archivos temporales
            try:
                if os.path.exists(midi_temp_path):
                    os.unlink(midi_temp_path)
                    print(f"🧹 MIDI temporal eliminado: {midi_temp_path}")
                if os.path.exists(pdf_temp_path):
                    os.unlink(pdf_temp_path)
                    print(f"🧹 PDF temporal eliminado: {pdf_temp_path}")
            except Exception as e:
                print(f"⚠️  Error limpiando temporales: {e}")
    
    except subprocess.TimeoutExpired:
        print(f"❌ Timeout: MuseScore tardó más de 60 segundos")
        raise Exception("Timeout al generar PDF con MuseScore")
    except Exception as e:
        print(f"❌ Error en conversión: {str(e)}")
        import traceback
        traceback.print_exc()
        raise Exception(f"Error al convertir MIDI a PDF: {str(e)}")

@router.post("/upload")
async def upload_sheet_music(
    request: Request,
    title: str = Form(...),
    composer: Optional[str] = Form(None),
    file: UploadFile = File(...),
    imagen_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    try:
        print(f"📤 Subiendo partitura para usuario: {user_id}")
        print(f"📝 Título: {title}, Compositor: {composer}")
        print(f"📄 Archivo MIDI: {file.filename}, Tipo: {file.content_type}")
        if imagen_file:
            print(f"🖼️  Archivo imagen: {imagen_file.filename}, Tipo: {imagen_file.content_type}")
        
        # Validar archivo MIDI (requerido)
        midi_allowed_types = ['audio/midi', 'audio/mid', 'application/octet-stream']
        midi_file_extension = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
        
        if (not file.content_type or file.content_type not in midi_allowed_types) and midi_file_extension not in ['mid', 'midi']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo principal debe ser un archivo MIDI (.mid, .midi)"
            )
        
        # Validar archivo de imagen (opcional)
        image_url = None
        if imagen_file:
            image_allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
            image_file_extension = imagen_file.filename.lower().split('.')[-1] if '.' in imagen_file.filename else ''
            
            if (not imagen_file.content_type or imagen_file.content_type not in image_allowed_types) and image_file_extension not in ['jpeg', 'jpg', 'png']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El archivo de imagen debe ser JPEG, JPG o PNG"
                )
        
        # Inicializar Azure Storage Service
        azure_storage = AzureStorageService()
        
        # Leer datos del MIDI
        midi_data = await file.read()
        print(f"📦 Tamaño del archivo MIDI: {len(midi_data)} bytes")
        
        # 1. Subir archivo MIDI a Azure
        try:
            midi_url = azure_storage.upload_file(
                file_data=midi_data,
                filename=file.filename,
                folder="midis"
            )
            print(f"✅ MIDI subido a Azure: {midi_url}")
        except Exception as e:
            print(f"❌ Error subiendo MIDI a Azure: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Error al subir el archivo MIDI al almacenamiento"
            )
        
        # 2. Convertir MIDI a PDF usando MuseScore
        pdf_url = None
        try:
            print("🎼 Convirtiendo MIDI a PDF con MuseScore...")
            pdf_data = convert_midi_to_pdf_musescore(midi_data, file.filename)
            
            # Generar nombre para el PDF
            pdf_filename = file.filename.replace('.mid', '.pdf').replace('.midi', '.pdf')
            if not pdf_filename.endswith('.pdf'):
                pdf_filename = pdf_filename + '.pdf'
            
            # Subir PDF a Azure
            pdf_url = azure_storage.upload_file(
                file_data=pdf_data,
                filename=pdf_filename,
                folder="pdfs"
            )
            print(f"✅ PDF generado y subido a Azure: {pdf_url}")
            
        except Exception as e:
            print(f"⚠️  Error convirtiendo/subiendo PDF: {str(e)}")
            # No hacemos raise aquí, continuamos sin PDF
            pdf_url = None
        
        # 3. Subir imagen a Azure (si existe)
        if imagen_file:
            image_data = await imagen_file.read()
            print(f"📦 Tamaño de la imagen: {len(image_data)} bytes")
            
            try:
                image_url = azure_storage.upload_file(
                    file_data=image_data,
                    filename=imagen_file.filename,
                    folder="images"
                )
                print(f"✅ Imagen subida a Azure: {image_url}")
            except Exception as e:
                print(f"❌ Error subiendo imagen a Azure: {str(e)}")
                image_url = None
        
        # 4. Guardar en la base de datos
        from sqlalchemy import text
        from datetime import datetime
        
        insert_query = text("""
            INSERT INTO partitura (
                titulo, 
                compositor, 
                archivo_imagen, 
                midi_referencia,
                archivo_pdf,
                id_usuario, 
                favorito,
                fecha_registro
            ) VALUES (
                :title, 
                :composer, 
                :image_url, 
                :midi_url,
                :pdf_url,
                :user_id, 
                false,
                NOW()
            )
            RETURNING id_partitura
        """)
        
        result = db.execute(insert_query, {
            "title": title,
            "composer": composer or "",
            "image_url": image_url,
            "midi_url": midi_url,
            "pdf_url": pdf_url,
            "user_id": user_id
        })
        
        sheet_id = result.fetchone()[0]
        db.commit()
        
        print(f"✅ Partitura subida exitosamente - ID: {sheet_id}")
        print(f"   🎵 MIDI: {midi_url}")
        if pdf_url:
            print(f"   📄 PDF: {pdf_url}")
        if image_url:
            print(f"   🖼️  Imagen: {image_url}")
        
        return {
            "sheet_id": sheet_id,
            "user_id": user_id,
            "title": title,
            "composer": composer or "",
            "original_filename": file.filename,
            "file_type": file.content_type,
            "file_url": image_url,
            "midi_url": midi_url,
            "pdf_url": pdf_url,
            "is_converted": True,
            "is_favorite": False,
            "conversion_status": "completed",
            "upload_date": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error en upload: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error al subir partitura: {str(e)}"
        )

@router.get("/my-sheets")
async def get_my_sheets(
    request: Request,
    favorites_only: bool = False,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    try:
        print(f"🔍 Buscando partituras para usuario: {user_id}")
        
        from sqlalchemy import text
        
        query = text("""
            SELECT 
                id_partitura,
                titulo,
                compositor,
                archivo_imagen,
                midi_referencia,
                archivo_pdf,
                favorito,
                fecha_registro
            FROM partitura 
            WHERE id_usuario = :user_id
        """)
        
        result = db.execute(query, {"user_id": user_id})
        sheets_data = result.fetchall()
        
        print(f"📄 Partituras encontradas en BD: {len(sheets_data)}")
        
        sheets = []
        for row in sheets_data:
            sheet = {
                "sheet_id": row.id_partitura,
                "user_id": user_id,
                "title": row.titulo or "Sin título",
                "composer": row.compositor or "Desconocido",
                "original_filename": (row.titulo or "partitura") + ".jpg",
                "file_type": "image",
                "file_url": row.archivo_imagen or "",
                "midi_url": row.midi_referencia or "",
                "pdf_url": row.archivo_pdf or "",
                "is_converted": True,
                "is_favorite": bool(row.favorito),
                "conversion_status": "completed",
                "upload_date": row.fecha_registro.isoformat() if row.fecha_registro else None
            }
            sheets.append(sheet)
            print(f"   ✅ {row.titulo} (ID: {row.id_partitura})")
        
        return {
            "sheets": sheets,
            "total": len(sheets)
        }
        
    except Exception as e:
        print(f"❌ Error en get_my_sheets: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener partituras: {str(e)}"
        )

@router.get("/{sheet_id}/best-accuracy")
async def get_sheet_best_accuracy(
    sheet_id: int, 
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Obtiene la mejor precisión para una partitura específica
    """
    try:
        from sqlalchemy import text
        
        accuracy_query = text("""
            SELECT 
                COALESCE(MAX(e.accuracy_percentage), 0) as best_accuracy
            FROM evaluacion e
            JOIN sesion_practica sp ON e.id_sesion = sp.id_sesion
            WHERE sp.id_partitura = :sheet_id 
            AND sp.id_usuario = :user_id
        """)
        
        result = db.execute(accuracy_query, {
            "sheet_id": sheet_id,
            "user_id": user_id
        }).fetchone()
        
        best_accuracy = float(result.best_accuracy) if result else 0
        print(f"🎯 Mejor accuracy para partitura {sheet_id}: {best_accuracy}%")
        
        return {
            "sheet_id": sheet_id,
            "bestAccuracy": best_accuracy
        }
        
    except Exception as e:
        print(f"❌ Error obteniendo best-accuracy: {str(e)}")
        return {
            "sheet_id": sheet_id,
            "bestAccuracy": 0
        }

@router.post("/{sheet_id}/toggle-favorite")
async def toggle_favorite(
    sheet_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    try:
        from sqlalchemy import text
        
        get_query = text("SELECT favorito FROM partitura WHERE id_partitura = :sheet_id AND id_usuario = :user_id")
        result = db.execute(get_query, {"sheet_id": sheet_id, "user_id": user_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Partitura no encontrada")
        
        current_status = result.favorito or False
        new_status = not current_status
        
        update_query = text("""
            UPDATE partitura 
            SET favorito = :new_status 
            WHERE id_partitura = :sheet_id AND id_usuario = :user_id
        """)
        
        db.execute(update_query, {
            "sheet_id": sheet_id, 
            "user_id": user_id, 
            "new_status": new_status
        })
        db.commit()
        
        print(f"❤️  Partitura {sheet_id} - Favorito: {new_status}")
        
        return {
            "sheet_id": sheet_id,
            "is_favorite": new_status,
            "message": "Favorito actualizado correctamente"
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error toggle favorite: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al actualizar favorito")

@router.get("/{sheet_id}")
async def get_sheet_music(
    sheet_id: int, 
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    try:
        from sqlalchemy import text
        
        query = text("""
            SELECT * FROM partitura 
            WHERE id_partitura = :sheet_id AND id_usuario = :user_id
        """)
        
        result = db.execute(query, {"sheet_id": sheet_id, "user_id": user_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Partitura no encontrada")
        
        return {
            "sheet_id": result.id_partitura,
            "user_id": result.id_usuario,
            "title": result.titulo,
            "composer": result.compositor,
            "original_filename": result.titulo + ".jpg",
            "file_type": "image",
            "file_url": result.archivo_imagen,
            "midi_url": result.midi_referencia,
            "pdf_url": result.archivo_pdf,
            "is_converted": True,
            "is_favorite": bool(result.favorito),
            "conversion_status": "completed",
            "upload_date": result.fecha_registro.isoformat() if result.fecha_registro else None
        }
        
    except Exception as e:
        print(f"❌ Error obteniendo partitura: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al obtener partitura")

@router.delete("/{sheet_id}")
async def delete_sheet_music(
    sheet_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    try:
        from sqlalchemy import text
        
        get_urls_query = text("""
            SELECT archivo_imagen, midi_referencia, archivo_pdf
            FROM partitura 
            WHERE id_partitura = :sheet_id AND id_usuario = :user_id
        """)
        
        result = db.execute(get_urls_query, {"sheet_id": sheet_id, "user_id": user_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Partitura no encontrada")
        
        azure_storage = AzureStorageService()
        
        try:
            if result.midi_referencia:
                azure_storage.delete_file(result.midi_referencia)
                print(f"🗑️  MIDI eliminado de Azure: {result.midi_referencia}")
            
            if result.archivo_pdf:
                azure_storage.delete_file(result.archivo_pdf)
                print(f"🗑️  PDF eliminado de Azure: {result.archivo_pdf}")
            
            if result.archivo_imagen:
                azure_storage.delete_file(result.archivo_imagen)
                print(f"🗑️  Imagen eliminada de Azure: {result.archivo_imagen}")
                
        except Exception as e:
            print(f"⚠️  Error eliminando archivos de Azure: {str(e)}")
        
        delete_query = text("DELETE FROM partitura WHERE id_partitura = :sheet_id AND id_usuario = :user_id")
        db.execute(delete_query, {"sheet_id": sheet_id, "user_id": user_id})
        db.commit()
        
        print(f"🗑️  Partitura {sheet_id} eliminada")
        
        return {"message": "Partitura eliminada correctamente"}
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error eliminando partitura: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al eliminar partitura")