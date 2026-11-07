import * as React from 'react';
import { formatKZT } from '@india-trikotaj/shared';
import { cn } from '../lib/utils.js';

export interface PriceTagProps extends React.HTMLAttributes<HTMLDivElement> {
  amountKzt: number;
  originalAmountKzt?: number;
  size?: 'sm' | 'default' | 'lg';
  ref?: React.Ref<HTMLDivElement>;
}

export function PriceTag({
  amountKzt,
  originalAmountKzt,
  size = 'default',
  className,
  ref,
  ...props
}: PriceTagProps) {
  const isDiscounted = originalAmountKzt !== undefined && originalAmountKzt > amountKzt;

  return (
    <div
      ref={ref}
      className={cn('inline-flex items-baseline space-x-2 select-none', className)}
      {...props}
    >
      <span
        className={cn(
          'font-bold text-foreground tracking-tight',
          size === 'sm' && 'text-sm',
          size === 'default' && 'text-lg sm:text-xl',
          size === 'lg' && 'text-2xl sm:text-3xl'
        )}
      >
        {formatKZT(amountKzt)}
      </span>
      {isDiscounted && (
        <span
          className={cn(
            'text-muted-foreground line-through decoration-muted-foreground/60',
            size === 'sm' && 'text-xs',
            size === 'default' && 'text-sm',
            size === 'lg' && 'text-base'
          )}
        >
          {formatKZT(originalAmountKzt)}
        </span>
      )}
    </div>
  );
}
