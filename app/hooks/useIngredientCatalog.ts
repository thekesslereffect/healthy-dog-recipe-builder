'use client';

import { useEffect, useState } from 'react';
import type { IngredientDatabase } from '../data/ingredientTypes';
import { tryGetIngredientCatalog } from '../data/ingredientCatalogStore';
import { loadIngredientCatalog } from '../lib/loadIngredientCatalog';

type CatalogStatus = 'loading' | 'ready' | 'error';

export function useIngredientCatalog(): {
  status: CatalogStatus;
  catalog: IngredientDatabase | null;
  error: string | null;
} {
  const [status, setStatus] = useState<CatalogStatus>(() =>
    tryGetIngredientCatalog() ? 'ready' : 'loading',
  );
  const [catalog, setCatalog] = useState<IngredientDatabase | null>(() =>
    tryGetIngredientCatalog(),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tryGetIngredientCatalog()) return;

    let cancelled = false;
    loadIngredientCatalog()
      .then((data) => {
        if (cancelled) return;
        setCatalog(data);
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load ingredients');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { status, catalog, error };
}
