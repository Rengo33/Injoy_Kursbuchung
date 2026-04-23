export const BookingStatus = {
  Pending: 'pending',
  Scheduled: 'scheduled',
  Confirmed: 'confirmed',
  Failed: 'failed',
  Cancelled: 'cancelled',
  Waitlist: 'waitlist',
} as const

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus]

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'offen',
  scheduled: 'geplant',
  confirmed: 'bestätigt',
  failed: 'fehlgeschlagen',
  cancelled: 'storniert',
  waitlist: 'Warteliste',
}

export function labelFor(status: string): string {
  return (BOOKING_STATUS_LABEL as Record<string, string>)[status] ?? status
}
