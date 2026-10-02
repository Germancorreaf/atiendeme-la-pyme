# Atiéndeme la Pyme — manual para Claude Code

Cloudflare Worker (`atiendeme-la-pyme`, dominio `atiendemelapyme.cl`) con la landing, el panel `/admin`
y "Dominga", un bot con IA que responde por web, Messenger, Instagram y WhatsApp.
Datos en Supabase; modelo: API de Anthropic. Idioma del proyecto: español de Chile.

## Antes de tocar nada
1. `git status` y `git log --oneline -3`. **Si hay archivos modificados que no son tuyos, otra sesión está
   trabajando: no los edites, no los incluyas en tu commit, no los reviertas.** Commitea solo tus archivos
   (`git add <archivo>`, nunca `git add -A`).
2. Trabaja siempre en `~/atiendeme-la-pyme`. **La carpeta `~/Desktop/atiendeme-la-pyme` es una copia vieja
   (100+ commits atrás): no se usa ni se despliega desde ahí.**

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
- `src/lib/` — `dominga-prompt.js` (prompt, saludos y divulgación de IA), `metaConnections.js`, `anthropic.js`, etc.
- `src/durable-objects/ChatRoom.js` — chat en vivo/escalamiento a humano.
- `test/` — espejo de `src/`. Sin tests aún: `whatsapp-connect`, `email-inbound`, `email-template`,
  `google-calendar`, `reminder-cron`, `vertical-pages`, `whatsappConnections`, `timingSafe`.
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

## App Review de Meta (en curso)
Las solicitudes y los videos de revisión muestran **textos y botones reales del panel** (`Conectar Instagram`,
`Conectar Página de Facebook`, `Desconectar`, `Conversaciones`, tarjeta "Conexión con Meta"). Mientras la
revisión siga abierta **no renombres esos textos ni cambies los scopes de OAuth** (`OAUTH_SCOPES` en
`meta-connect.js`) ni la URL del webhook sin avisar a Germán.

## Convenciones
- Commits en español, estilo `tipo(ámbito): qué y por qué` (`fix(instagram): …`, `chore: …`).
- Cambios de comportamiento ⇒ test que falle sin el cambio. Corre `npm test` completo antes de subir.
- Ramas de trabajo se borran al integrarlas; las `respaldo-*` son copias antiguas a propósito.
- Respaldo antes de limpiezas grandes: `git bundle create ~/atiende-backups/<fecha>.bundle --all`.
