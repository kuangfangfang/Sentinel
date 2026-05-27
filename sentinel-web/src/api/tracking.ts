import { apiFetch } from './client';
import type { TrackResultDto } from '../types';

export const trackingApi = {
  track: (referenceCode: string) =>
    apiFetch<TrackResultDto>('/tracking/status', { method: 'POST', body: { referenceCode } }),
};
