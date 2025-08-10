import { useEffect, useMemo, useRef } from "react";
import {
  ProductCard,
  useProductSearch,
  usePopularProducts,
} from "@shopify/shop-minis-react";
import type { GeneratedCategory } from "./ProductList";

interface CategoryRowProps {
  category: GeneratedCategory;
  baseQuery: string;
}

export function CategoryRow({ category, baseQuery }: CategoryRowProps) {
  const { name, description, searchTerms } = category;

  // Build a user-friendly search text (avoid Boolean operators/quotes that some backends reject)
  const normalizedTerms = searchTerms
    .map((t) => String(t || "").trim())
    .filter(Boolean)
    .slice(0, 4); // cap to avoid overly long queries

  const normalizedBase = String(baseQuery || "").trim();
  const searchText = [normalizedBase, ...normalizedTerms]
    .filter(Boolean)
    .join(" ")
    .replace(/["()]/g, ""); // strip quotes/parentheses

  // Keep a human-readable debug version for logs only
  const categoryQuery =
    normalizedTerms.length > 0
      ? `(${normalizedTerms.map((t) => `"${t}"`).join(" OR ")})`
      : normalizedBase;

  // Debug log for each row's query
  console.log("[CategoryRow] Rendering row", {
    name,
    searchTerms,
    baseQuery,
    categoryQuery,
  });

  const primaryTerm = normalizedBase || normalizedTerms[0] || "";

  const { products, loading, hasNextPage, fetchMore } = useProductSearch({
    query: primaryTerm || searchText,
    first: 30,
    // if nothing to search yet, skip to avoid noise
    ...(primaryTerm ? {} : { skip: true as any }),
  });

  // Fallback to popular products when search yields nothing
  const { products: popularProducts } = usePopularProducts();

  // Deduplicate products by id to avoid duplicate React keys
  const uniqueProducts = useMemo(() => {
    if (!products) return [] as any[];
    const seenIds = new Set<string>();
    const result: any[] = [];
    for (const p of products) {
      const id: string = String((p as any)?.id ?? (p as any)?.gid ?? "");
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

  const fallbackList = useMemo(() => {
    if (uniqueProducts && uniqueProducts.length > 0) return uniqueProducts;
    if (!loading && popularProducts && popularProducts.length > 0) {
      return popularProducts.slice(0, 6) as any[];
    }
    return [] as any[];
  }, [uniqueProducts, loading, popularProducts]);

  // If still nothing to show and not loading, hide the row
  if (!loading && fallbackList.length === 0) return null;

  return (
    <div className="py-3">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-800 mb-2">{name}</h3>
        {/* Show only the most relevant search terms as small pills (max 3, 2 words each) */}
        <div className="flex gap-1.5 overflow-hidden">
          {searchTerms
            .slice(0, 3) // Max 3 tags
            .map((term, index) => {
              const words = term.split(" ").slice(0, 2).join(" "); // Max 2 words
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
      {loading && fallbackList.length === 0 && (
        <div className="flex space-x-3 overflow-x-hidden pb-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-36 h-42 bg-gray-100 rounded animate-pulse"
            />
          ))}
        </div>
      )}
      {!loading && uniqueProducts && uniqueProducts.length === 0 && (
        <p className="text-sm text-gray-400">
          No exact matches. Showing popular items instead.
        </p>
      )}
      {fallbackList && fallbackList.length > 0 && (
        <div className="flex space-x-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {fallbackList.map((product: any) => (
            <div
              key={product.id as string}
              className="flex-shrink-0 w-36 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
