# TODOS

## Producto

### Meta: pasar a producción (Instagram + Messenger aprobados) y WhatsApp como Tech Provider

**Estado (2026-10-20, verificado en el panel):** app Publicada. Aprobados todos los permisos de Instagram/Messenger (`instagram_business_manage_messages`, `pages_messaging`, `pages_manage_metadata`, `pages_show_list`, `instagram_business_basic`, `instagram_basic`, `business_management`, `public_profile`). Negocio verificado (portfolio 104592773922483). ManyChat ya no existe en el código ni en los secrets del Worker.

**Pendiente (lo hace Germán en el panel de Meta):**
1. Probar con una cuenta que NO tenga rol en la app (cliente piloto): conectar y recibir un mensaje real.
2. WhatsApp / Tech Provider: "Verificación de acceso" ENVIADA el 2026-10-20 12:00 (plazo de Meta: 19-dic-2026; responden en ~5 días) → probar "Conectar WhatsApp" con un número real → App Review de `whatsapp_business_messaging` y `whatsapp_business_management` con video real → idealmente una configuración de Facebook Login for Business propia para WhatsApp (su ID va en `WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID` en `wrangler.toml`; hoy reusa `META_LOGIN_CONFIG_ID`) → webhook en `https://atiendemelapyme.cl/webhook/whatsapp` suscrito a `messages`.
   - **Coexistencia (número +56 9 2205 3594 sin sacarlo de la app del celular):** el código ya está (botón "Ya uso la app WhatsApp Business", no llama a `/register` si `is_on_biz_app`). Meta exige ser Tech Provider aprobado para usarla: probar cuando se apruebe la verificación de acceso. Antes, suscribir en el panel de Meta los campos de webhook `account_update`, `history`, `smb_app_state_sync` y `smb_message_echoes`. Pendiente (opcional): sincronizar contactos/historial con `smb_app_data` dentro de 24 h, y que Dominga no responda cuando el dueño ya está contestando desde el celular (`smb_message_echoes`).
   - **Número propio +56 9 2205 3594 funcionando (2026-10-20):** WABA "Atiéndeme la pyme" (2499189710563916) suscrita a la app con un token del usuario del sistema "Employee" (sin caducidad) guardado en `WHATSAPP_ACCESS_TOKEN`; `whatsapp.js` lo usa como respaldo porque el número no está en `whatsapp_connections`. Dominga ya responde.
   - **"Conectar WhatsApp" para clientes:** bloqueado hasta que Meta apruebe la verificación de acceso. Hoy no se puede crear una configuración de Embedded Signup (solo aparece la variación "General", sin "Cuentas de WhatsApp"); la config de Páginas (`META_LOGIN_CONFIG_ID`) no sirve (no pide WABA y su code falla por redirect_uri). Al aprobarse: crear config de Embedded Signup (token de usuario del sistema, caducidad "Nunca") y poner su ID en `WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID` en `wrangler.toml`.
3. Borrar de Cloudflare el token viejo de Página (`FACEBOOK_PAGE_TOKEN`; lo usaba el webhook legado de Instagram hasta `dedf948`, hoy nada lo lee): `npx wrangler secret delete FACEBOOK_PAGE_TOKEN`. **No** quitarle a la app el acceso a la Página en Meta: es la misma app de la conexión actual de Facebook/Instagram y la desconectaría.

**Landing:** decir "Tech Provider de Meta para WhatsApp Business" solo cuando Meta lo apruebe; nunca "oficial", "partner" ni el logo de Meta.

**Priority:** P1

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

### Cómo configurar un cliente nuevo (agenda automática lista desde 2026-10-21)

1. Supabase → tabla `clientes` → nueva fila: `nombre`, `bot_prompt` (servicios, precios, horarios, tono), `slot_minutes` y `horario`, por ejemplo `{"lun": [["09:00","13:00"],["15:00","19:00"]], "mar": ["09:00","19:00"], "sab": ["10:00","14:00"]}`.
2. El cliente comparte su Google Calendar con **gcorref@gmail.com** (Panel → Sistema lo muestra) con "Hacer cambios en los eventos". En `calendar_id` va el ID del calendario (su Gmail si es el principal).
3. Conectar sus cuentas desde el panel (Instagram / Página de Facebook; WhatsApp cuando Meta apruebe Tech Provider) y poner el `id` del cliente en `cliente_id` de esas filas.
4. Probar: escribirle al bot pidiendo hora y revisar que el evento aparece en su calendario.

**Pendiente:** prueba de punta a punta en producción con un calendario real.

**Priority:** P1

## Marketing

### Perfil de Google Business: falta verificar (creado 2026-10-20)

**Estado:** perfil "Atiéndeme la Pyme" creado en la cuenta gcorref@gmail.com como negocio de área de servicio (Región Metropolitana, dirección oculta). Categoría: Empresa de software. Teléfono y WhatsApp: +56 9 2205 3594 (chat → https://wa.me/56922053594, responde Dominga). Sitio: https://atiendemelapyme.cl. **Pendiente la verificación por video** (no aparece en Google hasta verificar): business.google.com → el perfil → Verificar.

**Guion del video (una toma, 30-60 s, sin cortes):** 1) afuera, calle o número de la dirección ingresada; 2) adentro, computador con atiendemelapyme.cl y el panel /admin con sesión ya iniciada (sin mostrar contraseñas ni secretos; pasar rápido por las conversaciones); 3) factura, boleta o e-RUT de HIGH LIFE SpA.

**Después de verificar, completar:** categoría adicional "Diseñador de sitios web", horario, servicios, logo y esta descripción (Google no permite enlaces en ella):

> Atiéndeme la Pyme instala asistentes de inteligencia artificial para pymes chilenas. El asistente responde las consultas de tus clientes por WhatsApp, Instagram, Facebook y tu sitio web, y agenda horas en tu Google Calendar, también de noche y los fines de semana, cuando tu equipo no alcanza a contestar. Lo entrenamos con la información real de tu negocio (servicios, precios y horarios) y tú supervisas cada conversación desde un panel. Trabajamos con clínicas, centros médicos, veterinarias, centros estéticos, peluquerías, kinesiólogos, psicólogos y spas. Implementación en 1 a 3 semanas, sin conocimientos técnicos y sin contratos largos. Agenda una demo gratuita de 20 minutos.

**Priority:** P2


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

### Otros menores

- **Modelo de borradores de correo:** `src/lib/email-inbound.js` usa el modelo por defecto de `src/lib/anthropic.js` (`claude-sonnet-4-5-20250929`). Cambiarlo es decisión de costo/calidad.
- **Herramientas de test con vulnerabilidades (solo desarrollo):** `@cloudflare/vitest-pool-workers` (0.22 y 0.23) trae su propio wrangler/miniflare con `sharp` y `undici` vulnerables. No llega a producción (`npm audit --omit=dev` = 0). Actualizar cuando salga una versión que use wrangler ≥ 4.131.
- **robots.txt administrado por Cloudflare:** bloquea bots de entrenamiento de IA (no los de búsqueda). Decidir si mantenerlo (se cambia en Cloudflare, no en el código).

## Completed

### Índice de horarios, PIN de WhatsApp y guardado atómico (hecho 2026-10-20)

SQL en `supabase/2026-10-20-guardado-atomico-pin-indice.sql`, aplicado en producción: índice único de horas en `scheduled_appointments`; `whatsapp_connections.two_step_pin` (se llena al registrar un número); función `append_chat_messages` (solo `service_role`) que agrega mensajes en una sola operación — la usan el chat web, WhatsApp/Instagram/Messenger y el chat en vivo, así que dos mensajes seguidos ya no se pisan.

### Pendientes de la revisión de código que esperaban al App Review (hecho 2026-10)

Firma `X-Hub-Signature-256` en el webhook de WhatsApp, PIN con `crypto.getRandomValues` y sessionId válido en el WebSocket (`c96b014`); el primer mensaje en WhatsApp/Instagram/Messenger va a Claude con divulgación de IA, "Desconectar" por POST (CSRF) y `/terminos` en "tú" (`7bf4c4c`, desplegado 2026-10-20). Secrets de ManyChat confirmados borrados del Worker.


### Pendientes no-Meta de la revisión de código (hecho 2026-09-14)

**What:** Se resolvió todo lo que no toca la integración con Meta:
- **Agenda sin doble reserva:** `checkAvailability` falla cerrado (503 si Supabase no responde), detecta choques con demos de 20 min, reserva la fila antes de crear el evento y la libera si Google Calendar falla. Rechaza fechas pasadas.
- **Correo de confirmación honesto:** el evento se crea con Google Meet (reintenta sin Meet si la cuenta no puede) y con `sendUpdates=all`, así que la invitación sí llega. Duración unificada en `DEMO_DURATION_MINUTES = 20`. El botón dice "Unirse a Google Meet" solo si el link es de Meet; si no, "Ver cita en Google Calendar".
- **Dominga deriva a hola@** (buzón público con Email Routing); la detección de escalamiento acepta hola@ y contacto@.
- **Chat web sin pérdida de historial:** `/api/chat` agrega el mensaje nuevo y la respuesta al historial guardado en vez de reemplazarlo. Antes, un visitante que recargaba la página borraba su conversación anterior y los mensajes del chat en vivo. `escalated` ya no se desmarca con el siguiente mensaje. El widget también guarda en su historial lo que el visitante escribe durante el chat en vivo.
- **Admin:** máximo 500 filas incrustadas por tabla, con los totales reales en las estadísticas.
- **Logs:** el cron de recordatorios ya no loguea nombre ni correo, y omite reservas provisionales (`pending:`).
- **Google Analytics:** se carga con la primera interacción o a los 6 s (antes bloqueaba ~300 ms el hilo principal en mobile).
- **wrangler.toml:** se quitó el `[env.production]` vacío que generaba la advertencia en cada deploy.

**Why:** Pedido explícito de Germán: hacer todo lo que no implique cambios en Meta mientras la app está en revisión de Tech Provider.

**Effort:** M
**Priority:** P1 (hecho)
**Depends on:** None

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
