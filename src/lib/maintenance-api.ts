import { api } from '@/lib/api';
import type { ApiEnvelope, MaintenanceWindow, PaginatedResult } from '@/types';

export interface CreateMaintenanceInput {
  spaceId: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export const maintenanceApi = {
  list: (params: { page?: number; limit?: number; spaceId?: string }) =>
    api
      .get<ApiEnvelope<PaginatedResult<MaintenanceWindow>>>('/maintenance', { params })
      .then((r) => r.data.data),

  create: (data: CreateMaintenanceInput) =>
    api.post<ApiEnvelope<MaintenanceWindow>>('/maintenance', data).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/maintenance/${id}`),
};
