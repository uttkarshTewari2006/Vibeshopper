# 🧪 Testing Commands for Browser Console

## First, test if analytics are loaded:
```javascript
// Check if analytics are available
console.log('Analytics available:', typeof window.analytics !== 'undefined')

// Show help
analytics.help()
```

## Generate some test data:
```javascript
// 1. Interact with your app first:
//    - Click on products
//    - Search for something
//    - Generate an AI image
//    - Navigate between tabs

// 2. Then check the data:
analytics.getOverview()
```

## Specific analytics tests:
```javascript
// Check products
analytics.getTopProducts(5)

// Check searches (after you've searched)
analytics.getSearchData()

// Check AI data (after generating images)
analytics.getAIData()

// Check recent events
analytics.getRecentEvents(10)

// View all data
analytics.getAllData()
```

## Export test:
```javascript
// Export to console
analytics.exportToConsole()

// Export specific type
analytics.exportToConsole('products')
```

## Direct database test:
```javascript
// Check if database is working
const queries = window.analyticsQueries;
queries.getCompleteOverview().then(data => {
  console.log('Database working:', data);
});
```
