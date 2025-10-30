from datetime import datetime
from modules.practice_session.domain.entities.performance_analysis import PerformanceAnalysis
from modules.practice_session.infrastructure.adapters.basic_pitch_adapter import BasicPitchAdapter
from modules.practice_session.infrastructure.adapters.midi_comparator_adapter import MIDIComparatorAdapter

class AnalyzePerformanceUseCase:
    def __init__(self):
        self.basic_pitch = BasicPitchAdapter()
        self.midi_comparator = MIDIComparatorAdapter()
    
    def execute(
        self,
        session_id: int,
        user_id: int,
        sheet_music_id: int,
        audio_path: str,
        reference_midi_path: str
    ) -> PerformanceAnalysis:
        
        # Transcribir audio
        transcribed_midi_path = self.basic_pitch.transcribe_audio(
            audio_path,
            f"session_{session_id}_{datetime.now().timestamp()}.mid"
        )
        
        # Comparar
        comparison_results = self.midi_comparator.compare(
            reference_midi_path,
            transcribed_midi_path
        )
        
        # Crear análisis
        analysis = PerformanceAnalysis(
            id=None,
            session_id=session_id,
            user_id=user_id,
            sheet_music_id=sheet_music_id,
            correct_notes=comparison_results['correct_notes'],
            wrong_notes=comparison_results['wrong_notes'],
            missed_notes=comparison_results['missed_notes'],
            extra_notes=comparison_results['extra_notes'],
            total_expected=comparison_results['total_expected'],
            accuracy=comparison_results['accuracy'],
            timing_errors=comparison_results['timing_errors'],
            pitch_errors=comparison_results['pitch_errors'],
            transcribed_midi_path=transcribed_midi_path,
            created_at=datetime.now()
        )
        
        return analysis