# Mini-proxy OpenRouter local

Type: task
Status: open
Blocked by: 02

## Question

¿Cómo queda el mini-backend FastAPI en este repo para consumir OpenRouter sin exponer la key en el front?

Ya scaffolded: `server/main.py` con `/salud`, stubs `POST /api/voz/transcribir` y `POST /api/voz/hablar`, `server/.env.example`, Vite proxy en dev.

Pendiente para resolver este ticket:

- Elegir modelos (sale del research 02) e implementar STT/TTS de verdad.
- Probar “Listo” TTS en local con key en `server/.env`.
- Documentar el one-liner de arranque (ya en README).

Temporal: se retira cuando Rafael tome estas rutas.
