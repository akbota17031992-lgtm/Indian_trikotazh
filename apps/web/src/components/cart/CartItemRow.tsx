'use client';

import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatKZT } from '@india-trikotaj/shared';
import { useCart, type CartItem } from '../../contexts/CartContext';
import { useLocale } from '../../contexts/LocaleContext';
import { Button } from '@india-trikotaj/ui';

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeItem, selectedVariantIds, toggleSelectItem } = useCart();
  const { getBilingual, t } = useLocale();

  const isSelected = selectedVariantIds ? selectedVariantIds.includes(item.variantId) : true;
  const title = getBilingual(item.titleKz, item.titleRu);
  const color = getBilingual(item.colorKz, item.colorRu);
  const itemTotal = item.priceKzt * item.quantity;

  return (
    <div
      className={`flex items-center gap-3 sm:gap-4 py-4 border-b border-border last:border-none transition-opacity duration-150 ${
        !isSelected ? 'opacity-50' : ''
      }`}
    >
      {/* Checkbox */}
      <div className="flex items-center shrink-0">
        <input
          type="checkbox"
          id={`cart-check-${item.variantId}`}
          checked={isSelected}
          onChange={() => toggleSelectItem(item.variantId)}
          className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
          aria-label={isSelected ? 'Снять выбор' : 'Выбрать товар'}
        />
      </div>

      {/* Product Image / Placeholder */}
      <div className="w-16 h-20 bg-muted/60 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl font-bold text-muted-foreground/30">IT</span>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="font-semibold text-sm text-foreground truncate" title={title}>
          {title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {item.size && (
            <span>
              {t('size')}: <strong className="text-foreground">{item.size}</strong>
            </span>
          )}
          {color && (
            <span>
              • {t('color')}: <strong className="text-foreground">{color}</strong>
            </span>
          )}
        </div>
        <div className="text-xs font-semibold text-foreground">
          {formatKZT(item.priceKzt)}
        </div>
      </div>

      {/* Quantity Stepper */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
          aria-label="Decrease quantity"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
          aria-label="Increase quantity"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Subtotal & Remove */}
      <div className="flex flex-col items-end gap-1 shrink-0 w-24">
        <span className="text-sm font-bold text-foreground">
          {formatKZT(itemTotal)}
        </span>
        <button
          type="button"
          onClick={() => removeItem(item.variantId)}
          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-0.5 transition-colors"
          title={t('remove')}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only text-[11px]">{t('remove')}</span>
        </button>
      </div>
    </div>
  );
}
