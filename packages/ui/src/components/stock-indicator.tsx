import * as React from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '../lib/utils.js';
import { Badge } from './badge.js';

export interface StockIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  quantity: number;
  storeName?: string;
  lowStockThreshold?: number;
  showIcon?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

export function StockIndicator({
  quantity,
  storeName,
  lowStockThreshold = 3,
  showIcon = true,
  className,
  ref,
  ...props
}: StockIndicatorProps) {
  let variant: 'stockIn' | 'stockLow' | 'stockOut' = 'stockIn';
  let label = 'В наличии';

  if (quantity <= 0) {
    variant = 'stockOut';
    label = 'Нет в наличии';
  } else if (quantity <= lowStockThreshold) {
    variant = 'stockLow';
    label = `Осталось: ${quantity} шт.`;
  } else {
    variant = 'stockIn';
    label = `В наличии: ${quantity} шт.`;
  }

  return (
    <div
      ref={ref}
      className={cn('inline-flex items-center space-x-2 text-sm', className)}
      {...props}
    >
      {showIcon && <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />}
      {storeName && (
        <span className="font-medium text-foreground truncate max-w-[180px] sm:max-w-[240px]">
          {storeName}:
        </span>
      )}
      <Badge variant={variant} size="sm">
        {label}
      </Badge>
    </div>
  );
}
