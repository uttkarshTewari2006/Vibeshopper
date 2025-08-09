# 📊 How to Query Your Analytics Data

## 🚀 Quick Start

### 1. **Browser Console (Easiest)**

Open your app in the browser, then open Developer Tools (F12) and use the console:

```javascript
// Show help and available commands
analytics.help()

// Get quick overview
analytics.getOverview()

// Get top products
analytics.getTopProducts(10)

// Get search data
analytics.getSearchData()

// Get AI analytics
analytics.getAIData()

// Get recent events
analytics.getRecentEvents(20)

// Export all data
analytics.exportToConsole()
```

### 2. **Direct Database Queries**

```javascript
// Get the queries instance
const queries = window.analyticsQueries;

// Query specific tables
queries.getCompleteOverview().then(console.log);
queries.getTopProducts(15).then(console.log);
queries.getSearchInsights().then(console.log);
```

## 📋 Detailed Examples

### **View All Product Analytics**
```javascript
// Get top performing products
analytics.getTopProducts(20).then(products => {
  products.forEach(p => {
    console.log(`Product ${p.shopify_product_id}:`);
    console.log(`  Views: ${p.view_count}`);
    console.log(`  Clicks: ${p.click_count}`);
    console.log(`  Saves: ${p.save_count}`);
    console.log(`  Engagement Rate: ${(p.engagement_rate * 100).toFixed(1)}%`);
    console.log(`  Last Viewed: ${p.last_viewed}`);
  });
});
```

### **Analyze Search Behavior**
```javascript
// Get comprehensive search analytics
analytics.getSearchData().then(data => {
  console.log('=== SEARCH ANALYTICS ===');
  console.log(`Total searches: ${data.totalSearches}`);
  console.log(`Unique queries: ${data.uniqueQueries}`);
  console.log(`Average CTR: ${(data.averageCTR * 100).toFixed(2)}%`);
  
  console.log('\nTop 10 search queries:');
  data.topQueries.slice(0, 10).forEach(([query, count]) => {
    console.log(`  "${query}": ${count} searches`);
  });
});
```

### **AI Performance Analysis**
```javascript
// Get AI usage statistics
analytics.getAIData().then(ai => {
  console.log('=== AI ANALYTICS ===');
  console.log(`Total images generated: ${ai.totalImages}`);
  console.log(`Success rate: ${ai.successRate.toFixed(1)}%`);
  console.log(`Average processing time: ${ai.avgProcessingTime.toFixed(2)}s`);
  
  console.log('\nModel usage:');
  Object.entries(ai.modelUsage).forEach(([model, count]) => {
    console.log(`  ${model}: ${count} generations`);
  });
});
```

### **User Journey Analysis**
```javascript
// First, get session data to find a session ID
analytics.getSessionData().then(sessions => {
  const sessionId = sessions.sessionData[0]?.id;
  if (sessionId) {
    // Analyze the user journey for this session
    analytics.getJourney(sessionId).then(journey => {
      console.log(`=== USER JOURNEY: ${sessionId} ===`);
      journey.forEach(step => {
        console.log(`Step ${step.step}: ${step.event_type} at ${new Date(step.timestamp).toLocaleTimeString()}`);
        console.log(`  Entity: ${step.entity_type} (${step.entity_id})`);
        console.log(`  Data:`, step.data);
      });
    });
  }
});
```

### **Real-time Event Monitoring**
```javascript
// Watch recent events
setInterval(() => {
  analytics.getRecentEvents(5).then(events => {
    console.clear();
    console.log('=== LAST 5 EVENTS ===');
    events.forEach(event => {
      console.log(`${new Date(event.timestamp).toLocaleTimeString()}: ${event.event_type} - ${event.entity_type}`);
    });
  });
}, 5000); // Refresh every 5 seconds
```

## 📤 Data Export Options

### **Export All Data**
```javascript
// Export everything to console
analytics.exportToConsole()

// Export specific data types
analytics.exportToConsole('products')
analytics.exportToConsole('searches')
analytics.exportToConsole('ai')
analytics.exportToConsole('sessions')
```

### **Download as JSON File**
```javascript
// Get data and trigger download
analytics.getAllData().then(data => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
});
```

## 🔍 Advanced Queries

### **Custom Product Analysis**
```javascript
// Find products with specific criteria
const queries = window.analyticsQueries;

queries.getTopProducts(100).then(products => {
  // High engagement but low saves (opportunity products)
  const opportunities = products.filter(p => 
    p.engagement_rate > 0.1 && p.save_rate < 0.05
  );
  
  console.log('Opportunity Products (high engagement, low saves):');
  console.table(opportunities);
});
```

### **Search Performance by Time**
```javascript
queries.getSearchPerformanceByTime().then(performance => {
  console.log('Search Performance by Hour:');
  performance.forEach(hour => {
    console.log(`${hour.hour}:00 - ${hour.searches} searches, ${hour.ctr.toFixed(3)} CTR`);
  });
});
```

### **AI Prompt Effectiveness**
```javascript
queries.getPromptEffectiveness().then(prompts => {
  // Find fastest generating prompts
  const fastest = prompts.slice(0, 10);
  console.log('Fastest AI Generations:');
  fastest.forEach(p => {
    console.log(`${p.processing_time.toFixed(2)}s: "${p.prompt}" (${p.word_count} words)`);
  });
});
```

## 📊 Database Schema Reference

### **Tables Available:**
- `product_analytics` - Product view/click/save tracking
- `shop_analytics` - Shop follow/visit tracking  
- `search_analytics` - Search query and results tracking
- `ai_interactions` - AI usage and performance tracking
- `ai_generated_images` - Generated image metadata
- `user_sessions` - User session and journey tracking
- `product_enhancements` - AI-generated product insights
- `event_logs` - Complete event stream

### **Direct Database Access:**
```javascript
// Access raw database tables
const db = window.analyticsDb;

// Query examples
db.product_analytics.where('view_count').above(10).toArray().then(console.log);
db.search_analytics.where('query').equals('shirt').toArray().then(console.log);
db.event_logs.where('event_type').equals('product_click').toArray().then(console.log);
```

## 🎯 Common Use Cases

### **Find Popular Products**
```javascript
analytics.getTopProducts(10)
```

### **Analyze Search Trends**
```javascript
analytics.getSearchData()
```

### **Monitor AI Performance**
```javascript
analytics.getAIData()
```

### **Track User Engagement**
```javascript
analytics.getSessionData()
```

### **Real-time Monitoring**
```javascript
analytics.getRecentEvents(10)
```

### **Export for External Analysis**
```javascript
analytics.exportToConsole()
```

---

## 💡 Pro Tips

1. **Use `.then(console.table)` for better formatting:**
   ```javascript
   analytics.getTopProducts(10).then(console.table)
   ```

2. **Chain queries for deeper analysis:**
   ```javascript
   analytics.getTopProducts(1).then(products => {
     return analytics.findProduct(products[0].shopify_product_id);
   })
   ```

3. **Set up monitoring dashboards:**
   ```javascript
   // Auto-refresh data every 30 seconds
   setInterval(() => analytics.getOverview(), 30000);
   ```

4. **Use the Analytics Dashboard component for visual exploration:**
   - Import and use `<AnalyticsDashboard />` in your React app
   - Browse data visually with filtering and export options

🎉 **Start exploring your data with `analytics.help()` in the browser console!**
