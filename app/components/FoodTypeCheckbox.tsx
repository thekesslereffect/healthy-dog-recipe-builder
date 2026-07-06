import type { LucideIcon } from 'lucide-react';
import {
  Apple,
  Beef,
  Carrot,
  Check,
  Droplets,
  Drumstick,
  Egg,
  Fish,
  Heart,
  Leaf,
  Pill,
  Wheat,
} from 'lucide-react';
import { findFoodByName } from '../data/ingredients';

const SEAFOOD = /anchov|sardine|salmon|mackerel|herring|cod|tuna|tilapia|trout|fish|mussel|clam|oyster|shrimp/i;
const POULTRY = /chicken|turkey|duck|quail/i;
const EGG = /\begg\b/i;
const LEAFY = /kale|spinach|collard|parsley|bok choy|cabbage|celery|greens|asparagus|broccoli|brussels/i;

/** Icon per food type; falls back to a supplement pill for unknowns. */
function foodIcon(name: string): LucideIcon {
  const category = findFoodByName(name)?.category;
  switch (category) {
    case 'protein':
      if (SEAFOOD.test(name)) return Fish;
      if (EGG.test(name)) return Egg;
      if (POULTRY.test(name)) return Drumstick;
      return Beef;
    case 'organs':
      return Heart;
    case 'fruits':
      return Apple;
    case 'veggies':
      return LEAFY.test(name) ? Leaf : Carrot;
    case 'carbs':
      return Wheat;
    case 'fats':
      return Droplets;
    default:
      return Pill;
  }
}

interface FoodTypeCheckboxProps {
  name: string;
  checked: boolean;
  onToggle: () => void;
}

/** Round food-type badge that doubles as the shopping list checkbox. */
export function FoodTypeCheckbox({ name, checked, onToggle }: FoodTypeCheckboxProps) {
  const Icon = foodIcon(name);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={`Got ${name}`}
      onClick={onToggle}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-90 print:hidden ${
        checked ? 'bg-sage text-white' : 'bg-surface-muted text-foreground'
      }`}
    >
      {checked ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
    </button>
  );
}
