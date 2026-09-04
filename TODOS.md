# TODOS

## Producto

### Sacar/ajustar promesa de "transferencia a humano" en la página de precios

**What:** Los planes Básico ($149.990) y Recomendado ($249.990) en la landing (`src/index.js`) prometen textualmente "Transferencia automática a un humano cuando no puede resolver" — el mismo mecanismo que no existe y que ya se sacó del system prompt de Dominga (ver commit `9c2e9c1`). Falta aplicar el mismo criterio acá, en el texto que ve un prospecto antes de pagar.

**Why:** Es peor que el gap del chat — esto está en la página de precios, con plata real de por medio. Encontrado al revisar el copy de la landing (2026-08-26); no se detectó en la revisión CEO previa porque el grep usado no coincidía con esta redacción exacta.

**Context:** Mismo criterio que la decisión D2 (`docs/designs/validacion-piloto-ventas-nocturnas.md`): no prometer algo que no está construido. Decidir si se saca la línea o se reemplaza por algo honesto (ej. "seguimiento por email/WhatsApp").

**Effort:** S
**Priority:** P1
**Depends on:** None

### Revisar el Plan Experto — vende voicebot/llamadas que no existen

**What:** El Plan Experto ($449.990 + $179.990/mes) vende "llamadas y voicebot" — un asistente de voz que "contesta llamadas... con acento chileno neutro". No hay ninguna integración de voz/telefonía en el código (sin Twilio, sin API de voz, nada). Decidir: ocultar el plan hasta construirlo, marcarlo "próximamente", o priorizar construirlo.

**Why:** Es el plan más caro del sitio, vendiendo una funcionalidad completamente inexistente. Si alguien lo contrata hoy, no hay forma de entregarlo.

**Context:** Encontrado al revisar el copy de la landing (2026-08-26), mismo día que se corrigió el gap de transferencia a humano en el prompt de Dominga. El usuario decidió diferir el arreglo (priorizando primero la alineación de mensaje con el plan de validación).

**Effort:** S (ocultar/marcar) o XL (construir voicebot real)
**Priority:** P1
**Depends on:** None

### Escalamiento real a humano en el chat en vivo

**What:** Construir un mecanismo real de notificación (email/WhatsApp al dueño) cuando el bot no puede resolver algo o el usuario pide hablar con una persona, más métricas en el dashboard admin (mensajes fuera de horario, tasa de resolución bot vs. escalado).

**Why:** El copy de ventas prometía "transferencia a humano" sin que existiera. Mientras dure la validación se resuelve con revisión manual del dashboard + una respuesta honesta del bot (ver decisión D2 en `docs/designs/validacion-piloto-ventas-nocturnas.md`), pero un cliente pagando real necesita el mecanismo de verdad.

**Context:** Corresponde a "Approach B" del plan de validación — deliberadamente diferido hasta después del piloto para no retrasar la primera conversación de venta. Si el piloto con la empresa donde trabaja el fundador se convierte en cliente, esto pasa a ser prioritario.

**Effort:** M
**Priority:** P2
**Depends on:** Piloto validado con compromiso de pago real.

### Reforzar seguridad del dashboard admin

**What:** Reemplazar la contraseña única de Basic Auth por algo más robusto (rotación, rate limiting propio en el login, o auth por sesión) antes de que el admin maneje datos de clientes pagando de forma sostenida.

**Why:** Hoy `/admin` protege conversaciones y agenda con una sola contraseña compartida y sin rate limiting propio en el login — aceptable para un solo operador en etapa de validación, no para datos de un tercero pagando.

**Context:** Encontrado durante la revisión CEO del plan de validación (2026-08-26). No bloquea el piloto (nadie más que el fundador usa el admin hoy).

**Effort:** S
**Priority:** P2
**Depends on:** El piloto se convierte en cliente pagando sostenido.

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

### Tests automatizados y CI

**What:** Agregar tests automatizados (al menos para las rutas API críticas: chat, schedule, admin auth) y un pipeline de CI básico.

**Why:** El proyecto no tiene ningún test ni CI configurado — todo el despliegue es manual vía `wrangler deploy`. Deuda preexistente, no causada por el cambio de esta revisión, pero visible en la auditoría.

**Context:** Encontrado durante la revisión CEO del plan de validación (2026-08-26). No urgente mientras el producto esté en etapa de validación con tráfico mínimo.

**Effort:** M
**Priority:** P3
**Depends on:** None

## Completed

### Arreglar número de WhatsApp placeholder en la landing

**What:** El link de WhatsApp en `src/index.js` (y en `src/lib/vertical-pages.js`) apuntaba a `wa.me/56900000000` — número placeholder, no funcionaba. Reemplazado por el número real del negocio (+56 9 2205 3594) en ambos archivos.

**Why:** Encontrado en QA en vivo del sitio (2026-08-26): un prospecto que hacía clic en "WhatsApp" no llegaba a nadie.

**Effort:** S
**Priority:** P0
**Completed:** 2026-09-04
