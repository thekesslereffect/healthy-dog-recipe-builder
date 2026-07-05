import type { Category, CategoryRatios } from '../utils/constants';
import type { Dog, Recipe } from '../utils/recipeCalculator';
import { DailyRecipePanel } from './DailyRecipePanel';
import { Button, ButtonRow, Input } from './ui';

interface EditScreenProps {
  planName: string;
  onPlanNameChange: (name: string) => void;
  editRecipe: Recipe;
  dogsWithMER: Dog[];
  ratios: CategoryRatios;
  allergyList: string[];
  locked: Partial<Record<Category, string[]>>;
  onToggleLock: (category: Category, name: string) => void;
  onSwap: (category: Category, oldName: string, newName: string) => void;
  onRemoveBoost?: (category: Category, name: string) => void;
  onSwapBoost?: (category: Category, oldName: string, newName: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onBalance?: () => void;
}

export function EditScreen({
  planName,
  onPlanNameChange,
  editRecipe,
  dogsWithMER,
  ratios,
  allergyList,
  locked,
  onToggleLock,
  onSwap,
  onRemoveBoost,
  onSwapBoost,
  onSave,
  onCancel,
  onBalance,
}: EditScreenProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="min-h-0 flex-1 px-0.5">
        <DailyRecipePanel
          recipe={editRecipe}
          ratios={ratios}
          locked={locked}
          excluded={allergyList}
          onToggleLock={onToggleLock}
          onSwap={onSwap}
          onRemoveBoost={onRemoveBoost}
          onSwapBoost={onSwapBoost}
          dogsWithMER={dogsWithMER}
          onBalance={onBalance}
          compact
        />
      </div>

      <div className="shrink-0 space-y-2.5 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-md)]">
        <Input
          type="text"
          value={planName}
          onChange={(e) => onPlanNameChange(e.target.value)}
          placeholder="Name your plan…"
          aria-label="Plan name"
        />
        <ButtonRow>
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onSave} className="flex-[1.4]">
            Save changes
          </Button>
        </ButtonRow>
      </div>
    </div>
  );
}
