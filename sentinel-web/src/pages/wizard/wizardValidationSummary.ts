export interface ValidationSummary {
  step: number;
  messages: string[];
}

export function createValidationSummary(step: number, messages: string[]): ValidationSummary | null {
  const uniqueMessages = [...new Set(messages.map((message) => message.trim()).filter(Boolean))];
  return uniqueMessages.length > 0 ? { step, messages: uniqueMessages } : null;
}

export function visibleValidationMessages(
  validationSummary: ValidationSummary | null,
  currentStep: number,
  serverErrors: string[],
): string[] {
  const summaryMessages = validationSummary?.step === currentStep ? validationSummary.messages : [];
  return [...new Set([...summaryMessages, ...serverErrors])];
}

export function shouldShowStepValidation(
  validationSummary: ValidationSummary | null,
  currentStep: number,
): boolean {
  return validationSummary?.step === currentStep;
}
