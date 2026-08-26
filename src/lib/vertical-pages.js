// src/lib/vertical-pages.js
// Páginas de contenido por rubro (SEO long-tail). Reusa el mensaje validado
// ("recupera lo que pierdes fuera de horario") y solo describe capacidades
// reales del producto — nada de casos de éxito o cifras inventadas, ya que
// todavía no hay clientes pagando confirmados.

const SHARED_STYLE = `:root{--bg:#0A0A0A;--panel:#0F0F0F;--text:#EDEDE8;--accent:#E8A33D;--muted:#8A8A82;--line:#242424;}*{box-sizing:border-box;margin:0;padding:0;}body{background:var(--bg);color:var(--text);font-family:'JetBrains Mono',ui-monospace,monospace;line-height:1.7;}.container{max-width:760px;margin:0 auto;padding:48px 20px 80px;}.eyebrow{color:var(--accent);font-size:11px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:14px;}h1{font-family:'Space Grotesk',sans-serif;font-size:clamp(28px,4.5vw,42px);font-weight:700;letter-spacing:-0.02em;line-height:1.15;margin-bottom:20px;}p{color:#CFCFC8;margin-bottom:16px;font-size:15px;}h2{font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:700;margin-top:40px;margin-bottom:14px;color:var(--text);}ul{margin:0 0 20px 20px;color:#CFCFC8;}li{margin-bottom:8px;font-size:15px;}.btn-row{display:flex;gap:14px;flex-wrap:wrap;margin-top:32px;}.btn-primary{display:inline-block;background:var(--accent);color:#0A0A0A;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:14px 26px;border:2px solid var(--accent);box-shadow:5px 5px 0 var(--text);transition:transform 150ms ease,box-shadow 150ms ease;}.btn-primary:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--text);}.btn-outline{display:inline-block;background:transparent;color:var(--text);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:14px 26px;border:2px solid var(--line);}.btn-outline:hover{border-color:var(--accent);color:var(--accent);}footer{border-top:1px solid var(--line);padding-top:24px;margin-top:56px;color:var(--muted);font-size:12px;}footer a{color:var(--accent);text-decoration:none;}`;

const VERTICALS = {
  'chatbot-ia-para-centros-esteticos': {
    rubro: 'centros estéticos',
    metaTitle: 'Chatbot IA para Centros Estéticos en Chile | Atiéndeme la Pyme',
    metaDesc: 'Chatbot de IA que responde consultas y agenda tratamientos fuera de horario para centros estéticos en Chile. WhatsApp, Instagram y web.',
    h1: 'Chatbot de IA para centros estéticos: no pierdas clientas fuera de horario',
    intro: 'Una clienta que quiere agendar una limpieza facial un domingo a la noche, o pregunta el precio de un tratamiento a las 22:00, no siempre puede esperar hasta el lunes para que le contesten. Mientras tanto, sigue buscando en otro centro. Dominga responde esas consultas al tiro — en tu sitio web, WhatsApp o Instagram — y agenda directo en tu calendario.',
    whatItSolves: [
      'Responde preguntas frecuentes sobre tratamientos, precios y duración con la información real de tu centro.',
      'Agenda citas directo en Google Calendar o Calendly, sin dobles reservas.',
      'Envía recordatorios automáticos antes de la cita para reducir las inasistencias.',
      'Califica a quien pregunta antes de que tengas que hablar con ella — sabés si es una consulta real o solo curiosidad.'
    ]
  },
  'chatbot-ia-para-clinicas-dentales': {
    rubro: 'clínicas dentales',
    metaTitle: 'Chatbot IA para Clínicas Dentales en Chile | Atiéndeme la Pyme',
    metaDesc: 'Chatbot de IA que agenda horas y responde consultas fuera de horario para clínicas dentales en Chile. Recordatorios automáticos, sin dobles reservas.',
    h1: 'Chatbot de IA para clínicas dentales: agenda horas y responde consultas fuera de horario',
    intro: 'Un paciente que necesita una hora de urgencia o pregunta por el precio de un tratamiento no siempre escribe en horario de atención. Si nadie contesta a tiempo, busca otra clínica. Dominga responde en tu sitio web, WhatsApp o Instagram, agenda directo en tu calendario y manda recordatorio antes de la hora.',
    whatItSolves: [
      'Agenda citas en Google Calendar o Calendly, sin dobles reservas.',
      'Envía recordatorios automáticos un día antes de la cita — menos inasistencias sin que nadie tenga que llamar a confirmar.',
      'Responde preguntas frecuentes sobre tratamientos, precios y horarios con la información real de tu clínica.',
      'Califica al paciente antes de que hables con él — nombre, motivo de consulta, urgencia.'
    ]
  },
  'chatbot-ia-para-veterinarias': {
    rubro: 'veterinarias',
    metaTitle: 'Chatbot IA para Veterinarias en Chile | Atiéndeme la Pyme',
    metaDesc: 'Chatbot de IA que responde consultas y agenda horas fuera del horario de atención para veterinarias en Chile. WhatsApp, Instagram y web.',
    h1: 'Chatbot de IA para veterinarias: atiende consultas fuera de tu horario de atención',
    intro: 'Los dueños de mascotas escriben a cualquier hora — de noche, un feriado, mientras están preocupados por su mascota. Si nadie responde a tiempo, agendan en otra veterinaria o van directo a una urgencia. Dominga responde en tu sitio web, WhatsApp o Instagram, y agenda controles y vacunas directo en tu calendario.',
    whatItSolves: [
      'Agenda controles, vacunas y horas directo en Google Calendar o Calendly, sin dobles reservas.',
      'Responde preguntas frecuentes sobre precios y servicios con la información real de tu veterinaria.',
      'Envía recordatorios automáticos antes de la hora agendada.',
      'Califica la consulta antes de que hables con el dueño — motivo, urgencia, mascota.'
    ]
  }
};

function renderVerticalPage(v) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${v.metaTitle}</title><meta name="description" content="${v.metaDesc}"><meta name="robots" content="index, follow"><link rel="canonical" href="https://atiendemelapyme.cl/${v.slug}"><meta property="og:type" content="website"><meta property="og:title" content="${v.metaTitle}"><meta property="og:description" content="${v.metaDesc}"><meta property="og:url" content="https://atiendemelapyme.cl/${v.slug}"><meta property="og:locale" content="es_CL"><style>${SHARED_STYLE}</style></head><body><div class="container"><div class="eyebrow">Atiéndeme la Pyme</div><h1>${v.h1}</h1><p>${v.intro}</p><h2>Qué resuelve para ${v.rubro}</h2><ul>${v.whatItSolves.map((item) => `<li>${item}</li>`).join('')}</ul><h2>Cómo funciona</h2><p>Entrenamos a Dominga con la información real de tu negocio — servicios, precios, horarios — y responde en tu sitio web, WhatsApp e Instagram. Sin conocimientos técnicos de tu parte: nosotros hacemos la configuración.</p><div class="btn-row"><a href="/#contacto" class="btn-primary">Agendar demo gratuita</a><a href="/#precios" class="btn-outline">Ver planes y precios</a></div><footer>Atiéndeme la Pyme — Santiago, Chile · <a href="/">Volver al inicio</a> · <a href="/terminos">Términos</a> · <a href="/privacidad">Privacidad</a></footer></div></body></html>`;
}

export function getVerticalPage(slug) {
  const v = VERTICALS[slug];
  if (!v) return null;
  return renderVerticalPage({ ...v, slug });
}

export function getVerticalSlugs() {
  return Object.keys(VERTICALS);
}
