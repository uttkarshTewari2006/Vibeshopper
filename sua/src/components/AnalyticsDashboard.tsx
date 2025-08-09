import React, { useState, useEffect } from 'react';
import { AnalyticsQueries } from '../lib/analytics-queries';

/**
 * Comprehensive Analytics Dashboard
 * View all gathered analytics data with interactive queries
 */

export function AnalyticsDashboard() {
  const [queries] = useState(() => AnalyticsQueries.getInstance());
  const [activeView, setActiveView] = useState<'overview' | 'products' | 'searches' | 'ai' | 'shops' | 'sessions' | 'events'>('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load data based on active view
  useEffect(() => {
    loadData();
  }, [activeView]);

  const loadData = async () => {
    setLoading(true);
    try {
      let result;
      switch (activeView) {
        case 'overview':
          result = await queries.getCompleteOverview();
          break;
        case 'products':
          result = {
            topProducts: await queries.getTopProducts(20),
            trends: await queries.getProductTrends()
          };
          break;
        case 'searches':
          result = {
            insights: await queries.getSearchInsights(),
            performance: await queries.getSearchPerformanceByTime()
          };
          break;
        case 'ai':
          result = {
            analytics: await queries.getAIAnalytics(),
            prompts: await queries.getPromptEffectiveness()
          };
          break;
        case 'shops':
          result = await queries.getShopEngagement();
          break;
        case 'sessions':
          result = await queries.getSessionInsights();
          break;
        case 'events':
          result = await queries.getEventStream(50);
          break;
      }
      setData(result);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type?: string) => {
    try {
      const exportedData = type 
        ? await queries.exportDataType(type as any)
        : await queries.exportAllData();
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(exportedData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${type || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const viewButtons = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'products', label: 'Products', icon: '🛍️' },
    { key: 'searches', label: 'Searches', icon: '🔍' },
    { key: 'ai', label: 'AI Analytics', icon: '🤖' },
    { key: 'shops', label: 'Shops', icon: '🏪' },
    { key: 'sessions', label: 'Sessions', icon: '👤' },
    { key: 'events', label: 'Events', icon: '📝' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">📈 Analytics Dashboard</h1>
        
        {/* View Navigation */}
        <div className="flex flex-wrap gap-2 mb-4">
          {viewButtons.map(view => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === view.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {view.icon} {view.label}
            </button>
          ))}
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => exportData()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            📤 Export All Data
          </button>
          <button
            onClick={() => exportData(activeView)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📥 Export {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-lg">Loading analytics data...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview */}
          {activeView === 'overview' && data && (
            <div>
              <h2 className="text-2xl font-bold mb-4">📊 Complete Overview</h2>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800">Products Tracked</h3>
                  <p className="text-2xl font-bold text-blue-600">{data.summary.totalProducts}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800">Total Searches</h3>
                  <p className="text-2xl font-bold text-green-600">{data.summary.totalSearches}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-800">AI Interactions</h3>
                  <p className="text-2xl font-bold text-purple-600">{data.summary.totalAIInteractions}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-medium text-orange-800">Total Events</h3>
                  <p className="text-2xl font-bold text-orange-600">{data.summary.totalEvents}</p>
                </div>
              </div>

              {/* Raw Data Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-bold mb-2">📊 Recent Product Analytics</h3>
                  <div className="max-h-60 overflow-y-auto">
                    <pre className="text-xs">{JSON.stringify(data.data.productAnalytics.slice(0, 5), null, 2)}</pre>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-bold mb-2">🔍 Recent Searches</h3>
                  <div className="max-h-60 overflow-y-auto">
                    <pre className="text-xs">{JSON.stringify(data.data.searchAnalytics.slice(0, 5), null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Analytics */}
          {activeView === 'products' && data && (
            <div>
              <h2 className="text-2xl font-bold mb-4">🛍️ Product Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-bold mb-4">Top Performing Products</h3>
                  <div className="space-y-2">
                    {data.topProducts.slice(0, 10).map((product: any, index: number) => (
                      <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">#{index + 1}</span>
                          <span className="ml-2 text-sm text-gray-600">{product.shopify_product_id.slice(0, 8)}...</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{product.view_count} views</div>
                          <div className="text-xs text-gray-500">{(product.engagement_rate * 100).toFixed(1)}% CTR</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-bold mb-4">Product Trends</h3>
                  <div className="max-h-80 overflow-y-auto">
                    <pre className="text-xs">{JSON.stringify(data.trends.slice(0, 10), null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Analytics */}
          {activeView === 'searches' && data && (
            <div>
              <h2 className="text-2xl font-bold mb-4">🔍 Search Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-bold mb-4">Top Search Queries</h3>
                  <div className="space-y-2">
                    {data.insights.topQueries.slice(0, 15).map(([query, count]: [string, number]) => (
                      <div key={query} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">"{query}"</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-bold mb-4">Search Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Searches:</span>
                      <span className="font-medium">{data.insights.totalSearches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unique Queries:</span>
                      <span className="font-medium">{data.insights.uniqueQueries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average CTR:</span>
                      <span className="font-medium">{(data.insights.averageCTR * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Analytics */}
          {activeView === 'ai' && data && (
            <div>
              <h2 className="text-2xl font-bold mb-4">🤖 AI Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-bold mb-4">AI Usage Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Images Generated:</span>
                      <span className="font-medium">{data.analytics.totalImages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-medium">{data.analytics.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Processing Time:</span>
                      <span className="font-medium">{data.analytics.avgProcessingTime.toFixed(2)}s</span>
                    </div>
                  </div>
                  
                  <h4 className="font-bold mt-4 mb-2">Model Usage</h4>
                  <div className="space-y-2">
                    {Object.entries(data.analytics.modelUsage).map(([model, count]) => (
                      <div key={model} className="flex justify-between">
                        <span className="text-sm">{model}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-bold mb-4">Recent Prompts</h3>
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {data.prompts.slice(0, 10).map((prompt: any, index: number) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="font-medium">"{prompt.prompt}"</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {prompt.processing_time.toFixed(2)}s • {prompt.word_count} words • {prompt.model}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Events Stream */}
          {activeView === 'events' && data && (
            <div>
              <h2 className="text-2xl font-bold mb-4">📝 Recent Events</h2>
              
              <div className="bg-white rounded-lg border">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-3 text-left">Timestamp</th>
                        <th className="p-3 text-left">Event Type</th>
                        <th className="p-3 text-left">Entity</th>
                        <th className="p-3 text-left">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((event: any) => (
                        <tr key={event.id} className="border-t">
                          <td className="p-3">{new Date(event.timestamp).toLocaleString()}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {event.event_type}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-gray-600">{event.entity_id.slice(0, 8)}...</td>
                          <td className="p-3">
                            <pre className="text-xs max-w-md overflow-hidden">
                              {JSON.stringify(event.data, null, 1).slice(0, 100)}...
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Console Output Helper */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-bold text-yellow-800 mb-2">💡 Console Queries</h3>
            <p className="text-sm text-yellow-700 mb-2">
              Open browser console and use these commands to query data:
            </p>
            <div className="text-xs font-mono bg-yellow-100 p-2 rounded">
              <div>// Get analytics queries instance</div>
              <div>const queries = window.analyticsQueries;</div>
              <div></div>
              <div>// Query examples:</div>
              <div>queries.getCompleteOverview().then(console.log);</div>
              <div>queries.getTopProducts(10).then(console.log);</div>
              <div>queries.getSearchInsights().then(console.log);</div>
              <div>queries.getAIAnalytics().then(console.log);</div>
              <div>queries.exportAllData().then(console.log);</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Make queries available globally for console access
if (typeof window !== 'undefined') {
  (window as any).analyticsQueries = AnalyticsQueries.getInstance();
}
