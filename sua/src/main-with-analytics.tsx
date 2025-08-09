import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'
import { MinisContainer } from '@shopify/shop-minis-react'

// ✅ Import analytics utilities for console access
import './utils/console-queries'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MinisContainer>
      <App />
    </MinisContainer>
  </StrictMode>,
)

// Add console message for users
console.log('🎉 Analytics console loaded! Type "analytics.help()" to see available commands');
