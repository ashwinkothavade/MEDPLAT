from fastapi import FastAPI, UploadFile, File, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import os
import motor.motor_asyncio
import httpx
import csv
import io
import json
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup (update your URI and DB/collection names as needed)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "medplat")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "chatdata")
mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = mongo_client[MONGO_DB]
collection = db[MONGO_COLLECTION]
users_collection = db["users"]

# Gemini API setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + (GEMINI_API_KEY or "")

# JWT setup
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

# User model
class User(BaseModel):
    username: str
    password: str
    role: str = "user"  # default role

class UserInDB(User):
    hashed_password: str

# Auth helpers
async def get_user(username: str):
    user = await users_collection.find_one({"username": username})
    if user:
        return user
    return None

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await get_user(username)
    if user is None:
        raise credentials_exception
    return user

class NLPRequest(BaseModel):
    query: str

class ChatbotRequest(BaseModel):
    message: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/nlp")
def nlp_endpoint(req: NLPRequest):
    # For demo, return a static chart config for a bar chart
    # In production, use OpenAI/Cohere to parse query and generate chart config
    if "case load" in req.query.lower():
        chartData = {
            "labels": ["Week 1", "Week 2", "Week 3"],
            "datasets": [{"label": "Cases", "data": [12, 19, 7], "backgroundColor": "#1976d2"}]
        }
        return {"chartData": chartData, "summary": "Weekly case load for Ward X."}
    return {"chartData": None, "summary": "No data found for query."}

# Chatbot endpoint using Gemini and MongoDB
def build_gemini_payload(user_message, mongo_data):
    context = f"User message: {user_message}\nRelevant data: {mongo_data}"
    return {
        "contents": [{
            "parts": [{"text": context}]
        }]
    }

@app.post("/chatbot")
async def chatbot_endpoint(req: ChatbotRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not set.")
    # Fetch relevant data from MongoDB (customize query as needed)
    mongo_result = await collection.find_one({}, sort=[("_id", -1)])  # Example: get latest entry
    mongo_data = mongo_result if mongo_result else {}
    # Prepare payload for Gemini
    payload = build_gemini_payload(req.message, mongo_data)
    # Call Gemini API
    async with httpx.AsyncClient() as client:
        response = await client.post(GEMINI_API_URL, json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Gemini API error: " + response.text)
        gemini_response = response.json()
    # Extract Gemini response text
    try:
        reply = gemini_response["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        reply = "Sorry, I couldn't process your request."
    return {"reply": reply}

# Upload data endpoint (CSV/JSON)
@app.post("/upload-data")
async def upload_data(file: UploadFile = File(...)):
    filename = file.filename.lower()
    content = await file.read()
    docs = []
    try:
        if filename.endswith('.csv'):
            decoded = content.decode('utf-8')
            reader = csv.DictReader(io.StringIO(decoded))
            docs = [row for row in reader]
        elif filename.endswith('.json'):
            decoded = content.decode('utf-8')
            data = json.loads(decoded)
            if isinstance(data, list):
                docs = data
            else:
                docs = [data]
        else:
            return JSONResponse(status_code=400, content={"error": "Unsupported file type. Upload CSV or JSON."})
        if docs:
            res = await collection.insert_many(docs)
            return {"inserted_count": len(res.inserted_ids)}
        else:
            return JSONResponse(status_code=400, content={"error": "No data found in file."})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# Dashboard data endpoint
@app.get("/dashboard-data")
async def dashboard_data():
    cursor = collection.find()
    data = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])  # Convert ObjectId to string for JSON serialization
        data.append(doc)
    return {"data": data}

# --- User Auth Endpoints ---
class Token(BaseModel):
    access_token: str
    token_type: str

@app.post("/register")
async def register(user: User):
    existing = await users_collection.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_pw = get_password_hash(user.password)
    await users_collection.insert_one({"username": user.username, "hashed_password": hashed_pw, "role": user.role})
    return {"msg": "User registered"}

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await get_user(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {"username": current_user["username"], "role": current_user["role"]}

@app.post("/change-password")
async def change_password(data: dict, current_user: dict = Depends(get_current_user)):
    new_pw = data.get('password')
    if not new_pw:
        raise HTTPException(status_code=400, detail="Password required")
    hashed_pw = get_password_hash(new_pw)
    await users_collection.update_one({"username": current_user["username"]}, {"$set": {"hashed_password": hashed_pw}})
    return {"msg": "Password updated"}

@app.get("/users")
async def list_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    users = []
    async for user in users_collection.find({}, {"_id": 0, "username": 1, "role": 1}):
        users.append(user)
    return {"users": users}

@app.post("/users/set-role")
async def set_user_role(data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    username = data.get("username")
    role = data.get("role")
    if not username or not role:
        raise HTTPException(status_code=400, detail="Username and role required")
    await users_collection.update_one({"username": username}, {"$set": {"role": role}})
    return {"msg": f"Role for {username} set to {role}"}

# --- Personalized KPI Suggestions ---
@app.get("/suggest-kpis")
async def suggest_kpis(current_user: dict = Depends(get_current_user)):
    # Example: Use Gemini to suggest KPIs based on user role
    prompt = f"Suggest 3 important KPIs for a user with role '{current_user['role']}' in a medical dashboard."
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    async with httpx.AsyncClient() as client:
        response = await client.post(GEMINI_API_URL, json=payload)
        if response.status_code != 200:
            return {"kpis": ["KPI suggestions unavailable"]}
        gemini_response = response.json()
    try:
        text = gemini_response["candidates"][0]["content"]["parts"][0]["text"]
        kpis = [k.strip("- ") for k in text.split("\n") if k.strip()]
    except Exception:
        kpis = ["KPI suggestions unavailable"]
    return {"kpis": kpis}

# --- Enhanced Anomaly Detection ---
@app.post("/anomaly")
async def anomaly_endpoint(current_user: dict = Depends(get_current_user)):
    # Example: flag if any numeric field is > 2 std dev from mean
    cursor = collection.find()
    data = []
    async for doc in cursor:
        data.append(doc)
    if not data:
        return {"anomaly": False, "message": "No data"}
    # Find numeric fields
    numeric_fields = [k for k in data[0] if isinstance(data[0][k], (int, float)) or (str(data[0][k]).replace('.', '', 1).isdigit())]
    anomalies = []
    for field in numeric_fields:
        vals = [float(row[field]) for row in data if row.get(field) is not None]
        if len(vals) < 2:
            continue
        mean = sum(vals) / len(vals)
        std = (sum((v - mean) ** 2 for v in vals) / len(vals)) ** 0.5
        for v in vals:
            if abs(v - mean) > 2 * std:
                anomalies.append({"field": field, "value": v})
    return {"anomaly": bool(anomalies), "anomalies": anomalies}

# --- Enhanced Forecasting ---
@app.post("/forecast")
async def forecast_endpoint(current_user: dict = Depends(get_current_user)):
    # Example: simple trend forecast for the first numeric field
    cursor = collection.find()
    data = []
    async for doc in cursor:
        data.append(doc)
    if not data:
        return {"forecast": []}
    numeric_fields = [k for k in data[0] if isinstance(data[0][k], (int, float)) or (str(data[0][k]).replace('.', '', 1).isdigit())]
    if not numeric_fields:
        return {"forecast": []}
    field = numeric_fields[0]
    vals = [float(row[field]) for row in data if row.get(field) is not None]
    # Simple linear forecast: project next 5 points
    if len(vals) < 2:
        return {"forecast": []}
    delta = (vals[-1] - vals[0]) / (len(vals) - 1)
    forecast = [vals[-1] + delta * (i + 1) for i in range(5)]
    return {"field": field, "forecast": forecast}
