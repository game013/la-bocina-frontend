# Fase 1: pantalla, fixtures, teclado y estados

Type: prototype
Status: in-progress
Claimed by: wayfinder
Blocked by: 01

## Question

¿Cómo se ve y se comporta la pantalla del cajero con datos falsos: monto gigante, teclado numérico siempre visible, QR desde `qrImage` de fixture, y todos los estados visuales (`pendiente`, `pagado`, `expirado`, `tardio`, `error`, sin conexión) sin cablear el server real?

## Answer (en curso)

Módulos `src/ts/{types,state,fixtures,ui}.ts` + `main.ts`. Teclado siempre visible; monto en centavos vía dígitos; QR desde base64; vistas por `data-vista`. Demo fixtures: `?fixture=1` (botón «Simular pagado» — solo fixtures; nunca verde por timer). Siguiente: cablear API real (issue 05).
