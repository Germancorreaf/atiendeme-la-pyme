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

**What:** Se construyó el mecanismo de notificación por correo: `src/lib/escalation.js` detecta (a) cuando el visitante pide explícitamente hablar con una persona, o (b) cuando Dominga cae en su respuesta honesta de "no sé"/"te dejo anotado tu mensaje". `chat.js` guarda `escalated`/`escalation_reason` en `chat_sessions` (columnas nuevas en Supabase) y envía un correo real a `DRAFT_NOTIFICATION_EMAIL` (mismo buzón que ya recibe los borradores de correo entrante) con el mensaje del visitante, la respuesta de Dominga y un link a la conversación. El dashboard admin ahora muestra "Escalados a humano" y "Fuera de horario" (heurística sobre `updated_at`: fuera de L-V 9-19h Chile) como stats, más un badge "escalado" en la lista de conversaciones. Probado en vivo contra producción: sesión normal se guarda sin escalar, sesión con "quiero hablar con una persona" se marca `escalated=true` y dispara el correo.

**Why:** El copy de ventas prometía "transferencia a humano" sin que existiera. Ahora el "te dejo anotado tu mensaje" que dice el prompt de Dominga es cierto: German recibe un correo real cada vez que pasa.

**Context:** Bonus encontrado en el camino: `saveChatSession` en `chat.js` enviaba un campo `message_count` que no existe en el esquema de `chat_sessions` — Supabase rechazaba el insert desde el 2026-07-15 (commit `7c1ccd3`), así que **ninguna conversación del chat web se guardaba desde esa fecha** (WhatsApp/Instagram/ManyChat sí, porque usan otro código). Se corrigió en el mismo cambio. Sigue pendiente: WhatsApp como canal de notificación (se implementó solo email, que ya tenía la infraestructura lista).

**Effort:** M
**Priority:** P2 (hecho) — WhatsApp como canal adicional queda para más adelante si hace falta.
**Depends on:** ~~Piloto validado con compromiso de pago real~~ — ya no aplica, se hizo directamente.

### Reforzar seguridad del dashboard admin

**What:** Dos mejoras. (1) La comparación de la contraseña usaba `===`, vulnerable a timing attack — se reemplazó por comparación de tiempo constante (`src/lib/timingSafe.js`). (2) Se migró de Basic Auth con contraseña única a login por sesión propio: `POST /admin/login` valida la contraseña (mismo rate limiting de fuerza bruta de antes: 10 intentos/5min + ráfaga 3/5s por IP) y entrega una cookie HttpOnly+Secure+SameSite=Lax firmada con HMAC-SHA256 (`src/lib/adminSession.js`, secret `ADMIN_SESSION_SECRET`, expira sola a los 7 días, sin estado en el servidor). `GET /admin` sin cookie válida muestra un formulario de login en vez de la contraseña compartida; `POST /admin/logout` la invalida. Basic Auth quedó completamente descontinuado.

**Why:** Cierra el timing attack, y una cookie de sesión con expiración es más robusta que reenviar la misma contraseña en cada request para siempre (permite "cerrar sesión" de verdad, y limita la ventana si la cookie se filtra).

**Context:** Encontrado durante la revisión CEO del plan de validación (2026-08-26); ambas partes corregidas el 2026-09-06. Probado en vivo contra producción de punta a punta (login con password incorrecta, cookie válida generada con el secret real, endpoint de PageSpeed protegido, logout) sin necesitar la contraseña real del fundador. El secret de sesión se rotó después de las pruebas para invalidar la cookie usada en la verificación.

**Effort:** S (password) + M (sesión) — ambas hechas
**Priority:** P2 (hecho)
**Depends on:** None

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
