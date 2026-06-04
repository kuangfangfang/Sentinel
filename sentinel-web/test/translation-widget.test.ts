import {
  DEFAULT_TRANSLATE_LANGUAGE,
  SOURCE_PAGE_LANGUAGE,
  TRANSLATE_LANGUAGES,
  buildGoogleTranslateCookieValue,
  findTranslateLanguage,
} from '../src/data/translateLanguages';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(SOURCE_PAGE_LANGUAGE === 'en', 'the page source language is English');
assert(DEFAULT_TRANSLATE_LANGUAGE === 'en', 'English is the default selected language');
assert(TRANSLATE_LANGUAGES[0]?.value === 'en', 'English is first so users can restore the original page');
assert(TRANSLATE_LANGUAGES.length >= 150, 'the translate menu covers the documented Google language set');

const values = TRANSLATE_LANGUAGES.map((language) => language.value);
assert(new Set(values).size === values.length, 'translate language codes are unique');
assert(
  TRANSLATE_LANGUAGES.every((language) => !Object.prototype.hasOwnProperty.call(language, 'flag')),
  'translate language options do not include flag metadata',
);

const simplifiedChinese = findTranslateLanguage('zh-CN');
assert(simplifiedChinese?.label === '中文 (简体)', 'Simplified Chinese is available with a user-facing label');

const traditionalChinese = findTranslateLanguage('zh-TW');
assert(traditionalChinese?.label === '中文 (繁體)', 'Traditional Chinese is available with a user-facing label');

for (const code of ['ar', 'vi', 'yue', 'pa', 'fa', 'ur', 'tl']) {
  assert(findTranslateLanguage(code), `community language ${code} is available`);
}

assert(
  findTranslateLanguage('tl')?.searchText?.includes('Tagalog'),
  'Filipino uses the Google web translate compatible Tagalog code',
);

assert(buildGoogleTranslateCookieValue('zh-CN') === '/auto/zh-CN', 'Simplified Chinese cookie value is correct');
assert(buildGoogleTranslateCookieValue('zh-TW') === '/auto/zh-TW', 'Traditional Chinese cookie value is correct');

console.log('translation widget checks passed');
