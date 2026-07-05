import { useMemo, useState } from 'react';
import { Sheet } from './Sheet';

interface IngredientPickerProps {
  current: string;
  suggestions: string[];
  onSelect: (name: string) => void;
  onCancel: () => void;
}

/**
 * Ingredient swap: bottom sheet on mobile, centered modal on desktop.
 * Optional filter uses text-base (16px) so iOS won't zoom on focus.
 */
export function IngredientPicker({
  current,
  suggestions,
  onSelect,
  onCancel,
}: IngredientPickerProps) {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suggestions;
    return suggestions.filter((s) => s.toLowerCase().includes(q));
  }, [query, suggestions]);

  return (
    <Sheet open title={`Replace ${current}`} onClose={onCancel} size="md">
      <div className="space-y-3">
        <input
          type="search"
          value={query}
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Filter ingredients…"
          aria-label="Filter ingredients"
          // 16px minimum prevents iOS Safari from zooming on focus
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-base text-black outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:bg-zinc-900 dark:focus:ring-zinc-700"
          onChange={(e) => setQuery(e.target.value)}
        />

        <ul
          role="listbox"
          aria-label="Ingredient options"
          className="max-h-[50dvh] overflow-y-auto overscroll-contain rounded-xl border border-zinc-100 dark:border-zinc-800"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-zinc-400">No matches</li>
          ) : (
            matches.map((name) => (
              <li key={name} role="option">
                <button
                  type="button"
                  onClick={() => onSelect(name)}
                  className="w-full border-b border-zinc-50 px-3 py-3 text-left text-base text-black last:border-b-0 active:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-50 dark:active:bg-zinc-800"
                >
                  {name}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </Sheet>
  );
}
