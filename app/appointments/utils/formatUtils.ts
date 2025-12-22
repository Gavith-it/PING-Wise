/**
 * Utility functions for formatting
 */

export function formatTime(time: string): string {
  if (!time) return '';
  // Convert 24-hour format to 12-hour format if needed
  if (time.includes('AM') || time.includes('PM')) {
    return time;
  }
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function maskPhoneNumber(phone?: string): string {
  if (!phone) return 'N/A';
  if (phone.length <= 4) return phone;
  const visible = phone.slice(-4);
  const masked = '*'.repeat(Math.max(0, phone.length - 4));
  return `${masked}${visible}`;
}
