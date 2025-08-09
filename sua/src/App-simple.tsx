import { useState, useEffect } from 'react'
import {
  usePopularProducts, 
  ProductCard, 
  useProductSearch,
  useFollowedShops,
  useFollowedShopsActions,
  useCurrentUser,
  useSavedProducts,
  useSavedProductsActions,
  useRecommendedProducts,
  useRecommendedShops,
  type Product,
  type Shop
} from '@shopify/shop-minis-react'

/**
 * Simplified Shop Mini with Analytics Tracking
 * Works within Shop Minis dependency constraints
 */

// Simple in-memory analytics storage (since we can't use IndexedDB)
interface SimpleAnalytics {
  productViews: Record<string, number>;
  productClicks: Record<string, number>;
  searches: Array<{query: string; timestamp: string; resultsCount: number}>;
  events: Array<{type: string; data: any; timestamp: string}>;
  aiGenerations: Array<{prompt: string; timestamp: string; success: boolean}>;
}

const analytics: SimpleAnalytics = {
  productViews: {},
  productClicks: {},
  searches: [],
  events: [],
  aiGenerations: []
};

// ✅ User ID generation functions
const getUserSessionId = (): string => {
  let sessionId = sessionStorage.getItem('user_session_id');
  if (!sessionId) {
    sessionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('user_session_id', sessionId);
  }
  return sessionId;
};

// Simple analytics functions with user ID tracking
const trackEvent = (type: string, data: any) => {
  const userId = getUserSessionId();
  const eventData = {
    type,
    userId,
    data,
    timestamp: new Date().toISOString()
  };
  analytics.events.push(eventData);
  console.log(`📊 Event tracked for user ${userId}: ${type}`, data);
};

const trackProductView = (product: Product) => {
  analytics.productViews[product.id] = (analytics.productViews[product.id] || 0) + 1;
  trackEvent('product_view', { 
    productId: product.id, 
    title: product.title,
    viewCount: analytics.productViews[product.id]
  });
};

const trackProductClick = (product: Product, source: string) => {
  analytics.productClicks[product.id] = (analytics.productClicks[product.id] || 0) + 1;
  trackEvent('product_click', { 
    productId: product.id, 
    title: product.title,
    source,
    clickCount: analytics.productClicks[product.id]
  });
};

const trackSearch = (query: string, resultsCount: number) => {
  const searchData = { query, timestamp: new Date().toISOString(), resultsCount };
  analytics.searches.push(searchData);
  trackEvent('search', searchData);
};

const trackAIGeneration = (prompt: string, success: boolean) => {
  const aiData = { prompt, timestamp: new Date().toISOString(), success };
  analytics.aiGenerations.push(aiData);
  trackEvent('ai_generation', aiData);
};

// Make analytics and user utils available globally for console access
if (typeof window !== 'undefined') {
  (window as any).simpleAnalytics = {
    getData: () => analytics,
    getProductViews: () => analytics.productViews,
    getSearches: () => analytics.searches,
    getEvents: () => analytics.events,
    getTopProducts: () => {
      return Object.entries(analytics.productViews)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([id, views]) => ({ productId: id, views }));
    },
    getSearchInsights: () => {
      const queryMap = analytics.searches.reduce((acc, search) => {
        acc[search.query] = (acc[search.query] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(queryMap).sort(([,a], [,b]) => b - a);
    },
    exportData: () => {
      console.log('📊 Complete Analytics Data:');
      console.log(JSON.stringify(analytics, null, 2));
      return analytics;
    },
    help: () => {
      console.log('📊 Simple Analytics Commands:');
      console.log('simpleAnalytics.getData() - Get all data');
      console.log('simpleAnalytics.getTopProducts() - Get top viewed products');
      console.log('simpleAnalytics.getSearchInsights() - Get search data');
      console.log('simpleAnalytics.exportData() - Export all data');
      console.log('userUtils.getUserId() - Get current user session ID');
      console.log('userUtils.showUserInfo() - Show user information');
    }
  };

  // ✅ User utilities for console access
  (window as any).userUtils = {
    getUserId: getUserSessionId,
    showUserInfo: () => {
      const userId = getUserSessionId();
      console.log('📊 User Information:');
      console.log('Session ID:', userId);
      console.log('Events for this user:', analytics.events.filter(e => e.userId === userId).length);
    },
    clearUserData: () => {
      sessionStorage.removeItem('user_session_id');
      console.log('✅ User session data cleared. New ID will be generated on next action.');
    },
    getUserEvents: () => {
      const userId = getUserSessionId();
      return analytics.events.filter(e => e.userId === userId);
    },
    help: () => {
      console.log('👤 User Utilities Commands:');
      console.log('userUtils.getUserId() - Get current user session ID');
      console.log('userUtils.showUserInfo() - Show user information');
      console.log('userUtils.clearUserData() - Clear session and generate new ID');
      console.log('userUtils.getUserEvents() - Get events for current user');
    }
  };
}

export function App() {
  // ✅ Use NATIVE Shopify hooks (no custom duplication)
  const { products } = usePopularProducts()
  const { currentUser } = useCurrentUser() // ✅ Fixed: use currentUser, not user
  const { shops: followedShops } = useFollowedShops()
  const { followShop, unfollowShop } = useFollowedShopsActions()
  const { products: savedProducts } = useSavedProducts()
  const { saveProduct, unsaveProduct } = useSavedProductsActions()
  const { products: recommendedProducts } = useRecommendedProducts()
  const { shops: recommendedShops } = useRecommendedShops()
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'following' | 'analytics'>('home')
  
  // ✅ Use NATIVE useProductSearch (no custom implementation)
  const { 
    products: searchResults, 
    loading: searchLoading, 
    isTyping,
    error: searchError,
    fetchMore,
    hasNextPage
  } = useProductSearch({
    query: searchQuery,
    first: 20,
    filters: {},
    skip: !searchQuery.trim() // Don't search empty queries
  })

  // Track popular products views when they load
  useEffect(() => {
    if (products && products.length > 0) {
      trackEvent('products_loaded', { count: products.length });
      // Track view for first few products (simulating user seeing them)
      products.slice(0, 3).forEach(product => {
        trackProductView(product);
      });
    }
  }, [products]);

  // Track search behavior
  useEffect(() => {
    if (searchQuery && searchResults) {
      trackSearch(searchQuery, searchResults.length);
    }
  }, [searchQuery, searchResults]);

  const handleProductClick = async (product: Product) => {
    trackProductClick(product, activeTab);
  };

  const handleProductSave = async (product: Product) => {
    try {
      await saveProduct(product.id);
      trackEvent('product_save', { productId: product.id, title: product.title });
    } catch (err) {
      console.error('Failed to save product:', err);
    }
  };

  const handleShopFollow = async (shop: Shop) => {
    try {
      await followShop(shop.id);
      trackEvent('shop_follow', { shopId: shop.id, name: shop.name });
    } catch (err) {
      console.error('Failed to follow shop:', err);
    }
  };

  return (
    <div className="pt-12 px-4 pb-6">
      <h1 className="text-2xl font-bold mb-2 text-center">
        🛍️ Shop Mini with Simple Analytics
      </h1>
      
      {/* User Info */}
      <div className="text-center mb-4 p-2 bg-green-50 rounded-lg">
        <p className="text-sm text-green-800">
          Welcome, {currentUser?.displayName || 'User'}! 
          {followedShops?.length ? ` Following ${followedShops.length} shops` : ''}
        </p>
        <p className="text-xs text-green-600">
          Session ID: {getUserSessionId().slice(0, 12)}...
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'home', label: 'Home', icon: '🏠' },
          { key: 'search', label: 'Search', icon: '🔍' },
          { key: 'following', label: 'Following', icon: '❤️' },
          { key: 'analytics', label: 'Analytics', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as any);
              trackEvent('tab_change', { tab: tab.key });
            }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'home' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Popular Products</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {products?.map(product => (
              <div key={product.id} onClick={() => handleProductClick(product)}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          
          {recommendedProducts && recommendedProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recommended for You</h3>
              <div className="grid grid-cols-2 gap-4">
                {recommendedProducts.slice(0, 4).map(product => (
                  <div key={product.id} onClick={() => handleProductClick(product)}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ IMPROVED SEARCH using native useProductSearch */}
      {activeTab === 'search' && (
        <div>
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {isTyping && (
              <p className="text-sm text-gray-500 mt-1">⌨️ Typing...</p>
            )}
          </div>
          
          {searchError && (
            <p className="text-red-600 text-sm bg-red-50 p-2 rounded mb-4">
              Search error: {searchError.message}
            </p>
          )}
          
          {searchLoading && (
            <p className="text-center text-gray-500">🔍 Searching...</p>
          )}
          
          {searchResults && searchResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Search Results ({searchResults.length})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {searchResults.map(product => (
                  <div key={product.id} onClick={() => handleProductClick(product)}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
              
              {/* ✅ Native pagination */}
              {hasNextPage && (
                <button
                  onClick={fetchMore}
                  className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Load More Products
                </button>
              )}
            </div>
          )}
          
          {searchQuery && searchResults && searchResults.length === 0 && !searchLoading && (
            <p className="text-center text-gray-500">No products found for "{searchQuery}"</p>
          )}
        </div>
      )}

      {activeTab === 'following' && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Followed Shops ({followedShops?.length || 0})
            </h3>
            {followedShops && followedShops.length > 0 ? (
              <div className="space-y-3">
                {followedShops.map(shop => (
                  <div key={shop.id} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{shop.name}</h4>
                        <p className="text-sm text-gray-500">{shop.primaryDomain.url}</p>
                      </div>
                      <button
                        onClick={() => unfollowShop(shop.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Unfollow
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">Not following any shops yet</p>
            )}
          </div>

          {recommendedShops && recommendedShops.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recommended Shops</h3>
              <div className="space-y-3">
                {recommendedShops.slice(0, 3).map(shop => (
                  <div key={shop.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{shop.name}</h4>
                        <p className="text-sm text-gray-600">{shop.primaryDomain.url}</p>
                      </div>
                      <button
                        onClick={() => handleShopFollow(shop)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Follow
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {savedProducts && savedProducts.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">
                Saved Products ({savedProducts.length})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {savedProducts.slice(0, 4).map(product => (
                  <div key={product.id} onClick={() => handleProductClick(product)}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ Simple Analytics Dashboard */}
      {activeTab === 'analytics' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">📊 Simple Analytics</h3>
          
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800">Product Views</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {Object.keys(analytics.productViews).length}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800">Total Searches</h4>
                <p className="text-2xl font-bold text-green-600">
                  {analytics.searches.length}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-800">Total Events</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {analytics.events.length}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-800">AI Generations</h4>
                <p className="text-2xl font-bold text-orange-600">
                  {analytics.aiGenerations.length}
                </p>
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium mb-3">Recent Events</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {analytics.events.slice(-10).reverse().map((event, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">{event.type}</span>
                      <span className="text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-gray-600 text-xs mt-1">
                      {JSON.stringify(event.data, null, 0).slice(0, 100)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Console Commands */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-bold text-yellow-800 mb-2">💡 Console Commands</h4>
              <p className="text-sm text-yellow-700 mb-2">
                Open browser console (F12) and try these:
              </p>
              <div className="text-xs font-mono bg-yellow-100 p-2 rounded">
                <div>simpleAnalytics.help() - Show commands</div>
                <div>simpleAnalytics.getData() - Get all data</div>
                <div>simpleAnalytics.getTopProducts() - Top products</div>
                <div>simpleAnalytics.exportData() - Export all data</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Initialize console message
if (typeof window !== 'undefined') {
  console.log('🎉 Simple Analytics with User ID tracking loaded!');
  console.log('📊 Analytics: simpleAnalytics.help()');
  console.log('👤 User Utils: userUtils.help()');
}
