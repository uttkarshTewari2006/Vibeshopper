import {Button as ShopButton} from '@shopify/shop-minis-react'
import { useState, useCallback } from 'react'
import {ProductList} from '../components/ProductList'
import {AgentInput} from '../components/AgentInput'
// import {VibeChain} from '../components/VibeChain'
import { ShoppingCart } from 'lucide-react'
import { ARCategoryRow } from '../components/ARCategoryRow'

interface ResultsScreenProps {
  initialPrompt?: string
  latestPrompt?: string
  onPromptChange?: (p: string) => void
  promptChain: Array<{id: string; prompt: string; timestamp: Date}>
  onReset: () => void
}

interface CartItem {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
}

export function ResultsScreen({ initialPrompt, latestPrompt, onPromptChange, promptChain, onReset }: ResultsScreenProps) {
  const agentInputTransitionStyle = {['viewTransitionName' as any]: 'agent-input'} as React.CSSProperties
  const [hasSearched, setHasSearched] = useState<boolean>(Boolean(initialPrompt || latestPrompt))
  const [cart, setCart] = useState<CartItem[]>([])
  
  const addToCart = useCallback((product: Omit<CartItem, 'id'>) => {
    setCart(prevCart => {
      // Check if product is already in cart
      const exists = prevCart.some(item => 
        item.name === product.name && item.category === product.category
      )
      if (exists) return prevCart;
      
      // Add new item with unique ID
      return [...prevCart, { ...product, id: Date.now().toString() }]
    })
  }, [])
  
  const removeFromCart = useCallback((productName: string, categoryName: string) => {
    setCart(prevCart => 
      prevCart.filter(item => !(item.name === productName && item.category === categoryName))
    )
  }, [])

  const handleSend = ({prompt}: {prompt: string; imageFile?: File}) => {
    setHasSearched(true) 
    onPromptChange?.(prompt)
  }

  // Handle reset
  const handleReset = () => {
    onReset()
    setHasSearched(false)
  }

  return (
    <div className={`pt-10 px-4 ${!hasSearched ? 'intro-bg min-h-screen' : ''}`}>

      <div className={`transition-all duration-300 ease-in ${
        !hasSearched 
          ? 'min-h-[70vh] grid place-items-center' 
          : '' 
      }`}>
        <div className={`${
          !hasSearched 
            ? 'w-full inset-x-0 [view-transition-name:agent-input-container]' 
            : '' 
        }`}
        style={!hasSearched ? agentInputTransitionStyle : undefined}>
          <div className={`${
            !hasSearched 
              ? 'mx-auto w-full max-w-[360px] sm:max-w-md px-4' 
              : '' 
          }`}>
            <div className="flex justify-center mb-8">
              <img 
                src="vibeshopperlogo.svg" 
                alt="VibeShopper" 
                className={`transition-all duration-500 ease-out ${
                  !hasSearched 
                    ? 'w-64 h-auto' 
                    : 'w-50 h-auto' 
                }`}
              />
            </div>
            
            {!hasSearched && (
              <>
                <div className="ideas-marquee mb-3">
                  <div className="ideas-track">
                    {(() => {
                      const ideas = [
                        { label: '🪴 Blue ceramic plant pots bundle', prompt: 'Looking for a bundle to start a windowsill garden with blue ceramic pots. Include containers, potting soil, tools, seeds/plants, and a garden planner app.' },
                        { label: '👕 Midnight‑blue athleisure fit', prompt: 'Need a cozy midnight‑blue athleisure fit. Include tops, bottoms, accessories, laundry consumables, and a fitness planner app.' },
                        { label: '💻 Minimal black desk setup', prompt: 'Build a minimalist black desk setup. Include tools, cable management accessories, containers, lighting, and a task planner app.' },
                        { label: '🍳 Retro pastel kitchen tools', prompt: 'Retro pastel kitchen tools set. Include utensil set, mixing bowls, bakeware, cleaning consumables, and a recipe planner app.' },
                        { label: '🏕️ Weekend camping < $150', prompt: 'Weekend camping essentials under $150. Include tools, consumables, containers, accessories, and a trip planner app.' },
                      ];
                      const loop = ideas.concat(ideas);
                      return loop.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend({prompt: s.prompt})}
                          className="idea-pill shrink-0 mx-1 px-3 h-7 rounded-2xl text-[11px] whitespace-nowrap transition-colors"
                        >
                          {s.label}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
                <div className="sticky top-3 z-50 w-full max-w-md mx-auto mt-8">
                  <div className="rounded-3xl bg-white/20 backdrop-blur-lg w-full">
                    <AgentInput
                      variant="light"
                      defaultPrompt=""
                      onSend={handleSend}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {hasSearched && (
        <>
          <div className="sticky top-3 z-50 w-full max-w-md mx-auto space-y-4">
            {/* AgentInput in its own container */}
            <div className="rounded-3xl bg-white/20 backdrop-blur-lg w-full">
              <AgentInput
                variant="light"
                defaultPrompt={latestPrompt || initialPrompt}
                onSend={handleSend}
              />
            </div>
            
            {/* Reset button positioned below AgentInput */}
            <div className="">
              <button
                onClick={handleReset}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center backdrop-blur-lg gap-1 px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 bg-white/50 hover:bg-white/70 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.6L21 8"/>
                  <path d="M21 3v5h-5"/>
                </svg>
                Reset
              </button>
            </div>
            
            {/* VibeChain in its own separate container - positioned on the right */}
            {promptChain.length > 0 && (
              <div className="mt-3 rounded-3xl bg-white/40 backdrop-blur-sm w-full relative z-10 self-end">
                {/* <VibeChain 
                  prompts={promptChain} 
                  onReset={onReset}
                /> */}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-8">
            <section className="">
              <div>
                <ARCategoryRow 
                  onAddToCart={addToCart}
                  onRemoveFromCart={removeFromCart}
                />
              </div>
              
              <div className="rounded-xl bg-white/50 backdrop-blur-sm">
                <ProductList 
                  basePrompt={initialPrompt || ''} 
                  prompt={latestPrompt || initialPrompt}
                  resetCounter={0}
                  onAddToCart={addToCart}
                  onRemoveFromCart={removeFromCart}
                />
              </div>
            </section>
          </div>
        </>
      )}

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 pb-8 z-200 bg-gradient-to-t from-white/80 to-transparent pointer-events-none">
          <div className="mx-auto">
            <div className="pointer-events-auto w-[70%] mx-auto">
              <ShopButton className="px-4 py-3 rounded-3xl">
                <div className="flex items-center justify-center gap-2">
                  <ShoppingCart size={16} />
                  <span>Checkout {cart.length} {cart.length === 1 ? 'item' : 'items'} with Shop</span>
                </div>
              </ShopButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}