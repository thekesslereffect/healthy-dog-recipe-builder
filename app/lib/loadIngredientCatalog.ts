import type { IngredientDatabase } from '../data/ingredientTypes';
import {
  setIngredientCatalog,
  tryGetIngredientCatalog,
} from '../data/ingredientCatalogStore';

let inflight: Promise<IngredientDatabase> | null = null;

/**
 * Load the pre-synced ingredient catalog from our backend.
 * USDA FDC is only queried during `npm run sync:fdc` — never from the client.
 */
export function loadIngredientCatalog(baseUrl = ''): Promise<IngredientDatabase> {
  const cached = tryGetIngredientCatalog();
  if (cached) return Promise.resolve(cached);

  if (!inflight) {
    inflight = fetch(`${baseUrl}/api/ingredients`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load ingredients (${res.status})`);
        }
        return res.json() as Promise<IngredientDatabase>;
      })
      .then((data) => {
        setIngredientCatalog(data);
        inflight = null;
        return data;
      })
      .catch((err) => {
        inflight = null;
        throw err;
      });
  }

  return inflight;
}
