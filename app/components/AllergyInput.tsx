import { useId, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface AllergyInputProps {
  value: string[];
  suggestions: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}

const MAX_SUGGESTIONS = 6;

export function AllergyInput({ value, suggestions, onAdd, onRemove }: AllergyInputProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listId = useId();
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const available = suggestions.filter((s) => !value.includes(s));
    if (!q) return available.slice(0, MAX_SUGGESTIONS);
    return available
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, MAX_SUGGESTIONS);
  }, [query, suggestions, value]);

  const commit = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || value.includes(trimmed)) {
      setQuery('');
      return;
    }
    onAdd(trimmed);
    setQuery('');
    setHighlight(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commit(matches[highlight] ?? query);
    } else if (e.key === 'Backspace' && query === '' && value.length > 0) {
      onRemove(value[value.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-zinc-50 px-2 py-2 focus-within:bg-white focus-within:ring-1 focus-within:ring-zinc-300 dark:bg-zinc-800 dark:focus-within:bg-zinc-900 dark:focus-within:ring-zinc-600">
        {value.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 rounded-md bg-zinc-200 py-0.5 pl-2 pr-1 text-xs font-medium text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100"
          >
            {name}
            <button
              type="button"
              onClick={() => onRemove(name)}
              aria-label={`Remove ${name}`}
              className="inline-flex h-4 w-4 items-center justify-center rounded text-zinc-500 hover:bg-zinc-300 hover:text-black dark:hover:bg-zinc-600 dark:hover:text-zinc-50"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={value.length ? 'Add another…' : 'Type an ingredient…'}
          className="min-w-[7rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-black outline-none placeholder:text-zinc-400 dark:text-zinc-50"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          onMouseDown={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
          }}
        >
          {matches.map((name, index) => (
            <li key={name} role="option" aria-selected={index === highlight}>
              <button
                type="button"
                onClick={() => commit(name)}
                onMouseEnter={() => setHighlight(index)}
                className={`block w-full px-3 py-1.5 text-left text-sm ${
                  index === highlight
                    ? 'bg-zinc-100 text-black dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-700 dark:text-zinc-300'
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
