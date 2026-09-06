import { describe, it, expect } from 'vitest';
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
