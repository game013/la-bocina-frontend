# PROGRESS · La Bocina · frontend Oscar

Índice de avance humano. El mapa canónico está en [`.scratch/oscar-frontend/map.md`](.scratch/oscar-frontend/map.md).

## Destino

Pantalla del cajero implementada, probada en celular y ejecutable: **fase 1 (UI + teclado + estados)** → **fase 2 (API Rafael)** → **Bocina OpenRouter** → **voz de entrada**. Entregado = stretch.

## Estado ahora

| | |
|---|---|
| Mapa | [Oscar frontend](.scratch/oscar-frontend/map.md) |
| Cerrado | [Arquitectura](.scratch/oscar-frontend/issues/01-arquitectura-modulos-front.md) — Vite + TS + FastAPI voz |
| Repo | https://github.com/game013/la-bocina-frontend |
| **Server Rafael** | Base URL: `https://merger-fish-gets-peace.trycloudflare.com` — endpoints de cobros **ya expuestos** |
| Siguiente | **[Fase 1: pantalla + teclado](.scratch/oscar-frontend/issues/03-fase1-pantalla-fixtures-teclado.md)** |

## Frontera (orden práctico ahora)

1. ~~Arquitectura~~ · ~~aviso Rafael~~ → **listo**
2. **Ahora:** [Fase 1 pantalla / teclado / estados](.scratch/oscar-frontend/issues/03-fase1-pantalla-fixtures-teclado.md)
3. Enseguida: [Fase 2 cablear API](.scratch/oscar-frontend/issues/05-fase2-cablear-api-real.md) (ya no espera a Rafael)
4. En paralelo AFK: [Research OpenRouter](.scratch/oscar-frontend/issues/02-research-openrouter-stt-tts.md) → [Mini-proxy TTS](.scratch/oscar-frontend/issues/09-mini-proxy-openrouter.md) → [Bocina](.scratch/oscar-frontend/issues/04-fase1-bocina-idempotente.md)
5. Luego: [Voz entrada](.scratch/oscar-frontend/issues/06-voz-entrada-parser-fijo.md) · [Prueba celular](.scratch/oscar-frontend/issues/07-prueba-en-celular.md)
6. Stretch: [Entregado](.scratch/oscar-frontend/issues/08-stretch-boton-entregado.md)

## Contrato Rafael (PASO 2)

**Base:** `https://merger-fish-gets-peace.trycloudflare.com`  
(el path `/webhooks/pey` es de pey; Oscar usa `/api/...`)

| Llamada | Uso |
|---|---|
| `POST /api/cobros` | `{monto, concepto, canal, telefono?}` → `{id, estado, monto, canal, qrImage}` |
| `GET /api/cobros/{id}` | Poll cada 2s |
| `GET /api/cobros/{id}/qr` | PNG directo (extra de Rafael; opcional vs `qrImage`) |
| `GET /api/eventos` | SSE: `creado`, `pagado`, `entregado`, `expirado`, `tardio`, `error` |
| `POST /api/cobros/{id}/entregar` | Stretch track #5 |

`pagado` → `{id, monto, hora, rastreoTerminacion, transactionId}` → verde + Bocina (1× por `transactionId`).  
Regla de oro: nunca verde por clic/timer.

## Cómo seguir

Claim **Fase 1 pantalla** e implementar UI. Si quieres, en la misma racha dejamos `VITE_API_BASE` apuntando al tunnel y pasamos a Fase 2 sin fixtures largos.
