import {
  SUPPLEMENT_CATALOG,
  normalizeSupplementOptions,
  type SupplementOptions,
  type SupplementToggleId,
} from '../data/ingredients';

interface SupplementControlsProps {
  options: SupplementOptions;
  onChange: (options: SupplementOptions) => void;
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  disabled,
  onToggle,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-2.5 py-2 ${
        disabled
          ? 'cursor-not-allowed border-zinc-100 opacity-50 dark:border-zinc-800'
          : checked
            ? 'border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800/60'
            : 'border-zinc-100 dark:border-zinc-800'
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        className="mt-0.5 accent-black dark:accent-zinc-100"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-black dark:text-zinc-50">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

/** Enabled toggleable supplements for summary display. */
export function enabledSupplementNames(options: SupplementOptions): string[] {
  const normalized = normalizeSupplementOptions(options);
  return SUPPLEMENT_CATALOG.filter((entry) => {
    if (!entry.toggleable || !entry.id) return false;
    if (entry.requires && !normalized[entry.requires]) return false;
    return normalized[entry.id];
  }).map((entry) => entry.name);
}

export function enabledSupplementCount(options: SupplementOptions): number {
  return enabledSupplementNames(options).length;
}

/** Sheet body — toggle optional supplements before generating. */
export function SupplementControlsPanel({ options, onChange }: SupplementControlsProps) {
  const normalized = normalizeSupplementOptions(options);

  const setToggle = (id: SupplementToggleId, value: boolean) => {
    onChange(normalizeSupplementOptions({ ...normalized, [id]: value }));
  };

  const toggleable = SUPPLEMENT_CATALOG.filter((entry) => entry.toggleable);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Toggle supplements before you generate. Eggshell is dosed automatically for any remaining
        calcium need.
      </p>
      <div className="space-y-1.5">
        {toggleable.map((entry) => {
          const id = entry.id;
          const disabled = entry.requires != null && !normalized[entry.requires];
          const checked = normalized[id];
          return (
            <ToggleRow
              key={entry.id}
              id={`supplement-${entry.id}`}
              label={entry.name}
              description={entry.description}
              checked={checked}
              disabled={disabled}
              onToggle={() => setToggle(id, !checked)}
            />
          );
        })}
      </div>
    </div>
  );
}
