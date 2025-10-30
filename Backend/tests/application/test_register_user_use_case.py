import pytest
import sys
import os
from datetime import datetime
from unittest.mock import Mock, MagicMock

#agregar el path manualmente
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.modules.auth.application.use_cases import RegisterUserUseCase
from app.modules.auth.domain.entities import UserAuth

class TestRegisterUserUseCase:
    
    def test_register_user_success(self):
        #tc-01: registro de usuario con datos válidos
        #arrange
        mock_repo = Mock()
        mock_repo.username_exists.return_value = False
        mock_repo.email_exists.return_value = False
        
        expected_user = UserAuth(
            user_id=1,
            username="juanp",
            email="juan@test.com",
            password_hash="hashed_Juan123@",
            nombre="Juan",
            apellido="Pérez",
            fecha_nacimiento=datetime(2003, 5, 15),
            rol="estudiante",
            is_active=True,
            email_verified=False
        )
        mock_repo.create.return_value = expected_user
        
        use_case = RegisterUserUseCase(mock_repo)
        
        #act
        result, error = use_case.execute(
            username="juanp",
            email="juan@test.com",
            password_hash="hashed_Juan123@",
            nombre="Juan",
            apellido="Pérez",
            fecha_nacimiento=datetime(2003, 5, 15)
        )
        
        #assert
        assert result is not None
        assert error is None
        assert result.user_id == 1
        assert result.username == "juanp"
        assert result.email == "juan@test.com"
        assert result.nombre == "Juan"
        assert result.apellido == "Pérez"
        mock_repo.username_exists.assert_called_once_with("juanp")
        mock_repo.email_exists.assert_called_once_with("juan@test.com")
        mock_repo.create.assert_called_once()
    
    def test_register_user_duplicate_email(self):
        #tc-02: registro con email duplicado
        #arrange
        mock_repo = Mock()
        mock_repo.username_exists.return_value = False
        mock_repo.email_exists.return_value = True  #email ya existe
        
        use_case = RegisterUserUseCase(mock_repo)
        
        #act
        result, error = use_case.execute(
            username="juanp",
            email="juan@test.com",  #email duplicado
            password_hash="hashed_Juan123@",
            nombre="Juan",
            apellido="Pérez",
            fecha_nacimiento=datetime(2003, 5, 15)
        )
        
        #assert
        assert result is None
        assert error == "El email ya está registrado"
        mock_repo.email_exists.assert_called_once_with("juan@test.com")
        mock_repo.create.assert_not_called()
    
    def test_register_user_duplicate_username(self):
        #registro con nombre de usuario duplicado
        #arrange
        mock_repo = Mock()
        mock_repo.username_exists.return_value = True  #username ya existe
        mock_repo.email_exists.return_value = False
        
        use_case = RegisterUserUseCase(mock_repo)
        
        #act
        result, error = use_case.execute(
            username="juanp",  #username duplicado
            email="juan@test.com",
            password_hash="hashed_Juan123@",
            nombre="Juan",
            apellido="Pérez",
            fecha_nacimiento=datetime(2003, 5, 15)
        )
        
        #assert
        assert result is None
        assert error == "El nombre de usuario ya está en uso"
        mock_repo.username_exists.assert_called_once_with("juanp")
        mock_repo.email_exists.assert_not_called()
        mock_repo.create.assert_not_called()