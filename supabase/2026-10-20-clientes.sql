-- 2026-10-20 — se corre a mano en el SQL Editor de Supabase (proyecto ewhqshvmrinqsevjfjtz).
-- Clientes: la configuración del bot de cada negocio, en un solo lugar para
-- todos sus canales. Ver src/lib/clients.js, src/lib/booking.js y botFor.

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  bot_prompt text,
  -- Google Calendar que el cliente compartió con la cuenta del sistema
  -- (normalmente su correo de Gmail). Sin esto no hay agenda automática.
  calendar_id text,
  -- Duración de cada hora que ofrece el bot, en minutos.
  slot_minutes integer not null default 60 check (slot_minutes between 10 and 240),
  -- Horario de atención: {"lun": ["09:00","18:00"], "sab": [["10:00","13:00"]], ...}
  -- Claves dom, lun, mar, mie, jue, vie, sab; un día sin clave está cerrado.
  -- Para colación: [["09:00","13:00"],["15:00","19:00"]].
  horario jsonb,
  created_at timestamptz not null default now()
);

alter table public.clientes enable row level security;

alter table public.meta_connections
  add column if not exists cliente_id uuid references public.clientes(id) on delete set null;
alter table public.whatsapp_connections
  add column if not exists cliente_id uuid references public.clientes(id) on delete set null;
