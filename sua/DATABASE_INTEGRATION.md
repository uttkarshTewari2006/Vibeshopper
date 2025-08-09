# Shopify Database Integration

## Overview

This Shop Mini now includes comprehensive database integration that leverages all available [Shopify Shop Minis hooks](https://shopify.dev/docs/api/shop-minis/hooks) to collect, store, and analyze Shopify data locally using IndexedDB.

## 🏗️ Architecture

### Database Layer (IndexedDB with Dexie)
- **Local Storage**: Uses IndexedDB for client-side data persistence
- **Structured Schema**: Organized tables for products, shops, users, analytics, and AI interactions
- **Performance**: Fast queries and offline capabilities

### Data Sources (Shopify Shop Minis Hooks)
The integration uses multiple hooks from the [Shopify Shop Minis API](https://shopify.dev/docs/api/shop-minis/hooks):

#### Product Hooks
- `usePopularProducts` - Fetches trending products
- `useProductSearch` - [Search functionality](https://shopify.dev/docs/api/shop-minis/hooks/product/useproductsearch) with real-time results
- `useRecommendedProducts` - Personalized product recommendations
- `useSavedProducts` & `useSavedProductsActions` - User's saved products
- `useRecentProducts` - Recently viewed products

#### User Hooks
- `useCurrentUser` - Current user information
- `useFollowedShops` & `useFollowedShopsActions` - Shop following functionality
- `useRecommendedShops` - Shop recommendations

## 📊 Features Implemented

### 1. **Real-time Data Synchronization**
- Automatic sync of products, shops, and user data
- Event tracking for all user interactions
- AI-generated content storage and analytics

### 2. **Comprehensive Analytics Dashboard**
- **User Behavior Tracking**: Page views, searches, product interactions
- **AI Usage Analytics**: Generation success rates, processing times, model usage
- **Product Engagement**: Click tracking, save/unsave actions
- **Search Insights**: Query analysis, result metrics

### 3. **Multi-tab Interface**
- **Home**: Popular and recommended products
- **Search**: Live product search with [useProductSearch](https://shopify.dev/docs/api/shop-minis/hooks/product/useproductsearch)
- **Following**: Followed shops and saved products
- **Analytics**: Comprehensive data dashboard

### 4. **AI Integration with Database**
- Track all Fal.ai image generations
- Store generated images with metadata
- Analytics on AI model usage and performance
- Integration with product data for enhanced insights

## 🛠️ Implementation Details

### Database Schema

```typescript
// Core entities
interface Product {
  id: string;
  title: string;
  // ... standard Shopify product fields
  ai_generated_images?: AIGeneratedImage[];
  ai_analysis?: AIAnalysis;
}

interface Shop {
  id: string;
  name: string;
  domain: string;
  is_followed: boolean;
  visit_count: number;
  // ... tracking fields
}

interface Analytics {
  event_type: string;
  entity_type: 'product' | 'shop' | 'user' | 'ai_interaction';
  entity_id: string;
  data: Record<string, any>;
  timestamp: string;
}
```

### Key Services

#### DataSyncService
- Handles all data synchronization
- Tracks user behavior and interactions
- Provides analytics aggregation
- Manages data export functionality

#### DatabaseService
- Low-level database operations
- CRUD operations for all entities
- Search and filtering capabilities
- Bulk operations for performance

### Shopify Hooks Integration

The app leverages the full power of Shopify Shop Minis hooks:

```typescript
// Product data
const { products } = usePopularProducts();
const { products: searchResults } = useProductSearch({
  query: searchQuery,
  first: 20,
  filters: {}
});

// User data
const { user } = useCurrentUser();
const { shops: followedShops } = useFollowedShops();
const { followShop, unfollowShop } = useFollowedShopsActions();
```

## 📈 Analytics Capabilities

### Event Tracking
- **User Actions**: Page views, searches, product clicks
- **AI Interactions**: Image generations, success/failure rates
- **Shop Engagement**: Follow/unfollow actions
- **Product Engagement**: Save/unsave, click-through rates

### Insights Generated
- **Usage Patterns**: Most active hours, popular searches
- **AI Performance**: Success rates, processing times
- **Product Analytics**: Most viewed/saved products
- **User Journey**: Navigation patterns, engagement flow

### Data Export
- Complete data export functionality
- JSON format for easy analysis
- Includes all tracked events and generated content

## 🚀 Usage

### Starting the App
```bash
cd sua
npm run start
```

### Testing the Integration

1. **Navigate between tabs** - Each tab switch is tracked
2. **Search for products** - Uses live [useProductSearch](https://shopify.dev/docs/api/shop-minis/hooks/product/useproductsearch)
3. **Generate AI images** - Creates tracking data
4. **View Analytics** - See real-time data insights
5. **Export data** - Get complete data dump

### Key Interactions to Test

1. **Search Products**: Type in search tab to see live results
2. **Generate AI Images**: Create product images and see tracking
3. **Follow Shops**: Use recommended shops section
4. **View Analytics**: Check the analytics dashboard for insights
5. **Product Interactions**: Click products to track engagement

## 🔧 Configuration

### Environment Variables
```bash
VITE_FAL_KEY=your_fal_api_key_here
```

### Database Management
The database automatically initializes and creates necessary tables. Data persists between sessions.

## 🎯 Benefits for Shopify Hackathon

1. **Comprehensive Data Integration**: Uses all major Shopify Shop Minis hooks
2. **Real-time Analytics**: Immediate insights into user behavior
3. **AI-Enhanced**: Combines AI generation with data tracking
4. **Scalable Architecture**: Built for growth and expansion
5. **Offline Capabilities**: Works without constant network connectivity
6. **Performance Optimized**: Fast queries and efficient storage

## 📚 References

- [Shopify Shop Minis Hooks](https://shopify.dev/docs/api/shop-minis/hooks)
- [useProductSearch Hook](https://shopify.dev/docs/api/shop-minis/hooks/product/useproductsearch)
- [Dexie.js Documentation](https://dexie.org/)
- [Fal.ai API Documentation](https://fal.ai/docs)

This integration demonstrates the full potential of combining Shopify's Shop Minis platform with AI capabilities and comprehensive data analytics, creating a powerful foundation for e-commerce insights and user engagement.
