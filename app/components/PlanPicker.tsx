'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatSavedAt, type SavedRecipe } from '../utils/savedRecipes';
import { Button, ButtonRow } from './ui';
import { Check, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { Sheet } from './Sheet';

interface PlanPickerProps {
  saved: SavedRecipe[];
  currentSavedId: string | null;
  label: string;
  disabled?: boolean;
  onSelectPlan: (id: string) => void;
  onNewPlan: () => void;
  onDeletePlan: (id: string) => void;
  onEditPlan: (id: string) => void;
}

export function PlanPicker({
  saved,
  currentSavedId,
  label,
  disabled = false,
  onSelectPlan,
  onNewPlan,
  onDeletePlan,
  onEditPlan,
}: PlanPickerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<SavedRecipe | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuStyle({
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 260),
      });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);
  const close = () => setOpen(false);
  const handleSelect = (id: string) => {
    onSelectPlan(id);
    close();
  };
  const handleNew = () => {
    onNewPlan();
    close();
  };
  const confirmDelete = () => {
    if (!pendingDelete) return;
    onDeletePlan(pendingDelete.id);
    setPendingDelete(null);
  };
  const handleEdit = (id: string) => {
    onEditPlan(id);
    close();
  };
  const menu =
    open && menuStyle && mounted
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Close plan menu"
              className="fixed inset-0 z-40 backdrop-blur-[2px]"
              onClick={close}
            />
            <div
              role="listbox"
              aria-label="Plans"
              className="animate-scale-in fixed z-50 max-h-[min(60dvh,20rem)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface py-1 shadow-[var(--shadow-lg)]"
              style={{
                top: menuStyle.top,
                left: menuStyle.left,
                width: menuStyle.width,
              }}
            >
              {saved.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">No saved plans yet.</p>
              ) : (
                saved.map((item) => {
                  const isCurrent = item.id === currentSavedId;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-1 px-1 ${
                        isCurrent ? 'bg-accent-soft/60' : ''
                      }`}
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={isCurrent}
                        onClick={() => handleSelect(item.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-muted"
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                          {isCurrent && <Check size={14} className="text-accent" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {item.name}
                          </span>
                          <span className="block truncate text-[11px] text-muted">
                            {formatSavedAt(item.savedAt)}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(item.id)}
                        aria-label={`Edit ${item.name}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(item)}
                        aria-label={`Delete ${item.name}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={handleNew}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
              >
                <Plus size={16} />
                New plan
              </button>
            </div>
          </>,
          document.body,
        )
      : null;
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="group flex max-w-full items-center gap-1.5 text-left disabled:cursor-default"
      >
        <span className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {label}
        </span>
        {!disabled && (
          <ChevronDown
            size={18}
            className={`shrink-0 text-muted transition-transform group-hover:text-foreground ${
              open ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {menu}

      <Sheet
        open={!!pendingDelete}
        title="Delete plan?"
        onClose={() => setPendingDelete(null)}
        size="md"
      >
        <p className="text-sm text-muted">
          Delete <span className="font-semibold text-foreground">"{pendingDelete?.name}"</span>?
          This can't be undone.
        </p>
        <ButtonRow className="mt-5">
          <Button variant="secondary" onClick={() => setPendingDelete(null)} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} className="flex-1">
            Delete
          </Button>
        </ButtonRow>
      </Sheet>
    </>
  );
}
