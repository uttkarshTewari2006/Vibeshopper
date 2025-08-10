import React from 'react'
import {AgentInput} from '../components/AgentInput'
import {useTilt} from '../hooks/useTilt'
import ShinyText from '../blocks/TextAnimations/ShinyText/ShinyText.jsx'
import {RotatingCart} from '../components/RotatingCart'

interface IntroScreenProps {
  onSend: (payload: {prompt: string; imageFile?: File}) => void
}

export function IntroScreen({onSend}: IntroScreenProps) {
  const logoRef = useTilt(6)
  const agentInputTransitionStyle = {['viewTransitionName' as any]: 'agent-input'} as React.CSSProperties

  return (
    <div className="min-h-screen h-screen px-4 intro-bg relative overflow-hidden">
      <div className="subtle-grid"></div>
      <div className="bokeh">
        <span style={{left: '10%', top: '8%'}} />
        <span style={{right: '12%', top: '14%'}} />
        <span style={{left: '18%', bottom: '10%'}} />
        <span style={{right: '16%', bottom: '12%'}} />
      </div>
      <div className="vignette" />
      <div className="relative z-10 mx-auto text-center flex min-h-[70vh] flex-col items-center justify-center px-6">
        <div className="w-full max-w-md relative z-20" style={{ perspective: '1000px' }}>
          <div className="relative h-96 w-full">
            <RotatingCart
              heightClassName="h-full"
              scale={0.5}
            />
          </div>
        </div>

        <div ref={logoRef} className="mx-auto w-full max-w-[620px]">
          <div className="logo-wrap">
            <img src="vibeshopperlogo.svg" alt="vibeshopper" className="w-full h-auto select-none drop-shadow-sm" />
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
        style={{...agentInputTransitionStyle, bottom: 'calc(env(safe-area-inset-bottom) + 30px)'}}
      >
        <div className="mx-auto max-w-md px-6 space-y-3">
          <div className="ideas-marquee">
            <div className="ideas-track">
              {[
                { label: '🪴 Blue ceramic plant pots bundle', prompt: 'Looking for a bundle to start a windowsill garden with blue ceramic pots. Include containers, potting soil, tools, seeds/plants, and a garden planner app.' },
                { label: '👕 Midnight‑blue athleisure fit', prompt: 'Need a cozy midnight‑blue athleisure fit. Include tops, bottoms, accessories, laundry consumables, and a fitness planner app.' },
                { label: '💻 Minimal black desk setup', prompt: 'Build a minimalist black desk setup. Include tools, cable management accessories, containers, lighting, and a task planner app.' },
                { label: '🍳 Retro pastel kitchen tools', prompt: 'Retro pastel kitchen tools set. Include utensil set, mixing bowls, bakeware, cleaning consumables, and a recipe planner app.' },
                { label: '🏕️ Weekend camping < $150', prompt: 'Weekend camping essentials under $150. Include tools, consumables, containers, accessories, and a trip planner app.' },
              ].map((idea, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSend({prompt: idea.prompt})}
                  className="idea-pill shrink-0 mx-1 px-3 h-7 rounded-2xl text-[11px] whitespace-nowrap transition-colors"
                >
                  {idea.label}
                </button>
              ))}
            </div>
          </div>
          <AgentInput onSend={onSend} />
        </div>
      </div>
    </div>
  )
}