/**
 * WelcomeSplash.jsx
 * 
 * Full-page onboarding splash shown at two points:
 *   Step 1 — after signup:   "Set up your account" highlighted
 *   Step 2 — after settings: "Take your assessment" highlighted
 * 
 * Driven by localStorage key: cc-onboarding-step (1 | 2 | complete)
 * Route: /welcome  (protected)
 */

import React from "react";
import { useAuth } from "./AuthContext";

const SAGE       = "#7a9e87";
const SAGE_LIGHT = "#e8f0eb";
const SAGE_DARK  = "#4a7058";
const TEAL       = "#4a9fa5";
const TEAL_LIGHT = "#e0f2f4";
const WARM_GRAY  = "#6b6560";
const OFF_WHITE  = "#fafaf8";
const INK        = "#2d2926";
const BORDER     = "rgba(0,0,0,0.08)";

const BotanicalMark = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
    <circle cx="36" cy="36" r="34" fill="#e8f0eb" stroke="#7a9e87" strokeWidth="1"/>
    <ellipse cx="36" cy="17" rx="7" ry="17" fill="#4a7058"/>
    <ellipse cx="36" cy="55" rx="5.5" ry="13" fill="#7a9e87" opacity="0.55"/>
    <ellipse cx="55" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.8"/>
    <ellipse cx="17" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.45"/>
    <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.4" transform="rotate(42 36 36) translate(0 -14)"/>
    <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.4" transform="rotate(-42 36 36) translate(0 -14)"/>
    <ellipse cx="36" cy="36" rx="3.5" ry="9" fill="#4a9fa5" opacity="0.6" transform="rotate(135 36 36) translate(0 -14)"/>
    <ellipse cx="36" cy="36" rx="3.5" ry="9" fill="#4a9fa5" opacity="0.6" transform="rotate(-135 36 36) translate(0 -14)"/>
    <circle cx="36" cy="36" r="7" fill="#4a7058"/>
    <circle cx="36" cy="36" r="3" fill="#e8f0eb"/>
  </svg>
);

const STEPS = [
  {
    num: 1,
    icon: "⚙️",
    title: "Set up your account",
    desc: "Add your medications, care team, family history, and health context. This pre-fills your assessment and makes every insight more accurate.",
    cta: "Set up my account →",
    href: "/account?setup=true",
    skipLabel: "Skip for now",
    skipHref: "/welcome?step=2",
  },
  {
    num: 2,
    icon: "🧭",
    title: "Take your assessment",
    desc: "Map your symptoms across every area of your health. AI surfaces patterns, specialist recommendations, and questions to bring to your doctor.",
    cta: "Start my assessment →",
    href: "/compass",
    skipLabel: "I'll do this later",
    skipHref: "/dashboard",
  },
  {
    num: 3,
    icon: "📋",
    title: "Track & bring reports",
    desc: "Log daily symptoms, generate doctor-ready reports, and watch patterns emerge over time.",
    cta: null, // shown as future step only
    skipLabel: null,
  },
];

export default function WelcomeSplash() {
  const { user } = useAuth();
  const displayName = localStorage.getItem("cc-display-name") || user?.displayName || user?.firstName || "";

  // Read step from URL param
  const params = new URLSearchParams(window.location.search);
  const stepParam = parseInt(params.get("step") || "1", 10);
  const activeStep = Math.min(Math.max(stepParam, 1), 2);

  // Update stored onboarding step
  React.useEffect(() => {
    try { localStorage.setItem("cc-onboarding-step", String(activeStep)); } catch {}
  }, [activeStep]);

  const current = STEPS[activeStep - 1];

  return (
    <div style={{ minHeight: "100vh", background: OFF_WHITE, display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <nav style={{ padding: "1.25rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}`, background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <BotanicalMark size={30}/>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: INK }}>Care Compass</span>
        </div>
        <a href="/dashboard" style={{ fontSize: "0.82rem", color: WARM_GRAY, textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.2)" }}>
          Go to dashboard
        </a>
      </nav>

      {/* Content */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ maxWidth: 560, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem", textAlign: "center" }}>

          <BotanicalMark size={64}/>

          {/* Greeting */}
          {displayName && (
            <div style={{ background: SAGE_LIGHT, color: SAGE_DARK, borderRadius: "100px", padding: "0.4rem 1.25rem", fontSize: "0.9rem", fontWeight: 600 }}>
              Welcome, {displayName}! 🌿
            </div>
          )}

          {/* Heading */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.75rem, 4vw, 2.4rem)", fontWeight: 700, color: INK, margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              {activeStep === 1 ? "Let's get you set up." : "Time for your assessment."}
            </h1>
            <p style={{ fontSize: "1rem", color: WARM_GRAY, lineHeight: 1.75, margin: 0 }}>
              {activeStep === 1
                ? "A quick account setup means your assessment will be pre-filled with your details — saving you time and making your insights more accurate."
                : "Your account is ready. Now let's map your symptoms so Care Compass can surface patterns and help you have better conversations with your doctors."
              }
            </p>
          </div>

          {/* Step cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", textAlign: "left" }}>
            {STEPS.map((step, idx) => {
              const isActive   = step.num === activeStep;
              const isComplete = step.num < activeStep;
              const isFuture   = step.num > activeStep;
              return (
                <div key={step.num} style={{
                  display: "flex", gap: "1rem", alignItems: "flex-start",
                  background: isActive ? "#fff" : isComplete ? SAGE_LIGHT : "#f5f5f3",
                  borderRadius: "1rem", padding: "1rem 1.25rem",
                  border: `1.5px solid ${isActive ? SAGE : isComplete ? SAGE : BORDER}`,
                  boxShadow: isActive ? "0 2px 16px rgba(74,112,88,0.12)" : "none",
                  opacity: isFuture ? 0.5 : 1,
                  transition: "all 0.2s",
                }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0, marginTop: "0.05rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isComplete ? "1rem" : "0.82rem", fontWeight: 700,
                    background: isActive ? SAGE_DARK : isComplete ? SAGE : "#ddd",
                    color: isActive || isComplete ? "#fff" : WARM_GRAY,
                  }}>
                    {isComplete ? "✓" : step.num}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: 700, color: isActive ? INK : isComplete ? SAGE_DARK : WARM_GRAY, margin: "0 0 0.2rem" }}>
                      {step.title}
                    </p>
                    <p style={{ fontSize: "0.82rem", color: WARM_GRAY, lineHeight: 1.6, margin: 0 }}>
                      {step.desc}
                    </p>
                  </div>
                  {isActive && (
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: SAGE_DARK, background: SAGE_LIGHT, borderRadius: "100px", padding: "0.2rem 0.7rem", whiteSpace: "nowrap", alignSelf: "center" }}>
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Privacy note */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", background: SAGE_LIGHT, borderRadius: "0.75rem", padding: "0.875rem 1.25rem", width: "100%", textAlign: "left" }}>
            <span style={{ flexShrink: 0 }}>🔒</span>
            <p style={{ fontSize: "0.8rem", color: SAGE_DARK, lineHeight: 1.6, margin: 0 }}>
              Your data is stored privately on your device only. It is never uploaded, sold, or shared without your consent.
            </p>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", width: "100%" }}>
            <a
              href={current.href}
              style={{
                background: SAGE_DARK, color: "#fff", textDecoration: "none",
                padding: "1rem 2rem", borderRadius: "100px", fontSize: "1rem",
                fontWeight: 700, width: "100%", textAlign: "center",
                boxSizing: "border-box", boxShadow: "0 4px 16px rgba(74,112,88,0.25)",
                transition: "all 0.15s",
              }}
            >
              {current.cta}
            </a>
            {current.skipLabel && (
              <a
                href={current.skipHref}
                style={{ fontSize: "0.85rem", color: WARM_GRAY, textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.2)" }}
              >
                {current.skipLabel}
              </a>
            )}
          </div>

        </div>
      </main>

      <footer style={{ padding: "1.25rem 2rem", textAlign: "center", borderTop: `1px solid ${BORDER}` }}>
        <p style={{ fontSize: "0.75rem", color: "#aaa", margin: 0 }}>
          © {new Date().getFullYear()} Care Compass · Not medical advice
        </p>
      </footer>
    </div>
  );
}
