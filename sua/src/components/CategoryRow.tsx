import { useEffect, useMemo, useRef } from 'react';
import { ProductCard, useProductSearch } from '@shopify/shop-minis-react';
import type { GeneratedCategory } from './ProductList';
import { LoadingState } from './LoadingState';

interface CategoryRowProps {
  category: GeneratedCategory;
  baseQuery: string;
}

export function CategoryRow({ category, baseQuery }: CategoryRowProps) {
  const { name, description, searchTerms } = category;

  // Build a broader query using OR semantics to avoid over-filtering
  const orParts = [...searchTerms.map((t) => `"${t}"`)];
  if (baseQuery) orParts.push(`"${baseQuery}"`);
  const categoryQuery = orParts.length > 0 ? `(${orParts.join(' OR ')})` : baseQuery;

  // Debug log for each row's query
  console.log('[CategoryRow] Rendering row', {
    name,
    searchTerms,
    baseQuery,
    categoryQuery,
  });

  const { products, loading, hasNextPage, fetchMore } = useProductSearch({
    query: categoryQuery,
    first: 30,
  });

  // Deduplicate products by id to avoid duplicate React keys
  const uniqueProducts = useMemo(() => {
    if (!products) return [] as any[];
    const seenIds = new Set<string>();
    const result: any[] = [];
    for (const p of products) {
      const id: string = String((p as any)?.id ?? (p as any)?.gid ?? '');
      if (!id) continue;
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      result.push(p);
    }
    return result;
  }, [products]);

  // Auto-load all pages for this category
  const autoLoadAllRef = useRef(false);
  useEffect(() => {
    autoLoadAllRef.current = true;
  }, [categoryQuery]);

  useEffect(() => {
    if (!autoLoadAllRef.current) return;
    if (loading) return;
    if (hasNextPage) {
      fetchMore?.();
    } else {
      autoLoadAllRef.current = false;
    }
  }, [hasNextPage, loading, fetchMore]);

  // Don't render if we have fewer than 3 products (and we're not loading)
  if (!loading && (!uniqueProducts || uniqueProducts.length < 3)) {
    return null;
  }

  return (
    <div className="py-3">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-semibold text-gray-800">{name}</h3>
        </div>
        {/* Show only the most relevant search terms as small pills (max 3, 2 words each) */}
        <div className="flex gap-1.5 overflow-hidden">
          {searchTerms
            .slice(0, 3) // Max 3 tags
            .map((term, index) => {
              const words = term.split(' ').slice(0, 2).join(' '); // Max 2 words
              return (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full whitespace-nowrap flex-shrink-0"
                >
                  {words}
                </span>
              );
            })}
        </div>
      </div>
      {/* Show loading state when loading or updating - hide products */}
      {(loading || category.isUpdating) && (
        <LoadingState message={category.isUpdating ? `Updating ${name}...` : `Loading ${name}...`} />
      )}
      
      {/* Show products only when NOT loading and NOT updating */}
      {!loading && !category.isUpdating && (
        <>
          {uniqueProducts && uniqueProducts.length === 0 && (
            <p className="text-sm text-gray-400">No items found for this category.</p>
          )}
          {uniqueProducts && uniqueProducts.length > 0 && (
            <div className="flex space-x-3 overflow-x-auto pb-2 snap-x snap-mandatory">
              {uniqueProducts.map((product: any) => (
                <div key={product.id as string} className="flex-shrink-0 w-36 snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}


