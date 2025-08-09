import { useState, useEffect } from 'react'
import {
  usePopularProducts, 
  useProductSearch,
  useFollowedShops,
  useFollowedShopsActions,
  useSavedProducts,
  useSavedProductsActions,
  useRecommendedProducts,
  useRecommendedShops,
  type Product,
  type Shop
} from '@shopify/shop-minis-react'

// ✅ Import our custom user ID hooks
import { useUserIdentification } from './hooks/useUserIdentification'
import { useUserAnalytics } from './hooks/useUserAnalytics'
import { setupConsoleHooks } from './utils/console-hooks'

// Simple Product Card Component (since ProductCard import is having issues)
function SimpleProductCard({ product, onClick }: { product: Product; onClick?: () => void }) {
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {product.featuredImage ? (
          <img 
            src={product.featuredImage.url} 
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400 text-sm">🖼️ No Image</div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
          {product.title}
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          {product.shop?.name || 'Unknown Shop'}
        </p>
        {product.price && (
          <p className="text-sm font-semibold text-gray-900">
            {product.price.amount} {product.price.currencyCode}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Shop Mini with Proper User ID Hook Implementation
 */

export function App() {
  // ✅ Use our custom user identification hook
  const userIdentificationHook = useUserIdentification()
  const { 
    getUserId, 
    getUserInfo, 
    currentUser, 
    displayName,
    isLoggedIn,
    sessionId
  } = userIdentificationHook

  // ✅ Use our custom analytics hook
  const userAnalyticsHook = useUserAnalytics()
  const {
    trackProductView,
    trackProductClick,
    trackSearch,
    trackShopInteraction,
    getUserAnalytics,
    exportUserData
  } = userAnalyticsHook

  // ✅ Setup console hooks for testing
  useEffect(() => {
    setupConsoleHooks(userIdentificationHook, userAnalyticsHook)
  }, [userIdentificationHook, userAnalyticsHook])
  
  // ✅ Use NATIVE Shopify hooks
  const { products } = usePopularProducts()
  const { shops: followedShops } = useFollowedShops()
  const { followShop, unfollowShop } = useFollowedShopsActions()
  const { products: savedProducts } = useSavedProducts()
  const { saveProduct, unsaveProduct } = useSavedProductsActions()
  const { products: recommendedProducts } = useRecommendedProducts()
  const { shops: recommendedShops } = useRecommendedShops()
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'following' | 'analytics'>('home')
  
  // ✅ Native product search
  const { 
    products: searchResults, 
    loading: searchLoading, 
    isTyping,
    error: searchError
  } = useProductSearch({
    query: searchQuery,
    first: 20,
    filters: {},
    skip: !searchQuery.trim()
  })

  // Track popular products when they load
  useEffect(() => {
    if (products && products.length > 0) {
      // Track that products were loaded
      products.slice(0, 3).forEach(product => {
        trackProductView(product)
      })
    }
  }, [products, trackProductView])

  // Track search behavior
  useEffect(() => {
    if (searchQuery && searchResults) {
      trackSearch(searchQuery, searchResults.length)
    }
  }, [searchQuery, searchResults, trackSearch])

  // Event handlers with analytics
  const handleProductClick = async (product: Product) => {
    trackProductClick(product, activeTab)
  }

  const handleProductSave = async (product: Product) => {
    try {
      await saveProduct(product.id)
      trackProductClick(product, 'save_action')
    } catch (err) {
      console.error('Failed to save product:', err)
    }
  }

  const handleShopFollow = async (shop: Shop) => {
    try {
      await followShop(shop.id)
      trackShopInteraction(shop, 'follow')
    } catch (err) {
      console.error('Failed to follow shop:', err)
    }
  }

  const handleShopUnfollow = async (shop: Shop) => {
    try {
      await unfollowShop(shop.id)
      trackShopInteraction(shop, 'unfollow')
    } catch (err) {
      console.error('Failed to unfollow shop:', err)
    }
  }

  return (
    <div className="pt-12 px-4 pb-6">
      <h1 className="text-2xl font-bold mb-2 text-center">
        🛍️ Shop Mini with User ID Hooks
      </h1>
      
      {/* ✅ User Info using hooks */}
      <div className="text-center mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
        <p className="text-sm font-medium text-gray-800">
          Welcome, {displayName}! 
          {isLoggedIn ? ' (Logged into Shop)' : ' (Guest)'}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          User ID: {getUserId().slice(0, 20)}...
        </p>
        <p className="text-xs text-gray-500">
          Session: {sessionId.slice(0, 15)}...
          {followedShops?.length ? ` • Following ${followedShops.length} shops` : ''}
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
            onClick={() => setActiveTab(tab.key as any)}
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
                <SimpleProductCard product={product} />
              </div>
            ))}
          </div>
          
          {recommendedProducts && recommendedProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recommended for You</h3>
              <div className="grid grid-cols-2 gap-4">
                {recommendedProducts.slice(0, 4).map(product => (
                  <div key={product.id} onClick={() => handleProductClick(product)}>
                    <SimpleProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
                    <SimpleProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {searchQuery && searchResults && searchResults.length === 0 && !searchLoading && (
            <p className="text-center text-gray-500">No products found for "{searchQuery}"</p>
          )}
        </div>
      )}

      {activeTab === 'following' && (
        <div>
          {/* Followed Shops */}
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
                        <p className="text-sm text-gray-500">{shop.primaryDomain?.url}</p>
                      </div>
                      <button
                        onClick={() => handleShopUnfollow(shop)}
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

          {/* Recommended Shops */}
          {recommendedShops && recommendedShops.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recommended Shops</h3>
              <div className="space-y-3">
                {recommendedShops.slice(0, 3).map(shop => (
                  <div key={shop.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{shop.name}</h4>
                        <p className="text-sm text-gray-600">{shop.primaryDomain?.url}</p>
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
        </div>
      )}

      {/* ✅ Analytics tab using hook data */}
      {activeTab === 'analytics' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">📊 User Analytics Dashboard</h3>
          
          <div className="space-y-4">
            {/* User Info Card */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium mb-2">👤 User Information</h4>
              <div className="text-sm space-y-1">
                <p><strong>Display Name:</strong> {displayName}</p>
                <p><strong>User ID:</strong> {getUserId()}</p>
                <p><strong>Session ID:</strong> {sessionId}</p>
                <p><strong>Logged In:</strong> {isLoggedIn ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Analytics Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800">Your Events</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {getUserAnalytics().events.length}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800">Your Searches</h4>
                <p className="text-2xl font-bold text-green-600">
                  {getUserAnalytics().searches.length}
                </p>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={() => exportUserData()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              📤 Export My Analytics Data
            </button>

            {/* Console Commands */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-bold text-yellow-800 mb-2">💡 Console Commands</h4>
              <p className="text-sm text-yellow-700 mb-2">
                Open browser console (F12) and try these:
              </p>
              <div className="text-xs font-mono bg-yellow-100 p-2 rounded">
                <div>userHooks.getUserId() - Get current user ID</div>
                <div>userHooks.getUserInfo() - Get user information</div>
                <div>userHooks.getAnalytics() - Get user analytics</div>
                <div>userHooks.exportData() - Export user data</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ✅ Make hooks available globally for console testing
if (typeof window !== 'undefined') {
  // We'll set this up when the component mounts
  console.log('🎉 Shop Mini with User ID Hooks loaded!')
  console.log('💡 User identification and analytics hooks are active')
}
