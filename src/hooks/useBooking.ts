import { useApp } from '@/store/useApp';

export function useBooking(id: string | undefined) {
  return useApp((s) => s.bookings.find((b) => b.id === id) ?? s.requests.find((b) => b.id === id));
}
