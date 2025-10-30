from ...domain.repositories import SheetConverterInterface

class ImageToMidiConverter(SheetConverterInterface):
    def can_convert(self, file_type: str) -> bool:
        return file_type in ["jpeg", "jpg", "png"]

    def convert_to_midi(self, file_data: bytes, file_type: str) -> bytes:
        # TODO: Implementar conversión real con IA
        # Por ahora retornar MIDI dummy
        raise NotImplementedError("Conversión de imagen a MIDI será implementada con IA")