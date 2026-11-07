'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Trash2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useBranch } from '../../contexts/BranchContext';
import { CartItemRow } from '../../components/cart/CartItemRow';
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, Badge } from '@india-trikotaj/ui';
import { formatKZT } from '@india-trikotaj/shared';
import { calculateKaspiRedInstallment } from '../../lib/kaspi-helpers';


export function CartPageClient() {
  const { cart, itemCount, subtotalKzt, formattedSubtotal, deliveryFeeKzt, formattedDeliveryFee, formattedTotal, totalKzt, clearCart, fulfillmentType, setFulfillmentType } = useCart();
  const { locale, t } = useLocale();
  const { selectedBranch } = useBranch();

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center space-y-4">
        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto text-muted-foreground/30">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{t('emptyCart')}</h1>
        <p className="text-sm text-muted-foreground">
          {locale === 'kz'
            ? 'Себетіңізде әлі тауар жоқ. Каталогқа өтіп, өзіңізге ұнайтын тауарды таңдаңыз.'
            : 'В вашей корзине пока нет товаров. Перейдите в каталог и выберите качественный индийский трикотаж.'}
        </p>
        <Link href="/catalog" className="inline-block pt-2">
          <Button size="lg" className="font-semibold flex items-center gap-2">
            <span>{t('continueShopping')}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {t('cart')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {itemCount} {t('cartItemCount')}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t('clearCart')}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4 sm:p-6 divide-y divide-border">
              {cart.map(item => (
                <CartItemRow key={item.variantId} item={item} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Summary Column */}
        <div className="space-y-4">
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">
                {locale === 'kz' ? 'Тапсырыс сомасы' : 'Сумма заказа'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('subtotal')}:</span>
                <span className="font-semibold text-foreground">{formattedSubtotal}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('deliveryFee')}:</span>
                <span className="font-semibold text-foreground">{formattedDeliveryFee}</span>
              </div>

              {/* Delivery mode selection */}
              <div className="pt-2 border-t border-border/60 space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  {t('fulfillmentType')}:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('pickup')}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      fulfillmentType === 'pickup'
                        ? 'border-primary bg-primary/5 font-semibold text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div>{t('storePickup')}</div>
                    <div className="text-[10px] text-muted-foreground font-normal">0 ₸ (15 мин)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('courier')}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      fulfillmentType === 'courier'
                        ? 'border-primary bg-primary/5 font-semibold text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div>{t('courierDelivery')}</div>
                    <div className="text-[10px] text-muted-foreground font-normal">1 500 ₸</div>
                  </button>
                </div>
              </div>

              <div className="border-t border-border pt-3 flex justify-between text-lg font-black text-foreground">
                <span>{t('total')}:</span>
                <span className="text-[#F14635]">{formattedTotal}</span>
              </div>

              {/* Installment Badge */}
              <div className="p-2.5 bg-red-50 rounded-lg text-xs space-y-1 text-red-900 border border-red-100">
                <div className="font-semibold flex items-center justify-between">
                  <span>Kaspi Red 0-0-3:</span>
                  <span>3 x {formatKZT(calculateKaspiRedInstallment(totalKzt))}/мес</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-0 flex flex-col gap-2">
              <Link href="/checkout" className="w-full">
                <Button
                  size="lg"
                  className="w-full h-12 text-sm font-bold flex items-center justify-center gap-2 bg-[#E83434] hover:bg-[#D32828] text-white"
                >
                  <span>{t('goToCheckout')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/catalog" className="w-full">
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  <span>{t('continueShopping')}</span>
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
