import type { ShoppingList } from '../utils/recipeCalculator';

import {
  convertMass,
  MASS_UNITS,
  massUnitLabel,
  type MassUnit,
  type WeightUnit,
} from '../utils/format';

import { resolveShoppingMassUnit, type ShoppingMassUnitMode } from '../utils/shoppingMassUnit';

import { scrollShadowRoom, Select, Stepper } from './ui';

interface ShoppingListPanelProps {
  shoppingList: ShoppingList;
  numberOfDays: number;
  unit: WeightUnit;
  shoppingUnits: Record<string, MassUnit>;
  shoppingUnitMode: ShoppingMassUnitMode;
  checkedItems: Record<string, boolean>;
  onShoppingUnitsChange: (next: Record<string, MassUnit>) => void;
  onShoppingUnitModeChange: (mode: ShoppingMassUnitMode) => void;
  onCheckedItemsChange: (next: Record<string, boolean>) => void;
  onDaysChange: (days: number) => void;
  showToolbar?: boolean;
  showProgress?: boolean;
}

export function ShoppingListPanel({
  shoppingList,
  numberOfDays,
  unit,
  shoppingUnits,
  shoppingUnitMode,
  checkedItems,
  onShoppingUnitsChange,
  onShoppingUnitModeChange,
  onCheckedItemsChange,
  onDaysChange,
  showToolbar = true,
  showProgress = true,
}: ShoppingListPanelProps) {
  const unitFor = (name: string): MassUnit =>
    resolveShoppingMassUnit(name, shoppingUnitMode, shoppingUnits, unit);
  const applyUnitMode = (mode: ShoppingMassUnitMode) => {
    onShoppingUnitModeChange(mode);
    onShoppingUnitsChange({});
  };
  const setUnitFor = (name: string, u: MassUnit) =>
    onShoppingUnitsChange({ ...shoppingUnits, [name]: u });
  const toggleChecked = (name: string) =>
    onCheckedItemsChange({ ...checkedItems, [name]: !checkedItems[name] });
  const entries = Object.entries(shoppingList);
  const checkedCount = entries.filter(([name]) => checkedItems[name]).length;
  const progress = entries.length > 0 ? (checkedCount / entries.length) * 100 : 0;
  return (
    <div className="flex h-full min-h-0 flex-col">
      {showToolbar && (
        <div className="flex shrink-0 items-center justify-between gap-2 pb-3 print:hidden">
          <Stepper
            value={numberOfDays}
            label="Days"
            min={1}
            max={30}
            decrementLabel="Fewer days"
            incrementLabel="More days"
            onChange={onDaysChange}
          />

          <Select
            variant="toolbar"
            value={shoppingUnitMode}
            onChange={(e) => applyUnitMode(e.target.value as ShoppingMassUnitMode)}
            aria-label="Shopping list units"
          >
            <option value="auto">Auto</option>
            {MASS_UNITS.map((u) => (
              <option key={u} value={u}>
                {massUnitLabel(u)}
              </option>
            ))}
          </Select>
        </div>
      )}

      {entries.length > 0 && showProgress && (
        <div className={`shrink-0 print:hidden ${showToolbar ? 'mb-3' : ''}`}>
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold">
            <span className="text-muted">
              {checkedCount} of {entries.length} items
            </span>

            <span className="text-sage">{Math.round(progress)}%</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-sage transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div
        className={`${scrollShadowRoom} min-h-0 flex-1 rounded-2xl border border-border bg-surface shadow-[var(--shadow-sm)] print:overflow-visible print:border-0 print:shadow-none`}
      >
        {entries.map(([name, amounts], index) => {
          const u = unitFor(name);
          const checked = !!checkedItems[name];
          return (
            <div
              key={name}
              className={`flex items-center gap-3 px-4 py-3 transition-colors print:px-1 print:py-0.5 ${
                checked ? 'bg-sage-soft/50' : index % 2 === 1 ? 'bg-surface-muted/50' : ''
              } ${index > 0 ? 'border-t border-border/50 print:border-0' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleChecked(name)}
                aria-label={`Got ${name}`}
                className="h-4.5 w-4.5 shrink-0 rounded-md border-border accent-accent print:hidden"
              />

              <button
                type="button"
                onClick={() => toggleChecked(name)}
                className={`min-w-0 flex-1 truncate text-left text-sm font-medium print:pointer-events-none print:text-xs ${
                  checked ? 'text-muted line-through' : 'text-foreground'
                }`}
              >
                {name}
              </button>

              <span className="flex shrink-0 items-center gap-1.5">
                <span
                  className={`tabular-nums text-sm print:text-xs ${
                    checked ? 'text-muted line-through' : 'text-foreground'
                  }`}
                >
                  <span className="font-semibold">{convertMass(amounts.grams, u)}</span>

                  <span className={`ml-0.5 ${checked ? 'text-muted' : 'text-muted'}`}>
                    {massUnitLabel(u)}
                  </span>
                </span>

                <Select
                  variant="mass"
                  value={u}
                  onChange={(e) => setUnitFor(name, e.target.value as MassUnit)}
                  aria-label={`Units for ${name}`}
                >
                  {MASS_UNITS.map((option) => (
                    <option key={option} value={option}>
                      {massUnitLabel(option)}
                    </option>
                  ))}
                </Select>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
