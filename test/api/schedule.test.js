import { describe, it, expect, afterEach } from 'vitest';
import { onRequestPost, onRequestGet } from '../../src/api/schedule.js';

function postRequest(body) {
  return new Request('https://example.com/api/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const validPayload = {
  date: '2026-09-10',
  time: '14:30',
  name: 'Ana Pérez',
  email: 'ana@example.com',
};

// These only exercise the validation layer, which runs before Supabase,
// Google Calendar, or email are ever touched — no external mocking needed.
describe('POST /api/schedule validation', () => {
  it('rejects invalid JSON with 400', async () => {
    const res = await onRequestPost({ request: postRequest('{not json'), env: {} });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed date with 400', async () => {
    const res = await onRequestPost({
      request: postRequest({ ...validPayload, date: '10-09-2026' }),
      env: {},
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/date/);
  });

  it('rejects a malformed time with 400', async () => {
    const res = await onRequestPost({
      request: postRequest({ ...validPayload, time: '2:30pm' }),
      env: {},
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/time/);
  });

  it('rejects an empty name with 400', async () => {
    const res = await onRequestPost({
      request: postRequest({ ...validPayload, name: '   ' }),
      env: {},
    });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed email with 400', async () => {
    const res = await onRequestPost({
      request: postRequest({ ...validPayload, email: 'not-an-email' }),
      env: {},
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/email/);
  });
});

describe('GET /api/schedule', () => {
  it('reports ok status without touching any external service', async () => {
    const res = await onRequestGet({ request: new Request('https://example.com/api/schedule'), env: {} });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('schedule');
  });
});

describe('POST /api/schedule booking flow (integration)', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = originalFetch; });

  // Una fecha siempre futura, para no chocar con la validación de "fecha pasada".
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const booking = { date: future, time: '15:00', name: 'Ana Pérez', email: 'ana@example.com' };
  const env = {
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_SERVICE_KEY: 'service-key',
    GOOGLE_CLIENT_ID: 'id',
    GOOGLE_CLIENT_SECRET: 'secret',
    GOOGLE_REFRESH_TOKEN: 'refresh',
    RESEND_API_KEY: 'resend',
  };

  function fakeServices({ existing = [], availabilityStatus = 200, reserveStatus = 201, calendarOk = true, meetOk = true } = {}) {
    const calls = { reserve: null, patch: null, deleted: false, calendar: [], email: null };
    globalThis.fetch = async (url, opts = {}) => {
      const href = String(url);
      const method = opts.method || 'GET';
      if (href.includes('scheduled_appointments')) {
        if (method === 'GET') return new Response(JSON.stringify(existing), { status: availabilityStatus });
        if (method === 'POST') {
          calls.reserve = JSON.parse(opts.body);
          return new Response(JSON.stringify([{ id: 'row-1' }]), { status: reserveStatus });
        }
        if (method === 'PATCH') { calls.patch = JSON.parse(opts.body); return new Response(null, { status: 204 }); }
        if (method === 'DELETE') { calls.deleted = true; return new Response(null, { status: 204 }); }
      }
      if (href.includes('oauth2.googleapis.com')) {
        return new Response(JSON.stringify({ access_token: 'token' }), { status: 200 });
      }
      if (href.includes('googleapis.com/calendar')) {
        const withMeet = href.includes('conferenceDataVersion=1');
        calls.calendar.push(href);
        if (!calendarOk || (withMeet && !meetOk)) {
          return new Response(JSON.stringify({ error: { message: 'nope' } }), { status: 400 });
        }
        return new Response(JSON.stringify({
          id: 'evt-1',
          htmlLink: 'https://www.google.com/calendar/event?eid=1',
          ...(withMeet ? { hangoutLink: 'https://meet.google.com/abc-defg-hij' } : {}),
        }), { status: 200 });
      }
      if (href.includes('api.resend.com')) {
        calls.email = JSON.parse(opts.body);
        return new Response(JSON.stringify({ id: 'email-1' }), { status: 200 });
      }
      throw new Error(`Unexpected fetch in test: ${href}`);
    };
    return calls;
  }

  it('rejects dates in the past', async () => {
    const res = await onRequestPost({ request: postRequest({ ...booking, date: '2020-01-01' }), env: {} });
    expect(res.status).toBe(400);
  });

  it('fails closed (503) when availability cannot be checked', async () => {
    const calls = fakeServices({ availabilityStatus: 500 });
    const res = await onRequestPost({ request: postRequest(booking), env });
    expect(res.status).toBe(503);
    expect(calls.reserve).toBeNull();
    expect(calls.calendar).toHaveLength(0);
  });

  it('rejects a slot that overlaps an existing 20-minute demo', async () => {
    const calls = fakeServices({ existing: [{ appointment_time: '14:50:00' }] });
    const res = await onRequestPost({ request: postRequest(booking), env });
    expect(res.status).toBe(409);
    expect(calls.calendar).toHaveLength(0);
  });

  it('returns 409 without creating a calendar event when the database rejects a duplicate slot', async () => {
    const calls = fakeServices({ reserveStatus: 409 });
    const res = await onRequestPost({ request: postRequest(booking), env });
    expect(res.status).toBe(409);
    expect(calls.calendar).toHaveLength(0);
  });

  it('releases the reserved slot if Google Calendar fails', async () => {
    const calls = fakeServices({ calendarOk: false });
    const res = await onRequestPost({ request: postRequest(booking), env });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(calls.deleted).toBe(true);
  });

  it('books with a Meet link, invites the client and stores the join link', async () => {
    const calls = fakeServices();
    const res = await onRequestPost({ request: postRequest(booking), env });
    expect(res.status).toBe(200);
    expect(calls.reserve.event_id).toMatch(/^pending:/);
    expect(calls.calendar[0]).toContain('sendUpdates=all');
    expect(calls.patch).toMatchObject({ event_id: 'evt-1', calendar_link: 'https://meet.google.com/abc-defg-hij' });
    expect(calls.email.html).toContain('Unirse a Google Meet');
  });

  it('still books (without Meet) if the account cannot create a video call', async () => {
    const calls = fakeServices({ meetOk: false });
    const res = await onRequestPost({ request: postRequest(booking), env });
    expect(res.status).toBe(200);
    expect(calls.calendar).toHaveLength(2);
    expect(calls.patch.calendar_link).toContain('google.com/calendar');
    expect(calls.email.html).toContain('Ver cita en Google Calendar');
    expect(calls.email.html).not.toContain('Unirse a Google Meet');
  });
});
