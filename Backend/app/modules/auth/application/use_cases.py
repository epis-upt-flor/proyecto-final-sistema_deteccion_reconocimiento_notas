from typing import Optional, Tuple
import uuid
from datetime import datetime

from ..domain.entities import UserAuth
from ..domain.repositories import AuthRepository

class RegisterUserUseCase:
    def __init__(self, auth_repo: AuthRepository):
        self.auth_repo = auth_repo

    def execute(self, username: str, email: str, password_hash: str, nombre: str, 
                apellido: str, fecha_nacimiento: datetime) -> Tuple[Optional[UserAuth], Optional[str]]:
        
        if self.auth_repo.username_exists(username):
            return None, "El nombre de usuario ya está en uso"
        
        if self.auth_repo.email_exists(email):
            return None, "El email ya está registrado"

        user_auth = UserAuth(
            user_id=0,  
            username=username,
            email=email,
            password_hash=password_hash,
            nombre=nombre,
            apellido=apellido,
            fecha_nacimiento=fecha_nacimiento,
            verification_token=str(uuid.uuid4())
        )
        
        try:
            created_user = self.auth_repo.create(user_auth)
            return created_user, None
        except ValueError as e:
            return None, str(e)

class AuthenticateUserUseCase:
    def __init__(self, auth_repo: AuthRepository):
        self.auth_repo = auth_repo

    def execute(self, username: str, password: str, password_verifier) -> Tuple[Optional[UserAuth], Optional[str]]:
        user_auth = self.auth_repo.get_by_username(username)
        if not user_auth:
            return None, "Credenciales inválidas"
        
        if not user_auth.is_active:
            return None, "Cuenta desactivada"
        
        if not user_auth.verify_password(password, password_verifier):
            return None, "Credenciales inválidas"
        
        # Actualizar último login
        user_auth.last_login = datetime.now()
        self.auth_repo.update(user_auth)
        
        return user_auth, None

class GetUserUseCase:
    def __init__(self, auth_repo: AuthRepository):
        self.auth_repo = auth_repo

    def execute(self, user_id: int) -> Optional[UserAuth]:
        return self.auth_repo.get_by_id(user_id)