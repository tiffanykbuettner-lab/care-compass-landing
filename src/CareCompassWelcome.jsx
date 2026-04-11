import React, { useEffect, useState } from "react";

const SAGE       = "#7a9e87";
const SAGE_LIGHT = "#e8f0eb";
const SAGE_DARK  = "#4a7058";
const TEAL       = "#4a9fa5";
const TEAL_LIGHT = "#e0f2f4";
const WARM_GRAY  = "#6b6560";
const OFF_WHITE  = "#fafaf8";
const INK        = "#2d2926";
const INK_LIGHT  = "#4a4540";

const BotanicalMark = ({ size = 32 }) => (
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

/* ─────────────────────────────────────────────────────────────────────────────
   Step 1 — Account setup prompt
   (user arrived from signup, hasn't set up account yet)
───────────────────────────────────────────────────────────────────────────── */
function StepOne() {
  return (
    <div style={wStyles.card}>
      <BotanicalMark size={56}/>

      <div style={wStyles.badge}>Step 1 of 2</div>

      <div style={wStyles.textBlock}>
        <h1 style={wStyles.heading}>Let's personalise your experience</h1>
        <p style={wStyles.sub}>
          Before we map your symptoms, take a moment to add your medications, care team,
          and health background. This context makes your Care Compass insights significantly
          more accurate and useful.
        </p>
      </div>

      <div style={wStyles.featureList}>
        {[
          { icon: "💊", label: "Your medications", desc: "So we know what you're managing and for how long" },
          { icon: "👩‍⚕️", label: "Your care team", desc: "So reports go to the right providers" },
          { icon: "🩺", label: "Your health history", desc: "Context that sharpens every AI insight" },
        ].map(f => (
          <div key={f.label} style={wStyles.featureItem}>
            <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>{f.icon}</span>
            <div>
              <p style={wStyles.featureLabel}>{f.label}</p>
              <p style={wStyles.featureDesc}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={wStyles.actions}>
        <a
          href="/account?setup=true"
          style={wStyles.primaryBtn}
          onClick={() => { try { localStorage.setItem("cc-onboarding-step", "1"); } catch {} }}
        >
          Set up my account →
        </a>
        <button
          style={wStyles.secondaryLink}
          onClick={() => {
            try {
              localStorage.setItem("cc-onboarding-step", "2");
              localStorage.setItem("cc-skipped-account-setup", "true");
            } catch {}
            window.location.href = "/welcome?step=2";
          }}
        >
          I'll do this later
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Step 2 — Assessment prompt
   (user has finished account setup, or skipped it)
───────────────────────────────────────────────────────────────────────────── */
function StepTwo() {
  const skippedSetup = (() => {
    try { return localStorage.getItem("cc-skipped-account-setup") === "true"; } catch { return false; }
  })();

  const handleSkip = () => {
    try {
      // Clear onboarding step — they're going to dashboard as a real user now
      localStorage.setItem("cc-onboarding-step", "complete");
      // Set flag so dashboard Sage knows to nudge them toward the assessment
      localStorage.setItem("cc-skipped-assessment", "true");
    } catch {}
    window.location.href = "/dashboard";
  };

  const handleTakeAssessment = () => {
    try { localStorage.setItem("cc-onboarding-step", "complete"); } catch {}
    window.location.href = "/compass";
  };

  return (
    <div style={wStyles.card}>
      <BotanicalMark size={56}/>

      <div style={wStyles.badge}>{skippedSetup ? "Next step" : "Step 2 of 2"}</div>

      <div style={wStyles.textBlock}>
        <h1 style={wStyles.heading}>Map your symptoms with AI</h1>
        <p style={wStyles.sub}>
          The Care Compass assessment walks through every area of your health — joints,
          digestion, heart, hormones, energy, and more. The AI surfaces patterns across
          your symptoms that might point to connections you haven't considered.
        </p>
      </div>

      <div style={wStyles.highlightBox}>
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "0.1rem" }}>
          <circle cx="8" cy="8" r="6.5" stroke={SAGE_DARK} strokeWidth="1.3"/>
          <path d="M8 7v4" stroke={SAGE_DARK} strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="8" cy="5.5" r="0.7" fill={SAGE_DARK}/>
        </svg>
        <p style={{ fontSize: "0.85rem", color: SAGE_DARK, margin: 0, lineHeight: 1.65 }}>
          The assessment takes about <strong>10–15 minutes</strong> and generates a personalised
          insights report you can download and bring to your next appointment.
        </p>
      </div>

      <div style={wStyles.featureList}>
        {[
          { icon: "🔍", label: "Pattern recognition", desc: "AI looks for connections across all your symptoms" },
          { icon: "📋", label: "Specialist guidance", desc: "Know which type of specialist to seek out and why" },
          { icon: "💬", label: "Doctor-ready questions", desc: "Walk in with the right things to ask" },
        ].map(f => (
          <div key={f.label} style={wStyles.featureItem}>
            <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>{f.icon}</span>
            <div>
              <p style={wStyles.featureLabel}>{f.label}</p>
              <p style={wStyles.featureDesc}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={wStyles.actions}>
        <button onClick={handleTakeAssessment} style={wStyles.primaryBtn}>
          Take the assessment →
        </button>
        <button onClick={handleSkip} style={wStyles.secondaryLink}>
          I'll do this later
        </button>
      </div>

      <p style={wStyles.footnote}>
        You can always take or retake the assessment from your dashboard at any time.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Welcome page — reads ?step= from URL
───────────────────────────────────────────────────────────────────────────── */
export default function CareCompassWelcome() {
  const step = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("step") || "2";
    } catch { return "2"; }
  })();

  // Guard: if onboarding is already complete, redirect to dashboard
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cc-onboarding-step");
      if (stored === "complete") window.location.href = "/dashboard";
    } catch {}
  }, []);

  return (
    <div style={wStyles.root}>
      {/* Minimal nav */}
      <nav style={wStyles.nav}>
        <a href="/" style={wStyles.navLogo}>
          <BotanicalMark size={28}/>
          <span style={wStyles.navLogoText}>Care Compass</span>
        </a>
      </nav>

      <main style={wStyles.main}>
        {step === "1" ? <StepOne /> : <StepTwo />}
      </main>

      <footer style={wStyles.footer}>
        <p style={wStyles.footerText}>
          © {new Date().getFullYear()} Care Compass ·{" "}
          <a href="mailto:hello@joincarecompass.com" style={wStyles.footerLink}>hello@joincarecompass.com</a>
        </p>
        <p style={wStyles.footerDisclaimer}>
          Care Compass is not a medical service and does not provide medical advice, diagnosis, or treatment.
        </p>
      </footer>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const wStyles = {
  root: {
    fontFamily: "'DM Sans', Helvetica, sans-serif",
    color: INK,
    background: OFF_WHITE,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  nav: {
    padding: "1rem 2rem",
    borderBottom: "1px solid rgba(0,0,0,0.07)",
    background: "#fff",
    display: "flex",
    alignItems: "center",
  },
  navLogo: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    textDecoration: "none",
  },
  navLogoText: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.1rem",
    fontWeight: 700,
    color: SAGE_DARK,
  },
  main: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 1.5rem",
  },
  card: {
    background: "#fff",
    borderRadius: "1.5rem",
    border: "1px solid rgba(0,0,0,0.07)",
    padding: "2.5rem 2rem",
    maxWidth: 520,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "1.5rem",
    boxShadow: "0 4px 40px rgba(0,0,0,0.06)",
  },
  badge: {
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: TEAL,
    background: TEAL_LIGHT,
    padding: "0.3rem 0.875rem",
    borderRadius: "100px",
  },
  textBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  heading: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
    fontWeight: 700,
    color: INK,
    margin: 0,
    lineHeight: 1.25,
  },
  sub: {
    fontSize: "0.95rem",
    color: WARM_GRAY,
    lineHeight: 1.75,
    margin: 0,
  },
  highlightBox: {
    background: SAGE_LIGHT,
    borderRadius: "0.875rem",
    padding: "0.875rem 1.1rem",
    display: "flex",
    gap: "0.75rem",
    alignItems: "flex-start",
    textAlign: "left",
    width: "100%",
    boxSizing: "border-box",
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    width: "100%",
    textAlign: "left",
  },
  featureItem: {
    display: "flex",
    gap: "0.875rem",
    alignItems: "flex-start",
    background: OFF_WHITE,
    borderRadius: "0.75rem",
    padding: "0.75rem 1rem",
  },
  featureLabel: {
    fontSize: "0.88rem",
    fontWeight: 600,
    color: INK,
    margin: "0 0 0.1rem",
  },
  featureDesc: {
    fontSize: "0.8rem",
    color: WARM_GRAY,
    margin: 0,
    lineHeight: 1.5,
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
    width: "100%",
  },
  primaryBtn: {
    background: SAGE_DARK,
    color: "#fff",
    border: "none",
    borderRadius: "100px",
    padding: "0.95rem 2rem",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    textDecoration: "none",
    display: "block",
    width: "100%",
    textAlign: "center",
    boxSizing: "border-box",
  },
  secondaryLink: {
    background: "transparent",
    border: "none",
    color: WARM_GRAY,
    fontSize: "0.875rem",
    cursor: "pointer",
    fontFamily: "inherit",
    textDecoration: "underline",
    textDecorationColor: "rgba(0,0,0,0.2)",
    padding: 0,
  },
  footnote: {
    fontSize: "0.78rem",
    color: "#aaa",
    margin: 0,
    fontStyle: "italic",
  },
  footer: {
    padding: "1.5rem 2rem",
    borderTop: "1px solid rgba(0,0,0,0.07)",
    textAlign: "center",
  },
  footerText: {
    fontSize: "0.85rem",
    color: WARM_GRAY,
    margin: "0 0 0.25rem",
  },
  footerLink: {
    color: SAGE_DARK,
    textDecoration: "none",
  },
  footerDisclaimer: {
    fontSize: "0.75rem",
    color: "#aaa",
    margin: 0,
  },
};
