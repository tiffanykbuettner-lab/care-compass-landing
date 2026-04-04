/**
 * ProtectedRoute.jsx
 * 
 * Wraps any route that requires authentication.
 * If not logged in → redirect to /login.
 * Shows a loading state while auth is being checked.
 * 
 * Usage:
 *   <Route path="/dashboard" element={<ProtectedRoute><CareCompassDashboard /></ProtectedRoute>} />
 * 
 * When Clerk is integrated:
 * - Replace this with Clerk's <SignedIn> / <RedirectToSignIn> components
 * - Or use Clerk's middleware for server-side protection
 */

import { useAuth } from "./AuthContext";
import { Navigate, useLocation } from "react-router-dom";

const SAGE_LIGHT = "#e8f0eb";
const SAGE_DARK  = "#4a7058";
const INK        = "#2d2926";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // While checking auth — show branded loading screen
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: SAGE_LIGHT,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "1rem",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: `3px solid ${SAGE_DARK}`, borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: "0.85rem", color: SAGE_DARK, fontFamily: "sans-serif", margin: 0 }}>
          Loading...
        </p>
      </div>
    );
  }

  // Not authenticated — redirect to login, preserving the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
