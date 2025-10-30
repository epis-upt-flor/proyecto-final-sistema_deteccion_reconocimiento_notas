import pytest
import sys
import os

#agregar el directorio raíz al path de Python
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

#ahora puedes importar los módulos correctamente
from app.modules.auth.domain.entities import UserAuth
from app.modules.auth.application.use_cases import RegisterUserUseCase, AuthenticateUserUseCase
from app.modules.auth.infrastructure.repositories import AuthRepositoryImpl

@pytest.fixture
def mock_db_session():
    """Fixture para mock de sesión de base de datos"""
    from unittest.mock import Mock
    return Mock()

@pytest.fixture
def sample_user_data():
    """Fixture con datos de ejemplo para usuario"""
    from datetime import datetime
    return {
        "user_id": 1,
        "username": "juanp",
        "email": "juan@test.com",
        "password_hash": "hashed_Juan123@",
        "nombre": "Juan",
        "apellido": "Pérez",
        "fecha_nacimiento": datetime(2003, 5, 15),
        "rol": "estudiante",
        "is_active": True,
        "email_verified": True
    }