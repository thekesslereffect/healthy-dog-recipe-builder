import type { Dog } from '../utils/recipeCalculator';
import {
  convertMass,
  MASS_UNITS,
  massUnitLabel,
  type MassUnit,
} from '../utils/format';
import { segmentBtn, segmentTrack } from './ui';
import { DogAvatar } from './DogAvatar';

interface Portion {
  dailyPortion: number;
  mealPortion: number;
  percentage: number;
}

interface MealPortionsPanelProps {
  portions: Record<string, Portion>;
  dogsWithMER: Dog[];
  mealsPerDay: number;
  portionUnits: Record<string, MassUnit>;
  onPortionUnitsChange: (next: Record<string, MassUnit>) => void;
  onMealsChange: (meals: number) => void;
}

export function MealPortionsPanel({
  portions,
  dogsWithMER,
  mealsPerDay,
  portionUnits,
  onPortionUnitsChange,
  onMealsChange,
}: MealPortionsPanelProps) {
  const portionUnitFor = (name: string): MassUnit => portionUnits[name] ?? 'g';
  const entries = Object.entries(portions);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 pb-2 print:hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-500">Meals</span>
          <div className={segmentTrack}>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                className={segmentBtn(mealsPerDay === n)}
                onClick={() => onMealsChange(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className={segmentTrack}>
          {MASS_UNITS.map((u) => {
            const allMatch =
              entries.length > 0 && entries.every(([name]) => portionUnitFor(name) === u);
            return (
              <button
                key={u}
                type="button"
                className={segmentBtn(allMatch)}
                onClick={() => {
                  const next: Record<string, MassUnit> = { ...portionUnits };
                  for (const [name] of entries) next[name] = u;
                  onPortionUnitsChange(next);
                }}
              >
                {massUnitLabel(u)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain print:overflow-visible">
        {entries.map(([dogName, portion]) => {
          const dog = dogsWithMER.find((d) => d.name === dogName);
          const pu = portionUnitFor(dogName);
          return (
            <div
              key={dogName}
              className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900 print:border-0 print:px-0 print:py-1"
            >
              <DogAvatar name={dogName} avatar={dog?.avatar} size="md" className="print:hidden" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="truncate text-sm font-medium text-black dark:text-zinc-50">
                    {dogName}
                  </h3>
                  <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">
                    {portion.percentage}%
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                  <span className="tabular-nums text-black dark:text-zinc-50">
                    <span className="font-medium">
                      {convertMass(portion.mealPortion, pu)}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {' '}
                      {massUnitLabel(pu)}/meal
                    </span>
                  </span>
                  <span className="tabular-nums text-zinc-400">
                    {convertMass(portion.dailyPortion, pu)} {massUnitLabel(pu)}/day
                  </span>
                </div>
              </div>
              <select
                value={pu}
                onChange={(e) =>
                  onPortionUnitsChange({
                    ...portionUnits,
                    [dogName]: e.target.value as MassUnit,
                  })
                }
                aria-label={`Units for ${dogName}`}
                className="shrink-0 rounded-lg border-0 bg-zinc-100 py-1 pl-1.5 pr-1 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 print:hidden"
              >
                {MASS_UNITS.map((option) => (
                  <option key={option} value={option}>
                    {massUnitLabel(option)}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
