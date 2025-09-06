import { useEffect, useMemo, useRef, useState } from 'react';
import { ProductCard, useProductSearch, useShopCartActions } from '@shopify/shop-minis-react';
import type { GeneratedCategory } from './ProductList';
import { ShoppingCart, Check } from 'lucide-react';
import { LoadingState } from './LoadingState';

interface CategoryRowProps {
  category: GeneratedCategory;
  baseQuery: string;
  onAddToCart: (product: { name: string; price: string; image: string; category: string }) => void;
  onRemoveFromCart?: (productName: string, categoryName: string) => void;
}

export function CategoryRow({ category, baseQuery, onAddToCart, onRemoveFromCart }: CategoryRowProps) {
  const [addedToCart, setAddedToCart] = useState<Record<string, boolean>>({});
  const { addToCart } = useShopCartActions();
  
  const handleCartAction = async (product: any) => {
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
      const variantId: string | null =
        product?.defaultVariant?.id ||
        product?.defaultVariantId ||
        product?.selectedOrFirstAvailableVariant?.id ||
        product?.firstAvailableVariant?.id ||
        product?.firstVariant?.id ||
        product?.variants?.nodes?.[0]?.id ||
        product?.variants?.edges?.[0]?.node?.id || null;
      if (productId && variantId) {
        try {
          await addToCart({ productId, productVariantId: variantId, quantity: 1 });
        } catch (e) {
          console.warn('[CategoryRow] addToCart failed', e);
        }
      }
    }
    
    setAddedToCart(prev => ({
      ...prev,
      [productId]: !isCurrentlyAdded
    }));
  };
  const { name, searchTerms } = category;

  const orParts = [...searchTerms.map((t) => `"${t}"`)];
  if (baseQuery) orParts.push(`"${baseQuery}"`);
  const categoryQuery = orParts.length > 0 ? `(${orParts.join(' OR ')})` : baseQuery;

  console.log('[CategoryRow] Rendering row', {
    name,
    searchTerms,
    baseQuery,
    categoryQuery,
  });
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

  useEffect(() => {
    const ids = uniqueProducts.map((p: any) => String(p?.id ?? p?.gid)).filter(Boolean);
    console.log('[CategoryRow] Results', { name, count: ids.length, ids });
  }, [name, uniqueProducts]);

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

  if (!loading && (!uniqueProducts || uniqueProducts.length < 3)) {
    return null;
  }

  return (
    <div className="py-3">
      <div className="mb-3">

        <h3 className="text-lg font-semibold text-gray-800 mb-2">{name}</h3>
        <div className="flex gap-1.5 overflow-hidden">
          {searchTerms
            .slice(0, 3)
            .map((term, index) => {
              const words = term.split(' ').slice(0, 2).join(' '); 
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
      {(loading || category.isUpdating) && (
        <LoadingState message={category.isUpdating ? `Updating ${name}...` : `Loading ${name}...`} />
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
                <div className="mt-2 mx-auto w-[90%]">
                  <button
                    onClick={() => handleCartAction(product)}
                    className={`w-full flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-3xl transition-colors ${
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
              </div>
            );
          })}
        </div>
      )}
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

