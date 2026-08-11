// src/lib/reminder-cron.js
// Lógica del cron job para enviar recordatorios 1 día antes

import { sendReminderEmail } from './email.js';

/**
 * Obtiene la fecha de mañana en formato YYYY-MM-DD (zona horaria Chile)
 */
function getTomorrowDate() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatter = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(tomorrow);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;

  return `${year}-${month}-${day}`;
}

/**
 * Busca citas de mañana que no han recibido recordatorio
 */
async function getAppointmentsForTomorrow(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn('Supabase not configured, cannot fetch appointments');
    return [];
  }

  const tomorrowDate = getTomorrowDate();

  try {
    const url = `${env.SUPABASE_URL}/rest/v1/scheduled_appointments?appointment_date=eq.${tomorrowDate}&reminder_sent=eq.false&select=*`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch appointments: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();
    console.log(`Found ${data.length} appointments for tomorrow (${tomorrowDate})`);
    return data;
  } catch (err) {
    console.error('Error fetching appointments:', err.message);
    return [];
  }
}

/**
 * Marca una cita como "recordatorio enviado"
 */
async function markReminderSent(appointmentId, env) {
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/scheduled_appointments?id=eq.${appointmentId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ reminder_sent: true })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to mark reminder sent: ${response.status} - ${errorText}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error marking reminder sent:', err.message);
    return false;
  }
}

/**
 * Procesa todos los recordatorios pendientes para mañana
 */
export async function processReminders(env) {
  console.log('Starting reminder cron job...');

  const appointments = await getAppointmentsForTomorrow(env);

  if (appointments.length === 0) {
    console.log('No appointments found for tomorrow');
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const appointment of appointments) {
    console.log(`Processing reminder for ${appointment.client_name} (${appointment.client_email})`);

    const emailResult = await sendReminderEmail(
      {
        clientName: appointment.client_name,
        clientEmail: appointment.client_email,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        calendarLink: appointment.calendar_link
      },
      env
    );

    if (emailResult && emailResult.success) {
      await markReminderSent(appointment.id, env);
      sent++;
      console.log(`Reminder sent successfully to ${appointment.client_email}`);
    } else {
      failed++;
      console.error(`Failed to send reminder to ${appointment.client_email}`);
    }
  }

  console.log(`Reminder cron finished: ${sent} sent, ${failed} failed`);

  return {
    processed: appointments.length,
    sent,
    failed
  };
}
