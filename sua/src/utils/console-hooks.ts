/**
 * Console utilities for testing user ID hooks
 * Makes hooks available globally for browser console testing
 */

import { useUserIdentification } from '../hooks/useUserIdentification'
import { useUserAnalytics } from '../hooks/useUserAnalytics'

// Note: These hooks need to be called from within React components
// This file provides the interface for console access

export interface ConsoleHookInterface {
  getUserId: () => string;
  getUserInfo: () => any;
  getAnalytics: () => any;
  trackEvent: (type: string, data: any) => void;
  trackProduct: (productId: string, action: string) => void;
  exportData: () => any;
  clearData: () => void;
  help: () => void;
}

// This will be populated by the App component when it mounts
let hookInterface: ConsoleHookInterface | null = null;

export const setupConsoleHooks = (
  userIdentification: ReturnType<typeof useUserIdentification>,
  userAnalytics: ReturnType<typeof useUserAnalytics>
) => {
  hookInterface = {
    getUserId: userIdentification.getUserId,
    getUserInfo: userIdentification.getUserInfo,
    getAnalytics: userAnalytics.getUserAnalytics,
    trackEvent: userAnalytics.trackEvent,
    trackProduct: (productId: string, action: string) => {
      userAnalytics.trackEvent('product_interaction', {
        productId,
        action,
        source: 'console'
      });
    },
    exportData: userAnalytics.exportUserData,
    clearData: userAnalytics.clearUserData,
    help: () => {
      console.log('🎣 User ID Hooks Console Commands:');
      console.log('');
      console.log('👤 User Identification:');
      console.log('  userHooks.getUserId()              - Get current user ID');
      console.log('  userHooks.getUserInfo()            - Get user information object');
      console.log('');
      console.log('📊 Analytics:');
      console.log('  userHooks.getAnalytics()           - Get user analytics data');
      console.log('  userHooks.trackEvent(type, data)   - Track custom event');
      console.log('  userHooks.trackProduct(id, action) - Track product interaction');
      console.log('');
      console.log('📤 Data Management:');
      console.log('  userHooks.exportData()             - Export user data');
      console.log('  userHooks.clearData()              - Clear user analytics');
      console.log('');
      console.log('💡 Examples:');
      console.log('  userHooks.trackEvent("test", {msg: "hello"})');
      console.log('  userHooks.trackProduct("prod123", "viewed")');
      console.log('  userHooks.exportData()');
    }
  };

  // Make available globally
  if (typeof window !== 'undefined') {
    (window as any).userHooks = hookInterface;
    console.log('🎣 User ID hooks available! Type "userHooks.help()" for commands');
  }

  return hookInterface;
};

// Getter for external access
export const getConsoleHooks = () => hookInterface;
