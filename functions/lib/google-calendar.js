// functions/lib/google-calendar.js
// Google Calendar API integration with Workload Identity

import { ApiError } from './errors.js';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_TIMEZONE = 'America/Santiago';

async function getAccessToken(context) {
  const oidcToken = context.env.WORKLOAD_OIDC_TOKEN;
  
  if (!oidcToken) {
    throw new ApiError('OIDC token not available. Check WIF configuration.', 500);
  }

  const provider = "projects/658233084064/locations/global/workloadIdentityPools/pyme/providers/cloudflare-provider";
  
  try {
    const response = await fetch("https://sts.googleapis.com/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        audience: `//iam.googleapis.com/${provider}`,
        requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
        subject_token: oidcToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:id_token"
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new ApiError(`STS token exchange failed: ${data.error}`, 400);
    }

    if (!data.access_token) {
      throw new ApiError('No access token received from STS', 500);
    }

    return data.access_token;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Token exchange error: ${err.message}`, 500);
  }
}

export async function createCalendarEvent(options, context) {
  const {
    title,
    date,
    time,
    attendeeEmail = null,
    description = 'Cita agendada vía Dominga',
    durationMinutes = 60
  } = options;

  if (!title || !date || !time) {
    throw new ApiError('Missing: title, date, time', 400);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ApiError('Invalid date format. Expected YYYY-MM-DD', 400);
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new ApiError('Invalid time format. Expected HH:MM', 400);
  }

  const [hours, minutes] = time.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new ApiError('Invalid time values', 400);
  }

  try {
    const accessToken = await getAccessToken(context);

    const startDateTime = new Date(`${date}T${time}:00`).toISOString();
    const endDateTime = new Date(
      new Date(startDateTime).getTime() + durationMinutes * 60 * 1000
    ).toISOString();

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

    if (attendeeEmail) {
      eventPayload.attendees = [{ email: attendeeEmail }];
    }

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
        `Google Calendar error: ${eventData.error?.message || 'Unknown'}`,
        eventResponse.status
      );
    }

    if (!eventData.id) {
      throw new ApiError('No event ID in response', 500);
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
    throw new ApiError(`Calendar event failed: ${err.message}`, 500);
  }
}

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
    throw new ApiError(`Cancel failed: ${err.message}`, 500);
  }
}
