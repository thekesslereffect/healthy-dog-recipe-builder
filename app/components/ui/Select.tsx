import type { SelectHTMLAttributes } from 'react';
import { cn } from './cn';
import { inputBase, massUnitSelect, toolbarUnitSelect } from './tokens';

export type SelectVariant = 'default' | 'toolbar' | 'mass';

const variantClass: Record<SelectVariant, string> = {
  default: inputBase,
  toolbar: toolbarUnitSelect,
  mass: massUnitSelect,
};

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: SelectVariant;
}

export function Select({ variant = 'default', className, ...props }: SelectProps) {
  return <select className={cn(variantClass[variant], className)} {...props} />;
}
