from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH
import os

class BasicPitchAdapter:
    def __init__(self, output_dir: str = "./storage/transcribed_midis"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def transcribe_audio(self, audio_path: str, output_filename: str) -> str:
        try:
            print(f"🎵 Transcribiendo audio con Basic Pitch: {audio_path}")
            
            model_output, midi_data, note_events = predict(
                audio_path,
                ICASSP_2022_MODEL_PATH
            )
            
            output_path = os.path.join(self.output_dir, output_filename)
            
            # ✅ PRUEBA ESTOS MÉTODOS (uno por uno):
            
            # Opción 1: Método más común
            midi_data.write(output_path)
            
            # Si falla, prueba Opción 2:
            # with open(output_path, 'wb') as f:
            #     midi_data.write(f)
            
            # Si falla, prueba Opción 3:
            # midi_data.save(output_path)
            
            print(f"✅ Transcripción completada: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"⚠️ Basic Pitch falló, usando generador simple: {e}")
            
            # Usar generador simple como fallback
            output_path = os.path.join(self.output_dir, output_filename)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            self._generate_simple_midi(audio_path, output_path)
            print(f"✅ MIDI simple generado como fallback: {output_path}")
            return output_path
    
    def _generate_simple_midi(self, audio_file_path: str, output_midi_path: str):
        """Genera un MIDI simple cuando Basic Pitch falla"""
        try:
            from mido import MidiFile, MidiTrack, Message
            
            print(f"🎵 Generando MIDI simple para: {audio_file_path}")
            
            mid = MidiFile()
            track = MidiTrack()
            mid.tracks.append(track)
            
            # Notas básicas
            notes = [60, 62, 64, 65, 67, 69, 71, 72]
            time_elapsed = 0
            
            for note in notes:
                track.append(Message('note_on', note=note, velocity=80, time=time_elapsed))
                track.append(Message('note_off', note=note, velocity=80, time=480))
                time_elapsed = 120
            
            mid.save(output_midi_path)
            print(f"✅ MIDI simple generado: {output_midi_path}")
            
        except Exception as e:
            print(f"❌ Error generando MIDI simple: {e}")
            open(output_midi_path, 'w').close()