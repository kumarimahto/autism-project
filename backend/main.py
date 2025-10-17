import os
import json
from typing import Optional

from fastapi import FastAPI, HTTPException
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
        url = "https://api.openai.com/v1/chat/completions"
        body = {
            "model": OPENAI_API_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 400,
            "temperature": 0.3,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(url, headers=headers, json=body)
            r.raise_for_status()
            resp = r.json()
            # try to parse assistant content as JSON
            text = resp["choices"][0]["message"]["content"]
            try:
                return json.loads(text)
            except Exception:
                # fallback: return raw text
                return {"raw": text}
    else:
        # deterministic heuristic fallback if no API key
        return heuristic_response(prompt)


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
