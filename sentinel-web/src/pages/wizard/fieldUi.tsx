import { createContext, useContext, type ReactNode } from 'react';

const FieldValidationDisplayContext = createContext(false);

export function FieldValidationDisplayProvider({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) {
  return (
    <FieldValidationDisplayContext.Provider value={show}>
      {children}
    </FieldValidationDisplayContext.Provider>
  );
}

export function useFieldValidationDisplay() {
  return useContext(FieldValidationDisplayContext);
}

export function RequiredMark() {
  return <span className="required-mark" aria-hidden="true">*</span>;
}

export function RequiredNote() {
  return (
    <p className="required-note">
      <span className="required-mark" aria-hidden="true">*</span> denotes a required field.
    </p>
  );
}

export function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function inputClass(hasError: boolean, extra?: string) {
  return classNames('input', extra, hasError && 'input-error');
}

export function invalidAria(hasError: boolean) {
  return hasError ? true : undefined;
}
