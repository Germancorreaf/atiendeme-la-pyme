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
