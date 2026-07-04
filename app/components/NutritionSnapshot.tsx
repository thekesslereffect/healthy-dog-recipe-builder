import { assessRecipeNutrition, type NutrientStatus } from '../utils/nutrition';
import type { Dog, Recipe } from '../utils/recipeCalculator';

interface NutritionSnapshotProps {
  recipe: Recipe;
  dogsWithMER: Dog[];
}

function statusTone(status: NutrientStatus): string {
  switch (status) {
    case 'ok':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900';
    case 'low':
      return 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900';
    case 'high':
      return 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-900';
  }
}

function shortLabel(id: string): string {
  switch (id) {
    case 'protein':
      return 'Pro';
    case 'fat':
      return 'Fat';
    case 'calcium':
      return 'Ca';
    case 'phosphorus':
      return 'P';
    case 'cap':
      return 'Ca:P';
    default:
      return id;
  }
}

/**
 * Compact AAFCO screening strip for Build / Edit.
 * Shows actual / recommended without dominating the screen.
 */
export function NutritionSnapshot({ recipe, dogsWithMER }: NutritionSnapshotProps) {
  const { totals, checks, okCount } = assessRecipeNutrition(recipe, dogsWithMER);
  const allOk = okCount === checks.length;
  const issueHints = checks.filter((c) => c.status !== 'ok').map((c) => c.hint);

  return (
    <div className="shrink-0 rounded-xl border border-zinc-100 bg-white px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
          Nutrition
          <span className="ml-1 font-normal normal-case tracking-normal tabular-nums">
            {totals.calories} kcal
          </span>
        </p>
        <span
          className={`text-[10px] font-medium tabular-nums ${
            allOk
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-amber-700 dark:text-amber-400'
          }`}
        >
          {okCount}/{checks.length}
        </span>
      </div>

      <div className="mt-1.5 flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {checks.map((check) => {
          const recommended = check.targetLabel.replace(/^≥\s*/, '');
          return (
            <span
              key={check.id}
              title={`${check.label}: ${check.amountLabel} / ${recommended} — ${check.hint}`}
              className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] font-medium ring-1 ring-inset ${statusTone(check.status)}`}
            >
              <span className="opacity-70">{shortLabel(check.id)}</span>
              <span className="tabular-nums">
                {check.amountLabel}
                <span className="opacity-50">/</span>
                {recommended}
              </span>
            </span>
          );
        })}
      </div>

      {issueHints.length > 0 && (
        <p className="mt-1 truncate text-[10px] text-amber-700 dark:text-amber-400">
          {issueHints[0]}
          {issueHints.length > 1 ? ` · +${issueHints.length - 1} more` : ''}
        </p>
      )}
    </div>
  );
}
