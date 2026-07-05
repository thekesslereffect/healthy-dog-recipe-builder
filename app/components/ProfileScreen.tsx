import { useState } from 'react';
import type { Dog } from '../utils/recipeCalculator';
import { calculateDailyCalories } from '../utils/recipeCalculator';
import { weightUnitLabel, type WeightUnit } from '../utils/format';
import { btnPrimary, btnSecondary, cardElevated, scrollShadowRoom, segmentBtn, segmentTrack, toolbarEditBtn } from './ui';
import { ChevronRight, Plus } from 'lucide-react';
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
  const totalCalories = dogs.reduce(
    (sum, d) => sum + (d.weight > 0 ? calculateDailyCalories(d) : 0),
    0,
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 pb-2">
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
        {dogs.length > 0 && totalCalories > 0 && (
          <span className="inline-flex h-9 items-center rounded-xl bg-sage-soft px-2.5 text-xs font-semibold tabular-nums text-sage">
            {Math.round(totalCalories)} cal/day
          </span>
        )}
        <button
          type="button"
          onClick={onAddDog}
          className={`${toolbarEditBtn} ml-auto`}
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Add dog</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className={`${scrollShadowRoom} min-h-0 flex-1`}>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {dogs.map((dog, index) => {
            const name = dog.name?.trim() || `Dog ${index + 1}`;
            const cal = dog.weight > 0 ? Math.round(calculateDailyCalories(dog)) : null;
            const allergyCount = dog.allergies?.length ?? 0;
            return (
              <button
                key={dog.id ?? index}
                type="button"
                onClick={() => setEditingIndex(index)}
                className={`${cardElevated} flex min-w-0 items-center gap-3 text-left active:scale-[0.98]`}
              >
                <DogAvatar name={name} avatar={dog.avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {name}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {cal !== null ? `${cal} cal/day` : 'Needs weight'}
                    {allergyCount > 0 ? ` · ${allergyCount} avoid` : ''}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className={`${cardElevated} mt-3 flex w-full items-center justify-between px-4 py-3.5 text-left text-sm text-muted`}
        >
          <span>About this tool</span>
          <ChevronRight size={16} />
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
                className="mr-auto text-sm font-semibold text-red-500 hover:text-red-600"
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

      <Sheet open={aboutOpen} title="About this tool" onClose={() => setAboutOpen(false)} size="md">
        <Disclaimer />
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Calories: RER = 70 × kg<sup>0.75</sup> × activity factor. Calcium: 1.25 mg/kcal (AAFCO
          2016). Food values from USDA FoodData Central.
        </p>
        <p className="mt-2 text-sm text-muted">Created by — Your Husband</p>
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
