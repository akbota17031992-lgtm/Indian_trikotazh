// Utilities
export { cn } from './lib/utils.js';

// Tailwind Preset
export { indiaTrikotajPreset } from './tailwind-preset.js';

// Core UI Components
export { Button, buttonVariants, type ButtonProps } from './components/button.js';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
} from './components/card.js';
export { Badge, badgeVariants, type BadgeProps } from './components/badge.js';
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from './components/dialog.js';
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './components/select.js';
export { Input, type InputProps } from './components/input.js';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/tabs.js';
export {
  Skeleton,
  ProductCardSkeleton,
  StoreBranchSkeleton,
  type SkeletonProps,
} from './components/skeleton.js';

// Storefront Specialty Components
export { PriceTag, type PriceTagProps } from './components/price-tag.js';
export { StockIndicator, type StockIndicatorProps } from './components/stock-indicator.js';
