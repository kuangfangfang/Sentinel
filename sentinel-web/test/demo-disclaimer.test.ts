import {
  DEMO_DISCLAIMER_ACCEPTED_VALUE,
  DEMO_DISCLAIMER_STORAGE_KEY,
  DEMO_DISCLAIMER_TEXT,
  acceptDemoDisclaimer,
  hasAcceptedDemoDisclaimer,
} from '../src/data/demoDisclaimer';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

{
  const storage = createMemoryStorage();
  assert(!hasAcceptedDemoDisclaimer(storage), 'fresh session storage has not accepted the disclaimer');
}

{
  const storage = createMemoryStorage();
  acceptDemoDisclaimer(storage);
  assert(
    storage.getItem(DEMO_DISCLAIMER_STORAGE_KEY) === DEMO_DISCLAIMER_ACCEPTED_VALUE,
    'accepting the disclaimer writes the expected session value',
  );
  assert(hasAcceptedDemoDisclaimer(storage), 'accepted session storage is recognised');
}

{
  const storage = createMemoryStorage();
  storage.setItem(DEMO_DISCLAIMER_STORAGE_KEY, 'yes');
  assert(!hasAcceptedDemoDisclaimer(storage), 'corrupted disclaimer values do not count as accepted');
}

for (const phrase of [
  'demo',
  'not affiliated',
  'Australian Human Rights Commission',
  'does not provide legal advice',
]) {
  assert(DEMO_DISCLAIMER_TEXT.includes(phrase), `disclaimer text includes "${phrase}"`);
}

console.log('demo disclaimer checks passed');
