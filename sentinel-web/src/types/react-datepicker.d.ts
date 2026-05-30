declare module 'react-datepicker' {
  import type { ComponentType, FocusEvent, ChangeEvent } from 'react';

  export interface ReactDatePickerProps {
    id?: string;
    selected?: Date | null;
    onChange?: (date: Date | null) => void;
    onChangeRaw?: (event: ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
    maxDate?: Date;
    dateFormat?: string;
    className?: string;
    placeholderText?: string;
    shouldCloseOnSelect?: boolean;
    showPopperArrow?: boolean;
    showMonthDropdown?: boolean;
    showYearDropdown?: boolean;
    dropdownMode?: 'scroll' | 'select';
    isClearable?: boolean;
  }

  const ReactDatePicker: ComponentType<ReactDatePickerProps>;
  export default ReactDatePicker;
}
