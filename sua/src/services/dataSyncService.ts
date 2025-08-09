import { DatabaseService } from '../lib/database';

/**
 * Data Synchronization Service
 * Handles syncing data between Shopify Shop Minis and local database
 */
export class DataSyncService {
  private static instance: DataSyncService;
  private dbService: DatabaseService;
  private syncInProgress = false;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  /**
   * Initialize data sync - called when app starts
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing data sync service...');
      
      // Track app initialization
      await this.dbService.trackEvent({
        event_type: 'app_init',
        entity_type: 'user',
        entity_id: 'current_user',
        data: { 
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          screen_size: `${window.screen.width}x${window.screen.height}`
        }
      });

      console.log('✅ Data sync service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize data sync service:', error);
    }
  }

  /**
   * Sync products from Shop Minis API
   */
  async syncProducts(products: any[]): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log(`🔄 Syncing ${products.length} products...`);

      const transformedProducts = products.map(product => ({
        id: product.id || crypto.randomUUID(),
        title: product.title || 'Untitled Product',
        handle: product.handle || this.generateHandle(product.title),
        description: product.description || '',
        vendor: product.vendor || 'Unknown Vendor',
        product_type: product.product_type || 'General',
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString(),
        images: product.images || [],
        variants: product.variants || [],
        tags: product.tags || [],
        status: product.status || 'active',
        published_at: product.published_at,
        shop_id: product.shop_id,
        ai_generated_images: [],
        ai_analysis: this.generateAIAnalysis(product)
      }));

      await this.dbService.bulkSaveProducts(transformedProducts);

      // Track successful sync
      await this.dbService.trackEvent({
        event_type: 'products_synced',
        entity_type: 'product',
        entity_id: 'bulk_sync',
        data: {
          count: transformedProducts.length,
          sync_timestamp: new Date().toISOString(),
          source: 'shop_minis_api'
        }
      });

      console.log(`✅ Successfully synced ${transformedProducts.length} products`);
    } catch (error) {
      console.error('❌ Failed to sync products:', error);
      
      // Track sync failure
      await this.dbService.trackEvent({
        event_type: 'sync_failed',
        entity_type: 'product',
        entity_id: 'bulk_sync_error',
        data: {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          attempted_count: products.length,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Enhanced product interaction tracking
   */
  async trackProductInteraction(
    productId: string, 
    interactionType: 'view' | 'click' | 'add_to_cart' | 'share' | 'favorite',
    additionalData?: Record<string, any>
  ): Promise<void> {
    try {
      await this.dbService.trackEvent({
        event_type: 'product_interaction',
        entity_type: 'product',
        entity_id: productId,
        data: {
          interaction_type: interactionType,
          timestamp: new Date().toISOString(),
          session_id: this.getSessionId(),
          ...additionalData
        }
      });
    } catch (error) {
      console.error('Failed to track product interaction:', error);
    }
  }

  /**
   * Track user behavior and preferences
   */
  async trackUserBehavior(
    actionType: 'page_view' | 'search' | 'filter_apply' | 'sort_change' | 'scroll',
    data: Record<string, any>
  ): Promise<void> {
    try {
      await this.dbService.trackEvent({
        event_type: 'user_behavior',
        entity_type: 'user',
        entity_id: 'current_user',
        data: {
          action_type: actionType,
          timestamp: new Date().toISOString(),
          session_id: this.getSessionId(),
          url: window.location.href,
          ...data
        }
      });
    } catch (error) {
      console.error('Failed to track user behavior:', error);
    }
  }

  /**
   * Sync shop data when user follows/unfollows
   */
  async syncShopData(shopData: any, isFollowed: boolean): Promise<void> {
    try {
      const shop = {
        id: shopData.id || crypto.randomUUID(),
        name: shopData.name || 'Unknown Shop',
        domain: shopData.domain || '',
        email: shopData.email,
        shop_owner: shopData.shop_owner,
        created_at: shopData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        country: shopData.country,
        currency: shopData.currency,
        timezone: shopData.timezone,
        is_followed: isFollowed,
        followed_at: isFollowed ? new Date().toISOString() : undefined,
        visit_count: 1,
        last_visited: new Date().toISOString()
      };

      await this.dbService.saveShop(shop);

      // Track follow/unfollow action
      await this.dbService.trackEvent({
        event_type: isFollowed ? 'shop_followed' : 'shop_unfollowed',
        entity_type: 'shop',
        entity_id: shop.id,
        data: {
          shop_name: shop.name,
          shop_domain: shop.domain,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to sync shop data:', error);
    }
  }

  /**
   * Get comprehensive analytics data
   */
  async getAnalyticsData(dateRange?: { from: string; to: string }) {
    try {
      const [
        totalEvents,
        productInteractions,
        userBehavior,
        aiInteractions,
        shopFollows,
        searchQueries
      ] = await Promise.all([
        this.dbService.getAnalytics(undefined, undefined, dateRange),
        this.dbService.getAnalytics('product_interaction', undefined, dateRange),
        this.dbService.getAnalytics('user_behavior', undefined, dateRange),
        this.dbService.getAnalytics('ai_interaction', undefined, dateRange),
        this.dbService.getAnalytics('shop_followed', undefined, dateRange),
        this.dbService.getAnalytics('search', undefined, dateRange)
      ]);

      // Process and aggregate data
      const analytics = {
        overview: {
          totalEvents: totalEvents.length,
          productInteractions: productInteractions.length,
          userActions: userBehavior.length,
          aiUsage: aiInteractions.length,
          shopsFollowed: shopFollows.length,
          searches: searchQueries.length
        },
        
        productEngagement: this.analyzeProductEngagement(productInteractions),
        userPatterns: this.analyzeUserPatterns(userBehavior),
        aiUsagePatterns: this.analyzeAIUsage(aiInteractions),
        searchInsights: this.analyzeSearches(searchQueries),
        
        timeline: this.createTimeline(totalEvents),
        
        recommendations: this.generateRecommendations({
          productInteractions,
          userBehavior,
          aiInteractions,
          searchQueries
        })
      };

      return analytics;
    } catch (error) {
      console.error('Failed to get analytics data:', error);
      return null;
    }
  }

  /**
   * Export all data for backup or analysis
   */
  async exportAllData(): Promise<any> {
    try {
      return await this.dbService.exportData();
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  // Private helper methods
  private generateHandle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  private generateAIAnalysis(product: any) {
    const title = product.title?.toLowerCase() || '';
    const description = product.description?.toLowerCase() || '';
    const text = `${title} ${description}`;

    // Simple keyword extraction and categorization
    const keywords = this.extractKeywords(text);
    const category = this.categorizeProduct(text, keywords);

    return {
      category,
      keywords,
      sentiment: this.calculateSentiment(text)
    };
  }

  private extractKeywords(text: string): string[] {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return text
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10); // Top 10 keywords
  }

  private categorizeProduct(text: string, keywords: string[]): string {
    const categories = {
      'fashion': ['clothing', 'shirt', 'dress', 'pants', 'shoes', 'jacket', 'fashion', 'style'],
      'electronics': ['phone', 'computer', 'tablet', 'headphones', 'camera', 'tech'],
      'home': ['furniture', 'decor', 'kitchen', 'bedroom', 'living', 'home'],
      'beauty': ['makeup', 'skincare', 'beauty', 'cosmetics', 'cream', 'serum'],
      'sports': ['fitness', 'exercise', 'sports', 'workout', 'athletic', 'gym']
    };

    for (const [category, categoryKeywords] of Object.entries(categories)) {
      if (categoryKeywords.some(keyword => text.includes(keyword) || keywords.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  private calculateSentiment(text: string): number {
    const positiveWords = ['amazing', 'excellent', 'great', 'best', 'love', 'perfect', 'beautiful', 'quality'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'cheap', 'poor'];

    let score = 0;
    positiveWords.forEach(word => {
      if (text.includes(word)) score += 1;
    });
    negativeWords.forEach(word => {
      if (text.includes(word)) score -= 1;
    });

    return Math.max(-1, Math.min(1, score / 10)); // Normalize to -1 to 1
  }

  private getSessionId(): string {
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', crypto.randomUUID());
    }
    return sessionStorage.getItem('session_id')!;
  }

  private analyzeProductEngagement(interactions: any[]) {
    const engagement = {
      totalInteractions: interactions.length,
      interactionTypes: {} as Record<string, number>,
      topProducts: {} as Record<string, number>,
      engagementRate: 0
    };

    interactions.forEach(interaction => {
      const type = interaction.data.interaction_type;
      engagement.interactionTypes[type] = (engagement.interactionTypes[type] || 0) + 1;
      engagement.topProducts[interaction.entity_id] = (engagement.topProducts[interaction.entity_id] || 0) + 1;
    });

    return engagement;
  }

  private analyzeUserPatterns(behaviors: any[]) {
    const patterns = {
      totalActions: behaviors.length,
      actionTypes: {} as Record<string, number>,
      sessionLengths: [] as number[],
      mostActiveHours: {} as Record<string, number>
    };

    behaviors.forEach(behavior => {
      const type = behavior.data.action_type;
      patterns.actionTypes[type] = (patterns.actionTypes[type] || 0) + 1;
      
      const hour = new Date(behavior.timestamp).getHours();
      patterns.mostActiveHours[hour] = (patterns.mostActiveHours[hour] || 0) + 1;
    });

    return patterns;
  }

  private analyzeAIUsage(aiInteractions: any[]) {
    const usage = {
      totalInteractions: aiInteractions.length,
      successRate: 0,
      averageProcessingTime: 0,
      interactionTypes: {} as Record<string, number>
    };

    let successCount = 0;
    let totalProcessingTime = 0;

    aiInteractions.forEach(interaction => {
      if (interaction.data.success) successCount++;
      if (interaction.data.processing_time) {
        totalProcessingTime += interaction.data.processing_time;
      }
      
      const type = interaction.data.type;
      usage.interactionTypes[type] = (usage.interactionTypes[type] || 0) + 1;
    });

    usage.successRate = aiInteractions.length > 0 ? successCount / aiInteractions.length : 0;
    usage.averageProcessingTime = aiInteractions.length > 0 ? totalProcessingTime / aiInteractions.length : 0;

    return usage;
  }

  private analyzeSearches(searches: any[]) {
    const insights = {
      totalSearches: searches.length,
      topQueries: {} as Record<string, number>,
      averageResultsCount: 0
    };

    let totalResults = 0;

    searches.forEach(search => {
      const query = search.data.query;
      insights.topQueries[query] = (insights.topQueries[query] || 0) + 1;
      
      if (search.data.results_count) {
        totalResults += search.data.results_count;
      }
    });

    insights.averageResultsCount = searches.length > 0 ? totalResults / searches.length : 0;

    return insights;
  }

  private createTimeline(events: any[]) {
    const timeline = {} as Record<string, number>;
    
    events.forEach(event => {
      const date = event.timestamp.split('T')[0];
      timeline[date] = (timeline[date] || 0) + 1;
    });

    return timeline;
  }

  private generateRecommendations(data: any) {
    const recommendations = [];

    // AI usage recommendations
    if (data.aiInteractions.length > 0) {
      const successRate = data.aiInteractions.filter((i: any) => i.data.success).length / data.aiInteractions.length;
      if (successRate < 0.8) {
        recommendations.push({
          type: 'ai_optimization',
          message: 'Consider optimizing AI prompts to improve success rate',
          priority: 'medium'
        });
      }
    }

    // Product engagement recommendations
    if (data.productInteractions.length > 10) {
      recommendations.push({
        type: 'product_insights',
        message: 'High product engagement detected - consider featuring top products',
        priority: 'high'
      });
    }

    // Search optimization
    if (data.searchQueries.length > 5) {
      recommendations.push({
        type: 'search_optimization',
        message: 'Users are actively searching - consider improving search filters',
        priority: 'medium'
      });
    }

    return recommendations;
  }
}
