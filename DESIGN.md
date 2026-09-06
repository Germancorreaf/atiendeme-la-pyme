---
name: Atiéndeme la Pyme
description: Chatbot de IA que recupera ventas y citas que las pymes pierden fuera de horario
colors:
  terminal-black: "#0A0A0A"
  panel-black: "#0F0F0F"
  hairline-gray: "#242424"
  paper-white: "#EDEDE8"
  warm-gray: "#8A8A82"
  deep-warm-gray: "#7D7D74"
  night-ember: "#E8A33D"
  system-green: "#43D17C"
  alert-red: "#FF5F57"
typography:
  display:
    fontFamily: "'Space Grotesk', 'Arial Black', sans-serif"
    fontSize: "clamp(40px, 7vw, 84px)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Space Grotesk', sans-serif"
    fontSize: "clamp(26px, 3.6vw, 42px)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Space Grotesk', sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.14em"
rounded:
  none: "0px"
  circle: "50%"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.night-ember}"
    textColor: "{colors.terminal-black}"
    rounded: "{rounded.none}"
    padding: "16px 30px"
  button-primary-hover:
    backgroundColor: "{colors.night-ember}"
    textColor: "{colors.terminal-black}"
  button-outline:
    backgroundColor: "{colors.terminal-black}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.none}"
    padding: "16px 30px"
  button-outline-hover:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.terminal-black}"
  card-plan:
    backgroundColor: "{colors.panel-black}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.none}"
    padding: "32px 28px"
  card-plan-highlight:
    backgroundColor: "{colors.panel-black}"
    textColor: "{colors.paper-white}"
---

# Design System: Atiéndeme la Pyme

## Overview

**Creative North Star: "The Always-On Terminal"**

El sitio se ve y se siente como un panel de sistema que nunca se apaga: fondo casi negro, tipografía monoespaciada, un único acento ámbar usado con moderación, cursores parpadeantes, indicadores de estado ("SYS.OK", puntos verdes de "en línea"), y bordes/sombras duras sin difuminar — como si fuera una terminal de operador, no una landing de marketing genérica. Esto no es decoración: el producto literalmente sigue trabajando cuando el dueño de la pyme no está (de noche, fines de semana, feriados), y la estética de "sistema siempre encendido" refuerza ese mensaje sin necesidad de decirlo con palabras.

La personalidad es **técnica pero cercana** — precisión de panel de control, sin volverse fría o corporativa. La voz de Dominga (el asistente del producto) es directa, con chispa, chilena; el sistema visual traduce esa misma cercanía a través de interacciones táctiles y directas: los botones y tarjetas se "empujan" físicamente al interactuar, como un botón real, no como una animación decorativa.

**Key Characteristics:**
- Monoespaciado (JetBrains Mono) para todo el cuerpo, labels y navegación; Space Grotesk en bold/uppercase para titulares grandes.
- Un único color de acento (Night Ember, #E8A33D) usado con moderación sobre un fondo casi negro — nunca varios colores compitiendo.
- Cero border-radius salvo en elementos circulares puntuales (puntos de estado, avatares, mockups de teléfono).
- Sombras duras sin blur ("estilo pegatina") que cambian de offset al hacer hover/press — es el estado actual del sistema, no una regla que deba considerarse inquebrantable si el diseño evoluciona.
- Micro-detalles de "sistema operativo": cursores parpadeantes, prefijo `//` en comentarios, contadores tabulares, indicadores de estado en vivo.

## Colors

Paleta casi monocromática (negro + blanco cálido) con un único acento cálido que hace todo el trabajo expresivo — nunca compite consigo mismo.

### Primary
- **Night Ember** (`#E8A33D`): el único color fuerte del sitio. CTAs primarios, badges, subrayados de énfasis, puntos de estado "activo". Se usa con moderación deliberada — su rareza es lo que le da peso.

### Neutral
- **Terminal Black** (`#0A0A0A`): fondo base de todo el sitio.
- **Panel Black** (`#0F0F0F`): superficie ligeramente elevada — tarjetas, paneles, hover de filas.
- **Paper White** (`#EDEDE8`): texto principal, y también el color de borde/sombra "duro" (`--line-hard`) usado en botones y tarjetas.
- **Hairline Gray** (`#242424`): líneas divisorias sutiles entre secciones y filas.
- **Warm Gray** (`#8A8A82`) / **Deep Warm Gray** (`#7D7D74`): texto secundario, labels, metadatos.

### Estado (uso funcional, no decorativo)
- **System Green** (`#43D17C`): indicadores "en línea" / "activo" (puntos parpadeantes).
- **Alert Red** (`#FF5F57`): estados de error, botón de colgar en el mockup de llamada.

### Named Rules
**The One Accent Rule.** Night Ember es el único color con carga emocional en todo el sitio. No se introducen colores nuevos para nuevas secciones — si algo necesita destacar, se destaca con Night Ember, nunca con un color adicional.

## Typography

**Display/Headline Font:** Space Grotesk (bold, con `Arial Black` / `sans-serif` como fallback)
**Body/Label Font:** JetBrains Mono (con `ui-monospace, monospace` como fallback)

**Character:** El contraste entre un display geométrico en mayúsculas (Space Grotesk) y un cuerpo monoespaciado (JetBrains Mono) es lo que crea la sensación de "terminal" — titulares que gritan, cuerpo que informa con precisión.

### Hierarchy
- **Display** (700, `clamp(40px,7vw,84px)`, line-height 0.98): el H1 del hero. Uppercase, letter-spacing -0.03em.
- **Headline** (700, `clamp(26px,3.6vw,42px)`, line-height 1.08): títulos de sección principales (`.sec-head h2`, `h2.big`). Uppercase en la mayoría de las secciones (hero, CTA final, sección "24/7") — dos secciones más narrativas (`.canales-text h2`, `.convo-left h2`) usan case normal; es una variación real del sistema actual, no un error a unificar sin más contexto.
- **Title** (700, 20px): títulos de tarjetas de feature.
- **Body** (400, 14px, line-height 1.6): texto de párrafo. Ancho máximo ~600-720px en bloques de contenido largo.
- **Label** (400, 11px, letter-spacing 0.14em, uppercase): eyebrows de sección (`.label`), badges, metadatos de navegación.

### Named Rules
**The Loud-Quiet Rule.** Los titulares (Space Grotesk, uppercase, bold) gritan; todo lo demás (JetBrains Mono) informa en voz baja. Nunca se usa Space Grotesk para cuerpo de texto largo, ni JetBrains Mono para un H1.

## Layout

Contenedor central `.wrap` de `max-width:1180px`, con bordes verticales de 1px que desaparecen en mobile (`≤1024px`). Las secciones se apilan verticalmente, cada una separada por un borde inferior de 1px (`border-bottom` en `section`), con un pequeño índice numérico (`.sec-num`, ej. "01", "02") anclado en la esquina superior izquierda de cada sección — funciona como numeración de "pasos del sistema", no solo decoración.

Grillas de 2-3 columnas (`repeat(auto-fit,minmax(340px,1fr))` o `repeat(3,1fr)`) para features y layouts de dos paneles (texto + visual), que colapsan a una columna en `≤768px`. Padding de sección estándar: `70px 40px` en desktop, reduciéndose a `40-48px 20px` en mobile, `16-20px` en pantallas muy chicas.

## Elevation & Depth

El sistema no usa sombras con blur en ningún punto — toda la profundidad se comunica con **offsets duros sin difuminar** (`box-shadow: Npx Npx 0 color`, sin blur-radius), como si cada elemento fuera un recorte físico apilado sobre el fondo. Botones y tarjetas "se empujan" al hacer hover (el offset crece) y "se presionan" al hacer click/active (el offset se reduce) — es una metáfora táctil, no ambiental.

Este es el estado actual del sistema, confirmado como estilo válido — no se estableció como regla inquebrantable para todo trabajo futuro, así que una evolución que introduzca sombras suaves en algún componente puntual no rompe la identidad por sí sola, pero cualquier cambio así debería ser una decisión consciente, no un valor por defecto de una librería.

### Shadow Vocabulary
- **Botón/tarjeta en reposo** (`box-shadow: 5px 5px 0 var(--line-hard)` o `var(--accent)`): offset base.
- **Hover** (`box-shadow: 7-11px 7-11px 0 ...`): el offset crece, sensación de "levantarse".
- **Active/press** (`box-shadow: 2px 2px 0 ...`): el offset se reduce, sensación de "presionado".

## Shapes

**The Sharp Corners Rule.** `border-radius:0` aplicado globalmente (`*{border-radius:0 !important;}`) — todo el sitio es de ángulos rectos por defecto. Las únicas excepciones son deliberadamente circulares y puntuales: puntos de estado (`.dot`, `.ok-dot`), avatares, y elementos dentro del mockup de teléfono (pantalla, isla dinámica, botones de llamada) que imitan la geometría real de un dispositivo — ahí sí tiene sentido lo redondeado porque referencia un objeto físico real, no por preferencia estética.

Bordes de 2px en elementos interactivos primarios (botones, tarjetas, nav), 1px en divisores internos (filas, líneas de sección) — el grosor del borde es una señal jerárquica: 2px = "esto es un objeto", 1px = "esto es una separación".

## Components

Los componentes se sienten **táctiles y directos**: confirman cada acción con un movimiento físico concreto (el offset de sombra), sin transiciones decorativas de más. Cero relleno visual — cada línea tiene un propósito.

### Buttons
- **Shape:** ángulo recto, borde 2px.
- **Primary:** fondo Night Ember, texto Terminal Black, sombra dura color `paper-white`. Uppercase, letter-spacing 0.1em.
- **Outline:** fondo Terminal Black, borde `paper-white`, sombra dura color Night Ember — invierte la jerarquía cromática del primary.
- **Hover / Active:** el offset de sombra crece al hover, se reduce al active — ver Elevation.

### Cards (Plan/Pricing)
- **Corner Style:** ángulo recto.
- **Background:** Panel Black.
- **Border:** 2px `paper-white`; el plan destacado (`.highlight`) usa el mismo borde pero sombra en Night Ember en vez de `paper-white` — la única diferencia visual entre "plan normal" y "plan recomendado" es el color de sombra + un badge superior.
- **Internal Padding:** 32px 28px.

### FAQ Accordion
- **Style:** contenedor con borde 2px, cada pregunta es una fila de 1px de borde inferior. El ícono `+` rota 45° (se convierte en `×`) al abrir.
- **Respuesta:** prefijo `>` en Night Ember antes del texto — refuerza la metáfora de terminal/consola.

### Navigation
- Header fijo con logo (marca `a` + barra de acento) a la izquierda, botón hamburguesa a la derecha. El menú es un panel lateral de ancho fijo (`clamp(300px,36vw,420px)`) que se desliza desde la derecha sobre un overlay oscuro — no un dropdown ni un menú horizontal tradicional.
- Los ítems de menú están numerados (`01`, `02`...) en Night Ember, con animación de entrada escalonada (delay incremental por ítem).

### Signature Component: Phone Mockup
El sitio incluye un mockup de teléfono realista (marco, isla dinámica, botones laterales) que renderiza conversaciones simuladas de WhatsApp e Instagram con los colores reales de cada plataforma (WhatsApp: `#111b21`/`#005c4b`; Instagram: gradiente `#F58529→#DD2A7B→#8134AF`). Es el componente más distintivo del sitio — vale la pena preservarlo como diferenciador si se documentan o construyen nuevas superficies relacionadas con "ver el producto en acción".

### Chat Widget (flotante)
Botón circular flotante (`#atp-chat-btn`) con punto de estado "en línea" parpadeante, que abre un panel de chat (`#atp-chat-panel`) con la misma paleta y bordes duros del resto del sitio — el chat en vivo con Dominga se siente parte del mismo sistema, no un widget de terceros insertado.

## Do's and Don'ts

### Do:
- **Do** usar Night Ember con moderación — su rareza es la razón por la que funciona. Si una sección nueva "necesita" un segundo color de acento, es señal de que algo más debería resolver ese problema (jerarquía, tamaño, posición), no un color nuevo.
- **Do** mantener bordes en ángulo recto por defecto; reservar círculos para elementos que referencian un objeto físico real (puntos de estado, avatares, mockups de dispositivo).
- **Do** usar Space Grotesk solo para titulares/números grandes, JetBrains Mono para todo lo demás — nunca mezclar en el sentido opuesto.
- **Do** preservar el patrón de sombras duras sin blur en componentes interactivos nuevos (botones, tarjetas) para mantener consistencia — es el estado actual documentado, aplicarlo por defecto salvo decisión consciente de apartarse.

### Don't:
- **Don't** introducir sombras con blur/difuminadas sin que sea una decisión explícita — rompe la metáfora "recorte físico apilado" que define el resto del sitio.
- **Don't** agregar un segundo color de acento fuerte compitiendo con Night Ember.
- **Don't** presentar cifras o resultados de clientes que no estén confirmados como reales — ya ocurrió una vez en este sitio (la sección "Funciona con" mostraba métricas inventadas) y se corrigió; ver `PRODUCT.md` → Evidence on Hand.
- **Don't** redondear esquinas de botones, tarjetas o inputs "porque se ve más suave" — el ángulo recto es la identidad, no un descuido pendiente de pulir.
