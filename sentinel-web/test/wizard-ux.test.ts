import {
  formatDateOnly,
  formatDateTime,
  toDateOnlyString,
} from '../src/utils/format';
import {
  rankAustralianSuburbsForQuery,
  type AustralianSuburbLike,
} from '../src/data/australianLocationRanking';
import {
  filterGroundGroups,
} from '../src/pages/wizard/groundsFilter';
import {
  buildReferenceCodeText,
  buildComplaintSummarySections,
} from '../src/pages/wizard/confirmationActions';
import type { ComplaintWriteDto, GroundDto } from '../src/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const suburbs: AustralianSuburbLike[] = [
  { suburb: 'NORTH SYDNEY', state: 'New South Wales', stateCode: 'NSW', postcode: '2060' },
  { suburb: 'SYDNEY', state: 'New South Wales', stateCode: 'NSW', postcode: '2000' },
  { suburb: 'SYDNEY OLYMPIC PARK', state: 'New South Wales', stateCode: 'NSW', postcode: '2127' },
  { suburb: 'SYDNEY SOUTH', state: 'New South Wales', stateCode: 'NSW', postcode: '1235' },
  { suburb: 'SYDNEY INTERNATIONAL AIRPORT', state: 'New South Wales', stateCode: 'NSW', postcode: '2020' },
];

{
  const date = new Date(2026, 4, 1);
  assert(toDateOnlyString(date) === '2026-05-01', 'date-only input formatting uses the local calendar day');
  assert(formatDateOnly('2026-05-01') === '1 May 2026', 'review dates are formatted in Australian English');
  assert(
    formatDateTime('2026-06-05T05:02:00') === '5 June 2026, 3:02 pm',
    'date-time formatting treats offsetless API values as UTC and renders them in Australia/Sydney time',
  );
}

{
  const ranked = rankAustralianSuburbsForQuery(suburbs, 'New South Wales', 'Sydney');
  assert(ranked[0].suburb === 'SYDNEY' && ranked[0].postcode === '2000', 'exact Sydney suburb ranks first');
  assert(
    ranked.findIndex((location) => location.suburb === 'NORTH SYDNEY') >
      ranked.findIndex((location) => location.suburb === 'SYDNEY'),
    'contains matches rank after exact suburb matches',
  );
  assert(
    ranked.findIndex((location) => location.suburb === 'SYDNEY SOUTH') >
      ranked.findIndex((location) => location.suburb === 'SYDNEY OLYMPIC PARK'),
    'PO Box style 1000-series postcodes are ranked behind common residential results',
  );
}

const grounds: GroundDto[] = [
  { type: 'Age', value: 'Age', label: 'Age', group: 'Protected attributes', requiresDetail: true, detailPrompt: 'Age details' },
  { type: 'Disability', value: 'Disability', label: 'Disability', group: 'Protected attributes', requiresDetail: true, detailPrompt: 'Disability details' },
  { type: 'RacialHatred', value: 'RacialHatred', label: 'Racial hatred', group: 'Harassment', requiresDetail: false, detailPrompt: null },
];

{
  const filtered = filterGroundGroups(grounds, 'race');
  assert(filtered.length === 1, 'grounds filter keeps matching groups only');
  assert(filtered[0].group === 'Harassment', 'grounds filter keeps the matched group heading');
  assert(filtered[0].items[0].value === 'RacialHatred', 'grounds filter matches labels and values');
}

{
  const text = buildReferenceCodeText('SEN-2026-ABC123', true);
  assert(text === 'SEN-2026-ABC123', 'copy text is the reference code only');
}

const complaint: ComplaintWriteDto = {
  title: 'Racial abuse at cafe',
  description: 'The staff member made racial comments and refused service in front of other customers.',
  incidentDate: '2026-05-01',
  incidentLocation: 'Example Cafe, Sydney NSW',
  desiredOutcome: 'An apology and staff training.',
  complainantContact: {
    firstName: 'Alex',
    lastName: 'Taylor',
    email: 'alex@example.com',
    phoneBh: '0412345678',
    addressLine: '1 Harbour Street',
    suburb: 'SYDNEY',
    state: 'New South Wales',
    postcode: '2000',
  },
  referringOrganisation: null,
  priorComplaintMade: false,
  priorComplaintAgency: null,
  priorComplaintDate: null,
  priorComplaintStatus: null,
  priorComplaintFinalisedDate: null,
  priorComplaintOutcome: null,
  delayReason: null,
  interpreterRequired: false,
  preferredLanguage: null,
  genAiUsed: false,
  privacyNoticeAccepted: true,
  grounds: [{ groundType: 'RacialHatred', conditionalDetail: 'Chinese Australian' }],
  respondents: [{
    name: 'Example Cafe',
    addressLine: '1 Test Street',
    suburb: 'SYDNEY',
    state: 'New South Wales',
    postcode: '2000',
    relationshipToComplainant: 'Service provider',
    contactEmail: null,
    contactPhone: null,
    mobile: null,
    abnAcn: null,
  }],
  onBehalfOf: null,
  representative: null,
  wizardStep: 5,
};

{
  const sections = buildComplaintSummarySections(complaint, grounds, '2026-06-05T05:02:00');
  const titles = sections.map((section) => section.title).join('|');
  const rows = sections.flatMap((section) => section.rows.map((row) => `${section.title}:${row.label}:${row.value}`)).join('|');

  assert(titles.includes('Complaint details'), 'print summary includes a complaint details section');
  assert(titles.includes('About you'), 'print summary includes a complainant section when details are available');
  assert(titles.includes('Who it is about'), 'print summary includes a respondent section');
  assert(rows.includes('Complaint details:Grounds:Racial hatred'), 'print summary resolves ground labels');
  assert(rows.includes('Complaint details:When:1 May 2026'), 'print summary formats incident dates for printing');
  assert(rows.includes('Complaint details:Lodged:5 June 2026, 3:02 pm'), 'print summary includes the lodged time in Australia/Sydney time');
  assert(rows.includes('Who it is about:Respondents:Example Cafe'), 'print summary includes respondent names');
  assert(rows.includes('About you:Email:alex@example.com'), 'print summary includes complainant contact details');
}

console.log('wizard UX checks passed');
