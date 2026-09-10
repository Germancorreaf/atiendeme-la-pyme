// src/lib/whatsappConnections.js
// Conexiones de WhatsApp Business Account (WABA) guardadas en Supabase tras
// el flujo de Embedded Signup (ver whatsapp-connect.js). Tabla separada de
// meta_connections (que es para Páginas de Facebook / Instagram) porque el
// identificador natural acá es el phone_number_id, no un page_id -- mismo
// patrón de CRUD, sin tocar el esquema existente.
//
// Requiere la tabla `whatsapp_connections` en Supabase (ver el SQL en el
// comentario al final de este archivo para crearla).

export async function getConnectionByPhoneNumberId(phoneNumberId, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/whatsapp_connections?phone_number_id=eq.${encodeURIComponent(phoneNumberId)}`,
      { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Error fetching whatsapp_connections by phone_number_id:', err.message);
    return null;
  }
}

export async function listWhatsappConnections(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return [];
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/whatsapp_connections?select=phone_number_id,waba_id,display_phone_number,business_name,connected_at&order=connected_at.desc`,
      { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error listing whatsapp_connections:', err.message);
    return [];
  }
}

export async function deleteWhatsappConnection(phoneNumberId, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase no configurado (falta SUPABASE_URL o SUPABASE_SERVICE_KEY)');
  }
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/whatsapp_connections?phone_number_id=eq.${encodeURIComponent(phoneNumberId)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
      }
    }
  );
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`No se pudo eliminar la conexión de WhatsApp: ${err}`);
  }
}

export async function upsertWhatsappConnection(connection, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase no configurado (falta SUPABASE_URL o SUPABASE_SERVICE_KEY)');
  }
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/whatsapp_connections?on_conflict=phone_number_id`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ ...connection, updated_at: new Date().toISOString() })
    }
  );
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`No se pudo guardar la conexión de WhatsApp: ${err}`);
  }
}

// SQL para crear la tabla en Supabase (SQL Editor) -- ver TODOS.md o pedir
// el bloque en el chat: create table whatsapp_connections (phone_number_id
// text primary key, waba_id text not null, display_phone_number text,
// business_name text, access_token text not null, connected_at timestamptz
// default now(), updated_at timestamptz default now()). RLS activado, sin
// policy pública: solo el Worker la usa vía SUPABASE_SERVICE_KEY (service
// role, se salta RLS).
