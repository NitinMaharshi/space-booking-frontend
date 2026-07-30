import { api } from '@/lib/api';
import type { ApiEnvelope, PaginatedResult, Space, SpaceType } from '@/types';

export interface SpaceQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: SpaceType | '';
  minCapacity?: number;
}

export interface SpaceInput {
  name: string;
  type: SpaceType;
  description?: string;
  capacity: number;
  hourlyRate: number;
  amenities?: string[];
  isActive?: boolean;
}

export interface Availability {
  date: string;
  bookings: { id: string; startTime: string; endTime: string }[];
  maintenanceWindows: { id: string; startTime: string; endTime: string; reason: string }[];
}

export const spacesApi = {
  list: (query: SpaceQuery) =>
    api
      .get<ApiEnvelope<PaginatedResult<Space>>>('/spaces', { params: query })
      .then((r) => r.data.data),

  get: (id: string) => api.get<ApiEnvelope<Space>>(`/spaces/${id}`).then((r) => r.data.data),

  availability: (id: string, date: string) =>
    api
      .get<ApiEnvelope<Availability>>(`/spaces/${id}/availability`, { params: { date } })
      .then((r) => r.data.data),

  create: (data: SpaceInput) => api.post<ApiEnvelope<Space>>('/spaces', data).then((r) => r.data.data),

  update: (id: string, data: Partial<SpaceInput>) =>
    api.patch<ApiEnvelope<Space>>(`/spaces/${id}`, data).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/spaces/${id}`),
};
