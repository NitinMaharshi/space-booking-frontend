import { api } from '@/lib/api';
import type { ApiEnvelope, User } from '@/types';

export interface AuthPayload {
  accessToken: string;
  user: User;
}

export const authApi = {
  register: (data: { email: string; password: string; fullName: string }) =>
    api.post<ApiEnvelope<AuthPayload>>('/auth/register', data).then((r) => r.data.data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiEnvelope<AuthPayload>>('/auth/login', data).then((r) => r.data.data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<ApiEnvelope<User>>('/auth/me').then((r) => r.data.data),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
};
