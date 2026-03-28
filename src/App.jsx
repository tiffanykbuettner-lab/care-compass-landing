import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CareCompassLanding from './CareCompassLanding'
import PrivacyPolicy from './PrivacyPolicy'
import CareCompassPOC from './CareCompassPOC'
import CareCompassTracker from './CareCompassTracker'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CareCompassLanding />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/compass" element={<CareCompassPOC />} />
        <Route path="/tracker" element={<CareCompassTracker />} />
      </Routes>
    </BrowserRouter>
  )
}