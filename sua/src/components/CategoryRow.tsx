import React, { useEffect, useRef } from 'react';
import { ProductCard, useProductSearch } from '@shopify/shop-minis-react';
import type { GeneratedCategory } from './ProductList';

interface CategoryRowProps {
  category: GeneratedCategory;
  baseQuery: string;
}

export function CategoryRow({ category, baseQuery }: CategoryRowProps) {
  const { name, description, searchTerms } = category;

  // Build a query that biases toward this category's search terms + user query
  const categoryQuery = [baseQuery, ...searchTerms].filter(Boolean).join(' ');

  const { products, loading, hasNextPage, fetchMore } = useProductSearch({
    query: categoryQuery,
    first: 30,
  });

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

  if (!products || products.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{name}</h3>
        {description && (
          <p className="text-sm text-gray-600 mb-3">{description}</p>
        )}
      </div>
      <div className="flex space-x-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {products.map((product: any) => (
          <div key={product.id} className="flex-shrink-0 w-48 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}


