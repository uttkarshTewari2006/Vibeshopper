import {usePopularProducts, ProductCard} from '@shopify/shop-minis-react'

export function App() {
  const {products} = usePopularProducts()

  return (
    <div className="pt-12 px-4 pb-6">
      <h1 className="text-2xl font-bold mb-2 text-center">
        Welcome to Shop Minis!
      </h1>
      <p className="text-xs text-blue-600 mb-4 text-center bg-blue-50 py-2 px-4 rounded border border-blue-200">
        🛠️ Edit <b>src/App.tsx</b> to change this screen and come back to see
        your edits!
      </p>
      <p className="text-base text-gray-600 mb-6 text-center">
        These are the popular products today
      </p>
      <div className="grid grid-cols-2 gap-4">
        {products?.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
