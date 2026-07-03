import { ACTIVITY_LEVELS } from '../utils/constants';
import type { Dog } from '../utils/recipeCalculator';
import {
  fromDisplayWeight,
  toDisplayWeight,
  weightUnitLabel,
  type WeightUnit,
} from '../utils/format';
import { fieldLabel, inputBase } from './ui';

interface DogCardProps {
  dog: Dog;
  index: number;
  unit: WeightUnit;
  dailyCalories: number;
  canRemove: boolean;
  onChange: (field: keyof Dog, value: string | number) => void;
  onRemove: () => void;
}

export function DogCard({
  dog,
  index,
  unit,
  dailyCalories,
  canRemove,
  onChange,
  onRemove,
}: DogCardProps) {
  const displayWeight = dog.weight > 0 ? toDisplayWeight(dog.weight, unit) : '';

  return (
    <div className="rounded-xl border border-zinc-200 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-black">
          {dog.name?.trim() ? dog.name : `Dog ${index + 1}`}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-black"
          >
            Remove
          </button>
        )}
      </div>

      <div className="space-y-3.5">
        <div>
          <label className={fieldLabel} htmlFor={`dog-name-${index}`}>
            Name
          </label>
          <input
            id={`dog-name-${index}`}
            type="text"
            value={dog.name}
            onChange={(e) => onChange('name', e.target.value)}
            className={inputBase}
            placeholder="Dog name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={fieldLabel} htmlFor={`dog-weight-${index}`}>
              Weight ({weightUnitLabel(unit)})
            </label>
            <input
              id={`dog-weight-${index}`}
              type="number"
              inputMode="decimal"
              min="0"
              value={displayWeight}
              onChange={(e) => {
                const entered = parseFloat(e.target.value);
                onChange('weight', Number.isFinite(entered) ? fromDisplayWeight(entered, unit) : 0);
              }}
              className={inputBase}
              placeholder={unit === 'kg' ? '16' : '35'}
            />
          </div>
          <div>
            <span className={fieldLabel}>Daily calories</span>
            <div className="w-full rounded-lg bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-500">
              {dog.weight > 0 ? `${Math.round(dailyCalories)} cal` : '—'}
            </div>
          </div>
        </div>

        <div>
          <label className={fieldLabel} htmlFor={`dog-activity-${index}`}>
            Activity Level
          </label>
          <select
            id={`dog-activity-${index}`}
            value={dog.activityMultiplier}
            onChange={(e) => onChange('activityMultiplier', parseFloat(e.target.value))}
            className={inputBase}
          >
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
