import pytest
import sys
import os
from datetime import datetime
from unittest.mock import Mock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.modules.auth.domain.entities import UserAuth

class TestUserAuthEntity:
    
    def test_user_auth_creation(self):
        #creación de entidad userauth con todos los campos
        #arrange & act
        user = UserAuth(
            user_id=1,
            username="juanp",
            email="juan@test.com",
            password_hash="hashed_password",
            nombre="Juan",
            apellido="Pérez",
            fecha_nacimiento=datetime(2003, 5, 15),
            rol="estudiante",
            is_active=True,
            email_verified=True,
            verification_token="token_123",
            reset_token="reset_123",
            reset_token_expiry=datetime(2024, 12, 31),
            last_login=datetime.now(),
            fecha_registro=datetime.now()
        )
        
        #assert
        assert user.user_id == 1
        assert user.username == "juanp"
        assert user.email == "juan@test.com"
        assert user.password_hash == "hashed_password"
        assert user.nombre == "Juan"
        assert user.apellido == "Pérez"
        assert user.rol == "estudiante"
        assert user.is_active is True
        assert user.email_verified is True
    
    def test_user_auth_default_values(self):
        #creación de userauth con valores por defecto
        #arrange & act
        user = UserAuth(
            user_id=1,
            username="juanp",
            email="juan@test.com",
            password_hash="hashed_password",
            nombre="Juan",
            fecha_nacimiento=datetime(2003, 5, 15)
        )
        
        #assert
        assert user.apellido is None
        assert user.rol == "estudiante"
        assert user.is_active is True
        assert user.email_verified is False
        assert user.verification_token is None
        assert user.reset_token is None
        assert user.reset_token_expiry is None
        assert user.last_login is None
        assert user.fecha_registro is None
    
    def test_verify_password_success(self):
        #verificación de contraseña exitosa
        #arrange
        user = UserAuth(
            user_id=1,
            username="juanp",
            email="juan@test.com",
            password_hash="hashed_password",
            nombre="Juan",
            fecha_nacimiento=datetime(2003, 5, 15)
        )
        
        mock_verifier = Mock(return_value=True)
        
        #act
        result = user.verify_password("plain_password", mock_verifier)
        
        #assert
        assert result is True
        mock_verifier.assert_called_once_with("plain_password", "hashed_password")
    
    def test_verify_password_failure(self):
        #verificación de contraseña fallida
        #arrange
        user = UserAuth(
            user_id=1,
            username="juanp",
            email="juan@test.com",
            password_hash="hashed_password",
            nombre="Juan",
            fecha_nacimiento=datetime(2003, 5, 15)
        )
        
        mock_verifier = Mock(return_value=False)
        
        #act
        result = user.verify_password("wrong_password", mock_verifier)
        
        #assert
        assert result is False
        mock_verifier.assert_called_once_with("wrong_password", "hashed_password")
    
    def test_can_authenticate_active_verified(self):
        #usuario puede autenticarse cuando está activo y verificado
        #arrange
        user = UserAuth(
            user_id=1,
            username="juanp",
            email="juan@test.com",
            password_hash="hashed_password",
            nombre="Juan",
            fecha_nacimiento=datetime(2003, 5, 15),
            is_active=True,
            email_verified=True
        )
        
        #act
        result = user.can_authenticate()
        
        #assert
        assert result is True
    
    def test_can_authenticate_inactive(self):
        #usuario no puede autenticarse cuando está inactivo
        #arrange
        user = UserAuth(
            user_id=1,
            username="juanp",
            email="juan@test.com",
            password_hash="hashed_password",
            nombre="Juan",
            fecha_nacimiento=datetime(2003, 5, 15),
            is_active=False,
            email_verified=True
        )
        
        #act
        result = user.can_authenticate()
        
        #assert
        assert result is False
    
    def test_can_authenticate_unverified(self):
        #usuario no puede autenticarse cuando el email no está verificado
        #arrange
        user = UserAuth(
            user_id=1,
            username="juanp",
            email="juan@test.com",
            password_hash="hashed_password",
            nombre="Juan",
            fecha_nacimiento=datetime(2003, 5, 15),
            is_active=True,
            email_verified=False
        )
        
        #act
        result = user.can_authenticate()
        
        #assert
        assert result is False