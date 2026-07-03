import { CATEGORIES, type Category, type CategoryCounts } from '../utils/constants';
import { card, sectionTitle } from './ui';

interface CountControlsProps {
  counts: CategoryCounts;
  onChange: (category: Category, value: number) => void;
}

export function CountControls({ counts, onChange }: CountControlsProps) {
  return (
    <section className={card}>
      <h2 className={sectionTitle}>Ingredients per Category</h2>
      <p className="mt-1 mb-4 text-sm text-zinc-500">
        How many items to pick from each group.
      </p>
      <div className="space-y-4">
        {CATEGORIES.map((category) => {
          const value = counts[category];
          return (
            <div key={category}>
              <label className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium capitalize text-zinc-700">{category}</span>
                <span className="tabular-nums text-zinc-500">
                  {value} item{value !== 1 ? 's' : ''}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={value}
                aria-label={`${category} item count`}
                aria-valuetext={`${value} items`}
                onChange={(e) => onChange(category, parseInt(e.target.value))}
                className="w-full accent-black"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
