// src/lib/onboardingDraft.js
// Borrador de la configuración del bot de un cliente a partir de sus
// respuestas del manual de onboarding: la "información para el bot"
// (bot_prompt), el horario por día y la duración de cada hora. Germán lo
// revisa en el panel; no se inventa nada que el cliente no haya dicho.

import { callClaude } from './anthropic.js';
import { DAYS, parseHorario } from './clients.js';

const SYSTEM = `Preparas la configuración del asistente de IA de un negocio chileno a partir de las respuestas que el dueño dio en un formulario de onboarding.

Responde SOLO con un objeto JSON, sin texto antes ni después, con estas claves:
- "bot_prompt": texto plano en español con la información del negocio que el asistente va a usar para responder. Ordénalo en secciones con títulos simples en mayúsculas (por ejemplo NEGOCIO, SERVICIOS Y PRECIOS, HORARIO, DIRECCIÓN Y COBERTURA, MEDIOS DE PAGO Y POLÍTICAS, PREGUNTAS FRECUENTES, CÓMO HABLA, CUÁNDO DERIVAR A UNA PERSONA, LO QUE NUNCA DEBE DECIR). Incluye solo las secciones con información. Escribe las preguntas frecuentes como pregunta y respuesta. Si el dueño eligió un nombre para la asistente, inclúyelo en CÓMO HABLA.
- "horario": objeto con claves lun, mar, mie, jue, vie, sab, dom y valores como "09:00-13:00, 15:00-19:00" (24 horas). Solo los días que el dueño indicó que atiende; omite los demás. Si no dio un horario claro, usa {}.
- "slot_minutes": duración de cada hora o cita en minutos si la indicó (número), o null.

Reglas:
- Usa solo lo que está en las respuestas. No inventes precios, servicios, horarios, políticas ni datos de contacto. Si algo no está, no lo pongas.
- Ignora lo que no le sirve al asistente para atender clientes: accesos al sitio web, dominio, estadísticas, colores, logo, páginas del sitio.
- Nada de asteriscos ni almohadillas.`;

/**
 * @returns {Promise<{ bot_prompt: string, horario: object, slot_minutes: number|null }>}
 *   horario ya en el formato de la agenda ({ lun: [["09:00","18:00"]] }).
 */
export async function draftFromOnboarding(answersText, context) {
  const reply = await callClaude(
    [{ role: 'user', content: `Respuestas del formulario:\n\n${String(answersText).slice(0, 60000)}` }],
    SYSTEM, context, { maxTokens: 4096, effort: 'medium' }
  );
  const match = reply.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('El borrador no vino en JSON');
  const data = JSON.parse(match[0]);

  const botPrompt = typeof data.bot_prompt === 'string' ? data.bot_prompt.trim().slice(0, 20000) : '';
  // Un día que no se entiende se descarta (mejor vacío que un horario mal puesto).
  const horario = {};
  for (const [key] of DAYS) {
    try { Object.assign(horario, parseHorario({ [key]: data.horario?.[key] })); } catch { /* día ilegible */ }
  }
  const slot = Number(data.slot_minutes);
  return { bot_prompt: botPrompt, horario, slot_minutes: slot >= 10 && slot <= 240 ? Math.round(slot) : null };
}
