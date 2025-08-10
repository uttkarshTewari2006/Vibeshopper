import {useCallback, useState} from 'react'
import {IntroScreen} from './IntroScreen'
import {ResultsScreen} from './ResultsScreen'

export function AgentExperience() {
  const [mode, setMode] = useState<'intro' | 'results'>('intro')
  const [initialPrompt, setInitialPrompt] = useState<string>('')
  const [latestPrompt, setLatestPrompt] = useState<string>('')
  const [promptChain, setPromptChain] = useState<Array<{id: string; prompt: string; timestamp: Date}>>([])

  const animateToResults = useCallback((payload: {prompt: string; imageFile?: File}) => {
    const p = payload.prompt ?? ''
    setInitialPrompt(p)
    setLatestPrompt(p)
    
    // Add initial prompt to chain as the first item
    const initialPromptItem = {
      id: Date.now().toString(),
      prompt: p,
      timestamp: new Date()
    }
    setPromptChain([initialPromptItem])
    
    const go = () => {
      setMode('results')
    }
    // @ts-ignore - experimental API in TS lib
    const canTransition = typeof document !== 'undefined' && !!document.startViewTransition
    // @ts-ignore - experimental API
    return canTransition ? document.startViewTransition(go) : go()
  }, [])

  const handlePromptChange = useCallback((prompt: string) => {
    setLatestPrompt(prompt)
    
    if (prompt && prompt !== initialPrompt) {
      // Only add to chain if it's a new/different prompt
      const newPromptItem = {
        id: Date.now().toString(),
        prompt: prompt,
        timestamp: new Date()
      }
      setPromptChain(prev => [...prev, newPromptItem])
    } else if (!prompt) {
      // If prompt is empty (reset), clear everything
      setInitialPrompt('')
      setPromptChain([])
    }
  }, [initialPrompt])

  if (mode === 'intro') {
    return <IntroScreen onSend={animateToResults} />
  }

  return <ResultsScreen 
    initialPrompt={initialPrompt} 
    latestPrompt={latestPrompt} 
    onPromptChange={handlePromptChange}
    promptChain={promptChain}
    onReset={() => {
      setInitialPrompt('')
      setLatestPrompt('')
      setPromptChain([])
    }}
  />
}

