import {useCallback, useState} from 'react'
import {IntroScreen} from './IntroScreen'
import {ResultsScreen} from './ResultsScreen'

export function AgentExperience() {
  const [mode, setMode] = useState<'intro' | 'results'>('intro')
  const [initialPrompt, setInitialPrompt] = useState<string>('')
  const [latestPrompt, setLatestPrompt] = useState<string>('')

  const animateToResults = useCallback((payload: {prompt: string; imageFile?: File}) => {
    console.log('[AgentExperience] animateToResults called with:', payload)
    const p = payload.prompt ?? ''
    setInitialPrompt(p)
    setLatestPrompt(p)
    const go = () => {
      console.log('[AgentExperience] Setting mode to results')
      setMode('results')
    }
    // @ts-ignore - experimental API in TS lib
    const canTransition = typeof document !== 'undefined' && !!document.startViewTransition
    // @ts-ignore - experimental API
    return canTransition ? document.startViewTransition(go) : go()
  }, [])

  const handlePromptChange = useCallback((prompt: string) => {
    setLatestPrompt(prompt)
    // If prompt is empty (reset), also clear the initial prompt
    if (!prompt) {
      setInitialPrompt('')
    }
  }, [])

  if (mode === 'intro') {
    return <IntroScreen onSend={animateToResults} />
  }

  return <ResultsScreen initialPrompt={initialPrompt} latestPrompt={latestPrompt} onPromptChange={handlePromptChange} />
}


