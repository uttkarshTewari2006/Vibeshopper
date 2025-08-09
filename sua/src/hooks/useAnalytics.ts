import { useState, useCallback, useEffect } from 'react';
import { AnalyticsService } from '../lib/analytics-database';
import type { Product, Shop } from '@shopify/shop-minis-react';

// ✅ ANALYTICS-FOCUSED HOOKS (no data duplication)

export function useProductAnalytics() {
  const [analyticsService] = useState(() => AnalyticsService.getInstance());

  const trackView = useCallback(async (product: Product) => {
    await analyticsService.trackProductView(product);
  }, [analyticsService]);

  const trackClick = useCallback(async (product: Product, source: string = 'unknown') => {
    await analyticsService.trackProductClick(product, source);
  }, [analyticsService]);

  return {
    trackView,
    trackClick
  };
}

export function useSearchAnalytics() {
  const [analyticsService] = useState(() => AnalyticsService.getInstance());

  const trackSearch = useCallback(async (query: string, filters: any, resultsCount: number) => {
    return await analyticsService.trackSearch(query, filters, resultsCount);
  }, [analyticsService]);

  return {
    trackSearch
  };
}

export function useShopAnalytics() {
  const [analyticsService] = useState(() => AnalyticsService.getInstance());

  const trackFollow = useCallback(async (shop: Shop) => {
    await analyticsService.trackShopFollow(shop);
  }, [analyticsService]);

  return {
    trackFollow
  };
}

export function useAIAnalytics() {
  const [analyticsService] = useState(() => AnalyticsService.getInstance());

  const trackImageGeneration = useCallback(async (
    prompt: string,
    imageUrl: string,
    modelUsed: string,
    processingTime: number,
    metadata?: any,
    relatedProductId?: string
  ) => {
    await analyticsService.trackAIImageGeneration(
      prompt, imageUrl, modelUsed, processingTime, metadata, relatedProductId
    );
  }, [analyticsService]);

  return {
    trackImageGeneration
  };
}

export function useAnalyticsDashboard() {
  const [analyticsService] = useState(() => AnalyticsService.getInstance());
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [
        topProducts,
        searchInsights,
        aiStats
      ] = await Promise.all([
        analyticsService.getTopProducts(10),
        analyticsService.getSearchInsights(),
        analyticsService.getAIUsageStats()
      ]);

      setAnalytics({
        topProducts,
        searchInsights: searchInsights.slice(0, 10),
        aiStats,
        summary: {
          totalProducts: topProducts.length,
          totalSearches: searchInsights.reduce((sum, s) => sum + s.count, 0),
          totalAIGenerations: aiStats.totalGenerations
        }
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [analyticsService]);

  const exportData = useCallback(async () => {
    return await analyticsService.exportAllData();
  }, [analyticsService]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    isLoading,
    refresh: loadAnalytics,
    exportData
  };
}
