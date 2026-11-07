import * as React from 'react';
import { cn } from '../lib/utils.js';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

export function Skeleton({ className, ref, ...props }: SkeletonProps) {
  return (
    <div ref={ref} className={cn('animate-pulse rounded-md bg-muted/70', className)} {...props} />
  );
}

/**
 * Composite skeleton for clothing product cards in catalog grid.
 */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 rounded-xl border border-border p-3">
      {/* Product Image placeholder */}
      <Skeleton className="aspect-[3/4] w-full rounded-lg" />
      {/* Category / Badge */}
      <Skeleton className="h-4 w-1/3" />
      {/* Product Title (2 lines) */}
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      {/* Price & Action */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Composite skeleton for Almaty retail branch row.
 */
export function StoreBranchSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
  );
}
