import { describe, it, expect, afterEach, vi } from 'vitest';
import { processReminders } from '../../src/lib/reminder-cron.js';
import { getTodayInfo } from '../../src/lib/dominga-prompt.js';

const env = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'svc', RESEND_API_KEY: 'rk' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const appt = (id, extra = {}) => ({
  id, client_name: `Cliente ${id}`, client_email: `c${id}@ejemplo.cl`,
  appointment_date: getTodayInfo().tomorrowISO, appointment_time: '15:00', calendar_link: null, ...extra,
});

// resendOk: función (n-ésimo correo) -> true/false
function stub({ rows, listStatus = 200, resendOk = () => true }) {
  const log = { list: [], patched: [], emails: [] };
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    if (u.includes('api.resend.com')) {
      const body = JSON.parse(init.body);
      log.emails.push(body);
      return resendOk(log.emails.length) ? json({ id: 'e' + log.emails.length }) : json({ message: 'fail' }, 422);
    }
    if (u.includes('/rest/v1/scheduled_appointments') && init.method === 'PATCH') {
      log.patched.push(u.match(/id=eq\.([^&]+)/)[1]);
      return json({});
    }
    if (u.includes('/rest/v1/scheduled_appointments')) {
      log.list.push(u);
      return listStatus === 200 ? json(rows) : json({ message: 'boom' }, listStatus);
    }
    return json({});
  }));
  return log;
}

afterEach(() => vi.unstubAllGlobals());

describe('processReminders', () => {
  it('pide solo las citas de mañana sin recordatorio y que no sean reservas pendientes', async () => {
    const log = stub({ rows: [] });
    expect(await processReminders(env)).toEqual({ processed: 0, sent: 0, failed: 0 });
    const url = log.list[0];
    expect(url).toContain(`appointment_date=eq.${getTodayInfo().tomorrowISO}`);
    expect(url).toContain('reminder_sent=eq.false');
    expect(url).toContain('event_id=not.like.pending:*');
  });

  it('manda un correo por cita y la marca como enviada', async () => {
    const log = stub({ rows: [appt(1), appt(2)] });
    expect(await processReminders(env)).toEqual({ processed: 2, sent: 2, failed: 0 });
    expect(log.emails.map((e) => e.to)).toEqual(['c1@ejemplo.cl', 'c2@ejemplo.cl']);
    expect(log.patched).toEqual(['1', '2']);
  });

  it('si un correo falla, esa cita NO se marca (se reintenta al día siguiente del cron) y las demás siguen', async () => {
    const log = stub({ rows: [appt(1), appt(2), appt(3)], resendOk: (n) => n !== 2 });
    expect(await processReminders(env)).toEqual({ processed: 3, sent: 2, failed: 1 });
    expect(log.patched).toEqual(['1', '3']);
  });

  it('sin RESEND_API_KEY no se marca nada como enviado', async () => {
    const log = stub({ rows: [appt(1)] });
    expect(await processReminders({ ...env, RESEND_API_KEY: undefined })).toEqual({ processed: 1, sent: 0, failed: 1 });
    expect(log.patched).toEqual([]);
  });

  it('si Supabase falla o no está configurado, no hace nada ni lanza', async () => {
    stub({ rows: [], listStatus: 500 });
    expect(await processReminders(env)).toEqual({ processed: 0, sent: 0, failed: 0 });
    expect(await processReminders({})).toEqual({ processed: 0, sent: 0, failed: 0 });
  });
});
