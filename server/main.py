"""Mini-proxy local: OpenRouter STT/TTS. La key nunca sale al frontend."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv(Path(__file__).resolve().parent / ".env")

app = FastAPI(title="La Bocina · voz", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _require_key() -> str:
    key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not key:
        raise HTTPException(
            status_code=503,
            detail="Falta OPENROUTER_API_KEY en server/.env",
        )
    return key


@app.get("/salud")
def salud() -> dict[str, str | bool]:
    return {
        "servicio": "voz",
        "openrouter": bool(os.getenv("OPENROUTER_API_KEY", "").strip()),
        "version": "0.1.0",
    }


@app.post("/api/voz/transcribir")
async def transcribir(audio: UploadFile = File(...)) -> dict[str, str]:
    """Audio del micrófono → texto. Implementación tras research de modelos."""
    _require_key()
    _ = await audio.read()
    raise HTTPException(
        status_code=501,
        detail="STT pendiente: ver research OpenRouter en .scratch/",
    )


class HablarBody(BaseModel):
    texto: str = Field(min_length=1, max_length=500)


@app.post("/api/voz/hablar")
async def hablar(body: HablarBody) -> dict[str, str]:
    """Texto de la Bocina → audio. Implementación tras research de modelos."""
    _require_key()
    _ = body.texto
    raise HTTPException(
        status_code=501,
        detail="TTS pendiente: ver research OpenRouter en .scratch/",
    )


@app.post("/api/voz/hablar-form")
async def hablar_form(texto: str = Form(...)) -> dict[str, str]:
    return await hablar(HablarBody(texto=texto))
