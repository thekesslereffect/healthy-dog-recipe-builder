import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Sheet } from './Sheet';
import { inputBase } from './ui';

interface AllergyInputProps {
  value: string[];
  suggestions: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}

export function AllergyInput({ value, suggestions, onAdd, onRemove }: AllergyInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const available = useMemo(
    () => suggestions.filter((s) => !value.includes(s)),
    [suggestions, value],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((s) => s.toLowerCase().includes(q));
  }, [query, available]);

  const trimmedQuery = query.trim();
  const canAddCustom =
    trimmedQuery.length > 0 &&
    !value.some((name) => name.toLowerCase() === trimmedQuery.toLowerCase());

  const openPicker = () => {
    setQuery('');
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setQuery('');
  };

  const commit = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onAdd(trimmed);
    closePicker();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 rounded-lg bg-accent-soft py-0.5 pl-2 pr-1 text-xs font-semibold text-accent"
          >
            {name}
            <button
              type="button"
              onClick={() => onRemove(name)}
              aria-label={`Remove ${name}`}
              className="inline-flex h-4 w-4 items-center justify-center rounded text-accent/70 hover:bg-accent/10 hover:text-accent"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={openPicker}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-dashed border-border px-2.5 text-xs font-semibold text-muted transition-colors hover:border-accent/30 hover:bg-surface-muted hover:text-accent"
        >
          <Plus size={14} />
          Add ingredient
        </button>
      </div>

      <Sheet open={pickerOpen} title="Avoid ingredients" onClose={closePicker} size="md" scroll="child">
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
            aria-label="Filter ingredients to avoid"
            className={`${inputBase} shrink-0`}
            onChange={(e) => setQuery(e.target.value)}
          />

          <ul
            role="listbox"
            aria-label="Ingredients to avoid"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-border"
          >
            {canAddCustom && (
              <li role="option">
                <button
                  type="button"
                  onClick={() => commit(trimmedQuery)}
                  className="w-full border-b border-border/50 px-3 py-3 text-left text-base font-semibold text-accent transition-colors hover:bg-accent-soft active:bg-accent-soft"
                >
                  Add &ldquo;{trimmedQuery}&rdquo;
                </button>
              </li>
            )}
            {matches.length === 0 && !canAddCustom ? (
              <li className="px-3 py-4 text-center text-sm text-muted">
                {available.length === 0 ? 'All catalog ingredients are already avoided' : 'No matches'}
              </li>
            ) : (
              matches.map((name) => (
                <li key={name} role="option">
                  <button
                    type="button"
                    onClick={() => commit(name)}
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
    </>
  );
}
