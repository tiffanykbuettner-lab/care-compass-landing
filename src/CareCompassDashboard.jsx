import { useState, useEffect } from "react";

const SAGE       = "#7a9e87";
const SAGE_LIGHT = "#e8f0eb";
const SAGE_DARK  = "#4a7058";
const TEAL       = "#4a9fa5";
const TEAL_LIGHT = "#e0f2f4";
const WARM_GRAY  = "#6b6560";
const OFF_WHITE  = "#fafaf8";
const CREAM      = "#f4f1ec";
const INK        = "#2d2926";
const INK_LIGHT  = "#4a4540";

const STORAGE_KEY = "care-compass-tracker-v1";

const BotanicalMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
    <circle cx="36" cy="36" r="34" fill="#e8f0eb" stroke="#7a9e87" strokeWidth="1"/>
    <ellipse cx="36" cy="17" rx="7" ry="17" fill="#4a7058"/>
    <ellipse cx="36" cy="55" rx="5.5" ry="13" fill="#7a9e87" opacity="0.55"/>
    <ellipse cx="55" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.8"/>
    <ellipse cx="17" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.45"/>
    <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.4" transform="rotate(42 36 36) translate(0 -14)"/>
    <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.4" transform="rotate(-42 36 36) translate(0 -14)"/>
    <ellipse cx="36" cy="36" rx="3.5" ry="9" fill="#7a9e87" opacity="0.3" transform="rotate(135 36 36) translate(0 -14)"/>
    <ellipse cx="36" cy="36" rx="3.5" ry="9" fill="#7a9e87" opacity="0.3" transform="rotate(-135 36 36) translate(0 -14)"/>
    <circle cx="36" cy="36" r="7" fill="#4a7058"/>
    <circle cx="36" cy="36" r="3" fill="#e8f0eb"/>
  </svg>
);

const severityColor = (n) => {
  if (!n) return SAGE;
  if (n <= 3) return "#7a9e87";
  if (n <= 6) return "#e8a838";
  return "#c0392b";
};

/* ─── Mini spark line ────────────────────────────────────────────────────── */
function SparkLine({ data, color = SAGE }) {
  if (!data || data.length < 2) return null;
  const W = 120, H = 40, PAD = 4;
  const max = Math.max(...data, 1);
  const xStep = (W - PAD * 2) / (data.length - 1);
  const points = data.map((v, i) => ({
    x: PAD + i * xStep,
    y: H - PAD - ((v / max) * (H - PAD * 2)),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} opacity="0.8"/>)}
    </svg>
  );
}

/* ─── Onboarding flow ────────────────────────────────────────────────────── */
const ONBOARDING_STEPS = [
  {
    icon: "🧭",
    title: "Start with your full assessment",
    desc: "The Care Compass assessment maps your symptoms across every body system and uses AI to surface patterns, specialist recommendations, and questions to bring to your doctor.",
    cta: "Take the Assessment →",
    href: "/compass",
    secondary: "I'll do this later",
  },
  {
    icon: "📋",
    title: "Track your symptoms every day",
    desc: "Log how you're feeling as it happens — including food, medications, sleep, activity, and photos. The more you track, the sharper your insights become.",
    cta: "Open the Tracker →",
    href: "/tracker",
    secondary: "I'll do this later",
  },
  {
    icon: "🩺",
    title: "Bring it to your doctor",
    desc: "Care Compass generates doctor-ready PDF reports from your tracker data and assessment results. You show up with data — that changes the conversation.",
    cta: "See an Example Report",
    href: "/tracker",
    secondary: "Got it — let's go",
  },
];

function OnboardingFlow({ userName, onComplete }) {
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  return (
    <div style={s.onboardingOverlay}>
      <div style={s.onboardingCard}>
        {/* Progress dots */}
        <div style={s.onboardingDots}>
          {ONBOARDING_STEPS.map((_, i) => (
            <div key={i} style={{ ...s.onboardingDot, background: i === step ? SAGE_DARK : i < step ? SAGE : "#e0dbd5", width: i === step ? 24 : 8 }}/>
          ))}
        </div>

        <div style={s.onboardingIcon}>{current.icon}</div>

        {step === 0 && (
          <p style={s.onboardingWelcome}>Welcome{userName ? `, ${userName}` : ""}! 🌿</p>
        )}

        <h2 style={s.onboardingTitle}>{current.title}</h2>
        <p style={s.onboardingDesc}>{current.desc}</p>

        <div style={s.onboardingActions}>
          <a href={current.href} style={s.onboardingCta}>{current.cta}</a>
          <button
            onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            style={s.onboardingSkip}
          >
            {current.secondary}
          </button>
        </div>

        <p style={s.onboardingStep}>{step + 1} of {ONBOARDING_STEPS.length}</p>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export default function CareCompassDashboard() {
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "dashboard-responsive";
    style.innerHTML = `
      @media (max-width: 600px) {
        .dash-nav-links a { display: none !important; }
        .dash-demo-bar { flex-wrap: wrap; }
      }
    `;
    document.head.appendChild(style);
    return () => { const el = document.getElementById("dashboard-responsive"); if (el) el.remove(); };
  }, []);
  // UI demo states — in production these come from Supabase + Clerk
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [demoState, setDemoState] = useState("returning"); // new | empty | returning

  // Mock user data — replace with Clerk user object
  const user = {
    name: "Tiffany",
    subscriptionTier: "pro",
    memberSince: "March 2026",
  };

  // Mock assessment data — replace with Supabase query
  const assessment = demoState === "new" || demoState === "empty" ? null : {
    date: "March 28, 2026",
    topPatterns: [
      "Joint instability, dizziness on standing, and heart palpitations may be connected",
      "Food sensitivities and bloating appear alongside neurological symptoms",
      "Sleep quality correlates with next-day severity",
    ],
    specialists: ["Rheumatologist", "Cardiologist (dysautonomia)", "Allergist/Immunologist"],
    insightCount: 5,
  };

  // Mock tracker data — replace with Supabase query
  const tracker = demoState === "new" ? null : demoState === "empty" ? { entries: 0, streak: 0, avgSeverityWeek: null, sparkData: [], lastEntry: null } : {
    entries: 47,
    streak: 12,
    avgSeverityWeek: 5.2,
    sparkData: [6, 5, 7, 4, 5, 6, 5],
    lastEntry: "Today, 2:14 PM",
    recentSymptoms: "Right shoulder pain, fatigue",
  };

  const hasAssessment = !!assessment;
  const hasTrackerData = tracker && tracker.entries > 0;
  const isNew = demoState === "new";

  return (
    <div style={s.root}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <a href="/" style={s.navLogo}>
            <BotanicalMark size={28}/>
            <span style={s.navLogoText}>Care Compass</span>
          </a>
          <div style={s.navLinks} className="dash-nav-links">
            <a href="/compass" style={s.navLink}>Assessment</a>
            <a href="/tracker" style={s.navLink}>Tracker</a>
            <a href="/pricing" style={s.navLink}>Pricing</a>
            <a href="/account" style={s.navAvatar}>{user.name[0]}</a>
          </div>
        </div>
      </nav>

      <main style={s.main}>
        <div style={s.container}>

          {/* ── Demo state switcher (remove in production) ── */}
          <div style={s.demoBar} className="dash-demo-bar">
            <span style={s.demoLabel}>Preview state:</span>
            {["new", "empty", "returning"].map(state => (
              <button key={state} onClick={() => { setDemoState(state); if (state === "new") setShowOnboarding(true); }} style={{ ...s.demoBtn, background: demoState === state ? SAGE_DARK : "transparent", color: demoState === state ? "#fff" : WARM_GRAY }}>
                {state === "new" ? "New user" : state === "empty" ? "No tracker data" : "Returning user"}
              </button>
            ))}
          </div>

          {/* ── Header ── */}
          <div style={s.header}>
            <div>
              <p style={s.eyebrow}>Dashboard</p>
              <h1 style={s.title}>
                {isNew ? `Welcome, ${user.name} 🌿` : `Good ${getTimeOfDay()}, ${user.name}`}
              </h1>
              {isNew && <p style={s.subtitle}>Let's get you set up. It only takes a few minutes.</p>}
            </div>
            <button onClick={() => window.location.href = "/tracker"} style={s.logEntryBtn}>
              + Log Entry
            </button>
          </div>

          {/* ── New user empty state ── */}
          {isNew && (
            <div style={s.newUserGrid}>
              {ONBOARDING_STEPS.map((step, i) => (
                <div key={i} style={s.newUserCard}>
                  <div style={s.newUserCardNum}>{i + 1}</div>
                  <span style={s.newUserCardIcon}>{step.icon}</span>
                  <h3 style={s.newUserCardTitle}>{step.title}</h3>
                  <p style={s.newUserCardDesc}>{step.desc}</p>
                  <a href={step.href} style={s.newUserCardBtn}>{step.cta}</a>
                </div>
              ))}
            </div>
          )}

          {/* ── Stats row ── */}
          {!isNew && (
            <div style={s.statsRow}>
              {/* Streak */}
              <div style={s.statCard}>
                <div style={s.statCardInner}>
                  <div>
                    <p style={s.statLabel}>Tracking streak</p>
                    <p style={s.statValue}>{tracker?.streak ?? 0}<span style={s.statUnit}> days</span></p>
                    <p style={s.statSub}>{tracker?.streak >= 7 ? "🔥 Keep it up!" : tracker?.streak > 0 ? "Keep going!" : "Start tracking today"}</p>
                  </div>
                  <div style={s.streakBar}>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} style={{ ...s.streakDay, background: i < Math.min(tracker?.streak ?? 0, 7) ? SAGE_DARK : "#e0dbd5" }}/>
                    ))}
                  </div>
                </div>
              </div>

              {/* Avg severity */}
              <div style={s.statCard}>
                <div style={s.statCardInner}>
                  <div>
                    <p style={s.statLabel}>Avg severity this week</p>
                    <p style={{ ...s.statValue, color: tracker?.avgSeverityWeek ? severityColor(tracker.avgSeverityWeek) : "#ccc" }}>
                      {tracker?.avgSeverityWeek ?? "—"}<span style={s.statUnit}>{tracker?.avgSeverityWeek ? "/10" : ""}</span>
                    </p>
                    <p style={s.statSub}>{tracker?.avgSeverityWeek ? severityLabel(tracker.avgSeverityWeek) : "No entries yet this week"}</p>
                  </div>
                  {tracker?.sparkData?.length > 1 && (
                    <SparkLine data={tracker.sparkData} color={severityColor(tracker.avgSeverityWeek)}/>
                  )}
                </div>
              </div>

              {/* Last entry */}
              <div style={s.statCard}>
                <div style={s.statCardInner}>
                  <div>
                    <p style={s.statLabel}>Last entry</p>
                    <p style={s.statValue} >{tracker?.lastEntry ?? "—"}</p>
                    {tracker?.recentSymptoms && <p style={s.statSub}>{tracker.recentSymptoms}</p>}
                  </div>
                  <a href="/tracker" style={s.statAction}>View →</a>
                </div>
              </div>
            </div>
          )}

          {/* ── Main content grid ── */}
          {!isNew && (
            <div style={s.contentGrid}>

              {/* Assessment card */}
              <div style={s.sectionCard}>
                <div style={s.sectionCardHeader}>
                  <div>
                    <p style={s.sectionEyebrow}>Assessment</p>
                    <h2 style={s.sectionTitle}>Your pattern insights</h2>
                  </div>
                  <a href="/compass" style={s.sectionAction}>
                    {hasAssessment ? "Re-run →" : "Take now →"}
                  </a>
                </div>

                {hasAssessment ? (
                  <div style={s.assessmentContent}>
                    <p style={s.assessmentDate}>Last run: {assessment.date}</p>
                    <div style={s.patternList}>
                      {assessment.topPatterns.map((p, i) => (
                        <div key={i} style={s.patternItem}>
                          <BotanicalMark size={16}/>
                          <p style={s.patternText}>{p}</p>
                        </div>
                      ))}
                    </div>
                    <div style={s.specialistRow}>
                      <p style={s.specialistLabel}>Suggested specialists:</p>
                      <div style={s.specialistTags}>
                        {assessment.specialists.map(sp => (
                          <span key={sp} style={s.specialistTag}>{sp}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={s.emptyCard}>
                    <BotanicalMark size={40}/>
                    <p style={s.emptyTitle}>No assessment yet</p>
                    <p style={s.emptyDesc}>Take the full assessment to map your symptoms and get AI-powered pattern insights.</p>
                    <a href="/compass" style={s.emptyBtn}>Take the Assessment →</a>
                  </div>
                )}
              </div>

              {/* Tracker card */}
              <div style={s.sectionCard}>
                <div style={s.sectionCardHeader}>
                  <div>
                    <p style={s.sectionEyebrow}>Tracker</p>
                    <h2 style={s.sectionTitle}>Recent activity</h2>
                  </div>
                  <a href="/tracker" style={s.sectionAction}>Open →</a>
                </div>

                {hasTrackerData ? (
                  <div style={s.trackerContent}>
                    <div style={s.trackerStats}>
                      <div style={s.trackerStat}>
                        <span style={s.trackerStatVal}>{tracker.entries}</span>
                        <span style={s.trackerStatLabel}>Total entries</span>
                      </div>
                      <div style={s.trackerStat}>
                        <span style={s.trackerStatVal}>{tracker.streak}</span>
                        <span style={s.trackerStatLabel}>Day streak</span>
                      </div>
                    </div>
                    <div style={s.trackerActions}>
                      <a href="/tracker" style={s.trackerActionBtn}>View Trends</a>
                      <a href="/tracker" style={s.trackerActionBtnSecondary}>AI Insights</a>
                      <a href="/tracker" style={s.trackerActionBtnSecondary}>Doctor Report</a>
                    </div>
                  </div>
                ) : (
                  <div style={s.emptyCard}>
                    <BotanicalMark size={40}/>
                    <p style={s.emptyTitle}>No entries yet</p>
                    <p style={s.emptyDesc}>Start logging your symptoms to build your health picture over time.</p>
                    <a href="/tracker" style={s.emptyBtn}>Start Tracking →</a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Quick actions ── */}
          {!isNew && (
            <div style={s.quickActions}>
              <p style={s.quickActionsLabel}>Quick actions</p>
              <div style={s.quickActionsGrid}>
                {[
                  { label: "Log a new entry", desc: "Record how you're feeling right now", href: "/tracker", color: SAGE_DARK },
                  { label: "Run the assessment", desc: "Map symptoms and get pattern insights", href: "/compass", color: TEAL },
                  { label: "Generate a report", desc: "Create a PDF to bring to your doctor", href: "/tracker", color: WARM_GRAY },
                  { label: "Account settings", desc: "Manage your profile and subscription", href: "/account", color: INK_LIGHT },
                ].map(({ label, desc, href, color }) => (
                  <a key={label} href={href} style={{ ...s.quickActionCard, borderTop: `3px solid ${color}` }}>
                    <p style={{ ...s.quickActionLabel, color }}>{label}</p>
                    <p style={s.quickActionDesc}>{desc}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <footer style={s.footer}>
        <p style={s.footerText}>© {new Date().getFullYear()} Care Compass · <a href="mailto:hello@joincarecompass.com" style={s.footerLink}>hello@joincarecompass.com</a></p>
        <p style={s.footerDisclaimer}>Care Compass is not a medical service and does not provide medical advice, diagnosis, or treatment.</p>
      </footer>

      {showOnboarding && <OnboardingFlow userName={user.name} onComplete={() => setShowOnboarding(false)}/>}
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function severityLabel(n) {
  if (n <= 3) return "Manageable week";
  if (n <= 6) return "Moderate week";
  return "Difficult week";
}

const s = {
  root: { fontFamily: "'DM Sans', Helvetica, sans-serif", color: INK, background: OFF_WHITE, minHeight: "100vh", display: "flex", flexDirection: "column", overflowX: "hidden", width: "100%" },

  nav: { padding: "1rem 1.25rem", borderBottom: `1px solid rgba(0,0,0,0.07)`, background: "#fff", position: "sticky", top: 0, zIndex: 100, boxSizing: "border-box", width: "100%" },
  navInner: { maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" },
  navLogo: { display: "flex", alignItems: "center", gap: "0.55rem", textDecoration: "none" },
  navLogoText: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 600, color: SAGE_DARK, whiteSpace: "nowrap" },
  navLinks: { display: "flex", alignItems: "center", gap: "0.85rem", flexShrink: 0 },
  navLink: { fontSize: "0.8rem", color: WARM_GRAY, textDecoration: "none", whiteSpace: "nowrap" },
  navAvatar: { width: 34, height: 34, borderRadius: "50%", background: SAGE_DARK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem", textDecoration: "none", fontFamily: "'Playfair Display', Georgia, serif" },

  main: { flex: 1, padding: "2rem 1.25rem", boxSizing: "border-box", width: "100%" },
  container: { maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" },

  demoBar: { display: "flex", alignItems: "center", gap: "0.5rem", background: CREAM, borderRadius: "0.75rem", padding: "0.6rem 1rem", flexWrap: "wrap" },
  demoLabel: { fontSize: "0.75rem", fontWeight: 600, color: WARM_GRAY, marginRight: "0.25rem" },
  demoBtn: { padding: "0.3rem 0.85rem", borderRadius: "100px", border: `1px solid rgba(0,0,0,0.1)`, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" },
  eyebrow: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.3rem" },
  title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: INK, margin: "0 0 0.4rem", letterSpacing: "-0.02em" },
  subtitle: { fontSize: "0.95rem", color: WARM_GRAY, margin: 0, lineHeight: 1.6 },
  logEntryBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.8rem 1.75rem", borderRadius: "100px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },

  newUserGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" },
  newUserCard: { background: "#fff", borderRadius: "1.25rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "2rem", display: "flex", flexDirection: "column", gap: "0.75rem", position: "relative" },
  newUserCardNum: { position: "absolute", top: "1.25rem", right: "1.25rem", width: 28, height: 28, borderRadius: "50%", background: SAGE_LIGHT, color: SAGE_DARK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700 },
  newUserCardIcon: { fontSize: "1.75rem" },
  newUserCardTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: INK, margin: 0 },
  newUserCardDesc: { fontSize: "0.875rem", color: WARM_GRAY, lineHeight: 1.7, margin: 0 },
  newUserCardBtn: { background: SAGE_DARK, color: "#fff", padding: "0.7rem 1.25rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", display: "inline-block", marginTop: "0.5rem", alignSelf: "flex-start" },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" },
  statCard: { background: "#fff", borderRadius: "1rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1.25rem 1.5rem" },
  statCardInner: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" },
  statLabel: { fontSize: "0.75rem", fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.35rem" },
  statValue: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: SAGE_DARK, margin: "0 0 0.25rem", lineHeight: 1 },
  statUnit: { fontSize: "0.9rem", fontWeight: 400, color: WARM_GRAY },
  statSub: { fontSize: "0.78rem", color: WARM_GRAY, margin: 0 },
  statAction: { fontSize: "0.8rem", color: SAGE_DARK, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", marginTop: "0.25rem" },
  streakBar: { display: "flex", gap: "0.25rem", alignItems: "flex-end" },
  streakDay: { width: 8, height: 28, borderRadius: 4, transition: "background 0.3s" },

  contentGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" },
  sectionCard: { background: "#fff", borderRadius: "1.25rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
  sectionCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  sectionEyebrow: { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.3rem" },
  sectionTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: INK, margin: 0 },
  sectionAction: { fontSize: "0.82rem", color: SAGE_DARK, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", marginTop: "0.25rem" },

  assessmentContent: { display: "flex", flexDirection: "column", gap: "1rem" },
  assessmentDate: { fontSize: "0.75rem", color: "#aaa", margin: 0, fontStyle: "italic" },
  patternList: { display: "flex", flexDirection: "column", gap: "0.65rem" },
  patternItem: { display: "flex", alignItems: "flex-start", gap: "0.65rem" },
  patternText: { fontSize: "0.875rem", color: INK_LIGHT, lineHeight: 1.65, margin: 0 },
  specialistRow: { display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "0.75rem", borderTop: `1px solid ${SAGE_LIGHT}` },
  specialistLabel: { fontSize: "0.75rem", fontWeight: 600, color: WARM_GRAY, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" },
  specialistTags: { display: "flex", flexWrap: "wrap", gap: "0.4rem" },
  specialistTag: { background: TEAL_LIGHT, color: TEAL, fontSize: "0.78rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: "100px" },

  trackerContent: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  trackerStats: { display: "flex", gap: "1.5rem" },
  trackerStat: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  trackerStatVal: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: SAGE_DARK },
  trackerStatLabel: { fontSize: "0.72rem", color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.05em" },
  trackerActions: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  trackerActionBtn: { background: SAGE_DARK, color: "#fff", padding: "0.55rem 1rem", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" },
  trackerActionBtnSecondary: { background: "transparent", color: SAGE_DARK, border: `1px solid ${SAGE}`, padding: "0.55rem 1rem", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" },

  emptyCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "2rem 1rem", textAlign: "center" },
  emptyTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: 0 },
  emptyDesc: { fontSize: "0.875rem", color: WARM_GRAY, lineHeight: 1.7, margin: 0, maxWidth: 300 },
  emptyBtn: { background: SAGE_DARK, color: "#fff", padding: "0.65rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", marginTop: "0.25rem" },

  quickActions: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  quickActionsLabel: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: 0 },
  quickActionsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" },
  quickActionCard: { background: "#fff", borderRadius: "0.875rem", padding: "1.1rem 1.25rem", textDecoration: "none", border: `1px solid rgba(0,0,0,0.06)`, display: "flex", flexDirection: "column", gap: "0.3rem", transition: "box-shadow 0.2s" },
  quickActionLabel: { fontSize: "0.875rem", fontWeight: 600, margin: 0 },
  quickActionDesc: { fontSize: "0.78rem", color: WARM_GRAY, margin: 0, lineHeight: 1.5 },

  footer: { padding: "1.5rem 2rem", borderTop: `1px solid rgba(0,0,0,0.07)`, textAlign: "center" },
  footerText: { fontSize: "0.85rem", color: WARM_GRAY, margin: "0 0 0.25rem" },
  footerLink: { color: SAGE_DARK, textDecoration: "none" },
  footerDisclaimer: { fontSize: "0.75rem", color: "#aaa", margin: 0 },

  // Onboarding overlay
  onboardingOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" },
  onboardingCard: { background: "#fff", borderRadius: "1.5rem", padding: "2.5rem", maxWidth: 480, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1.1rem" },
  onboardingDots: { display: "flex", gap: "0.4rem", alignItems: "center" },
  onboardingDot: { height: 8, borderRadius: 100, transition: "all 0.3s ease" },
  onboardingIcon: { fontSize: "2.5rem" },
  onboardingWelcome: { fontSize: "0.9rem", fontWeight: 600, color: SAGE_DARK, background: SAGE_LIGHT, padding: "0.35rem 1rem", borderRadius: "100px", margin: 0 },
  onboardingTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: 0, lineHeight: 1.3 },
  onboardingDesc: { fontSize: "0.95rem", color: WARM_GRAY, lineHeight: 1.75, margin: 0 },
  onboardingActions: { display: "flex", flexDirection: "column", gap: "0.65rem", width: "100%" },
  onboardingCta: { background: SAGE_DARK, color: "#fff", padding: "0.95rem", borderRadius: "0.75rem", fontSize: "0.95rem", fontWeight: 600, textDecoration: "none", display: "block" },
  onboardingSkip: { background: "transparent", border: "none", color: WARM_GRAY, fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.2)" },
  onboardingStep: { fontSize: "0.72rem", color: "#bbb", margin: 0 },
};
