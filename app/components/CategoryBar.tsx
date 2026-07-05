import { CATEGORIES, type CategoryRatios } from '../utils/constants';

const SHADES: Record<(typeof CATEGORIES)[number], string> = {
  protein: 'bg-[#c45c3e]',
  organs: 'bg-[#a84d34]',
  fruits: 'bg-[#e8a87c]',
  veggies: 'bg-[#5a8f7b]',
  carbs: 'bg-[#d4a574]',
  fats: 'bg-[#8b7355]',
};

const DOT: Record<(typeof CATEGORIES)[number], string> = SHADES;

export function CategoryBar({ ratios }: { ratios: CategoryRatios }) {
  const total = CATEGORIES.reduce((sum, c) => sum + (ratios[c] || 0), 0);
  if (total <= 0) return null;

  return (
    <div>
      <div
        className="flex h-3.5 w-full overflow-hidden rounded-full bg-surface-muted shadow-inner"
        role="img"
        aria-label="Calorie split by category"
      >
        {CATEGORIES.map((category) => {
          const pct = ((ratios[category] || 0) / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={category}
              className={`${SHADES[category]} transition-all duration-300`}
              style={{ width: `${pct}%` }}
              title={`${category}: ${Math.round((ratios[category] || 0) * 100)}%`}
            />
          );
        })}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
        {CATEGORIES.map((category) => (
          <span
            key={category}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted"
          >
            <span className={`h-2 w-2 rounded-full ${DOT[category]}`} />
            <span className="capitalize">{category}</span>
            <span className="tabular-nums text-muted/70">
              {Math.round((ratios[category] || 0) * 100)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
