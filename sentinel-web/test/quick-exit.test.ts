import { QUICK_EXIT_URL, isQuickExitKey } from '../src/hooks/useQuickExit';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(
  QUICK_EXIT_URL === 'https://www.google.com/search?q=weather',
  'quick exit sends users to a neutral Google search page',
);

assert(isQuickExitKey({ key: 'Escape', code: 'Escape' }), 'standard Escape keydown is recognised');
assert(isQuickExitKey({ key: 'Esc', code: '' }), 'legacy Esc keydown is recognised');
assert(isQuickExitKey({ key: 'Unidentified', code: 'Escape' }), 'Escape code fallback is recognised');
assert(!isQuickExitKey({ key: 'Enter', code: 'Enter' }), 'non-Escape keys are ignored');

console.log('quick exit checks passed');
