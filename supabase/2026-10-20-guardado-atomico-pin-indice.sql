-- 2026-10-20 — se corre a mano en el SQL Editor de Supabase (proyecto ewhqshvmrinqsevjfjtz).

-- 1) Reservas: dos pedidos simultáneos no pueden tomar la misma hora.
--    schedule.js ya maneja el 409 que devuelve este índice.
create unique index if not exists scheduled_appointments_unique_slot
  on public.scheduled_appointments (appointment_date, appointment_time);

-- 2) WhatsApp: PIN de verificación en dos pasos de cada número registrado
--    (hace falta para re-registrar o migrar el número).
alter table public.whatsapp_connections add column if not exists two_step_pin text;

-- 3) Conversaciones: agregar mensajes en una sola operación. Antes cada
--    canal leía la conversación y la reescribía completa, y dos mensajes
--    casi simultáneos podían pisarse. Los demás campos solo se escriben si
--    vienen; "escalated" nunca vuelve a false.
create or replace function public.append_chat_messages(
  p_session_id text,
  p_messages jsonb,
  p_fields jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into chat_sessions (session_id, messages, updated_at)
  values (p_session_id, p_messages, now())
  on conflict (session_id) do update
    set messages = coalesce(chat_sessions.messages, '[]'::jsonb) || excluded.messages,
        updated_at = now();

  update chat_sessions set
    lead_contact      = coalesce(p_fields->>'lead_contact', lead_contact),
    sender_name       = coalesce(p_fields->>'sender_name', sender_name),
    sender_avatar_url = coalesce(p_fields->>'sender_avatar_url', sender_avatar_url),
    escalated         = coalesce(escalated, false) or coalesce((p_fields->>'escalated')::boolean, false),
    escalation_reason = coalesce(p_fields->>'escalation_reason', escalation_reason)
  where session_id = p_session_id;
end;
$$;

-- Solo el Worker (clave de servicio) puede llamarla; la clave pública no.
revoke execute on function public.append_chat_messages(text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.append_chat_messages(text, jsonb, jsonb) to service_role;
