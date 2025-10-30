from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean
from sqlalchemy.sql import func
from core.database import Base

class UserModel(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100))
    fecha_nacimiento = Column(Date, nullable=False)
    rol = Column(String(20), nullable=False, default="estudiante")
    fecha_registro = Column(DateTime, default=func.now())
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String(100), nullable=True)
    reset_token = Column(String(100), nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)