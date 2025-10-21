import os
import json
from typing import Optional
import base64
import io
from PIL import Image
import requests

from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_API_MODEL = os.getenv("OPENAI_API_MODEL", "gpt-3.5-turbo")

app = FastAPI(title="Autism Screening Prototype API")

# Allow CORS from the Vite dev server and localhost (development only)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChildInput(BaseModel):
    age: int
    eye_contact: str
    speech_level: str
    social_response: str
    sensory_reactions: str


class EmotionResponse(BaseModel):
    dominant_emotion: str
    confidence: float
    all_emotions: dict


def build_prompt(data: ChildInput) -> str:
    return (
        f"Child age: {data.age}\n"
        f"Eye contact: {data.eye_contact}\n"
        f"Speech level: {data.speech_level}\n"
        f"Social response: {data.social_response}\n"
        f"Sensory reactions: {data.sensory_reactions}\n"
        "\nBased on this child's responses, give 3 short therapy goals and 2 activities that can help improvement. "
        "Return JSON with keys: focus_areas (list of strings), therapy_goals (list of 3 strings), activities (list of 2 strings)."
    )


async def call_openai(prompt: str) -> dict:
    # Use httpx to call the OpenAI chat completions endpoint
    import httpx

    headers = {"Content-Type": "application/json"}
    if OPENAI_API_KEY:
        headers["Authorization"] = f"Bearer {OPENAI_API_KEY}"
    else:
        # Fallback: return a mock analysis
        return {"focus_areas": ["Social Communication"], "therapy_goals": ["Practice basic social interactions"], "activities": ["Structured play sessions"]}

    data = {
        "model": OPENAI_API_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 500,
        "temperature": 0.7
    }

    async with httpx.AsyncClient() as client:
        response = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return {"error": "Could not parse AI response as JSON", "raw_response": content}
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)


def analyze_emotion_mock(image_data) -> dict:
    """
    Mock emotion analysis function
    In a real implementation, you would use libraries like:
    - OpenCV with emotion detection models
    - Azure Cognitive Services
    - AWS Rekognition
    - Google Cloud Vision API
    """
    import random
    
    # Mock emotions with random confidence
    emotions = {
        'happy': random.uniform(10, 95),
        'sad': random.uniform(5, 80),
        'angry': random.uniform(5, 70),
        'fear': random.uniform(5, 60),
        'surprise': random.uniform(5, 50),
        'disgust': random.uniform(5, 40),
        'neutral': random.uniform(20, 90)
    }
    
    # Normalize to 100%
    total = sum(emotions.values())
    emotions = {k: (v/total)*100 for k, v in emotions.items()}
    
    # Find dominant emotion
    dominant_emotion = max(emotions, key=emotions.get)
    confidence = emotions[dominant_emotion]
    
    return {
        "dominant_emotion": dominant_emotion,
        "confidence": round(confidence, 1),
        "all_emotions": {k: round(v, 1) for k, v in emotions.items()}
    }


def heuristic_response(prompt: str) -> dict:
    # Very simple rules based on keywords
    focus = []
    goals = []
    activities = []

    if "no" in prompt.lower() or "poor" in prompt.lower() or "limited" in prompt.lower():
        if "eye contact" in prompt.lower():
            focus.append("Eye contact & social attention")
            goals.append("Practice making and holding brief eye contact during play")
        if "speech" in prompt.lower() or "no words" in prompt.lower():
            focus.append("Speech & communication")
            goals.append("Increase use of simple words or gestures to request needs")
        if "sensory" in prompt.lower():
            focus.append("Sensory processing")
            goals.append("Introduce gentle sensory activities to build tolerance")

    # Fill up to 3 goals
    while len(goals) < 3:
        goals.append("Encourage social routines during daily activities")

    if "eye contact" in prompt.lower():
        activities.append("Turn-taking peek-a-boo and name games to build gaze")
    else:
        activities.append("Structured play with short prompts for interaction")

    if "speech" in prompt.lower():
        activities.append("Labeling objects and singing simple songs to encourage vocalization")
    else:
        activities.append("Sensory play using safe textures (buckets with rice, soft toys)")

    return {"focus_areas": focus or ["General social communication"], "therapy_goals": goals, "activities": activities}


@app.post("/analyze")
async def analyze(child: ChildInput):
    prompt = build_prompt(child)
    try:
        result = await call_openai(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result


@app.post("/analyze-emotion")
async def analyze_emotion(image: UploadFile = File(...)):
    """
    Analyze emotions from uploaded image
    """
    try:
        # Validate file type
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await image.read()
        
        # Validate file size (5MB limit)
        if len(image_data) > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(status_code=400, detail="Image file too large. Maximum size is 5MB")
        
        # For now, use mock analysis
        # In production, integrate with actual emotion detection service
        emotion_result = analyze_emotion_mock(image_data)
        
        return emotion_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing emotion: {str(e)}")


@app.get("/")
async def root():
    return {"message": "Autism Detection Backend API", "endpoints": ["/analyze", "/analyze-emotion"]}
