import React, {useCallback, useState} from 'react'
import {Skeleton, Button as ShopButton} from '@shopify/shop-minis-react'
import {AgentInput} from '../components/AgentInput'
import {useTilt} from '../hooks/useTilt'
import ShinyText from '../blocks/TextAnimations/ShinyText/ShinyText.jsx'
//import { RotatingCart } from "../components/RotatingCart";
//import {CartPath} from '../components/CartPath'

function PlaceholderProductGrid() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[0, 1, 2, 3].map(key => (
        <div key={key} className="rounded-xl ring-1 ring-black/5 p-2 bg-white">
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="mt-2 space-y-2">
            <Skeleton className="h-3 w-9/12" />
            <Skeleton className="h-3 w-5/12" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AgentExperience() {
  const [mode, setMode] = useState<'intro' | 'results'>('intro')
  const logoRef = useTilt(6)

  const animateToResults = useCallback(() => {
    const go = () => setMode('results')
    // @ts-ignore - experimental API in TS lib
    const canTransition = typeof document !== 'undefined' && !!document.startViewTransition
    // @ts-ignore - experimental API
    return canTransition ? document.startViewTransition(go) : go()
  }, [])

  const agentInputTransitionStyle = {['viewTransitionName' as any]: 'agent-input'} as React.CSSProperties

  if (mode === 'intro') {
    return (
      <div className="min-h-[92vh] px-4 intro-bg relative overflow-hidden">
        <div className="subtle-grid"></div>
        <div className="bokeh">
          <span style={{left: '10%', top: '8%'}} />
          <span style={{right: '12%', top: '14%'}} />
          <span style={{left: '18%', bottom: '10%'}} />
          <span style={{right: '16%', bottom: '12%'}} />
        </div>
        <div className="vignette" />
        <div className="relative z-10 mx-auto text-center flex min-h-[70vh] flex-col items-center justify-center px-6">
           {/* <div className="w-full max-w-md mb-6">
            <RotatingCart
              heightClassName="h-80"
              radius={2.0}
              speed={0.9}
              scale={1.0}
            />
          </div>  */}

          <div ref={logoRef} className="mx-auto w-full max-w-[620px]">
            <div className="logo-wrap">
              <img src="src/public/vibeshopperlogo.svg" alt="vibeshopper" className="w-full h-auto select-none drop-shadow-sm" />
              <div className="logo-grain"></div>
            </div>
          </div>

          <div className="mt-3 text-sm max-w-sm">
            <ShinyText
              text="Describe the vibe and discover spot‑on picks and effortless bundles."
              speed={3.8}
              className="!text-[#4a4a4acc]"
            />
          </div>
        </div>

        <div
          className="fixed inset-x-0 bottom-16 z-20 [view-transition-name:agent-input-container]"
          style={{...agentInputTransitionStyle, bottom: 'calc(env(safe-area-inset-bottom) + 64px)'}}
        >
          <div className="mx-auto max-w-md px-6">
            <AgentInput onSend={animateToResults} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-4 pb-28 px-4">
      <div className="sticky top-3 z-10" style={agentInputTransitionStyle}>
        <AgentInput onSend={() => {}} />
      </div>

      <div className="mt-6 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-3">Results</h2>
          <PlaceholderProductGrid />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-4 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-[calc(100%-32px)] max-w-sm">
          <ShopButton>Checkout with Shop</ShopButton>
        </div>
      </div>
    </div>
  )
}


