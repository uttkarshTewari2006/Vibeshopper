import { useEffect, useState, useCallback } from 'react';
import { DatabaseService, Product, Shop, User, AIInteraction, AIGeneratedImage } from '../lib/database';

// Hook for managing Shopify data with local database integration
export function useShopifyData() {
  const [dbService] = useState(() => DatabaseService.getInstance());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync products from Shop Minis to local database
  const syncProducts = useCallback(async (products: any[]) => {
    try {
      setIsLoading(true);
      setError(null);

      const dbProducts: Product[] = products.map(product => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        description: product.description,
        vendor: product.vendor,
        product_type: product.product_type,
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString(),
        images: product.images?.map((img: any) => ({
          id: img.id,
          product_id: product.id,
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height,
          position: img.position
        })),
        variants: product.variants?.map((variant: any) => ({
          id: variant.id,
          product_id: product.id,
          title: variant.title,
          price: variant.price,
          sku: variant.sku,
          inventory_quantity: variant.inventory_quantity,
          weight: variant.weight,
          option1: variant.option1,
          option2: variant.option2,
          option3: variant.option3
        })),
        tags: product.tags,
        status: product.status,
        published_at: product.published_at,
        shop_id: product.shop_id
      }));

      await dbService.bulkSaveProducts(dbProducts);
      
      // Track sync event
      await dbService.trackEvent({
        event_type: 'data_sync',
        entity_type: 'product',
        entity_id: 'bulk',
        data: { count: dbProducts.length, source: 'shop_minis' }
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync products');
    } finally {
      setIsLoading(false);
    }
  }, [dbService]);

  // Get products from local database
  const getStoredProducts = useCallback(async (): Promise<Product[]> => {
    try {
      return await dbService.getAllProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get products');
      return [];
    }
  }, [dbService]);

  // Search products in local database
  const searchProducts = useCallback(async (query: string): Promise<Product[]> => {
    try {
      const results = await dbService.searchProducts(query);
      
      // Track search event
      await dbService.trackEvent({
        event_type: 'search',
        entity_type: 'product',
        entity_id: 'search_query',
        data: { query, results_count: results.length }
      });

      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      return [];
    }
  }, [dbService]);

  return {
    syncProducts,
    getStoredProducts,
    searchProducts,
    isLoading,
    error,
    dbService
  };
}

// Hook for managing followed shops
export function useFollowedShops() {
  const [dbService] = useState(() => DatabaseService.getInstance());
  const [followedShops, setFollowedShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFollowedShops = useCallback(async () => {
    try {
      setIsLoading(true);
      const shops = await dbService.getFollowedShops();
      setFollowedShops(shops);
    } catch (err) {
      console.error('Failed to load followed shops:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dbService]);

  const followShop = useCallback(async (shop: any) => {
    try {
      const dbShop: Shop = {
        id: shop.id,
        name: shop.name,
        domain: shop.domain,
        email: shop.email,
        shop_owner: shop.shop_owner,
        created_at: shop.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        country: shop.country,
        currency: shop.currency,
        timezone: shop.timezone,
        is_followed: true,
        followed_at: new Date().toISOString(),
        visit_count: 1,
        last_visited: new Date().toISOString()
      };

      await dbService.saveShop(dbShop);
      await dbService.followShop(shop.id);
      
      // Track follow event
      await dbService.trackEvent({
        event_type: 'follow_shop',
        entity_type: 'shop',
        entity_id: shop.id,
        data: { shop_name: shop.name, shop_domain: shop.domain }
      });

      await loadFollowedShops();
    } catch (err) {
      console.error('Failed to follow shop:', err);
    }
  }, [dbService, loadFollowedShops]);

  const unfollowShop = useCallback(async (shopId: string) => {
    try {
      await dbService.unfollowShop(shopId);
      
      // Track unfollow event
      await dbService.trackEvent({
        event_type: 'unfollow_shop',
        entity_type: 'shop',
        entity_id: shopId,
        data: {}
      });

      await loadFollowedShops();
    } catch (err) {
      console.error('Failed to unfollow shop:', err);
    }
  }, [dbService, loadFollowedShops]);

  useEffect(() => {
    loadFollowedShops();
  }, [loadFollowedShops]);

  return {
    followedShops,
    followShop,
    unfollowShop,
    isLoading,
    refetch: loadFollowedShops
  };
}

// Hook for AI interaction tracking
export function useAITracking() {
  const [dbService] = useState(() => DatabaseService.getInstance());

  const trackAIInteraction = useCallback(async (
    type: AIInteraction['type'],
    inputData: Record<string, any>,
    outputData: Record<string, any>,
    processingTime?: number,
    success: boolean = true,
    errorMessage?: string
  ) => {
    try {
      const interaction: AIInteraction = {
        id: crypto.randomUUID(),
        user_id: 'current_user', // In a real app, get from auth context
        type,
        input_data: inputData,
        output_data: outputData,
        timestamp: new Date().toISOString(),
        processing_time: processingTime,
        success,
        error_message: errorMessage
      };

      await dbService.saveAIInteraction(interaction);

      // Also track as analytics event
      await dbService.trackEvent({
        event_type: 'ai_interaction',
        entity_type: 'ai_interaction',
        entity_id: interaction.id,
        data: {
          type,
          success,
          processing_time: processingTime,
          input_size: JSON.stringify(inputData).length,
          output_size: JSON.stringify(outputData).length
        }
      });

    } catch (err) {
      console.error('Failed to track AI interaction:', err);
    }
  }, [dbService]);

  const trackAIImageGeneration = useCallback(async (
    prompt: string,
    imageUrl: string,
    modelUsed: string,
    generationTime: number,
    metadata?: any,
    productId?: string
  ) => {
    try {
      const aiImage: AIGeneratedImage = {
        id: crypto.randomUUID(),
        product_id: productId,
        user_id: 'current_user',
        prompt,
        image_url: imageUrl,
        model_used: modelUsed,
        generation_time: generationTime,
        created_at: new Date().toISOString(),
        metadata
      };

      await dbService.saveAIGeneratedImage(aiImage);

      // Track as AI interaction too
      await trackAIInteraction(
        'image_generation',
        { prompt, model: modelUsed, product_id: productId },
        { image_url: imageUrl, metadata },
        generationTime,
        true
      );

    } catch (err) {
      console.error('Failed to track AI image generation:', err);
    }
  }, [dbService, trackAIInteraction]);

  const getAIHistory = useCallback(async () => {
    try {
      return await dbService.getAIInteractionsByUser('current_user');
    } catch (err) {
      console.error('Failed to get AI history:', err);
      return [];
    }
  }, [dbService]);

  const getGeneratedImages = useCallback(async () => {
    try {
      return await dbService.getAIGeneratedImagesByUser('current_user');
    } catch (err) {
      console.error('Failed to get generated images:', err);
      return [];
    }
  }, [dbService]);

  return {
    trackAIInteraction,
    trackAIImageGeneration,
    getAIHistory,
    getGeneratedImages
  };
}

// Hook for analytics and insights
export function useAnalytics() {
  const [dbService] = useState(() => DatabaseService.getInstance());
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAnalytics = useCallback(async (
    dateRange?: { from: string; to: string }
  ) => {
    try {
      setIsLoading(true);
      
      const [
        allEvents,
        searchEvents,
        aiEvents,
        followEvents,
        products,
        aiImages
      ] = await Promise.all([
        dbService.getAnalytics(undefined, undefined, dateRange),
        dbService.getAnalytics('search', undefined, dateRange),
        dbService.getAnalytics('ai_interaction', undefined, dateRange),
        dbService.getAnalytics('follow_shop', undefined, dateRange),
        dbService.getAllProducts(),
        dbService.getAIGeneratedImagesByUser('current_user')
      ]);

      const analyticsData = {
        totalEvents: allEvents.length,
        searchCount: searchEvents.length,
        aiInteractionCount: aiEvents.length,
        followedShopsCount: followEvents.length,
        productsInDb: products.length,
        generatedImagesCount: aiImages.length,
        eventsByType: allEvents.reduce((acc, event) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        dailyActivity: allEvents.reduce((acc, event) => {
          const date = event.timestamp.split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        topSearches: searchEvents
          .map(e => e.data.query)
          .reduce((acc, query) => {
            acc[query] = (acc[query] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        aiModelUsage: aiImages.reduce((acc, image) => {
          acc[image.model_used] = (acc[image.model_used] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dbService]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    isLoading,
    refresh: loadAnalytics
  };
}
