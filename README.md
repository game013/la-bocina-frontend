# La Bocina · frontend (Oscar)

Pantalla del cajero: monto, teclado, QR CoDi, confirmación en verde y **Bocina** (voz).  
Repo del hackatón Cursor México — se integrará después con el backend/mono-repo de Rafael.

## Qué hay aquí

| Pieza | Rol |
|---|---|
| `src/` | Vite + **TypeScript** — UI del cajero |
| `server/` | Mini **FastAPI** — proxy a OpenRouter (STT/TTS); la API key no va al browser |
| `.scratch/` | Mapa wayfinder / tickets de decisión |
| `PROGRESS.md` | Índice de avance |

El dinero y pey viven en el server de Rafael. Este repo solo pinta la caja y habla con `/api/voz/*` (local) y, en fase 2, con los endpoints de cobros.

## Arranque local

### 1. Front

```bash
cp .env.example .env   # VITE_API_BASE → tunnel de Rafael
npm install
npm run dev
```

Abre `http://localhost:5173`. En DEV, Vite proxifica `/api/cobros` y `/api/eventos` al tunnel (Rafael aún sin CORS). Demo sin API: `?fixture=1`.

### 2. Mini-proxy de voz (otra terminal)

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # pega OPENROUTER_API_KEY
uvicorn main:app --reload --port 8000
```

Vite ya proxifica `/api/voz` → `http://127.0.0.1:8000`.

Comprueba: `curl http://127.0.0.1:8000/salud`

## Secretos

- `server/.env` — **nunca** al repo.
- No uses `VITE_*` para la key de OpenRouter.

## Roadmap corto

1. ~~Fase 1: UI + teclado + estados~~ · ~~Fase 2: cobros + SSE/poll → verde~~
2. Bocina (TTS vía mini-proxy OpenRouter).
3. Voz de entrada: mic → STT → parser fijo (sin LLM para el monto).
4. Stretch: botón Entregado (track #5).

Detalle: `PROGRESS.md` y `.scratch/oscar-frontend/map.md`.
