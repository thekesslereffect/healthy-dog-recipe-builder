import { NextResponse } from 'next/server';
import { getIngredientCatalog } from '../../server/getIngredientCatalog';

/** Pre-synced ingredient catalog — refresh via `npm run sync:fdc`, not at request time. */
export async function GET() {
  const catalog = getIngredientCatalog();
  return NextResponse.json(catalog, {
    headers: {
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
