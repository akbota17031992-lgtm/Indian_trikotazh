'use client';

import React from 'react';
import { useLocale } from '../../contexts/LocaleContext';

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="inline-flex items-center rounded-lg border border-border p-0.5 bg-muted/40 text-xs font-semibold">
      <button
        type="button"
        onClick={() => setLocale('ru')}
        className={`px-2 py-1 rounded-md transition-all ${
          locale === 'ru'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Русский язык"
      >
        RU
      </button>
      <button
        type="button"
        onClick={() => setLocale('kz')}
        className={`px-2 py-1 rounded-md transition-all ${
          locale === 'kz'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Қазақ тілі"
      >
        KZ
      </button>
    </div>
  );
}
