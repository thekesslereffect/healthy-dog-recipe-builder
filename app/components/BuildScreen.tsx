import { useState } from 'react';
import {
  CATEGORIES,
  RECOMMENDED_RANGES,
  type Category,
  type CategoryCounts,
  type CategoryRatios,
} from '../utils/constants';
import type { Dog, Recipe, SupplementOptions } from '../utils/recipeCalculator';
import { CategoryBar } from './CategoryBar';
import { DailyRecipePanel } from './DailyRecipePanel';
import { NutritionSnapshot } from './NutritionSnapshot';
import { SupplementControlsPanel, enabledSupplementCount, enabledSupplementNames } from './SupplementControls';
import { Sheet } from './Sheet';
import { btnPrimary, btnSecondary, inputBase } from './ui';
import { Shuffle } from 'lucide-react';

interface BuildScreenProps {
  ratios: CategoryRatios;
  counts: CategoryCounts;
  draftRecipe: Recipe | null;
  dogsWithMER: Dog[];
  hasActivePlan: boolean;
  allergyList: string[];
  canGenerate: boolean;
  isPercentageValid: boolean;
  hasInvalidDog: boolean;
  draftName: string;
  locked: Partial<Record<Category, string[]>>;
  supplementOptions: SupplementOptions;
  onSupplementOptionsChange: (options: SupplementOptions) => void;
  onRatioChange: (category: Category, value: number) => void;
  onCountChange: (category: Category, value: number) => void;
  onApplyRecommended: () => void;
  onGenerate: () => void;
  onConfirm: () => void;
  onDraftNameChange: (name: string) => void;
  onToggleLock: (category: Category, name: string) => void;
  onSwap: (category: Category, oldName: string, newName: string) => void;
  onBalance?: () => void;
}

/** Create-only flow: generate, reroll, name, then use as the active plan. */
export function BuildScreen({
  ratios,
  counts,
  draftRecipe,
  dogsWithMER,
  hasActivePlan,
  allergyList,
  canGenerate,
  isPercentageValid,
  hasInvalidDog,
  draftName,
  locked,
  supplementOptions,
  onSupplementOptionsChange,
  onRatioChange,
  onCountChange,
  onApplyRecommended,
  onGenerate,
  onConfirm,
  onDraftNameChange,
  onToggleLock,
  onSwap,
  onBalance,
}: BuildScreenProps) {
  const [mixOpen, setMixOpen] = useState(false);
  const [supplementsOpen, setSupplementsOpen] = useState(false);
  const sum = CATEGORIES.reduce((total, c) => total + ratios[c], 0);
  const enabledSupplements = enabledSupplementNames(supplementOptions);
  const supplementCount = enabledSupplementCount(supplementOptions);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="grid shrink-0 grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMixOpen(true)}
          className="flex min-w-0 flex-col rounded-2xl border border-zinc-100 bg-white p-3 text-left dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-2 flex items-center justify-between gap-1">
            <span className="text-sm font-medium text-black dark:text-zinc-50">Ingredient mix</span>
            <span
              className={`shrink-0 text-[10px] font-medium tabular-nums sm:text-xs ${
                Math.abs(sum - 1) < 0.001 ? 'text-zinc-400' : 'text-black dark:text-zinc-50'
              }`}
            >
              {Math.round(sum * 100)}% · Edit
            </span>
          </div>
          <CategoryBar ratios={ratios} />
        </button>

        <button
          type="button"
          onClick={() => setSupplementsOpen(true)}
          className="flex min-w-0 flex-col rounded-2xl border border-zinc-100 bg-white p-3 text-left dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-2 flex items-center justify-between gap-1">
            <span className="text-sm font-medium text-black dark:text-zinc-50">Supplements</span>
            <span className="shrink-0 text-[10px] font-medium tabular-nums text-zinc-400 sm:text-xs">
              {supplementCount} on · Edit
            </span>
          </div>
          <p className="line-clamp-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 sm:text-xs">
            {enabledSupplements.length > 0
              ? enabledSupplements.join(', ')
              : 'None selected'}
          </p>
        </button>
      </div>

      {!draftRecipe ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white px-4 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">
            {hasActivePlan
              ? 'Your Plan is live. Generate a new draft here — it won’t replace Plan until you use it.'
              : 'Generate a draft, then reroll until you like the ingredients.'}
          </p>
          {allergyList.length > 0 && (
            <p className="mt-2 text-xs text-zinc-400">Avoiding: {allergyList.join(', ')}</p>
          )}
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className={`${btnPrimary} mt-4 inline-flex items-center gap-2`}
          >
            <Shuffle size={16} />
            Generate draft
          </button>
          {!canGenerate && (
            <p className="mt-2 text-xs text-zinc-400">
              {!isPercentageValid
                ? 'Mix must total 100%.'
                : hasInvalidDog
                  ? 'Set up dogs in Profile.'
                  : ''}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-hidden">
            <DailyRecipePanel
              recipe={draftRecipe}
              ratios={ratios}
              locked={locked}
              excluded={allergyList}
              onToggleLock={onToggleLock}
              onSwap={onSwap}
              compact
            />
          </div>

          <NutritionSnapshot
            recipe={draftRecipe}
            dogsWithMER={dogsWithMER}
            onBalance={onBalance}
          />

          <div className="shrink-0 space-y-2 rounded-2xl border border-zinc-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <input
              type="text"
              value={draftName}
              onChange={(e) => onDraftNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirm();
              }}
              placeholder="Name this plan…"
              aria-label="Plan name"
              className={inputBase}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onGenerate}
                disabled={!canGenerate}
                className={`${btnSecondary} inline-flex flex-1 items-center justify-center gap-1.5`}
              >
                <Shuffle size={15} />
                Reroll
              </button>
              <button type="button" onClick={onConfirm} className={`${btnPrimary} flex-[1.4]`}>
                Use this plan
              </button>
            </div>
          </div>
        </>
      )}

      <Sheet open={mixOpen} title="Ingredient mix" onClose={() => setMixOpen(false)}>
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Ratios</span>
              <span className="text-sm font-medium tabular-nums text-black dark:text-zinc-50">
                {Math.round(sum * 100)}%
              </span>
            </div>
            <CategoryBar ratios={ratios} />
            <div className="mt-4 space-y-3">
              {CATEGORIES.map((category) => {
                const value = ratios[category];
                const pct = Math.round(value * 100);
                return (
                  <div key={category}>
                    <label className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium capitalize text-zinc-700 dark:text-zinc-200">
                        {category}
                      </span>
                      <span className="tabular-nums text-zinc-500">
                        <span className="mr-2 text-[11px] text-zinc-400">
                          rec {RECOMMENDED_RANGES[category]}
                        </span>
                        {pct}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.025"
                      value={value}
                      aria-label={`${category} ratio`}
                      onChange={(e) => onRatioChange(category, parseFloat(e.target.value))}
                      className="w-full accent-black dark:accent-zinc-100"
                    />
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={onApplyRecommended}
              className="mt-3 text-sm font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              Apply recommended baseline
            </button>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Items per category
            </p>
            <div className="space-y-3">
              {CATEGORIES.map((category) => (
                <div key={category}>
                  <label className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium capitalize text-zinc-700 dark:text-zinc-200">
                      {category}
                    </span>
                    <span className="tabular-nums text-zinc-500">{counts[category]}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={counts[category]}
                    aria-label={`${category} item count`}
                    onChange={(e) => onCountChange(category, parseInt(e.target.value))}
                    className="w-full accent-black dark:accent-zinc-100"
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="button" onClick={() => setMixOpen(false)} className={`${btnPrimary} w-full`}>
            Done
          </button>
        </div>
      </Sheet>

      <Sheet open={supplementsOpen} title="Supplements" onClose={() => setSupplementsOpen(false)}>
        <div className="space-y-5">
          <SupplementControlsPanel
            options={supplementOptions}
            onChange={onSupplementOptionsChange}
          />
          <button
            type="button"
            onClick={() => setSupplementsOpen(false)}
            className={`${btnPrimary} w-full`}
          >
            Done
          </button>
        </div>
      </Sheet>
    </div>
  );
}
