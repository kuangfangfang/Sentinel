import { apiFetch } from './client';
import type {
  AnalyticsDto,
  CaseNoteDto,
  CaseworkerComplaintDetailDto,
  CaseworkerOptionDto,
  DashboardSummaryDto,
  PagedResult,
  QueueItemDto,
  QueueQuery,
  Severity,
  ComplaintStatus,
} from '../types';

function toQueryString(query: QueueQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export const caseworkerApi = {
  dashboard: () => apiFetch<DashboardSummaryDto>('/caseworker/dashboard'),

  analytics: () => apiFetch<AnalyticsDto>('/caseworker/analytics'),

  queue: (query: QueueQuery) =>
    apiFetch<PagedResult<QueueItemDto>>(`/caseworker/queue${toQueryString(query)}`),

  detail: (id: string) => apiFetch<CaseworkerComplaintDetailDto>(`/caseworker/complaints/${id}`),

  changeStatus: (id: string, toStatus: ComplaintStatus, note?: string) =>
    apiFetch<CaseworkerComplaintDetailDto>(`/caseworker/complaints/${id}/status`, {
      method: 'POST',
      body: { toStatus, note },
    }),

  addNote: (id: string, body: string) =>
    apiFetch<CaseNoteDto>(`/caseworker/complaints/${id}/notes`, { method: 'POST', body: { body } }),

  setSeverity: (id: string, severity: Severity) =>
    apiFetch<CaseworkerComplaintDetailDto>(`/caseworker/complaints/${id}/severity`, {
      method: 'POST',
      body: { severity },
    }),

  listCaseworkers: () => apiFetch<CaseworkerOptionDto[]>('/caseworker/caseworkers'),

  assign: (id: string, assigneeUserId: string | null) =>
    apiFetch<CaseworkerComplaintDetailDto>(`/caseworker/complaints/${id}/assign`, {
      method: 'POST',
      body: { assigneeUserId },
    }),
};
