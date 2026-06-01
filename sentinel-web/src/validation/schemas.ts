import { z } from 'zod';
import { validateAbnAcn } from '../pages/wizard/respondentIdentity';

// Australian mobile number: starts with 04, exactly 10 digits.
const australianMobileRegex = /^04\d{8}$/;

const looseStringSchema = z.string().optional().nullable().transform((value) => value ?? '');
const looseBooleanSchema = z.boolean().optional().transform((value) => value ?? false);
const looseNullableBooleanSchema = z.boolean().optional().nullable().transform((value) => value ?? null);

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

export const registerSchema = z.object({
  fullName: requiredTextSchema('Full name is required'),
  email: emailSchema,
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Za-z]/, 'Password must include a letter')
    .regex(/\d/, 'Password must include a number'),
});

export const trackSchema = z.object({
  code: requiredTextSchema('Reference code is required'),
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
  statusNote: z.string(),
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
  title: optionalTextSchema,
  firstName: optionalTextSchema,
  lastName: optionalTextSchema,
  addressLine: optionalTextSchema,
  suburb: optionalTextSchema,
  state: optionalTextSchema,
  postcode: optionalTextSchema,
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
    postcode: optionalTextSchema,
    email: optionalEmailSchema,
    phoneBh: optionalTextSchema,
    mobile: optionalAustralianMobileSchema,
    assistanceRequired: optionalTextSchema,
  })
  .optional()
  .nullable();

export const groundSelectionSchema = z.object({
  groundType: requiredTextSchema('Select at least one ground of complaint'),
  conditionalDetail: optionalTextSchema,
});

export const respondentSchema = z.object({
  uiKey: requiredTextSchema('Respondent identifier is required'),
  partyType: z.enum(['person', 'organisation']),
  name: looseStringSchema,
  abnAcn: optionalTextSchema,
  contactEmail: optionalEmailSchema,
  contactPhone: optionalTextSchema,
  mobile: optionalAustralianMobileSchema,
  addressLine: optionalTextSchema,
  suburb: optionalTextSchema,
  state: optionalTextSchema,
  postcode: optionalTextSchema,
  relationshipToComplainant: optionalTextSchema,
});

function buildWizardSchema(options: { isAuthenticated: boolean; step?: number; validateAll?: boolean }) {
  const shouldValidateStep = (step: number) => options.validateAll || options.step === step;

  return z
  .object({
    title: looseStringSchema,
    description: looseStringSchema,
    incidentDate: looseStringSchema,
    incidentLocation: looseStringSchema,
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
    priorComplaintAgency: looseStringSchema,
    priorComplaintDate: optionalDateSchema,
    priorComplaintStatus: looseStringSchema,
    priorComplaintFinalisedDate: optionalDateSchema,
    priorComplaintOutcome: looseStringSchema,
    delayReason: looseStringSchema,
    interpreterRequired: looseBooleanSchema,
    preferredLanguage: looseStringSchema,
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
    }

    if (shouldValidateStep(1) && form.interpreterRequired && !form.preferredLanguage.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['preferredLanguage'],
        message: 'Please tell us your preferred language for an interpreter',
      });
    }

    if (shouldValidateStep(1) && form.onBehalfOf) {
      if (!form.onBehalfOf.firstName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['onBehalfOf', 'firstName'],
          message: 'Please give the first name of the person you are complaining for',
        });
      }

      if (!form.onBehalfOf.lastName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['onBehalfOf', 'lastName'],
          message: 'Please give the last name of the person you are complaining for',
        });
      }
    }

    if (shouldValidateStep(1) && form.representative) {
      if (!form.representative.firstName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['representative', 'firstName'],
          message: 'Please give the first name of your representative',
        });
      }

      if (!form.representative.lastName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['representative', 'lastName'],
          message: 'Please give the last name of your representative',
        });
      }
    }

    if (shouldValidateStep(2)) {
      if (!form.respondents.some((respondent) => respondent.name.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['respondents'],
          message: 'Add at least one person or organisation the complaint is about',
        });
      }

      form.respondents.forEach((respondent, index) => {
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
        message: 'Give your complaint a short title (at least 5 characters)',
      });
    }

    if (shouldValidateStep(3) && form.grounds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['grounds'],
        message: 'Select at least one ground of complaint',
      });
    }

    if (shouldValidateStep(3) && form.description.trim().length < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['description'],
        message: 'Describe what happened in at least 20 characters',
      });
    }

    if (shouldValidateStep(3) && !form.incidentDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['incidentDate'],
        message: 'Enter the date the event happened',
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
        message: 'Enter where exactly it happened',
      });
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
        message: 'You must confirm you have read the privacy notice before lodging',
      });
    }
  });
}

export const createWizardSchema = buildWizardSchema;
export const wizardSchema = buildWizardSchema({ isAuthenticated: false });
