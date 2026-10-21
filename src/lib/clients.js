// src/lib/clients.js
// Tabla `clientes`: un negocio cliente con su bot (bot_prompt), su agenda
// (calendar_id, horario, slot_minutes) y su nombre. Sus conexiones de
// Instagram/Facebook/WhatsApp apuntan a él con `cliente_id`, así la
// configuración no se repite por canal. SQL en supabase/2026-10-20-clientes.sql.

export async function getCliente(env, id) {
  if (!id || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/clientes?id=eq.${encodeURIComponent(id)}&select=*`, {
      headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` }
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch (err) {
    console.error('Error fetching cliente:', err.message);
    return null;
  }
}

export async function listClientes(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return [];
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/clientes?select=*&order=created_at.desc`, {
      headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` }
    });
    const rows = res.ok ? await res.json() : [];
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    console.error('Error listing clientes:', err.message);
    return [];
  }
}

/** Crea (sin id) o actualiza (con id) un cliente. Devuelve la fila guardada. */
export async function saveCliente(env, { id, ...fields }) {
  const url = id
    ? `${env.SUPABASE_URL}/rest/v1/clientes?id=eq.${encodeURIComponent(id)}`
    : `${env.SUPABASE_URL}/rest/v1/clientes`;
  const res = await fetch(url, {
    method: id ? 'PATCH' : 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(fields)
  });
  if (!res.ok) throw new Error(`No se pudo guardar el cliente: ${(await res.text()).slice(0, 200)}`);
  const rows = await res.json();
  if (!rows.length) throw new Error('No existe ese cliente.');
  return rows[0];
}

export const DAYS = [['lun', 'Lunes'], ['mar', 'Martes'], ['mie', 'Miércoles'], ['jue', 'Jueves'], ['vie', 'Viernes'], ['sab', 'Sábado'], ['dom', 'Domingo']];

/**
 * "09:00-13:00, 15:00-19:00" por día -> { lun: [["09:00","13:00"],["15:00","19:00"]], ... }.
 * Un día vacío queda cerrado. Lanza un error legible si algo no calza.
 */
export function parseHorario(byDay) {
  const horario = {};
  for (const [key, label] of DAYS) {
    const raw = String(byDay[key] || '').trim();
    if (!raw) continue;
    horario[key] = raw.split(',').map((part) => {
      const m = part.trim().match(/^(\d{1,2}):(\d{2})\s*(?:-|a)\s*(\d{1,2}):(\d{2})$/);
      const ok = m && +m[1] < 24 && +m[2] < 60 && +m[3] <= 24 && +m[4] < 60;
      const start = ok && `${m[1].padStart(2, '0')}:${m[2]}`;
      const end = ok && `${m[3].padStart(2, '0')}:${m[4]}`;
      if (!ok || start >= end) throw new Error(`${label}: "${part.trim()}" no es un horario válido. Usa por ejemplo 09:00-13:00, 15:00-19:00.`);
      return [start, end];
    });
  }
  return horario;
}

/** Inverso de parseHorario, para mostrar el horario en el formulario. */
export function formatHorario(horario, key) {
  const value = horario?.[key];
  if (!Array.isArray(value) || !value.length) return '';
  return (Array.isArray(value[0]) ? value : [value]).map(([a, b]) => `${a}-${b}`).join(', ');
}
