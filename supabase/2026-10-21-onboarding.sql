-- 2026-10-21 — se corre a mano en el SQL Editor de Supabase (proyecto ewhqshvmrinqsevjfjtz).
-- Respuestas del manual de onboarding que el cliente envía desde su link
-- personal (/onboarding/<token>): { text, answers, sent_at }. Ver src/api/onboarding.js.
alter table public.clientes add column if not exists onboarding jsonb;
