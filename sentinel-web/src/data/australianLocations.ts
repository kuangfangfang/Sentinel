export type AustralianStateCode = 'ACT' | 'NSW' | 'NT' | 'QLD' | 'SA' | 'TAS' | 'VIC' | 'WA';

export interface AustralianSuburb {
  suburb: string;
  state: string;
  stateCode: AustralianStateCode;
  postcode: string;
}

export const AUSTRALIAN_STATES: Array<{ label: string; value: string; code: AustralianStateCode }> = [
  { label: 'Australian Capital Territory', value: 'Australian Capital Territory', code: 'ACT' },
  { label: 'New South Wales', value: 'New South Wales', code: 'NSW' },
  { label: 'Northern Territory', value: 'Northern Territory', code: 'NT' },
  { label: 'Queensland', value: 'Queensland', code: 'QLD' },
  { label: 'South Australia', value: 'South Australia', code: 'SA' },
  { label: 'Tasmania', value: 'Tasmania', code: 'TAS' },
  { label: 'Victoria', value: 'Victoria', code: 'VIC' },
  { label: 'Western Australia', value: 'Western Australia', code: 'WA' },
];

const STATE_CODE_BY_NAME = new Map(AUSTRALIAN_STATES.map((state) => [state.value, state.code]));
const STATE_NAME_BY_CODE = new Map(AUSTRALIAN_STATES.map((state) => [state.code, state.value]));

let suburbsPromise: Promise<AustralianSuburb[]> | null = null;

export function loadAustralianSuburbs(): Promise<AustralianSuburb[]> {
  suburbsPromise ??= fetch(`${import.meta.env.BASE_URL}data/australian-suburbs.json`).then((response) => {
    if (!response.ok) throw new Error('Could not load Australian suburb data.');
    return response.json() as Promise<AustralianSuburb[]>;
  });
  return suburbsPromise;
}

export function stateCodeFor(stateName: string): string {
  return STATE_CODE_BY_NAME.get(stateName) ?? stateName;
}

export function normalizeAustralianState(value: string | null | undefined): string {
  if (!value) return '';
  return STATE_NAME_BY_CODE.get(value as AustralianStateCode) ?? value;
}

export function formatLocationLabel(location: AustralianSuburb): string {
  return `${location.suburb} ${location.stateCode} ${location.postcode}`;
}

export function locationValue(location: AustralianSuburb): string {
  return `${location.suburb}|${location.state}|${location.postcode}`;
}
