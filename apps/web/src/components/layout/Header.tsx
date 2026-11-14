'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatKZT } from '@india-trikotaj/shared';
import Link from 'next/link';
import { ShoppingBag, User, LogOut, Gift, Sparkles, LayoutDashboard } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import { useCart } from '../../contexts/CartContext';
import { BranchSelector } from '../stores/BranchSelector';
import { LocaleSwitcher } from '../ui/LocaleSwitcher';
import { CartDrawer } from '../cart/CartDrawer';
import { Button } from '@india-trikotaj/ui';

export function Header() {
  const { t, locale } = useLocale();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { itemCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-foreground flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#E83434]" />
              <span>India Trikotaj</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-muted-foreground">
            <Link href="/catalog" className="hover:text-foreground transition-colors">
              {t('catalog')}
            </Link>
            <Link href="/stores" className="hover:text-foreground transition-colors">
              {t('stores')}
            </Link>
            <Link
              href="/ai-stylist"
              className="flex items-center gap-1.5 text-amber-800 hover:text-amber-900 font-bold px-2.5 py-1 rounded-lg bg-amber-100/80 hover:bg-amber-200/80 transition-colors border border-amber-300/60"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>{locale === 'kz' ? 'ЖИ-Стилист' : 'ИИ-Стилист'}</span>
            </Link>
          </nav>

          {/* Right Action Cluster: Branch Selector, Locale Switcher, Auth & Cart */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <BranchSelector />
            <LocaleSwitcher />

            {/* Auth / Profile Area */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'У'}
                  </div>
                  <div className="hidden lg:block text-xs">
                    <div className="font-semibold text-foreground truncate max-w-[100px]">
                      {user.fullName || user.phone}
                    </div>
                    <div className="text-emerald-700 font-bold flex items-center gap-0.5 text-[11px]">
                      <Sparkles className="w-2.5 h-2.5" />
                      {formatKZT(user.bonusesKzt)}
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl p-3 z-50">
                    <div className="pb-2 border-b border-border/60">
                      <div className="font-semibold text-sm">{user.fullName || 'Пользователь'}</div>
                      <div className="text-xs text-muted-foreground">{user.phone}</div>
                      {user.email && <div className="text-xs text-muted-foreground">{user.email}</div>}
                    </div>

                    <div className="py-2.5 flex items-center justify-between text-xs bg-emerald-50 text-emerald-900 rounded-lg px-2.5 mt-2">
                      <span className="font-medium">Бонусы лояльности:</span>
                      <span className="font-bold text-emerald-700">{formatKZT(user.bonusesKzt)}</span>
                    </div>

                    {/* Staff / Admin Hub Link */}
                    {(user.role === 'admin' || user.role === 'store_manager') && (
                      <Link
                        href="/admin"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-amber-700" />
                        <span>{locale === 'kz' ? 'Әкімші кабинеті' : 'Кабинет администратора'}</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{locale === 'kz' ? 'Шығу' : 'Выйти из профиля'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openAuthModal}
                className="flex items-center gap-1.5 px-3 h-9 text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50 bg-emerald-50/40"
              >
                <Gift className="w-3.5 h-3.5 text-emerald-600" />
                <span>{locale === 'kz' ? 'Кіру (+1000 ₸)' : 'Войти (+1 000 ₸)'}</span>
              </Button>
            )}

            {/* Cart Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center space-x-1.5 px-3 h-9"
              aria-label={t('cart')}
            >
              <ShoppingBag className="h-4 w-4 text-foreground" />
              <span className="hidden sm:inline text-xs font-semibold">{t('cart')}</span>
              {itemCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-[#E83434] text-white text-[10px] font-bold h-4 min-w-4 px-1">
                  {itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
