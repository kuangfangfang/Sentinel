import type {
  ComplaintWriteDto,
  GroundSelectionDto,
  OnBehalfOfDto,
  RepresentativeDto,
  RespondentDto,
  ComplaintDetailDto,
} from '../../types';

/** Local working state for the five-step wizard. */
export interface WizardForm {
  title: string;
  description: string;
  incidentDate: string; // yyyy-MM-dd or ''
  incidentLocation: string;
  desiredOutcome: string;
  referringOrganisation: string;
  delayReason: string;
  interpreterRequired: boolean;
  preferredLanguage: string;
  genAiUsed: boolean | null;
  privacyNoticeAccepted: boolean;
  grounds: GroundSelectionDto[];
  respondents: RespondentDto[];
  onBehalfOf: OnBehalfOfDto | null;
  representative: RepresentativeDto | null;
}

export type UpdateForm = (patch: Partial<WizardForm>) => void;

export interface StepProps {
  form: WizardForm;
  update: UpdateForm;
  errors: string[];
}

export function emptyForm(): WizardForm {
  return {
    title: '',
    description: '',
    incidentDate: '',
    incidentLocation: '',
    desiredOutcome: '',
    referringOrganisation: '',
    delayReason: '',
    interpreterRequired: false,
    preferredLanguage: '',
    genAiUsed: null,
    privacyNoticeAccepted: false,
    grounds: [],
    respondents: [{ name: '', relationshipToComplainant: '' }],
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
    delayReason: d.delayReason ?? '',
    interpreterRequired: d.interpreterRequired,
    preferredLanguage: d.preferredLanguage ?? '',
    genAiUsed: d.genAiUsed ?? null,
    privacyNoticeAccepted: false,
    grounds: d.grounds.length ? d.grounds : [],
    respondents: d.respondents.length ? d.respondents : [{ name: '', relationshipToComplainant: '' }],
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
    delayReason: form.delayReason.trim() || null,
    interpreterRequired: form.interpreterRequired,
    preferredLanguage: form.preferredLanguage.trim() || null,
    genAiUsed: form.genAiUsed,
    privacyNoticeAccepted: form.privacyNoticeAccepted,
    grounds: form.grounds.filter((g) => g.groundType),
    respondents: form.respondents.filter((r) => r.name.trim().length > 0),
    onBehalfOf: form.onBehalfOf,
    representative: form.representative,
    wizardStep,
  };
}
