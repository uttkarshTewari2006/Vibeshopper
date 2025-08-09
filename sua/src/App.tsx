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
  useRecentProducts,
  useRecommendedProducts,
  useRecommendedShops
} from '@shopify/shop-minis-react'
import { useFal } from './hooks/useFal'
import { FAL_MODELS } from './lib/fal'
import { useShopifyData, useAITracking, useAnalytics } from './hooks/useShopifyData'
import { DataSyncService } from './services/dataSyncService'

export function App() {
  const {products} = usePopularProducts()
  const [prompt, setPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'following' | 'analytics'>('home')
  const [dataSyncService] = useState(() => DataSyncService.getInstance())
  
  // Shopify Shop Minis hooks
  const { user } = useCurrentUser()
  const { shops: followedShops } = useFollowedShops()
  const { followShop, unfollowShop } = useFollowedShopsActions()
  const { products: savedProducts } = useSavedProducts()
  const { saveProduct, unsaveProduct } = useSavedProductsActions()
  const { products: recentProducts } = useRecentProducts()
  const { products: recommendedProducts } = useRecommendedProducts()
  const { shops: recommendedShops } = useRecommendedShops()
  
  // Product search with proper parameters
  const { 
    products: searchResults, 
    loading: searchLoading, 
    isTyping 
  } = useProductSearch({
    query: searchQuery,
    first: 20,
    filters: {}
  })
  
  // Hooks for database integration
  const { syncProducts, searchProducts } = useShopifyData()
  const { trackAIImageGeneration } = useAITracking()
  const { analytics, isLoading: analyticsLoading } = useAnalytics()
  
  const { generate, isLoading, error } = useFal({
    onSuccess: (result) => {
      if (result.images && result.images.length > 0) {
        setGeneratedImage(result.images[0].url)
      }
    }
  })

  // Initialize data sync service and sync all Shopify data
  useEffect(() => {
    dataSyncService.initialize()
  }, [dataSyncService])

  // Sync and track popular products
  useEffect(() => {
    if (products && products.length > 0) {
      syncProducts(products)
      dataSyncService.trackUserBehavior('page_view', {
        products_count: products.length,
        page: 'home'
      })
    }
  }, [products, syncProducts, dataSyncService])

  // Sync user data
  useEffect(() => {
    if (user) {
      dataSyncService.trackEvent({
        event_type: 'user_loaded',
        entity_type: 'user',
        entity_id: user.id || 'anonymous',
        data: {
          user_id: user.id,
          email: user.email,
          first_name: user.firstName,
          timestamp: new Date().toISOString()
        }
      })
    }
  }, [user, dataSyncService])

  // Sync followed shops data
  useEffect(() => {
    if (followedShops && followedShops.length > 0) {
      followedShops.forEach(shop => {
        dataSyncService.syncShopData(shop, true)
      })
    }
  }, [followedShops, dataSyncService])

  // Track search behavior
  useEffect(() => {
    if (searchQuery && searchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        dataSyncService.trackUserBehavior('search', {
          query: searchQuery,
          results_count: searchResults?.length || 0,
          is_typing: isTyping
        })
      }, 500) // Debounce search tracking

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, searchResults, isTyping, dataSyncService])

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return
    
    const startTime = Date.now()
    
    try {
      const result = await generate(FAL_MODELS.FLUX_SCHNELL, {
        prompt: `Product photography style: ${prompt}`,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
      })

      const processingTime = Date.now() - startTime

      // Track AI image generation
      if (result && result.images && result.images.length > 0) {
        await trackAIImageGeneration(
          prompt,
          result.images[0].url,
          'flux-schnell',
          processingTime / 1000, // Convert to seconds
          {
            width: result.images[0].width,
            height: result.images[0].height,
            seed: result.seed,
            inference_steps: 4
          }
        )

        // Track the event in our analytics
        await dataSyncService.trackEvent({
          event_type: 'ai_image_generated',
          entity_type: 'ai_interaction',
          entity_id: crypto.randomUUID(),
          data: {
            prompt,
            model: 'flux-schnell',
            processing_time: processingTime,
            success: true,
            image_url: result.images[0].url
          }
        })
      }
    } catch (err) {
      const processingTime = Date.now() - startTime
      console.error('Failed to generate image:', err)
      
      // Track failed generation
      await dataSyncService.trackEvent({
        event_type: 'ai_generation_failed',
        entity_type: 'ai_interaction',
        entity_id: crypto.randomUUID(),
        data: {
          prompt,
          model: 'flux-schnell',
          processing_time: processingTime,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      })
    }
  }

  // Handle product interactions
  const handleProductClick = async (product: any) => {
    await dataSyncService.trackProductInteraction(
      product.id,
      'click',
      { product_title: product.title, source: activeTab }
    )
  }

  const handleProductSave = async (product: any) => {
    try {
      await saveProduct(product.id)
      await dataSyncService.trackProductInteraction(
        product.id,
        'favorite',
        { product_title: product.title, action: 'save' }
      )
    } catch (err) {
      console.error('Failed to save product:', err)
    }
  }

  const handleProductUnsave = async (product: any) => {
    try {
      await unsaveProduct(product.id)
      await dataSyncService.trackProductInteraction(
        product.id,
        'favorite',
        { product_title: product.title, action: 'unsave' }
      )
    } catch (err) {
      console.error('Failed to unsave product:', err)
    }
  }

  return (
    <div className="pt-12 px-4 pb-6">
      <h1 className="text-2xl font-bold mb-2 text-center">
        Shop Minis with AI & Analytics
      </h1>
      
      {/* User Info */}
      {user && (
        <div className="text-center mb-4 p-2 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            Welcome, {user.firstName || 'User'}! 
            {followedShops?.length ? ` Following ${followedShops.length} shops` : ''}
          </p>
        </div>
      )}

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
              setActiveTab(tab.key as any)
              dataSyncService.trackUserBehavior('page_view', { tab: tab.key })
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

      {/* AI Image Generator - Always visible */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <h2 className="text-lg font-semibold mb-3 text-purple-800">
          🎨 AI Product Image Generator
        </h2>
        <div className="space-y-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your product (e.g., 'luxury handbag on marble surface')"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleGenerateImage}
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Generating...' : 'Generate Product Image'}
          </button>
          
          {error && (
            <p className="text-red-600 text-sm bg-red-50 p-2 rounded">
              Error: {error.message}
            </p>
          )}
          
          {generatedImage && (
            <div className="mt-4">
              <img
                src={generatedImage}
                alt="Generated product"
                className="w-full h-64 object-cover rounded-lg shadow-md"
              />
            </div>
          )}
        </div>
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
              <p className="text-sm text-gray-500 mt-1">Typing...</p>
            )}
          </div>
          
          {searchLoading && (
            <p className="text-center text-gray-500">Searching...</p>
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
                        <p className="text-sm text-gray-500">{shop.domain}</p>
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
                        <p className="text-sm text-gray-600">{shop.domain}</p>
                      </div>
                      <button
                        onClick={() => followShop(shop.id)}
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

      {activeTab === 'analytics' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">📊 Analytics Dashboard</h3>
          
          {analyticsLoading ? (
            <p className="text-center text-gray-500">Loading analytics...</p>
          ) : analytics ? (
            <div className="space-y-4">
              {/* Overview Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800">Total Events</h4>
                  <p className="text-2xl font-bold text-blue-600">{analytics.totalEvents}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800">AI Interactions</h4>
                  <p className="text-2xl font-bold text-green-600">{analytics.aiInteractionCount}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-800">Products in DB</h4>
                  <p className="text-2xl font-bold text-purple-600">{analytics.productsInDb}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-800">Generated Images</h4>
                  <p className="text-2xl font-bold text-orange-600">{analytics.generatedImagesCount}</p>
                </div>
              </div>

              {/* Event Types */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium mb-3">Event Types</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.eventsByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="text-sm">{type.replace(/_/g, ' ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Searches */}
              {Object.keys(analytics.topSearches).length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium mb-3">Top Searches</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.topSearches)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([query, count]) => (
                        <div key={query} className="flex justify-between">
                          <span className="text-sm">"{query}"</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* AI Model Usage */}
              {Object.keys(analytics.aiModelUsage).length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium mb-3">AI Model Usage</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.aiModelUsage).map(([model, count]) => (
                      <div key={model} className="flex justify-between">
                        <span className="text-sm">{model}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Data Button */}
              <button
                onClick={async () => {
                  const data = await dataSyncService.exportAllData()
                  console.log('Exported data:', data)
                  alert('Data exported to console!')
                }}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                Export All Data
              </button>
            </div>
          ) : (
            <p className="text-center text-gray-500">No analytics data available</p>
          )}
        </div>
      )}
    </div>
  )
}
