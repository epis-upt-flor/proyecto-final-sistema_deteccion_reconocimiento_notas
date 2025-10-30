# modules/practice_session/application/services/section_practice_service.py
import logging
from typing import List, Dict, Any, Optional
import numpy as np
import pretty_midi
from music21 import converter, stream, tempo, metadata
from datetime import datetime
import json
import os
import tempfile
import traceback
from scipy.io import wavfile
import base64
import io
import subprocess

logger = logging.getLogger(__name__)

class SectionPracticeService:
    """Servicio para dividir MIDI en secciones y gestionar práctica por secciones"""
    
    def __init__(self, azure_storage_service):
        self.azure_storage = azure_storage_service
    
    async def prepare_sheet_music_sections(self, sheet_music_id: int, measures_per_section: int = 4) -> Dict[str, Any]:
        """
        Prepara las secciones de una partitura para práctica EN MEMORIA
        
        Args:
            sheet_music_id: ID de la partitura en la base de datos
            measures_per_section: Número de compases por sección
            
        Returns:
            Dict con los datos de las secciones EN MEMORIA (no URLs)
        """
        try:
            logger.info(f"🔄 Preparando secciones EN MEMORIA para sheet {sheet_music_id} con {measures_per_section} compases por sección")
            print(f"🔍 DEBUG [prepare_sheet_music_sections]: Iniciando para sheet_id {sheet_music_id}")
            
            # 1. Obtener información de la partitura desde la base de datos
            sheet_info = await self._get_sheet_info(sheet_music_id)
            print(f"🔍 DEBUG [prepare_sheet_music_sections]: Sheet info obtenida: {sheet_info is not None}")
            
            if not sheet_info:
                error_msg = f"No se encontró la partitura con ID {sheet_music_id}"
                print(f"❌ DEBUG [prepare_sheet_music_sections]: {error_msg}")
                return {
                    "success": False,
                    "error": error_msg
                }
            
            # 2. Verificar que tenga MIDI de referencia
            if not hasattr(sheet_info, 'midi_referencia') or not sheet_info.midi_referencia:
                error_msg = f"La partitura {sheet_music_id} no tiene MIDI de referencia"
                print(f"❌ DEBUG [prepare_sheet_music_sections]: {error_msg}")
                return {
                    "success": False,
                    "error": error_msg
                }
            
            print(f"📥 DEBUG [prepare_sheet_music_sections]: MIDI referencia encontrado: {sheet_info.midi_referencia}")
            
            # 3. Descargar MIDI desde Azure Storage (SOLO ESTE VA A AZURE)
            midi_blob_name = self._extract_blob_name(sheet_info.midi_referencia)
            print(f"🔍 DEBUG [prepare_sheet_music_sections]: Blob name extraído: {midi_blob_name}")
            
            if not midi_blob_name:
                error_msg = f"No se pudo extraer el nombre del blob desde la URL: {sheet_info.midi_referencia}"
                print(f"❌ DEBUG [prepare_sheet_music_sections]: {error_msg}")
                return {
                    "success": False,
                    "error": error_msg
                }
            
            midi_bytes = await self._download_midi_bytes(midi_blob_name)
            print(f"🔍 DEBUG [prepare_sheet_music_sections]: MIDI bytes descargados: {len(midi_bytes) if midi_bytes else 0} bytes")
            
            if not midi_bytes:
                error_msg = f"No se pudo descargar el MIDI para la partitura {sheet_music_id}"
                print(f"❌ DEBUG [prepare_sheet_music_sections]: {error_msg}")
                return {
                    "success": False,
                    "error": error_msg
                }
            
            logger.info(f"✅ MIDI descargado: {len(midi_bytes)} bytes")
            
            # 4. Dividir en secciones EN MEMORIA
            try:
                print(f"🔍 DEBUG [prepare_sheet_music_sections]: Intentando división por compases...")
                sections = await self._split_into_sections_in_memory(midi_bytes, measures_per_section)
                logger.info(f"✅ MIDI dividido en {len(sections)} secciones en memoria")
                print(f"✅ DEBUG [prepare_sheet_music_sections]: División por compases exitosa: {len(sections)} secciones")
            except Exception as e:
                logger.warning(f"División por compases falló, usando división por tiempo: {e}")
                print(f"⚠️ DEBUG [prepare_sheet_music_sections]: División por compases falló, usando tiempo: {e}")
                sections = await self._split_into_sections_by_time_in_memory(midi_bytes)
            
            # 5. Procesar cada sección EN MEMORIA (CON AUDIO)
            processed_sections = []
            print(f"🔍 DEBUG [prepare_sheet_music_sections]: Procesando {len(sections)} secciones...")
            
            for i, section_data in enumerate(sections, 1):
                processed_section = await self._process_section_in_memory(section_data, sheet_music_id, i)
                processed_sections.append(processed_section)
                logger.info(f"✅ Sección {i} procesada en memoria")
                print(f"✅ DEBUG [prepare_sheet_music_sections]: Sección {i} procesada")
            
            # 6. Crear y guardar metadata (sin subir a Azure)
            metadata = {
                "sheet_music_id": sheet_music_id,
                "title": getattr(sheet_info, 'titulo', 'Sin título'),
                "composer": getattr(sheet_info, 'compositor', 'Desconocido'),
                "measures_per_section": measures_per_section,
                "total_sections": len(processed_sections),
                "sections": processed_sections,
                "created_at": datetime.now().isoformat(),
                "cache_strategy": "in_memory"
            }
            
            # Subir metadata a Azure (opcional, para compatibilidad)
            try:
                metadata_blob_name = f"sections/{sheet_music_id}_metadata.json"
                metadata_bytes = json.dumps(metadata, indent=2).encode('utf-8')
                self.azure_storage.upload_file(metadata_bytes, f"{sheet_music_id}_metadata.json", "sections")
                print(f"✅ DEBUG [prepare_sheet_music_sections]: Metadata subida a Azure")
            except Exception as e:
                print(f"⚠️ DEBUG [prepare_sheet_music_sections]: No se pudo subir metadata a Azure: {e}")
            
            logger.info(f"🎯 Preparación completada: {len(processed_sections)} secciones listas en memoria")
            print(f"✅ DEBUG [prepare_sheet_music_sections]: Preparación completada exitosamente")
            
            return {
                "success": True,
                "sheet_music_id": sheet_music_id,
                "sections_count": len(processed_sections),
                "message": f"Partitura dividida en {len(processed_sections)} secciones exitosamente",
                "metadata": metadata
            }
            
        except Exception as e:
            error_msg = f"Error preparando secciones: {str(e)}"
            logger.error(f"❌ {error_msg}")
            print(f"❌ DEBUG [prepare_sheet_music_sections]: ERROR - {traceback.format_exc()}")
            return {
                "success": False,
                "error": error_msg
            }
    
    async def get_section_metadata(self, sheet_music_id: int) -> Dict[str, Any]:
        """Obtiene la metadata de las secciones desde Azure"""
        try:
            print(f"🔍 DEBUG [get_section_metadata]: Solicitando metadata para sheet_id {sheet_music_id}")
            
            # Intentar descargar metadata desde Azure
            try:
                metadata_blob_name = f"sections/{sheet_music_id}_metadata.json"
                temp_path = os.path.join(tempfile.gettempdir(), f"temp_metadata_{sheet_music_id}.json")
                
                if hasattr(self.azure_storage, 'download_file'):
                    success = self.azure_storage.download_file(metadata_blob_name, temp_path)
                    if success and os.path.exists(temp_path):
                        with open(temp_path, 'r') as f:
                            metadata = json.load(f)
                        os.unlink(temp_path)
                        print(f"✅ DEBUG [get_section_metadata]: Metadata cargada desde Azure")
                        return metadata
            except Exception as e:
                print(f"⚠️ DEBUG [get_section_metadata]: No se pudo cargar metadata desde Azure: {e}")
            
            # Si no se pudo cargar, retornar error
            return {
                "success": False,
                "error": "Usa /prepare para obtener secciones frescas en memoria",
                "needs_preparation": True
            }
                
        except Exception as e:
            logger.error(f"Error getting section metadata: {e}")
            print(f"❌ DEBUG [get_section_metadata]: ERROR - {e}")
            return {"error": str(e)}
    
    async def analyze_performance(self, audio_file, section_number: int, sheet_music_id: int) -> Dict[str, Any]:
        """Analiza una grabación de performance EN MEMORIA"""
        try:
            logger.info(f"🎵 Analizando performance para sección {section_number} en memoria")
            print(f"🔍 DEBUG [analyze_performance]: Iniciando análisis para sección {section_number}")
            
            # Leer audio directamente desde el upload
            audio_bytes = await audio_file.read()
            print(f"🔍 DEBUG [analyze_performance]: Audio leído: {len(audio_bytes)} bytes")
            
            # Simular análisis (aquí iría Basic Pitch)
            accuracy = np.random.uniform(70, 95)
            timing_accuracy = np.random.uniform(65, 90)
            note_accuracy = np.random.uniform(75, 98)
            
            logger.info(f"✅ Análisis completado en memoria - Precisión: {accuracy:.1f}%")
            print(f"✅ DEBUG [analyze_performance]: Análisis simulado completado - Precisión: {accuracy:.1f}%")
            
            return {
                "accuracy": round(accuracy, 1),
                "timing_accuracy": round(timing_accuracy, 1),
                "note_accuracy": round(note_accuracy, 1),
                "feedback": self._generate_feedback(accuracy),
                "section_number": section_number,
                "timestamp": datetime.now().isoformat(),
                "processed_in_memory": True
            }
            
        except Exception as e:
            logger.error(f"❌ Error analizando performance: {e}")
            print(f"❌ DEBUG [analyze_performance]: ERROR - {e}")
            return {"error": str(e)}
    
    # ============================================
    # NUEVAS FUNCIONES: PARTITURAS POR SECCIÓN
    # ============================================
    
    async def generate_section_sheet_music(self, sheet_music_id: int, section_number: int) -> Dict[str, Any]:
        """
        Generar partitura PDF e IMAGEN para una sección específica usando datos ya preparados
        """
        try:
            print(f"🎼 Generando partitura para sección {section_number}")
            
            # Intentar obtener metadata desde Azure primero
            try:
                metadata_blob_name = f"sections/{sheet_music_id}_metadata.json"
                temp_path = os.path.join(tempfile.gettempdir(), f"temp_metadata_{sheet_music_id}.json")
                
                if hasattr(self.azure_storage, 'download_file'):
                    success = self.azure_storage.download_file(metadata_blob_name, temp_path)
                    if success and os.path.exists(temp_path):
                        with open(temp_path, 'r') as f:
                            metadata = json.load(f)
                        os.unlink(temp_path)
                        
                        # Buscar la sección específica
                        section = next((s for s in metadata['sections'] if s['section_number'] == section_number), None)
                        if section and 'midi_data' in section:
                            print("✅ Usando datos cacheados de la sección")
                            # Usar datos en memoria (base64)
                            midi_data = base64.b64decode(section['midi_data'])
                            
                            # Generar PDF e IMAGEN
                            pdf_bytes = await self._convert_midi_to_pdf_bytes(midi_data)
                            image_bytes = await self._convert_midi_to_image_bytes(midi_data)
                            
                            if pdf_bytes and image_bytes:
                                pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
                                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                                return {
                                    'success': True,
                                    'section_number': section_number,
                                    'sheet_music_id': sheet_music_id,
                                    'pdf_data': pdf_base64,
                                    'image_data': image_base64,
                                    'measures': section.get('measures', 'N/A'),
                                    'message': f'Partitura generada para sección {section_number} desde cache'
                                }
            except Exception as e:
                print(f"⚠️ No se pudo usar metadata cacheada: {e}")
            
            # Fallback: Generar desde MIDI completo
            print("🔄 Usando fallback: generando desde MIDI completo")
            sheet_info = await self._get_sheet_info(sheet_music_id)
            if not sheet_info:
                return {'error': 'Partitura no encontrada'}
            
            midi_url = sheet_info.midi_referencia
            midi_blob_name = self._extract_blob_name(midi_url)
            full_midi_bytes = await self._download_midi_bytes(midi_blob_name)
            
            if not full_midi_bytes:
                return {'error': 'No se pudo descargar el MIDI completo'}
            
            # Dividir y obtener solo la sección específica
            sections = await self._split_into_sections_in_memory(full_midi_bytes, 4)
            
            if section_number > len(sections) or section_number < 1:
                return {'error': f'Sección {section_number} no existe (total: {len(sections)})'}
            
            section_data = sections[section_number - 1]
            pdf_bytes = await self._convert_midi_to_pdf_bytes(section_data['midi_bytes'])
            image_bytes = await self._convert_midi_to_image_bytes(section_data['midi_bytes'])
            
            if not pdf_bytes or not image_bytes:
                return {'error': 'No se pudo generar la partitura'}
            
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            return {
                'success': True,
                'section_number': section_number,
                'sheet_music_id': sheet_music_id,
                'pdf_data': pdf_base64,
                'image_data': image_base64,
                'measures': section_data.get('measures', 'N/A'),
                'message': f'Partitura generada para sección {section_number} desde MIDI completo'
            }
            
        except Exception as e:
            import traceback
            print(f"❌ Error generando partitura de sección: {traceback.format_exc()}")
            return {'error': f'Error generando partitura: {str(e)}'}
    
    async def generate_full_sheet_music(self, sheet_music_id: int) -> Dict[str, Any]:
        """
        Generar partitura PDF completa
        """
        try:
            print(f"🎼 Generando partitura completa para sheet {sheet_music_id}")
            
            # Obtener información de la partitura
            sheet_info = await self._get_sheet_info(sheet_music_id)
            if not sheet_info:
                return {'error': 'Partitura no encontrada'}
            
            # Descargar MIDI completo desde Azure
            midi_url = sheet_info.midi_referencia
            midi_blob_name = self._extract_blob_name(midi_url)
            midi_data = await self._download_midi_bytes(midi_blob_name)
            
            if not midi_data:
                return {'error': 'No se pudo descargar el MIDI completo'}
            
            # Generar PDF
            pdf_bytes = await self._convert_midi_to_pdf_bytes(midi_data)
            
            if not pdf_bytes:
                return {'error': 'No se pudo generar la partitura completa'}
            
            # Convertir a base64 para transferencia
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            return {
                'success': True,
                'sheet_music_id': sheet_music_id,
                'pdf_data': pdf_base64,
                'title': sheet_info.titulo,
                'composer': sheet_info.compositor,
                'message': 'Partitura completa generada'
            }
            
        except Exception as e:
            import traceback
            print(f"❌ Error generando partitura completa: {traceback.format_exc()}")
            return {'error': f'Error generando partitura completa: {str(e)}'}
    
    async def _convert_midi_to_pdf_bytes(self, midi_bytes: bytes) -> Optional[bytes]:
        """Convertir MIDI a PDF bytes usando MuseScore o fallback"""
        try:
            print(f"🔧 Convirtiendo MIDI a PDF ({len(midi_bytes)} bytes)")
            
            with tempfile.NamedTemporaryFile(suffix='.mid', delete=False) as tmp:
                tmp.write(midi_bytes)
                midi_path = tmp.name
            
            print(f"📁 MIDI guardado temporalmente en: {midi_path}")
            
            pdf_path = await self._convert_midi_to_pdf(midi_path)
            
            if not os.path.exists(pdf_path):
                print("❌ No se generó el archivo PDF")
                return None
            
            with open(pdf_path, 'rb') as f:
                pdf_bytes = f.read()
            
            print(f"✅ PDF generado: {len(pdf_bytes)} bytes")
            
            try:
                os.unlink(midi_path)
                os.unlink(pdf_path)
                print("🧹 Archivos temporales limpiados")
            except Exception as e:
                print(f"⚠️ Error limpiando archivos temporales: {e}")
            
            return pdf_bytes
            
        except Exception as e:
            print(f"❌ Error convirtiendo MIDI a PDF: {e}")
            print(f"🔍 Traceback: {traceback.format_exc()}")
            return None
    
    async def _convert_midi_to_image_bytes(self, midi_bytes: bytes) -> Optional[bytes]:
        """Convertir MIDI a imagen PNG usando MuseScore o fallback"""
        try:
            print(f"🖼️ Convirtiendo MIDI a imagen PNG ({len(midi_bytes)} bytes)")
            
            with tempfile.NamedTemporaryFile(suffix='.mid', delete=False) as tmp:
                tmp.write(midi_bytes)
                midi_path = tmp.name
            
            print(f"📁 MIDI guardado temporalmente en: {midi_path}")
            
            image_path = await self._convert_midi_to_png(midi_path)
            
            if not os.path.exists(image_path):
                print("❌ No se generó el archivo PNG")
                return None
            
            with open(image_path, 'rb') as f:
                image_bytes = f.read()
            
            print(f"✅ Imagen PNG generada: {len(image_bytes)} bytes")
            
            try:
                os.unlink(midi_path)
                os.unlink(image_path)
                print("🧹 Archivos temporales limpiados")
            except Exception as e:
                print(f"⚠️ Error limpiando archivos temporales: {e}")
            
            return image_bytes
            
        except Exception as e:
            print(f"❌ Error convirtiendo MIDI a imagen: {e}")
            print(f"🔍 Traceback: {traceback.format_exc()}")
            return None
    
    async def _convert_midi_to_pdf(self, midi_path: str) -> str:
        """Convertir MIDI a PDF usando MuseScore"""
        try:
            pdf_path = midi_path.replace('.mid', '.pdf')
            
            musescore_paths = [
                r'C:\Program Files\MuseScore 4\bin\MuseScore4.exe',
                r'C:\Program Files\MuseScore 3\bin\MuseScore3.exe',
                '/usr/bin/musescore',
                '/usr/local/bin/musescore'
            ]
            
            musescore_path = None
            for path in musescore_paths:
                if os.path.exists(path):
                    musescore_path = path
                    break
            
            if not musescore_path:
                print("⚠️ MuseScore no encontrado, usando music21")
                return await self._generate_basic_pdf(midi_path)
            
            print(f"🎼 Ejecutando MuseScore: {musescore_path}")
            result = subprocess.run(
                [musescore_path, midi_path, '-o', pdf_path],
                capture_output=True,
                timeout=30,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            
            if result.returncode == 0 and os.path.exists(pdf_path):
                print(f"✅ PDF generado con MuseScore: {pdf_path}")
                return pdf_path
            else:
                print(f"⚠️ MuseScore falló (code {result.returncode}), usando PDF básico")
                if result.stderr:
                    print(f"   Error: {result.stderr.decode('utf-8', errors='ignore')}")
                return await self._generate_basic_pdf(midi_path)
                
        except subprocess.TimeoutExpired:
            print("⚠️ MuseScore timeout, usando PDF básico")
            return await self._generate_basic_pdf(midi_path)
        except Exception as e:
            print(f"⚠️ Error con MuseScore: {e}, usando PDF básico")
            return await self._generate_basic_pdf(midi_path)
    
    async def _convert_midi_to_png(self, midi_path: str) -> str:
        """Convertir MIDI a PNG usando MuseScore"""
        try:
            png_base_path = midi_path.replace('.mid', '')
            png_path = f"{png_base_path}-1.png"
            
            musescore_paths = [
                r'C:\Program Files\MuseScore 4\bin\MuseScore4.exe',
                r'C:\Program Files\MuseScore 3\bin\MuseScore3.exe',
                '/usr/bin/musescore',
                '/usr/local/bin/musescore'
            ]
            
            musescore_path = None
            for path in musescore_paths:
                if os.path.exists(path):
                    musescore_path = path
                    break
            
            if not musescore_path:
                print("⚠️ MuseScore no encontrado, usando music21")
                return await self._generate_basic_image(midi_path)
            
            print(f"🎼 Ejecutando MuseScore para PNG: {musescore_path}")
            
            result = subprocess.run(
                [musescore_path, midi_path, '-o', f"{png_base_path}.png", '--force'],
                capture_output=True,
                timeout=30,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            
            print(f"🔍 MuseScore return code: {result.returncode}")
            
            if os.path.exists(png_path):
                print(f"✅ PNG generado con MuseScore: {png_path}")
                return png_path
            
            possible_paths = [
                f"{png_base_path}.png",
                f"{png_base_path}-0.png",
                f"{png_base_path}-01.png"
            ]
            
            for possible_path in possible_paths:
                if os.path.exists(possible_path):
                    print(f"✅ PNG encontrado en: {possible_path}")
                    return possible_path
            
            print(f"⚠️ MuseScore no generó PNG en las rutas esperadas, usando music21")
            return await self._generate_basic_image(midi_path)
                
        except subprocess.TimeoutExpired:
            print("⚠️ MuseScore timeout, usando music21")
            return await self._generate_basic_image(midi_path)
        except Exception as e:
            print(f"⚠️ Error con MuseScore: {e}, usando music21")
            return await self._generate_basic_image(midi_path)
    
    async def _generate_basic_pdf(self, midi_path: str) -> str:
        """Generar PDF básico usando music21 (fallback)"""
        try:
            print("📄 Generando PDF básico con music21...")
            score = converter.parse(midi_path)
            pdf_path = midi_path.replace('.mid', '.pdf')
            score.write('musicxml.pdf', fp=pdf_path)
            print(f"✅ PDF básico generado: {pdf_path}")
            return pdf_path
        except Exception as e:
            print(f"❌ Error generando PDF básico con music21: {e}")
            pdf_path = midi_path.replace('.mid', '.pdf')
            pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>
endobj
4 0 obj
<< /Length 87 >>
stream
BT
/F1 24 Tf
100 700 Td
(Partitura no disponible) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000315 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
452
%%EOF"""
            with open(pdf_path, 'wb') as f:
                f.write(pdf_content)
            print(f"✅ PDF placeholder creado: {pdf_path}")
            return pdf_path
    
    async def _generate_basic_image(self, midi_path: str) -> str:
        """Generar imagen PNG usando music21 (fallback)"""
        try:
            print("🖼️ Generando imagen PNG con music21...")
            
            score = converter.parse(midi_path)
            png_path = midi_path.replace('.mid', '.png')
            
            try:
                from music21 import lily
                score.write('lily.png', fp=png_path)
                
                png_path_1 = midi_path.replace('.mid', '-1.png')
                if os.path.exists(png_path_1):
                    print(f"✅ Imagen PNG generada con Lilypond: {png_path_1}")
                    return png_path_1
                elif os.path.exists(png_path):
                    print(f"✅ Imagen PNG generada con Lilypond: {png_path}")
                    return png_path
                else:
                    raise Exception("Lilypond no generó archivo PNG")
                    
            except Exception as lily_error:
                print(f"⚠️ Lilypond no disponible ({lily_error}), generando con Pillow...")
                
                from PIL import Image, ImageDraw, ImageFont
                
                width, height = 1200, 400
                img = Image.new('RGB', (width, height), color='white')
                draw = ImageDraw.Draw(img)
                
                try:
                    title_font = ImageFont.truetype("arial.ttf", 18)
                    note_font = ImageFont.truetype("arial.ttf", 14)
                except:
                    title_font = ImageFont.load_default()
                    note_font = ImageFont.load_default()
                
                draw.text((50, 20), "Partitura - Vista Simplificada", fill='black', font=title_font)
                
                staff_start_y = 80
                line_spacing = 15
                staff_start_x = 80
                staff_end_x = width - 80
                
                for i in range(5):
                    y = staff_start_y + (i * line_spacing)
                    draw.line([(staff_start_x, y), (staff_end_x, y)], fill='black', width=2)
                
                draw.text((staff_start_x + 10, staff_start_y - 10), "𝄞", fill='black', 
                         font=ImageFont.truetype("seguisym.ttf", 60) if os.name == 'nt' else note_font)
                
                notes = []
                try:
                    flat_score = score.flatten()
                    for element in flat_score.notesAndRests:
                        if hasattr(element, 'pitch'):
                            notes.append(element)
                        elif element.isRest:
                            notes.append(element)
                except:
                    for part in score.parts:
                        for measure in part.getElementsByClass('Measure'):
                            for element in measure.notesAndRests:
                                notes.append(element)
                
                x_pos = staff_start_x + 100
                note_spacing = 40
                max_notes = min(20, len(notes))
                
                for i, note in enumerate(notes[:max_notes]):
                    if hasattr(note, 'pitch'):
                        midi_num = note.pitch.midi
                        relative_pos = (72 - midi_num) * 3
                        y_pos = staff_start_y + 30 + relative_pos
                        y_pos = max(staff_start_y - 20, min(y_pos, staff_start_y + 80))
                        
                        note_width = 12
                        note_height = 8
                        draw.ellipse(
                            [x_pos - note_width//2, y_pos - note_height//2, 
                             x_pos + note_width//2, y_pos + note_height//2],
                            fill='black'
                        )
                        
                        if y_pos < staff_start_y + 30:
                            draw.line([(x_pos - note_width//2, y_pos), 
                                      (x_pos - note_width//2, y_pos + 35)], 
                                     fill='black', width=2)
                        else:
                            draw.line([(x_pos + note_width//2, y_pos), 
                                      (x_pos + note_width//2, y_pos - 35)], 
                                     fill='black', width=2)
                    else:
                        draw.text((x_pos - 5, staff_start_y + 20), "𝄽", fill='black', font=note_font)
                    
                    x_pos += note_spacing
                
                info_text = f"Notas en la sección: {len(notes)}"
                draw.text((50, height - 40), info_text, fill='#666', font=note_font)
                
                img.save(png_path, 'PNG', quality=95, optimize=True)
                print(f"✅ Imagen PNG generada con Pillow: {png_path}")
                
                return png_path
            
        except Exception as e:
            print(f"❌ Error generando imagen con music21: {e}")
            print(f"🔍 Traceback: {traceback.format_exc()}")
            
            png_path = midi_path.replace('.mid', '.png')
            
            try:
                from PIL import Image, ImageDraw, ImageFont
                
                img = Image.new('RGB', (800, 300), color='white')
                draw = ImageDraw.Draw(img)
                
                draw.rectangle([(10, 10), (790, 290)], outline='black', width=3)
                
                try:
                    font = ImageFont.truetype("arial.ttf", 24)
                except:
                    font = ImageFont.load_default()
                
                draw.text((150, 130), "⚠️ Partitura no disponible", fill='#c0392b', font=font)
                draw.text((200, 170), "Sección del MIDI", fill='#7f8c8d', font=font)
                
                img.save(png_path, 'PNG')
                print(f"✅ Imagen placeholder creada: {png_path}")
                
            except:
                png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\r\xa2\x00\x00\x00\x00IEND\xaeB`\x82'
                
                with open(png_path, 'wb') as f:
                    f.write(png_data)
                
                print(f"✅ PNG mínimo creado: {png_path}")
            
            return png_path
    
    # ============================================
    # FUNCIONES AUXILIARES
    # ============================================
    
    async def _get_sheet_info(self, sheet_music_id: int) -> Optional[Any]:
        """Obtiene información de la partitura desde la base de datos"""
        db = None
        try:
            print(f"🔍 DEBUG [_get_sheet_info]: Buscando partitura con ID: {sheet_music_id}")
            
            from core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            
            table_names = ['partitura', 'sheet_music']
            
            result = None
            found_table = None
            
            for table_name in table_names:
                try:
                    columns_result = db.execute(text(f"""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = '{table_name}'
                    """)).fetchall()
                    
                    available_columns = [col[0] for col in columns_result]
                    
                    id_column = None
                    if table_name == 'partitura':
                        if 'id_partitura' in available_columns:
                            id_column = 'id_partitura'
                    else:
                        if 'id' in available_columns:
                            id_column = 'id'
                        elif 'sheet_id' in available_columns:
                            id_column = 'sheet_id'
                    
                    if not id_column:
                        continue
                    
                    query = text(f"SELECT * FROM {table_name} WHERE {id_column} = :sheet_id")
                    result = db.execute(query, {"sheet_id": sheet_music_id}).fetchone()
                    
                    if result:
                        found_table = table_name
                        break
                        
                except Exception as e:
                    db.rollback()
                    continue
            
            if not result:
                if db:
                    db.close()
                return None
            
            sheet_data = {}
            
            if hasattr(result, '_mapping'):
                for col in result._mapping.keys():
                    sheet_data[col] = result._mapping[col]
            else:
                columns = result.keys()
                for i, col in enumerate(columns):
                    sheet_data[col] = result[i]
            
            if 'id_partitura' in sheet_data:
                sheet_data['id'] = sheet_data['id_partitura']
            
            if 'titulo' not in sheet_data and 'title' in sheet_data:
                sheet_data['titulo'] = sheet_data['title']
                
            if 'compositor' not in sheet_data and 'composer' in sheet_data:
                sheet_data['compositor'] = sheet_data['composer']
            
            sheet = type('Sheet', (), sheet_data)()
            
            if db:
                db.close()
            
            return sheet
            
        except Exception as e:
            print(f"❌ DEBUG [_get_sheet_info]: ERROR - {traceback.format_exc()}")
            if db:
                db.rollback()
                db.close()
            return None
    
    def _extract_blob_name(self, file_url: str) -> Optional[str]:
        """Extrae el nombre del blob desde la URL completa"""
        try:
            if not file_url:
                return None
            
            container_name = self.azure_storage.container_name
            
            if container_name in file_url:
                parts = file_url.split(container_name + '/')
                if len(parts) > 1:
                    return parts[1]
            
            return file_url.split('/')[-1]
            
        except Exception as e:
            logger.error(f"Error extracting blob name: {e}")
            return None
    
    async def _download_midi_bytes(self, blob_name: str) -> Optional[bytes]:
        """Descarga el MIDI desde Azure Storage como bytes"""
        try:
            if hasattr(self.azure_storage, 'file_exists'):
                if not self.azure_storage.file_exists(blob_name):
                    return None
            
            if hasattr(self.azure_storage, 'download_file'):
                temp_path = os.path.join(tempfile.gettempdir(), f"temp_midi_{hash(blob_name)}.mid")
                
                success = self.azure_storage.download_file(blob_name, temp_path)
                
                if success and os.path.exists(temp_path):
                    with open(temp_path, 'rb') as f:
                        midi_bytes = f.read()
                    os.unlink(temp_path)
                    return midi_bytes
            
            return None
            
        except Exception as e:
            print(f"❌ DEBUG [_download_midi_bytes]: ERROR - {traceback.format_exc()}")
            return None
    
    async def _split_into_sections_in_memory(self, midi_bytes: bytes, measures_per_section: int) -> List[Dict[str, Any]]:
        """Divide el MIDI en secciones basadas en compases EN MEMORIA"""
        try:
            with tempfile.NamedTemporaryFile(suffix='.mid', delete=False) as tmp:
                tmp.write(midi_bytes)
                midi_path = tmp.name
            
            score = converter.parse(midi_path)
            
            measures = []
            for part in score.parts:
                part_measures = list(part.getElementsByClass('Measure'))
                if part_measures:
                    measures = part_measures
                    break
            
            if not measures:
                raise ValueError("No se detectaron compases en el MIDI")
            
            sections = []
            total_measures = len(measures)
            
            for start_idx in range(0, total_measures, measures_per_section):
                end_idx = min(start_idx + measures_per_section, total_measures)
                section_number = len(sections) + 1
                
                section_score = stream.Score()
                
                for part in score.parts:
                    new_part = stream.Part()
                    part_measures = list(part.getElementsByClass('Measure'))
                    
                    for i in range(start_idx, end_idx):
                        if i < len(part_measures):
                            new_part.append(part_measures[i])
                    
                    if len(new_part) > 0:
                        section_score.append(new_part)
                
                with tempfile.NamedTemporaryFile(suffix='.mid', delete=False) as tmp:
                    section_score.write('midi', fp=tmp.name)
                    section_path = tmp.name
                
                with open(section_path, 'rb') as f:
                    section_bytes = f.read()
                
                duration = section_score.duration.quarterLength
                
                sections.append({
                    'section_number': section_number,
                    'start_measure': start_idx + 1,
                    'end_measure': end_idx,
                    'measures': f"{start_idx + 1}-{end_idx}",
                    'duration': duration,
                    'midi_bytes': section_bytes
                })
                
                os.unlink(section_path)
            
            os.unlink(midi_path)
            return sections
            
        except Exception as e:
            logger.error(f"Error splitting MIDI by measures: {e}")
            raise
    
    async def _split_into_sections_by_time_in_memory(self, midi_bytes: bytes, section_duration: float = 30.0) -> List[Dict[str, Any]]:
        """Divide el MIDI en secciones por tiempo EN MEMORIA (fallback)"""
        try:
            midi_data = pretty_midi.PrettyMIDI(io.BytesIO(midi_bytes))
            total_duration = midi_data.get_end_time()
            
            sections = []
            section_number = 1
            
            for start_time in np.arange(0, total_duration, section_duration):
                end_time = min(start_time + section_duration, total_duration)
                
                section_midi = pretty_midi.PrettyMIDI()
                
                for instrument in midi_data.instruments:
                    new_instrument = pretty_midi.Instrument(
                        program=instrument.program,
                        is_drum=instrument.is_drum,
                        name=instrument.name
                    )
                    
                    for note in instrument.notes:
                        if start_time <= note.start < end_time:
                            adjusted_note = pretty_midi.Note(
                                velocity=note.velocity,
                                pitch=note.pitch,
                                start=note.start - start_time,
                                end=min(note.end, end_time) - start_time
                            )
                            new_instrument.notes.append(adjusted_note)
                    
                    if new_instrument.notes:
                        section_midi.instruments.append(new_instrument)
                
                with tempfile.NamedTemporaryFile(suffix='.mid', delete=False) as tmp:
                    section_midi.write(tmp.name)
                    section_path = tmp.name
                
                with open(section_path, 'rb') as f:
                    section_bytes = f.read()
                
                sections.append({
                    'section_number': section_number,
                    'start_time': start_time,
                    'end_time': end_time,
                    'duration': end_time - start_time,
                    'midi_bytes': section_bytes
                })
                
                os.unlink(section_path)
                section_number += 1
            
            return sections
            
        except Exception as e:
            logger.error(f"Error splitting MIDI by time: {e}")
            raise
    
    async def _process_section_in_memory(self, section_data: Dict[str, Any], sheet_music_id: int, section_number: int) -> Dict[str, Any]:
        """Procesa una sección EN MEMORIA - INCLUYE GENERACIÓN DE AUDIO"""
        try:
            midi_bytes = section_data['midi_bytes']
            
            # Convertir MIDI a base64 para almacenamiento en metadata
            midi_base64 = base64.b64encode(midi_bytes).decode('utf-8')
            
            # Analizar MIDI con pretty_midi
            midi_data = pretty_midi.PrettyMIDI(io.BytesIO(midi_bytes))
            
            # Extraer información básica
            note_count = sum(len(inst.notes) for inst in midi_data.instruments)
            duration = midi_data.get_end_time()
            
            # ✅ GENERAR AUDIO WAV desde el MIDI
            audio_base64 = None
            try:
                print(f"🎵 Generando audio para sección {section_number}...")
                
                # Sintetizar audio desde MIDI usando fluidsynth
                audio_data = midi_data.fluidsynth(fs=44100)
                
                # Normalizar audio
                if len(audio_data) > 0:
                    max_val = np.max(np.abs(audio_data))
                    if max_val > 0:
                        audio_data = np.int16(audio_data / max_val * 32767)
                    else:
                        audio_data = np.int16(audio_data * 32767)
                else:
                    print(f"⚠️ Audio vacío para sección {section_number}")
                    audio_data = np.zeros(44100, dtype=np.int16)  # 1 segundo de silencio
                
                # Convertir a bytes WAV
                with io.BytesIO() as wav_buffer:
                    wavfile.write(wav_buffer, 44100, audio_data)
                    wav_bytes = wav_buffer.getvalue()
                
                # Convertir a base64
                audio_base64 = base64.b64encode(wav_bytes).decode('utf-8')
                
                print(f"✅ Audio generado para sección {section_number}: {len(wav_bytes)} bytes")
                logger.info(f"✅ Audio generado para sección {section_number}: {len(wav_bytes)} bytes")
                
            except Exception as audio_error:
                print(f"⚠️ No se pudo generar audio para sección {section_number}: {audio_error}")
                logger.warning(f"⚠️ No se pudo generar audio para sección {section_number}: {audio_error}")
                # Continuar sin audio, no es crítico
            
            return {
                'section_number': section_number,
                'measures': section_data.get('measures', f"Section {section_number}"),
                'duration': round(duration, 2),
                'note_count': note_count,
                'midi_data': midi_base64,
                'audio_data': audio_base64,  # ✅ AGREGAR AUDIO
                'start_measure': section_data.get('start_measure'),
                'end_measure': section_data.get('end_measure'),
                'start_time': section_data.get('start_time', 0),
                'end_time': section_data.get('end_time', duration)
            }
            
        except Exception as e:
            logger.error(f"Error processing section {section_number}: {e}")
            print(f"❌ Error processing section {section_number}: {e}")
            return {
                'section_number': section_number,
                'error': str(e)
            }
    
    def _generate_feedback(self, accuracy: float) -> str:
        """Genera feedback basado en la precisión"""
        if accuracy >= 90:
            return "¡Excelente interpretación! Continúa practicando para mantener este nivel."
        elif accuracy >= 75:
            return "Buen trabajo. Algunos detalles por mejorar en la precisión de las notas."
        elif accuracy >= 60:
            return "Sigue practicando. Enfócate en la precisión de las notas y el ritmo."
        else:
            return "Necesitas más práctica. Intenta tocar más lento y enfócate en la precisión."