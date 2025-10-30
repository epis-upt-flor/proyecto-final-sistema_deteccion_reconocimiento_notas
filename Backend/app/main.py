from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import traceback

# Configurar logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Inicializar app
app = FastAPI(title="ChopinPlay API Hexagonal", version="1.0.0")

# Configurar CORS
origins = [
    "https://chopinplay-frontend-9rov.vercel.app",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar base de datos
try:
    from core.database import engine, Base
    logger.info("✓ Database engine imported successfully")
    
    # Importar modelos para crear tablas
    from modules.practice_session.infrastructure.models.practice_session_model import PracticeSessionModel
    from modules.practice_session.infrastructure.models.evaluation_model import EvaluationModel
    from modules.sheet_music.infrastructure.models import SheetMusicModel
    from modules.auth.infrastructure.models import UserModel
    
    Base.metadata.create_all(bind=engine)
    logger.info("✓ Database tables created successfully")
    
except Exception as e:
    logger.error(f"✗ Database initialization error: {str(e)}")
    traceback.print_exc()

# Importar routers
try:
    logger.info("Starting router imports...")
    
    from modules.auth.presentation.routes import router as auth_router
    logger.info("✓ Auth router imported")
    
    from modules.practice_session.infrastructure.routes.practice_session_routes import router as practice_session_router
    logger.info("✓ Practice session router imported")
    
    from modules.sheet_music.presentation.routes import router as sheet_music_router
    logger.info("✓ Sheet music router imported")
    
    logger.info("Routers imported successfully")
    
except Exception as e:
    logger.error(f"✗ Router import error: {str(e)}")
    traceback.print_exc()

# Registrar routers
try:
    logger.info("Starting router registration...")
    
    # IMPORTANTE: No agregar prefix="/api/v1" si el router ya lo tiene definido
    app.include_router(auth_router, tags=["Authentication"])
    logger.info("✓ Auth router registered")
    
    app.include_router(practice_session_router, tags=["Practice Session"])
    logger.info("✓ Practice session router registered")
    
    app.include_router(sheet_music_router, tags=["Sheet Music"])
    logger.info("✓ Sheet music router registered")
    
    logger.info("All routers registered successfully")
    
except Exception as e:
    logger.error(f"✗ Router registration error: {str(e)}")
    traceback.print_exc()

# Intentar importar y registrar dashboard router
try:
    from modules.metrics.infrastructure.routes.dashboard_routes import router as dashboard_router
    app.include_router(dashboard_router, tags=["Dashboard"])
    logger.info("✓ Dashboard router imported and registered")
except Exception as e:
    logger.warning(f"⚠ Dashboard router not available: {str(e)}")

# Importar y registrar history router (ACTUALIZADO CON NUEVAS RUTAS)
try:
    from modules.metrics.infrastructure.routes.history_routes import router as history_router
    app.include_router(history_router, tags=["History"])
    logger.info("✓ History router imported and registered (includes session detail routes)")
except Exception as e:
    logger.warning(f"⚠ History router not available: {str(e)}")

# Endpoints base
@app.get("/")
async def root():
    return {"message": "ChopinPlay API Hexagonal funcionando"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Endpoint de debug para ver todas las rutas
@app.get("/debug/routes")
async def get_routes():
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            routes.append({
                "path": route.path,
                "name": route.name if hasattr(route, 'name') else None,
                "methods": list(route.methods) if hasattr(route, 'methods') else []
            })
    return {"routes": routes, "total": len(routes)}