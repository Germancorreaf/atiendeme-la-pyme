# Atiéndeme la Pyme — manual para Claude Code

Cloudflare Worker (`atiendeme-la-pyme`, dominio `atiendemelapyme.cl`) con la landing, el panel `/admin`
y "Dominga", un bot con IA que responde por web, Messenger, Instagram y WhatsApp.
Datos en Supabase; modelo: API de Anthropic. Idioma del proyecto: español de Chile.

## Antes de tocar nada
1. `git status` y `git log --oneline -3`. **Si hay archivos modificados que no son tuyos, otra sesión está
   trabajando: no los edites, no los incluyas en tu commit, no los reviertas.** Commitea solo tus archivos
   (`git add <archivo>`, nunca `git add -A`).
2. Trabaja siempre en `~/atiendeme-la-pyme`, la única copia del repo. Si aparece otra copia (Escritorio,
   Descargas…) es vieja: no se usa ni se despliega desde ahí (la del Escritorio estaba 100+ commits atrás y se
   retiró el 2026-10-02).

## Comandos
- `npm test` — vitest con el pool de Cloudflare Workers (hay que dejarlo en verde antes de commitear).
- `npm run dev` — wrangler local.
- `npm run deploy` — ejecuta primero `scripts/predeploy-check.mjs` (rama `main`, árbol limpio, al día con
  `origin/main`) y luego los tests. Si hay cambios ajenos sin commitear, **despliega desde una copia limpia**:
  `git worktree add /tmp/deploy <commit>` + enlace a `node_modules`, y bórrala al terminar.
  `ALLOW_DIRTY_DEPLOY=1` salta el guardia: úsalo solo a conciencia.

## Mapa
- `src/index.js` — landing (HTML en strings, incluye imágenes en base64) y enrutador. Es enorme: no lo
  reformatees ni lo muevas de sitio sin un motivo concreto.
- `src/api/` — `chat.js` (web), `meta-webhook.js` (Messenger + Instagram), `whatsapp.js`, `meta-connect.js` y
  `whatsapp-connect.js` (conexión de cuentas), `admin.js` (panel), `schedule.js` (agenda).
- `src/lib/` — `dominga-prompt.js` (prompt, saludos y divulgación de IA), `chatSessions.js` (flujo común de respuesta
  de WhatsApp/Instagram/Messenger), `metaConnections.js`, `anthropic.js`, etc.
- `src/durable-objects/ChatRoom.js` — chat en vivo/escalamiento a humano.
- `test/` — espejo de `src/`. Sin tests aún: `email-inbound`, `email-template`,
  `google-calendar`, `reminder-cron`, `vertical-pages`, `whatsappConnections`, `timingSafe`.
- `supabase/` — SQL que se corre a mano en el SQL Editor de Supabase (con fecha), para tener registro.
- `PRODUCT.md` (propuesta de valor, reglas de honestidad) · `DESIGN.md` (sistema de diseño) · `TODOS.md`.

## Reglas que no se negocian
- **Secretos:** nunca en el repo, en logs ni en mensajes. Los valores los pega Germán (wrangler secret /
  Supabase). El scanner dará falsos positivos en `src/index.js` (base64 con muchas "A"): no son credenciales.
- **Dominga siempre se identifica como IA.** Está forzado en código (`withAiDisclosure` en `dominga-prompt.js`,
  usado por `meta-webhook.js` y `whatsapp.js`) y cubierto por tests. No lo quites ni lo debilites.
- **Honestidad de producto (PRODUCT.md):** no inventar métricas, casos de éxito ni políticas de facturación.
- **Meta tiene dos conexiones posibles para el mismo Instagram** (tabla `meta_connections`, clave `page_id`):
  "Conectar Instagram" → `page_id` = ID de Instagram + token de Instagram; "Conectar Página de Facebook" →
  `page_id` = ID de la Página + token de Facebook + `ig_business_account_id`. El host de la Graph API
  (`graph.instagram.com` vs `graph.facebook.com`) depende del **tipo de token**, no del canal
  (`usesInstagramToken`, `pickInstagramConnection`). Mezclarlos da "Cannot parse access token".

## Bot de cada cliente
- Tabla `clientes` (`supabase/2026-10-20-clientes.sql`): `nombre`, `bot_prompt` (información del negocio que escribe
  Germán), `calendar_id`, `horario` (jsonb `{"lun": ["09:00","18:00"], "sab": [["10:00","13:00"]]}`; claves
  dom..sab, sin clave = cerrado, colación = varios rangos) y `slot_minutes`. Las conexiones apuntan con `cliente_id`
  (en `meta_connections` y `whatsapp_connections`). Un mismo Instagram puede tener dos filas (ver arriba): ambas con
  el mismo `cliente_id`.
- Con `bot_prompt`, Claude responde como "la asistente de IA de {nombre}" (`botFor` / `buildClientPrompt`); sin
  cliente ni `bot_prompt` = Dominga de Atiéndeme la Pyme. `bot_prompt` en la conexión sigue funcionando (legado).
- Agenda automática (`lib/booking.js`): con `calendar_id` + `horario`, Claude usa `consultar_disponibilidad` y
  `agendar_hora` y reserva en el Google Calendar del cliente. El cliente comparte su calendario con la cuenta del
  sistema (la del `GOOGLE_REFRESH_TOKEN`; hoy gcorref@gmail.com, se ve en Panel → Sistema) con permiso "Hacer cambios
  en los eventos". Solo se reservan horas que el calendario confirma libres; tope 3 reservas por persona al día.
- Los avisos de escalamiento llegan a Germán con el nombre del cliente en el asunto.

## App Review de Meta
Instagram/Messenger: aprobado (2026-10-20). WhatsApp (Tech Provider): pendiente. Mientras la revisión de
WhatsApp siga abierta, **no renombres los textos y botones del panel que salen en los videos** (`Conectar WhatsApp`,
`Desconectar`, tarjeta "Conexión con Meta") ni cambies `OAUTH_SCOPES` (`meta-connect.js`) ni las URLs de
los webhooks sin avisar a Germán.

## Convenciones
- Commits en español, estilo `tipo(ámbito): qué y por qué` (`fix(instagram): …`, `chore: …`).
- Cambios de comportamiento ⇒ test que falle sin el cambio. Corre `npm test` completo antes de subir.
- Ramas de trabajo se borran al integrarlas; las `respaldo-*` son copias antiguas a propósito.
- Respaldo antes de limpiezas grandes: `git bundle create ~/atiende-backups/<fecha>.bundle --all`.
- Material no-código (marca, diseño histórico, evidencia y videos del App Review): `~/Documents/Atiéndeme la Pyme/`.
  No va al repo (`*.mov`/`*.mp4` están en `.gitignore`).
