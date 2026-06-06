import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import {
  DEFAULT_TRANSLATE_LANGUAGE,
  SOURCE_PAGE_LANGUAGE,
  TRANSLATE_LANGUAGES,
  buildGoogleTranslateCookieValue,
  findTranslateLanguage,
  searchTranslateLanguages,
} from '../data/translateLanguages';

const STORAGE_KEY = 'sentinel.translateLanguage';
const COOKIE_NAME = 'googtrans';
// Bottom sheet below Tailwind lg — covers phones, tablets, and half-width desktop windows.
const MOBILE_SHEET_QUERY = '(max-width: 1023px)';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (
          options: { pageLanguage: string; autoDisplay?: boolean },
          elementId: string,
        ) => void;
      };
    };
  }
}

function clearGoogleTranslateCookie() {
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  document.cookie = `${COOKIE_NAME}=;${expired}`;

  const hostname = window.location.hostname;
  if (hostname) {
    document.cookie = `${COOKIE_NAME}=;${expired};domain=${hostname}`;
    if (hostname.includes('.') && hostname !== 'localhost') {
      document.cookie = `${COOKIE_NAME}=;${expired};domain=.${hostname}`;
    }
  }
}

function setGoogleTranslateCookie(languageCode: string) {
  const cookieValue = buildGoogleTranslateCookieValue(languageCode);
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${cookieValue};path=/;max-age=${maxAge}`;

  const hostname = window.location.hostname;
  if (hostname) {
    document.cookie = `${COOKIE_NAME}=${cookieValue};path=/;max-age=${maxAge};domain=${hostname}`;
  }
}

function restoreSavedLanguage() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved && findTranslateLanguage(saved) ? saved : DEFAULT_TRANSLATE_LANGUAGE;
}

function hideInjectedGoogleTranslateControls() {
  document
    .querySelectorAll<HTMLElement>(
      '.skiptranslate, .goog-te-banner-frame, .goog-te-gadget, .goog-te-combo, .goog-te-balloon-frame, #goog-gt-tt, .goog-tooltip',
    )
    .forEach((element) => {
      element.setAttribute('aria-hidden', 'true');
      element.setAttribute('tabindex', '-1');
    });
}

type LanguageMenuProps = {
  searchRef: RefObject<HTMLInputElement>;
  query: string;
  onQueryChange: (value: string) => void;
  filteredLanguages: ReturnType<typeof searchTranslateLanguages>;
  currentLanguage: string;
  onSelectLanguage: (languageCode: string) => void;
  variant: 'dropdown' | 'sheet';
};

function LanguageMenu({
  searchRef,
  query,
  onQueryChange,
  filteredLanguages,
  currentLanguage,
  onSelectLanguage,
  variant,
}: LanguageMenuProps) {
  const menuClass = variant === 'sheet' ? 'sentinel-translate-menu-sheet' : 'sentinel-translate-menu';

  return (
    <div className={menuClass} role="dialog" aria-label="Language selector" aria-modal={variant === 'sheet'}>
      {variant === 'sheet' && (
        <>
          <div className="sentinel-translate-sheet-handle" aria-hidden="true" />
          <p className="sentinel-translate-sheet-title">Select language</p>
        </>
      )}
      <input
        ref={searchRef}
        type="search"
        className="sentinel-translate-search"
        placeholder="Search languages"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <div className="sentinel-translate-list" role="listbox" aria-label="Available languages">
        {filteredLanguages.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">No languages found</p>
        ) : (
          filteredLanguages.map((language) => {
            const isSelected = language.value === currentLanguage;
            return (
              <button
                key={language.value}
                type="button"
                className={`sentinel-translate-option ${isSelected ? 'sentinel-translate-option-active' : ''}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectLanguage(language.value)}
              >
                <span className="min-w-0 truncate">{language.label}</span>
                {isSelected && (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.31a1 1 0 0 1-1.42 0L4.29 10.23a1 1 0 1 1 1.42-1.41l3.04 3.064 6.54-6.588a1 1 0 0 1 1.414-.006z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export function GoogleTranslate() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_TRANSLATE_LANGUAGE);
  const [scriptReady, setScriptReady] = useState(false);
  const [useMobileSheet, setUseMobileSheet] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const elementIdRef = useRef(`google_translate_element_${Math.random().toString(36).slice(2, 9)}`);

  const selectedLanguage = findTranslateLanguage(currentLanguage) ?? findTranslateLanguage(DEFAULT_TRANSLATE_LANGUAGE);
  const filteredLanguages = useMemo(() => searchTranslateLanguages(query), [query]);

  useEffect(() => {
    setCurrentLanguage(restoreSavedLanguage());
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_SHEET_QUERY);
    const syncLayout = () => setUseMobileSheet(mediaQuery.matches);
    syncLayout();
    mediaQuery.addEventListener('change', syncLayout);
    return () => mediaQuery.removeEventListener('change', syncLayout);
  }, []);

  useEffect(() => {
    if (!open || !useMobileSheet) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, useMobileSheet]);

  useEffect(() => {
    function initialiseWidget() {
      if (!window.google?.translate?.TranslateElement || !document.getElementById(elementIdRef.current)) return;
      new window.google.translate.TranslateElement(
        { pageLanguage: SOURCE_PAGE_LANGUAGE, autoDisplay: false },
        elementIdRef.current,
      );
      setScriptReady(true);
    }

    if (window.google?.translate?.TranslateElement) {
      initialiseWidget();
      return;
    }

    const previousInitialiser = window.googleTranslateElementInit;
    window.googleTranslateElementInit = () => {
      previousInitialiser?.();
      initialiseWidget();
    };

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onerror = () => setScriptReady(false);
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const styleId = 'sentinel-google-translate-hide-banner';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .skiptranslate { display: none !important; }
      body { top: 0 !important; }
      .goog-te-banner-frame { display: none !important; }
      .goog-te-gadget { display: none !important; }
      .goog-te-combo { display: none !important; }
      .goog-te-balloon-frame { display: none !important; }
      #goog-gt-tt { display: none !important; }
      .goog-tooltip { display: none !important; }
      iframe.skiptranslate { display: none !important; }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    hideInjectedGoogleTranslateControls();
    const observer = new MutationObserver(() => hideInjectedGoogleTranslateControls());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (useMobileSheet) return;
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [useMobileSheet]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setQuery('');
    }
  }, [open]);

  function changeLanguage(languageCode: string) {
    setOpen(false);

    if (languageCode === DEFAULT_TRANSLATE_LANGUAGE) {
      window.localStorage.removeItem(STORAGE_KEY);
      clearGoogleTranslateCookie();
      setCurrentLanguage(DEFAULT_TRANSLATE_LANGUAGE);
      window.location.reload();
      return;
    }

    clearGoogleTranslateCookie();
    setGoogleTranslateCookie(languageCode);
    window.localStorage.setItem(STORAGE_KEY, languageCode);
    setCurrentLanguage(languageCode);
    window.location.reload();
  }

  const languageMenu = (
    <LanguageMenu
      searchRef={searchRef}
      query={query}
      onQueryChange={setQuery}
      filteredLanguages={filteredLanguages}
      currentLanguage={currentLanguage}
      onSelectLanguage={changeLanguage}
      variant={useMobileSheet ? 'sheet' : 'dropdown'}
    />
  );

  const mobileSheetPortal =
    open && useMobileSheet
      ? createPortal(
          <>
            <button
              type="button"
              className="sentinel-translate-backdrop notranslate"
              translate="no"
              aria-label="Close language selector"
              onClick={() => setOpen(false)}
            />
            {languageMenu}
          </>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="sentinel-google-translate notranslate" translate="no">
      <div id={elementIdRef.current} className="hidden" aria-hidden="true" />
      <button
        type="button"
        className="sentinel-translate-button"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={!scriptReady}
        onClick={() => setOpen((value) => !value)}
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="min-w-0 truncate">{selectedLanguage?.label ?? 'English'}</span>
        <svg className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && !useMobileSheet && languageMenu}
      {mobileSheetPortal}
    </div>
  );
}
