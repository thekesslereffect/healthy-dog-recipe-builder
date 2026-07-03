import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CloseIcon } from './icons';

interface IngredientPickerProps {
  current: string;
  suggestions: string[];
  onSelect: (name: string) => void;
  onCancel: () => void;
}

const MAX_SUGGESTIONS = 8;

export function IngredientPicker({
  current,
  suggestions,
  onSelect,
  onCancel,
}: IngredientPickerProps) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suggestions.slice(0, MAX_SUGGESTIONS);
    return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, MAX_SUGGESTIONS);
  }, [query, suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches[highlight]) onSelect(matches[highlight]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 ring-1 ring-zinc-300">
        <input
          ref={inputRef}
          type="text"
          value={query}
          role="combobox"
          aria-expanded={matches.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={`Replace ${current}…`}
          className="min-w-0 flex-1 bg-transparent px-1 text-sm text-black outline-none placeholder:text-zinc-400"
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(onCancel, 120)}
        />
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-black"
        >
          <CloseIcon width={13} height={13} />
        </button>
      </div>

      {matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {matches.map((name, index) => (
            <li key={name} role="option" aria-selected={index === highlight}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(name);
                }}
                onMouseEnter={() => setHighlight(index)}
                className={`block w-full px-3 py-1.5 text-left text-sm ${
                  index === highlight ? 'bg-zinc-100 text-black' : 'text-zinc-700'
                }`}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
