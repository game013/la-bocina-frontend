# PROGRESS · La Bocina · frontend Oscar

Índice de avance humano. El mapa canónico está en [`.scratch/oscar-frontend/map.md`](.scratch/oscar-frontend/map.md).

## Destino

Pantalla del cajero implementada, probada en celular y ejecutable: **fase 1 (fixtures + Bocina)** → **fase 2 (API cobros real)** → **voz de entrada**. Voz = OpenRouter vía **mini-proxy local**. Entregado = stretch.

## Estado ahora

| | |
|---|---|
| Mapa | [Oscar frontend](.scratch/oscar-frontend/map.md) |
| Cerrado | [Arquitectura](.scratch/oscar-frontend/issues/01-arquitectura-modulos-front.md) — Vite + **TypeScript** + FastAPI voz |
| Repo | `git@github.com-game013:game013/la-bocina-frontend.git` |
| Frontera | Research OpenRouter + [Mini-proxy](.scratch/oscar-frontend/issues/09-mini-proxy-openrouter.md) + [Fase 1 pantalla](.scratch/oscar-frontend/issues/03-fase1-pantalla-fixtures-teclado.md) |
| Key | Solo en `.env` del mini-backend — **nunca en el front ni en el repo** |

## Frontera (tomar en orden)

1. ~~Arquitectura de módulos~~ → **resolved**
2. [Research: OpenRouter STT + TTS](.scratch/oscar-frontend/issues/02-research-openrouter-stt-tts.md) — AFK
3. [Mini-proxy OpenRouter local](.scratch/oscar-frontend/issues/09-mini-proxy-openrouter.md) — task (puede ir en paralelo al research)
4. [Fase 1: pantalla, fixtures, teclado](.scratch/oscar-frontend/issues/03-fase1-pantalla-fixtures-teclado.md) — tras arquitectura (ya)
5. [Fase 1: Bocina](.scratch/oscar-frontend/issues/04-fase1-bocina-idempotente.md) — tras 02 + 03 + 09
6. [Fase 2: API cobros](.scratch/oscar-frontend/issues/05-fase2-cablear-api-real.md)
7. [Voz entrada + parser](.scratch/oscar-frontend/issues/06-voz-entrada-parser-fijo.md)
8. [Prueba en celular](.scratch/oscar-frontend/issues/07-prueba-en-celular.md)
9. _(stretch)_ [Entregado](.scratch/oscar-frontend/issues/08-stretch-boton-entregado.md)

## Voz (decisión)

```
iPhone mic → MediaRecorder → POST /api/voz/transcribir (mini-backend) → OpenRouter STT
                                                      → parser fijo → cobro
pagado     → POST /api/voz/hablar (mini-backend) → OpenRouter TTS → <audio>
```

Teclado siempre visible. Sin key en el bundle.

## Costuras cobros (Rafael)

| Llamada | Uso |
|---|---|
| `POST /api/cobros` | Crear; pintar `qrImage` |
| `GET /api/cobros/:id` | Poll 2s |
| `GET /api/eventos` | SSE |
| `POST /api/cobros/:id/entregar` | Stretch |

## Cómo seguir

Siguiente sesión: **Mini-proxy** y/o **Fase 1 pantalla** (en paralelo al research). Un ticket de decisión/prototipo por sesión; el research puede ir AFK.
