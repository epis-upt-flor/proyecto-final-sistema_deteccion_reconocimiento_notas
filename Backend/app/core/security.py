import bcrypt  # ← Añadir esta importación
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "tu_clave_secreta_super_segura_cambiar_en_produccion")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ← ELIMINAR CryptContext de passlib

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si una contraseña plana coincide con el hash bcrypt
    """
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password
    )

def get_password_hash(password: str) -> str:
    """
    Genera hash bcrypt para una contraseña
    """
    # bcrypt tiene un límite de 72 bytes
    pwd_bytes = password.encode('utf-8')
    if len(pwd_bytes) > 72:
        pwd_bytes = pwd_bytes[:72]
    
    # Generar salt y hash con bcrypt directamente
    salt = bcrypt.gensalt(rounds=12)  # rounds=12 equivalente a tu configuración anterior
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt