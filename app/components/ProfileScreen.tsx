import { useState } from 'react';
import type { Dog } from '../utils/recipeCalculator';
import { calculateDailyCalories } from '../utils/recipeCalculator';
import { weightUnitLabel, type WeightUnit } from '../utils/format';
import {
  Button,
  CardButton,
  scrollShadowRoom,
  Select,
} from './ui';
import { ChevronRight, Plus } from 'lucide-react';
import { DogCard } from './DogCard';
import { DogAvatar } from './DogAvatar';
import { Disclaimer } from './Disclaimer';
import { Modal } from './Modal';

interface ProfileScreenProps {
  dogs: Dog[];
  unit: WeightUnit;
  onUnitChange: (unit: WeightUnit) => void;
  onAddDog: () => void;
  onRemoveDog: (index: number) => void;
  onUpdateDog: (
    index: number,
    field: keyof Dog,
    value: string | number | string[] | undefined,
  ) => void;
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
  const editingDog = editingIndex !== null ? dogs[editingIndex] : null;
  const editingName =
    editingDog?.name?.trim() || (editingIndex !== null ? `Dog ${editingIndex + 1}` : 'Dog');
  const closeEditor = () => setEditingIndex(null);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center pb-2">
        <div className="ml-auto flex items-center gap-1.5">
          <Select
            variant="toolbar"
            value={unit}
            onChange={(e) => onUnitChange(e.target.value as WeightUnit)}
            aria-label="Weight unit"
          >
            {(['lb', 'kg'] as const).map((u) => (
              <option key={u} value={u}>
                {weightUnitLabel(u)}
              </option>
            ))}
          </Select>
          <Button variant="toolbar" onClick={onAddDog}>
            <Plus size={14} />
            <span className="hidden sm:inline">Add dog</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className={`${scrollShadowRoom} min-h-0 flex-1`}>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {dogs.map((dog, index) => {
            const name = dog.name?.trim() || `Dog ${index + 1}`;
            const cal = dog.weight > 0 ? Math.round(calculateDailyCalories(dog)) : null;
            const allergyCount = dog.allergies?.length ?? 0;
            return (
              <CardButton
                key={dog.id ?? index}
                onClick={() => setEditingIndex(index)}
                className="flex min-w-0 items-center gap-3 text-left active:scale-[0.98]"
              >
                <DogAvatar name={name} avatar={dog.avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                  <p className="truncate text-xs text-muted">
                    {cal !== null ? `${cal} cal/day` : 'Needs weight'}
                    {allergyCount > 0 ? ` · ${allergyCount} avoid` : ''}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </CardButton>
            );
          })}
        </div>
      </div>

      <footer className="shrink-0 border-t border-border px-1 pt-4 pb-1">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
          About this tool
        </p>
        <Disclaimer />
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Calories: RER = 70 × kg<sup>0.75</sup> × activity factor. Calcium: 1.25 mg/kcal (AAFCO
          2016). Food values from USDA FoodData Central.
        </p>
      </footer>

      <Modal
        open={editingDog !== null && editingIndex !== null}
        title={editingName}
        onClose={closeEditor}
        footer={
          <>
            {editingIndex !== null && (
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
            <Button variant="secondary" onClick={closeEditor}>
              Cancel
            </Button>
            <Button onClick={closeEditor}>Done</Button>
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
    </div>
  );
}
