import {usePopularProducts} from '@shopify/shop-minis-react'
import { fal } from '@fal-ai/client'
import { ProductList } from './components/ProductList'

export function App() {
  usePopularProducts()
  fal.config({
    credentials: "YOUR_FAL_KEY_HERE" // Replace with your actual API key
  });

  return (
    <div className="pt-12 px-4 pb-6">
      <h1 className="text-2xl font-bold mb-2 text-center">
        Project Starter Hub
      </h1>
      <p className="text-xs text-blue-600 mb-4 text-center bg-blue-50 py-2 px-4 rounded border border-blue-200">
        🚀 Describe your project idea and get personalized template recommendations!
      </p>
      <ProductList />
    </div>
  )
}
