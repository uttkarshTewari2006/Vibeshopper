import { fal } from '@fal-ai/client'
import {AgentExperience} from './experience/AgentExperience'

// Configure FAL for AI capabilities
fal.config({
  credentials: import.meta.env.VITE_FAL_KEY
});

// Intentionally left minimal; all UI provided by AgentExperience

export function App() {
  return <AgentExperience />
}
