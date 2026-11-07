import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils.js';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground border-border',
        kaspi: 'border-transparent bg-kaspi text-kaspi-foreground font-bold shadow-sm',
        stockIn:
          'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
        stockLow:
          'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
        stockOut:
          'border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
        discount: 'border-transparent bg-rose-600 text-white font-bold',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px] leading-tight',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  ref?: React.Ref<HTMLDivElement>;
}

export function Badge({ className, variant, size, ref, ...props }: BadgeProps) {
  return <div ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
