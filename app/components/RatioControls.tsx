import {
  CATEGORIES,
  RECOMMENDED_RANGES,
  type Category,
  type CategoryRatios,
} from '../utils/constants';
import { CategoryBar } from './CategoryBar';
import { card, sectionTitle } from './ui';

interface RatioControlsProps {
  ratios: CategoryRatios;
  onChange: (category: Category, value: number) => void;
  onApplyRecommended: () => void;
}

export function RatioControls({ ratios, onChange, onApplyRecommended }: RatioControlsProps) {
  const sum = CATEGORIES.reduce((total, c) => total + ratios[c], 0);
  const isValid = Math.abs(sum - 1) < 0.001;

  return (
    <section className={card}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className={sectionTitle}>Ingredient Ratios</h2>
        <span
          aria-live="polite"
          className={`text-sm font-semibold tabular-nums ${isValid ? 'text-zinc-400' : 'text-black'}`}
        >
          {Math.round(sum * 100)}%
        </span>
      </div>

      <div className="mb-5">
        <CategoryBar ratios={ratios} />
      </div>

      <div className="space-y-4">
        {CATEGORIES.map((category) => {
          const value = ratios[category];
          const pct = Math.round(value * 100);
          return (
            <div key={category}>
              <label className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium capitalize text-zinc-700">{category}</span>
                <span className="flex items-baseline gap-2">
                  <span className="text-[11px] text-zinc-400">
                    rec {RECOMMENDED_RANGES[category]}
                  </span>
                  <span className="w-9 text-right font-medium tabular-nums text-black">{pct}%</span>
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.025"
                value={value}
                aria-label={`${category} ratio`}
                aria-valuetext={`${pct} percent`}
                onChange={(e) => onChange(category, parseFloat(e.target.value))}
                className="w-full accent-black"
              />
            </div>
          );
        })}
      </div>

      {!isValid && (
        <p className="mt-4 text-sm text-zinc-500">
          Ratios must add up to 100% to generate a recipe.
        </p>
      )}

      <div className="mt-5 rounded-xl bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-500">
        <p className="text-sm font-semibold text-black">Recommended baseline</p>
        <p className="mt-1.5">
          For a balanced adult diet, muscle meat should be the majority (~70%),
          with a small amount of nutrient-dense organs (~5–10%, mostly liver),
          some vegetables (~5–10%), a little fruit, and carbs &amp; fats for
          extra energy. Working or very active dogs can take more carbs; less
          active dogs need fewer.
        </p>
        <p className="mt-2">
          Popular raw-feeding guides (e.g. BARF: ~70% meat, 10% bone, 10% organ,
          10% veg/fruit) are measured by <em>weight</em>. This tool splits by{' '}
          <em>calories</em>, so the exact numbers differ — treat these as a
          starting point and confirm a long-term diet with your vet.
        </p>
        <button
          type="button"
          onClick={onApplyRecommended}
          className="mt-3 rounded-lg bg-zinc-200 px-3.5 py-2 text-xs font-medium text-black transition-colors hover:bg-zinc-300"
        >
          Apply recommended baseline
        </button>
      </div>
    </section>
  );
}
