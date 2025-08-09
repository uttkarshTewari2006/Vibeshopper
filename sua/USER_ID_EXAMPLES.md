# 👤 Getting User ID in Shopify Shop Minis

## 🔍 **Available Methods to Get User ID**

### **1. ✅ Using `useCurrentUser` Hook (Primary Method)**

```typescript
import { useCurrentUser } from '@shopify/shop-minis-react'

function MyComponent() {
  const { currentUser, loading, error } = useCurrentUser()
  
  if (loading) return <div>Loading user...</div>
  if (error) return <div>Error loading user</div>
  
  // ⚠️ Note: Shop Minis may not expose a direct user ID
  // The currentUser object contains profile information
  console.log('Current user:', currentUser)
  
  if (currentUser) {
    console.log('Display name:', currentUser.displayName)
    console.log('Avatar:', currentUser.avatarImage?.url)
  }
  
  return (
    <div>
      {currentUser ? (
        <p>Welcome, {currentUser.displayName || 'User'}!</p>
      ) : (
        <p>Not logged in</p>
      )}
    </div>
  )
}
```

### **2. 🔧 Generating a Session-Based User ID**

Since Shop Minis may not expose a direct user ID, you can create a session-based identifier:

```typescript
// Generate a session-based user identifier
const getUserSessionId = (): string => {
  let sessionId = sessionStorage.getItem('user_session_id')
  
  if (!sessionId) {
    sessionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('user_session_id', sessionId)
  }
  
  return sessionId
}

// Use in your analytics
const trackUserAction = (action: string, data: any) => {
  const userSessionId = getUserSessionId()
  
  analytics.events.push({
    type: action,
    user_session_id: userSessionId,
    data,
    timestamp: new Date().toISOString()
  })
}
```

### **3. 🍪 Using Browser Fingerprinting (Persistent)**

```typescript
// Create a more persistent user identifier
const getUserFingerprint = (): string => {
  let fingerprint = localStorage.getItem('user_fingerprint')
  
  if (!fingerprint) {
    // Create fingerprint based on browser characteristics
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('fingerprint', 2, 2)
    
    const browserInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvasFingerprint: canvas.toDataURL()
    }
    
    // Create hash of browser info
    fingerprint = `fp_${btoa(JSON.stringify(browserInfo)).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16)}`
    localStorage.setItem('user_fingerprint', fingerprint)
  }
  
  return fingerprint
}
```

### **4. 🔗 Combining User Profile with Generated ID**

```typescript
import { useCurrentUser } from '@shopify/shop-minis-react'

const useUserIdentification = () => {
  const { currentUser } = useCurrentUser()
  
  // Create a composite user identifier
  const getUserId = () => {
    if (currentUser?.displayName) {
      // Use display name as basis if available
      return `user_${btoa(currentUser.displayName).replace(/[^a-zA-Z0-9]/g, '').substr(0, 12)}`
    }
    
    // Fallback to session ID
    return getUserSessionId()
  }
  
  const getUserInfo = () => ({
    id: getUserId(),
    displayName: currentUser?.displayName || 'Anonymous',
    avatar: currentUser?.avatarImage?.url || null,
    isLoggedIn: !!currentUser
  })
  
  return {
    currentUser,
    getUserId,
    getUserInfo
  }
}
```

## 📊 **Updated Analytics with User ID**

Here's how to update your analytics to include user identification:

```typescript
// Enhanced analytics with user tracking
interface EnhancedAnalytics {
  userId: string;
  productViews: Record<string, number>;
  productClicks: Record<string, number>;
  searches: Array<{
    userId: string;
    query: string; 
    timestamp: string; 
    resultsCount: number;
  }>;
  events: Array<{
    userId: string;
    type: string; 
    data: any; 
    timestamp: string;
  }>;
}

const enhancedAnalytics: EnhancedAnalytics = {
  userId: getUserSessionId(),
  productViews: {},
  productClicks: {},
  searches: [],
  events: []
}

// Enhanced tracking functions
const trackEvent = (type: string, data: any) => {
  const userId = getUserSessionId()
  
  enhancedAnalytics.events.push({
    userId,
    type,
    data,
    timestamp: new Date().toISOString()
  })
  
  console.log(`📊 Event tracked for user ${userId}: ${type}`, data)
}

const trackSearch = (query: string, resultsCount: number) => {
  const userId = getUserSessionId()
  
  enhancedAnalytics.searches.push({
    userId,
    query,
    timestamp: new Date().toISOString(),
    resultsCount
  })
  
  trackEvent('search', { query, resultsCount })
}
```

## 🧪 **Testing User ID in Console**

Add these functions to test user identification in the browser console:

```typescript
// Make user ID functions available globally
if (typeof window !== 'undefined') {
  (window as any).userUtils = {
    getCurrentUser: () => {
      // This would need to be called from within a React component
      console.log('Use this inside a React component with useCurrentUser hook')
    },
    
    getSessionId: getUserSessionId,
    
    getFingerprint: getUserFingerprint,
    
    showUserInfo: () => {
      console.log('Session ID:', getUserSessionId())
      console.log('Fingerprint:', getUserFingerprint())
    },
    
    clearUserData: () => {
      sessionStorage.removeItem('user_session_id')
      localStorage.removeItem('user_fingerprint')
      console.log('User data cleared')
    }
  }
}
```

## 🚀 **Console Commands to Test**

Once your app is running, try these in the browser console:

```javascript
// Check user utilities
userUtils.showUserInfo()

// Get current session ID  
userUtils.getSessionId()

// Get browser fingerprint
userUtils.getFingerprint()

// Clear user data and regenerate
userUtils.clearUserData()
userUtils.getSessionId() // Will generate new ID
```

## ⚠️ **Important Notes**

1. **Privacy**: Shop Minis may not expose direct user IDs for privacy reasons
2. **Session-based**: Session IDs are temporary and reset when browser data is cleared
3. **Fingerprinting**: Browser fingerprints are more persistent but can still change
4. **User Consent**: Always inform users about data collection and tracking
5. **Testing**: User identification works best in a real Shop environment

## 🎯 **Recommended Approach**

For your hackathon project, I recommend:

1. **Use `useCurrentUser`** to get available user profile data
2. **Generate session IDs** for temporary user tracking  
3. **Combine both** for comprehensive user identification
4. **Track analytics** with the generated user identifiers

This gives you user tracking capabilities while respecting Shop Minis constraints and privacy considerations.
