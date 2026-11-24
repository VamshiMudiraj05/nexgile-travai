import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Register PWA Service Worker for offline resilience
registerSW({
  immediate: true,
  onOfflineReady() {
    console.info('✈️ Nexgile-TravAI PWA is ready for offline airplane mode.');
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
