import { useState, useEffect } from "react";

const SAGE       = "#7a9e87";
const SAGE_LIGHT = "#e8f0eb";
const SAGE_DARK  = "#4a7058";
const TEAL       = "#4a9fa5";
const WARM_GRAY  = "#6b6560";
const OFF_WHITE  = "#fafaf8";
const CREAM      = "#f4f1ec";
const INK        = "#2d2926";
const INK_LIGHT  = "#4a4540";
const BORDER     = "rgba(45,41,38,0.1)";
const DANGER     = "#c0392b";
const DANGER_LIGHT = "#fdecea";

const STORAGE_KEY      = "care-compass-tracker-v1";
const ONBOARDED_KEY    = "cc-tracker-onboarded";
const MIGRATED_KEY     = "cc-migrated-to-cloud";

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

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function readLocalData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function pluralize(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/* ─── Step components ────────────────────────────────────────────────────── */

function StepDot({ n, state }) {
  // state: "done" | "active" | "upcoming"
  const bg    = state === "done" ? SAGE_DARK : state === "active" ? SAGE_LIGHT : CREAM;
  const color = state === "done" ? "white"   : state === "active" ? SAGE_DARK  : WARM_GRAY;
  const border = state === "active" ? `2px solid ${SAGE_DARK}` : `2px solid ${state === "done" ? SAGE_DARK : BORDER}`;
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: bg, border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s" }}>
      {state === "done"
        ? <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: "sans-serif" }}>{n}</span>
      }
    </div>
  );
}

const STEPS = ["Review your data", "Confirm migration", "Done"];

function StepTracker({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
      {STEPS.map((label, i) => {
        const state = i < step ? "done" : i === step ? "active" : "upcoming";
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <StepDot n={i + 1} state={state} />
              <span style={{ fontSize: 11, color: state === "active" ? SAGE_DARK : WARM_GRAY, fontFamily: "sans-serif", fontWeight: state === "active" ? 600 : 400, whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? SAGE_DARK : BORDER, margin: "0 8px", marginBottom: 18, transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Step 0: No data found ──────────────────────────────────────────────── */
function NoDataState() {
  return (
    <div style={{ textAlign: "center", padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <BotanicalMark size={52} />
      <div style={{ fontSize: 18, fontWeight: 600, color: INK, fontFamily: "sans-serif" }}>No local data found</div>
      <div style={{ fontSize: 14, color: WARM_GRAY, fontFamily: "sans-serif", lineHeight: 1.7, maxWidth: 380 }}>
        We didn't find any tracker data stored on this device. Your data may already be in the cloud, or you haven't started tracking yet.
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <a href="/dashboard" style={btnStyle(SAGE_DARK, "white")}>Go to dashboard</a>
        <a href="/tracker" style={btnStyle("transparent", SAGE_DARK, SAGE)}>Open tracker</a>
      </div>
    </div>
  );
}

/* ─── Step 0: Already migrated ───────────────────────────────────────────── */
function AlreadyMigratedState() {
  return (
    <div style={{ textAlign: "center", padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: SAGE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke={SAGE_DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: INK, fontFamily: "sans-serif" }}>Already migrated</div>
      <div style={{ fontSize: 14, color: WARM_GRAY, fontFamily: "sans-serif", lineHeight: 1.7, maxWidth: 380 }}>
        Your local data has already been moved to your secure Care Compass account. Everything is safe in the cloud.
      </div>
      <a href="/dashboard" style={{ ...btnStyle(SAGE_DARK, "white"), marginTop: 8 }}>Back to dashboard</a>
    </div>
  );
}

/* ─── Step 1: Review ─────────────────────────────────────────────────────── */
function ReviewStep({ entries, onNext, onSkip }) {
  const dates = entries.map(e => new Date(e.timestamp));
  const earliest = new Date(Math.min(...dates));
  const latest   = new Date(Math.max(...dates));
  const daysLogged = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;
  const withPhotos = entries.filter(e => e.photos && e.photos.length > 0).length;
  const avgSev = (entries.reduce((s, e) => s + e.severity, 0) / entries.length).toFixed(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Summary card */}
      <div style={card}>
        <div style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "sans-serif", marginBottom: 2 }}>Found on this device</div>
          <div style={{ fontSize: 14, color: WARM_GRAY, fontFamily: "sans-serif" }}>
            Entries from {formatDate(earliest)} – {formatDate(latest)}
          </div>
        </div>
        <div style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
          {[
            { value: entries.length,  label: "Total entries" },
            { value: daysLogged,      label: "Days logged" },
            { value: avgSev,          label: "Avg severity" },
            { value: withPhotos,      label: "With photos" },
          ].map(({ value, label }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: SAGE_DARK, fontFamily: "sans-serif", lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: 12, color: WARM_GRAY, fontFamily: "sans-serif" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent preview */}
      <div style={card}>
        <div style={{ padding: "14px 22px 10px", borderBottom: `1px solid ${BORDER}`, fontSize: 13, fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "sans-serif" }}>
          Recent entries preview
        </div>
        <div style={{ padding: "4px 0" }}>
          {entries.slice(0, 5).map((e, i) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 22px", borderBottom: i < 4 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: severityBg(e.severity), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: severityColor(e.severity), fontFamily: "sans-serif" }}>{e.severity}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: INK, fontFamily: "sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {e.symptoms || "No symptoms noted"}
                </div>
                <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 1, fontFamily: "sans-serif" }}>
                  {formatDate(e.timestamp)}
                  {e.photos && e.photos.length > 0 && <span style={{ marginLeft: 8, color: TEAL }}>📎 {e.photos.length} photo{e.photos.length > 1 ? "s" : ""}</span>}
                </div>
              </div>
            </div>
          ))}
          {entries.length > 5 && (
            <div style={{ padding: "10px 22px", fontSize: 12.5, color: WARM_GRAY, fontFamily: "sans-serif", fontStyle: "italic" }}>
              + {entries.length - 5} more entries
            </div>
          )}
        </div>
      </div>

      {/* What happens */}
      <div style={{ ...card, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "sans-serif" }}>What happens during migration</div>
        {[
          { icon: "→", text: "All your entries are uploaded to your secure Care Compass account" },
          { icon: "🔒", text: "Data is encrypted in transit and at rest" },
          { icon: "✓",  text: "Nothing is deleted from this device until you confirm it worked" },
          { icon: "↻",  text: "You can access your data from any device going forward" },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 14, width: 20, flexShrink: 0, textAlign: "center", marginTop: 1 }}>{icon}</span>
            <span style={{ fontSize: 13.5, color: INK_LIGHT, fontFamily: "sans-serif", lineHeight: 1.55 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={onNext} style={btnStyle(SAGE_DARK, "white")}>
          Migrate {pluralize(entries.length, "entry")} →
        </button>
        <button onClick={onSkip} style={btnStyle("transparent", WARM_GRAY, BORDER)}>
          Skip for now
        </button>
      </div>

    </div>
  );
}

/* ─── Step 2: Confirm ────────────────────────────────────────────────────── */
function ConfirmStep({ entries, onConfirm, onBack }) {
  const [deleteLocal, setDeleteLocal] = useState(true);
  const [agreed, setAgreed] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      <div style={card}>
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 18 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: SAGE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke={SAGE_DARK} strokeWidth="1.8" strokeLinejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke={SAGE_DARK} strokeWidth="1.8" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: INK, fontFamily: "sans-serif" }}>Ready to migrate</div>
              <div style={{ fontSize: 13, color: WARM_GRAY, fontFamily: "sans-serif", marginTop: 2 }}>
                {pluralize(entries.length, "entry")} will be uploaded to your account
              </div>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: INK, fontFamily: "sans-serif", marginBottom: 12 }}>After migration</div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", marginBottom: 14 }}>
              <input
                type="checkbox"
                checked={deleteLocal}
                onChange={e => setDeleteLocal(e.target.checked)}
                style={{ accentColor: SAGE_DARK, width: 16, height: 16, marginTop: 2, flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: 13.5, color: INK, fontFamily: "sans-serif", fontWeight: 500 }}>Remove data from this device</div>
                <div style={{ fontSize: 12, color: WARM_GRAY, fontFamily: "sans-serif", marginTop: 2, lineHeight: 1.5 }}>
                  Clears localStorage after a successful upload. Recommended — your data will be safe in the cloud.
                </div>
              </div>
            </label>

            {!deleteLocal && (
              <div style={{ background: "#fef6e4", border: `1px solid #e8a838`, borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "#7a5200", fontFamily: "sans-serif", lineHeight: 1.55, marginBottom: 14 }}>
                ⚠ Keeping a local copy is fine, but changes made on other devices won't sync back here automatically.
              </div>
            )}

            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{ accentColor: SAGE_DARK, width: 16, height: 16, marginTop: 2, flexShrink: 0 }}
              />
              <div style={{ fontSize: 13, color: INK_LIGHT, fontFamily: "sans-serif", lineHeight: 1.55 }}>
                I understand this will upload my health data to Care Compass's encrypted servers, subject to the{" "}
                <a href="/privacy" style={{ color: SAGE_DARK, textDecoration: "none", fontWeight: 500 }}>Privacy Policy</a>.
              </div>
            </label>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => onConfirm(deleteLocal)}
          disabled={!agreed}
          style={btnStyle(agreed ? SAGE_DARK : "#bbb", "white", undefined, !agreed)}
        >
          Confirm & migrate
        </button>
        <button onClick={onBack} style={btnStyle("transparent", WARM_GRAY, BORDER)}>
          ← Back
        </button>
      </div>

    </div>
  );
}

/* ─── Step 3: Migrating (progress) ──────────────────────────────────────── */
function MigratingStep({ entries, onComplete }) {
  const [progress, setProgress]   = useState(0);
  const [phase, setPhase]         = useState("Preparing your data…");
  const [done, setDone]           = useState(false);

  useEffect(() => {
    const phases = [
      { at: 5,   msg: "Preparing your data…" },
      { at: 20,  msg: "Uploading entries…" },
      { at: 55,  msg: `Syncing ${entries.length} entries…` },
      { at: 80,  msg: "Verifying upload…" },
      { at: 95,  msg: "Finalising…" },
    ];

    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(p + (Math.random() * 3 + 1), 98);
      setProgress(Math.round(p));
      const currentPhase = [...phases].reverse().find(ph => p >= ph.at);
      if (currentPhase) setPhase(currentPhase.msg);
    }, 80);

    // Simulate completion after ~3s
    const finish = setTimeout(() => {
      clearInterval(tick);
      setProgress(100);
      setPhase("Migration complete!");
      setDone(true);
      setTimeout(onComplete, 900);
    }, 3200);

    return () => { clearInterval(tick); clearTimeout(finish); };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, padding: "40px 24px", textAlign: "center" }}>
      <BotanicalMark size={56} />

      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13.5, color: INK, fontFamily: "sans-serif", fontWeight: 500 }}>{phase}</span>
          <span style={{ fontSize: 13, color: WARM_GRAY, fontFamily: "sans-serif" }}>{progress}%</span>
        </div>
        <div style={{ height: 8, background: SAGE_LIGHT, borderRadius: 100, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: done ? SAGE : SAGE_DARK, borderRadius: 100, transition: "width 0.15s ease, background 0.3s" }} />
        </div>
      </div>

      <div style={{ fontSize: 13, color: WARM_GRAY, fontFamily: "sans-serif", lineHeight: 1.6 }}>
        Please keep this page open while your data uploads.
      </div>
    </div>
  );
}

/* ─── Step 4: Done ───────────────────────────────────────────────────────── */
function DoneStep({ count, deletedLocal }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "40px 24px", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: SAGE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke={SAGE_DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>

      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: INK, fontFamily: "sans-serif", marginBottom: 8 }}>All done! 🌿</div>
        <div style={{ fontSize: 14, color: WARM_GRAY, fontFamily: "sans-serif", lineHeight: 1.7, maxWidth: 400 }}>
          {pluralize(count, "entry")} successfully migrated to your Care Compass account.
          {deletedLocal && " Local data has been cleared from this device."}
        </div>
      </div>

      <div style={{ ...card, width: "100%", maxWidth: 400, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
        {[
          "Your data is now accessible on any device",
          "AI insights will use your full history",
          "New entries sync automatically",
        ].map(item => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill={SAGE_LIGHT}/><path d="M5 8l2 2 4-4" stroke={SAGE_DARK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontSize: 13.5, color: INK_LIGHT, fontFamily: "sans-serif" }}>{item}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
        <a href="/dashboard" style={btnStyle(SAGE_DARK, "white")}>Back to dashboard</a>
        <a href="/tracker" style={btnStyle("transparent", SAGE_DARK, SAGE)}>Open tracker</a>
      </div>
    </div>
  );
}

/* ─── Shared style helpers ───────────────────────────────────────────────── */
const card = {
  background: "white", border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden",
};

function btnStyle(bg, color, borderColor, disabled = false) {
  return {
    background: bg, color, border: `1px solid ${borderColor ?? bg}`,
    borderRadius: 100, padding: "10px 22px", fontSize: 14, fontWeight: 600,
    fontFamily: "sans-serif", cursor: disabled ? "default" : "pointer",
    textDecoration: "none", display: "inline-block", transition: "opacity 0.15s",
    opacity: disabled ? 0.6 : 1,
  };
}

function severityColor(n) {
  if (n <= 3) return SAGE_DARK;
  if (n <= 6) return "#8a5c00";
  return DANGER;
}
function severityBg(n) {
  if (n <= 3) return SAGE_LIGHT;
  if (n <= 6) return "#fef6e4";
  return DANGER_LIGHT;
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function CareCompassMigrate() {
  const [step, setStep]           = useState("loading"); // loading | no-data | already-done | review | confirm | migrating | done
  const [entries, setEntries]     = useState([]);
  const [deletedLocal, setDeletedLocal] = useState(false);

  useEffect(() => {
    // Inject responsive CSS
    const style = document.createElement("style");
    style.id = "migrate-responsive";
    style.innerHTML = `
      @media (max-width: 480px) {
        .migrate-card { padding: 20px 16px !important; }
      }
    `;
    document.head.appendChild(style);

    // Read localStorage
    const alreadyMigrated = localStorage.getItem(MIGRATED_KEY) === "true";
    if (alreadyMigrated) { setStep("already-done"); return; }

    const data = readLocalData();
    setEntries(data);
    setStep(data.length === 0 ? "no-data" : "review");

    return () => { const el = document.getElementById("migrate-responsive"); if (el) el.remove(); };
  }, []);

  const handleConfirm = (shouldDelete) => {
    setDeletedLocal(shouldDelete);
    setStep("migrating");
  };

  const handleMigrationComplete = () => {
    // In production: this fires after API confirms upload
    try {
      localStorage.setItem(MIGRATED_KEY, "true");
      if (deletedLocal) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ONBOARDED_KEY);
      }
    } catch {}
    setStep("done");
  };

  const progressStep = step === "review" ? 0 : step === "confirm" ? 1 : step === "migrating" || step === "done" ? 2 : null;

  return (
    <div style={{ fontFamily: "sans-serif", background: OFF_WHITE, minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ background: "white", borderBottom: `1px solid ${BORDER}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <BotanicalMark size={28} />
          <span style={{ fontSize: 14, fontWeight: 600, color: SAGE_DARK, letterSpacing: "0.02em" }}>Care Compass</span>
        </a>
        <a href="/settings" style={{ fontSize: 13, color: WARM_GRAY, textDecoration: "none" }}>← Back to settings</a>
      </nav>

      {/* Page */}
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        {!["no-data", "already-done", "loading"].includes(step) && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: 6, fontFamily: "sans-serif" }}>
              Account
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: INK, margin: "0 0 6px", fontFamily: "sans-serif", letterSpacing: "-0.02em" }}>
              Migrate your data to the cloud
            </h1>
            <p style={{ fontSize: 14, color: WARM_GRAY, margin: "0 0 32px", lineHeight: 1.65, fontFamily: "sans-serif" }}>
              Move your locally-stored tracker entries to your secure Care Compass account so you can access them anywhere.
            </p>
            {progressStep !== null && <StepTracker step={progressStep} />}
          </div>
        )}

        {/* Step content */}
        {step === "loading"      && <div style={{ textAlign: "center", padding: 40, color: WARM_GRAY, fontFamily: "sans-serif" }}>Loading…</div>}
        {step === "no-data"      && <NoDataState />}
        {step === "already-done" && <AlreadyMigratedState />}

        {step === "review" && (
          <ReviewStep
            entries={entries}
            onNext={() => setStep("confirm")}
            onSkip={() => window.location.href = "/settings"}
          />
        )}

        {step === "confirm" && (
          <ConfirmStep
            entries={entries}
            onConfirm={handleConfirm}
            onBack={() => setStep("review")}
          />
        )}

        {step === "migrating" && (
          <MigratingStep
            entries={entries}
            onComplete={handleMigrationComplete}
          />
        )}

        {step === "done" && (
          <DoneStep count={entries.length} deletedLocal={deletedLocal} />
        )}

      </div>
    </div>
  );
}
