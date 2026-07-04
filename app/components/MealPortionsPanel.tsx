import type { Dog } from '../utils/recipeCalculator';
import {
  convertMass,
  MASS_UNITS,
  massUnitLabel,
  type MassUnit,
} from '../utils/format';
import { card, sectionTitle } from './ui';
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
  const setPortionUnitFor = (name: string, u: MassUnit) =>
    onPortionUnitsChange({ ...portionUnits, [name]: u });

  return (
    <section className={card}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 print:mb-1">
        <div>
          <h2 className={`${sectionTitle} print:text-lg`}>Feeding</h2>
          <p className="mt-0.5 text-sm text-zinc-500 print:hidden">
            How much each dog gets per day and per meal
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            All in
            <select
              value=""
              onChange={(e) => {
                const u = e.target.value as MassUnit;
                if (!u) return;
                const next: Record<string, MassUnit> = { ...portionUnits };
                for (const name of Object.keys(portions)) next[name] = u;
                onPortionUnitsChange(next);
              }}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-zinc-300"
              aria-label="Set units for all portions"
            >
              <option value="">Set all…</option>
              {MASS_UNITS.map((u) => (
                <option key={u} value={u}>
                  {massUnitLabel(u)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            Meals / day
            <select
              value={mealsPerDay}
              onChange={(e) => onMealsChange(parseInt(e.target.value))}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-zinc-300"
              aria-label="Meals per day"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-4 print:gap-2">
        {Object.entries(portions).map(([dogName, portion]) => {
          const dog = dogsWithMER.find((d) => d.name === dogName);
          const pu = portionUnitFor(dogName);
          return (
            <div
              key={dogName}
              className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 print:border-0 print:bg-transparent print:p-0"
            >
              <div className="mb-3 flex items-center gap-3 print:mb-1">
                <DogAvatar name={dogName} avatar={dog?.avatar} size="md" className="print:hidden" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="truncate font-semibold text-black print:text-sm">{dogName}</h3>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-zinc-400">
                      {portion.percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {Math.round(dog?.MER || 0)} cal/day
                  </p>
                </div>
              </div>

              <div className="mb-2 flex justify-end print:hidden">
                <select
                  value={pu}
                  onChange={(e) => setPortionUnitFor(dogName, e.target.value as MassUnit)}
                  aria-label={`Units for ${dogName}`}
                  className="rounded-md border border-zinc-200 bg-white px-1.5 py-1 text-xs text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                >
                  {MASS_UNITS.map((option) => (
                    <option key={option} value={option}>
                      {massUnitLabel(option)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm print:text-xs">
                  <span className="text-zinc-500">Daily total</span>
                  <span className="text-base font-semibold tabular-nums text-black print:text-sm">
                    {convertMass(portion.dailyPortion, pu)} {massUnitLabel(pu)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-sm print:text-xs">
                  <span className="text-zinc-500">
                    Per meal <span className="text-zinc-400">×{mealsPerDay}</span>
                  </span>
                  <span className="text-base font-semibold tabular-nums text-black print:text-sm">
                    {convertMass(portion.mealPortion, pu)} {massUnitLabel(pu)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
