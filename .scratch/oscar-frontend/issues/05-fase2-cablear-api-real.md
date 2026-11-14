# Fase 2: cablear API real (POST + SSE + poll)

Type: task
Status: open
Blocked by: 03, 04

## Question

¿Qué cambios concretos quitan la dependencia de fixtures en el camino feliz y conectan: `POST /api/cobros` → pintar `qrImage`; escuchar `GET /api/eventos` (SSE) + `GET /api/cobros/:id` cada 2s; al `pagado` → verde + Bocina (misma ruta que fase 1); opcionalmente reaccionar a `creado` para cobros del MCP? Requiere aviso de Rafael de que los endpoints responden de verdad.
