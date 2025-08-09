import { useState, useEffect, useCallback } from 'react'
import { useCurrentUser } from '@shopify/shop-minis-react'

/**
 * Hook for managing user identification in Shop Minis
 * Combines Shopify user data with session-based tracking
 */

export interface UserIdentification {
  sessionId: string;
  shopifyUser: any;
  displayName: string;
  isLoggedIn: boolean;
  userId: string; // Composite ID
}

export function useUserIdentification() {
  const { currentUser, loading, error } = useCurrentUser()
  const [sessionId, setSessionId] = useState<string>('')

  // Generate or retrieve session ID
  const generateSessionId = useCallback((): string => {
    let storedSessionId = sessionStorage.getItem('user_session_id')
    
    if (!storedSessionId) {
      storedSessionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('user_session_id', storedSessionId)
    }
    
    return storedSessionId
  }, [])

  // Initialize session ID on mount
  useEffect(() => {
    const id = generateSessionId()
    setSessionId(id)
  }, [generateSessionId])

  // Create composite user ID (combines Shopify user + session)
  const getUserId = useCallback((): string => {
    if (currentUser?.displayName) {
      // If logged into Shopify, use display name + session
      const shopifyBase = btoa(currentUser.displayName).replace(/[^a-zA-Z0-9]/g, '').substr(0, 8)
      return `shopify_${shopifyBase}_${sessionId.split('_')[1]}`
    }
    
    // Fall back to session ID
    return sessionId
  }, [currentUser, sessionId])

  // Get user information object
  const getUserInfo = useCallback((): UserIdentification => {
    return {
      sessionId,
      shopifyUser: currentUser,
      displayName: currentUser?.displayName || 'Anonymous User',
      isLoggedIn: !!currentUser,
      userId: getUserId()
    }
  }, [sessionId, currentUser, getUserId])

  // Clear session and generate new ID
  const clearSession = useCallback(() => {
    sessionStorage.removeItem('user_session_id')
    const newId = generateSessionId()
    setSessionId(newId)
    console.log('✅ New session ID generated:', newId)
  }, [generateSessionId])

  // Get browser fingerprint for more persistent identification
  const getBrowserFingerprint = useCallback((): string => {
    let fingerprint = localStorage.getItem('user_fingerprint')
    
    if (!fingerprint) {
      const browserInfo = {
        userAgent: navigator.userAgent.slice(0, 50), // Truncate for privacy
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
      
      // Simple hash of browser characteristics
      const hash = btoa(JSON.stringify(browserInfo)).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16)
      fingerprint = `fp_${hash}`
      localStorage.setItem('user_fingerprint', fingerprint)
    }
    
    return fingerprint
  }, [])

  return {
    // Core identification
    getUserId,
    getUserInfo,
    sessionId,
    
    // Shopify user data
    currentUser,
    loading,
    error,
    
    // Session management
    clearSession,
    generateSessionId,
    
    // Browser fingerprinting
    getBrowserFingerprint,
    
    // Convenience getters
    isLoggedIn: !!currentUser,
    displayName: currentUser?.displayName || 'Anonymous User'
  }
}
