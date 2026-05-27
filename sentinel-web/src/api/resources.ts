import { apiFetch } from './client';
import type { ResourceDto } from '../types';

export const resourcesApi = {
  list: () => apiFetch<ResourceDto[]>('/resources'),
};
