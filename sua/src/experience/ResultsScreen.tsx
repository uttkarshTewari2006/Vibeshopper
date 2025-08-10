import {Button as ShopButton} from '@shopify/shop-minis-react'
import { useState } from 'react'
import {ProductList} from '../components/ProductList'
import {AgentInput} from '../components/AgentInput'

interface ResultsScreenProps {
  initialPrompt?: string
  latestPrompt?: string
  onPromptChange?: (p: string) => void
}

export function ResultsScreen({ initialPrompt, latestPrompt, onPromptChange }: ResultsScreenProps) {
  const agentInputTransitionStyle = {['viewTransitionName' as any]: 'agent-input'} as React.CSSProperties
  const [hasSearched, setHasSearched] = useState<boolean>(Boolean(initialPrompt || latestPrompt))
  const [resetCounter, setResetCounter] = useState<number>(0)

  const handleReset = () => {
    setResetCounter((c: number) => c + 1)
    setHasSearched(false) // Go back to empty centered state
    onPromptChange?.('')
  }

  const handleSend = ({prompt}: {prompt: string; imageFile?: File}) => {
    setHasSearched(true) // Move to top and show results
    onPromptChange?.(prompt)
  }

  return (
    <div className="pt-4 pb-28 px-4">
      {!hasSearched ? (
        <div className="min-h-[70vh] grid place-items-center">
          <div
            className="w-full inset-x-0 [view-transition-name:agent-input-container]"
            style={agentInputTransitionStyle}
          >
            <div className="mx-auto w-full max-w-[360px] sm:max-w-md px-4">
              {/* Recommendation pills marquee (small footprint, above input) */}
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
              <AgentInput
                variant="light"
                defaultPrompt={''}
                showReset={false}
                onReset={handleReset}
                onSend={handleSend}
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          className="sticky inset-x-0 top-3 z-10 [view-transition-name:agent-input-container]"
          style={agentInputTransitionStyle}
        >
          <div className="mx-auto w-full max-w-[360px] sm:max-w-md px-4">
            <AgentInput
              variant="light"
              defaultPrompt={latestPrompt || initialPrompt}
              showReset={true}
              onReset={handleReset}
              onSend={handleSend}
            />
          </div>
        </div>
      )}

      {hasSearched && (
        <div className="mt-6 space-y-8">
          <section>
            <ProductList basePrompt={initialPrompt} prompt={latestPrompt || initialPrompt} resetCounter={resetCounter} />
          </section>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-4 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-[calc(100%-32px)] max-w-sm">
          <ShopButton>Checkout with Shop</ShopButton>
        </div>
      </div>
    </div>
  )
}
