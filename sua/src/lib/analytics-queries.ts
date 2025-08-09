import { analyticsDb, AnalyticsService } from './analytics-database';

/**
 * Comprehensive Analytics Query Functions
 * Use these to explore and analyze all gathered data
 */

export class AnalyticsQueries {
  private static instance: AnalyticsQueries;
  private analyticsService: AnalyticsService;

  private constructor() {
    this.analyticsService = AnalyticsService.getInstance();
  }

  public static getInstance(): AnalyticsQueries {
    if (!AnalyticsQueries.instance) {
      AnalyticsQueries.instance = new AnalyticsQueries();
    }
    return AnalyticsQueries.instance;
  }

  // 📊 OVERVIEW QUERIES - See everything at a glance

  /**
   * Get complete overview of all analytics data
   */
  async getCompleteOverview() {
    const [
      productAnalytics,
      shopAnalytics, 
      searchAnalytics,
      aiInteractions,
      aiImages,
      sessions,
      enhancements,
      eventLogs
    ] = await Promise.all([
      analyticsDb.product_analytics.toArray(),
      analyticsDb.shop_analytics.toArray(),
      analyticsDb.search_analytics.toArray(),
      analyticsDb.ai_interactions.toArray(),
      analyticsDb.ai_generated_images.toArray(),
      analyticsDb.user_sessions.toArray(),
      analyticsDb.product_enhancements.toArray(),
      analyticsDb.event_logs.toArray()
    ]);

    return {
      summary: {
        totalProducts: productAnalytics.length,
        totalShops: shopAnalytics.length,
        totalSearches: searchAnalytics.length,
        totalAIInteractions: aiInteractions.length,
        totalAIImages: aiImages.length,
        totalSessions: sessions.length,
        totalEnhancements: enhancements.length,
        totalEvents: eventLogs.length
      },
      data: {
        productAnalytics,
        shopAnalytics,
        searchAnalytics,
        aiInteractions,
        aiImages,
        sessions,
        enhancements,
        eventLogs
      }
    };
  }

  /**
   * Get real-time activity summary
   */
  async getActivitySummary() {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const recentEvents = await analyticsDb.event_logs
      .where('timestamp')
      .above(last24Hours)
      .toArray();

    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentSessions = await analyticsDb.user_sessions
      .where('started_at')
      .above(last24Hours)
      .toArray();

    return {
      last24Hours: {
        totalEvents: recentEvents.length,
        eventsByType,
        activeSessions: recentSessions.length,
        mostActiveHour: this.getMostActiveHour(recentEvents)
      }
    };
  }

  // 🛍️ PRODUCT ANALYTICS QUERIES

  /**
   * Get top performing products
   */
  async getTopProducts(limit = 10) {
    const products = await analyticsDb.product_analytics
      .orderBy('view_count')
      .reverse()
      .limit(limit)
      .toArray();

    return products.map(p => ({
      ...p,
      engagement_rate: p.click_count / Math.max(p.view_count, 1),
      save_rate: p.save_count / Math.max(p.view_count, 1)
    }));
  }

  /**
   * Get product engagement trends
   */
  async getProductTrends() {
    const products = await analyticsDb.product_analytics.toArray();
    
    const trends = products.map(p => ({
      shopify_product_id: p.shopify_product_id,
      total_interactions: p.view_count + p.click_count + p.save_count,
      engagement_score: (p.click_count * 2 + p.save_count * 3) / Math.max(p.view_count, 1),
      last_activity: p.last_viewed,
      days_since_last_view: Math.floor((Date.now() - new Date(p.last_viewed).getTime()) / (1000 * 60 * 60 * 24))
    }));

    return trends.sort((a, b) => b.engagement_score - a.engagement_score);
  }

  // 🔍 SEARCH ANALYTICS QUERIES

  /**
   * Get search insights and popular queries
   */
  async getSearchInsights() {
    const searches = await analyticsDb.search_analytics.toArray();
    
    const queryFrequency = searches.reduce((acc, search) => {
      acc[search.query] = (acc[search.query] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const filterUsage = searches.reduce((acc, search) => {
      Object.keys(search.filters_applied).forEach(filter => {
        acc[filter] = (acc[filter] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const clickThroughRates = searches.map(s => ({
      query: s.query,
      results_count: s.results_count,
      clicks_count: s.clicks_count,
      ctr: s.results_count > 0 ? s.clicks_count / s.results_count : 0
    }));

    return {
      topQueries: Object.entries(queryFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20),
      filterUsage,
      averageCTR: clickThroughRates.reduce((sum, s) => sum + s.ctr, 0) / clickThroughRates.length,
      totalSearches: searches.length,
      uniqueQueries: Object.keys(queryFrequency).length
    };
  }

  /**
   * Get search performance by time
   */
  async getSearchPerformanceByTime() {
    const searches = await analyticsDb.search_analytics.toArray();
    
    const hourlyData = searches.reduce((acc, search) => {
      const hour = new Date(search.timestamp).getHours();
      if (!acc[hour]) {
        acc[hour] = { searches: 0, totalResults: 0, totalClicks: 0 };
      }
      acc[hour].searches++;
      acc[hour].totalResults += search.results_count;
      acc[hour].totalClicks += search.clicks_count;
      return acc;
    }, {} as Record<number, { searches: number; totalResults: number; totalClicks: number }>);

    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      searches: data.searches,
      avgResults: data.totalResults / data.searches,
      avgClicks: data.totalClicks / data.searches,
      ctr: data.totalResults > 0 ? data.totalClicks / data.totalResults : 0
    }));
  }

  // 🤖 AI ANALYTICS QUERIES

  /**
   * Get AI usage statistics
   */
  async getAIAnalytics() {
    const [interactions, images] = await Promise.all([
      analyticsDb.ai_interactions.toArray(),
      analyticsDb.ai_generated_images.toArray()
    ]);

    const modelUsage = images.reduce((acc, img) => {
      acc[img.model_used] = (acc[img.model_used] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const successRate = interactions.length > 0 
      ? interactions.filter(i => i.success).length / interactions.length 
      : 0;

    const avgProcessingTime = interactions.length > 0
      ? interactions.reduce((sum, i) => sum + i.processing_time, 0) / interactions.length
      : 0;

    const promptAnalysis = images.reduce((acc, img) => {
      const wordCount = img.prompt.split(' ').length;
      const category = wordCount < 5 ? 'short' : wordCount < 10 ? 'medium' : 'long';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalInteractions: interactions.length,
      totalImages: images.length,
      successRate: successRate * 100,
      avgProcessingTime,
      modelUsage,
      promptAnalysis,
      dailyGeneration: this.getDailyAIUsage(images)
    };
  }

  /**
   * Get AI prompt effectiveness
   */
  async getPromptEffectiveness() {
    const images = await analyticsDb.ai_generated_images.toArray();
    
    return images.map(img => ({
      prompt: img.prompt,
      processing_time: img.generation_time,
      model: img.model_used,
      prompt_length: img.prompt.length,
      word_count: img.prompt.split(' ').length,
      created_at: img.created_at
    })).sort((a, b) => a.processing_time - b.processing_time);
  }

  // 🏪 SHOP ANALYTICS QUERIES

  /**
   * Get shop engagement data
   */
  async getShopEngagement() {
    const shops = await analyticsDb.shop_analytics.toArray();
    
    return shops.map(shop => ({
      ...shop,
      engagement_score: (shop.follow_count * 3 + shop.visit_count) / Math.max(shop.visit_count, 1),
      retention_rate: shop.unfollow_count > 0 ? 1 - (shop.unfollow_count / shop.follow_count) : 1,
      days_since_last_visit: Math.floor((Date.now() - new Date(shop.last_visited).getTime()) / (1000 * 60 * 60 * 24))
    })).sort((a, b) => b.engagement_score - a.engagement_score);
  }

  // 📈 USER SESSION ANALYTICS

  /**
   * Get user session insights
   */
  async getSessionInsights() {
    const sessions = await analyticsDb.user_sessions.toArray();
    
    const sessionData = sessions.map(session => {
      const duration = session.ended_at 
        ? new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()
        : Date.now() - new Date(session.started_at).getTime();
      
      return {
        ...session,
        duration_minutes: duration / (1000 * 60),
        engagement_rate: (session.products_clicked / Math.max(session.products_viewed, 1)) * 100
      };
    });

    const avgSessionLength = sessionData.reduce((sum, s) => sum + s.duration_minutes, 0) / sessionData.length;
    const avgPageViews = sessionData.reduce((sum, s) => sum + s.page_views, 0) / sessionData.length;
    const avgProductViews = sessionData.reduce((sum, s) => sum + s.products_viewed, 0) / sessionData.length;

    return {
      totalSessions: sessions.length,
      avgSessionLength,
      avgPageViews,
      avgProductViews,
      activeSessions: sessions.filter(s => !s.ended_at).length,
      sessionData
    };
  }

  // 🎯 EVENT STREAM QUERIES

  /**
   * Get real-time event stream
   */
  async getEventStream(limit = 100) {
    return await analyticsDb.event_logs
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Get events by type
   */
  async getEventsByType(eventType: string) {
    return await analyticsDb.event_logs
      .where('event_type')
      .equals(eventType)
      .toArray();
  }

  /**
   * Get user journey for a session
   */
  async getUserJourney(sessionId: string) {
    const events = await analyticsDb.event_logs
      .where('session_id')
      .equals(sessionId)
      .sortBy('timestamp');

    return events.map((event, index) => ({
      step: index + 1,
      ...event,
      time_from_start: index > 0 
        ? new Date(event.timestamp).getTime() - new Date(events[0].timestamp).getTime()
        : 0
    }));
  }

  // 🔧 UTILITY METHODS

  private getMostActiveHour(events: any[]) {
    const hourCounts = events.reduce((acc, event) => {
      const hour = new Date(event.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 0;
  }

  private getDailyAIUsage(images: any[]) {
    return images.reduce((acc, img) => {
      const date = img.created_at.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // 📤 EXPORT FUNCTIONS

  /**
   * Export all data as JSON
   */
  async exportAllData() {
    return await this.analyticsService.exportAllData();
  }

  /**
   * Export specific data type
   */
  async exportDataType(type: 'products' | 'shops' | 'searches' | 'ai' | 'sessions' | 'events') {
    switch (type) {
      case 'products':
        return await analyticsDb.product_analytics.toArray();
      case 'shops':
        return await analyticsDb.shop_analytics.toArray();
      case 'searches':
        return await analyticsDb.search_analytics.toArray();
      case 'ai':
        return {
          interactions: await analyticsDb.ai_interactions.toArray(),
          images: await analyticsDb.ai_generated_images.toArray()
        };
      case 'sessions':
        return await analyticsDb.user_sessions.toArray();
      case 'events':
        return await analyticsDb.event_logs.toArray();
      default:
        throw new Error(`Unknown data type: ${type}`);
    }
  }
}
