// Console utilities for quick testing in DevTools
// Provides: simpleAnalytics.getTopProducts(), userHooks.getUserInfo(), etc.
import { DatabaseService } from './lib/database'

declare global {
  interface Window {
    analytics?: any
    simpleAnalytics?: any
    userUtils?: any
    userHooks?: any
  }
}

const db = DatabaseService.getInstance()

// If analytics exists elsewhere, alias it
if (typeof window !== 'undefined') {
  // Lazy-load analytics object if available later
  Object.defineProperty(window, 'simpleAnalytics', {
    get() {
      // Prefer already-set value
      // @ts-ignore
      if (this.__simpleAnalytics) return this.__simpleAnalytics
      // If analytics was registered elsewhere, alias it
      // @ts-ignore
      if (this.analytics) return this.analytics
      console.warn('simpleAnalytics is not available yet')
      return undefined
    },
    set(v) {
      // @ts-ignore
      this.__simpleAnalytics = v
    },
    configurable: true,
  })

  // userHooks
  function getSessionId() {
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', crypto.randomUUID())
    }
    return sessionStorage.getItem('session_id')
  }

  function getUserInfo() {
    return {
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
    }
  }

  async function getTopProducts(limit = 10) {
    const events = await db.getAnalytics('product_interaction', 'product')
    const counts: Record<string, number> = {}
    for (const e of events) {
      const id = e.entity_id
      counts[id] = (counts[id] || 0) + 1
    }
    const rows = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([product_id, total]) => ({ product_id, total }))
    console.table(rows)
    return rows
  }

  window.userHooks = {
    getUserInfo,
    getSessionId,
    help() {
      console.log('Console helpers ready:')
      console.log('- userHooks.getUserInfo()')
      console.log('- userHooks.getSessionId()')
      console.log('- simpleAnalytics.getTopProducts(10)')
    }
  }

  // Back-compat userUtils
  window.userUtils = {
    showUserInfo() {
      const info = getUserInfo()
      console.table(info)
      return info
    },
    getSessionId,
  }

  // Bind simple analytics implementation
  // If an external analytics obj replaces it later, our getter will return that instead
  // @ts-ignore
  window.__simpleAnalytics = { getTopProducts }

  console.log('✅ Console helpers ready. Try userHooks.help()')
}

export {}


