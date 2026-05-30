import type { ComboboxOption } from '../components/Combobox';

export const OTHER_LANGUAGE_VALUE = '__other_language__';

const preferredLanguages = [
  'Mandarin',
  'Arabic',
  'Vietnamese',
  'Cantonese',
  'Punjabi',
  'Greek',
  'Italian',
  'Hindi',
  'Spanish',
  'Nepali',
  'Assyrian Neo-Aramaic',
  'Bengali',
  'Burmese',
  'Croatian',
  'Dari',
  'Filipino',
  'French',
  'German',
  'Gujarati',
  'Hazaraghi',
  'Indonesian',
  'Japanese',
  'Karen',
  'Khmer',
  'Korean',
  'Macedonian',
  'Malay',
  'Persian',
  'Portuguese',
  'Russian',
  'Serbian',
  'Sinhalese',
  'Somali',
  'Tamil',
  'Thai',
  'Turkish',
  'Urdu',
  'Auslan',
  'Aboriginal and/or Torres Strait Islander language',
];

export const preferredLanguageOptions: ComboboxOption[] = [
  ...preferredLanguages.map((language) => ({
    label: language,
    value: language,
  })),
  {
    label: 'Other language',
    value: OTHER_LANGUAGE_VALUE,
  },
];
