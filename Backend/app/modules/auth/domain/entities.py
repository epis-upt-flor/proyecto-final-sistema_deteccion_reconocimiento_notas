from datetime import datetime
from typing import Optional

class UserAuth:
    def __init__(
        self,
        user_id: int,
        username: str,
        email: str,
        password_hash: str,
        nombre: str,
        apellido: Optional[str] = None,
        fecha_nacimiento: datetime = None,
        rol: str = "estudiante",
        is_active: bool = True,
        email_verified: bool = False,
        verification_token: Optional[str] = None,
        reset_token: Optional[str] = None,
        reset_token_expiry: Optional[datetime] = None,
        last_login: Optional[datetime] = None,
        fecha_registro: Optional[datetime] = None
    ):
        self.user_id = user_id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.nombre = nombre
        self.apellido = apellido
        self.fecha_nacimiento = fecha_nacimiento
        self.rol = rol
        self.is_active = is_active
        self.email_verified = email_verified
        self.verification_token = verification_token
        self.reset_token = reset_token
        self.reset_token_expiry = reset_token_expiry
        self.last_login = last_login
        self.fecha_registro = fecha_registro

    def verify_password(self, password: str, password_verifier) -> bool:
        return password_verifier(password, self.password_hash)
    
    def can_authenticate(self) -> bool:
        return self.is_active and self.email_verified
