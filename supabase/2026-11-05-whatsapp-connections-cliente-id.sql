-- 2026-11-05: agrega cliente_id a whatsapp_connections
-- Si la tabla aún no existe (primera vez), crearla completa.
-- Si ya existe (fue creada con el SQL original del comentario en
-- whatsappConnections.js), solo agrega las columnas que faltan.

create table if not exists whatsapp_connections (
  phone_number_id text primary key,
  waba_id         text not null,
  display_phone_number text,
  business_name   text,
  access_token    text not null,
  two_step_pin    text,
  cliente_id      uuid references clientes(id) on delete set null,
  connected_at    timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Si la tabla ya existía sin las columnas nuevas:
alter table whatsapp_connections
  add column if not exists two_step_pin text;

alter table whatsapp_connections
  add column if not exists cliente_id uuid references clientes(id) on delete set null;

-- RLS: activado (igual que meta_connections). Sin policy pública: el Worker
-- usa SUPABASE_SERVICE_KEY (service role) y se salta RLS.
alter table whatsapp_connections enable row level security;
