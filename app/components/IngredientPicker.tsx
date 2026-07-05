import { useMemo, useState } from 'react';
import { Sheet } from './Sheet';
import { inputBase } from './ui';

export interface IngredientPickerOption {
  name: string;
  detail?: string;
}

interface IngredientPickerProps {
  current: string;
  suggestions: string[];
  options?: IngredientPickerOption[];
  onSelect: (name: string) => void;
  onCancel: () => void;
  title?: string;
  /** Shown under the title (e.g. nutrient gaps for balance adds). */
  subtitle?: string;
  /** Balance-add picker — shows helper copy and recommended ranking label. */
  boost?: boolean;
}

export function IngredientPicker({
  current,
  suggestions,
  options,
  onSelect,
  onCancel,
  title,
  subtitle,
  boost = false,
}: IngredientPickerProps) {
  const [query, setQuery] = useState('');

  const listOptions = useMemo(
    () =>
      options ??
      suggestions.map((name) => ({
        name,
      })),
    [options, suggestions],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listOptions;
    return listOptions.filter(
      (option) =>
        option.name.toLowerCase().includes(q) ||
        (option.detail?.toLowerCase().includes(q) ?? false),
    );
  }, [query, listOptions]);

  return (
    <Sheet
      open
      title={title ?? (boost ? `Replace balance add` : `Replace ${current}`)}
      onClose={onCancel}
      size="md"
      scroll="child"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {boost && (
          <div className="shrink-0 rounded-xl border border-sage/30 bg-sage/10 px-3 py-2.5 text-sm leading-snug text-foreground">
            <p className="font-semibold text-sage">Balance add</p>
            <p className="mt-1 text-muted">
              This ingredient was added to improve nutrition. Pick a recommended alternative
              below — ranked by what your recipe still needs.
            </p>
          </div>
        )}

        {subtitle && (
          <p className="shrink-0 text-sm text-muted">
            <span className="font-medium text-foreground">Helps with:</span> {subtitle}
          </p>
        )}

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

        {boost && matches.length > 0 && (
          <p className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Recommended
          </p>
        )}

        <ul
          role="listbox"
          aria-label="Ingredient options"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-border"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-muted">
              {boost
                ? 'No better alternatives found for the current nutrition gaps.'
                : 'No matches'}
            </li>
          ) : (
            matches.map((option) => (
              <li key={option.name} role="option">
                <button
                  type="button"
                  onClick={() => onSelect(option.name)}
                  className="w-full border-b border-border/50 px-3 py-3 text-left text-base text-foreground transition-colors last:border-b-0 hover:bg-surface-muted active:bg-accent-soft"
                >
                  <span className="block font-medium">{option.name}</span>
                  {option.detail && (
                    <span className="mt-0.5 block text-xs text-muted">{option.detail}</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </Sheet>
  );
}
