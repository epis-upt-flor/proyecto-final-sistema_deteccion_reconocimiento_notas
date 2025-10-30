import tempfile
import os
from mido import MidiFile, MidiTrack, Message
import random

def simple_midi_generator(audio_file_path: str, output_midi_path: str):
    """
    Genera un MIDI simple para testing mientras solucionamos Basic Pitch
    Esto simula una transcripción básica con algunas notas
    """
    print(f"🎵 Generando MIDI simple para: {audio_file_path}")
    
    # Crear un MIDI simple
    mid = MidiFile()
    track = MidiTrack()
    mid.tracks.append(track)
    
    # Agregar algunas notas básicas (escala de Do mayor)
    notes = [60, 62, 64, 65, 67, 69, 71, 72]  # Do4 a Do5
    time_elapsed = 0
    
    for i, note in enumerate(notes):
        # Nota ON
        track.append(Message('note_on', note=note, velocity=80, time=time_elapsed))
        # Nota OFF después de 480 ticks (medio segundo)
        track.append(Message('note_off', note=note, velocity=80, time=480))
        
        # Pequeña pausa entre notas
        time_elapsed = 120  # 120 ticks de pausa
    
    # Guardar el MIDI
    mid.save(output_midi_path)
    print(f"✅ MIDI simple generado: {output_midi_path} ({len(mid.tracks[0])} eventos)")
    return output_midi_path