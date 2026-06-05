import { z } from 'zod';
import { validateAbnAcn } from '../pages/wizard/respondentIdentity';

// Australian mobile number: starts with 04, exactly 10 digits.
const australianMobileRegex = /^04\d{8}$/;
const australianPostcodeRegex = /^\d{4}$/;

const looseStringSchema = z.string().optional().nullable().transform((value) => value ?? '');
const looseBooleanSchema = z.boolean().optional().transform((value) => value ?? false);
const looseNullableBooleanSchema = z.boolean().optional().nullable().transform((value) => value ?? null);

const maxLengthMessage = (label: string, max: number) => `${label} must be ${max} characters or fewer`;
const optionalLimitedTextSchema = (label: string, max: number) =>
  looseStringSchema.refine((value) => value.trim().length <= max, {
    message: maxLengthMessage(label, max),
  });
const optionalPostcodeSchema = looseStringSchema.refine((value) => !value || australianPostcodeRegex.test(value), {
  message: 'Postcode must be 4 digits',
});

const groundsRequiringDetail = new Set([
  'Age',
  'Disability',
  'AssociationWithDisability',
  'Sex',
  'MaritalOrRelationshipStatus',
  'SexualOrientation',
  'GenderIdentity',
  'Race',
  'RacialHatred',
  'EmploymentCriminalRecord',
  'EmploymentReligion',
  'EmploymentPoliticalOpinion',
]);

export const australianMobileSchema = z
  .string()
  .min(1, 'Mobile number is required')
  .regex(australianMobileRegex, 'Please enter a valid Australian mobile number (starts with 04, 10 digits)');

export const optionalAustralianMobileSchema = z
  .string()
  .optional()
  .nullable()
  .transform((value) => value ?? '')
  .refine((val) => !val || australianMobileRegex.test(val), {
    message: 'Please enter a valid Australian mobile number (starts with 04, 10 digits)',
  });

export const emailSchema = z
  .string()
  .min(1, 'Email address is required')
  .email('Please enter a valid email address');

// For optional email fields (e.g. "Their email"), only validate format if a value is provided.
export const optionalEmailSchema = z
  .string()
  .optional()
  .nullable()
  .transform((value) => value ?? '')
  .refine((val) => !val || /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(val), {
    message: 'Please enter a valid email address',
  });

export const requiredTextSchema = (message: string) => z.string().trim().min(1, message);

export const optionalTextSchema = looseStringSchema;

export const loginSchema = z.object({
  email: emailSchema,
  password: requiredTextSchema('Password is required'),
});

const passwordFieldSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(100, maxLengthMessage('Password', 100))
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/\d/, 'Password must include a number');

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(150, maxLengthMessage('Full name', 150)),
  email: emailSchema,
  password: passwordFieldSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: requiredTextSchema('Current password is required'),
    newPassword: passwordFieldSchema,
    confirmNewPassword: requiredTextSchema('Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from your current password',
    path: ['newPassword'],
  });

export const trackSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, 'Reference code must be at least 4 characters')
    .max(30, maxLengthMessage('Reference code', 30)),
});

export const queueFilterSchema = z.object({
  search: z.string(),
  status: z.string(),
  severity: z.string(),
  ground: z.string(),
});

export const caseNoteSchema = z.object({
  body: requiredTextSchema('Case note is required'),
});

export const statusChangeSchema = z.object({
  statusTarget: requiredTextSchema('Choose a new status'),
  statusNote: z.string().max(1000, maxLengthMessage('Status note', 1000)),
});

const optionalDateSchema = z
  .string()
  .optional()
  .nullable()
  .transform((value) => value ?? '')
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Please enter a valid date in DD/MM/YYYY format',
  });

export const complainantContactSchema = z.object({
  title: optionalLimitedTextSchema('Title', 40),
  firstName: optionalLimitedTextSchema('First name', 100),
  lastName: optionalLimitedTextSchema('Last name', 100),
  addressLine: optionalTextSchema,
  suburb: optionalTextSchema,
  state: optionalTextSchema,
  postcode: optionalPostcodeSchema,
  email: optionalEmailSchema,
  phoneAh: optionalTextSchema,
  phoneBh: optionalAustralianMobileSchema,
  assistanceRequired: optionalTextSchema,
});

export const onBehalfOfSchema = z
  .object({
    firstName: looseStringSchema,
    lastName: looseStringSchema,
    email: optionalEmailSchema,
    relationshipToComplainant: optionalTextSchema,
    assistanceRequired: optionalTextSchema,
  })
  .optional()
  .nullable();

export const representativeSchema = z
  .object({
    title: optionalTextSchema,
    firstName: looseStringSchema,
    lastName: looseStringSchema,
    position: optionalTextSchema,
    organisation: optionalTextSchema,
    addressLine: optionalTextSchema,
    suburb: optionalTextSchema,
    state: optionalTextSchema,
    postcode: optionalPostcodeSchema,
    email: optionalEmailSchema,
    phoneBh: optionalTextSchema,
    mobile: optionalAustralianMobileSchema,
    assistanceRequired: optionalTextSchema,
  })
  .optional()
  .nullable();

export const groundSelectionSchema = z.object({
  groundType: requiredTextSchema('Select at least one ground of complaint'),
  conditionalDetail: optionalLimitedTextSchema('Ground detail', 300),
});

export const respondentSchema = z.object({
  uiKey: requiredTextSchema('Respondent identifier is required'),
  partyType: z.enum(['person', 'organisation']),
  name: optionalLimitedTextSchema('Respondent name', 200),
  abnAcn: optionalLimitedTextSchema('ABN / ACN', 20),
  contactEmail: optionalEmailSchema,
  contactPhone: optionalTextSchema,
  mobile: optionalAustralianMobileSchema,
  addressLine: optionalTextSchema,
  suburb: optionalTextSchema,
  state: optionalTextSchema,
  postcode: optionalPostcodeSchema,
  relationshipToComplainant: optionalLimitedTextSchema('Relationship to respondent', 200),
});

function addRequiredIssue(
  ctx: z.RefinementCtx,
  path: Array<string | number>,
  message: string,
) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path,
    message,
  });
}

function requireTrimmedString(
  ctx: z.RefinementCtx,
  value: unknown,
  path: Array<string | number>,
  message: string,
) {
  if (typeof value !== 'string' || !value.trim()) {
    addRequiredIssue(ctx, path, message);
  }
}

function isMoreThan24MonthsAgo(date: string) {
  if (!date) return false;
  const selectedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) return false;

  const threshold = new Date();
  threshold.setHours(0, 0, 0, 0);
  threshold.setMonth(threshold.getMonth() - 24);
  return selectedDate < threshold;
}

function buildWizardSchema(options: { isAuthenticated: boolean; step?: number; validateAll?: boolean }) {
  const shouldValidateStep = (step: number) => options.validateAll || options.step === step;

  return z
  .object({
    title: optionalLimitedTextSchema('Complaint title', 150),
    description: looseStringSchema,
    incidentDate: looseStringSchema,
    incidentLocation: optionalLimitedTextSchema('Incident location', 200),
    desiredOutcome: looseStringSchema,
    complainantContact: complainantContactSchema.optional().default({
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
    }),
    referringOrganisation: looseStringSchema,
    priorComplaintMade: looseNullableBooleanSchema,
    priorComplaintAgency: optionalLimitedTextSchema('Prior complaint agency', 200),
    priorComplaintDate: optionalDateSchema,
    priorComplaintStatus: optionalLimitedTextSchema('Prior complaint status', 120),
    priorComplaintFinalisedDate: optionalDateSchema,
    priorComplaintOutcome: looseStringSchema,
    delayReason: optionalLimitedTextSchema('Delay reason', 2000),
    interpreterRequired: looseBooleanSchema,
    preferredLanguage: optionalLimitedTextSchema('Preferred language', 60),
    genAiUsed: looseNullableBooleanSchema,
    privacyNoticeAccepted: looseBooleanSchema,
    grounds: z.array(groundSelectionSchema).optional().transform((value) => value ?? []),
    respondents: z.array(respondentSchema).optional().transform((value) => value ?? []),
    onBehalfOf: onBehalfOfSchema,
    representative: representativeSchema,
  })
  .superRefine((form, ctx) => {
    if (shouldValidateStep(1) && options.isAuthenticated) {
      if (!form.complainantContact.firstName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['complainantContact', 'firstName'],
          message: 'Please provide your first name',
        });
      }

      if (!form.complainantContact.lastName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['complainantContact', 'lastName'],
          message: 'Please provide your last name',
        });
      }

      if (!form.complainantContact.email?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['complainantContact', 'email'],
          message: 'Please provide your email address',
        });
      }

      requireTrimmedString(ctx, form.complainantContact.addressLine, ['complainantContact', 'addressLine'], 'Please provide your address');
      requireTrimmedString(ctx, form.complainantContact.state, ['complainantContact', 'state'], 'Please select your state or territory');
      requireTrimmedString(ctx, form.complainantContact.suburb, ['complainantContact', 'suburb'], 'Please select your suburb');
      requireTrimmedString(ctx, form.complainantContact.postcode, ['complainantContact', 'postcode'], 'Please provide your postcode');
    }

    if (shouldValidateStep(1) && options.isAuthenticated && !form.complainantContact.phoneBh?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['complainantContact', 'phoneBh'],
        message: 'Please provide your mobile number',
      });
    }

    if (shouldValidateStep(1) && form.interpreterRequired && !form.preferredLanguage.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['preferredLanguage'],
        message: 'Please tell us your preferred language for an interpreter',
      });
    }

    if (shouldValidateStep(1) && form.onBehalfOf) {
      requireTrimmedString(ctx, form.onBehalfOf.firstName, ['onBehalfOf', 'firstName'], 'Please give the first name of the person you are complaining for');
      requireTrimmedString(ctx, form.onBehalfOf.lastName, ['onBehalfOf', 'lastName'], 'Please give the last name of the person you are complaining for');
      requireTrimmedString(ctx, form.onBehalfOf.email, ['onBehalfOf', 'email'], 'Please provide the email address of the person you are complaining for');
      requireTrimmedString(ctx, form.onBehalfOf.relationshipToComplainant, ['onBehalfOf', 'relationshipToComplainant'], 'Please explain your relationship to the person you are complaining for');
    }

    if (shouldValidateStep(1) && form.representative) {
      requireTrimmedString(ctx, form.representative.title, ['representative', 'title'], "Please select your representative's title");
      requireTrimmedString(ctx, form.representative.firstName, ['representative', 'firstName'], 'Please give the first name of your representative');
      requireTrimmedString(ctx, form.representative.lastName, ['representative', 'lastName'], 'Please give the last name of your representative');
      requireTrimmedString(ctx, form.representative.position, ['representative', 'position'], "Please provide your representative's position");
      requireTrimmedString(ctx, form.representative.organisation, ['representative', 'organisation'], "Please provide your representative's organisation");
      requireTrimmedString(ctx, form.representative.addressLine, ['representative', 'addressLine'], "Please provide your representative's address");
      requireTrimmedString(ctx, form.representative.state, ['representative', 'state'], "Please select your representative's state or territory");
      requireTrimmedString(ctx, form.representative.suburb, ['representative', 'suburb'], "Please select your representative's suburb");
      requireTrimmedString(ctx, form.representative.postcode, ['representative', 'postcode'], "Please provide your representative's postcode");
      requireTrimmedString(ctx, form.representative.email, ['representative', 'email'], "Please provide your representative's email address");
      requireTrimmedString(ctx, form.representative.mobile, ['representative', 'mobile'], "Please provide your representative's mobile number");
    }

    if (shouldValidateStep(2)) {
      if (!form.respondents.some((respondent) => respondent.name.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['respondents'],
          message: 'Please add at least one person or organisation the complaint is about',
        });
      }

      form.respondents.forEach((respondent, index) => {
        const requiredFields: Array<[keyof typeof respondent, string]> = [
          ['name', 'Please enter the respondent name'],
          ['relationshipToComplainant', 'Please enter your relationship to the respondent'],
          ['addressLine', 'Please enter the respondent address'],
          ['state', 'Please select the respondent state or territory'],
          ['suburb', 'Please select the respondent suburb'],
          ['postcode', 'Please enter the respondent postcode'],
        ];

        requiredFields.forEach(([field, message]) => {
          const value = respondent[field];
          if (typeof value !== 'string' || !value.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['respondents', index, field],
              message,
            });
          }
        });

        if (respondent.partyType === 'organisation' && !respondent.abnAcn?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['respondents', index, 'abnAcn'],
            message: 'Please enter the organisation ABN or ACN',
          });
        }

        if (respondent.partyType === 'organisation' && respondent.abnAcn?.trim()) {
          const result = validateAbnAcn(respondent.abnAcn);
          if (result.kind === 'invalid' || result.kind === 'incomplete') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['respondents', index, 'abnAcn'],
              message: `Respondent ${index + 1}: ${result.message}`,
            });
          }
        }

        if (respondent.contactPhone && !australianMobileRegex.test(respondent.contactPhone)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['respondents', index, 'contactPhone'],
            message: 'Please enter a valid Australian mobile number (starts with 04, 10 digits)',
          });
        }
      });
    }

    if (shouldValidateStep(3) && form.title.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['title'],
        message: 'Please give your complaint a short title (at least 5 characters)',
      });
    }

    if (shouldValidateStep(3) && form.grounds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['grounds'],
        message: 'Please select at least one ground of complaint',
      });
    }

    if (shouldValidateStep(3)) {
      form.grounds.forEach((ground, index) => {
        if (groundsRequiringDetail.has(ground.groundType) && !ground.conditionalDetail?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['grounds', index, 'conditionalDetail'],
            message: 'Please answer the follow-up question for the selected ground of complaint',
          });
        }
      });
    }

    if (shouldValidateStep(3) && form.description.trim().length < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['description'],
        message: 'Please describe what happened in at least 20 characters',
      });
    }

    if (shouldValidateStep(3) && !form.incidentDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['incidentDate'],
        message: 'Please enter the date the event happened',
      });
    } else if (shouldValidateStep(3) && form.incidentDate > new Date().toISOString().slice(0, 10)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['incidentDate'],
        message: 'The incident date cannot be in the future',
      });
    }

    if (shouldValidateStep(3) && !form.incidentLocation.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['incidentLocation'],
        message: 'Please enter where exactly it happened',
      });
    }

    if (shouldValidateStep(3) && isMoreThan24MonthsAgo(form.incidentDate) && !form.delayReason.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['delayReason'],
        message: 'Please explain the reason for the delay in making this complaint',
      });
    }

    if (shouldValidateStep(4) && form.priorComplaintMade === true) {
      requireTrimmedString(ctx, form.priorComplaintAgency, ['priorComplaintAgency'], 'Please enter the name of the agency');
      requireTrimmedString(ctx, form.priorComplaintDate, ['priorComplaintDate'], 'Please enter the date the complaint was made');
      requireTrimmedString(ctx, form.priorComplaintStatus, ['priorComplaintStatus'], 'Please select the complaint status');
    }

    if (shouldValidateStep(5) && form.genAiUsed === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['genAiUsed'],
        message: 'Please answer whether generative AI was used to prepare this complaint',
      });
    }

    if (shouldValidateStep(5) && !form.privacyNoticeAccepted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['privacyNoticeAccepted'],
        message: 'Please confirm you have read the privacy notice before lodging',
      });
    }
  });
}

export const createWizardSchema = buildWizardSchema;
export const wizardSchema = buildWizardSchema({ isAuthenticated: false });
