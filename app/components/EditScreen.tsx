import type { Category, CategoryRatios } from '../utils/constants';
import type { Dog, Recipe } from '../utils/recipeCalculator';
import { DailyRecipePanel } from './DailyRecipePanel';
import { btnPrimary, btnSecondary, inputBase } from './ui';

interface EditScreenProps {
  planName: string;
  editRecipe: Recipe;
  dogsWithMER: Dog[];
  ratios: CategoryRatios;
  allergyList: string[];
  locked: Partial<Record<Category, string[]>>;
  onToggleLock: (category: Category, name: string) => void;
  onSwap: (category: Category, oldName: string, newName: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onBalance?: () => void;
}

export function EditScreen({
  planName,
  editRecipe,
  dogsWithMER,
  ratios,
  allergyList,
  locked,
  onToggleLock,
  onSwap,
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
          dogsWithMER={dogsWithMER}
          onBalance={onBalance}
          compact
        />
      </div>

      <div className="shrink-0 space-y-2.5 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-md)]">
        <input
          type="text"
          value={planName}
          disabled
          aria-label="Plan name"
          className={`${inputBase} disabled:cursor-not-allowed disabled:opacity-60`}
        />
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className={`${btnSecondary} flex-1`}>
            Cancel
          </button>
          <button type="button" onClick={onSave} className={`${btnPrimary} flex-[1.4]`}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
