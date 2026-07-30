import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import type { ApiEnvelope } from '@/types';

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const res = await axios.post<ApiEnvelope<{ accessToken: string }>>(
    `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/auth/refresh`,
    {},
    { withCredentials: true },
  );
  const token = res.data.data.accessToken;
  useAuthStore.getState().setAccessToken(token);
  return token;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthRoute = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const token = await refreshPromise;
        original.headers.set('Authorization', `Bearer ${token}`);
        return api(original);
      } catch {
        useAuthStore.getState().clearAuth();
      }
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiEnvelope<unknown> | undefined;
    if (data?.message) return data.message;
  }
  return fallback;
}
