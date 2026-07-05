import { useState } from 'react';
import { formatSavedAt, type SavedRecipe } from '../utils/savedRecipes';
import { btnPrimary, btnSecondary, inputBase } from './ui';
import { Bookmark, Pencil, Trash2 } from 'lucide-react';
import { Sheet } from './Sheet';

interface SavedRecipesProps {
  saved: SavedRecipe[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function SavedRecipes({ saved, onLoad, onDelete, onRename }: SavedRecipesProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [pendingDelete, setPendingDelete] = useState<SavedRecipe | null>(null);

  const startRename = (item: SavedRecipe) => {
    setRenamingId(item.id);
    setDraft(item.name);
  };
  const commitRename = (id: string) => {
    const name = draft.trim();
    if (name) onRename(id, name);
    setRenamingId(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    onDelete(pendingDelete.id);
    setPendingDelete(null);
  };

  if (saved.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <Bookmark size={28} className="text-zinc-300" />
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          No saved plans
        </h2>
        <p className="mt-1 max-w-xs text-sm text-zinc-500">
          Confirm a draft in Build to save it here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain">
        {saved.map((item) => {
          const dogNames = item.dogs.map((d) => d.name).filter(Boolean).join(', ');
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {renamingId === item.id ? (
                <input
                  type="text"
                  value={draft}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => commitRename(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(item.id);
                    else if (e.key === 'Escape') setRenamingId(null);
                  }}
                  aria-label="Recipe name"
                  className={`${inputBase} font-medium`}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => startRename(item)}
                  className="flex max-w-full items-center gap-1.5 text-left text-sm font-medium text-black dark:text-zinc-50"
                >
                  <span className="truncate">{item.name}</span>
                  <Pencil size={12} className="shrink-0 text-zinc-400" />
                </button>
              )}
              <p className="mt-0.5 text-[11px] text-zinc-400">
                {formatSavedAt(item.savedAt)}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {item.dogs.length} dog{item.dogs.length === 1 ? '' : 's'}
                {dogNames ? ` · ${dogNames}` : ''} · {Math.round(item.recipe.totalCalories)} cal
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onLoad(item.id)}
                  className="flex-1 rounded-xl bg-black py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(item)}
                  aria-label={`Delete ${item.name}`}
                  className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-3 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Sheet
        open={!!pendingDelete}
        title="Delete plan?"
        onClose={() => setPendingDelete(null)}
      >
        <p className="text-sm text-zinc-600">
          Delete{' '}
          <span className="font-medium text-black dark:text-zinc-50">
            “{pendingDelete?.name}”
          </span>
          ? This can’t be undone.
          {pendingDelete && (
            <span className="mt-2 block text-zinc-500">
              If this is your current plan, Plan will be cleared too.
            </span>
          )}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            className={`${btnSecondary} flex-1`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Sheet>
    </div>
  );
}
