from datetime import datetime
import tempfile
import os
from modules.practice_session.domain.entities.practice_session import PracticeSession
from modules.practice_session.domain.entities.evaluation import Evaluation
from modules.practice_session.domain.entities.sheet_music import SheetMusic
from modules.practice_session.infrastructure.adapters.basic_pitch_adapter import BasicPitchAdapter
from modules.practice_session.infrastructure.adapters.midi_comparator_adapter import MIDIComparatorAdapter
from modules.practice_session.infrastructure.repositories.sheet_music_repository import SheetMusicRepository
from modules.practice_session.infrastructure.repositories.practice_session_repository import PracticeSessionRepository
from modules.practice_session.infrastructure.repositories.evaluation_repository import EvaluationRepository
from core.azure_storage import AzureStorageService

class AnalyzeWithUploadUseCase:
    def __init__(
        self, 
        sheet_music_repo: SheetMusicRepository,
        session_repo: PracticeSessionRepository,
        evaluation_repo: EvaluationRepository
    ):
        self.basic_pitch = BasicPitchAdapter()
        self.midi_comparator = MIDIComparatorAdapter()
        self.azure_storage = AzureStorageService()
        self.sheet_music_repo = sheet_music_repo
        self.session_repo = session_repo
        self.evaluation_repo = evaluation_repo
    
    def execute(
        self,
        user_id: int,
        audio_file_data: bytes,
        audio_filename: str,
        midi_file_data: bytes,
        midi_filename: str,
        titulo: str,
        compositor: str,
        imagen_file_data: bytes = None,
        imagen_filename: str = None
    ) -> dict:
        
        fecha_inicio = datetime.now()
        
        # 1. Subir MIDI de referencia a Azure Blob
        midi_url = self.azure_storage.upload_file(
            midi_file_data,
            midi_filename,
            folder="midis"
        )
        
        # 2. Subir imagen (opcional)
        imagen_url = None
        if imagen_file_data and imagen_filename:
            imagen_url = self.azure_storage.upload_file(
                imagen_file_data,
                imagen_filename,
                folder="images"
            )
        
        # 3. Guardar partitura en BD
        sheet_music = SheetMusic(
            id_partitura=None,
            titulo=titulo,
            compositor=compositor,
            archivo_imagen=imagen_url,
            midi_referencia=midi_url,
            fecha_registro=datetime.now(),
            id_usuario=user_id,
            favorito=False
        )
        saved_sheet = self.sheet_music_repo.save(sheet_music)
        
        # 4. Subir audio a Azure Blob
        audio_url = self.azure_storage.upload_file(
            audio_file_data,
            audio_filename,
            folder="audio_sessions"
        )
        
        # 5. Crear archivos temporales para procesamiento
        midi_temp = tempfile.NamedTemporaryFile(delete=False, suffix='.mid')
        midi_temp.write(midi_file_data)
        midi_temp.close()
        
        audio_temp = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        audio_temp.write(audio_file_data)
        audio_temp.close()
        
        # 6. Transcribir con Basic Pitch
        transcribed_midi_path = self.basic_pitch.transcribe_audio(
            audio_temp.name,
            f"transcribed_{user_id}_{datetime.now().timestamp()}.mid"
        )
        
        # 7. Subir MIDI transcrito a Azure
        with open(transcribed_midi_path, 'rb') as f:
            transcribed_midi_url = self.azure_storage.upload_file(
                f.read(),
                f"transcribed_{user_id}_{datetime.now().timestamp()}.mid",
                folder="transcribed_midis"
            )
        
        # 8. Comparar MIDIs
        comparison_results = self.midi_comparator.compare(
            midi_temp.name,
            transcribed_midi_path
        )
        
        fecha_fin = datetime.now()
        duracion_segundos = (fecha_fin - fecha_inicio).total_seconds()
        duracion_minutos = int(duracion_segundos / 60)
        
        # 9. Guardar sesión de práctica
        practice_session = PracticeSession(
            id_sesion=None,
            id_usuario=user_id,
            id_partitura=saved_sheet.id_partitura,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            archivo_audio=audio_url,
            midi_interpretacion=transcribed_midi_url
        )
        saved_session = self.session_repo.save(practice_session)
        
        # 10. Calcular métricas adicionales
        # Precision de ritmo basado en timing errors
        total_timing_errors = len(comparison_results['timing_errors'])
        precision_ritmo = 100.0
        if comparison_results['total_expected'] > 0:
            precision_ritmo = max(0, 100 - (total_timing_errors / comparison_results['total_expected'] * 100))
        
        # Desviación promedio de timing en ms
        desviacion_tiempo_ms = 0.0
        if total_timing_errors > 0:
            desviacion_tiempo_ms = sum(abs(e.error * 1000) for e in comparison_results['timing_errors']) / total_timing_errors
        
        # F1 Score
        precision = comparison_results['correct_notes'] / max(1, comparison_results['correct_notes'] + comparison_results['wrong_notes'])
        recall = comparison_results['correct_notes'] / max(1, comparison_results['total_expected'])
        f1_score = 2 * (precision * recall) / max(0.001, precision + recall)
        
        # Generar feedback textual
        feedback = self._generate_feedback(comparison_results)
        
        # 11. Guardar evaluación
        evaluation = Evaluation(
            id_evaluacion=None,
            id_sesion=saved_session.id_sesion,
            precision_notas=comparison_results['accuracy'],
            precision_ritmo=precision_ritmo,
            f1_score=f1_score * 100,
            desviacion_tiempo_ms=desviacion_tiempo_ms,
            feedback=feedback,
            fecha_eval=datetime.now(),
            notas_correctas=comparison_results['correct_notes'],
            notas_incorrectas=comparison_results['wrong_notes'],
            notas_omitidas=comparison_results['missed_notes'],
            notas_extra=comparison_results['extra_notes'],
            total_notas_esperadas=comparison_results['total_expected'],
            accuracy_percentage=comparison_results['accuracy'],
            duracion_minutos=duracion_minutos
        )
        saved_evaluation = self.evaluation_repo.save(evaluation)
        
        # Limpiar temporales
        os.unlink(midi_temp.name)
        os.unlink(audio_temp.name)
        
        return {
            'session': saved_session.to_dict(),
            'evaluation': saved_evaluation.to_dict(),
            'sheet_music': saved_sheet.to_dict(),
            'analysis': {
                'correct_notes': comparison_results['correct_notes'],
                'wrong_notes': comparison_results['wrong_notes'],
                'missed_notes': comparison_results['missed_notes'],
                'extra_notes': comparison_results['extra_notes'],
                'total_expected': comparison_results['total_expected'],
                'accuracy': comparison_results['accuracy'],
                'timing_errors': [
                    {
                        'note': e.note,
                        'expected_time': e.expected_time,
                        'actual_time': e.actual_time,
                        'error': e.error
                    } for e in comparison_results['timing_errors']
                ],
                'pitch_errors': [
                    {
                        'expected': e.expected,
                        'actual': e.actual,
                        'time': e.time
                    } for e in comparison_results['pitch_errors']
                ]
            }
        }
    
    def _generate_feedback(self, comparison_results) -> str:
        feedback_parts = []
        
        feedback_parts.append(f"Resumen: {comparison_results['correct_notes']}/{comparison_results['total_expected']} notas correctas")
        
        if comparison_results['pitch_errors']:
            feedback_parts.append(f"\nErrores de notas: {len(comparison_results['pitch_errors'])} detectados")
            for error in comparison_results['pitch_errors'][:3]:
                feedback_parts.append(f"- En {error.time:.1f}s: tocaste {error.actual} en lugar de {error.expected}")
        
        if comparison_results['timing_errors']:
            early = [e for e in comparison_results['timing_errors'] if e.error < 0]
            late = [e for e in comparison_results['timing_errors'] if e.error > 0]
            feedback_parts.append(f"\nTiming: {len(early)} notas adelantadas, {len(late)} notas atrasadas")
        
        return "\n".join(feedback_parts)