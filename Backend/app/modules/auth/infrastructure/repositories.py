from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
import uuid
from datetime import datetime, timedelta

from .models import UserModel
from ..domain.entities import UserAuth
from ..domain.repositories import AuthRepository

class AuthRepositoryImpl(AuthRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, model: UserModel) -> UserAuth:
        return UserAuth(
            user_id=model.id_usuario,
            username=model.username,
            email=model.email,
            password_hash=model.password_hash,
            nombre=model.nombre,
            apellido=model.apellido,
            fecha_nacimiento=model.fecha_nacimiento,
            rol=model.rol,
            is_active=model.is_active,
            email_verified=model.email_verified,
            verification_token=model.verification_token,
            reset_token=model.reset_token,
            reset_token_expiry=model.reset_token_expiry,
            last_login=model.last_login,
            fecha_registro=model.fecha_registro
        )

    def get_by_username(self, username: str) -> Optional[UserAuth]:
        model = self.db.query(UserModel).filter(UserModel.username == username).first()
        return self._to_entity(model) if model else None

    def get_by_email(self, email: str) -> Optional[UserAuth]:
        model = self.db.query(UserModel).filter(UserModel.email == email).first()
        return self._to_entity(model) if model else None

    def get_by_id(self, user_id: int) -> Optional[UserAuth]:
        model = self.db.query(UserModel).filter(UserModel.id_usuario == user_id).first()
        return self._to_entity(model) if model else None

    def create(self, user_auth: UserAuth) -> UserAuth:
        try:
            model = UserModel(
                username=user_auth.username,
                email=user_auth.email,
                password_hash=user_auth.password_hash,
                nombre=user_auth.nombre,
                apellido=user_auth.apellido,
                fecha_nacimiento=user_auth.fecha_nacimiento,
                rol=user_auth.rol,
                is_active=user_auth.is_active,
                email_verified=user_auth.email_verified,
                verification_token=user_auth.verification_token
            )
            
            self.db.add(model)
            self.db.commit()
            self.db.refresh(model)
            return self._to_entity(model)
            
        except IntegrityError:
            self.db.rollback()
            raise ValueError("Error de integridad en la base de datos")

    def update(self, user_auth: UserAuth) -> UserAuth:
        model = self.db.query(UserModel).filter(UserModel.id_usuario == user_auth.user_id).first()
        if model:
            model.last_login = user_auth.last_login
            model.reset_token = user_auth.reset_token
            model.reset_token_expiry = user_auth.reset_token_expiry
            model.email_verified = user_auth.email_verified
            self.db.commit()
            return self._to_entity(model)
        return None

    def username_exists(self, username: str) -> bool:
        return self.db.query(UserModel).filter(UserModel.username == username).first() is not None

    def email_exists(self, email: str) -> bool:
        return self.db.query(UserModel).filter(UserModel.email == email).first() is not None