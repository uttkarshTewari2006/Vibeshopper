import { useEffect, useMemo, useRef, useState } from 'react';
import { ProductCard, useProductSearch } from '@shopify/shop-minis-react';
import type { GeneratedCategory } from './ProductList';
import { ShoppingCart, Check } from 'lucide-react';

interface CategoryRowProps {
  category: GeneratedCategory;
  baseQuery: string;
  onAddToCart: (product: { name: string; price: string; image: string; category: string }) => void;
  onRemoveFromCart?: (productName: string, categoryName: string) => void;
}

export function CategoryRow({ category, baseQuery, onAddToCart, onRemoveFromCart }: CategoryRowProps) {
  const [addedToCart, setAddedToCart] = useState<Record<string, boolean>>({});
  
  const handleCartAction = (product: any) => {
    if (!product) return;
    
    const productId = String(product?.id ?? product?.gid ?? '');
    if (!productId) return;
    
    const productName = product.title || 'Unnamed Product';
    const isCurrentlyAdded = addedToCart[productId];
    
    if (isCurrentlyAdded && onRemoveFromCart) {
      onRemoveFromCart(productName, category.name);
    } else {
      onAddToCart({
        name: productName,
        price: product.priceRange?.minVariantPrice?.amount || '0',
        image: product.featuredImage?.url || '',
        category: category.name
      });
    }
    
    setAddedToCart(prev => ({
      ...prev,
      [productId]: !isCurrentlyAdded
    }));
  };
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
  // Debug: print simple tags and the effective query
  useEffect(() => {
    const simpleTags = searchTerms
      .map((t) => String(t).toLowerCase().replace(/[^a-z0-9\-\s]/g, '').trim())
      .filter(Boolean);
    console.log('[CategoryRow] Query', { name, baseQuery, simpleTags, categoryQuery });
  }, [name, baseQuery, categoryQuery, searchTerms]);

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

  // Debug: print product ids returned for this category
  useEffect(() => {
    const ids = uniqueProducts.map((p: any) => String(p?.id ?? p?.gid)).filter(Boolean);
    console.log('[CategoryRow] Results', { name, count: ids.length, ids });
  }, [name, uniqueProducts]);

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
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{name}</h3>
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
      {loading && (!uniqueProducts || uniqueProducts.length === 0) && (
        <div className="flex space-x-3 overflow-x-hidden pb-2">
          {[0,1,2].map((i) => (
            <div key={i} className="flex-shrink-0 w-36 h-42 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      )}
      {!loading && uniqueProducts && uniqueProducts.length === 0 && (
        <p className="text-sm text-gray-400">No items found for this category.</p>
      )}
      {uniqueProducts && uniqueProducts.length > 0 && (
        <div className="flex space-x-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {uniqueProducts.map((product: any) => {
            const productId = String(product?.id ?? product?.gid ?? '');
            const isAdded = addedToCart[productId] || false;
            
            return (
              <div key={productId} className="relative w-[140px] flex-shrink-0">
                <div className="w-full">
                  <ProductCard
                    product={product}
                    variant="default"
                  />
                </div>
                <button
                  onClick={() => handleCartAction(product)}
                  className={`mt-2 mx-auto w-[90%] flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-3xl transition-colors ${
                    isAdded 
                      ? 'bg-[#60DB74FF]/60 text-[#23774d] hover:bg-[#60DB74FF]/40' 
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check size={14} />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={14} />
                      <span>Save to Cart</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

