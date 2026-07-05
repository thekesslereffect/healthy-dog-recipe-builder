import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import { cn } from './cn';
import { card, cardElevated } from './tokens';

export type CardVariant = 'default' | 'elevated';

const variantClass: Record<CardVariant, string> = {
  default: card,
  elevated: cardElevated,
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export function Card({ variant = 'default', className, ...props }: CardProps) {
  return <div className={cn(variantClass[variant], className)} {...props} />;
}

export interface CardButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: CardVariant;
}

export function CardButton({
  variant = 'elevated',
  className,
  type = 'button',
  ...props
}: CardButtonProps) {
  return (
    <button
      type={type}
      className={cn(variantClass[variant], className)}
      {...props}
    />
  );
}
