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
import { SupplementControlsPanel, enabledSupplementCount, enabledSupplementNames } from './SupplementControls';
import { Sheet } from './Sheet';
import { btnPrimary, btnSecondary, cardElevated, inputBase } from './ui';
import { ChevronRight, Shuffle, Sparkles } from 'lucide-react';

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

function BuildStep({ step, label, active, done }: { step: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
          done
            ? 'bg-sage text-white'
            : active
              ? 'bg-accent text-white shadow-[var(--shadow-sm)]'
              : 'bg-surface-muted text-muted'
        }`}
      >
        {done ? '✓' : step}
      </div>
      <span className={`text-[10px] font-semibold ${active || done ? 'text-foreground' : 'text-muted'}`}>
        {label}
      </span>
    </div>
  );
}

function ConfigChip({
  label,
  detail,
  onClick,
}: {
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-left shadow-[var(--shadow-sm)] active:scale-[0.98]"
    >
      <span className="truncate text-sm font-semibold text-foreground">{label}</span>
      <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-muted">
        {detail}
        <ChevronRight size={12} />
      </span>
    </button>
  );
}

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
  const activeStep: 2 | 3 = draftRecipe ? 3 : 2;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 sm:gap-3 sm:px-0.5 sm:py-0.5">
      {/* Desktop stepper */}
      <div className="hidden shrink-0 items-center gap-2 rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-sm)] sm:flex">
        <BuildStep step={1} label="Configure" active={false} done />
        <div className="h-0.5 flex-1 rounded-full bg-sage" />
        <BuildStep step={2} label="Generate" active={activeStep === 2} done={activeStep > 2} />
        <div className={`h-0.5 flex-1 rounded-full ${activeStep > 2 ? 'bg-sage' : 'bg-border'}`} />
        <BuildStep step={3} label="Confirm" active={activeStep === 3} done={false} />
      </div>

      {/* Mobile: slim chips when reviewing a draft; full stacked cards when configuring */}
      {draftRecipe ? (
        <div className="flex shrink-0 gap-2 sm:hidden">
          <ConfigChip
            label="Mix"
            detail={`${Math.round(sum * 100)}%`}
            onClick={() => setMixOpen(true)}
          />
          <ConfigChip
            label="Supplements"
            detail={`${supplementCount} on`}
            onClick={() => setSupplementsOpen(true)}
          />
        </div>
      ) : (
        <div className="grid shrink-0 grid-cols-1 gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => setMixOpen(true)}
            className="flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-3 text-left shadow-[var(--shadow-sm)] active:scale-[0.98]"
          >
            <div className="mb-2 flex items-center justify-between gap-1">
              <span className="text-sm font-semibold text-foreground">Ingredient mix</span>
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted">
                {Math.round(sum * 100)}%
                <ChevronRight size={12} />
              </span>
            </div>
            <CategoryBar ratios={ratios} compact />
          </button>
          <button
            type="button"
            onClick={() => setSupplementsOpen(true)}
            className="flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-3 text-left shadow-[var(--shadow-sm)] active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm font-semibold text-foreground">Supplements</span>
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted">
                {supplementCount} on
                <ChevronRight size={12} />
              </span>
            </div>
            <p className="mt-1.5 line-clamp-1 text-xs text-muted">
              {enabledSupplements.length > 0
                ? enabledSupplements.join(', ')
                : 'Tap to choose supplements'}
            </p>
          </button>
        </div>
      )}

      {/* Desktop: always show full config cards */}
      <div className="hidden shrink-0 grid-cols-2 gap-3 px-0.5 sm:grid">
        <button
          type="button"
          onClick={() => setMixOpen(true)}
          className={`${cardElevated} flex min-w-0 flex-col text-left active:scale-[0.98]`}
        >
          <div className="mb-2 flex items-center justify-between gap-1">
            <span className="text-sm font-semibold text-foreground">Ingredient mix</span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted">
              {Math.round(sum * 100)}%
              <ChevronRight size={12} />
            </span>
          </div>
          <CategoryBar ratios={ratios} />
        </button>

        <button
          type="button"
          onClick={() => setSupplementsOpen(true)}
          className={`${cardElevated} flex min-w-0 flex-col text-left active:scale-[0.98]`}
        >
          <div className="mb-2 flex items-center justify-between gap-1">
            <span className="text-sm font-semibold text-foreground">Supplements</span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted">
              {supplementCount} on
              <ChevronRight size={12} />
            </span>
          </div>
          <p className="line-clamp-2 text-[11px] leading-snug text-muted sm:text-xs">
            {enabledSupplements.length > 0
              ? enabledSupplements.join(', ')
              : 'Tap to choose supplements'}
          </p>
        </button>
      </div>

      {!draftRecipe ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface/60 px-4 py-5 text-center sm:px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent sm:h-14 sm:w-14">
            <Sparkles size={24} className="sm:hidden" />
            <Sparkles size={26} className="hidden sm:block" />
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted sm:mt-4">
            <span className="sm:hidden">
              {hasActivePlan
                ? 'Generate a new draft — your active plan stays until you confirm.'
                : 'Generate a draft, then reroll until the mix looks right.'}
            </span>
            <span className="hidden sm:inline">
              {hasActivePlan
                ? 'Your plan is live. Generate a new draft here — it won\'t replace your active plan until you confirm.'
                : 'Hit generate to create a balanced draft. Reroll until the ingredients feel right.'}
            </span>
          </p>
          {allergyList.length > 0 && (
            <p className="mt-2 max-w-xs truncate rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent sm:mt-3">
              Avoiding: {allergyList.join(', ')}
            </p>
          )}
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className={`${btnPrimary} mt-4 inline-flex w-full max-w-xs items-center justify-center gap-2 py-3 sm:mt-6 sm:w-auto`}
          >
            <Shuffle size={16} />
            Generate draft
          </button>
          {!canGenerate && (
            <p className="mt-2 text-xs text-muted">
              {!isPercentageValid
                ? 'Mix must total 100%.'
                : hasInvalidDog
                  ? 'Set up dogs in Profile first.'
                  : ''}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 sm:px-0.5">
            <DailyRecipePanel
              recipe={draftRecipe}
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

          <div className="shrink-0 space-y-2 rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-md)] sm:space-y-2.5 sm:p-4">
            <input
              type="text"
              value={draftName}
              onChange={(e) => onDraftNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirm();
              }}
              placeholder="Name your plan…"
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
              <span className="text-sm font-semibold text-muted">Ratios</span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {Math.round(sum * 100)}%
              </span>
            </div>
            <CategoryBar ratios={ratios} />
            <div className="mt-5 space-y-4">
              {CATEGORIES.map((category) => {
                const value = ratios[category];
                const pct = Math.round(value * 100);
                return (
                  <div key={category}>
                    <label className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-semibold capitalize text-foreground">
                        {category}
                      </span>
                      <span className="tabular-nums text-muted">
                        <span className="mr-2 text-[11px] text-muted/70">
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
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={onApplyRecommended}
              className="mt-4 text-sm font-semibold text-accent underline-offset-2 hover:underline"
            >
              Apply recommended baseline
            </button>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-muted">
              Items per category
            </p>
            <div className="space-y-4">
              {CATEGORIES.map((category) => (
                <div key={category}>
                  <label className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold capitalize text-foreground">
                      {category}
                    </span>
                    <span className="tabular-nums font-medium text-muted">{counts[category]}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={counts[category]}
                    aria-label={`${category} item count`}
                    onChange={(e) => onCountChange(category, parseInt(e.target.value))}
                    className="w-full"
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
