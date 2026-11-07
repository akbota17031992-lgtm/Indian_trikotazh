'use client';

import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useLocale } from '../../contexts/LocaleContext';
import { CartItemRow } from './CartItemRow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@india-trikotaj/ui';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, itemCount, formattedSubtotal, clearCart } = useCart();
  const { t } = useLocale();

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
          <div className="space-y-0.5">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <span>{t('shoppingCartTitle')}</span>
              <span className="text-xs font-normal text-muted-foreground">
                ({itemCount} {t('cartItemCount')})
              </span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Shopping cart item preview and total
            </DialogDescription>
          </div>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-xs text-muted-foreground hover:text-destructive h-7"
            >
              {t('clearCart')}
            </Button>
          )}
        </DialogHeader>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">{t('emptyCart')}</p>
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                {t('continueShopping')}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cart.map(item => (
                <CartItemRow key={item.variantId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {cart.length > 0 && (
          <DialogFooter className="pt-4 border-t border-border flex flex-col sm:flex-col gap-3">
            <div className="flex items-center justify-between text-base font-bold text-foreground w-full">
              <span>{t('subtotal')}:</span>
              <span className="text-lg text-primary">{formattedSubtotal}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  if (typeof window !== 'undefined') window.location.href = '/cart';
                }}
                className="w-full text-xs"
              >
                {t('cart')}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onClose();
                  if (typeof window !== 'undefined') window.location.href = '/checkout';
                }}
                className="w-full text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <span>{t('checkout')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
