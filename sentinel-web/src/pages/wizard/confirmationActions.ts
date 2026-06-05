import type { ComplaintWriteDto, GroundDto } from '../../types';
import { formatDateOnly, formatDateTime } from '../../utils/format';

export interface ConfirmationSummaryRow {
  label: string;
  value: string;
  notranslate?: boolean;
  preserveWhitespace?: boolean;
}

export interface ConfirmationSummarySection {
  title: string;
  rows: ConfirmationSummaryRow[];
}

export interface ConfirmationComplaintSummary {
  sections: ConfirmationSummarySection[];
}

export function buildReferenceCodeText(referenceCode: string, _isAnonymous: boolean): string {
  return referenceCode;
}

export function buildComplaintSummarySections(
  complaint: ComplaintWriteDto,
  groundsCatalog: GroundDto[],
  submittedAtUtc?: string | null,
): ConfirmationSummarySection[] {
  const sections: ConfirmationSummarySection[] = [];
  const complainantRows = buildComplainantRows(complaint);
  if (complainantRows.length > 0) {
    sections.push({ title: 'About you', rows: complainantRows });
  }

  const respondentRows = buildRespondentRows(complaint);
  if (respondentRows.length > 0) {
    sections.push({ title: 'Who it is about', rows: respondentRows });
  }

  sections.push({
    title: 'Complaint details',
    rows: [
      row('Lodged', formatDateTime(submittedAtUtc), { notranslate: true }),
      row('Title', complaint.title),
      row('Grounds', formatGrounds(complaint, groundsCatalog)),
      row('What happened', complaint.description, { preserveWhitespace: true }),
      row('When', formatDateOnly(complaint.incidentDate), { notranslate: true }),
      row('Where exactly', complaint.incidentLocation),
      row('Desired outcome', complaint.desiredOutcome ?? ''),
      row('Reason for delay', complaint.delayReason ?? '', { preserveWhitespace: true }),
    ].filter(hasValue),
  });

  const supportingRows = buildSupportingRows(complaint);
  if (supportingRows.length > 0) {
    sections.push({ title: 'Supporting information', rows: supportingRows });
  }

  return sections;
}

export function buildConfirmationComplaintSummary(
  complaint: ComplaintWriteDto,
  groundsCatalog: GroundDto[],
  submittedAtUtc?: string | null,
): ConfirmationComplaintSummary {
  return {
    sections: buildComplaintSummarySections(complaint, groundsCatalog, submittedAtUtc),
  };
}

function buildComplainantRows(complaint: ComplaintWriteDto): ConfirmationSummaryRow[] {
  const contact = complaint.complainantContact;
  if (!contact) return [];

  return [
    row('Name', [contact.title, contact.firstName, contact.lastName].filter(Boolean).join(' ')),
    row('Email', contact.email ?? ''),
    row('Mobile', contact.phoneBh ?? contact.phoneAh ?? ''),
    row('Address', [contact.addressLine, contact.suburb, contact.state, contact.postcode].filter(Boolean).join(', ')),
    row('Assistance required', contact.assistanceRequired ?? '', { preserveWhitespace: true }),
    row('Interpreter', complaint.interpreterRequired ? complaint.preferredLanguage ?? 'Yes' : ''),
  ].filter(hasValue);
}

function buildRespondentRows(complaint: ComplaintWriteDto): ConfirmationSummaryRow[] {
  const respondents = complaint.respondents
    .map((respondent) => {
      const parts = [
        respondent.name,
        respondent.relationshipToComplainant ? `(${respondent.relationshipToComplainant})` : '',
        [respondent.addressLine, respondent.suburb, respondent.state, respondent.postcode].filter(Boolean).join(', '),
      ].filter(Boolean);
      return parts.join(' - ');
    })
    .filter(Boolean);

  return respondents.length > 0 ? [row('Respondents', respondents.join('\n'), { preserveWhitespace: true })] : [];
}

function buildSupportingRows(complaint: ComplaintWriteDto): ConfirmationSummaryRow[] {
  if (complaint.priorComplaintMade === null || complaint.priorComplaintMade === undefined) return [];

  return [
    row('Complaint elsewhere', complaint.priorComplaintMade ? 'Yes' : 'No'),
    row('Other agency', complaint.priorComplaintAgency ?? ''),
    row('Other complaint date', formatDateOnly(complaint.priorComplaintDate), { notranslate: true }),
    row('Other complaint status', complaint.priorComplaintStatus ?? ''),
    row('Finalised date', formatDateOnly(complaint.priorComplaintFinalisedDate), { notranslate: true }),
    row('Other complaint outcome', complaint.priorComplaintOutcome ?? '', { preserveWhitespace: true }),
  ].filter(hasValue);
}

function formatGrounds(complaint: ComplaintWriteDto, groundsCatalog: GroundDto[]): string {
  const labelByValue = new Map(groundsCatalog.map((ground) => [ground.value, ground.label]));
  return complaint.grounds
    .map((ground) => labelByValue.get(ground.groundType) ?? ground.groundType)
    .join(', ');
}

function row(
  label: string,
  value: string,
  options: Pick<ConfirmationSummaryRow, 'notranslate' | 'preserveWhitespace'> = {},
): ConfirmationSummaryRow {
  return {
    label,
    value: value.trim(),
    ...options,
  };
}

function hasValue(row: ConfirmationSummaryRow): boolean {
  return row.value.length > 0 && row.value !== '-';
}
