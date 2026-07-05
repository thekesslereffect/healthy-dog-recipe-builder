import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';
import {
  btnGhost,
  btnPrimary,
  btnSecondary,
  iconBtn,
  toolbarEditBtn,
} from './tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon' | 'toolbar' | 'danger';

const variantClass: Record<ButtonVariant, string> = {
  primary: btnPrimary,
  secondary: btnSecondary,
  ghost: btnGhost,
  icon: iconBtn,
  toolbar: toolbarEditBtn,
  danger:
    'rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-600 active:scale-[0.98]',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(variantClass[variant], className)} {...props} />
  );
}

/** Side-by-side cancel / confirm layout used in sheets and modals. */
export function ButtonRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex gap-2', className)}>{children}</div>;
}
