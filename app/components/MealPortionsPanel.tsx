import type { Dog } from '../utils/recipeCalculator';
import { convertMass, defaultMassUnit, MASS_UNITS, massUnitLabel, type MassUnit, type WeightUnit } from '../utils/format';
import { scrollShadowRoom, Select, Stepper } from './ui';
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
  unit: WeightUnit;
  portionUnits: Record<string, MassUnit>;
  onPortionUnitsChange: (next: Record<string, MassUnit>) => void;
  onMealsChange: (meals: number) => void;
  showToolbar?: boolean;
}

export function MealPortionsPanel({
  portions,
  dogsWithMER,
  mealsPerDay,
  unit,
  portionUnits,
  onPortionUnitsChange,
  onMealsChange,
  showToolbar = true,
}: MealPortionsPanelProps) {
  const fallbackUnit = defaultMassUnit(unit);
  const portionUnitFor = (name: string): MassUnit => portionUnits[name] ?? fallbackUnit;
  const entries = Object.entries(portions);
  const globalUnit =
    entries.length > 0 &&
    entries.every(([name]) => portionUnitFor(name) === portionUnitFor(entries[0][0]))
      ? portionUnitFor(entries[0][0])
      : fallbackUnit;
  const setAllPortionUnits = (massUnit: MassUnit) => {
    const next: Record<string, MassUnit> = { ...portionUnits };
    for (const [name] of entries) next[name] = massUnit;
    onPortionUnitsChange(next);
  };
  return (
    <div className="flex h-full min-h-0 flex-col">
      {showToolbar && (
        <div className="flex shrink-0 items-center justify-between gap-2 pb-3 print:hidden">
          <Stepper
            value={mealsPerDay}
            label="Meals / Day"
            min={1}
            max={3}
            decrementLabel="Fewer meals per day"
            incrementLabel="More meals per day"
            onChange={onMealsChange}
          />
          <Select
            variant="toolbar"
            value={globalUnit}
            onChange={(e) => setAllPortionUnits(e.target.value as MassUnit)}
            aria-label="Portion units"
          >
            {MASS_UNITS.map((u) => (
              <option key={u} value={u}>
                {massUnitLabel(u)}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className={`${scrollShadowRoom} min-h-0 flex-1 space-y-2.5 print:overflow-visible`}>
        {entries.map(([dogName, portion]) => {
          const dog = dogsWithMER.find((d) => d.name === dogName);
          const pu = portionUnitFor(dogName);
          return (
            <div
              key={dogName}
              className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)] print:border-0 print:px-0 print:py-1 print:shadow-none"
            >
              <div className="flex items-center gap-3">
                <DogAvatar name={dogName} avatar={dog?.avatar} size="md" className="print:hidden" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground">{dogName}</h3>
                    <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold tabular-nums text-accent">
                      {portion.percentage}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${portion.percentage}%` }}
                    />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-sm">
                    <span className="tabular-nums text-foreground">
                      <span className="text-lg font-bold">
                        {convertMass(portion.mealPortion, pu)}
                      </span>
                      <span className="ml-1 text-xs font-medium text-muted">
                        {massUnitLabel(pu)}/meal
                      </span>
                    </span>
                    <span className="tabular-nums text-xs text-muted">
                      {convertMass(portion.dailyPortion, pu)} {massUnitLabel(pu)}/day
                    </span>
                  </div>
                </div>
                <Select
                  variant="mass"
                  value={pu}
                  onChange={(e) =>
                    onPortionUnitsChange({
                      ...portionUnits,
                      [dogName]: e.target.value as MassUnit,
                    })
                  }
                  aria-label={`Units for ${dogName}`}
                  className="shrink-0"
                >
                  {MASS_UNITS.map((option) => (
                    <option key={option} value={option}>
                      {massUnitLabel(option)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
