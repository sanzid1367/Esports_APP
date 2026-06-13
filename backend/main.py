from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine, AsyncSessionLocal
from models import AdminUser, RegularUser
from sqlalchemy.future import select
from auth import get_password_hash
import routes

app = FastAPI(title="E-Sports Tournament API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for simplicity in frontend connection
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api")

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        # Create tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
        
    # Auto-seed credentials
    async with AsyncSessionLocal() as session:
        # Seed Admin
        admin_query = select(AdminUser).where(AdminUser.username == "admin")
        result = await session.execute(admin_query)
        admin = result.scalars().first()
        if not admin:
            hashed_admin_password = get_password_hash("admin123")
            new_admin = AdminUser(username="admin", hashed_password=hashed_admin_password)
            session.add(new_admin)
            
        # Seed Regular User
        user_query = select(RegularUser).where(RegularUser.username == "user")
        result = await session.execute(user_query)
        user = result.scalars().first()
        if not user:
            hashed_user_password = get_password_hash("user123")
            new_user = RegularUser(username="user", hashed_password=hashed_user_password)
            session.add(new_user)
            
        await session.commit()

@app.get("/")
def root():
    return {"message": "Welcome to the E-Sports Tournament API"}
