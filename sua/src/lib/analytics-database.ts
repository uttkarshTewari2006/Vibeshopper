import Dexie, { Table } from 'dexie';
import type { Product, Shop } from '@shopify/shop-minis-react';

// ✅ ANALYTICS-FOCUSED SCHEMA (doesn't duplicate Shopify data)

export interface ProductAnalytics {
  id: string;
  shopify_product_id: string; // Reference to Shopify Product.id
  view_count: number;
  click_count: number;
  save_count: number;
  unsave_count: number;
  first_viewed: string;
  last_viewed: string;
  total_time_viewed: number; // in seconds
  search_result_position?: number; // when clicked from search
  session_id: string;
}

export interface ShopAnalytics {
  id: string;
  shopify_shop_id: string; // Reference to Shopify Shop.id
  follow_count: number;
  unfollow_count: number;
  visit_count: number;
  first_visited: string;
  last_visited: string;
  followed_at?: string;
  unfollowed_at?: string;
}

export interface SearchAnalytics {
  id: string;
  query: string;
  filters_applied: Record<string, any>;
  results_count: number;
  clicks_count: number; // How many products were clicked from this search
  session_id: string;
  timestamp: string;
  search_duration?: number; // Time spent on search results
}

export interface AIInteraction {
  id: string;
  type: 'image_generation' | 'product_analysis' | 'recommendation';
  prompt?: string;
  model_used?: string;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  processing_time: number; // in seconds
  success: boolean;
  error_message?: string;
  session_id: string;
  timestamp: string;
  related_product_id?: string; // If related to a specific product
}

export interface AIGeneratedImage {
  id: string;
  prompt: string;
  image_url: string;
  model_used: string;
  generation_time: number;
  metadata?: {
    width: number;
    height: number;
    seed?: number;
    inference_steps?: number;
  };
  session_id: string;
  created_at: string;
  related_product_id?: string; // If generated for a specific product
}

export interface UserSession {
  id: string;
  started_at: string;
  ended_at?: string;
  page_views: number;
  searches_count: number;
  products_viewed: number;
  products_clicked: number;
  ai_interactions: number;
  user_agent: string;
  screen_size: string;
}

export interface ProductEnhancement {
  id: string;
  shopify_product_id: string;
  ai_category?: string;
  ai_keywords: string[];
  sentiment_score?: number; // -1 to 1
  engagement_score: number; // calculated from analytics
  trending_score?: number;
  last_updated: string;
}

export interface EventLog {
  id: string;
  event_type: 'product_view' | 'product_click' | 'search' | 'ai_generation' | 
              'shop_follow' | 'shop_unfollow' | 'page_view' | 'session_start' | 'session_end';
  entity_id: string; // ID of the related entity (product, shop, etc.)
  entity_type: 'product' | 'shop' | 'search' | 'ai' | 'session';
  data: Record<string, any>;
  session_id: string;
  timestamp: string;
  page_url?: string;
}

// Database class focusing on analytics only
export class AnalyticsDatabase extends Dexie {
  // Analytics tables only - no product/shop duplication
  product_analytics!: Table<ProductAnalytics>;
  shop_analytics!: Table<ShopAnalytics>;
  search_analytics!: Table<SearchAnalytics>;
  ai_interactions!: Table<AIInteraction>;
  ai_generated_images!: Table<AIGeneratedImage>;
  user_sessions!: Table<UserSession>;
  product_enhancements!: Table<ProductEnhancement>;
  event_logs!: Table<EventLog>;

  constructor() {
    super('ShopifyMinisAnalytics');
    
    this.version(1).stores({
      product_analytics: 'id, shopify_product_id, last_viewed, session_id',
      shop_analytics: 'id, shopify_shop_id, last_visited, followed_at',
      search_analytics: 'id, query, timestamp, session_id',
      ai_interactions: 'id, type, timestamp, session_id, success, related_product_id',
      ai_generated_images: 'id, created_at, session_id, model_used, related_product_id',
      user_sessions: 'id, started_at, ended_at',
      product_enhancements: 'id, shopify_product_id, last_updated',
      event_logs: 'id, event_type, entity_type, entity_id, timestamp, session_id'
    });
  }
}

export const analyticsDb = new AnalyticsDatabase();

// Analytics service class
export class AnalyticsService {
  private static instance: AnalyticsService;
  private currentSessionId: string;
  
  private constructor() {
    this.currentSessionId = this.getOrCreateSessionId();
    this.startSession();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Session management
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private async startSession(): Promise<void> {
    await analyticsDb.user_sessions.add({
      id: this.currentSessionId,
      started_at: new Date().toISOString(),
      page_views: 0,
      searches_count: 0,
      products_viewed: 0,
      products_clicked: 0,
      ai_interactions: 0,
      user_agent: navigator.userAgent,
      screen_size: `${window.screen.width}x${window.screen.height}`
    });

    await this.logEvent('session_start', this.currentSessionId, 'session', {
      user_agent: navigator.userAgent,
      screen_size: `${window.screen.width}x${window.screen.height}`
    });
  }

  // Product analytics
  async trackProductView(product: Product): Promise<void> {
    const now = new Date().toISOString();
    
    // Get or create product analytics
    let analytics = await analyticsDb.product_analytics
      .where('shopify_product_id')
      .equals(product.id)
      .first();

    if (analytics) {
      await analyticsDb.product_analytics.update(analytics.id, {
        view_count: analytics.view_count + 1,
        last_viewed: now
      });
    } else {
      await analyticsDb.product_analytics.add({
        id: crypto.randomUUID(),
        shopify_product_id: product.id,
        view_count: 1,
        click_count: 0,
        save_count: 0,
        unsave_count: 0,
        first_viewed: now,
        last_viewed: now,
        total_time_viewed: 0,
        session_id: this.currentSessionId
      });
    }

    await this.logEvent('product_view', product.id, 'product', {
      product_title: product.title,
      shop_name: product.shop.name
    });
  }

  async trackProductClick(product: Product, source: string = 'unknown'): Promise<void> {
    // Update analytics
    const analytics = await analyticsDb.product_analytics
      .where('shopify_product_id')
      .equals(product.id)
      .first();

    if (analytics) {
      await analyticsDb.product_analytics.update(analytics.id, {
        click_count: analytics.click_count + 1
      });
    }

    await this.logEvent('product_click', product.id, 'product', {
      product_title: product.title,
      source,
      shop_name: product.shop.name
    });
  }

  // Search analytics
  async trackSearch(query: string, filters: any, resultsCount: number): Promise<string> {
    const searchId = crypto.randomUUID();
    
    await analyticsDb.search_analytics.add({
      id: searchId,
      query,
      filters_applied: filters || {},
      results_count: resultsCount,
      clicks_count: 0,
      session_id: this.currentSessionId,
      timestamp: new Date().toISOString()
    });

    await this.logEvent('search', searchId, 'search', {
      query,
      results_count: resultsCount,
      filters_applied: filters
    });

    return searchId;
  }

  // AI analytics
  async trackAIImageGeneration(
    prompt: string,
    imageUrl: string,
    modelUsed: string,
    processingTime: number,
    metadata?: any,
    relatedProductId?: string
  ): Promise<void> {
    const imageId = crypto.randomUUID();
    
    await analyticsDb.ai_generated_images.add({
      id: imageId,
      prompt,
      image_url: imageUrl,
      model_used: modelUsed,
      generation_time: processingTime,
      metadata,
      session_id: this.currentSessionId,
      created_at: new Date().toISOString(),
      related_product_id: relatedProductId
    });

    await analyticsDb.ai_interactions.add({
      id: crypto.randomUUID(),
      type: 'image_generation',
      prompt,
      model_used: modelUsed,
      input_data: { prompt, model: modelUsed },
      output_data: { image_url: imageUrl, metadata },
      processing_time: processingTime,
      success: true,
      session_id: this.currentSessionId,
      timestamp: new Date().toISOString(),
      related_product_id: relatedProductId
    });

    await this.logEvent('ai_generation', imageId, 'ai', {
      type: 'image_generation',
      model: modelUsed,
      processing_time: processingTime,
      success: true
    });
  }

  // Shop analytics
  async trackShopFollow(shop: Shop): Promise<void> {
    const now = new Date().toISOString();
    
    let analytics = await analyticsDb.shop_analytics
      .where('shopify_shop_id')
      .equals(shop.id)
      .first();

    if (analytics) {
      await analyticsDb.shop_analytics.update(analytics.id, {
        follow_count: analytics.follow_count + 1,
        followed_at: now
      });
    } else {
      await analyticsDb.shop_analytics.add({
        id: crypto.randomUUID(),
        shopify_shop_id: shop.id,
        follow_count: 1,
        unfollow_count: 0,
        visit_count: 1,
        first_visited: now,
        last_visited: now,
        followed_at: now
      });
    }

    await this.logEvent('shop_follow', shop.id, 'shop', {
      shop_name: shop.name,
      shop_domain: shop.primaryDomain.url
    });
  }

  // Event logging
  private async logEvent(
    eventType: EventLog['event_type'],
    entityId: string,
    entityType: EventLog['entity_type'],
    data: Record<string, any>
  ): Promise<void> {
    await analyticsDb.event_logs.add({
      id: crypto.randomUUID(),
      event_type: eventType,
      entity_id: entityId,
      entity_type: entityType,
      data,
      session_id: this.currentSessionId,
      timestamp: new Date().toISOString(),
      page_url: window.location.href
    });
  }

  // Analytics retrieval
  async getProductAnalytics(productId: string): Promise<ProductAnalytics | undefined> {
    return await analyticsDb.product_analytics
      .where('shopify_product_id')
      .equals(productId)
      .first();
  }

  async getTopProducts(limit = 10): Promise<ProductAnalytics[]> {
    return await analyticsDb.product_analytics
      .orderBy('view_count')
      .reverse()
      .limit(limit)
      .toArray();
  }

  async getSearchInsights(): Promise<{query: string, count: number}[]> {
    const searches = await analyticsDb.search_analytics.toArray();
    const queryMap = new Map<string, number>();
    
    searches.forEach(search => {
      queryMap.set(search.query, (queryMap.get(search.query) || 0) + 1);
    });

    return Array.from(queryMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getAIUsageStats(): Promise<{
    totalGenerations: number;
    avgProcessingTime: number;
    successRate: number;
    modelUsage: Record<string, number>;
  }> {
    const interactions = await analyticsDb.ai_interactions
      .where('type')
      .equals('image_generation')
      .toArray();

    const totalGenerations = interactions.length;
    const avgProcessingTime = interactions.reduce((sum, i) => sum + i.processing_time, 0) / totalGenerations;
    const successRate = interactions.filter(i => i.success).length / totalGenerations;
    
    const modelUsage: Record<string, number> = {};
    interactions.forEach(i => {
      if (i.model_used) {
        modelUsage[i.model_used] = (modelUsage[i.model_used] || 0) + 1;
      }
    });

    return {
      totalGenerations,
      avgProcessingTime,
      successRate,
      modelUsage
    };
  }

  async exportAllData(): Promise<any> {
    return {
      product_analytics: await analyticsDb.product_analytics.toArray(),
      shop_analytics: await analyticsDb.shop_analytics.toArray(),
      search_analytics: await analyticsDb.search_analytics.toArray(),
      ai_interactions: await analyticsDb.ai_interactions.toArray(),
      ai_generated_images: await analyticsDb.ai_generated_images.toArray(),
      user_sessions: await analyticsDb.user_sessions.toArray(),
      event_logs: await analyticsDb.event_logs.toArray()
    };
  }
}
