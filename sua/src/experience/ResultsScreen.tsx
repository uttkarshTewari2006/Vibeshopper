import {Button as ShopButton} from '@shopify/shop-minis-react'
import { useState } from 'react'
import {ProductList} from '../components/ProductList'
import {AgentInput} from '../components/AgentInput'
// import {VibeChain} from '../components/VibeChain'

interface ResultsScreenProps {
  initialPrompt?: string
  latestPrompt?: string
  onPromptChange?: (p: string) => void
  promptChain: Array<{id: string; prompt: string; timestamp: Date}>
  onReset: () => void
}

export function ResultsScreen({ initialPrompt, latestPrompt, onPromptChange, promptChain, onReset }: ResultsScreenProps) {
  const agentInputTransitionStyle = {['viewTransitionName' as any]: 'agent-input'} as React.CSSProperties
  const [hasSearched, setHasSearched] = useState<boolean>(Boolean(initialPrompt || latestPrompt))

  const handleSend = ({prompt}: {prompt: string; imageFile?: File}) => {
    setHasSearched(true) 
    onPromptChange?.(prompt)
  }

  return (
    <div className="pt-10 px-4">
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
              </>
            )}
          </div>
        </div>
      </div>

      {hasSearched && (
        <>
          {/* AgentInput and VibeChain container */}
          <div className="flex flex-col sticky rounded-3xl backdrop-blur-lg top-3 z-50 w-full max-w-md mx-auto">
            {/* AgentInput in its own container */}
            <div className="rounded-3xl bg-white/20 w-full">
              <AgentInput
                variant="light"
                defaultPrompt={latestPrompt || initialPrompt}
                onSend={handleSend}
              />
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
            <section>
              <ProductList 
                basePrompt={initialPrompt || ''} 
                prompt={latestPrompt || initialPrompt}
                resetCounter={0}
              />
            </section>
          </div>
        </>
      )}

      <div className="fixed inset-x-0 bottom-4 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-[calc(100%-32px)] max-w-sm">
          <ShopButton>Checkout with Shop</ShopButton>
        </div>
      </div>
    </div>
  )
}