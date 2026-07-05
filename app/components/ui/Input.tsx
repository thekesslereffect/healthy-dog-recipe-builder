import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';
import { inputBase } from './tokens';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(inputBase, className)} {...props} />;
}
