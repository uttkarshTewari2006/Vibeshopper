import { useEffect, useMemo, useRef } from 'react';
import { ProductCard, useProductSearch } from '@shopify/shop-minis-react';
import type { GeneratedCategory } from './ProductList';

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{name}</h3>
        {description && (
          <p className="text-sm text-gray-600 mb-3">{description}</p>
        )}
      </div>
      {loading && (!uniqueProducts || uniqueProducts.length === 0) && (
        <div className="flex space-x-4 overflow-x-hidden pb-2">
          {[0,1,2].map((i) => (
            <div key={i} className="flex-shrink-0 w-48 h-56 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      )}
      {!loading && uniqueProducts && uniqueProducts.length === 0 && (
        <p className="text-sm text-gray-400">No items found for this category.</p>
      )}
      {uniqueProducts && uniqueProducts.length > 0 && (
        <div className="flex space-x-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {uniqueProducts.map((product: any) => (
            <div key={product.id as string} className="flex-shrink-0 w-48 snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


