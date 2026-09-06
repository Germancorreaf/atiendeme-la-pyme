# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dueño/a de una pyme en Chile con atención al cliente multicanal (sitio web, WhatsApp, Instagram) que pierde ventas o citas porque nadie responde fuera del horario laboral (noche, fin de semana, feriados). Decisión de compra individual, sin comité — el mismo dueño/a evalúa y contrata.

## Product Purpose

Automatizar la atención al cliente y el agendamiento de citas de una pyme mediante un asistente de IA (Dominga), entrenado con la información real de cada negocio (servicios, precios, horarios), para recuperar ventas y citas que hoy se pierden por falta de respuesta fuera de horario.

## Positioning

No es "otro chatbot IA 24/7" — esa es la categoría saturada en Chile (8+ competidores directos identificados con el mismo mensaje genérico). El posicionamiento validado es "recuperación de ventas/citas fuera de horario": un ángulo específico y medible, respaldado por un caso real (una empresa que paga a una persona específicamente para responder chats y aun así pierde ventas de noche), que ningún competidor identificado usa como mensaje principal.

## Operating Context

El chatbot opera en tres canales: sitio web, WhatsApp (vía integración con ManyChat) e Instagram (el webhook directo a Meta existe en el código pero está desactivado; Instagram opera hoy vía ManyChat). Agenda citas directo en Google Calendar o Calendly, sin dobles reservas, y envía recordatorios automáticos un día antes. Un dashboard interno (protegido con contraseña) permite revisar conversaciones, leads y agenda manualmente — hoy es también el mecanismo de facto para detectar cuando el bot no pudo resolver algo, mientras no existe escalamiento automático a humano.

## Capabilities and Constraints

**Construido y funcionando:** chat con IA (Claude) en web/WhatsApp/Instagram entrenado con datos reales del negocio; agendamiento automático (Google Calendar/Calendly); recordatorios de citas; calificación de leads; dashboard admin de conversaciones y agenda; rate limiting en los endpoints públicos.

**Vendido pero no construido:** voicebot/llamadas telefónicas (parte del Plan Experto, sin ninguna integración de voz/telefonía en el código todavía — ver TODOS.md).

**No construido:** escalamiento real a humano en el chat en vivo (el copy ya no lo promete, pero el mecanismo real —notificación automática al dueño— sigue pendiente); procesamiento de pagos o pedidos (ninguna pasarela integrada; cualquier cobro hoy es manual).

**Terminología:** "Dominga" es el nombre del asistente de IA del producto — el producto en sí se llama "Atiéndeme la Pyme".

## Brand Commitments

Nombre del producto: **Atiéndeme la Pyme**. Nombre del asistente de IA: **Dominga**. Voz confirmada (definida explícitamente en el prompt del producto): conversacional, directa, con chispa — como una amiga que sabe de negocios. Chileno neutro ("súper", "cachar", "al tiro", sin exagerar). Trato de "tú", nunca "usted". Cero robótico.

## Evidence on Hand

A la fecha (2026-08-28): **cero clientes pagando confirmados.** Dos pilotos en curso, ninguno con compromiso de pago cerrado todavía:
- La empresa donde trabaja el fundador — evidencia real de dolor (empleado pagado para responder chats, pierde ventas nocturnas igual), sin compromiso comercial cerrado.
- "pizzaparty" — sitio construido aparte por el fundador; estado como cliente pagando de Atiéndeme la Pyme sin confirmar.

Ninguno de los dos debe presentarse como caso de éxito, testimonio o resultado medido en ningún trabajo futuro (landing, páginas de rubro, etc.) hasta que exista un compromiso de pago real. Ya se corrigió una instancia de esto: la sección "Funciona con" de la landing mostraba métricas inventadas ("+38% servicios", "+120 citas/mes") presentadas como resultados reales de clientes.

## Product Principles

1. **Nunca prometer una capacidad que no está construida.** Ya se corrigieron varias instancias de esto en el copy: "transferencia a humano", "consolidar la compra", estadísticas inventadas, prueba social falsa.
2. **Liderar el mensaje con "recuperación de ventas/citas fuera de horario"**, no con "IA 24/7" genérico — es el ángulo diferenciado y validado, no el que usa el resto de la categoría.
3. **No expandir alcance ni construir funcionalidad nueva antes de validar demanda real** (compromiso de pago concreto, no aprobación verbal).
4. **Entrenar el chatbot solo con información real del negocio del cliente** — nunca contenido genérico o inventado, ni para el producto en sí ni para el copy de venta.
