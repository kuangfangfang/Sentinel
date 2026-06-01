import type {
  ComplaintWriteDto,
  ComplainantContactDto,
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
  complainantContact: ComplainantContactDto;
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

export interface StepProps {}

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
    mobile: overrides.mobile ?? null,
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
    complainantContact: emptyComplainantContact(),
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
    complainantContact: {
      ...emptyComplainantContact(),
      ...(d.complainantContact ?? {}),
      state: normalizeAustralianState(d.complainantContact?.state),
    },
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
    complainantContact: trimComplainantContact(form.complainantContact),
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
      .map(trimRespondent),
    onBehalfOf: form.onBehalfOf ? trimOnBehalfOf(form.onBehalfOf) : null,
    representative: form.representative ? trimRepresentative(form.representative) : null,
    wizardStep,
  };
}

export function emptyComplainantContact(): ComplainantContactDto {
  return {
    title: '',
    firstName: '',
    lastName: '',
    addressLine: '',
    suburb: '',
    state: '',
    postcode: '',
    email: '',
    phoneAh: '',
    phoneBh: '',
    assistanceRequired: '',
  };
}

function trimComplainantContact(contact: ComplainantContactDto): ComplainantContactDto | null {
  const trimmed: ComplainantContactDto = {
    title: contact.title?.trim() || null,
    firstName: contact.firstName?.trim() || null,
    lastName: contact.lastName?.trim() || null,
    addressLine: contact.addressLine?.trim() || null,
    suburb: contact.suburb?.trim() || null,
    state: contact.state?.trim() || null,
    postcode: contact.postcode?.trim() || null,
    email: contact.email?.trim() || null,
    phoneAh: null,
    phoneBh: contact.phoneBh?.trim() || null,
    assistanceRequired: contact.assistanceRequired?.trim() || null,
  };

  return Object.values(trimmed).some(Boolean) ? trimmed : null;
}

function optionalString(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function trimRespondent({ uiKey: _uiKey, partyType, ...respondent }: WizardRespondent): RespondentDto {
  return {
    name: respondent.name.trim(),
    abnAcn: partyType === 'organisation' ? normalizeAbnAcn(respondent.abnAcn ?? '') || null : null,
    contactEmail: optionalString(respondent.contactEmail),
    contactPhone: optionalString(respondent.contactPhone),
    mobile: optionalString(respondent.mobile),
    addressLine: optionalString(respondent.addressLine),
    suburb: optionalString(respondent.suburb),
    state: optionalString(respondent.state),
    postcode: optionalString(respondent.postcode),
    relationshipToComplainant: optionalString(respondent.relationshipToComplainant),
  };
}

function trimOnBehalfOf(person: OnBehalfOfDto): OnBehalfOfDto {
  return {
    firstName: person.firstName.trim(),
    lastName: person.lastName.trim(),
    email: optionalString(person.email),
    relationshipToComplainant: optionalString(person.relationshipToComplainant),
    assistanceRequired: optionalString(person.assistanceRequired),
  };
}

function trimRepresentative(representative: RepresentativeDto): RepresentativeDto {
  return {
    title: optionalString(representative.title),
    firstName: representative.firstName.trim(),
    lastName: representative.lastName.trim(),
    position: optionalString(representative.position),
    organisation: optionalString(representative.organisation),
    addressLine: optionalString(representative.addressLine),
    suburb: optionalString(representative.suburb),
    state: optionalString(representative.state),
    postcode: optionalString(representative.postcode),
    email: optionalString(representative.email),
    phoneBh: null,
    mobile: optionalString(representative.mobile),
    assistanceRequired: optionalString(representative.assistanceRequired),
  };
}
