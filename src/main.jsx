import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import InstallBanner from './InstallBanner.jsx'

const root = createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    <App />
    <InstallBanner />
  </StrictMode>
)

// Signal to index.html that React has mounted → hides the splash screen
window.dispatchEvent(new CustomEvent('carecompass-ready'))
