// src/lib/metaConnections.js
// Conexiones de Páginas de Facebook (+ su cuenta profesional de Instagram, si
// tiene una vinculada) guardadas en Supabase tras el flujo OAuth de
// meta-connect.js. Una fila por Página conectada; el webhook nativo
// (meta-webhook.js) las usa para saber con qué Page Access Token responder.

export async function getConnectionByPageId(pageId, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/meta_connections?page_id=eq.${encodeURIComponent(pageId)}`,
      { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
    );
    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Error fetching meta_connections by page_id:', err.message);
    return null;
  }
}

export async function getConnectionByIgId(igBusinessAccountId, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/meta_connections?ig_business_account_id=eq.${encodeURIComponent(igBusinessAccountId)}`,
      { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
    );
    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Error fetching meta_connections by ig_business_account_id:', err.message);
    return null;
  }
}

export async function listConnections(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return [];
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/meta_connections?select=page_id,page_name,ig_business_account_id,ig_username,connected_at&order=connected_at.desc`,
      { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
    );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error listing meta_connections:', err.message);
    return [];
  }
}

export async function deleteConnectionByPageId(pageId, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase no configurado (falta SUPABASE_URL o SUPABASE_SERVICE_KEY)');
  }
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/meta_connections?page_id=eq.${encodeURIComponent(pageId)}`,
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
    throw new Error(`No se pudo eliminar la conexión: ${err}`);
  }
}

export async function upsertConnection(connection, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase no configurado (falta SUPABASE_URL o SUPABASE_SERVICE_KEY)');
  }
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/meta_connections?on_conflict=page_id`,
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
    throw new Error(`No se pudo guardar la conexión de Meta: ${err}`);
  }
}
