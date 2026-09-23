/**
 * iCalendar (.ics) RFC 5545 Export Utility for DailyOS
 */

function padTwo(num) {
  return String(num).padStart(2, '0');
}

function formatDateToIcsTimestamp(dateObj) {
  const year = dateObj.getUTCFullYear();
  const month = padTwo(dateObj.getUTCMonth() + 1);
  const day = padTwo(dateObj.getUTCDate());
  const hours = padTwo(dateObj.getUTCHours());
  const minutes = padTwo(dateObj.getUTCMinutes());
  const seconds = padTwo(dateObj.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function parseDateTime(dateStr, timeStr = '09:00') {
  if (!dateStr) {
    dateStr = new Date().toISOString().split('T')[0];
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = (timeStr || '09:00').split(':').map(Number);
  
  const d = new Date(year, month - 1, day, hours, minutes, 0);
  return d;
}

function escapeIcsText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateIcsContent(tasks = [], events = [], dateStr = '') {
  const nowStamp = formatDateToIcsTimestamp(new Date());
  
  let lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DailyOS//Personal Planner & Life Dashboard//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:DailyOS Schedule ${dateStr || ''}`.trim()
  ];

  // Add Tasks
  tasks.forEach((task) => {
    const taskDate = task.scheduled_for || dateStr || new Date().toISOString().split('T')[0];
    const startTime = parseDateTime(taskDate, task.scheduled_time || '09:00');
    const estMinutes = Number(task.estimated_minutes) || 30;
    const endTime = new Date(startTime.getTime() + estMinutes * 60000);

    const dtStart = formatDateToIcsTimestamp(startTime);
    const dtEnd = formatDateToIcsTimestamp(endTime);
    const uid = `task-${task.id || Math.random().toString(36).substring(2)}@dailyos.local`;
    const isDone = task.status === 'done';

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcsText(task.title)}`,
      `DESCRIPTION:${escapeIcsText(`Category: ${task.category || 'general'} | Est: ${estMinutes}m | Status: ${task.status}`)}`,
      `STATUS:${isDone ? 'COMPLETED' : 'CONFIRMED'}`,
      'END:VEVENT'
    );
  });

  // Add Events
  events.forEach((evt) => {
    const evtDate = evt.event_date || dateStr || new Date().toISOString().split('T')[0];
    const startTime = parseDateTime(evtDate, evt.event_time || '10:00');
    const endTime = new Date(startTime.getTime() + 60 * 60000); // Default 1hr event

    const dtStart = formatDateToIcsTimestamp(startTime);
    const dtEnd = formatDateToIcsTimestamp(endTime);
    const uid = `event-${evt.id || Math.random().toString(36).substring(2)}@dailyos.local`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcsText(evt.title)}`,
      `DESCRIPTION:${escapeIcsText(evt.notes || `Category: ${evt.category || 'general'}`)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcsFile(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
