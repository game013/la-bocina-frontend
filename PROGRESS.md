# PROGRESS · La Bocina · frontend Oscar

Índice de avance humano. El mapa canónico está en [`.scratch/oscar-frontend/map.md`](.scratch/oscar-frontend/map.md).

## Destino

Pantalla del cajero implementada, probada en celular y ejecutable: **fase 1 (UI + teclado + estados)** → **fase 2 (API Rafael)** → **Bocina OpenRouter** → **voz de entrada**. Entregado = stretch.

## Estado ahora

| | |
|---|---|
| Mapa | [Oscar frontend](.scratch/oscar-frontend/map.md) |
| Cerrado | Arquitectura · **Fase 1 pantalla** · **Fase 2 API** (cobro→QR→poll/SSE→verde) |
| Repo | https://github.com/game013/la-bocina-frontend |
| **Server Rafael** | `https://merger-fish-gets-peace.trycloudflare.com` · `VITE_API_BASE` en `.env` |
| Siguiente | [Bocina](.scratch/oscar-frontend/issues/04-fase1-bocina-idempotente.md) (tras research/proxy) · [Prueba celular](.scratch/oscar-frontend/issues/07-prueba-en-celular.md) |

## Frontera (orden práctico ahora)

1. ~~Arquitectura~~ · ~~aviso Rafael~~ · ~~Fase 1 pantalla~~ · ~~Fase 2 cablear API~~ → **listo**
2. **Ahora / paralelo:** [Research OpenRouter](.scratch/oscar-frontend/issues/02-research-openrouter-stt-tts.md) → [Mini-proxy TTS](.scratch/oscar-frontend/issues/09-mini-proxy-openrouter.md) → [Bocina](.scratch/oscar-frontend/issues/04-fase1-bocina-idempotente.md)
3. Luego: [Voz entrada](.scratch/oscar-frontend/issues/06-voz-entrada-parser-fijo.md) · [Prueba celular](.scratch/oscar-frontend/issues/07-prueba-en-celular.md)
4. Stretch: [Entregado](.scratch/oscar-frontend/issues/08-stretch-boton-entregado.md)

## Contrato Rafael (PASO 2)

**Base:** `https://merger-fish-gets-peace.trycloudflare.com`  
(Oscar usa `/api/...`; en DEV Vite proxifica cobros/eventos por CORS)

| Llamada | Uso |
|---|---|
| `POST /api/cobros` | `{monto, concepto, canal, telefono?}` → `{id, estado, monto, canal, qrImage}` |
| `GET /api/cobros/{id}` | Poll cada 2s |
| `GET /api/cobros/{id}/qr` | PNG directo (opcional vs `qrImage`) |
| `GET /api/eventos` | SSE: `creado`, `pagado`, `entregado`, `expirado`, `tardio`, `error` |
| `POST /api/cobros/{id}/entregar` | Stretch track #5 |

`pagado` → verde (+ Bocina 1× por `transactionId` cuando 04 esté). Regla de oro: nunca verde por clic/timer.

## Cómo seguir

Arranque: `npm run dev` (proxy → Rafael). Demo sin API: `?fixture=1`.  
Siguiente héroe de voz: Mini-proxy + Bocina; o prueba en celular del cobro real.
