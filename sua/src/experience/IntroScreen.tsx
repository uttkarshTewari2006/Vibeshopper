import React from 'react'
import {AgentInput} from '../components/AgentInput'
import {useTilt} from '../hooks/useTilt'
import ShinyText from '../blocks/TextAnimations/ShinyText/ShinyText.jsx'

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
        style={{...agentInputTransitionStyle, bottom: 'calc(env(safe-area-inset-bottom) + 30px)'}}
      >
        <div className="mx-auto max-w-md px-6">
          <AgentInput onSend={onSend} />
        </div>
      </div>
    </div>
  )
}