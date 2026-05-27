import type { ComplaintStatus } from '../types';

// Mirrors the authoritative server-side lifecycle (SRS 5.5 / StatusTransitionService).
// Used only to show sensible options in the UI; the API enforces the rule.
const TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  Draft: ['Submitted', 'Withdrawn'],
  Submitted: ['UnderReview', 'Withdrawn'],
  UnderReview: ['MoreInfoNeeded', 'Resolved', 'Withdrawn'],
  MoreInfoNeeded: ['UnderReview'],
  Resolved: ['Closed'],
  Closed: [],
  Withdrawn: [],
};

export function allowedNextStatuses(current: ComplaintStatus): ComplaintStatus[] {
  return TRANSITIONS[current] ?? [];
}
