import { useState, useCallback, useEffect } from 'react'
import { useUserIdentification } from './useUserIdentification'
import type { Product, Shop } from '@shopify/shop-minis-react'

/**
 * Hook for user-specific analytics tracking
 * Integrates with user identification for comprehensive tracking
 */

interface AnalyticsEvent {
  id: string;
  type: string;
  userId: string;
  data: any;
  timestamp: string;
  sessionId: string;
}

interface UserAnalytics {
  productViews: Record<string, number>;
  productClicks: Record<string, number>;
  searches: Array<{
    userId: string;
    query: string;
    timestamp: string;
    resultsCount: number;
    sessionId: string;
  }>;
  events: AnalyticsEvent[];
  userSessions: Record<string, {
    startTime: string;
    lastActivity: string;
    eventCount: number;
    userId: string;
  }>;
}

// In-memory analytics storage
const analytics: UserAnalytics = {
  productViews: {},
  productClicks: {},
  searches: [],
  events: [],
  userSessions: {}
}

export function useUserAnalytics() {
  const { getUserId, getUserInfo, sessionId, currentUser } = useUserIdentification()
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize user session tracking
  useEffect(() => {
    if (sessionId && !isInitialized) {
      const userId = getUserId()
      
      // Track session start
      analytics.userSessions[sessionId] = {
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        eventCount: 0,
        userId
      }
      
      trackEvent('session_start', {
        user_info: getUserInfo(),
        browser: {
          userAgent: navigator.userAgent,
          language: navigator.language
        }
      })
      
      setIsInitialized(true)
    }
  }, [sessionId, getUserId, getUserInfo, isInitialized])

  // Core event tracking with user ID
  const trackEvent = useCallback((type: string, data: any) => {
    const userId = getUserId()
    const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    
    const event: AnalyticsEvent = {
      id: eventId,
      type,
      userId,
      data,
      timestamp: new Date().toISOString(),
      sessionId
    }
    
    analytics.events.push(event)
    
    // Update session activity
    if (analytics.userSessions[sessionId]) {
      analytics.userSessions[sessionId].lastActivity = new Date().toISOString()
      analytics.userSessions[sessionId].eventCount++
    }
    
    console.log(`📊 Event tracked for user ${userId}: ${type}`, data)
    return event
  }, [getUserId, sessionId])

  // Product tracking
  const trackProductView = useCallback((product: Product) => {
    const userId = getUserId()
    const key = `${userId}_${product.id}`
    
    analytics.productViews[key] = (analytics.productViews[key] || 0) + 1
    
    trackEvent('product_view', {
      productId: product.id,
      title: product.title,
      shop: product.shop?.name,
      viewCount: analytics.productViews[key]
    })
  }, [getUserId, trackEvent])

  const trackProductClick = useCallback((product: Product, source: string = 'unknown') => {
    const userId = getUserId()
    const key = `${userId}_${product.id}`
    
    analytics.productClicks[key] = (analytics.productClicks[key] || 0) + 1
    
    trackEvent('product_click', {
      productId: product.id,
      title: product.title,
      source,
      clickCount: analytics.productClicks[key]
    })
  }, [getUserId, trackEvent])

  // Search tracking
  const trackSearch = useCallback((query: string, resultsCount: number) => {
    const userId = getUserId()
    
    const searchData = {
      userId,
      query,
      timestamp: new Date().toISOString(),
      resultsCount,
      sessionId
    }
    
    analytics.searches.push(searchData)
    trackEvent('search', searchData)
  }, [getUserId, sessionId, trackEvent])

  // Shop tracking
  const trackShopInteraction = useCallback((shop: Shop, action: 'follow' | 'unfollow' | 'visit') => {
    trackEvent('shop_interaction', {
      shopId: shop.id,
      shopName: shop.name,
      action,
      domain: shop.primaryDomain?.url
    })
  }, [trackEvent])

  // Get user-specific analytics
  const getUserAnalytics = useCallback(() => {
    const userId = getUserId()
    
    return {
      userId,
      userInfo: getUserInfo(),
      events: analytics.events.filter(e => e.userId === userId),
      productViews: Object.fromEntries(
        Object.entries(analytics.productViews)
          .filter(([key]) => key.startsWith(userId))
          .map(([key, value]) => [key.replace(`${userId}_`, ''), value])
      ),
      searches: analytics.searches.filter(s => s.userId === userId),
      sessionData: analytics.userSessions[sessionId]
    }
  }, [getUserId, getUserInfo, sessionId])

  // Get analytics for all users (admin view)
  const getAllAnalytics = useCallback(() => {
    return {
      ...analytics,
      summary: {
        totalUsers: new Set(analytics.events.map(e => e.userId)).size,
        totalEvents: analytics.events.length,
        totalSessions: Object.keys(analytics.userSessions).length,
        totalSearches: analytics.searches.length
      }
    }
  }, [])

  // Export user data
  const exportUserData = useCallback(() => {
    const userAnalytics = getUserAnalytics()
    console.log('📊 User Analytics Export:', userAnalytics)
    return userAnalytics
  }, [getUserAnalytics])

  // Clear user data
  const clearUserData = useCallback(() => {
    const userId = getUserId()
    
    // Remove user events
    analytics.events = analytics.events.filter(e => e.userId !== userId)
    
    // Remove user product data
    Object.keys(analytics.productViews).forEach(key => {
      if (key.startsWith(userId)) {
        delete analytics.productViews[key]
      }
    })
    Object.keys(analytics.productClicks).forEach(key => {
      if (key.startsWith(userId)) {
        delete analytics.productClicks[key]
      }
    })
    
    // Remove user searches
    analytics.searches = analytics.searches.filter(s => s.userId !== userId)
    
    console.log('✅ User analytics data cleared for:', userId)
  }, [getUserId])

  return {
    // Core tracking functions
    trackEvent,
    trackProductView,
    trackProductClick,
    trackSearch,
    trackShopInteraction,
    
    // Data retrieval
    getUserAnalytics,
    getAllAnalytics,
    exportUserData,
    
    // User information
    getUserId,
    getUserInfo,
    currentUser,
    
    // Session management
    sessionId,
    clearUserData,
    
    // State
    isInitialized
  }
}
