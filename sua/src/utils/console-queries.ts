import { AnalyticsQueries } from '../lib/analytics-queries';

/**
 * Console Utility Functions for Querying Analytics Data
 * 
 * Usage in browser console:
 * 1. Import this in your app
 * 2. Open browser developer tools
 * 3. Run commands like: window.analytics.getAllData()
 */

class ConsoleAnalytics {
  private queries: AnalyticsQueries;

  constructor() {
    this.queries = AnalyticsQueries.getInstance();
  }

  // 🔍 QUICK QUERY FUNCTIONS

  /**
   * Get all analytics data (use with caution - large output)
   */
  async getAllData() {
    console.group('📊 ALL ANALYTICS DATA');
    const data = await this.queries.getCompleteOverview();
    console.log('Summary:', data.summary);
    console.log('Product Analytics:', data.data.productAnalytics);
    console.log('Search Analytics:', data.data.searchAnalytics);
    console.log('AI Interactions:', data.data.aiInteractions);
    console.log('Shop Analytics:', data.data.shopAnalytics);
    console.log('User Sessions:', data.data.sessions);
    console.log('Event Logs:', data.data.eventLogs);
    console.groupEnd();
    return data;
  }

  /**
   * Get quick overview/summary
   */
  async getOverview() {
    console.group('📈 ANALYTICS OVERVIEW');
    const data = await this.queries.getCompleteOverview();
    console.table(data.summary);
    
    const activity = await this.queries.getActivitySummary();
    console.log('Recent Activity (24h):', activity.last24Hours);
    console.groupEnd();
    return { summary: data.summary, activity };
  }

  /**
   * Get top products with engagement metrics
   */
  async getTopProducts(limit = 10) {
    console.group(`🛍️ TOP ${limit} PRODUCTS`);
    const products = await this.queries.getTopProducts(limit);
    console.table(products.map(p => ({
      product_id: p.shopify_product_id.slice(0, 12) + '...',
      views: p.view_count,
      clicks: p.click_count,
      saves: p.save_count,
      engagement_rate: `${(p.engagement_rate * 100).toFixed(1)}%`,
      save_rate: `${(p.save_rate * 100).toFixed(1)}%`,
      last_viewed: p.last_viewed.split('T')[0]
    })));
    console.groupEnd();
    return products;
  }

  /**
   * Get search insights
   */
  async getSearchData() {
    console.group('🔍 SEARCH ANALYTICS');
    const insights = await this.queries.getSearchInsights();
    
    console.log('📊 Search Statistics:');
    console.table({
      total_searches: insights.totalSearches,
      unique_queries: insights.uniqueQueries,
      average_ctr: `${(insights.averageCTR * 100).toFixed(2)}%`
    });
    
    console.log('🔥 Top Search Queries:');
    console.table(Object.fromEntries(insights.topQueries));
    
    console.log('🎛️ Filter Usage:');
    console.table(insights.filterUsage);
    
    console.groupEnd();
    return insights;
  }

  /**
   * Get AI analytics
   */
  async getAIData() {
    console.group('🤖 AI ANALYTICS');
    const ai = await this.queries.getAIAnalytics();
    
    console.log('📊 AI Statistics:');
    console.table({
      total_interactions: ai.totalInteractions,
      total_images: ai.totalImages,
      success_rate: `${ai.successRate.toFixed(1)}%`,
      avg_processing_time: `${ai.avgProcessingTime.toFixed(2)}s`
    });
    
    console.log('🔧 Model Usage:');
    console.table(ai.modelUsage);
    
    console.log('📝 Prompt Analysis:');
    console.table(ai.promptAnalysis);
    
    console.groupEnd();
    return ai;
  }

  /**
   * Get recent events
   */
  async getRecentEvents(limit = 20) {
    console.group(`📝 RECENT ${limit} EVENTS`);
    const events = await this.queries.getEventStream(limit);
    
    console.table(events.map(e => ({
      timestamp: new Date(e.timestamp).toLocaleTimeString(),
      event: e.event_type,
      entity: e.entity_type,
      entity_id: e.entity_id.slice(0, 8) + '...',
      data_keys: Object.keys(e.data).join(', ')
    })));
    
    console.groupEnd();
    return events;
  }

  /**
   * Get user sessions
   */
  async getSessionData() {
    console.group('👤 USER SESSIONS');
    const sessions = await this.queries.getSessionInsights();
    
    console.log('📊 Session Summary:');
    console.table({
      total_sessions: sessions.totalSessions,
      active_sessions: sessions.activeSessions,
      avg_session_length: `${sessions.avgSessionLength.toFixed(1)} min`,
      avg_page_views: sessions.avgPageViews.toFixed(1),
      avg_product_views: sessions.avgProductViews.toFixed(1)
    });
    
    console.log('Recent Sessions:');
    console.table(sessions.sessionData.slice(0, 10).map(s => ({
      session_id: s.id.slice(0, 8) + '...',
      duration: `${s.duration_minutes.toFixed(1)} min`,
      page_views: s.page_views,
      products_viewed: s.products_viewed,
      products_clicked: s.products_clicked,
      ai_interactions: s.ai_interactions,
      engagement_rate: `${s.engagement_rate.toFixed(1)}%`
    })));
    
    console.groupEnd();
    return sessions;
  }

  /**
   * Search for specific product analytics
   */
  async findProduct(productId: string) {
    console.group(`🔍 PRODUCT: ${productId}`);
    const analytics = await this.queries.getProductAnalytics(productId);
    
    if (analytics) {
      console.table(analytics);
      
      // Get related events
      const events = await this.queries.getEventsByType('product_view');
      const productEvents = events.filter(e => e.entity_id === productId);
      console.log('Related Events:', productEvents);
    } else {
      console.log('❌ No analytics found for this product ID');
    }
    
    console.groupEnd();
    return analytics;
  }

  /**
   * Get user journey for a session
   */
  async getJourney(sessionId: string) {
    console.group(`🗺️ USER JOURNEY: ${sessionId}`);
    const journey = await this.queries.getUserJourney(sessionId);
    
    console.table(journey.map(step => ({
      step: step.step,
      event: step.event_type,
      entity: step.entity_type,
      time_from_start: `${(step.time_from_start / 1000).toFixed(1)}s`,
      timestamp: new Date(step.timestamp).toLocaleTimeString()
    })));
    
    console.groupEnd();
    return journey;
  }

  /**
   * Export data to console as JSON
   */
  async exportToConsole(type?: string) {
    console.group(`📤 EXPORT ${type?.toUpperCase() || 'ALL'} DATA`);
    
    const data = type 
      ? await this.queries.exportDataType(type as any)
      : await this.queries.exportAllData();
    
    console.log('📊 Exported Data (copy from below):');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('💡 Tips:');
    console.log('- Right-click on the JSON above and "Copy object"');
    console.log('- Or use JSON.stringify(data) to get string format');
    console.log('- Available types: products, shops, searches, ai, sessions, events');
    
    console.groupEnd();
    return data;
  }

  /**
   * Help - show available commands
   */
  help() {
    console.group('💡 ANALYTICS CONSOLE HELP');
    console.log('Available commands:');
    console.log('');
    console.log('📊 General:');
    console.log('  analytics.getAllData()           - Get all analytics data');
    console.log('  analytics.getOverview()          - Get summary overview');
    console.log('  analytics.help()                 - Show this help');
    console.log('');
    console.log('🛍️ Products:');
    console.log('  analytics.getTopProducts(10)     - Get top 10 products');
    console.log('  analytics.findProduct(id)        - Find specific product');
    console.log('');
    console.log('🔍 Searches:');
    console.log('  analytics.getSearchData()        - Get search analytics');
    console.log('');
    console.log('🤖 AI:');
    console.log('  analytics.getAIData()            - Get AI analytics');
    console.log('');
    console.log('📝 Events:');
    console.log('  analytics.getRecentEvents(20)    - Get recent 20 events');
    console.log('  analytics.getJourney(sessionId)  - Get user journey');
    console.log('');
    console.log('👤 Sessions:');
    console.log('  analytics.getSessionData()       - Get session analytics');
    console.log('');
    console.log('📤 Export:');
    console.log('  analytics.exportToConsole()      - Export all data');
    console.log('  analytics.exportToConsole("products") - Export specific type');
    console.log('');
    console.log('Example usage:');
    console.log('  analytics.getTopProducts(5).then(data => console.table(data))');
    console.groupEnd();
  }
}

// Create global instance
const consoleAnalytics = new ConsoleAnalytics();

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).analytics = consoleAnalytics;
  console.log('🎉 Analytics console utilities loaded!');
  console.log('Type "analytics.help()" to see available commands');
}

export { consoleAnalytics };
