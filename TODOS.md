# TODOS

## Producto

### Plan Experto — voicebot es entregable bajo pedido, no corre por defecto

**What:** El Plan Experto ($449.990 + $179.990/mes) vende "llamadas y voicebot" — un asistente de voz que "contesta llamadas... con acento chileno neutro". No hay integración de voz/telefonía corriendo en este código (sin Twilio, sin API de voz activa).

**Why:** Aclarado con el fundador (2026-09-06): el voicebot ya fue probado y validado con ElevenLabs — la capacidad existe y es entregable si un cliente lo contrata. No se mantiene corriendo en producción por defecto para no pagar el costo de una integración sin cliente activo. No es una promesa vacía, es un modelo de "se activa/construye cuando se vende", igual que la implementación de los otros planes.

**Context:** Bajado de prioridad tras la aclaración; ya no se considera un riesgo de honestidad. Si en el futuro se decide dejarlo siempre activo (ej. demo en vivo en la landing), reevaluar esfuerzo.

**Effort:** —
**Priority:** P3
**Depends on:** None

### Escalamiento real a humano en el chat en vivo

**What:** Construir un mecanismo real de notificación (email/WhatsApp al dueño) cuando el bot no puede resolver algo o el usuario pide hablar con una persona, más métricas en el dashboard admin (mensajes fuera de horario, tasa de resolución bot vs. escalado).

**Why:** El copy de ventas prometía "transferencia a humano" sin que existiera. Mientras dure la validación se resuelve con revisión manual del dashboard + una respuesta honesta del bot (ver decisión D2 en `docs/designs/validacion-piloto-ventas-nocturnas.md`), pero un cliente pagando real necesita el mecanismo de verdad.

**Context:** Corresponde a "Approach B" del plan de validación — deliberadamente diferido hasta después del piloto para no retrasar la primera conversación de venta. Si el piloto con la empresa donde trabaja el fundador se convierte en cliente, esto pasa a ser prioritario.

**Effort:** M
**Priority:** P2
**Depends on:** Piloto validado con compromiso de pago real.

### Reforzar seguridad del dashboard admin (parcial)

**What:** La comparación de la contraseña en `checkAdminAuth` (`src/api/admin.js`) usaba `===`, vulnerable a timing attack (un atacante puede inferir la contraseña carácter por carácter midiendo cuánto tarda cada intento). Se reemplazó por una comparación de tiempo constante (XOR byte a byte sobre el largo completo). El rate limiting del login (10 intentos/5min + ráfaga de 3/5s por IP, en `checkAdminBruteForce`) ya existía y se revisó: sigue pareciendo razonable para un solo operador.

**Why:** Es la mejora de mayor impacto para el esfuerzo S ya escrito en este ítem — cierra una vulnerabilidad real y concreta sin cambiar cómo el fundador inicia sesión hoy.

**Context:** Encontrado durante la revisión CEO del plan de validación (2026-08-26); corregido el 2026-09-06. Sigue pendiente si en algún momento se quiere migrar de una sola contraseña compartida (Basic Auth) a auth por sesión con login propio — eso es un cambio más grande (M+), no cabe en el esfuerzo S original. Se deja abierto para cuando el admin maneje datos de un cliente pagando de forma sostenida.

**Effort:** S (hecho) — migrar a auth por sesión sería M+
**Priority:** P2
**Depends on:** El piloto se convierte en cliente pagando sostenido (para justificar la migración a auth por sesión).

## Marketing

### Sección de testimonios/casos de éxito en la landing

**What:** Agregar una sección en la landing pública para mostrar resultados reales (ej. "recuperamos X ventas nocturnas para [cliente]") una vez que exista un caso validado.

**Why:** Hoy la landing no tiene ningún espacio para mostrar prueba social — si el piloto funciona, no hay dónde exhibirlo.

**Context:** Surgió durante la revisión CEO del plan de validación. Depende de tener un resultado real que mostrar (piloto en curso).

**Effort:** S
**Priority:** P3
**Depends on:** Resultado medible del piloto.

### Método de cobro integrado

**What:** Integrar un método de cobro real (Webpay, Flow, o similar) en vez de depender de transferencia manual.

**Why:** Hoy no hay ninguna pasarela de pago en el código — cualquier cobro (incluso el piloto simbólico) sería manual fuera de la app.

**Context:** Aceptable para un piloto único; no escala a más de un cliente pagando.

**Effort:** S
**Priority:** P3
**Depends on:** Más de un cliente pagando validado.

## Infraestructura

## Completed

### Tests automatizados y CI

**What:** Se agregó una suite de 82 tests con `@cloudflare/vitest-pool-workers` (corren dentro del runtime real de Workers, no un mock de Node): validación completa de `validator.js`, redacción de secretos y manejo de errores en `errors.js`, rate limiting con el KV real de `wrangler.toml`, autenticación del admin (`checkAdminAuth`), la capa de validación de `/api/chat` y `/api/schedule` (sin mockear Anthropic/Supabase/Calendar — la validación corre antes de tocar cualquier servicio externo), y un smoke test de rutas estáticas (`/`, `/terminos`, `/privacidad`, `robots.txt`, `sitemap.xml`, 404, redirect www→apex, `/admin` sin auth). CI en GitHub Actions corre `npm test` en cada push/PR a `main`.

**Why:** El proyecto no tenía ningún test ni CI configurado — todo el despliegue era manual vía `wrangler deploy`. Encontrado durante la revisión CEO del plan de validación (2026-08-26).

**Effort:** M
**Priority:** P3
**Completed:** 2026-09-06

### Sacar "automática" de la promesa de transferencia a humano

**What:** Los planes Básico y Recomendado en la landing (`src/index.js`) decían "Transferencia automática a un humano cuando no puede resolver". Se cambió a "Transferencia a un humano cuando no puede resolver": el fundador sí puede transferir la conversación a una persona, pero de forma manual, no automática.

**Why:** El texto anterior prometía un mecanismo automático inexistente. Encontrado en la revisión de copy de la landing (2026-08-26), aclarado y corregido el 2026-09-06.

**Effort:** S
**Priority:** P1
**Completed:** 2026-09-06

### Arreglar número de WhatsApp placeholder en la landing

**What:** El link de WhatsApp en `src/index.js` (y en `src/lib/vertical-pages.js`) apuntaba a `wa.me/56900000000` — número placeholder, no funcionaba. Reemplazado por el número real del negocio (+56 9 2205 3594) en ambos archivos.

**Why:** Encontrado en QA en vivo del sitio (2026-08-26): un prospecto que hacía clic en "WhatsApp" no llegaba a nadie.

**Effort:** S
**Priority:** P0
**Completed:** 2026-09-04
