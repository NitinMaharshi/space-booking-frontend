import { api } from '@/lib/api';
import type {
  ApiEnvelope,
  Booking,
  BookingStatus,
  PaginatedResult,
} from '@/types';

export interface BookingQuery {
  page?: number;
  limit?: number;
  status?: BookingStatus | '';
  spaceId?: string;
  memberId?: string;
  date?: string;
}

export interface CreateBookingInput {
  spaceId: string;
  startTime: string;
  endTime: string;
  partySize: number;
  notes?: string;
}

export const bookingsApi = {
  list: (query: BookingQuery) =>
    api
      .get<ApiEnvelope<PaginatedResult<Booking>>>('/bookings', {
        params: query,
      })
      .then((r) => r.data.data),

  get: (id: string) =>
    api.get<ApiEnvelope<Booking>>(`/bookings/${id}`).then((r) => r.data.data),

  create: (data: CreateBookingInput) =>
    api.post<ApiEnvelope<Booking>>('/bookings', data).then((r) => r.data.data),

  approve: (id: string) =>
    api
      .patch<ApiEnvelope<Booking>>(`/bookings/${id}/approve`)
      .then((r) => r.data.data),

  reject: (id: string, rejectionReason: string) =>
    api
      .patch<ApiEnvelope<Booking>>(`/bookings/${id}/reject`, {
        rejectionReason,
      })
      .then((r) => r.data.data),

  cancel: (id: string) =>
    api
      .patch<ApiEnvelope<Booking>>(`/bookings/${id}/cancel`)
      .then((r) => r.data.data),
};
