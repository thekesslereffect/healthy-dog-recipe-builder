import { useState } from 'react';
import { formatSavedAt, type SavedRecipe } from '../utils/savedRecipes';
import { card, inputBase } from './ui';
import { BookmarkIcon, PencilIcon, TrashIcon } from './icons';

interface SavedRecipesProps {
  saved: SavedRecipe[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function SavedRecipes({ saved, onLoad, onDelete, onRename }: SavedRecipesProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const startRename = (item: SavedRecipe) => {
    setRenamingId(item.id);
    setDraft(item.name);
  };
  const commitRename = (id: string) => {
    const name = draft.trim();
    if (name) onRename(id, name);
    setRenamingId(null);
  };
  if (saved.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center shadow-sm">
        <BookmarkIcon width={28} height={28} className="mx-auto text-zinc-300" />
        <h2 className="mt-4 text-xl font-semibold text-black">No saved plans</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
          Generate a plan, then save it from the Plan tab. Edit any saved plan later to load it
          back into shopping and feeding.
        </p>
      </div>
    );
  }

  return (
    <section className={card}>
      <div className="space-y-3">
        {saved.map((item) => {
          const dogNames = item.dogs.map((d) => d.name).filter(Boolean).join(', ');
          return (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
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
                    className={`${inputBase} font-semibold`}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startRename(item)}
                    title="Rename"
                    className="flex max-w-full items-center gap-1.5 text-left font-semibold text-black"
                  >
                    <span className="truncate decoration-zinc-300 decoration-dotted underline-offset-2 hover:underline">
                      {item.name}
                    </span>
                    <PencilIcon width={13} height={13} className="shrink-0 text-zinc-400" />
                  </button>
                )}
                <p className="mt-0.5 text-xs text-zinc-400">Saved {formatSavedAt(item.savedAt)}</p>
                <p className="mt-1 truncate text-sm text-zinc-500">
                  {item.dogs.length} {item.dogs.length === 1 ? 'dog' : 'dogs'}
                  {dogNames ? ` · ${dogNames}` : ''} · {Math.round(item.recipe.totalCalories)} cal/day
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onLoad(item.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-black px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  <PencilIcon width={15} height={15} />
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  aria-label={`Delete ${item.name}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-black"
                >
                  <TrashIcon width={15} height={15} />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
