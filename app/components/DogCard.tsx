import { useRef } from 'react';
import { ACTIVITY_LEVELS } from '../utils/constants';
import { getAllFoodNames } from '../data/ingredients';
import type { Dog } from '../utils/recipeCalculator';
import { readAvatarFile } from '../utils/avatar';
import {
  fromDisplayWeight,
  toDisplayWeight,
  weightUnitLabel,
  type WeightUnit,
} from '../utils/format';
import { Field, Input, ReadonlyField, Select } from './ui';
import { AllergyInput } from './AllergyInput';
import { DogAvatar } from './DogAvatar';

interface DogCardProps {
  dog: Dog;
  index: number;
  unit: WeightUnit;
  dailyCalories: number;
  onChange: (field: keyof Dog, value: string | number | string[] | undefined) => void;
}

export function DogCard({ dog, index, unit, dailyCalories, onChange }: DogCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const displayWeight = dog.weight > 0 ? toDisplayWeight(dog.weight, unit) : '';
  const allergies = dog.allergies ?? [];
  const displayName = dog.name?.trim() ? dog.name : `Dog ${index + 1}`;
  const addAllergy = (name: string) => {
    if (allergies.includes(name)) return;
    onChange('allergies', [...allergies, name]);
  };
  const removeAllergy = (name: string) => {
    onChange(
      'allergies',
      allergies.filter((a) => a !== name),
    );
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
    <div className="space-y-3.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative shrink-0"
          aria-label={`Change photo for ${displayName}`}
          title="Add or change photo"
        >
          <DogAvatar name={displayName} avatar={dog.avatar} size="lg" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-[10px] font-medium uppercase tracking-wide text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
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
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          <p className="text-xs text-muted">
            {dog.weight > 0 ? `${Math.round(dailyCalories)} cal/day` : 'Add weight for calories'}
          </p>
          {dog.avatar ? (
            <button
              type="button"
              onClick={() => onChange('avatar', undefined)}
              className="mt-1 text-xs font-semibold text-muted hover:text-accent"
            >
              Remove photo
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1 text-xs font-semibold text-muted hover:text-accent"
            >
              Add photo
            </button>
          )}
        </div>
      </div>

      <Field label="Name" htmlFor={`dog-name-${index}`}>
        <Input
          id={`dog-name-${index}`}
          type="text"
          value={dog.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Dog name"
        />
      </Field>

      <Field label={`Weight (${weightUnitLabel(unit)})`} htmlFor={`dog-weight-${index}`}>
        <Input
          id={`dog-weight-${index}`}
          type="number"
          inputMode="decimal"
          min="0"
          value={displayWeight}
          onChange={(e) => {
            const entered = parseFloat(e.target.value);
            onChange('weight', Number.isFinite(entered) ? fromDisplayWeight(entered, unit) : 0);
          }}
          placeholder={unit === 'kg' ? '16' : '35'}
        />
      </Field>

      <ReadonlyField
        label="Daily calories"
        value={dog.weight > 0 ? `${Math.round(dailyCalories)} cal` : '—'}
      />

      <Field label="Activity Level" htmlFor={`dog-activity-${index}`}>
        <Select
          id={`dog-activity-${index}`}
          value={dog.activityMultiplier}
          onChange={(e) => onChange('activityMultiplier', parseFloat(e.target.value))}
        >
          {ACTIVITY_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Allergies / avoid"
        hint="Excluded from recipes for the whole pack."
      >
        <AllergyInput
          value={allergies}
          suggestions={getAllFoodNames()}
          onAdd={addAllergy}
          onRemove={removeAllergy}
        />
      </Field>
    </div>
  );
}
