import { useMemo, useState } from 'react';
import { Sheet } from './Sheet';
import { inputBase } from './ui';

interface IngredientPickerProps {
  current: string;
  suggestions: string[];
  onSelect: (name: string) => void;
  onCancel: () => void;
}

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
    <Sheet open title={`Replace ${current}`} onClose={onCancel} size="md" scroll="child">
      <div className="flex min-h-0 flex-1 flex-col gap-3">
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
          className={`${inputBase} shrink-0 text-base`}
          onChange={(e) => setQuery(e.target.value)}
        />

        <ul
          role="listbox"
          aria-label="Ingredient options"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-border"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-muted">No matches</li>
          ) : (
            matches.map((name) => (
              <li key={name} role="option">
                <button
                  type="button"
                  onClick={() => onSelect(name)}
                  className="w-full border-b border-border/50 px-3 py-3 text-left text-base text-foreground transition-colors last:border-b-0 hover:bg-surface-muted active:bg-accent-soft"
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
