// functions/lib/google-calendar.js
// Google Calendar API wrapper using Workload Identity Federation

import { ApiError } from './errors.js';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_TIMEZONE = 'America/Santiago';

/**
 * Exchange OIDC token for Google access token
 * Uses Workload Identity Federation (no service account JSON needed)
 */
async function getAccessToken(context) {
  const oidcToken = context.env.WORKLOAD_OIDC_TOKEN;
  
  if (!oidcToken) {
    throw new ApiError('OIDC token not available. WIF may not be configured.', 500);
  }

  const provider = context.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER;
  const serviceAccount = context.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!provider || !serviceAccount) {
    throw new ApiError('Missing Google WIF environment variables', 500);
  }

  try {
    const stsResponse = await fetch('https://sts.googleapis.com/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        audience: `//iam.googleapis.com/${provider}`,
        requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        subject_token: oidcToken,
        subject_token_type: 'urn:ietf:params:oauth:token-type:id_token'
      })
    });

    const stsData = await stsResponse.json();

    if (!stsResponse.ok) {
      throw new ApiError('STS token exchange failed', 400, { stsError: stsData.error });
    }

    if (!stsData.access_token) {
      throw new ApiError('No access token in STS response', 500);
    }

    return stsData.access_token;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Failed to get access token: ${err.message}`, 500);
  }
}

/**
 * Create event in Google Calendar
 * 
 * @param {Object} options - Event details
 * @param {string} options.title - Event title (e.g., "Cita - Juan Pérez")
 * @param {string} options.date - Event date (YYYY-MM-DD)
 * @param {string} options.time - Event time (HH:MM in 24h format)
 * @param {string} options.attendeeEmail - Attendee email (optional)
 * @param {string} options.description - Event description (optional)
 * @param {number} options.durationMinutes - Event duration in minutes (default: 60)
 * @param {Object} context - Cloudflare context
 * @returns {Promise<Object>} - Created event details
 */
export async function createCalendarEvent(options, context) {
  const {
    title,
    date,
    time,
    attendeeEmail = null,
    description = 'Cita agendada vía Dominga',
    durationMinutes = 60
  } = options;

  // Validate inputs
  if (!title || !date || !time) {
    throw new ApiError('Missing required fields: title, date, time', 400);
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ApiError('Invalid date format. Expected YYYY-MM-DD', 400);
  }

  // Validate time format (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new ApiError('Invalid time format. Expected HH:MM', 400);
  }

  // Validate time range
  const [hours, minutes] = time.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new ApiError('Invalid time values', 400);
  }

  try {
    // Get access token
    const accessToken = await getAccessToken(context);

    // Build datetime strings
    const startDateTime = new Date(`${date}T${time}:00`).toISOString();
    const endDateTime = new Date(
      new Date(startDateTime).getTime() + durationMinutes * 60 * 1000
    ).toISOString();

    // Build event payload
    const eventPayload = {
      summary: title,
      description: description,
      start: {
        dateTime: startDateTime,
        timeZone: CALENDAR_TIMEZONE
      },
      end: {
        dateTime: endDateTime,
        timeZone: CALENDAR_TIMEZONE
      }
    };

    // Add attendee if email provided
    if (attendeeEmail) {
      eventPayload.attendees = [{ email: attendeeEmail }];
    }

    // Create event
    const eventResponse = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(eventPayload)
      }
    );

    const eventData = await eventResponse.json();

    if (!eventResponse.ok) {
      throw new ApiError(
        `Google Calendar API error: ${eventData.error?.message || 'Unknown error'}`,
        eventResponse.status,
        { googleError: eventData.error }
      );
    }

    if (!eventData.id) {
      throw new ApiError('No event ID in Google Calendar response', 500);
    }

    return {
      success: true,
      eventId: eventData.id,
      title: eventData.summary,
      dateTime: startDateTime,
      htmlLink: eventData.htmlLink,
      message: `✅ Cita agendada para ${date} a las ${time}`
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Calendar event creation failed: ${err.message}`, 500);
  }
}

/**
 * Get available time slots (optional, for future use)
 */
export async function getAvailableSlots(date, context) {
  // TODO: Implement when needed
  throw new ApiError('Not yet implemented', 501);
}

/**
 * Cancel event
 */
export async function cancelCalendarEvent(eventId, context) {
  if (!eventId) {
    throw new ApiError('Event ID required', 400);
  }

  try {
    const accessToken = await getAccessToken(context);

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok && response.status !== 204) {
      throw new ApiError('Failed to cancel event', response.status);
    }

    return { success: true, eventId };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Failed to cancel event: ${err.message}`, 500);
  }
}
