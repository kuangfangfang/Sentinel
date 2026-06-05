export interface AustralianSuburbLike {
  suburb: string;
  state: string;
  postcode: string;
  stateCode?: string;
}

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

function postcodeRank(postcode: string): number {
  if (/^1\d{3}$/.test(postcode)) return 2;
  if (/^0\d{3}$/.test(postcode)) return 1;
  return 0;
}

function matchRank(location: AustralianSuburbLike, query: string): number {
  const q = normalise(query);
  if (!q) return 0;

  const suburb = normalise(location.suburb);
  const postcode = location.postcode;
  if (suburb === q) return 0;
  if (postcode === q) return 1;
  if (suburb.startsWith(q)) return 2;
  if (suburb.includes(q)) return 3;
  if (postcode.includes(q)) return 4;
  return 5;
}

export function rankAustralianSuburbsForQuery<T extends AustralianSuburbLike>(
  locations: T[],
  state: string,
  query = '',
): T[] {
  const q = normalise(query);

  return locations
    .filter((location) => {
      if (location.state !== state) return false;
      if (!q) return true;
      return `${location.suburb} ${location.postcode} ${location.state}`.toLowerCase().includes(q);
    })
    .sort((a, b) => (
      matchRank(a, q) - matchRank(b, q) ||
      postcodeRank(a.postcode) - postcodeRank(b.postcode) ||
      a.suburb.localeCompare(b.suburb) ||
      a.postcode.localeCompare(b.postcode)
    ));
}
