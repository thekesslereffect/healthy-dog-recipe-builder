import { useState } from 'react';
import type { Dog } from '../utils/recipeCalculator';
import { calculateDailyCalories } from '../utils/recipeCalculator';
import { weightUnitLabel, type WeightUnit } from '../utils/format';
import {
  Button,
  CardButton,
  EmptyState,
  scrollShadowRoom,
  Segment,
  SegmentControl,
} from './ui';
import { ArrowRight, ChevronRight, PawPrint, Plus } from 'lucide-react';
import { DogCard } from './DogCard';
import { DogAvatar } from './DogAvatar';
import { Modal } from './Modal';

interface SetupScreenProps {
  dogs: Dog[];
  unit: WeightUnit;
  canContinue: boolean;
  onUnitChange: (unit: WeightUnit) => void;
  onAddDog: () => void;
  onRemoveDog: (index: number) => void;
  onUpdateDog: (
    index: number,
    field: keyof Dog,
    value: string | number | string[] | undefined,
  ) => void;
  onContinue: () => void;
}

export function SetupScreen({
  dogs,
  unit,
  canContinue,
  onUnitChange,
  onAddDog,
  onRemoveDog,
  onUpdateDog,
  onContinue,
}: SetupScreenProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editingDog = editingIndex !== null ? dogs[editingIndex] : null;
  const editingName =
    editingDog?.name?.trim() || (editingIndex !== null ? `Dog ${editingIndex + 1}` : 'Dog');
  const closeEditor = () => setEditingIndex(null);
  const addDog = () => {
    onAddDog();
    setEditingIndex(dogs.length);
  };
  return (
    <div className="flex h-full min-h-0 flex-col">
      {dogs.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 pb-2">
          <SegmentControl>
            {(['lb', 'kg'] as const).map((u) => (
              <Segment key={u} active={unit === u} onClick={() => onUnitChange(u)}>
                {weightUnitLabel(u)}
              </Segment>
            ))}
          </SegmentControl>
          <Button variant="toolbar" onClick={addDog} className="ml-auto">
            <Plus size={14} />
            <span className="hidden sm:inline">Add dog</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      )}

      <div className={`${scrollShadowRoom} min-h-0 flex-1`}>
        {dogs.length === 0 ? (
          <EmptyState
            className="h-full min-h-[12rem] py-8"
            icon={<PawPrint size={28} />}
            title="Add your first dog"
            description="Name and weight are required before we can build a balanced meal plan."
          >
            <Button onClick={addDog} className="mt-6 inline-flex items-center gap-2">
              <Plus size={16} />
              Add dog
            </Button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {dogs.map((dog, index) => {
              const name = dog.name?.trim() || `Dog ${index + 1}`;
              const cal = dog.weight > 0 ? Math.round(calculateDailyCalories(dog)) : null;
              const needsInfo = !dog.name?.trim() || dog.weight <= 0;
              return (
                <CardButton
                  key={dog.id ?? index}
                  onClick={() => setEditingIndex(index)}
                  className="flex min-w-0 items-center gap-3 text-left active:scale-[0.98]"
                >
                  <DogAvatar name={name} avatar={dog.avatar} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                    <p className={`truncate text-xs ${needsInfo ? 'text-accent' : 'text-muted'}`}>
                      {needsInfo
                        ? 'Needs name and weight'
                        : cal !== null
                          ? `${cal} cal/day`
                          : 'Needs weight'}
                    </p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-muted" />
                </CardButton>
              );
            })}
          </div>
        )}
      </div>

      {dogs.length > 0 && (
        <div className="shrink-0 border-t border-border pt-3">
          <Button
            onClick={onContinue}
            disabled={!canContinue}
            className="inline-flex w-full items-center justify-center gap-2 py-3"
          >
            Build a recipe
            <ArrowRight size={16} className="opacity-80" />
          </Button>
          {!canContinue && (
            <p className="mt-2 text-center text-xs text-muted">
              Each dog needs a name and weight to continue.
            </p>
          )}
        </div>
      )}

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
          <>
            {dogs.length <= 1 && (
              <div className="mb-4">
                <SegmentControl>
                  {(['lb', 'kg'] as const).map((u) => (
                    <Segment key={u} active={unit === u} onClick={() => onUnitChange(u)}>
                      {weightUnitLabel(u)}
                    </Segment>
                  ))}
                </SegmentControl>
              </div>
            )}
            <DogCard
              dog={editingDog}
              index={editingIndex}
              unit={unit}
              dailyCalories={calculateDailyCalories(editingDog)}
              onChange={(field, value) => onUpdateDog(editingIndex, field, value)}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
