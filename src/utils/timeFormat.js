/**
 * Time formatting utility for DailyOS
 * Supports 12-hour (AM/PM), 24-hour exact, and time range formatting
 */

/**
 * Format a time string (e.g. "14:30" or "09:15") according to format mode
 * @param {string} timeStr - Time string in "HH:MM" 24h format
 * @param {string} formatMode - '12h' | '24h' | 'range'
 * @returns {string} Formatted time string
 */
export function formatTime(timeStr, formatMode = '12h') {
  if (!timeStr || typeof timeStr !== 'string') return '';

  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;

  const hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0');

  if (isNaN(hours)) return timeStr;

  if (formatMode === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  // Default: 12h AM/PM
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutes} ${period}`;
}

/**
 * Format a time range string given a start time and estimated minutes duration
 * @param {string} startTimeStr - Start time "14:30"
 * @param {number} durationMinutes - Duration in minutes (e.g. 45)
 * @param {string} formatMode - '12h' | '24h' | 'range'
 * @returns {string} Formatted range string (e.g., "2:30 PM – 3:15 PM" or "14:30 – 15:15")
 */
export function formatTimeRange(startTimeStr, durationMinutes = 30, formatMode = '12h') {
  if (!startTimeStr || typeof startTimeStr !== 'string') return '';

  const parts = startTimeStr.split(':');
  if (parts.length < 2) return startTimeStr;

  const startHour = parseInt(parts[0], 10);
  const startMin = parseInt(parts[1], 10);

  if (isNaN(startHour) || isNaN(startMin)) return startTimeStr;

  const totalStartMins = startHour * 60 + startMin;
  const totalEndMins = (totalStartMins + (Number(durationMinutes) || 30)) % 1440; // wrap at midnight

  const endHour = Math.floor(totalEndMins / 60);
  const endMin = totalEndMins % 60;

  const endStr = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

  const formattedStart = formatTime(startTimeStr, formatMode === 'range' ? '12h' : formatMode);
  const formattedEnd = formatTime(endStr, formatMode === 'range' ? '12h' : formatMode);

  if (formatMode === 'range') {
    return `${formattedStart} – ${formattedEnd}`;
  }

  return formattedStart;
}
