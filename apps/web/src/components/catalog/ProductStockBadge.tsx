'use client';

import React, { useState } from 'react';
import { MapPin, ChevronRight, Store as StoreIcon } from 'lucide-react';
import { useBranch } from '../../contexts/BranchContext';
import { useLocale } from '../../contexts/LocaleContext';
import { Badge } from '@india-trikotaj/ui';
import { OtherStoresModal } from '../stores/OtherStoresModal';
import { formatStockBadge, getStockBadgeVariant } from '../../lib/stock-formatters';

interface ProductStockBadgeProps {
  variantId: string;
  stockByStore?: Record<string, number>; // storeId -> quantity
  lowStockThreshold?: number;
}

export function ProductStockBadge({
  variantId,
  stockByStore = {},
  lowStockThreshold = 3,
}: ProductStockBadgeProps) {
  const { selectedBranch } = useBranch();
  const { locale } = useLocale();
  const [showOtherStores, setShowOtherStores] = useState(false);

  // Defensively guard against NaN or non-finite stock values (Finding 5)
  const rawQty = stockByStore[selectedBranch.id];
  const currentStoreQty = Number.isFinite(rawQty) ? (rawQty ?? 0) : 0;
  const currentStoreName = locale === 'kz' ? selectedBranch.nameKz : selectedBranch.nameRu;

  // Use pure domain helpers for variant and localized text
  const badgeVariant = getStockBadgeVariant(currentStoreQty, lowStockThreshold);
  const badgeText = formatStockBadge(currentStoreQty, currentStoreName, lowStockThreshold, locale);


  // Count how many total Almaty branches have this variant in stock
  const storesWithStockCount = Object.values(stockByStore).filter(q => q > 0).length;

  return (
    <div className="space-y-2 py-1">
      <div className="flex items-center space-x-2">
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
        <Badge variant={badgeVariant} className="text-xs px-2.5 py-1">
          {badgeText}
        </Badge>
      </div>

      {/* Trigger for other branches modal */}
      <button
        type="button"
        onClick={() => setShowOtherStores(true)}
        className="text-xs text-primary hover:underline flex items-center space-x-1 font-medium pl-6"
      >
        <StoreIcon className="h-3.5 w-3.5 shrink-0" />
        <span>
          {storesWithStockCount === 16
            ? locale === 'kz'
              ? 'Барлық дүкендерде қолжетімді'
              : 'В наличии во всех магазинах'
            : locale === 'kz'
              ? `Басқа дүкендердегі қолжетімділік (${storesWithStockCount})`
              : `Наличие в других магазинах (${storesWithStockCount})`}
        </span>
        <ChevronRight className="h-3 w-3 shrink-0" />
      </button>

      {/* Cross-branch modal allowing 1-click switch */}
      <OtherStoresModal
        isOpen={showOtherStores}
        onClose={() => setShowOtherStores(false)}
        variantId={variantId}
        stockByStore={stockByStore}
      />
    </div>
  );
}
