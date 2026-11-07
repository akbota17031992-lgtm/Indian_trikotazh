'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ru, type TranslationKey } from '../dictionaries/ru';
import { kz } from '../dictionaries/kz';
import {
  normalizeLocale,
  getBilingual as resolveBilingual,
  getBilingualText,
} from '../lib/locale-helpers';

export type Locale = 'ru' | 'kz';

interface LocaleContextType {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: TranslationKey) => string;
  getBilingual: (kzString?: string | null, ruString?: string | null) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const COOKIE_NAME = 'indiatrikotaj_locale';

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ru');

  useEffect(() => {
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      const val = match ? match[3] : undefined;
      return val ? decodeURIComponent(val) : null;
    };

    const saved = getCookie(COOKIE_NAME) || (typeof localStorage !== 'undefined' ? localStorage.getItem(COOKIE_NAME) : null);
    setLocaleState(normalizeLocale(saved));
  }, []);

  const setLocale = (next: Locale) => {
    const normalized = normalizeLocale(next);
    setLocaleState(normalized);
    if (typeof document !== 'undefined') {
      document.cookie = `${COOKIE_NAME}=${normalized}; Path=/; Max-Age=31536000; SameSite=Lax`;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COOKIE_NAME, normalized);
    }
  };

  const t = (key: TranslationKey): string => {
    const dict = locale === 'kz' ? kz : ru;
    return getBilingualText(dict as Record<string, string>, key, ru as Record<string, string>);
  };

  const getBilingual = (kzString?: string | null, ruString?: string | null): string => {
    return resolveBilingual(locale, kzString, ruString);
  };


  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, getBilingual }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}
