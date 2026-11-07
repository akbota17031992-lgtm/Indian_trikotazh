'use client';

import React from 'react';
import { useBranch } from '../../contexts/BranchContext';
import { useLocale } from '../../contexts/LocaleContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Badge,
} from '@india-trikotaj/ui';
import { sortBranchesByStock } from '../../lib/stock-formatters';

interface OtherStoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  variantId: string;
  stockByStore: Record<string, number>;
}

export function OtherStoresModal({
  isOpen,
  onClose,
  variantId: _variantId,
  stockByStore,
}: OtherStoresModalProps) {
  const { branches, selectedBranch, selectBranch } = useBranch();
  const { locale, t } = useLocale();

  const handleSwitchStore = (storeId: string) => {
    selectBranch(storeId);
    onClose();
  };

  const sortedBranches = sortBranchesByStock(branches, stockByStore);


  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {t('availableInOtherStores')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('switchStoreForImmediatePickup')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 pt-2">
          {sortedBranches.map(branch => {
            const qty = stockByStore[branch.id] ?? 0;
            const isSelected = branch.id === selectedBranch.id;
            const name = locale === 'kz' ? branch.nameKz : branch.nameRu;
            const address = locale === 'kz' ? branch.addressKz : branch.addressRu;

            return (
              <div
                key={branch.id}
                className={`p-3 rounded-lg border flex items-center justify-between text-sm ${
                  isSelected ? 'bg-primary/5 border-primary' : 'border-border'
                }`}
              >
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    {name}
                    {isSelected && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {t('current')}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{address}</div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {qty > 0 ? (
                    <Badge variant="stockIn">
                      {qty} {locale === 'kz' ? 'дана' : 'шт.'}
                    </Badge>
                  ) : (
                    <Badge variant="stockOut">
                      {locale === 'kz' ? 'Жоқ' : 'Нет'}
                    </Badge>
                  )}

                  {!isSelected && qty > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => handleSwitchStore(branch.id)}
                    >
                      {t('pickupHere')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
