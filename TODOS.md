# TODOS

## Producto

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
