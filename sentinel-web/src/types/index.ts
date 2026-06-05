// TypeScript interfaces mirroring the backend DTOs. Because the API serialises
// enums as their names (JsonStringEnumConverter), they are string unions here, so
// a mismatch between the .NET backend and the React frontend is a compile error.

export type ComplaintStatus =
  | 'Draft'
  | 'Submitted'
  | 'UnderReview'
  | 'MoreInfoNeeded'
  | 'Resolved'
  | 'Closed'
  | 'Withdrawn';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

/** Ground enum names (see GroundType.cs). Kept as string for flexibility; labels come from the API. */
export type GroundType = string;

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  expiresAtUtc: string;
  user: UserDto;
}

export interface GroundDto {
  type: GroundType;
  value: string;
  group: string;
  label: string;
  requiresDetail: boolean;
  detailPrompt?: string | null;
}

export interface ResourceDto {
  id: string;
  category: string;
  name: string;
  description?: string | null;
  url?: string | null;
  phoneNumber?: string | null;
}

export interface RespondentDto {
  name: string;
  abnAcn?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  mobile?: string | null;
  addressLine?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  relationshipToComplainant?: string | null;
}

export interface ComplainantContactDto {
  title?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  addressLine?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  email?: string | null;
  phoneAh?: string | null;
  phoneBh?: string | null;
  assistanceRequired?: string | null;
}

export interface GroundSelectionDto {
  groundType: GroundType;
  conditionalDetail?: string | null;
}

export interface OnBehalfOfDto {
  firstName: string;
  lastName: string;
  email?: string | null;
  relationshipToComplainant?: string | null;
  assistanceRequired?: string | null;
}

export interface RepresentativeDto {
  title?: string | null;
  firstName: string;
  lastName: string;
  position?: string | null;
  organisation?: string | null;
  addressLine?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  email?: string | null;
  phoneBh?: string | null;
  mobile?: string | null;
  assistanceRequired?: string | null;
}

/** The payload sent for both draft saves and submissions. Fields are optional client-side. */
export interface ComplaintWriteDto {
  title: string;
  description: string;
  incidentDate: string | null; // yyyy-MM-dd
  incidentLocation: string;
  desiredOutcome?: string | null;
  complainantContact?: ComplainantContactDto | null;
  referringOrganisation?: string | null;
  priorComplaintMade?: boolean | null;
  priorComplaintAgency?: string | null;
  priorComplaintDate?: string | null;
  priorComplaintStatus?: string | null;
  priorComplaintFinalisedDate?: string | null;
  priorComplaintOutcome?: string | null;
  delayReason?: string | null;
  interpreterRequired: boolean;
  preferredLanguage?: string | null;
  genAiUsed: boolean | null;
  privacyNoticeAccepted: boolean;
  grounds: GroundSelectionDto[];
  respondents: RespondentDto[];
  onBehalfOf?: OnBehalfOfDto | null;
  representative?: RepresentativeDto | null;
  wizardStep: number;
}

export interface AttachmentDto {
  id: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  scanStatus: string;
  uploadedAt: string;
}

export interface StatusHistoryDto {
  fromStatus?: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  changedByName?: string | null;
  note?: string | null;
  changedAt: string;
}

export interface ComplaintListItemDto {
  id: string;
  referenceCode?: string | null;
  title: string;
  status: ComplaintStatus;
  severity?: Severity | null;
  submittedAt?: string | null;
  updatedAt: string;
  wizardStep: number;
  isAnonymous: boolean;
}

export interface ComplaintDetailDto {
  id: string;
  referenceCode?: string | null;
  title: string;
  description: string;
  incidentDate?: string | null;
  incidentLocation: string;
  desiredOutcome?: string | null;
  complainantContact?: ComplainantContactDto | null;
  referringOrganisation?: string | null;
  priorComplaintMade?: boolean | null;
  priorComplaintAgency?: string | null;
  priorComplaintDate?: string | null;
  priorComplaintStatus?: string | null;
  priorComplaintFinalisedDate?: string | null;
  priorComplaintOutcome?: string | null;
  delayReason?: string | null;
  status: ComplaintStatus;
  severity?: Severity | null;
  assignedToUserId?: string | null;
  assignedToName?: string | null;
  interpreterRequired: boolean;
  preferredLanguage?: string | null;
  genAiUsed?: boolean | null;
  isAnonymous: boolean;
  wizardStep: number;
  createdAt: string;
  submittedAt?: string | null;
  updatedAt: string;
  respondents: RespondentDto[];
  grounds: GroundSelectionDto[];
  onBehalfOf?: OnBehalfOfDto | null;
  representative?: RepresentativeDto | null;
  attachments: AttachmentDto[];
  statusHistory: StatusHistoryDto[];
}

export interface CreateDraftResponse {
  id: string;
}

export interface AbnLookupResultDto {
  lookupAvailable: boolean;
  isVerified: boolean;
  entityName?: string | null;
  message?: string | null;
}

export interface SubmitResultDto {
  id: string;
  referenceCode: string;
  status: ComplaintStatus;
  submittedAtUtc: string;
}

export interface TrackResultDto {
  referenceCode: string;
  title: string;
  status: ComplaintStatus;
  submittedAt?: string | null;
  updatedAt: string;
  statusHistory: StatusHistoryDto[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface QueueItemDto {
  id: string;
  referenceCode?: string | null;
  title: string;
  status: ComplaintStatus;
  severity?: Severity | null;
  incidentLocation: string;
  incidentDate?: string | null;
  submittedAt?: string | null;
  respondentCount: number;
  isAnonymous: boolean;
  assignedToUserId?: string | null;
  assignedToName?: string | null;
}

export interface CaseworkerOptionDto {
  id: string;
  name: string;
  email?: string | null;
}

export interface CaseNoteDto {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface CaseworkerComplaintDetailDto {
  complaint: ComplaintDetailDto;
  complainantUserId?: string | null;
  caseNotes: CaseNoteDto[];
}

export interface DashboardSummaryDto {
  total: number;
  openCount: number;
  byStatus: Record<string, number>;
  byGround: Record<string, number>;
}

export interface CategoryCountDto {
  category: string;
  shortCategory: string;
  count: number;
}

export interface MonthCountDto {
  month: string;
  count: number;
}

export interface AnalyticsDto {
  byGround: CategoryCountDto[];
  byMonth: MonthCountDto[];
}

export interface QueueQuery {
  status?: ComplaintStatus;
  ground?: GroundType;
  severity?: Severity;
  fromDate?: string;
  toDate?: string;
  search?: string;
  sortBy?: string;
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
  assigneeUserId?: string;
  unassigned?: boolean;
}
