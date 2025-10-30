from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime

@dataclass
class TimingError:
    note: str
    expected_time: float
    actual_time: float
    error: float

@dataclass
class PitchError:
    expected: str
    actual: str
    time: float

@dataclass
class PerformanceAnalysis:
    id: Optional[int]
    session_id: int
    user_id: int
    sheet_music_id: int
    correct_notes: int
    wrong_notes: int
    missed_notes: int
    extra_notes: int
    total_expected: int
    accuracy: float
    timing_errors: List[TimingError]
    pitch_errors: List[PitchError]
    transcribed_midi_path: str
    created_at: datetime
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'user_id': self.user_id,
            'sheet_music_id': self.sheet_music_id,
            'correct_notes': self.correct_notes,
            'wrong_notes': self.wrong_notes,
            'missed_notes': self.missed_notes,
            'extra_notes': self.extra_notes,
            'total_expected': self.total_expected,
            'accuracy': self.accuracy,
            'timing_errors': [
                {
                    'note': e.note,
                    'expected_time': e.expected_time,
                    'actual_time': e.actual_time,
                    'error': e.error
                } for e in self.timing_errors
            ],
            'pitch_errors': [
                {
                    'expected': e.expected,
                    'actual': e.actual,
                    'time': e.time
                } for e in self.pitch_errors
            ],
            'transcribed_midi_path': self.transcribed_midi_path,
            'created_at': self.created_at.isoformat()
        }