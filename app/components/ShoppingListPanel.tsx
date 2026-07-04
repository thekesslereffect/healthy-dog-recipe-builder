import type { ShoppingList } from '../utils/recipeCalculator';
import {
  convertMass,
  defaultMassUnit,
  MASS_UNITS,
  massUnitLabel,
  type MassUnit,
  type WeightUnit,
} from '../utils/format';
import { card, sectionTitle } from './ui';

interface ShoppingListPanelProps {
  shoppingList: ShoppingList;
  numberOfDays: number;
  unit: WeightUnit;
  shoppingUnits: Record<string, MassUnit>;
  onShoppingUnitsChange: (next: Record<string, MassUnit>) => void;
  /** Larger typography for the home hero list. */
  featured?: boolean;
}

export function ShoppingListPanel({
  shoppingList,
  numberOfDays,
  unit,
  shoppingUnits,
  onShoppingUnitsChange,
  featured = false,
}: ShoppingListPanelProps) {
  const fallbackUnit = defaultMassUnit(unit);
  const unitFor = (name: string): MassUnit => shoppingUnits[name] ?? fallbackUnit;
  const setUnitFor = (name: string, u: MassUnit) =>
    onShoppingUnitsChange({ ...shoppingUnits, [name]: u });
  const entries = Object.entries(shoppingList);

  return (
    <section className={card}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 print:mb-2">
        <div>
          <h2 className={`${sectionTitle} print:text-lg ${featured ? 'text-xl sm:text-2xl' : ''}`}>
            Shopping List
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500 print:hidden">
            Everything you need for {numberOfDays} day{numberOfDays === 1 ? '' : 's'}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600 print:hidden">
          All in
          <select
            value=""
            onChange={(e) => {
              const u = e.target.value as MassUnit;
              if (!u) return;
              const next: Record<string, MassUnit> = { ...shoppingUnits };
              for (const [name] of entries) next[name] = u;
              onShoppingUnitsChange(next);
            }}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-zinc-300"
            aria-label="Set units for all items"
          >
            <option value="">Set all…</option>
            {MASS_UNITS.map((u) => (
              <option key={u} value={u}>
                {massUnitLabel(u)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-100 print:border-0">
        {entries.map(([name, amounts], index) => {
          const u = unitFor(name);
          return (
            <div
              key={name}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 print:px-1.5 print:py-0.5 ${
                featured ? 'sm:py-3' : ''
              } ${
                index % 2 === 1
                  ? 'bg-zinc-50 [-webkit-print-color-adjust:exact] [print-color-adjust:exact]'
                  : 'bg-white'
              } ${index > 0 ? 'border-t border-zinc-100 print:border-0' : ''}`}
            >
              <span
                className={`min-w-0 truncate text-black print:text-xs ${
                  featured ? 'text-[15px] font-medium sm:text-base' : 'text-sm'
                }`}
              >
                {name}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span
                  className={`tabular-nums text-black print:text-xs ${
                    featured ? 'text-[15px] sm:text-base' : 'text-sm'
                  }`}
                >
                  <span className="font-semibold">{convertMass(amounts.grams, u)}</span>
                  <span className="ml-1 font-medium text-zinc-500">{massUnitLabel(u)}</span>
                  {u !== 'g' && (
                    <span className="ml-2 text-xs text-zinc-400 print:hidden">
                      {Math.round(amounts.grams)}g
                    </span>
                  )}
                </span>
                <select
                  value={u}
                  onChange={(e) => setUnitFor(name, e.target.value as MassUnit)}
                  aria-label={`Units for ${name}`}
                  className="rounded-md border border-zinc-200 bg-white px-1.5 py-1 text-xs text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-300 print:hidden"
                >
                  {MASS_UNITS.map((option) => (
                    <option key={option} value={option}>
                      {massUnitLabel(option)}
                    </option>
                  ))}
                </select>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
