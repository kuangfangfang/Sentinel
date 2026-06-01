import {
  createWizardSchema,
  registerSchema,
  statusChangeSchema,
  trackSchema,
} from '../src/validation/schemas';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function clone(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

function assertInvalid(result: ReturnType<ReturnType<typeof createWizardSchema>['safeParse']>, path: string, label: string) {
  assert(!result.success, `${label}: expected validation to fail`);
  const paths = result.error.issues.map((issue) => issue.path.join('.'));
  assert(paths.includes(path), `${label}: expected ${path}, got ${paths.join(', ')}`);
}

function assertSchemaInvalid(result: any, path: string, label: string) {
  assert(!result.success, `${label}: expected validation to fail`);
  const paths = result.error?.issues.map((issue: any) => issue.path.join('.')) ?? [];
  assert(paths.includes(path), `${label}: expected ${path}, got ${paths.join(', ')}`);
}

const validWizard = {
  title: 'Valid complaint title',
  description: 'This description is long enough to submit.',
  incidentDate: '2026-01-01',
  incidentLocation: 'Sydney NSW',
  desiredOutcome: '',
  complainantContact: {
    title: '',
    firstName: 'Alex',
    lastName: 'Taylor',
    addressLine: '',
    suburb: '',
    state: '',
    postcode: '',
    email: 'alex@example.com',
    phoneAh: '',
    phoneBh: '0412345678',
    assistanceRequired: '',
  },
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
  genAiUsed: false,
  privacyNoticeAccepted: true,
  grounds: [{ groundType: 'Disability', conditionalDetail: '' }],
  respondents: [{
    uiKey: 'respondent-1',
    partyType: 'person',
    name: 'Example respondent',
    abnAcn: null,
    contactEmail: 'respondent@example.com',
    contactPhone: '0411111111',
    mobile: '0422222222',
    addressLine: '1 Example Street',
    suburb: 'ABERCROMBIE',
    state: 'New South Wales',
    postcode: '2795',
    relationshipToComplainant: 'Employer',
  }],
  onBehalfOf: null,
  representative: null,
};

const anonymousStepOneSchema = createWizardSchema({ isAuthenticated: false, step: 1 });
const authenticatedStepOneSchema = createWizardSchema({ isAuthenticated: true, step: 1 });
const allStepsSchema = createWizardSchema({ isAuthenticated: false, validateAll: true });
const stepTwoSchema = createWizardSchema({ isAuthenticated: false, step: 2 });

{
  const data = clone(validWizard);
  data.complainantContact.phoneBh = '';
  const result = anonymousStepOneSchema.safeParse(data);
  assert(result.success, 'anonymous complainant mobile is optional on step 1');
}

{
  const data = clone(validWizard);
  data.complainantContact.phoneBh = '';
  assertInvalid(authenticatedStepOneSchema.safeParse(data), 'complainantContact.phoneBh', 'authenticated complainant mobile is required on step 1');
}

{
  const data = clone(validWizard);
  data.representative = {
    title: '',
    firstName: 'Riley',
    lastName: 'Ng',
    position: '',
    organisation: '',
    addressLine: '',
    suburb: '',
    state: '',
    postcode: '',
    email: '',
    phoneBh: '',
    mobile: '',
    assistanceRequired: '',
  };
  assertInvalid(anonymousStepOneSchema.safeParse(data), 'representative.mobile', 'representative mobile is required when representative details are enabled');
}

const completeOnBehalfOf = {
  firstName: 'Morgan',
  lastName: 'Smith',
  email: 'morgan@example.com',
  relationshipToComplainant: 'Parent',
  assistanceRequired: 'Needs plain English documents',
};

const onBehalfRequiredCases: Array<{
  label: string;
  path: string;
  mutate: (data: any) => void;
}> = [
  { label: 'on behalf first name is required', path: 'onBehalfOf.firstName', mutate: (data) => { data.onBehalfOf.firstName = ''; } },
  { label: 'on behalf last name is required', path: 'onBehalfOf.lastName', mutate: (data) => { data.onBehalfOf.lastName = ''; } },
  { label: 'on behalf email is required', path: 'onBehalfOf.email', mutate: (data) => { data.onBehalfOf.email = ''; } },
  { label: 'on behalf relationship is required', path: 'onBehalfOf.relationshipToComplainant', mutate: (data) => { data.onBehalfOf.relationshipToComplainant = ''; } },
  { label: 'on behalf assistance details are required', path: 'onBehalfOf.assistanceRequired', mutate: (data) => { data.onBehalfOf.assistanceRequired = ''; } },
];

for (const testCase of onBehalfRequiredCases) {
  const data = clone(validWizard);
  data.onBehalfOf = { ...completeOnBehalfOf };
  testCase.mutate(data);
  assertInvalid(anonymousStepOneSchema.safeParse(data), testCase.path, testCase.label);
}

const completeRepresentative = {
  title: 'Ms',
  firstName: 'Riley',
  lastName: 'Ng',
  position: 'Solicitor',
  organisation: 'Community Legal Centre',
  addressLine: '10 Help Street',
  suburb: 'Parramatta',
  state: 'New South Wales',
  postcode: '2150',
  email: 'riley@example.com',
  phoneBh: '',
  mobile: '0411111111',
  assistanceRequired: 'Needs accessible meeting times',
};

const representativeRequiredCases: Array<{
  label: string;
  path: string;
  mutate: (data: any) => void;
}> = [
  { label: 'representative title is required', path: 'representative.title', mutate: (data) => { data.representative.title = ''; } },
  { label: 'representative first name is required', path: 'representative.firstName', mutate: (data) => { data.representative.firstName = ''; } },
  { label: 'representative last name is required', path: 'representative.lastName', mutate: (data) => { data.representative.lastName = ''; } },
  { label: 'representative position is required', path: 'representative.position', mutate: (data) => { data.representative.position = ''; } },
  { label: 'representative organisation is required', path: 'representative.organisation', mutate: (data) => { data.representative.organisation = ''; } },
  { label: 'representative address is required', path: 'representative.addressLine', mutate: (data) => { data.representative.addressLine = ''; } },
  { label: 'representative state is required', path: 'representative.state', mutate: (data) => { data.representative.state = ''; } },
  { label: 'representative suburb is required', path: 'representative.suburb', mutate: (data) => { data.representative.suburb = ''; } },
  { label: 'representative postcode is required', path: 'representative.postcode', mutate: (data) => { data.representative.postcode = ''; } },
  { label: 'representative email is required', path: 'representative.email', mutate: (data) => { data.representative.email = ''; } },
  { label: 'representative mobile is required', path: 'representative.mobile', mutate: (data) => { data.representative.mobile = ''; } },
  { label: 'representative assistance details are required', path: 'representative.assistanceRequired', mutate: (data) => { data.representative.assistanceRequired = ''; } },
];

for (const testCase of representativeRequiredCases) {
  const data = clone(validWizard);
  data.representative = { ...completeRepresentative };
  testCase.mutate(data);
  assertInvalid(anonymousStepOneSchema.safeParse(data), testCase.path, testCase.label);
}

const stepTwoRequiredCases: Array<{
  label: string;
  path: string;
  mutate: (data: any) => void;
}> = [
  { label: 'respondent name is required', path: 'respondents.0.name', mutate: (data) => { data.respondents[0].name = ''; } },
  { label: 'respondent relationship is required', path: 'respondents.0.relationshipToComplainant', mutate: (data) => { data.respondents[0].relationshipToComplainant = ''; } },
  { label: 'respondent address is required', path: 'respondents.0.addressLine', mutate: (data) => { data.respondents[0].addressLine = ''; } },
  { label: 'respondent state is required', path: 'respondents.0.state', mutate: (data) => { data.respondents[0].state = ''; } },
  { label: 'respondent suburb is required', path: 'respondents.0.suburb', mutate: (data) => { data.respondents[0].suburb = ''; } },
  { label: 'respondent postcode is required', path: 'respondents.0.postcode', mutate: (data) => { data.respondents[0].postcode = ''; } },
  { label: 'respondent email is required', path: 'respondents.0.contactEmail', mutate: (data) => { data.respondents[0].contactEmail = ''; } },
  { label: 'respondent mobile is required', path: 'respondents.0.mobile', mutate: (data) => { data.respondents[0].mobile = ''; } },
  {
    label: 'organisation ABN or ACN is required',
    path: 'respondents.0.abnAcn',
    mutate: (data) => {
      data.respondents[0].partyType = 'organisation';
      data.respondents[0].abnAcn = '';
    },
  },
];

for (const testCase of stepTwoRequiredCases) {
  const data = clone(validWizard);
  data.respondents[0] = {
    ...data.respondents[0],
    name: 'Example respondent',
    contactEmail: 'respondent@example.com',
    contactPhone: '0411111111',
    mobile: '0422222222',
    addressLine: '1 Example Street',
    suburb: 'ABERCROMBIE',
    state: 'New South Wales',
    postcode: '2795',
    relationshipToComplainant: 'Employer',
  };
  testCase.mutate(data);
  assertInvalid(stepTwoSchema.safeParse(data), testCase.path, testCase.label);
}

{
  const data = clone(validWizard);
  data.respondents[0] = {
    ...data.respondents[0],
    name: 'Example respondent',
    contactEmail: 'respondent@example.com',
    contactPhone: '0411111111',
    mobile: '0422222222',
    addressLine: '1 Example Street',
    suburb: 'ABERCROMBIE',
    state: 'New South Wales',
    postcode: '2795',
    relationshipToComplainant: 'Employer',
  };
  assert(stepTwoSchema.safeParse(data).success, 'complete person respondent passes step 2 validation');
}

{
  const data = clone(validWizard);
  data.respondents[0].contactPhone = '';
  assert(stepTwoSchema.safeParse(data).success, 'respondent phone is optional on step 2 when the rest of the respondent is complete');
}

{
  const data = clone(validWizard);
  data.respondents[0].contactPhone = '041';
  assertInvalid(stepTwoSchema.safeParse(data), 'respondents.0.contactPhone', 'respondent phone validates format when provided');
}

const wizardLengthCases: Array<{
  label: string;
  path: string;
  mutate: (data: any) => void;
}> = [
  { label: 'complainant title max length', path: 'complainantContact.title', mutate: (data) => { data.complainantContact.title = 'A'.repeat(41); } },
  { label: 'complainant first name max length', path: 'complainantContact.firstName', mutate: (data) => { data.complainantContact.firstName = 'A'.repeat(101); } },
  { label: 'complainant last name max length', path: 'complainantContact.lastName', mutate: (data) => { data.complainantContact.lastName = 'A'.repeat(101); } },
  { label: 'complainant postcode max length', path: 'complainantContact.postcode', mutate: (data) => { data.complainantContact.postcode = '1'.repeat(11); } },
  { label: 'ground detail max length', path: 'grounds.0.conditionalDetail', mutate: (data) => { data.grounds[0].conditionalDetail = 'A'.repeat(301); } },
  { label: 'respondent name max length', path: 'respondents.0.name', mutate: (data) => { data.respondents[0].name = 'A'.repeat(201); } },
  { label: 'respondent relationship max length', path: 'respondents.0.relationshipToComplainant', mutate: (data) => { data.respondents[0].relationshipToComplainant = 'A'.repeat(201); } },
  { label: 'complaint title max length', path: 'title', mutate: (data) => { data.title = 'A'.repeat(151); } },
  { label: 'incident location max length', path: 'incidentLocation', mutate: (data) => { data.incidentLocation = 'A'.repeat(201); } },
  { label: 'prior complaint agency max length', path: 'priorComplaintAgency', mutate: (data) => { data.priorComplaintMade = true; data.priorComplaintAgency = 'A'.repeat(201); } },
  { label: 'prior complaint status max length', path: 'priorComplaintStatus', mutate: (data) => { data.priorComplaintMade = true; data.priorComplaintStatus = 'A'.repeat(121); } },
  { label: 'delay reason max length', path: 'delayReason', mutate: (data) => { data.delayReason = 'A'.repeat(2001); } },
  { label: 'preferred language max length', path: 'preferredLanguage', mutate: (data) => { data.interpreterRequired = true; data.preferredLanguage = 'A'.repeat(61); } },
];

for (const testCase of wizardLengthCases) {
  const data = clone(validWizard);
  testCase.mutate(data);
  assertInvalid(allStepsSchema.safeParse(data), testCase.path, testCase.label);
}

assertSchemaInvalid(registerSchema.safeParse({
  fullName: 'A',
  email: 'alex@example.com',
  password: 'Password123',
}), 'fullName', 'register full name minimum length');

assertSchemaInvalid(registerSchema.safeParse({
  fullName: 'A'.repeat(151),
  email: 'alex@example.com',
  password: 'Password123',
}), 'fullName', 'register full name maximum length');

assertSchemaInvalid(registerSchema.safeParse({
  fullName: 'Alex Taylor',
  email: 'alex@example.com',
  password: `Password123${'A'.repeat(91)}`,
}), 'password', 'register password maximum length');

assertSchemaInvalid(trackSchema.safeParse({ code: 'ABC' }), 'code', 'track reference minimum length');
assertSchemaInvalid(trackSchema.safeParse({ code: 'A'.repeat(31) }), 'code', 'track reference maximum length');

assertSchemaInvalid(statusChangeSchema.safeParse({
  statusTarget: 'Submitted',
  statusNote: 'A'.repeat(1001),
}), 'statusNote', 'status note maximum length');

console.log('validation schema checks passed');
