# Fase 2: cablear API real (POST + SSE + poll)

Type: task
Status: open
Blocked by: 03

## Question

¿Qué cambios concretos conectan la pantalla al server de Rafael?

**Base URL (2026-11-14):** `https://merger-fish-gets-peace.trycloudflare.com`

- `POST /api/cobros` → pintar `qrImage` (base64; opcional `GET /api/cobros/{id}/qr` como PNG)
- `GET /api/eventos` (SSE) + poll `GET /api/cobros/{id}` cada 2s
- Al `pagado` → verde (+ Bocina cuando 04 esté listo; si no, verde sin voz)
- Opcional: reaccionar a `creado` (MCP)
- `VITE_API_BASE` (o config) apuntando al tunnel; sin secretos pey en el front

Rafael ya avisó: endpoints expuestos. Bocina/Entregado no bloquean cablear el cobro+QR+verde.
