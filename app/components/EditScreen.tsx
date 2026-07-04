import type { Category, CategoryRatios } from '../utils/constants';
import type { Recipe } from '../utils/recipeCalculator';
import { DailyRecipePanel } from './DailyRecipePanel';
import { btnPrimary, btnSecondary, inputBase } from './ui';

interface EditScreenProps {
  planName: string;
  editRecipe: Recipe;
  ratios: CategoryRatios;
  allergyList: string[];
  locked: Partial<Record<Category, string[]>>;
  onToggleLock: (category: Category, name: string) => void;
  onSwap: (category: Category, oldName: string, newName: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

/** Edit an existing plan — swap ingredients, then Save. No reroll. */
export function EditScreen({
  planName,
  editRecipe,
  ratios,
  allergyList,
  locked,
  onToggleLock,
  onSwap,
  onSave,
  onCancel,
}: EditScreenProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="min-h-0 flex-1 overflow-hidden">
        <DailyRecipePanel
          recipe={editRecipe}
          ratios={ratios}
          locked={locked}
          excluded={allergyList}
          onToggleLock={onToggleLock}
          onSwap={onSwap}
          compact
        />
      </div>

      <div className="shrink-0 space-y-2 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
        <input
          type="text"
          value={planName}
          disabled
          aria-label="Plan name"
          className={`${inputBase} disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-600 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400`}
        />
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className={`${btnSecondary} flex-1`}>
            Cancel
          </button>
          <button type="button" onClick={onSave} className={`${btnPrimary} flex-[1.4]`}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
