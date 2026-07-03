import { formatSavedAt, type SavedRecipe } from '../utils/savedRecipes';
import { card, sectionTitle } from './ui';
import { BookmarkIcon, PencilIcon, TrashIcon } from './icons';

interface SavedRecipesProps {
  saved: SavedRecipe[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SavedRecipes({ saved, onLoad, onDelete }: SavedRecipesProps) {
  if (saved.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 px-6 py-16 text-center">
        <BookmarkIcon width={28} height={28} className="mx-auto text-zinc-300" />
        <h2 className="mt-4 text-xl font-semibold text-black">No saved recipes</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
          Generate a recipe, then use “Save recipe” on the Recipe tab to keep it here. You can
          reload any saved recipe later to edit it.
        </p>
      </div>
    );
  }

  return (
    <section className={card}>
      <h2 className={`${sectionTitle} mb-5`}>Saved Recipes</h2>
      <div className="space-y-3">
        {saved.map((item) => {
          const dogNames = item.dogs.map((d) => d.name).filter(Boolean).join(', ');
          return (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-black">{item.name}</h3>
                <p className="mt-0.5 text-xs text-zinc-400">Saved {formatSavedAt(item.savedAt)}</p>
                <p className="mt-1 truncate text-sm text-zinc-500">
                  {item.dogs.length} {item.dogs.length === 1 ? 'dog' : 'dogs'}
                  {dogNames ? ` · ${dogNames}` : ''} · {Math.round(item.recipe.totalCalories)} cal/day
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onLoad(item.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  <PencilIcon width={15} height={15} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  aria-label={`Delete ${item.name}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3.5 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 hover:text-black"
                >
                  <TrashIcon width={15} height={15} />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
