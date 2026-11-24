-- 2026-11-24 — limpiar todas las conversaciones del panel (/admin → Conversaciones).
-- Se corre a mano en el SQL Editor de Supabase (proyecto ewhqshvmrinqsevjfjtz).
-- Borra TODAS las filas de chat_sessions. Es irreversible: no hay respaldo.
-- No hay otras tablas que apunten a chat_sessions. Las conexiones, clientes y la agenda no se tocan.

-- 1) Cuántas conversaciones hay antes de borrar.
select count(*) as conversaciones_antes from chat_sessions;

-- 2) Borrar todas las conversaciones.
delete from public.chat_sessions;

-- 3) Comprobar que quedó vacía (debe dar 0).
select count(*) as conversaciones_despues from chat_sessions;
