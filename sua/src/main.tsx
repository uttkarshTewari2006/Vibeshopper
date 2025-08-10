import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {MinisContainer} from '@shopify/shop-minis-react'
// import ItemPrevie from './components/ItemPrevie'

import {App} from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MinisContainer>
      <App />
    </MinisContainer>
  </StrictMode>
)
