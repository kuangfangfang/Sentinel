import { apiFetch } from './client';
import type { AuthResponse, UserDto } from '../types';

export const authApi = {
  register: (fullName: string, email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: { fullName, email, password } }),

  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),

  logout: () => apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),

  me: () => apiFetch<UserDto>('/auth/me'),
};
