# practice_session_controller.py
from fastapi import APIRouter, WebSocket
import numpy as np
import soundfile as sf
import io
import asyncio

from modules.practice_session.infrastructure.piano_recognition_service import PianoRecognitionService

router = APIRouter(prefix="/practice-session", tags=["Practice Session"])
recognition_service = PianoRecognitionService()

@router.websocket("/ws/recognize")
async def websocket_recognize(websocket: WebSocket):
    await websocket.accept()
    
    # Limpiar buffer al iniciar conexión
    recognition_service.clear_buffer()
    
    try:
        while True:
            # Recibir chunk de audio
            audio_bytes = await websocket.receive_bytes()
            
            try:
                # Convertir bytes a audio
                audio_data, sr = sf.read(io.BytesIO(audio_bytes))
                
                # Procesar y predecir
                note, confidence = recognition_service.predict(audio_data, sr)
                
                # Enviar resultado
                await websocket.send_json({
                    "note": note, 
                    "confidence": confidence,
                    "buffer_size": len(recognition_service.audio_buffer)
                })
                
            except Exception as e:
                print(f"Error procesando audio: {e}")
                await websocket.send_json({
                    "note": "Error", 
                    "confidence": 0.0,
                    "error": str(e)
                })
                
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        recognition_service.clear_buffer()
        await websocket.close()

# Endpoint adicional para limpiar buffer manualmente
@router.post("/clear-buffer")
async def clear_buffer():
    recognition_service.clear_buffer()
    return {"message": "Buffer cleared"}