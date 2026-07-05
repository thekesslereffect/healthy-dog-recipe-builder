'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'md' | 'lg';
}

const DESKTOP_MAX_W: Record<NonNullable<SheetProps['size']>, string> = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
};

export function Sheet({ open, title, onClose, children, size = 'lg' }: SheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center sm:p-6 print:hidden">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-slide-up relative z-10 flex max-h-[85dvh] w-full flex-col rounded-t-3xl bg-surface shadow-[var(--shadow-lg)] sm:animate-scale-in sm:max-h-[min(90dvh,42rem)] sm:rounded-2xl ${DESKTOP_MAX_W[size]}`}
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden" />
        <div className="flex shrink-0 items-center justify-between px-5 py-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-all hover:bg-surface-muted hover:text-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
