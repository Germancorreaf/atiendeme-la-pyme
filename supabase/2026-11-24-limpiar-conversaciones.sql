-- 2026-11-24 — limpiar todas las conversaciones del panel (/admin → Conversaciones).
-- Se corre a mano en el SQL Editor de Supabase (proyecto ewhqshvmrinqsevjfjtz).
-- Borra TODAS las filas de chat_sessions. No hay otras tablas que apunten a ella.
-- Ojo: el borrado es irreversible salvo por el respaldo del paso 2.

-- 1) Cuántas conversaciones hay antes de borrar.
select count(*) as conversaciones_antes from chat_sessions;

-- 2) Respaldo: copia de todas las conversaciones en una tabla aparte.
--    Si después no se necesita, borrarla con:  drop table chat_sessions_respaldo_2026_11_24;
create table if not exists public.chat_sessions_respaldo_2026_11_24 as
  select * from public.chat_sessions;

-- 3) Verificar que el respaldo tiene las mismas filas (deben coincidir con el paso 1).
select count(*) as filas_en_respaldo from public.chat_sessions_respaldo_2026_11_24;

-- 4) Borrar todas las conversaciones. Correr solo si los números del paso 1 y 3 coinciden.
begin;
delete from public.chat_sessions;
commit;

-- 5) Comprobar que quedó vacía.
select count(*) as conversaciones_despues from chat_sessions;
