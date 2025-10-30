import pytest
import sys
import os
from datetime import datetime
from unittest.mock import Mock, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.modules.auth.infrastructure.repositories import AuthRepositoryImpl
from app.modules.auth.domain.entities import UserAuth

class TestAuthRepositoryImpl:
    
    def test_get_by_username_found(self):
        #buscar usuario por username - encontrado
        #arrange
        mock_db = Mock()
        mock_user_model = Mock()
        mock_user_model.id_usuario = 1
        mock_user_model.username = "juanp"
        mock_user_model.email = "juan@test.com"
        mock_user_model.password_hash = "hashed_password"
        mock_user_model.nombre = "Juan"
        mock_user_model.apellido = "Pérez"
        mock_user_model.fecha_nacimiento = datetime(2003, 5, 15)
        mock_user_model.rol = "estudiante"
        mock_user_model.is_active = True
        mock_user_model.email_verified = True
        mock_user_model.verification_token = None
        mock_user_model.reset_token = None
        mock_user_model.reset_token_expiry = None
        mock_user_model.last_login = None
        mock_user_model.fecha_registro = datetime.now()
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_model
        repository = AuthRepositoryImpl(mock_db)
        
        #act
        result = repository.get_by_username("juanp")
        
        #assert
        assert result is not None
        assert result.user_id == 1
        assert result.username == "juanp"
        assert result.email == "juan@test.com"
        mock_db.query.assert_called_once()
    
    def test_get_by_username_not_found(self):
        #buscar usuario por username - no encontrado
        #arrange
        mock_db = Mock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        repository = AuthRepositoryImpl(mock_db)
        
        #act
        result = repository.get_by_username("usuario_inexistente")
        
        #assert
        assert result is None
    
    def test_username_exists_true(self):
        #verificar existencia de username - existe
        #arrange
        mock_db = Mock()
        mock_db.query.return_value.filter.return_value.first.return_value = Mock()
        repository = AuthRepositoryImpl(mock_db)
        
        #act
        result = repository.username_exists("juanp")
        
        #assert
        assert result is True
    
    def test_username_exists_false(self):
        #verificar existencia de username - no existe
        #arrange
        mock_db = Mock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        repository = AuthRepositoryImpl(mock_db)
        
        #act
        result = repository.username_exists("usuario_inexistente")
        
        #assert
        assert result is False