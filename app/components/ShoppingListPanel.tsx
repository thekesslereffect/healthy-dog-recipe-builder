import type { ShoppingList } from '../utils/recipeCalculator';
import {
  convertMass,
  defaultMassUnit,
  MASS_UNITS,
  massUnitLabel,
  type MassUnit,
  type WeightUnit,
} from '../utils/format';
import { segmentBtn, segmentTrack } from './ui';

interface ShoppingListPanelProps {
  shoppingList: ShoppingList;
  numberOfDays: number;
  unit: WeightUnit;
  shoppingUnits: Record<string, MassUnit>;
  checkedItems: Record<string, boolean>;
  onShoppingUnitsChange: (next: Record<string, MassUnit>) => void;
  onCheckedItemsChange: (next: Record<string, boolean>) => void;
  onDaysChange: (days: number) => void;
}

export function ShoppingListPanel({
  shoppingList,
  numberOfDays,
  unit,
  shoppingUnits,
  checkedItems,
  onShoppingUnitsChange,
  onCheckedItemsChange,
  onDaysChange,
}: ShoppingListPanelProps) {
  const fallbackUnit = defaultMassUnit(unit);
  const unitFor = (name: string): MassUnit => shoppingUnits[name] ?? fallbackUnit;
  const setUnitFor = (name: string, u: MassUnit) =>
    onShoppingUnitsChange({ ...shoppingUnits, [name]: u });
  const toggleChecked = (name: string) =>
    onCheckedItemsChange({ ...checkedItems, [name]: !checkedItems[name] });
  const entries = Object.entries(shoppingList);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 pb-2 print:hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-500">Days</span>
          <div className="inline-flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <button
              type="button"
              aria-label="Fewer days"
              className="px-2.5 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300"
              onClick={() => onDaysChange(Math.max(1, numberOfDays - 1))}
            >
              −
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-medium tabular-nums text-black dark:text-zinc-50">
              {numberOfDays}
            </span>
            <button
              type="button"
              aria-label="More days"
              className="px-2.5 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300"
              onClick={() => onDaysChange(Math.min(30, numberOfDays + 1))}
            >
              +
            </button>
          </div>
        </div>
        <div className={segmentTrack}>
          {MASS_UNITS.map((u) => {
            const allMatch =
              entries.length > 0 && entries.every(([name]) => unitFor(name) === u);
            return (
              <button
                key={u}
                type="button"
                className={segmentBtn(allMatch)}
                onClick={() => {
                  const next: Record<string, MassUnit> = { ...shoppingUnits };
                  for (const [name] of entries) next[name] = u;
                  onShoppingUnitsChange(next);
                }}
              >
                {massUnitLabel(u)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900 print:overflow-visible print:border-0">
        {entries.map(([name, amounts], index) => {
          const u = unitFor(name);
          const checked = !!checkedItems[name];
          return (
            <div
              key={name}
              className={`flex items-center gap-2.5 px-3 py-2.5 print:px-1 print:py-0.5 ${
                index % 2 === 1
                  ? 'bg-zinc-50 dark:bg-zinc-800/50 [-webkit-print-color-adjust:exact] [print-color-adjust:exact]'
                  : ''
              } ${index > 0 ? 'border-t border-zinc-50 dark:border-zinc-800 print:border-0' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleChecked(name)}
                aria-label={`Got ${name}`}
                className="h-4 w-4 shrink-0 rounded border-zinc-300 accent-black dark:border-zinc-600 dark:accent-zinc-100 print:hidden"
              />
              <button
                type="button"
                onClick={() => toggleChecked(name)}
                className={`min-w-0 flex-1 truncate text-left text-sm font-medium print:pointer-events-none print:text-xs ${
                  checked
                    ? 'text-zinc-400 line-through'
                    : 'text-black dark:text-zinc-50'
                }`}
              >
                {name}
              </button>
              <span className="flex shrink-0 items-center gap-1.5">
                <span
                  className={`tabular-nums text-sm print:text-xs ${
                    checked
                      ? 'text-zinc-400 line-through'
                      : 'text-black dark:text-zinc-50'
                  }`}
                >
                  <span className="font-medium">{convertMass(amounts.grams, u)}</span>
                  <span className={`ml-0.5 ${checked ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {massUnitLabel(u)}
                  </span>
                </span>
                <select
                  value={u}
                  onChange={(e) => setUnitFor(name, e.target.value as MassUnit)}
                  aria-label={`Units for ${name}`}
                  className="rounded-lg border-0 bg-zinc-100 py-1 pl-1.5 pr-1 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 print:hidden"
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
    </div>
  );
}
