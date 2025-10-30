from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_password_hash, verify_password, create_access_token
from ..infrastructure.repositories import AuthRepositoryImpl
from ..application.use_cases import RegisterUserUseCase, AuthenticateUserUseCase
from .schemas import UserRegister, UserLogin, TokenResponse, UserResponse

# CAMBIO AQUÍ: Agregar /api/v1 al prefijo
router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED
)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    auth_repo = AuthRepositoryImpl(db)
    register_uc = RegisterUserUseCase(auth_repo)
    
    # Limitar la contraseña a 72 bytes para bcrypt
    password_to_hash = user_data.password
    if len(password_to_hash.encode('utf-8')) > 72:
        password_to_hash = password_to_hash[:72]
    
    user_auth, error = register_uc.execute(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(password_to_hash),
        nombre=user_data.nombre,
        apellido=user_data.apellido,
        fecha_nacimiento=user_data.fecha_nacimiento
    )
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    access_token = create_access_token(data={"sub": user_auth.username})
    
    user_response = UserResponse(
        id_usuario=user_auth.user_id,
        username=user_auth.username,
        email=user_auth.email,
        nombre=user_auth.nombre,
        apellido=user_auth.apellido,
        rol=user_auth.rol,
        fecha_registro=user_auth.fecha_registro,
        is_active=user_auth.is_active,
        email_verified=user_auth.email_verified
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    auth_repo = AuthRepositoryImpl(db)
    auth_uc = AuthenticateUserUseCase(auth_repo)
    
    user_auth, error = auth_uc.execute(
        username=login_data.username,
        password=login_data.password,
        password_verifier=verify_password
    )
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    access_token = create_access_token(data={"sub": user_auth.username})
    
    user_response = UserResponse(
        id_usuario=user_auth.user_id,
        username=user_auth.username,
        email=user_auth.email,
        nombre=user_auth.nombre,
        apellido=user_auth.apellido,
        rol=user_auth.rol,
        fecha_registro=user_auth.fecha_registro,
        is_active=user_auth.is_active,
        email_verified=user_auth.email_verified
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )