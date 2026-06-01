export type RespondentPartyType = 'person' | 'organisation';

export type AbnAcnValidationResult =
  | { kind: 'empty' }
  | { kind: 'incomplete'; message: string }
  | { kind: 'invalid'; message: string }
  | { kind: 'valid'; label: 'ABN' | 'ACN' };

const ABN_WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
const ACN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 1];

export function digitsOnly(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

export function normalizeAbnAcn(value: unknown): string {
  return digitsOnly(value).slice(0, 11);
}

export function isValidAbn(abn: string): boolean {
  if (!/^\d{11}$/.test(abn)) return false;

  const digits = abn.split('').map(Number);
  digits[0] -= 1;
  const sum = digits.reduce((acc, digit, index) => acc + digit * ABN_WEIGHTS[index], 0);
  return sum % 89 === 0;
}

export function isValidAcn(acn: string): boolean {
  if (!/^\d{9}$/.test(acn)) return false;

  const digits = acn.split('').map(Number);
  const sum = digits.slice(0, 8).reduce((acc, digit, index) => acc + digit * ACN_WEIGHTS[index], 0);
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[8];
}

export function validateAbnAcn(value: string): AbnAcnValidationResult {
  const digits = normalizeAbnAcn(value);

  if (digits.length === 0) return { kind: 'empty' };
  if (digits.length < 9 || digits.length === 10)
    return { kind: 'incomplete', message: 'Enter 9 digits for an ACN or 11 digits for an ABN.' };
  if (digits.length === 9)
    return isValidAcn(digits)
      ? { kind: 'valid', label: 'ACN' }
      : { kind: 'invalid', message: 'ACN check digit is invalid.' };
  if (digits.length === 11)
    return isValidAbn(digits)
      ? { kind: 'valid', label: 'ABN' }
      : { kind: 'invalid', message: 'ABN check digit is invalid.' };

  return { kind: 'invalid', message: 'Enter 9 digits for an ACN or 11 digits for an ABN.' };
}
