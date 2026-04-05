import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';

import CareCompassLanding  from './CareCompassLanding';
import CareCompassPricing  from './CareCompassPricing';
import CareCompassSignup   from './CareCompassSignup';
import CareCompassLogin    from './CareCompassLogin';
import CareCompassSettings from './CareCompassSettings';
import CareCompassDashboard from './CareCompassDashboard';
import CareCompassTracker  from './CareCompassTracker';
import CareCompassPOC      from './CareCompassPOC';
import PrivacyPolicy       from './PrivacyPolicy';
import WelcomeSplash      from './WelcomeSplash';

/**
 * Route structure:
 * 
 * PUBLIC (no auth required)
 *   /                → Landing page
 *   /pricing         → Pricing
 *   /signup          → Create account
 *   /login           → Log in
 *   /compass         → Assessment (public — works as demo too)
 *   /privacy         → Privacy policy
 * 
 * PROTECTED (auth required → redirects to /login)
 *   /dashboard       → Main dashboard
 *   /tracker         → Symptom tracker
 *   /account         → Account settings
 * 
 * REDIRECTS
 *   /onboarding      → /dashboard (signup used to send here)
 *   anything else    → /
 * 
 * TESTING NOTE: All routes are currently public for cross-device testing.
 * Re-add ProtectedRoute wrappers when Clerk auth is live.
 *
 * CLERK INTEGRATION NOTE:
 * When Clerk is added, wrap this file's AuthProvider with ClerkProvider
 * and replace AuthProvider / ProtectedRoute with Clerk equivalents.
 * The route structure stays identical.
 */

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Public routes ── */}
          <Route path="/"        element={<CareCompassLanding />} />
          <Route path="/pricing" element={<CareCompassPricing />} />
          <Route path="/signup"  element={<CareCompassSignup />} />
          <Route path="/login"   element={<CareCompassLogin />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Assessment — public so it works as a demo and for returning users */}
          <Route path="/compass" element={<CareCompassPOC />} />

          {/* ── Protected routes ── */}
          <Route path="/dashboard" element={<CareCompassDashboard />}/>

          <Route path="/tracker" element={<CareCompassTracker />}/>

          <Route path="/welcome" element={<WelcomeSplash />}/>

          <Route path="/account" element={<CareCompassSettings />}/>

          {/* ── Redirects ── */}
          {/* Signup used to send users to /onboarding — redirect to dashboard now */}
          <Route path="/onboarding" element={<Navigate to="/welcome" replace />} />

          {/* Catch-all → home */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
