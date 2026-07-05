import { useState } from 'react';
import { formatSavedAt, type SavedRecipe } from '../utils/savedRecipes';
import {
  Button,
  ButtonRow,
  Card,
  EmptyState,
  Input,
  scrollShadowRoom,
} from './ui';
import { Bookmark, Calendar, Pencil, Trash2, Users } from 'lucide-react';
import { Sheet } from './Sheet';

interface SavedRecipesProps {
  saved: SavedRecipe[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function SavedRecipes({ saved, onLoad, onDelete, onRename }: SavedRecipesProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [pendingDelete, setPendingDelete] = useState<SavedRecipe | null>(null);
  const startRename = (item: SavedRecipe) => {
    setRenamingId(item.id);
    setDraft(item.name);
  };
  const commitRename = (id: string) => {
    const name = draft.trim();
    if (name) onRename(id, name);
    setRenamingId(null);
  };
  const confirmDelete = () => {
    if (!pendingDelete) return;
    onDelete(pendingDelete.id);
    setPendingDelete(null);
  };
  if (saved.length === 0) {
    return (
      <EmptyState
        className="h-full"
        icon={<Bookmark size={28} />}
        title="No saved plans yet"
        description="Build a draft and confirm it to save your first meal plan here."
      />
    );
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="mb-3 shrink-0 text-xs font-medium text-muted">
        {saved.length} saved plan{saved.length === 1 ? '' : 's'}
      </p>
      <div
        className={`${scrollShadowRoom} grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3`}
      >
        {saved.map((item) => {
          const dogNames = item.dogs
            .map((d) => d.name)
            .filter(Boolean)
            .join(', ');
          return (
            <Card key={item.id} variant="elevated" className="flex h-fit flex-col">
              {renamingId === item.id ? (
                <Input
                  type="text"
                  value={draft}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => commitRename(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(item.id);
                    else if (e.key === 'Escape') setRenamingId(null);
                  }}
                  aria-label="Recipe name"
                  className="font-semibold"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => startRename(item)}
                  className="flex max-w-full items-center gap-1.5 text-left text-sm font-semibold text-foreground"
                >
                  <span className="truncate">{item.name}</span>
                  <Pencil size={12} className="shrink-0 text-muted" />
                </button>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} />
                  {formatSavedAt(item.savedAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={11} />
                  {item.dogs.length} dog{item.dogs.length === 1 ? '' : 's'}
                </span>
              </div>
              {dogNames && <p className="mt-1 truncate text-xs text-muted/80">{dogNames}</p>}
              <p className="mt-1 text-xs font-medium text-sage">
                {Math.round(item.recipe.totalCalories)} cal/day
              </p>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => onLoad(item.id)} className="flex-1 py-2">
                  Open
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPendingDelete(item)}
                  aria-label={`Delete ${item.name}`}
                  className="px-3 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Sheet
        open={!!pendingDelete}
        title="Delete plan?"
        onClose={() => setPendingDelete(null)}
        size="md"
      >
        <p className="text-sm text-muted">
          Delete <span className="font-semibold text-foreground">"{pendingDelete?.name}"</span>?
          This can't be undone.
          {pendingDelete && (
            <span className="mt-2 block text-muted/80">
              If this is your current plan, it will be cleared too.
            </span>
          )}
        </p>
        <ButtonRow className="mt-5">
          <Button variant="secondary" onClick={() => setPendingDelete(null)} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} className="flex-1">
            Delete
          </Button>
        </ButtonRow>
      </Sheet>
    </div>
  );
}
