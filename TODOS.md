# TODOS

## Producto

### Integración nativa con Meta (Instagram + Messenger) — reemplaza a ManyChat

**What:** Se construyó el reemplazo de ManyChat como intermediario de Instagram/Messenger: flujo OAuth "Facebook Login for Business" (`src/api/meta-connect.js`, rutas `/admin/meta/connect` y `/admin/meta/callback`, protegidas por la sesión de admin) que conecta una Página de Facebook y su cuenta de Instagram vinculada, guarda el Page Access Token en una tabla nueva de Supabase (`meta_connections`) y suscribe la app a `messages`/`messaging_postbacks` de esa Página; webhook nativo (`src/api/meta-webhook.js`, ruta `/webhook/meta`) que verifica el challenge de Meta, valida la firma `X-Hub-Signature-256` (HMAC timing-safe), deduplica por `message.mid` en KV, procesa en segundo plano (`ctx.waitUntil`) y responde vía Send API (`POST /{PAGE_ID}/messages`) usando la misma lógica de Claude que ya usan los otros canales.

**Why:** Al preparar el screencast para el permiso `instagram_business_basic` del App Review de Meta, se descubrió que el diálogo de autorización dentro de ManyChat pide acceso para "Manychat", no para la app "Atiéndeme la pyme" (App ID `4305884926391021`) — y ManyChat no soporta bring-your-own-app. No había forma honesta de grabar la evidencia que pide Meta mientras el flujo pasara por ManyChat. Ver memoria de proyecto para el contexto completo del App Review.

**Context:** El 2026-09-09 se retiró por completo el código de ManyChat (`src/api/chat-manychat.js` y las rutas `/api/chat-manychat` en `src/index.js`) durante una auditoría de seguridad disparada por una advertencia de Google Search Console de "páginas engañosas" en el dominio — el código propio resultó estar limpio, pero se aprovechó para eliminar el intermediario que ya no correspondía tener corriendo. Falta como acción de seguimiento (no ejecutada por el asistente, requiere que Germán la corra): `wrangler secret delete MANYCHAT_SHARED_SECRET` y `wrangler secret delete ANTHROPIC_API_KEY_MANYCHAT` para no dejar esas credenciales vivas sin usarlas. Pendiente para dejar la integración nativa lista para probarse de punta a punta con la cuenta real @atiendemelapyme: (1) Germán tiene que correr él mismo `wrangler secret put META_APP_SECRET` y `wrangler secret put META_VERIFY_TOKEN` (el asistente no debe generar ni tipear esos valores por regla explícita), (2) registrar `https://atiendemelapyme.cl/admin/meta/callback` como Valid OAuth Redirect URI en el panel de Meta, (3) configurar el webhook `/webhook/meta` con ese mismo verify token en Meta, (4) entrar a `/admin` y presionar "Conectar Instagram/Facebook", (5) probar un mensaje real de punta a punta. Una vez validado, ese mismo flujo de conexión sirve como screencast genuino para `instagram_business_basic` — pendiente grabarlo y subir el resto de videos de "Uso permitido" antes de poder enviar la revisión (que requiere confirmación fresca de Germán antes de presionar el botón final, sin excepción).

**Effort:** L (código hecho; falta la prueba end-to-end con cuenta real, que solo puede hacer Germán)
**Priority:** P1
**Depends on:** Que Germán configure los secrets/webhook en el panel de Meta y pruebe la conexión real.

### Plan Experto — voicebot es entregable bajo pedido, no corre por defecto

**What:** El Plan Experto ($449.990 + $179.990/mes) vende "llamadas y voicebot" — un asistente de voz que "contesta llamadas... con acento chileno neutro". No hay integración de voz/telefonía corriendo en este código (sin Twilio, sin API de voz activa).

**Why:** Aclarado con el fundador (2026-09-06): el voicebot ya fue probado y validado con ElevenLabs — la capacidad existe y es entregable si un cliente lo contrata. No se mantiene corriendo en producción por defecto para no pagar el costo de una integración sin cliente activo. No es una promesa vacía, es un modelo de "se activa/construye cuando se vende", igual que la implementación de los otros planes.

**Context:** Bajado de prioridad tras la aclaración; ya no se considera un riesgo de honestidad. Si en el futuro se decide dejarlo siempre activo (ej. demo en vivo en la landing), reevaluar esfuerzo.

**Effort:** —
**Priority:** P3
**Depends on:** None

### Integración con AgendaPro — no está construida, pero es fácil con el plan Pro

**What:** Los planes Recomendado y Experto mencionan "Google Calendar o Agenda Pro" como opciones de agenda. Solo Google Calendar está integrado en el código (`src/lib/google-calendar.js`); AgendaPro no tiene ninguna línea de código todavía.

**Why:** Aclarado con el fundador (2026-09-07): con la versión Pro de AgendaPro la integración es fácil de construir (a diferencia de Calendly, que se sacó del copy por no tener un camino claro de integración). Mismo criterio que el voicebot: no es una promesa vacía, se construye cuando un cliente lo pide.

**Context:** Se decidió NO sacar "Agenda Pro" del copy de precios, a diferencia de Calendly.

**Effort:** M (cuando un cliente lo pida)
**Priority:** P3
**Depends on:** Un cliente que la pida.

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

## Revisión de código (2026-09-14) — pendientes para después del App Review de Meta

Hallazgos de una revisión completa del código que **no se implementaron a propósito**: cambian el comportamiento del producto o tocan la integración con Meta/WhatsApp, y Germán prefiere no arriesgar nada mientras la app está en revisión. Retomar cuando el App Review esté aprobado. (La limpieza sin riesgo de esa misma revisión sí se hizo: open redirect del login, errores 5xx sin detalles internos, 404 en `/constructor`, fechas imposibles, voseo en el prompt, código muerto, envío de correos unificado.)

### 🔴 Verificar la firma de Meta en el webhook de WhatsApp

**What:** `src/api/whatsapp.js` (`POST /webhook/whatsapp`) procesa cualquier POST sin validar `X-Hub-Signature-256`. `src/api/meta-webhook.js` ya lo hace bien (`verifySignature` + `timingSafeEqual`); hay que reusar esa misma lógica en WhatsApp.

**Why:** Cualquiera que conozca la URL puede mandar un payload falso con un `phone_number_id` conectado y un `from` arbitrario: el bot llama a Claude (gasto) y envía un WhatsApp desde el número del negocio a ese número (spam desde la cuenta, riesgo de bloqueo de Meta). El rate limit es por `from`, que controla el atacante.

**Context:** Antes de implementarlo, confirmar qué App Secret firma los webhooks de WhatsApp (probablemente `META_APP_SECRET`, la app del Embedded Signup; revisar también el número de prueba que usa `WHATSAPP_ACCESS_TOKEN`). Si se usa el secret equivocado, se rechazan todos los mensajes reales — probar con un mensaje real inmediatamente después del deploy. Agregar tests como los de `test/api/meta-webhook.test.js`.

**Effort:** S
**Priority:** P1
**Depends on:** App Review de Meta aprobado.

### Doble agenda si Supabase falla

**What:** `checkAvailability` en `src/api/schedule.js` devuelve `{ available: true }` ante cualquier error (Supabase caído, respuesta no-JSON, credenciales faltantes), así que agenda igual. Tampoco hay restricción única en la tabla `scheduled_appointments` sobre `(appointment_date, appointment_time)`, y dos requests simultáneas pueden pasar el chequeo a la vez.

**Why:** El copy promete "sin dobles reservas".

**Context:** Opciones: fallar cerrado (responder 503 "no pude confirmar disponibilidad") y/o agregar un unique index en Supabase y tratar el error de conflicto como 409. Además, si el evento de Google Calendar se crea pero `saveAppointment` falla, la cita queda en el calendario pero no en la base (no recibe recordatorio).

**Effort:** S
**Priority:** P2
**Depends on:** None

### El primer mensaje en WhatsApp/Instagram/Messenger ignora lo que escribió el cliente

**What:** En `src/api/whatsapp.js` y `src/api/meta-webhook.js`, si no hay historial se responde con `getRandomGreeting()` en vez de pasar el mensaje a Claude. Si el cliente escribe "¿tienen hora mañana a las 10?", recibe un saludo genérico y su pregunta queda sin respuesta.

**Why:** El chat web evita esto a propósito (ver el comentario en `src/api/chat.js`: "el primer mensaje que llega acá es siempre un mensaje real del usuario, y siempre debe ir a Claude"). Además, los saludos hablan de "tu negocio" como si el cliente fuera un dueño de pyme — sirve para la cuenta de Atiéndeme la Pyme, pero no para los bots de clientes conectados.

**Context:** Tocar solo después del App Review: cambia lo que se ve en los screencasts de mensajería.

**Effort:** S
**Priority:** P2
**Depends on:** App Review de Meta aprobado.

### Dominga manda a escribir a contacto@ pero el sitio usa hola@

**What:** El system prompt (`src/lib/dominga-prompt.js`, bloque "SI NO SABES") y el patrón de `src/lib/escalation.js` usan `contacto@atiendemelapyme.cl`. La landing, el menú y `llms.txt` usan `hola@atiendemelapyme.cl`, y según `src/lib/email-inbound.js` solo hola@ tiene regla de Email Routing.

**Why:** Si contacto@ no recibe correo, los visitantes que Dominga deriva ahí se pierden.

**Context:** Confirmar si contacto@ recibe correo. Si no, cambiar el prompt y el patrón de escalamiento (y su test en `test/lib/escalation.test.js`) a hola@. `contacto@` también es el remitente por defecto de Resend (`DEFAULT_FROM_EMAIL` en `src/lib/email.js`) — eso puede quedar como está si el dominio está verificado.

**Effort:** S
**Priority:** P2
**Depends on:** Confirmar qué buzones reciben correo.

### El correo de confirmación de cita promete cosas que no pasan

**What:** En `sendConfirmationEmail` (`src/lib/email.js`):
- El botón dice "Unirse a Google Meet", pero `createCalendarEvent` no crea link de Meet (no pide `conferenceData`); el link es la página del evento en Google Calendar. Lo mismo en el recordatorio.
- Dice "DURACIÓN: 20 minutos", pero el evento se crea de 60 (`durationMinutes = 60` por defecto en `src/lib/google-calendar.js`).
- Dice "También recibirás una invitación directa en tu calendario", pero el evento se crea sin `sendUpdates=all`, así que probablemente Google no le manda la invitación al cliente.

**Why:** Principio de producto: nunca prometer algo que no pasa.

**Context:** Decidir: (a) crear Meet de verdad (`conferenceDataVersion=1` + `createRequest`) y enviar invitación (`sendUpdates=all`), o (b) cambiar el texto del correo. Unificar la duración en una sola constante.

**Effort:** S
**Priority:** P2
**Depends on:** Decisión de Germán sobre Meet/duración.

### "Desconectar" cuentas con un link GET (CSRF)

**What:** `/admin/meta/connections/delete` y `/admin/whatsapp/connections/delete` borran conexiones con un GET. La cookie de sesión es `SameSite=Lax`, que sí se envía en navegaciones GET desde otro sitio.

**Why:** Un link malicioso abierto con la sesión de admin activa podría desconectar una cuenta de Instagram/Facebook/WhatsApp de un cliente.

**Context:** Cambiar a `POST` (formulario con botón en `src/api/admin.js`, `connectionsCardHtml` y `whatsappConnectionsCardHtml`) y actualizar las rutas en `src/index.js`. Riesgo bajo, pero toca las rutas de Meta: esperar al App Review.

**Effort:** S
**Priority:** P2
**Depends on:** App Review de Meta aprobado.

### PIN de verificación en dos pasos de WhatsApp: aleatorio débil y no se guarda

**What:** `onRequestPostExchange` en `src/api/whatsapp-connect.js` registra el número con un PIN de 6 dígitos generado con `Math.random()` y no lo guarda en ningún lado.

**Why:** `Math.random` no es criptográficamente seguro, y si más adelante hay que re-registrar el número o migrarlo, nadie conoce el PIN (hay que resetearlo desde Meta Business Manager).

**Context:** Usar `crypto.getRandomValues` y guardar el PIN en `whatsapp_connections` (columna nueva, con el mismo tratamiento que `access_token`), o documentar el proceso de reseteo.

**Effort:** S
**Priority:** P3
**Depends on:** App Review de Meta aprobado.

### Posible pérdida de mensajes del chat en vivo

**What:** `saveChatSession` en `src/api/chat.js` hace upsert de la columna `messages` completa con el historial que manda el navegador. `ChatRoom.persistMessage` (`src/durable-objects/ChatRoom.js`) agrega los mensajes del chat en vivo a esa misma columna. Si el widget vuelve a llamar a `/api/chat` después de un traspaso sin incluir esos mensajes, el upsert los sobrescribe.

**Why:** Se perdería del dashboard lo que Germán escribió en vivo.

**Context:** Verificar primero si el widget incluye los mensajes humanos en el historial que manda. Si no, hacer que `chat.js` agregue (append) en vez de reemplazar, o guardar los mensajes en vivo en otra columna.

**Effort:** S
**Priority:** P3
**Depends on:** None

### Código duplicado en los webhooks de mensajería

**What:** `getConversationHistory`, `getClaudeReply` y `saveMessage` están casi idénticos en `src/api/whatsapp.js` y `src/api/meta-webhook.js`, y los headers de Supabase se repiten en ~20 lugares. Extraer a un módulo compartido (ej. `src/lib/chatSessions.js`). `saveMessage` además hace leer-y-escribir sin transacción (dos mensajes seguidos pueden pisarse).

**Why:** Mantenibilidad: un arreglo en un canal hoy no llega al otro.

**Context:** No se hizo en la revisión porque los tests no cubren esa parte del flujo y la integración con Meta está en revisión. Agregar tests del camino completo (historial → Claude → guardar → Send API, con `fetch` falso) antes de refactorizar.

**Effort:** M
**Priority:** P3
**Depends on:** App Review de Meta aprobado.

### Otros menores

- **Modelo de borradores de correo:** `src/lib/email-inbound.js` usa el modelo por defecto de `src/lib/anthropic.js` (`claude-sonnet-4-5-20250929`); todos los demás canales usan Haiku 4.5. Decidir si actualizarlo.
- **Admin sin paginación:** `/admin` carga todas las filas de `chat_sessions` y `scheduled_appointments` en la página; con volumen real va a ponerse lento.
- **Logs con datos personales:** `src/lib/reminder-cron.js` loguea nombre y correo de cada cliente, y los logs de Workers quedan persistidos (`observability.logs.persist = true`).
- **Webhook legado `/webhook/instagram`:** solo responde la verificación GET. Si la suscripción antigua ya no está en el panel de Meta, borrar `src/api/instagram.js` y su ruta.

## Completed

### Chat en vivo: transferencia real a un humano en tiempo real

**What:** Además del correo de notificación (ver ítem de escalamiento más abajo), se construyó el traspaso real en tiempo real dentro del mismo widget del sitio. Un Durable Object (`src/durable-objects/ChatRoom.js`, uno por sesión de chat) relaya mensajes por WebSocket entre el visitante (`/ws/chat/:sessionId`) y el admin (`/ws/admin-chat/:sessionId`, protegido con la cookie de sesión). En el dashboard, cada conversación escalada tiene un botón "🔴 Tomar en vivo" que abre un panel flotante (igual al widget público) donde German escribe directo; el visitante ve "🟢 Alguien del equipo se unió al chat" y sus mensajes dejan de pasarle a Claude mientras dura la sesión en vivo. Al cerrar el panel, Dominga retoma sola. Toda la conversación (bot + mensajes en vivo) queda en la misma columna `messages` de Supabase, sin duplicar historial.

**Why:** El usuario preguntó explícitamente cómo lograr un traspaso en tiempo real (no solo una notificación asíncrona). Se evaluaron dos caminos (handoff a WhatsApp vs. chat en vivo in-page); se eligió chat en vivo.

**Context:** Requiere Durable Objects — se verificó primero que la cuenta de Cloudflare los soporta gratis usando el backend SQLite (`new_sqlite_classes`, no `new_classes`, que sí exige plan pagado). Probado de punta a punta contra producción real (login admin, WebSocket visitante + admin, relay en ambas direcciones, `human_joined`/`human_left`, persistencia en Supabase), verificado también visualmente en el dashboard. 4 tests nuevos para el relay del Durable Object (incluye un caso de "spoofing": un visitante no puede hacerse pasar por admin) + 3 para el gating de las rutas WebSocket.

**Effort:** L
**Priority:** — (pedido directo, fuera del TODOS original)
**Completed:** 2026-09-07

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
