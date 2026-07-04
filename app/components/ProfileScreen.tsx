import type { Dog } from '../utils/recipeCalculator';
import { calculateDailyCalories } from '../utils/recipeCalculator';
import { weightUnitLabel, type WeightUnit } from '../utils/format';
import { card } from './ui';
import { PlusIcon } from './icons';
import { DogCard } from './DogCard';
import { Disclaimer } from './Disclaimer';

interface ProfileScreenProps {
  dogs: Dog[];
  unit: WeightUnit;
  showInfo: boolean;
  onToggleInfo: () => void;
  onUnitChange: (unit: WeightUnit) => void;
  onAddDog: () => void;
  onRemoveDog: (index: number) => void;
  onUpdateDog: (index: number, field: keyof Dog, value: string | number | string[] | undefined) => void;
}

export function ProfileScreen({
  dogs,
  unit,
  showInfo,
  onToggleInfo,
  onUnitChange,
  onAddDog,
  onRemoveDog,
  onUpdateDog,
}: ProfileScreenProps) {
  return (
    <div className="space-y-5 print:hidden">
      <section className={card}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-black">Your dogs</h2>
            <p className="text-sm text-zinc-500">Photos, weight, activity, and allergies</p>
          </div>
          <button
            type="button"
            onClick={onAddDog}
            className="inline-flex items-center gap-1.5 rounded-xl bg-black px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <PlusIcon width={15} height={15} />
            Add dog
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {dogs.map((dog, index) => (
            <DogCard
              key={dog.id ?? index}
              dog={dog}
              index={index}
              unit={unit}
              dailyCalories={calculateDailyCalories(dog)}
              canRemove={dogs.length > 1}
              onChange={(field, value) => onUpdateDog(index, field, value)}
              onRemove={() => onRemoveDog(index)}
            />
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className="text-base font-semibold text-black">Settings</h2>
        <div className="mt-4 space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-600">Weight units</p>
            <div
              className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1"
              role="group"
              aria-label="Weight units"
            >
              {(['lb', 'kg'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => onUnitChange(u)}
                  aria-pressed={unit === u}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    unit === u ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-black'
                  }`}
                >
                  {weightUnitLabel(u)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-zinc-600">About this tool</p>
              <button
                type="button"
                onClick={onToggleInfo}
                className="rounded-xl bg-zinc-100 px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
              >
                {showInfo ? 'Hide' : 'Show'}
              </button>
            </div>
            {showInfo && <Disclaimer />}
          </div>
        </div>
      </section>

      <p className="px-1 text-center text-xs leading-relaxed text-zinc-400">
        Calories: RER = 70 × kg<sup>0.75</sup> × activity factor. Calcium: 1.25 mg/kcal (AAFCO 2016).
        Food values from USDA FoodData Central.
      </p>
      <p className="text-center text-sm text-zinc-400">Created by — Your Husband</p>
    </div>
  );
}
