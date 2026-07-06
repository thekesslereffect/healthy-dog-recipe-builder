import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './cn';
import { inputBase, massUnitSelect, toolbarUnitSelect } from './tokens';

export type SelectVariant = 'default' | 'toolbar' | 'mass';

const variantClass: Record<SelectVariant, string> = {
  default: inputBase,
  toolbar: toolbarUnitSelect,
  mass: massUnitSelect,
};

/** Right padding + chevron inset so text, icon, and edge all breathe. */
const chevronLayout: Record<
  SelectVariant,
  { size: number; inset: string; padding: string }
> = {
  default: { size: 16, inset: 'right-3', padding: 'pr-10' },
  toolbar: { size: 14, inset: 'right-2.5', padding: 'pr-8 sm:pr-9' },
  mass: { size: 12, inset: 'right-2', padding: 'pr-7' },
};

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: SelectVariant;
}

export function Select({ variant = 'default', className, ...props }: SelectProps) {
  const layout = chevronLayout[variant];
  return (
    <div className={cn('relative inline-flex', variant === 'default' && 'w-full')}>
      <select
        className={cn(variantClass[variant], 'appearance-none', layout.padding, className)}
        {...props}
      />
      <ChevronDown
        size={layout.size}
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted',
          layout.inset,
        )}
      />
    </div>
  );
}
