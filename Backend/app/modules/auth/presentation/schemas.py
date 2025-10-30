from pydantic import BaseModel, EmailStr, validator
from datetime import date, datetime
from typing import Optional
import re

class UserBase(BaseModel):
    username: str
    email: EmailStr
    nombre: str
    apellido: Optional[str] = None
    fecha_nacimiento: date

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    nombre: str
    apellido: Optional[str] = None
    fecha_nacimiento: date
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if not re.search(r'[A-Z]', v):
            raise ValueError('La contraseña debe contener al menos una mayúscula')
        if not re.search(r'[a-z]', v):
            raise ValueError('La contraseña debe contener al menos una minúscula')
        if not re.search(r'[0-9]', v):
            raise ValueError('La contraseña debe contener al menos un número')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('La contraseña debe contener al menos un carácter especial')
        return v

    @validator('username')
    def username_valid(cls, v):
        if len(v) < 3:
            raise ValueError('El nombre de usuario debe tener al menos 3 caracteres')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('El nombre de usuario solo puede contener letras, números y guiones bajos')
        return v

    @validator('fecha_nacimiento')
    def validate_age(cls, v):
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 13:
            raise ValueError('Debes tener al menos 13 años para registrarte')
        return v

class UserResponse(BaseModel):
    id_usuario: int
    username: str
    email: str
    nombre: str
    apellido: Optional[str] = None
    rol: str
    fecha_registro: datetime
    is_active: bool
    email_verified: bool

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse