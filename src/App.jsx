import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CareCompassLanding from './CareCompassLanding'
import PrivacyPolicy from './PrivacyPolicy'
import CareCompassPOC from './CareCompassPOC'
import CareCompassTracker from './CareCompassTracker'
import CareCompassPricing from './CareCompassPricing'
import CareCompassLogin from './CareCompassLogin'
import CareCompassSignup from './CareCompassSignup'
import CareCompassDashboard from './CareCompassDashboard'
import CareCompassSettings from './CareCompassSettings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CareCompassLanding />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/compass" element={<CareCompassPOC />} />
        <Route path="/tracker" element={<CareCompassTracker />} />
        <Route path="/pricing" element={<CareCompassPricing />} />
        <Route path="/login" element={<CareCompassLogin />} />
        <Route path="/signup" element={<CareCompassSignup />} />
        <Route path="/dashboard" element={<CareCompassDashboard />} />
        <Route path="/settings" element={<CareCompassSettings />} />
      </Routes>
    </BrowserRouter>
  )
}
