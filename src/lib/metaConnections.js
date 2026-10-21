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

// Hay dos formas de conectar Instagram y cada una guarda su propia fila
// (la clave es page_id): "Conectar Instagram" guarda page_id = ID de Instagram
// con un token de Instagram; "Conectar Página de Facebook" guarda page_id = ID
// de la Página con un token de Facebook y, además, el ID de Instagram vinculado.
// Una búsqueda por ig_business_account_id puede devolver las DOS filas. Hay que
// preferir la del token de Instagram, que es la que graph.instagram.com entiende;
// si se elige la de Facebook, Meta responde "Cannot parse access token".
export function usesInstagramToken(connection) {
  return !!connection
    && !!connection.ig_business_account_id
    && String(connection.page_id) === String(connection.ig_business_account_id);
}

export function pickInstagramConnection(rows, igBusinessAccountId) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows.find((r) => String(r.page_id) === String(igBusinessAccountId)) || rows[0];
}

export async function getConnectionByIgId(igBusinessAccountId, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/meta_connections?ig_business_account_id=eq.${encodeURIComponent(igBusinessAccountId)}`,
      { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
    );
    const data = await response.json();
    return pickInstagramConnection(data, igBusinessAccountId);
  } catch (err) {
    console.error('Error fetching meta_connections by ig_business_account_id:', err.message);
    return null;
  }
}

export async function listConnections(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return [];
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/meta_connections?select=page_id,page_name,ig_business_account_id,ig_username,cliente_id,connected_at&order=connected_at.desc`,
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

/**
 * Renueva los tokens de Instagram (los de "Conectar Instagram" vencen a los 60
 * días; cada renovación da otros 60). Corre en el cron diario. Los tokens de
 * Página de Facebook no vencen. Meta no renueva un token con menos de 24 h:
 * ese error se ignora, se renueva al día siguiente.
 */
export async function refreshInstagramTokens(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return { refreshed: 0, failed: 0 };
  const headers = { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/meta_connections?select=page_id,ig_business_account_id,page_access_token`, { headers });
  const rows = res.ok ? await res.json() : [];
  let refreshed = 0;
  let failed = 0;
  for (const row of rows.filter(usesInstagramToken)) {
    try {
      const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(row.page_access_token)}`);
      const data = await r.json();
      if (!r.ok || !data.access_token) throw new Error(JSON.stringify(data.error || data).slice(0, 200));
      const save = await fetch(`${env.SUPABASE_URL}/rest/v1/meta_connections?page_id=eq.${encodeURIComponent(row.page_id)}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_access_token: data.access_token, updated_at: new Date().toISOString() })
      });
      if (!save.ok) throw new Error(`Supabase ${save.status}`);
      refreshed++;
    } catch (err) {
      failed++;
      console.error(`Renovar token de Instagram ${row.page_id}:`, err.message);
    }
  }
  return { refreshed, failed };
}
