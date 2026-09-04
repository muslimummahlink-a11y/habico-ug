import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

hydrateRoot(
  rootElement,
  <StrictMode>
    <StartClient />
  </StrictMode>,
)
