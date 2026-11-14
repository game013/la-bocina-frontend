## Destination

Frontend de Oscar listo de punta a punta: pantalla del cajero implementada, probada en celular (cualquier navegador móvil disponible) y ejecutable. Fase 1 con fixtures (teclado, estados, QR, Bocina vía OpenRouter). Fase 2 cableada al server real (`POST /api/cobros`, SSE `/api/eventos`, poll `GET /api/cobros/:id`). Después: voz de entrada (MediaRecorder → mini-proxy → OpenRouter STT → parser fijo). Alcance completo sin atarse a la hora del hackatón; Oscar controla el ritmo.

## Notes

- **Dominio:** cobro por voz / CoDi vía pey; Oscar solo posee la pantalla.
- **Ejecución dentro del mapa:** sí — el destino es implementar, probar y ejecutar el frontend (override del “plan, don’t do” por defecto).
- **Costuras con Rafael:** contrato en mensaje PASO 2 + `DIVISION_TAREAS_14NOV.md` §4. **Base live:** `https://merger-fish-gets-peace.trycloudflare.com`. Extra: `GET /api/cobros/{id}/qr` (PNG). Credenciales pey/webhook no son de Oscar. Más adelante: mover OpenRouter al backend de Rafael.
- **Stack:** Vite + **TypeScript** modular (sin SPA framework). Módulos: estado, API cobros, Bocina, voz, fixtures. **Mini-backend FastAPI** en `server/` para `/api/voz/*` → OpenRouter; key en `server/.env` (gitignored). Arranque local mínimo (`uvicorn` + `npm run dev`). El front no lleva secretos. Repo: `game013/la-bocina-frontend` (se integrará luego con el mono-repo de Rafael).
- **Voz:** OpenRouter de una vez (STT + TTS) vía ese mini-proxy. No Web Speech como camino principal. Micrófono del browser solo para capturar audio. Tras STT: **parser fijo, sin LLM**. Cuando Rafael esté listo, se migran las rutas o se apaga el proxy.
- **Fases:** 1 = UI + teclado + estados (resolved); 2 = API cobros/SSE/poll → verde (resolved, Bocina pendiente); luego mic + STT + parser.
- **Entregado (track #5):** opcional, baja prioridad; no bloquea el destino.
- **Fuera de Oscar:** push CoDi, mini-MCP (salvo reaccionar a evento `creado`), candados pey, README/pitch/formulario.
- **Dispositivo:** iPhone (Safari/Chrome/Brave) u otro; teclado sigue siendo respaldo si falla red/STT.
- **Skills por sesión:** domain-modeling al tocar estados/glosario; grilling si reabre alcance; prototype al materializar UI/voz; research para modelos OpenRouter.
- **Progreso humano:** `PROGRESS.md` en la raíz del repo.

## Decisions so far

- [Destino: frontend Oscar completo](.scratch/oscar-frontend/map.md): implementación + prueba + ejecución del front; no solo el plan.
- Héroe: teclado/voz → QR monto fijo → aviso server → verde + Bocina; nunca verde por clic/timer/dictado.
- Formulario: listo el sábado; domingo es tope de envío (lo controla el equipo, no este mapa).
- Entregado: stretch opcional de baja prioridad.
- Rol: mapa y código de Oscar; server/credenciales pey ajenos.
- Fase 1 / 2: fixtures solo en front; sin ruta “simular pago” en server.
- Prueba móvil: cualquier navegador de celular.
- **Voz = OpenRouter primero** (STT + TTS) vía mini-proxy local; parser del monto fijo (sin LLM); sin Web Speech como camino principal.
- [Arquitectura de módulos del frontend](issues/01-arquitectura-modulos-front.md): Vite + **TypeScript** modular; front → `/api/voz/*` propio, no OpenRouter directo; mini-proxy FastAPI local.

## Not yet specified

- Modelos concretos OpenRouter (STT / TTS) y formato de audio — lo cierra el research.
- (cerrado en Notes) Mini-proxy = FastAPI; Express solo si el arranque local se volviera pesado.
- Frase exacta de la Bocina en la demo.
- Si el evento `creado` (MCP) se cablea junto con poll/SSE o en un pulido.
- Entregado: gradúa cuando Oscar lo active.
- Push en el parser (“al 55…”) solo si el server expone canal push.
- Migración definitiva de `/api/voz/*` al proceso de Rafael.

## Out of scope

- Credenciales pey, webhook, candados de cuenta, mini-MCP server, README, pitch, formulario, pantallazo falso (Gabriel/Rafael).
- Libreta de Fiado, panel del dueño, termómetro de UDIs.
- Construir `POST /codi/pn` desde el front como camino principal.
- Camino principal con Web Speech Recognition / speechSynthesis del navegador.
