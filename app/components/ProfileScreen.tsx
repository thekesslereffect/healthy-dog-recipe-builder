import { useState } from 'react';
import type { Dog } from '../utils/recipeCalculator';
import { calculateDailyCalories } from '../utils/recipeCalculator';
import { weightUnitLabel, type WeightUnit } from '../utils/format';
import { btnPrimary, btnSecondary, segmentBtn, segmentTrack } from './ui';
import { Plus } from 'lucide-react';
import { DogCard } from './DogCard';
import { DogAvatar } from './DogAvatar';
import { Disclaimer } from './Disclaimer';
import { Sheet } from './Sheet';
import { Modal } from './Modal';

interface ProfileScreenProps {
  dogs: Dog[];
  unit: WeightUnit;
  onUnitChange: (unit: WeightUnit) => void;
  onAddDog: () => void;
  onRemoveDog: (index: number) => void;
  onUpdateDog: (index: number, field: keyof Dog, value: string | number | string[] | undefined) => void;
}

export function ProfileScreen({
  dogs,
  unit,
  onUnitChange,
  onAddDog,
  onRemoveDog,
  onUpdateDog,
}: ProfileScreenProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  const editingDog = editingIndex !== null ? dogs[editingIndex] : null;
  const editingName =
    editingDog?.name?.trim() ||
    (editingIndex !== null ? `Dog ${editingIndex + 1}` : 'Dog');

  const closeEditor = () => setEditingIndex(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 pb-2">
        <div className={segmentTrack}>
          {(['lb', 'kg'] as const).map((u) => (
            <button
              key={u}
              type="button"
              className={segmentBtn(unit === u)}
              onClick={() => onUnitChange(u)}
            >
              {weightUnitLabel(u)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onAddDog}
          className="inline-flex items-center gap-1 rounded-xl bg-black px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="grid grid-cols-2 gap-2">
          {dogs.map((dog, index) => {
            const name = dog.name?.trim() || `Dog ${index + 1}`;
            const cal = dog.weight > 0 ? Math.round(calculateDailyCalories(dog)) : null;
            const allergyCount = dog.allergies?.length ?? 0;
            return (
              <button
                key={dog.id ?? index}
                type="button"
                onClick={() => setEditingIndex(index)}
                className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-zinc-100 bg-white px-3 py-3 text-left dark:border-zinc-800 dark:bg-zinc-900"
              >
                <DogAvatar name={name} avatar={dog.avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black dark:text-zinc-50">
                    {name}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {cal !== null ? `${cal} cal/day` : 'Needs weight'}
                    {allergyCount > 0 ? ` · ${allergyCount} avoid` : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className="mt-2 w-full rounded-2xl border border-zinc-100 bg-white px-3 py-3 text-left text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
        >
          About this tool ›
        </button>
      </div>

      <Modal
        open={editingDog !== null && editingIndex !== null}
        title={editingName}
        onClose={closeEditor}
        footer={
          <>
            {editingIndex !== null && dogs.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  onRemoveDog(editingIndex);
                  closeEditor();
                }}
                className="mr-auto text-sm font-medium text-red-600 hover:text-red-700"
              >
                Remove dog
              </button>
            )}
            <button type="button" onClick={closeEditor} className={btnSecondary}>
              Cancel
            </button>
            <button type="button" onClick={closeEditor} className={btnPrimary}>
              Done
            </button>
          </>
        }
      >
        {editingDog && editingIndex !== null && (
          <DogCard
            dog={editingDog}
            index={editingIndex}
            unit={unit}
            dailyCalories={calculateDailyCalories(editingDog)}
            onChange={(field, value) => onUpdateDog(editingIndex, field, value)}
          />
        )}
      </Modal>

      <Sheet open={aboutOpen} title="About this tool" onClose={() => setAboutOpen(false)}>
        <Disclaimer />
        <p className="mt-4 text-xs leading-relaxed text-zinc-400">
          Calories: RER = 70 × kg<sup>0.75</sup> × activity factor. Calcium: 1.25 mg/kcal (AAFCO
          2016). Food values from USDA FoodData Central.
        </p>
        <p className="mt-2 text-sm text-zinc-400">Created by — Your Husband</p>
        <button
          type="button"
          onClick={() => setAboutOpen(false)}
          className={`${btnPrimary} mt-4 w-full`}
        >
          Close
        </button>
      </Sheet>
    </div>
  );
}
