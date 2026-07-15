import {
  validateName,
  validateEmail,
  validateDate,
  validateTime,
  ValidationError
} from '../lib/validator.js';

import {
  ApiError,
  sendError,
  sendSuccess,
  parseJSON
} from '../lib/errors.js';

import { createCalendarEvent } from '../lib/google-calendar.js';
import { checkAllLimits } from '../lib/rateLimit.js';

export async function onRequestPost(context) {
  try {
    // 1. PARSE & VALIDATE INPUT
    const body = await parseJSON(context.request);
    const { date, time, name, email, notes, phone, sessionId } = body;

    let validDate, validTime, validName, validEmail;
    
    try {
      validDate = validateDate(date);
      validTime = validateTime(time);
      validName = validateName(name);
      validEmail = validateEmail(email);
    } catch (err) {
      if (err instanceof ValidationError) {
        throw new ApiError(err.message, 400);
      }
      throw err;
    }

    // 2. RATE LIMIT CHECK (per email)
    const rateLimitKey = email || 'anonymous';
    const rlCheck = await checkAllLimits(
      rateLimitKey,
      context.env.RATE_LIMIT_KV,
      {
        maxRequests: 5,
        windowSeconds: 3600,
        maxBurstRequests: 2,
        burstWindowSeconds: 60
      }
    );

    if (!rlCheck.allowed) {
      throw new ApiError(
        `Too many scheduling requests. Try again in ${rlCheck.retryAfter}s`,
        429
      );
    }

    // 3. CREATE CALENDAR EVENT
    const eventResult = await createCalendarEvent(
      {
        title: `Cita - ${validName}`,
        date: validDate,
        time: validTime,
        attendeeEmail: validEmail,
        description: notes ? `Notas: ${notes}` : 'Cita agendada vía Dominga',
        durationMinutes: 60
      },
      context
    );

    // 4. SAVE TO SUPABASE (optional tracking)
    if (context.env.SUPABASE_URL && context.env.SUPABASE_SERVICE_KEY) {
      try {
        await fetch(
          `${context.env.SUPABASE_URL}/rest/v1/scheduled_appointments`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': context.env.SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_KEY}`
            },
            body: JSON.stringify({
              google_event_id: eventResult.eventId,
              date: validDate,
              time: validTime,
              client_name: validName,
              client_email: validEmail,
              client_phone: phone || null,
              notes: notes || null,
              session_id: sessionId || null,
              status: 'confirmed',
              created_at: new Date().toISOString()
            })
          }
        );
      } catch (err) {
        console.warn('Failed to save to Supabase:', err.message);
      }
    }

    // 5. RESPOND
    return sendSuccess({
      success: true,
      eventId: eventResult.eventId,
      message: eventResult.message,
      details: {
        date: validDate,
        time: validTime,
        clientName: validName,
        clientEmail: validEmail,
        calendarLink: eventResult.htmlLink
      }
    });
  } catch (err) {
    const apiErr = err instanceof ApiError ? err : new ApiError(err.message, 500);
    return sendError(apiErr, context.request.url);
  }
}

export async function onRequestGet(context) {
  return sendSuccess({
    status: 'ok',
    service: 'schedule',
    timestamp: new Date().toISOString()
  });
}

export default {
  onRequestPost,
  onRequestGet
};
