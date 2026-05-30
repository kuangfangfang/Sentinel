import type {
  ComplaintWriteDto,
  GroundSelectionDto,
  OnBehalfOfDto,
  RepresentativeDto,
  RespondentDto,
  ComplaintDetailDto,
} from '../../types';
import { normalizeAustralianState } from '../../data/australianLocations';
import { normalizeAbnAcn, type RespondentPartyType } from './respondentIdentity';

export interface WizardRespondent extends RespondentDto {
  uiKey: string;
  partyType: RespondentPartyType;
}

/** Local working state for the five-step wizard. */
export interface WizardForm {
  title: string;
  description: string;
  incidentDate: string; // yyyy-MM-dd or ''
  incidentLocation: string;
  desiredOutcome: string;
  referringOrganisation: string;
  priorComplaintMade: boolean | null;
  priorComplaintAgency: string;
  priorComplaintDate: string;
  priorComplaintStatus: string;
  priorComplaintFinalisedDate: string;
  priorComplaintOutcome: string;
  delayReason: string;
  interpreterRequired: boolean;
  preferredLanguage: string;
  genAiUsed: boolean | null;
  privacyNoticeAccepted: boolean;
  grounds: GroundSelectionDto[];
  respondents: WizardRespondent[];
  onBehalfOf: OnBehalfOfDto | null;
  representative: RepresentativeDto | null;
}

export type UpdateForm = (patch: Partial<WizardForm>) => void;

export interface StepProps {
  form: WizardForm;
  update: UpdateForm;
  errors: string[];
}

function createUiKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID();
  return `respondent-${Math.random().toString(36).slice(2, 10)}`;
}

export function newRespondent(overrides: Partial<RespondentDto> = {}, partyType: RespondentPartyType = 'person'): WizardRespondent {
  const digits = normalizeAbnAcn(overrides.abnAcn ?? '');
  const resolvedType = digits ? 'organisation' : partyType;
  return {
    uiKey: createUiKey(),
    partyType: resolvedType,
    name: overrides.name ?? '',
    abnAcn: digits || null,
    contactEmail: overrides.contactEmail ?? null,
    contactPhone: overrides.contactPhone ?? null,
    addressLine: overrides.addressLine ?? null,
    suburb: overrides.suburb ?? null,
    state: normalizeAustralianState(overrides.state),
    postcode: overrides.postcode ?? null,
    relationshipToComplainant: overrides.relationshipToComplainant ?? '',
  };
}

export function emptyForm(): WizardForm {
  return {
    title: '',
    description: '',
    incidentDate: '',
    incidentLocation: '',
    desiredOutcome: '',
    referringOrganisation: '',
    priorComplaintMade: null,
    priorComplaintAgency: '',
    priorComplaintDate: '',
    priorComplaintStatus: '',
    priorComplaintFinalisedDate: '',
    priorComplaintOutcome: '',
    delayReason: '',
    interpreterRequired: false,
    preferredLanguage: '',
    genAiUsed: null,
    privacyNoticeAccepted: false,
    grounds: [],
    respondents: [newRespondent()],
    onBehalfOf: null,
    representative: null,
  };
}

export function fromDetail(d: ComplaintDetailDto): WizardForm {
  return {
    title: d.title ?? '',
    description: d.description ?? '',
    incidentDate: d.incidentDate ?? '',
    incidentLocation: d.incidentLocation ?? '',
    desiredOutcome: d.desiredOutcome ?? '',
    referringOrganisation: d.referringOrganisation ?? '',
    priorComplaintMade: d.priorComplaintMade ?? null,
    priorComplaintAgency: d.priorComplaintAgency ?? '',
    priorComplaintDate: d.priorComplaintDate ?? '',
    priorComplaintStatus: d.priorComplaintStatus ?? '',
    priorComplaintFinalisedDate: d.priorComplaintFinalisedDate ?? '',
    priorComplaintOutcome: d.priorComplaintOutcome ?? '',
    delayReason: d.delayReason ?? '',
    interpreterRequired: d.interpreterRequired,
    preferredLanguage: d.preferredLanguage ?? '',
    genAiUsed: d.genAiUsed ?? null,
    privacyNoticeAccepted: false,
    grounds: d.grounds.length ? d.grounds : [],
    respondents: d.respondents.length ? d.respondents.map((r) => newRespondent(r)) : [newRespondent()],
    onBehalfOf: d.onBehalfOf ?? null,
    representative: d.representative ?? null,
  };
}

export function toWriteDto(form: WizardForm, wizardStep: number): ComplaintWriteDto {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    incidentDate: form.incidentDate ? form.incidentDate : null,
    incidentLocation: form.incidentLocation.trim(),
    desiredOutcome: form.desiredOutcome.trim() || null,
    referringOrganisation: form.referringOrganisation.trim() || null,
    priorComplaintMade: form.priorComplaintMade,
    priorComplaintAgency: form.priorComplaintMade === true ? form.priorComplaintAgency.trim() || null : null,
    priorComplaintDate: form.priorComplaintMade === true && form.priorComplaintDate ? form.priorComplaintDate : null,
    priorComplaintStatus: form.priorComplaintMade === true ? form.priorComplaintStatus.trim() || null : null,
    priorComplaintFinalisedDate: form.priorComplaintMade === true && form.priorComplaintFinalisedDate ? form.priorComplaintFinalisedDate : null,
    priorComplaintOutcome: form.priorComplaintMade === true ? form.priorComplaintOutcome.trim() || null : null,
    delayReason: form.delayReason.trim() || null,
    interpreterRequired: form.interpreterRequired,
    preferredLanguage: form.preferredLanguage.trim() || null,
    genAiUsed: form.genAiUsed,
    privacyNoticeAccepted: form.privacyNoticeAccepted,
    grounds: form.grounds.filter((g) => g.groundType),
    respondents: form.respondents
      .filter((r) => r.name.trim().length > 0)
      .map(({ uiKey, partyType, ...respondent }) => ({
        ...respondent,
        abnAcn: partyType === 'organisation' ? normalizeAbnAcn(respondent.abnAcn ?? '') || null : null,
      })),
    onBehalfOf: form.onBehalfOf,
    representative: form.representative,
    wizardStep,
  };
}
