import pytest
import sys
import os
from datetime import datetime
from unittest.mock import Mock, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.modules.auth.application.use_cases import AuthenticateUserUseCase
from app.modules.auth.domain.entities import UserAuth

class TestAuthenticateUserUseCase:
    
    def test_authenticate_user_success(self):
        #tc-04: inicio de sesión exitoso
        mock_repo = Mock()
        mock_password_verifier = Mock(return_value=True)
        
        expected_user = UserAuth(
            user_id=1,
            username="juanp",
            email="juan@test.com",
            password_hash="hashed_Juan123@",
            nombre="Juan",
            apellido="Pérez",
            fecha_nacimiento=datetime(2003, 5, 15),
            is_active=True,
            email_verified=True
        )
        
        mock_repo.get_by_username.return_value = expected_user
        mock_repo.update = Mock(return_value=expected_user)
        
        use_case = AuthenticateUserUseCase(mock_repo)
        
        #act
        result, error = use_case.execute(
            username="juanp",
            password="Juan123@",
            password_verifier=mock_password_verifier
        )
        
        #assert
        assert result is not None
        assert error is None
        assert result.username == "juanp"
        assert result.email == "juan@test.com"
        mock_repo.get_by_username.assert_called_once_with("juanp")
        mock_password_verifier.assert_called_once_with("Juan123@", "hashed_Juan123@")
        mock_repo.update.assert_called_once()
    
    def test_authenticate_user_invalid_credentials(self):
        #tc-05: inicio de sesión con credenciales incorrectas
        #arrange
        mock_repo = Mock()
        mock_password_verifier = Mock(return_value=False)  #contraseña incorrecta
        
        user_with_correct_password = UserAuth(
            user_id=1,
            username="juanp",
            email="juan@test.com",
            password_hash="hashed_Juan123@",
            nombre="Juan",
            apellido="Pérez",
            fecha_nacimiento=datetime(2003, 5, 15),
            is_active=True,
            email_verified=True
        )
        
        mock_repo.get_by_username.return_value = user_with_correct_password
        
        use_case = AuthenticateUserUseCase(mock_repo)
        
        #act
        result, error = use_case.execute(
            username="juanp",
            password="password_incorrecta",
            password_verifier=mock_password_verifier
        )
        
        #assert
        assert result is None
        assert error == "Credenciales inválidas"
        mock_password_verifier.assert_called_once_with("password_incorrecta", "hashed_Juan123@")
        mock_repo.update.assert_not_called()
    
    def test_authenticate_user_not_found(self):
        #autenticación con usuario no encontrado
        #arrange
        mock_repo = Mock()
        mock_password_verifier = Mock()
        mock_repo.get_by_username.return_value = None  #usuario no existe
        
        use_case = AuthenticateUserUseCase(mock_repo)
        
        #act
        result, error = use_case.execute(
            username="usuario_inexistente",
            password="cualquier_password",
            password_verifier=mock_password_verifier
        )
        
        #assert
        assert result is None
        assert error == "Credenciales inválidas"
        mock_repo.get_by_username.assert_called_once_with("usuario_inexistente")
        mock_password_verifier.assert_not_called()
        mock_repo.update.assert_not_called()