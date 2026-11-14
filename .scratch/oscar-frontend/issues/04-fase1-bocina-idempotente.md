# Fase 1: Bocina (OpenRouter TTS) idempotente

Type: prototype
Status: open
Blocked by: 01, 02, 03, 09

## Question

¿Cómo implementamos la Bocina vía nuestro mini-proxy (`POST /api/voz/hablar`) para que: un toque de micrófono diga “Listo” (o tono corto) y habilite audio; al `pagado` cante el monto del evento (no el dictado) **una sola vez por `transactionId`**; frase configurable; si falla la red/TTS caiga a tono + verde — ejercitable con `?fake=1` sin key en el bundle?
