import React, { useEffect } from "react";

const SAGE        = "#7a9e87";
const SAGE_LIGHT  = "#e8f0eb";
const SAGE_DARK   = "#4a7058";
const TEAL        = "#4a9fa5";
const TEAL_LIGHT  = "#e0f2f4";
const WARM_GRAY   = "#6b6560";
const OFF_WHITE   = "#fafaf8";
const INK         = "#2d2926";
const INK_LIGHT   = "#4a4540";

/* ── localStorage helpers ───────────────────────────────────────────────── */
const flag = {
  get: (k)    => { try { return localStorage.getItem(k); }    catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); }        catch {} },
};

/* ── Flag reference ─────────────────────────────────────────────────────────
   cc-onboarding-step  : "welcome" | "setup" | "assessment" | "complete"
   cc-setup-complete   : "true" — set by Settings when saved in setup mode
   cc-assessment-done  : "true" — set by POC on first completion
   cc-skipped-setup    : "true" — set when user skips step 1
   cc-skipped-assessment : "true" — set when user skips step 2
────────────────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    num: 1,
    icon: "⚙️",
    title: "Set up your profile",
    desc: "Add your medications, care team, conditions, and health history. This context makes every AI insight significantly more accurate.",
    details: [
      "Your current medications & how long you've taken them",
      "Your care team & specialists",
      "Family history & existing diagnoses",
    ],
    doneFlag: "cc-setup-complete",
    cta: "Set up my profile →",
    href: "/account?setup=true",
    skipLabel: "I'll do this later",
    time: "5–10 min",
    onCtaClick: () => flag.set("cc-onboarding-step", "setup"),
  },
  {
    num: 2,
    icon: "🧭",
    title: "Take the assessment",
    desc: "A comprehensive symptom map across every body system. AI surfaces patterns, suggests which specialists to see, and generates questions for your doctor.",
    details: [
      "Covers joints, digestion, heart, hormones, energy & more",
      "AI pattern recognition across all symptoms",
      "Downloadable insights report for your appointments",
    ],
    doneFlag: "cc-assessment-done",
    cta: "Take the assessment →",
    href: "/compass",
    skipLabel: "I'll do this later",
    time: "10–15 min",
    onCtaClick: () => flag.set("cc-onboarding-step", "assessment"),
  },
  {
    num: 3,
    icon: "📋",
    title: "Start tracking daily",
    desc: "Log how you feel in real time — symptoms, food, sleep, medications, and activity. The more you track, the sharper your patterns become.",
    details: [
      "Daily symptom log with severity & timing",
      "Trends, AI insights, and doctor-ready reports",
      "Reports generated automatically before appointments",
    ],
    doneFlag: null,
    cta: "Open the tracker →",
    href: "/tracker",
    skipLabel: null,
    time: "2–3 min/day",
    onCtaClick: () => flag.set("cc-onboarding-step", "complete"),
  },
];

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

export default function CareCompassWelcome() {
  // Determine which step is active from URL or flags
  const activeStep = (() => {
    try {
      const param = new URLSearchParams(window.location.search).get("step");
      if (param === "2") return 2;
      if (param === "3") return 3;
      if (flag.get("cc-setup-complete") !== "true") return 1;
      if (flag.get("cc-assessment-done") !== "true") return 2;
      return 3;
    } catch { return 1; }
  })();

  // Guard: already fully onboarded → dashboard
  useEffect(() => {
    if (flag.get("cc-onboarding-step") === "complete") {
      window.location.href = "/dashboard";
    }
    // Mark that they've seen the welcome page
    flag.set("cc-onboarding-step", "welcome");
  }, []);

  const setupDone      = flag.get("cc-setup-complete")  === "true";
  const assessmentDone = flag.get("cc-assessment-done") === "true";

  const status = (num) => {
    if (num === 1) return setupDone      ? "done" : num === activeStep ? "active" : "pending";
    if (num === 2) return assessmentDone ? "done" : num === activeStep ? "active" : "pending";
    return num === activeStep ? "active" : "pending";
  };

  const skipAll = () => {
    flag.set("cc-onboarding-step", "complete");
    if (!setupDone)      flag.set("cc-skipped-setup",       "true");
    if (!assessmentDone) flag.set("cc-skipped-assessment",  "true");
    window.location.href = "/dashboard";
  };

  const skipStep = () => {
    if (activeStep === 1) {
      flag.set("cc-skipped-setup", "true");
      window.location.href = "/welcome?step=2";
    } else {
      flag.set("cc-skipped-assessment", "true");
      flag.set("cc-onboarding-step", "complete");
      window.location.href = "/dashboard";
    }
  };

  const goToStep = (step) => {
    step.onCtaClick();
    window.location.href = step.href;
  };

  return (
    <div style={s.root}>
      {/* Nav */}
      <nav style={s.nav}>
        <a href="/" style={s.navLogo}>
          <BotanicalMark size={28}/>
          <span style={s.navLogoText}>Care Compass</span>
        </a>
      </nav>

      <main style={s.main}>
        <div style={s.container}>

          {/* Header */}
          <div style={s.header}>
            <p style={s.eyebrow}>Getting started</p>
            <h1 style={s.heading}>Three steps to get the most out of Care Compass</h1>
            <p style={s.sub}>
              Each step builds on the last. Skip any step and come back to it from your dashboard — but the more you set up now, the better your experience from day one.
            </p>
          </div>

          {/* Progress connector */}
          <div style={s.progressRow}>
            {STEPS.map((step, i) => {
              const st = status(step.num);
              return (
                <React.Fragment key={step.num}>
                  <div style={s.progressItem}>
                    <div style={{
                      ...s.progressDot,
                      background: st === "done" || st === "active" ? SAGE_DARK : "#e0dbd5",
                      boxShadow: st === "active" ? `0 0 0 4px ${SAGE_LIGHT}` : "none",
                    }}>
                      {st === "done"
                        ? <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5 6-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <span style={{ fontSize: "0.72rem", fontWeight: 700, color: st === "active" ? "#fff" : "#bbb" }}>{step.num}</span>
                      }
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: st !== "pending" ? 700 : 400, color: st !== "pending" ? SAGE_DARK : "#bbb", textAlign: "center", maxWidth: 80, lineHeight: 1.3 }}>
                      {step.title}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, borderRadius: 1, background: status(step.num) === "done" ? SAGE : "#e0dbd5", margin: "0 0.35rem", marginBottom: "1.5rem", transition: "background 0.3s" }}/>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step cards */}
          <div style={s.cards}>
            {STEPS.map(step => {
              const st = status(step.num);
              const isActive  = st === "active";
              const isDone    = st === "done";
              const isPending = st === "pending";

              return (
                <div key={step.num} style={{
                  ...s.card,
                  border: isActive ? `2px solid ${SAGE_DARK}` : isDone ? `2px solid ${SAGE}` : "2px solid rgba(0,0,0,0.06)",
                  background: isActive ? "#fff" : isDone ? "#fdfffe" : OFF_WHITE,
                  opacity: isPending ? 0.65 : 1,
                }}>
                  {/* Card header row */}
                  <div style={s.cardTop}>
                    <div style={s.cardTopLeft}>
                      <div style={{ ...s.numBadge, background: isActive || isDone ? SAGE_DARK : "#e0dbd5" }}>
                        {isDone
                          ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5 6-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : <span style={{ fontSize: "0.75rem", fontWeight: 700, color: isActive ? "#fff" : "#bbb" }}>{step.num}</span>
                        }
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.15rem" }}>
                          <h2 style={s.cardTitle}>{step.title}</h2>
                          {isActive && <span style={s.tagActive}>Next up</span>}
                          {isDone   && <span style={s.tagDone}>Done ✓</span>}
                        </div>
                        <p style={s.cardTime}>⏱ {step.time}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>{step.icon}</span>
                  </div>

                  {/* Expanded content for active + done */}
                  {!isPending && (
                    <>
                      <p style={s.cardDesc}>{step.desc}</p>
                      <ul style={s.detailList}>
                        {step.details.map(d => (
                          <li key={d} style={s.detailItem}>
                            <div style={s.dot}/>
                            <span style={s.detailText}>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {/* Collapsed pending state */}
                  {isPending && (
                    <p style={{ fontSize: "0.82rem", color: "#bbb", margin: 0, fontStyle: "italic" }}>
                      Complete the previous step first to unlock this one.
                    </p>
                  )}

                  {/* Active CTAs */}
                  {isActive && (
                    <div style={s.cardActions}>
                      <button onClick={() => goToStep(step)} style={s.primaryBtn}>
                        {step.cta}
                      </button>
                      {step.skipLabel && (
                        <button onClick={skipStep} style={s.skipBtn}>
                          {step.skipLabel}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Done — revisit link */}
                  {isDone && (
                    <a href={step.href} style={s.revisitLink}>
                      {step.num === 1 ? "Edit profile →" : step.num === 2 ? "Retake assessment →" : "Open tracker →"}
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Skip everything */}
          <div style={s.skipRow}>
            <button onClick={skipAll} style={s.skipAllBtn}>
              Skip for now — go to my dashboard
            </button>
            <p style={s.skipNote}>You can complete any step from your dashboard at any time.</p>
          </div>

        </div>
      </main>

      <footer style={s.pageFooter}>
        <p style={s.pageFooterText}>© {new Date().getFullYear()} Care Compass · <a href="mailto:hello@joincarecompass.com" style={s.pageFooterLink}>hello@joincarecompass.com</a></p>
        <p style={s.pageFooterDisclaimer}>Care Compass is not a medical service and does not provide medical advice, diagnosis, or treatment.</p>
      </footer>
    </div>
  );
}

const s = {
  root: { fontFamily: "'DM Sans', Helvetica, sans-serif", color: INK, background: OFF_WHITE, minHeight: "100vh", display: "flex", flexDirection: "column" },

  nav: { padding: "1rem 2rem", borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#fff", display: "flex", alignItems: "center" },
  navLogo: { display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" },
  navLogoText: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: SAGE_DARK },

  main: { flex: 1, padding: "3rem 1.5rem" },
  container: { maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" },

  header: { textAlign: "center", display: "flex", flexDirection: "column", gap: "0.6rem", alignItems: "center" },
  eyebrow: { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: 0 },
  heading: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.45rem, 3vw, 2rem)", fontWeight: 700, color: INK, margin: 0, lineHeight: 1.25 },
  sub: { fontSize: "0.92rem", color: WARM_GRAY, lineHeight: 1.75, margin: 0, maxWidth: 500 },

  progressRow: { display: "flex", alignItems: "flex-start", padding: "0 0.25rem" },
  progressItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", flex: "0 0 auto" },
  progressDot: { width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" },

  cards: { display: "flex", flexDirection: "column", gap: "0.875rem" },
  card: { borderRadius: "1.25rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", transition: "border-color 0.2s, opacity 0.2s" },

  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  cardTopLeft: { display: "flex", gap: "0.875rem", alignItems: "flex-start", flex: 1 },
  numBadge: { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.3s" },
  cardTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: INK, margin: 0 },
  cardTime: { fontSize: "0.73rem", color: WARM_GRAY, margin: 0 },

  tagActive: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", background: TEAL_LIGHT, color: TEAL, borderRadius: "100px", padding: "0.2rem 0.55rem" },
  tagDone:   { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", background: SAGE_LIGHT, color: SAGE_DARK, borderRadius: "100px", padding: "0.2rem 0.55rem" },

  cardDesc: { fontSize: "0.875rem", color: INK_LIGHT, lineHeight: 1.7, margin: 0 },
  detailList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.35rem" },
  detailItem: { display: "flex", alignItems: "flex-start", gap: "0.55rem" },
  dot: { width: 6, height: 6, borderRadius: "50%", background: SAGE, flexShrink: 0, marginTop: "0.45rem" },
  detailText: { fontSize: "0.83rem", color: WARM_GRAY, lineHeight: 1.55 },

  cardActions: { display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "0.125rem" },
  primaryBtn: { background: SAGE_DARK, color: "#fff", border: "none", borderRadius: "100px", padding: "0.875rem 1.75rem", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", alignSelf: "flex-start" },
  skipBtn: { background: "none", border: "none", color: WARM_GRAY, fontSize: "0.83rem", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.2)", padding: 0, textAlign: "left" },
  revisitLink: { fontSize: "0.82rem", color: SAGE_DARK, fontWeight: 600, textDecoration: "none" },

  skipRow: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" },
  skipAllBtn: { background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.6rem 1.5rem", fontSize: "0.85rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" },
  skipNote: { fontSize: "0.75rem", color: "#bbb", margin: 0, fontStyle: "italic" },

  pageFooter: { padding: "1.5rem 2rem", borderTop: "1px solid rgba(0,0,0,0.07)", textAlign: "center" },
  pageFooterText: { fontSize: "0.85rem", color: WARM_GRAY, margin: "0 0 0.25rem" },
  pageFooterLink: { color: SAGE_DARK, textDecoration: "none" },
  pageFooterDisclaimer: { fontSize: "0.75rem", color: "#aaa", margin: 0 },
};
