import { useEffect } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Wider modal on desktop (default: md). */
  size?: 'md' | 'lg';
}

const DESKTOP_MAX_W: Record<NonNullable<SheetProps['size']>, string> = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
};

export function Sheet({ open, title, onClose, children, size = 'lg' }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center sm:p-6 print:hidden">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40 dark:bg-black/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 flex max-h-[85dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-zinc-900 dark:shadow-none dark:ring-1 dark:ring-zinc-800 sm:max-h-[min(90dvh,42rem)] sm:rounded-2xl ${DESKTOP_MAX_W[size]}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-base font-semibold tracking-tight text-black dark:text-zinc-50">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-black dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
