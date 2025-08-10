import { useEffect } from 'react'
import { fal } from '@fal-ai/client'
import { AgentExperience } from './experience/AgentExperience'
import { DataSyncService } from './services/dataSyncService'

// Configure Fal using env key (frontend-safe)
const FAL_KEY = import.meta.env.VITE_FAL_KEY
if (FAL_KEY) {
  try {
    fal.config({ credentials: FAL_KEY })
  } catch {}
}

export function App() {
  // Initialize backend services once
  useEffect(() => {
    DataSyncService.getInstance().initialize()
  }, [])

  return <AgentExperience />
}


