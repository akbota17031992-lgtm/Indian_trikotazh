'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from '../../contexts/LocaleContext';

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="border-t border-border bg-muted/30 text-muted-foreground mt-auto">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#E83434]" />
              <span className="font-extrabold text-base text-foreground tracking-tight">
                India Trikotaj
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('tagline')}</p>
            <p className="text-xs text-muted-foreground/80">{t('countryOfOrigin')}</p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {t('catalog')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/catalog?category=t-shirts" className="hover:text-foreground">
                  {t('categoryTshirts')}
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=long-sleeves" className="hover:text-foreground">
                  {t('categoryLongsleeves')}
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=robes" className="hover:text-foreground">
                  {t('categoryRobes')}
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=pajamas" className="hover:text-foreground">
                  {t('categoryPajamas')}
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=thermal-underwear" className="hover:text-foreground">
                  {t('categoryThermal')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Almaty Retail Network */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {t('stores')}
            </h4>
            <p className="text-xs leading-relaxed">
              16 филиалов в ТРЦ Алматы (MEGA Alma-Ata, Dostyk Plaza, Grand Park, Moskva Metropolitan, ADK, Aport Mall и др.)
            </p>
            <Link href="/stores" className="text-xs text-primary font-medium hover:underline inline-block">
              {t('selectBranchTitle')} →
            </Link>
          </div>

          {/* Col 4: Payments & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Kaspi Pay
            </h4>
            <p className="text-xs leading-relaxed">
              Оплата через Kaspi QR, Kaspi Gold, рассрочка Kaspi Red 0-0-3 и Kaspi Kredit 0-0-12.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#F14635] text-white">
                Kaspi Pay
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-muted text-foreground border border-border">
                0-0-3
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <div>© {new Date().getFullYear()} India Trikotaj Marketplace. Все права защищены.</div>
          <div className="flex space-x-4">
            <span>Алматы, Казахстан</span>
            <span>•</span>
            <span>Kaspi QR & Dostavka</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
