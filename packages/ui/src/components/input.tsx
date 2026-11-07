import * as React from 'react';
import { cn } from '../lib/utils.js';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  prefixText?: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({
  className,
  type = 'text',
  error = false,
  leftIcon,
  rightIcon,
  prefixText,
  disabled,
  ref,
  ...props
}: InputProps) {
  return (
    <div className="relative flex w-full items-center">
      {leftIcon && (
        <div className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
          {leftIcon}
        </div>
      )}
      {prefixText && (
        <span className="pointer-events-none absolute left-3 text-sm font-medium text-muted-foreground">
          {prefixText}
        </span>
      )}
      <input
        type={type}
        ref={ref}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]',
          leftIcon && 'pl-10',
          prefixText && 'pl-10',
          rightIcon && 'pr-10',
          error &&
            'border-destructive focus-visible:ring-destructive text-destructive placeholder:text-destructive/60',
          className
        )}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-3 flex items-center text-muted-foreground">{rightIcon}</div>
      )}
    </div>
  );
}
