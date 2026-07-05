import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  assessRecipeNutrition,
  nutritionBalanceScore,
  type NutrientStatus,
} from '../utils/nutrition';
import type { Dog, Recipe } from '../utils/recipeCalculator';

interface NutritionSnapshotProps {
  recipe: Recipe;
  dogsWithMER: Dog[];
  /** When set, shows a control to auto-adjust mix toward AAFCO targets. */
  onBalance?: () => void;
  balancing?: boolean;
  /** Collapsed by default; header shows score + balance control. */
  collapsible?: boolean;
  /** Omit outer card chrome when nested inside another panel. */
  embedded?: boolean;
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
    case 'zinc':
      return 'Zn';
    case 'copper':
      return 'Cu';
    case 'iodine':
      return 'I';
    case 'vitD':
      return 'D';
    case 'vitE':
      return 'E';
    case 'choline':
      return 'Chol';
    case 'epaDha':
      return 'Ω3';
    default:
      return id;
  }
}

type ScoreQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

function scoreQuality(scorePct: number, allOk: boolean): ScoreQuality {
  if (allOk || scorePct >= 100) return 'excellent';
  if (scorePct >= 90) return 'good';
  if (scorePct >= 75) return 'fair';
  if (scorePct >= 50) return 'poor';
  return 'critical';
}

function scoreBadgeClasses(quality: ScoreQuality): string {
  switch (quality) {
    case 'excellent':
      return 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800';
    case 'good':
      return 'bg-lime-100 text-lime-800 ring-lime-200 dark:bg-lime-950 dark:text-lime-300 dark:ring-lime-800';
    case 'fair':
      return 'bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800';
    case 'poor':
      return 'bg-orange-100 text-orange-900 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-800';
    case 'critical':
      return 'bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800';
  }
}

function NutritionScoreBadge({ scorePct, allOk }: { scorePct: number; allOk: boolean }) {
  const quality = scoreQuality(scorePct, allOk);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-sm font-semibold tabular-nums ring-1 ring-inset ${scoreBadgeClasses(quality)}`}
    >
      {scorePct}%
    </span>
  );
}

/**
 * AAFCO screening strip for Build / Edit.
 * Collapsible mode keeps score + Balance % visible in the daily ingredients panel.
 */
export function NutritionSnapshot({
  recipe,
  dogsWithMER,
  onBalance,
  balancing = false,
  collapsible = false,
  embedded = false,
}: NutritionSnapshotProps) {
  const [expanded, setExpanded] = useState(false);
  const assessment = assessRecipeNutrition(recipe, dogsWithMER);
  const { totals, checks, okCount } = assessment;
  const allOk = okCount === checks.length;
  const scorePct = Math.round((nutritionBalanceScore(assessment) / checks.length) * 100);
  const failing = checks.filter((check) => check.status !== 'ok');
  const shellClass = embedded
    ? ''
    : 'shrink-0 rounded-xl border border-border bg-surface px-2.5 py-2 shadow-[var(--shadow-sm)]';
  const balanceButton =
    onBalance && !allOk ? (
      <button
        type="button"
        onClick={onBalance}
        disabled={balancing}
        className="shrink-0 rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-white transition-all hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {balancing ? 'Balancing…' : 'Balance %'}
      </button>
    ) : null;
  const details = (
    <>
      <p className="mt-0.5 text-[10px] text-zinc-400">
        Balance adjusts category % and may add up to one ingredient per category marked + add.
      </p>

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

      {failing.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {failing.map((check) => (
            <li
              key={check.id}
              className="text-[10px] leading-snug text-amber-800 dark:text-amber-300"
            >
              <span className="font-medium">{check.label}</span>
              {check.status === 'high' ? ' high' : ' low'}
              {' — '}
              {check.hint}
            </li>
          ))}
        </ul>
      )}
    </>
  );
  if (collapsible && !expanded) {
    return (
      <div className={`${shellClass} ${embedded ? 'border-t border-border px-4 py-2.5' : ''}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            aria-expanded={false}
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Nutrition
            </span>
            <NutritionScoreBadge scorePct={scorePct} allOk={allOk} />
            <span className="text-[10px] tabular-nums text-zinc-400">
              {okCount}/{checks.length}
              <span className="ml-1 font-normal normal-case">· {totals.calories} kcal</span>
            </span>
          </button>
          {balanceButton}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Expand nutrition details"
            className="shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <ChevronDown size={16} />
          </button>
        </div>
        {allOk && (
          <p className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
            All targets met
          </p>
        )}
      </div>
    );
  }
  if (collapsible && expanded) {
    return (
      <div className={`${shellClass} ${embedded ? 'border-t border-border px-4 py-2.5' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            aria-expanded
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Nutrition
            </span>
            <NutritionScoreBadge scorePct={scorePct} allOk={allOk} />
            <span className="text-[10px] tabular-nums text-zinc-400">
              {okCount}/{checks.length}
              <span className="ml-1 font-normal normal-case">· {totals.calories} kcal</span>
            </span>
          </button>
          {balanceButton}
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Collapse nutrition details"
            className="shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <ChevronUp size={16} />
          </button>
        </div>
        {details}
      </div>
    );
  }
  return (
    <div className={shellClass}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
          Nutrition
          <span className="ml-1 font-normal normal-case tracking-normal tabular-nums">
            {totals.calories} kcal
          </span>
        </p>
        <div className="flex items-center gap-2">
          <NutritionScoreBadge scorePct={scorePct} allOk={allOk} />
          <span className="text-[10px] tabular-nums text-zinc-400">
            {okCount}/{checks.length}
          </span>
          {balanceButton}
        </div>
      </div>
      {details}
    </div>
  );
}
