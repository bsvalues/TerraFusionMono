import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Database configuration
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost/terrafusion"
engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# NATS connection for messaging
nats_client = None

# Health check state
is_database_ready = False
is_nats_ready = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize connections
    global is_database_ready, is_nats_ready, nats_client
    
    # Initialize database connection
    try:
        async with engine.begin() as conn:
            await conn.run_sync(lambda _: None)  # Simple connection test
        is_database_ready = True
        logging.info("Database connection established")
    except Exception as e:
        logging.error(f"Database connection failed: {e}")
        is_database_ready = False
    
    # Initialize NATS connection
    try:
        from nats.aio.client import Client as NATS
        nats_client = NATS()
        await nats_client.connect("nats://localhost:4222")
        is_nats_ready = True
        logging.info("NATS connection established")
    except Exception as e:
        logging.error(f"NATS connection failed: {e}")
        is_nats_ready = False
    
    yield
    
    # Shutdown: close connections
    if nats_client and nats_client.is_connected:
        await nats_client.close()
        logging.info("NATS connection closed")
    
    await engine.dispose()
    logging.info("Database connection closed")


# Create FastAPI app
app = FastAPI(
    title="TerraFusion Backend API",
    description="Backend API for the TerraFusion platform",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get database session
async def get_db():
    async with async_session_maker() as session:
        yield session


# Health check endpoints
@app.get("/health/live", status_code=status.HTTP_200_OK)
async def health_live():
    """
    Liveness probe - simple check that the application is running
    """
    return {"status": "ok"}


@app.get("/health/ready")
async def health_ready():
    """
    Readiness probe - check if the application can serve requests
    """
    global is_database_ready, is_nats_ready
    
    # Check database connection
    if not is_database_ready:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(lambda _: None)
            is_database_ready = True
        except Exception:
            is_database_ready = False
    
    # Check NATS connection
    if nats_client and not is_nats_ready:
        is_nats_ready = nats_client.is_connected
    
    if is_database_ready and is_nats_ready:
        return {
            "status": "ready",
            "database": "connected",
            "nats": "connected"
        }
    else:
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "not ready",
            "database": "connected" if is_database_ready else "disconnected",
            "nats": "connected" if is_nats_ready else "disconnected"
        }


# GraphQL endpoint (using Strawberry)
@app.get("/graphql")
async def graphql_placeholder():
    """
    Placeholder for the GraphQL endpoint
    """
    return {"message": "GraphQL endpoint placeholder"}


# Main entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4001)