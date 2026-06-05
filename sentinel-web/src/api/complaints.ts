import { apiFetch, getToken } from './client';
import type {
  AbnLookupResultDto,
  AttachmentDto,
  ComplaintDetailDto,
  ComplaintListItemDto,
  ComplaintWriteDto,
  CreateDraftResponse,
  GroundDto,
  SubmitResultDto,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5187/api';

// Grounds are static reference data; memoise the request so repeated pages
// (wizard, triage queue, complaint detail) don't refetch the same list.
let groundsCache: Promise<GroundDto[]> | null = null;

export const complaintsApi = {
  getGrounds: () => {
    if (!groundsCache) {
      groundsCache = apiFetch<GroundDto[]>('/complaints/grounds').catch((err) => {
        groundsCache = null;
        throw err;
      });
    }
    return groundsCache;
  },

  createDraft: () => apiFetch<CreateDraftResponse>('/complaints/draft', { method: 'POST' }),

  saveDraft: (id: string, payload: ComplaintWriteDto) =>
    apiFetch<void>(`/complaints/${id}/draft`, { method: 'PUT', body: payload }),

  submit: (id: string, payload: ComplaintWriteDto) =>
    apiFetch<SubmitResultDto>(`/complaints/${id}/submit`, { method: 'POST', body: payload }),

  submitAnonymous: (payload: ComplaintWriteDto) =>
    apiFetch<SubmitResultDto>('/complaints/anonymous', { method: 'POST', body: payload }),

  mine: () => apiFetch<ComplaintListItemDto[]>('/complaints/mine'),

  detail: (id: string) => apiFetch<ComplaintDetailDto>(`/complaints/${id}`),

  deleteDraft: (id: string) => apiFetch<void>(`/complaints/${id}`, { method: 'DELETE' }),

  uploadAttachment: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiFetch<AttachmentDto>(`/complaints/${id}/attachments`, { method: 'POST', body: form });
  },

  lookupAbn: (abn: string, signal?: AbortSignal) =>
    apiFetch<AbnLookupResultDto>(`/complaints/abn-lookup?abn=${encodeURIComponent(abn)}`, { signal }),

  /** Builds an authorised download URL for an attachment (used by an anchor/fetch). */
  attachmentUrl: (id: string, attachmentId: string) =>
    `${BASE_URL}/complaints/${id}/attachments/${attachmentId}`,

  downloadAttachment: async (id: string, attachmentId: string): Promise<Blob> => {
    const res = await fetch(`${BASE_URL}/complaints/${id}/attachments/${attachmentId}`, {
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : undefined,
    });
    if (!res.ok) throw new Error('Could not download the file.');
    return res.blob();
  },
};
