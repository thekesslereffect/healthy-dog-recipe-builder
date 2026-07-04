import { useRef } from 'react';
import { ACTIVITY_LEVELS } from '../utils/constants';
import { ALL_FOOD_NAMES } from '../data/ingredients';
import type { Dog } from '../utils/recipeCalculator';
import { readAvatarFile } from '../utils/avatar';
import {
  fromDisplayWeight,
  toDisplayWeight,
  weightUnitLabel,
  type WeightUnit,
} from '../utils/format';
import { fieldLabel, inputBase } from './ui';
import { AllergyInput } from './AllergyInput';
import { DogAvatar } from './DogAvatar';

interface DogCardProps {
  dog: Dog;
  index: number;
  unit: WeightUnit;
  dailyCalories: number;
  canRemove: boolean;
  onChange: (field: keyof Dog, value: string | number | string[] | undefined) => void;
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
  const fileRef = useRef<HTMLInputElement>(null);
  const displayWeight = dog.weight > 0 ? toDisplayWeight(dog.weight, unit) : '';
  const allergies = dog.allergies ?? [];
  const displayName = dog.name?.trim() ? dog.name : `Dog ${index + 1}`;

  const addAllergy = (name: string) => {
    if (allergies.includes(name)) return;
    onChange('allergies', [...allergies, name]);
  };
  const removeAllergy = (name: string) => {
    onChange('allergies', allergies.filter((a) => a !== name));
  };

  const onPickPhoto = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await readAvatarFile(file);
      onChange('avatar', dataUrl);
    } catch {
      // Ignore unreadable images.
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative shrink-0"
            aria-label={`Change photo for ${displayName}`}
            title="Add or change photo"
          >
            <DogAvatar name={displayName} avatar={dog.avatar} size="lg" />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-[10px] font-semibold uppercase tracking-wide text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              Edit
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void onPickPhoto(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-black">{displayName}</p>
            <p className="text-xs text-zinc-500">
              {dog.weight > 0 ? `${Math.round(dailyCalories)} cal/day` : 'Add weight for calories'}
            </p>
            {dog.avatar && (
              <button
                type="button"
                onClick={() => onChange('avatar', undefined)}
                className="mt-1 text-xs font-medium text-zinc-400 hover:text-black"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
        {canRemove && (
          <button
            onClick={onRemove}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-black"
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
            <div className="w-full rounded-xl bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-500">
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

        <div>
          <span className={fieldLabel}>Allergies / avoid</span>
          <AllergyInput
            value={allergies}
            suggestions={ALL_FOOD_NAMES}
            onAdd={addAllergy}
            onRemove={removeAllergy}
          />
          <p className="mt-1.5 text-xs text-zinc-400">Excluded from recipes for the whole pack.</p>
        </div>
      </div>
    </div>
  );
}
