from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except:
                self.disconnect(user_id)

manager = ConnectionManager()

# Models
class Admin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    username: str
    full_name: str
    role: str = "admin"
    status: str = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_login: Optional[str] = None

class AdminCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str
    role: str = "admin"

class AdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    username: str
    full_name: str
    plan: str = "Standard"  # Standard or Upgraded
    status: str = "active"
    avatar: Optional[str] = None
    bio: Optional[str] = None
    age: Optional[int] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    total_games_played: int = 0
    total_score: int = 0
    joined_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_login: Optional[str] = None
    subscription_expires: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    plan: str = "Standard"
    avatar: Optional[str] = None
    bio: Optional[str] = None
    age: Optional[int] = None
    school: Optional[str] = None
    grade: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    age: Optional[int] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    total_games_played: Optional[int] = None
    total_score: Optional[int] = None
    subscription_expires: Optional[str] = None
    credit_card_last4: Optional[str] = None
    credit_card_type: Optional[str] = None
    billing_address: Optional[str] = None

class Game(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str
    difficulty: str
    status: str = "development"
    version: str = "1.0.0"
    play_count: int = 0
    rating: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Build(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    game_id: str
    game_name: str
    version: str
    status: str = "pending"
    build_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    notes: Optional[str] = None

class Update(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    version: str
    type: str  # feature, bugfix, security
    status: str = "planned"
    release_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Revenue(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    amount: float
    source: str
    description: str
    type: str  # subscription, purchase, donation

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class LiveEffect(BaseModel):
    user_id: str
    effect_type: str  # text, image, notification
    content: str
    duration: Optional[int] = 5000  # milliseconds

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id: str = payload.get("sub")
        if admin_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return admin_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")

# Routes
@api_router.post("/admin/register", response_model=Admin)
async def register_admin(admin: AdminCreate):
    # Check if admin exists
    existing = await db.admins.find_one({"$or": [{"email": admin.email}, {"username": admin.username}]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    # Hash password and create admin
    hashed_password = hash_password(admin.password)
    admin_dict = admin.model_dump()
    admin_dict.pop("password")
    admin_obj = Admin(**admin_dict)
    
    doc = admin_obj.model_dump()
    doc["hashed_password"] = hashed_password
    
    await db.admins.insert_one(doc)
    return admin_obj

@api_router.post("/admin/login", response_model=Token)
async def login_admin(login: LoginRequest):
    admin = await db.admins.find_one({"username": login.username}, {"_id": 0})
    if not admin or not verify_password(login.password, admin["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    # Update last login
    await db.admins.update_one(
        {"id": admin["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    access_token = create_access_token({"sub": admin["id"]})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/admin/me", response_model=Admin)
async def get_current_admin_info(admin_id: str = Depends(get_current_admin)):
    admin = await db.admins.find_one({"id": admin_id}, {"_id": 0, "hashed_password": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin

@api_router.get("/admins", response_model=List[Admin])
async def get_admins(admin_id: str = Depends(get_current_admin)):
    admins = await db.admins.find({}, {"_id": 0, "hashed_password": 0}).to_list(1000)
    return admins

@api_router.put("/admins/{admin_id}", response_model=Admin)
async def update_admin(admin_id: str, update_data: AdminUpdate, _: str = Depends(get_current_admin)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if "password" in update_dict:
        update_dict["hashed_password"] = hash_password(update_dict["password"])
        del update_dict["password"]
    
    if update_dict:
        await db.admins.update_one({"id": admin_id}, {"$set": update_dict})
    
    admin = await db.admins.find_one({"id": admin_id}, {"_id": 0, "hashed_password": 0})
    return admin

@api_router.delete("/admins/{admin_id}")
async def delete_admin(admin_id: str, _: str = Depends(get_current_admin)):
    result = await db.admins.delete_one({"id": admin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {"message": "Admin deleted"}

# Users
@api_router.get("/users", response_model=List[User])
async def get_users(_: str = Depends(get_current_admin)):
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate, _: str = Depends(get_current_admin)):
    user_obj = User(**user.model_dump())
    doc = user_obj.model_dump()
    await db.users.insert_one(doc)
    return user_obj

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str, admin_id: str = Depends(get_current_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if admin is super admin to include credit card info
    admin = await db.admins.find_one({"id": admin_id}, {"_id": 0})
    if admin and admin.get("role") != "super_admin":
        # Remove credit card info for non-super admins
        user.pop("credit_card_last4", None)
        user.pop("credit_card_type", None)
        user.pop("billing_address", None)
    
    return user

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, update_data: UserUpdate, _: str = Depends(get_current_admin)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.users.update_one({"id": user_id}, {"$set": update_dict})
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    return user

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, _: str = Depends(get_current_admin)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# Games
@api_router.get("/games", response_model=List[Game])
async def get_games(_: str = Depends(get_current_admin)):
    games = await db.games.find({}, {"_id": 0}).to_list(1000)
    return games

@api_router.post("/games", response_model=Game)
async def create_game(game: Game, _: str = Depends(get_current_admin)):
    doc = game.model_dump()
    await db.games.insert_one(doc)
    return game

@api_router.put("/games/{game_id}", response_model=Game)
async def update_game(game_id: str, game_data: Game, _: str = Depends(get_current_admin)):
    game_dict = game_data.model_dump()
    game_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.games.update_one({"id": game_id}, {"$set": game_dict})
    game = await db.games.find_one({"id": game_id}, {"_id": 0})
    return game

@api_router.delete("/games/{game_id}")
async def delete_game(game_id: str, _: str = Depends(get_current_admin)):
    result = await db.games.delete_one({"id": game_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"message": "Game deleted"}

# Builds
@api_router.get("/builds", response_model=List[Build])
async def get_builds(_: str = Depends(get_current_admin)):
    builds = await db.builds.find({}, {"_id": 0}).to_list(1000)
    return builds

@api_router.post("/builds", response_model=Build)
async def create_build(build: Build, _: str = Depends(get_current_admin)):
    doc = build.model_dump()
    await db.builds.insert_one(doc)
    return build

# Updates
@api_router.get("/updates", response_model=List[Update])
async def get_updates(_: str = Depends(get_current_admin)):
    updates = await db.updates.find({}, {"_id": 0}).to_list(1000)
    return updates

@api_router.post("/updates", response_model=Update)
async def create_update(update: Update, _: str = Depends(get_current_admin)):
    doc = update.model_dump()
    await db.updates.insert_one(doc)
    return update

# Revenue
@api_router.get("/revenue", response_model=List[Revenue])
async def get_revenue(_: str = Depends(get_current_admin)):
    revenue = await db.revenue.find({}, {"_id": 0}).to_list(1000)
    return revenue

@api_router.post("/revenue", response_model=Revenue)
async def create_revenue(revenue: Revenue, _: str = Depends(get_current_admin)):
    doc = revenue.model_dump()
    await db.revenue.insert_one(doc)
    return revenue

# Live Effects
@api_router.post("/live-effects/send")
async def send_live_effect(effect: LiveEffect, _: str = Depends(get_current_admin)):
    message = {
        "type": effect.effect_type,
        "content": effect.content,
        "duration": effect.duration,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await manager.send_personal_message(message, effect.user_id)
    
    # Save to database
    await db.live_effects.insert_one({
        "user_id": effect.user_id,
        "effect_type": effect.effect_type,
        "content": effect.content,
        "sent_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Effect sent", "user_id": effect.user_id}

# Dashboard stats
@api_router.get("/stats/dashboard")
async def get_dashboard_stats(_: str = Depends(get_current_admin)):
    total_users = await db.users.count_documents({})
    upgraded_users = await db.users.count_documents({"plan": "Upgraded"})
    total_games = await db.games.count_documents({})
    total_revenue_docs = await db.revenue.find({}, {"_id": 0}).to_list(1000)
    total_revenue_amount = sum(doc["amount"] for doc in total_revenue_docs)
    
    return {
        "total_users": total_users,
        "upgraded_users": upgraded_users,
        "standard_users": total_users - upgraded_users,
        "total_games": total_games,
        "total_revenue": total_revenue_amount
    }

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# Initialize sample data
@api_router.post("/init-sample-data")
async def init_sample_data():
    # Clear existing data
    await db.admins.delete_many({})
    await db.users.delete_many({})
    await db.games.delete_many({})
    await db.builds.delete_many({})
    await db.updates.delete_many({})
    await db.revenue.delete_many({})
    
    # Create default admin
    default_admin = {
        "id": str(uuid.uuid4()),
        "email": "admin@eduplay.com",
        "username": "admin",
        "full_name": "System Administrator",
        "role": "super_admin",
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "hashed_password": hash_password("admin123")
    }
    await db.admins.insert_one(default_admin)
    
    # Create sample users
    sample_users = [
        {"email": "emma.wilson@school.edu", "username": "emma_w", "full_name": "Emma Wilson", "plan": "Upgraded", "age": 12, "school": "Lincoln Elementary", "grade": "6th", "total_games_played": 45, "total_score": 8750, "bio": "Love playing math games!"},
        {"email": "oliver.brown@school.edu", "username": "oliver_b", "full_name": "Oliver Brown", "plan": "Standard", "age": 10, "school": "Washington Elementary", "grade": "4th", "total_games_played": 23, "total_score": 4200},
        {"email": "sophia.davis@school.edu", "username": "sophia_d", "full_name": "Sophia Davis", "plan": "Upgraded", "age": 11, "school": "Roosevelt Middle", "grade": "5th", "total_games_played": 67, "total_score": 12340, "bio": "Gaming enthusiast and top scorer!"},
        {"email": "lucas.miller@school.edu", "username": "lucas_m", "full_name": "Lucas Miller", "plan": "Standard", "age": 9, "school": "Jefferson Elementary", "grade": "3rd", "total_games_played": 15, "total_score": 2890},
        {"email": "ava.garcia@school.edu", "username": "ava_g", "full_name": "Ava Garcia", "plan": "Upgraded", "age": 13, "school": "Lincoln Elementary", "grade": "7th", "total_games_played": 89, "total_score": 15670},
        {"email": "noah.martinez@school.edu", "username": "noah_m", "full_name": "Noah Martinez", "plan": "Standard", "age": 10, "school": "Washington Elementary", "grade": "4th", "total_games_played": 31, "total_score": 5420},
    ]
    
    for user_data in sample_users:
        user = User(**user_data)
        await db.users.insert_one(user.model_dump())
    
    # Create sample games
    sample_games = [
        {"name": "Math Blast", "description": "Fast-paced arithmetic game", "category": "Math", "difficulty": "Easy", "status": "live", "version": "2.1.0", "play_count": 1250, "rating": 4.5},
        {"name": "Word Quest", "description": "Spelling and vocabulary adventure", "category": "Language", "difficulty": "Medium", "status": "live", "version": "1.8.3", "play_count": 890, "rating": 4.3},
        {"name": "Science Lab", "description": "Interactive science experiments", "category": "Science", "difficulty": "Hard", "status": "beta", "version": "0.9.1", "play_count": 234, "rating": 4.7},
        {"name": "Geography Master", "description": "Learn countries and capitals", "category": "Geography", "difficulty": "Medium", "status": "live", "version": "3.0.2", "play_count": 567, "rating": 4.2},
        {"name": "Logic Puzzles", "description": "Brain-teasing logic challenges", "category": "Logic", "difficulty": "Hard", "status": "development", "version": "0.5.0", "play_count": 45, "rating": 4.6},
    ]
    
    for game_data in sample_games:
        game = Game(**game_data)
        await db.games.insert_one(game.model_dump())
    
    # Create sample builds
    games_list = await db.games.find({}, {"_id": 0}).to_list(100)
    for game in games_list[:3]:
        build = Build(
            game_id=game["id"],
            game_name=game["name"],
            version=game["version"],
            status="completed",
            notes="Stable release"
        )
        await db.builds.insert_one(build.model_dump())
    
    # Create sample updates
    sample_updates = [
        {"title": "New Game: Logic Puzzles", "description": "Added new puzzle game with 50 levels", "version": "4.0.0", "type": "feature", "status": "planned"},
        {"title": "Performance Improvements", "description": "Optimized game loading times", "version": "3.9.1", "type": "bugfix", "status": "released", "release_date": datetime.now(timezone.utc).isoformat()},
        {"title": "Security Patch", "description": "Fixed authentication vulnerabilities", "version": "3.9.2", "type": "security", "status": "in-progress"},
    ]
    
    for update_data in sample_updates:
        update = Update(**update_data)
        await db.updates.insert_one(update.model_dump())
    
    # Create sample revenue (Upgraded plan is $5.99)
    sample_revenue = [
        {"date": "2025-01-15", "amount": 5.99, "source": "emma_w", "description": "Monthly subscription upgrade", "type": "subscription"},
        {"date": "2025-01-18", "amount": 4.99, "source": "sophia_d", "description": "Premium game pack", "type": "purchase"},
        {"date": "2025-01-20", "amount": 5.99, "source": "ava_g", "description": "Monthly subscription upgrade", "type": "subscription"},
        {"date": "2025-01-22", "amount": 10.00, "source": "anonymous", "description": "Platform support", "type": "donation"},
        {"date": "2025-01-25", "amount": 2.99, "source": "noah_m", "description": "Science Lab DLC", "type": "purchase"},
    ]
    
    for revenue_data in sample_revenue:
        revenue = Revenue(**revenue_data)
        await db.revenue.insert_one(revenue.model_dump())
    
    return {"message": "Sample data initialized", "admin_credentials": {"username": "admin", "password": "admin123"}}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()