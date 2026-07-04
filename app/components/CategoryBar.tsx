import { CATEGORIES, type CategoryRatios } from '../utils/constants';

// Monochrome shades (dark → light) so the split reads clearly while staying on
// the black/white/zinc palette.
const SHADES: Record<(typeof CATEGORIES)[number], string> = {
  protein: 'bg-zinc-900 dark:bg-zinc-100',
  organs: 'bg-zinc-700 dark:bg-zinc-300',
  fruits: 'bg-zinc-500 dark:bg-zinc-400',
  veggies: 'bg-zinc-400 dark:bg-zinc-500',
  carbs: 'bg-zinc-300 dark:bg-zinc-600',
  fats: 'bg-zinc-200 dark:bg-zinc-700',
};

const DOT: Record<(typeof CATEGORIES)[number], string> = {
  protein: 'bg-zinc-900 dark:bg-zinc-100',
  organs: 'bg-zinc-700 dark:bg-zinc-300',
  fruits: 'bg-zinc-500 dark:bg-zinc-400',
  veggies: 'bg-zinc-400 dark:bg-zinc-500',
  carbs: 'bg-zinc-300 dark:bg-zinc-600',
  fats: 'bg-zinc-200 dark:bg-zinc-700',
};

export function CategoryBar({ ratios }: { ratios: CategoryRatios }) {
  const total = CATEGORIES.reduce((sum, c) => sum + (ratios[c] || 0), 0);
  if (total <= 0) return null;

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" role="img" aria-label="Calorie split by category">
        {CATEGORIES.map((category) => {
          const pct = ((ratios[category] || 0) / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={category}
              className={SHADES[category]}
              style={{ width: `${pct}%` }}
              title={`${category}: ${Math.round((ratios[category] || 0) * 100)}%`}
            />
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {CATEGORIES.map((category) => (
          <span key={category} className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <span className={`h-2.5 w-2.5 rounded-full ${DOT[category]}`} />
            <span className="capitalize">{category}</span>
            <span className="tabular-nums text-zinc-400">
              {Math.round((ratios[category] || 0) * 100)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
