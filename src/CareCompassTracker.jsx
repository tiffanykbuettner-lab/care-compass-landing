import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { Icon, MorningSunIcon, EveningMoonIcon } from "./SageIcons";
// SAGE_CHAT_DISABLED: Uncomment these imports to re-enable Sage chat logging
// import SageAskWidget from "./SageAskWidget";
// import SageLogChat from "./SageLogChat";

const INSIGHTS_LOADING_STYLES = `
@keyframes insightProgress {
  0%   { width: 0%; }
  10%  { width: 12%; }
  30%  { width: 35%; }
  60%  { width: 62%; }
  80%  { width: 78%; }
  95%  { width: 90%; }
  100% { width: 94%; }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`;

// Inject progress keyframe globally so all loading bars (Doctor Report, ER Report) animate correctly
if (typeof document !== "undefined" && !document.getElementById("cc-progress-keyframe")) {
  const _s = document.createElement("style");
  _s.id = "cc-progress-keyframe";
  _s.innerHTML = INSIGHTS_LOADING_STYLES;
  document.head.appendChild(_s);
}


/* ─── Safety Alert — emergency threshold detection ──────────────────────── */

const EMERGENCY_SYMPTOMS = [
  // Cardiac
  { pattern: /chest\s*(pain|tight|pressure|discomfort|heaviness)/i,  label: "chest pain or pressure" },
  { pattern: /left\s*arm\s*(pain|numb|tingle|weak)/i,                label: "left arm pain or numbness" },
  { pattern: /heart\s*(racing|pounding|stopped|attack)/i,            label: "heart pounding or racing severely" },
  // Respiratory
  { pattern: /can't\s*breathe|cannot\s*breathe|can't\s*catch\s*(my\s*)?breath|difficulty\s*breath|shortness\s*of\s*breath|unable\s*to\s*breathe/i, label: "difficulty breathing" },
  // Stroke (FAST)
  { pattern: /face\s*(droop|numb|drooping|dropping)/i,               label: "face drooping" },
  { pattern: /sudden\s*(severe\s*)?headache|worst\s*(headache|head\s*pain)/i, label: "sudden severe headache" },
  { pattern: /slurred?\s*speech|can't\s*speak|unable\s*to\s*speak/i, label: "slurred speech" },
  { pattern: /arm\s*(weak|numb|drooping|won't\s*move)/i,             label: "sudden arm weakness" },
  // Loss of consciousness
  { pattern: /pass(ed|ing)\s*out|lost\s*conscious|faint(ed|ing)\s*(and|,|\.|$)/i, label: "loss of consciousness" },
  // Self-harm
  { pattern: /suicid|self[- ]harm|want\s*to\s*die|kill\s*myself/i,  label: "thoughts of self-harm" },
];

function checkEmergencySymptoms(text) {
  if (!text) return [];
  return EMERGENCY_SYMPTOMS.filter(s => s.pattern.test(text)).map(s => s.label);
}

function checkEmergencyBP(systolic, diastolic) {
  const s = Number(systolic);
  const d = Number(diastolic);
  if (!isNaN(s) && !isNaN(d) && (s >= 180 || d >= 120)) return true;
  return false;
}

function logSafetyAlertShown(context) {
  try {
    const log = JSON.parse(localStorage.getItem("cc-safety-alerts") || "[]");
    log.unshift({ timestamp: new Date().toISOString(), context });
    localStorage.setItem("cc-safety-alerts", JSON.stringify(log.slice(0, 50)));
  } catch {}
}

function SafetyAlertModal({ triggers, bpCrisis, onDismiss }) {
  if (!triggers?.length && !bpCrisis) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.55)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "1.25rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: "1.25rem", maxWidth: 440, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden",
      }}>
        {/* Red header bar */}
        <div style={{ background: "#c0392b", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.2)" stroke="#fff" strokeWidth="1.5"/>
            <path d="M12 7v5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="16.5" r="1.2" fill="#fff"/>
          </svg>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "1rem", lineHeight: 1.2 }}>
              {bpCrisis ? "Blood Pressure Alert" : "Please Read Before Continuing"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.78rem", marginTop: "0.15rem" }}>
              CareCompass noticed something in what you logged
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem" }}>
          {bpCrisis && (
            <p style={{ fontSize: "0.95rem", color: "#2d2926", lineHeight: 1.7, margin: "0 0 1rem" }}>
              The blood pressure reading you logged — <strong>systolic ≥ 180 or diastolic ≥ 120</strong> — is in the range considered a hypertensive crisis.
            </p>
          )}
          {triggers?.length > 0 && (
            <>
              <p style={{ fontSize: "0.9rem", color: "#2d2926", lineHeight: 1.7, margin: "0 0 0.75rem" }}>
                Some of what you logged may be signs of a medical emergency:
              </p>
              <ul style={{ margin: "0 0 1rem", paddingLeft: "1.25rem" }}>
                {triggers.map((t, i) => (
                  <li key={i} style={{ fontSize: "0.9rem", color: "#c0392b", fontWeight: 600, lineHeight: 1.8 }}>{t}</li>
                ))}
              </ul>
            </>
          )}
          <div style={{ background: "#fdeaea", borderRadius: "0.75rem", padding: "0.875rem 1rem", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "0.875rem", color: "#8b0000", fontWeight: 600, margin: "0 0 0.25rem" }}>
              If you are experiencing these symptoms right now:
            </p>
            <p style={{ fontSize: "0.875rem", color: "#8b0000", margin: 0, lineHeight: 1.6 }}>
              Call <strong>911</strong> or go to your nearest emergency room immediately. Do not wait.
            </p>
          </div>
          <p style={{ fontSize: "0.78rem", color: "#6b6560", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
            CareCompass is not a medical service and cannot evaluate urgency. This alert is shown automatically whenever certain keywords or values are detected — it is not a diagnosis.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <a href="tel:911" style={{
              display: "block", textAlign: "center", background: "#c0392b", color: "#fff",
              borderRadius: "100px", padding: "0.875rem", fontWeight: 700, fontSize: "1rem",
              textDecoration: "none", letterSpacing: "0.01em",
            }}>
              Call 911
            </a>
            <button onClick={onDismiss} style={{
              background: "transparent", border: "1.5px solid rgba(0,0,0,0.15)", borderRadius: "100px",
              padding: "0.75rem", fontSize: "0.875rem", color: "#6b6560", cursor: "pointer",
              fontFamily: "inherit", fontWeight: 500,
            }}>
              I'm okay — this is historical data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Goals — shared constants & storage key ────────────────────────────── */
const GOALS_KEY = "cc-goals";

/* ─── GoalIcon — maps goal type to a SageIcons icon ─────────────────────── */
const GOAL_ICON_MAP = {
  pain:     { name: "heart",     color: "#c0392b" },
  mobility: { name: "forward",   color: "#4a9fa5" },
  energy:   { name: "pulse",     color: "#e8a838" },
  sleep:    { name: "alarm",     color: "#7c5cbf" },
  stress:   { name: "leaf",      color: "#4a7058" },
  limits:   { name: "check",     color: "#4a7058" },
  custom:   { name: "compass",   color: "#4a9fa5" },
};

function GoalIcon({ type, size = 16 }) {
  const map = GOAL_ICON_MAP[type] || GOAL_ICON_MAP.custom;
  return <Icon name={map.name} size={size} color={map.color} />;
}

const GOAL_TYPES = [
  { id: "pain",      label: "Reduced pain", metric: "severity", direction: "lower", desc: "Average severity score" },
  { id: "mobility",  label: "More mobility", metric: "activity",  direction: "more",  desc: "Days with activity logged" },
  { id: "energy",    label: "More energy / less fatigue", metric: "energy",   direction: "higher", desc: "Energy-related entries" },
  { id: "sleep",     label: "Better sleep", metric: "sleep",    direction: "higher", desc: "Average sleep quality" },
  { id: "stress",    label: "Lower stress", metric: "stress",   direction: "lower",  desc: "Average stress score" },
  { id: "limits",    label: "Fewer daily limitations", metric: "activity", direction: "less_limits", desc: "Entries mentioning limitations" },
  { id: "custom",    label: "Custom goal", metric: null,       direction: null,     desc: "Your own definition of progress" },
];

const loadGoals = () => {
  try { const s = localStorage.getItem(GOALS_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
};

const saveGoals = (goals) => {
  try { localStorage.setItem(GOALS_KEY, JSON.stringify(goals)); } catch {}
};

/**
 * Compute progress for a goal against real tracker entries.
 * Returns { baseline, recent, percentChange, trend, label, canCompute }
 */
const computeGoalProgress = (goal, entries) => {
  if (!entries || entries.length < 5) return { canCompute: false };
  const sorted = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const mid = Math.floor(sorted.length / 2);
  const baselineEntries = sorted.slice(0, mid);
  const recentEntries   = sorted.slice(-Math.min(30, Math.ceil(sorted.length / 2)));

  const avg = (arr, field) => {
    const vals = arr.map(e => e[field]).filter(v => v != null && !isNaN(v));
    return vals.length ? vals.reduce((s, v) => s + Number(v), 0) / vals.length : null;
  };

  const countActivity = (arr) =>
    arr.filter(e => e.activity && e.activity.trim().length > 0).length / Math.max(arr.length, 1);

  const countLimits = (arr) => {
    const limitWords = ["couldn't", "can't", "unable", "limited", "couldn't", "stopped", "missed", "sat", "rested", "pain", "skipped"];
    return arr.filter(e => {
      const text = ((e.activity || "") + " " + (e.symptoms || "")).toLowerCase();
      return limitWords.some(w => text.includes(w));
    }).length / Math.max(arr.length, 1);
  };

  let baseline, recent, label;

  switch (goal.type) {
    case "pain":
      baseline = avg(baselineEntries, "severity");
      recent   = avg(recentEntries, "severity");
      label    = "avg severity";
      break;
    case "sleep":
      baseline = avg(baselineEntries, "sleep");
      recent   = avg(recentEntries, "sleep");
      label    = "avg sleep quality";
      break;
    case "stress":
      baseline = avg(baselineEntries, "stress");
      recent   = avg(recentEntries, "stress");
      label    = "avg stress";
      break;
    case "mobility":
      baseline = countActivity(baselineEntries) * 10;
      recent   = countActivity(recentEntries) * 10;
      label    = "activity rate";
      break;
    case "limits":
      baseline = countLimits(baselineEntries) * 10;
      recent   = countLimits(recentEntries) * 10;
      label    = "limitation rate";
      break;
    default:
      return { canCompute: false };
  }

  if (baseline == null || recent == null) return { canCompute: false };

  const direction   = GOAL_TYPES.find(t => t.id === goal.type)?.direction;
  const isImproving = direction === "lower" || direction === "less_limits"
    ? recent < baseline
    : recent > baseline;

  const rawChange   = baseline !== 0 ? ((recent - baseline) / baseline) * 100 : 0;
  const absChange   = Math.abs(rawChange);
  const percentChange = Math.round(absChange);
  const trend       = isImproving ? "improving" : rawChange === 0 ? "stable" : "worsening";

  return { canCompute: true, baseline: +baseline.toFixed(1), recent: +recent.toFixed(1), percentChange, trend, label, isImproving };
};

/* ─── GoalsWidget — compact tracker view with sparklines ──────────────────── */
function GoalsWidget({ entries }) {
  const [goals, setGoals] = useState(() => loadGoals());
  // Refresh goals when entries change
  React.useEffect(() => { setGoals(loadGoals()); }, [entries.length]);

  if (goals.length === 0) return (
    <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
      <div>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#4a9fa5", margin: "0 0 0.2rem" }}>Health Goals</p>
        <p style={{ fontSize: "0.875rem", color: "#6b6560", margin: 0 }}>Track what matters most to you — set goals on your dashboard to see progress here.</p>
      </div>
      <a href="/dashboard" style={{ background: "#4a7058", color: "#fff", borderRadius: "100px", padding: "0.55rem 1.1rem", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>Set goals →</a>
    </div>
  );

  return (
    <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#4a9fa5", margin: 0 }}>Goal Progress</p>
        <a href="/dashboard" style={{ fontSize: "0.78rem", color: "#4a7058", fontWeight: 600, textDecoration: "none" }}>Manage →</a>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {goals.map(goal => {
          const typeObj  = GOAL_TYPES.find(t => t.id === goal.type);
          const progress = computeGoalProgress(goal, entries);
          const trendColor = !progress.canCompute ? "#aaa"
            : progress.trend === "improving" ? "#4a7058"
            : progress.trend === "stable"    ? "#8a5a00"
            : "#c0392b";
          const pct = !progress.canCompute ? 0 : Math.min(progress.percentChange, 100);

          return (
            <div key={goal.id} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2d2926", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <GoalIcon type={goal.type} size={16} />{goal.title}
                </span>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: trendColor }}>
                  {!progress.canCompute
                    ? (entries.length < 5 ? "needs data" : "…")
                    : progress.trend === "improving" ? `↑ ${progress.percentChange}%`
                    : progress.trend === "stable"    ? "→ stable"
                    : `↓ ${progress.percentChange}%`}
                </span>
              </div>
              <div style={{ height: 5, background: "#e8e4e0", borderRadius: 100, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: trendColor, borderRadius: 100, transition: "width 0.6s ease" }}/>
              </div>
            </div>
          );
        })}
      </div>
      {entries.length < 5 && (
        <p style={{ fontSize: "0.72rem", color: "#aaa", margin: 0, fontStyle: "italic" }}>Log at least 5 entries to start seeing progress toward your goals.</p>
      )}
    </div>
  );
}
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
const BP_STORAGE_KEY = "care-compass-bp-v1";
const BP_REMINDERS_KEY = "care-compass-bp-reminders-v1";
const MED_STORAGE_KEY = "care-compass-medications-v1";
const CHECKIN_KEY = "care-compass-checkins-v1";
const LABS_KEY    = "care-compass-labs-v1";
const CYCLE_KEY   = "care-compass-cycle-v1";
const TRACKED_SYM_KEY = "care-compass-tracked-symptoms-v1";

const DEFAULT_TRACKED_SYMPTOMS = [
  // Systemic
  { id: "fatigue",       label: "Fatigue",              category: "Systemic" },
  { id: "brain-fog",     label: "Brain fog",            category: "Systemic" },
  { id: "malaise",       label: "Malaise",              category: "Systemic" },
  // Pain
  { id: "pain-head",     label: "Head pain",            category: "Pain" },
  { id: "pain-neck",     label: "Neck pain",            category: "Pain" },
  { id: "pain-shoulder", label: "Shoulder pain",        category: "Pain" },
  { id: "pain-back",     label: "Back pain",            category: "Pain" },
  { id: "pain-joint",    label: "Joint pain",           category: "Pain" },
  { id: "pain-chest",    label: "Chest pain",           category: "Pain" },
  // Neurological
  { id: "dizziness",     label: "Dizziness",            category: "Neurological" },
  { id: "numbness",      label: "Numbness / tingling",  category: "Neurological" },
  { id: "light-sound",   label: "Light / sound sensitivity", category: "Neurological" },
  { id: "vision",        label: "Vision changes",       category: "Neurological" },
  // Autonomic
  { id: "palpitations",  label: "Heart palpitations",   category: "Autonomic" },
  { id: "sob",           label: "Shortness of breath",  category: "Autonomic" },
  { id: "temp-dysreg",   label: "Temperature dysregulation", category: "Autonomic" },
  // GI
  { id: "nausea",        label: "Nausea",               category: "GI" },
  { id: "bloating",      label: "Bloating",             category: "GI" },
  { id: "abdominal",     label: "Abdominal pain",       category: "GI" },
  // Mood
  { id: "anxiety",       label: "Anxiety",              category: "Mood" },
  { id: "low-mood",      label: "Low mood",             category: "Mood" },
];
const ROSE        = "#c0567a";
const ROSE_LIGHT  = "#fdeef4";
const LAVENDER    = "#8b7ab8";
const LAVENDER_LIGHT = "#f0eef9";

const APPT_SPECIALTIES = [
  "Cardiologist", "Dermatologist", "ENT", "Endocrinologist",
  "Gastroenterologist", "Geneticist", "Gynecologist", "Hematologist",
  "Immunologist / Allergist", "Nephrologist", "Neurologist", "Oncologist",
  "Ophthalmologist", "Orthopedist", "Pain Management", "Physical Therapist",
  "Primary Care", "Psychiatrist / Psychologist", "Pulmonologist",
  "Rheumatologist", "Urologist", "Other",
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
    <line x1="36" y1="29" x2="36" y2="17" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.6"/>
    <line x1="36" y1="43" x2="36" y2="53" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.4"/>
    <line x1="43" y1="36" x2="55" y2="36" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.5"/>
    <line x1="29" y1="36" x2="17" y2="36" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.35"/>
  </svg>
);


const bpCategory = (systolic, diastolic) => {
  if (systolic < 120 && diastolic < 80) return { label: "Normal", color: "#4a7058", bg: "#e8f0eb" };
  if (systolic < 130 && diastolic < 80) return { label: "Elevated", color: "#8a5a00", bg: "#fef3da" };
  if (systolic < 140 || diastolic < 90) return { label: "High Stage 1", color: "#c0392b", bg: "#fdeaea" };
  if (systolic >= 140 || diastolic >= 90) return { label: "High Stage 2", color: "#922b21", bg: "#f5b7b1" };
  return { label: "Unknown", color: "#aaa", bg: "#f5f5f5" };
};

const formatBPTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const severityColor = (n) => {
  if (n <= 3) return "#7a9e87";
  if (n <= 6) return "#e8a838";
  return "#c0392b";
};

function SeveritySlider({ value, onChange }) {
  return (
    <div style={s.sevSliderWrap}>
      <div style={s.sevSliderRow}>
        <input type="range" min="1" max="10" step="1" value={value} onChange={e => onChange(Number(e.target.value))} style={{ flex: 1, accentColor: severityColor(value) }}/>
        <div style={{ ...s.sevDisplay, background: value <= 3 ? SAGE_LIGHT : value <= 6 ? "#fef3da" : "#fdeaea", color: value <= 3 ? SAGE_DARK : value <= 6 ? "#8a5a00" : "#c0392b", borderColor: severityColor(value) }}>
          {value}<span style={{ fontSize: "0.65rem" }}>/10</span>
        </div>
      </div>
      <div style={s.sevLabels}><span style={s.sevLabel}>1 — Manageable</span><span style={s.sevLabel}>5 — Moderate</span><span style={s.sevLabel}>10 — Severe</span></div>
    </div>
  );
}

function LineChart({ entries, field, color = SAGE }) {
  const filtered = [...entries].reverse().filter(e => e[field] != null);
  if (filtered.length < 2) return <div style={s.chartEmpty}>Add at least 2 entries to see this trend</div>;
  
  // For severity field: group by day and take max value per day
  const grouped = field === "severity"
    ? Object.values(filtered.reduce((acc, e) => {
        const day = new Date(e.timestamp).toDateString();
        if (!acc[day] || e[field] > acc[day][field]) acc[day] = e;
        return acc;
      }, {})).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    : filtered;

  const last14 = grouped.slice(-14);
  const W = 580, H = 120, PAD = 20;
  const xStep = (W - PAD * 2) / Math.max(last14.length - 1, 1);
  const points = last14.map((e, i) => ({ x: PAD + i * xStep, y: H - PAD - ((e[field] / 10) * (H - PAD * 2)) }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length-1].x} ${H-PAD} L ${points[0].x} ${H-PAD} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs><linearGradient id={`grad-${field}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      {[2,4,6,8,10].map(v => { const y = H - PAD - ((v/10) * (H - PAD*2)); return <g key={v}><line x1={PAD} y1={y} x2={W-PAD} y2={y} stroke="#e0dbd5" strokeWidth="0.5" strokeDasharray="4 4"/><text x={PAD-6} y={y+4} fontSize="10" fill="#aaa" textAnchor="end">{v}</text></g>; })}
      <path d={areaD} fill={`url(#grad-${field})`}/>
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={field === "severity" ? severityColor(last14[i][field]) : color} stroke="#fff" strokeWidth="1.5"/>)}
      {last14.map((e, i) => <text key={i} x={points[i].x} y={H-4} fontSize="9" fill="#aaa" textAnchor="middle">{new Date(e.timestamp).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}</text>)}
    </svg>
  );
}

function EntryCard({ entry, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(entry.timestamp);
  const isMorning = entry.tag === "Morning check-in";
  const isEvening = entry.tag === "Evening check-in";
  const isSageChat = entry.source === "sage_chat";
  return (
    <div style={s.entryCard}>
      <div style={s.entryCardHeader} onClick={() => setExpanded(e => !e)}>
        <div style={s.entryCardLeft}>
          <div style={{ ...s.severityBadge, background: severityColor(entry.severity) }}>{entry.severity}/10</div>
          <div>
            <p style={s.entryDate}>
              {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              {isMorning && <span style={{ display:"inline-flex", alignItems:"center", gap:"0.25rem", marginLeft:"0.5rem", background:"#fef3da", color:"#8a5a00", borderRadius:"100px", padding:"0.1rem 0.5rem", fontSize:"0.68rem", fontWeight:600, verticalAlign:"middle" }}><MorningSunIcon size={13} /> Morning</span>}
              {isEvening && <span style={{ display:"inline-flex", alignItems:"center", gap:"0.25rem", marginLeft:"0.5rem", background:"#f0eef9", color:"#7c5cbf", borderRadius:"100px", padding:"0.1rem 0.5rem", fontSize:"0.68rem", fontWeight:600, verticalAlign:"middle" }}><EveningMoonIcon size={13} /> Evening</span>}
              {isSageChat && !isMorning && !isEvening && <span style={{ display:"inline-flex", alignItems:"center", gap:"0.2rem", marginLeft:"0.5rem", background:SAGE_LIGHT, color:SAGE_DARK, borderRadius:"100px", padding:"0.1rem 0.5rem", fontSize:"0.68rem", fontWeight:600, verticalAlign:"middle" }}>✦ Sage</span>}
            </p>
            <p style={s.entryPreview}>{entry.symptoms || (entry.trackedSymptoms && entry.trackedSymptoms.length > 0 ? entry.trackedSymptoms.map(ts => `${ts.label} (${ts.severity}/10)`).join(", ") : "No symptoms noted")}</p>
          </div>
        </div>
        <div style={s.entryCardRight}>
          <button onClick={e => { e.stopPropagation(); onEdit(entry); }} style={s.editEntryBtn}>Edit</button>
          <button onClick={e => { e.stopPropagation(); onDelete(entry.id); }} style={{ ...s.deleteBtn, color: "#bbb" }} title="Delete entry"><Icon name="close" size={16} /></button>
          <span style={s.expandChevron}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>
      {expanded && (
        <div style={s.entryDetail}>
          {entry.symptoms && <DR label="Symptoms" value={entry.symptoms}/>}
          {entry.trackedSymptoms && entry.trackedSymptoms.length > 0 && <DR label="Tracked symptoms" value={entry.trackedSymptoms.map(ts => `${ts.label} ${ts.severity}/10`).join(" · ")}/>}
          {entry.food && <DR label="Food & drink" value={entry.food}/>}
          {entry.medications && <DR label="Medications" value={entry.medications}/>}
          {entry.activity && <DR label="Activity" value={entry.activity}/>}
          {entry.hoursUpright && <DR label="Hours upright" value={entry.hoursUpright}/>}
          {entry.tasksCompleted && entry.tasksCompleted.length > 0 && <DR label="Tasks managed" value={entry.tasksCompleted.join(", ")}/>}
          {entry.energyEnvelope && <DR label="Energy used" value={entry.energyEnvelope}/>}
          {entry.sleep != null && <DR label="Sleep" value={`${entry.sleep}/10`}/>}
          {entry.stress && <DR label="Stress" value={`${entry.stress}/10`}/>}
          {entry.weather && <DR label="Weather" value={entry.weather}/>}
          {entry.notes && <DR label="Notes" value={entry.notes}/>}
          {entry.photos && entry.photos.length > 0 && (
            <div style={s.entryPhotos}>
              <span style={s.detailLabel}>Photos</span>
              <div style={s.entryPhotoRow}>
                {entry.photos.map((photo, idx) => (
                  <img key={idx} src={photo.data} alt={photo.name} style={s.entryPhotoThumb}
                    onClick={() => window.open(photo.data, "_blank")}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const DR = ({ label, value }) => (
  <div style={s.detailRow}><span style={s.detailLabel}>{label}</span><span style={s.detailValue}>{value}</span></div>
);



function BPTimePicker({ value, onChange, style = {} }) {
  const parse = (val) => {
    const [hh, mm] = (val || "08:00").split(":").map(Number);
    return { h: hh % 12 || 12, m: mm, period: hh >= 12 ? "PM" : "AM" };
  };
  const toValue = (h, m, period) => {
    let h24 = h % 12;
    if (period === "PM") h24 += 12;
    return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  const { h, m, period } = parse(value);
  const hours = [12,1,2,3,4,5,6,7,8,9,10,11];
  const minutes = [0,5,10,15,20,25,30,35,40,45,50,55];
  const sel = {
    border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "0.5rem",
    padding: "0.55rem 0.5rem", fontSize: "0.9rem", color: INK,
    background: "#fff", outline: "none", cursor: "pointer",
    fontFamily: "inherit", appearance: "none", WebkitAppearance: "none",
    textAlign: "center", ...style,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <select value={h} onChange={e => onChange(toValue(Number(e.target.value), m, period))} style={{ ...sel, width: 52 }}>
        {hours.map(hr => <option key={hr} value={hr}>{hr}</option>)}
      </select>
      <span style={{ fontSize: "1.1rem", color: WARM_GRAY, fontWeight: 500 }}>:</span>
      <select value={m} onChange={e => onChange(toValue(h, Number(e.target.value), period))} style={{ ...sel, width: 52 }}>
        {minutes.map(min => <option key={min} value={min}>{String(min).padStart(2, "0")}</option>)}
      </select>
      <select value={period} onChange={e => onChange(toValue(h, m, e.target.value))} style={{ ...sel, width: 56 }}>
        <option>AM</option>
        <option>PM</option>
      </select>
    </div>
  );
}

function BPChart({ readings }) {
  if (readings.length < 2) return <div style={s.chartEmpty}>Add at least 2 readings to see your trend</div>;
  const last30 = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(-30);
  const W = 580, H = 140, PAD = 24;
  const maxSys = Math.max(...last30.map(r => r.systolic), 160);
  const minSys = Math.min(...last30.map(r => r.systolic), 90);
  const range = maxSys - minSys || 40;
  const xStep = (W - PAD * 2) / Math.max(last30.length - 1, 1);
  const toY = (v) => H - PAD - ((v - minSys) / range) * (H - PAD * 2);
  const sysPoints = last30.map((r, i) => ({ x: PAD + i * xStep, y: toY(r.systolic) }));
  const diaPoints = last30.map((r, i) => ({ x: PAD + i * xStep, y: toY(r.diastolic) }));
  const sysPath = sysPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const diaPath = diaPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  // Normal range band (systolic 90-120)
  const normalTop = toY(120);
  const normalBot = toY(Math.max(minSys, 90));
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        {/* Normal range band */}
        {normalBot > normalTop && (
          <rect x={PAD} y={normalTop} width={W - PAD * 2} height={normalBot - normalTop} fill="#e8f0eb" opacity="0.5" rx="2"/>
        )}
        {/* Grid lines */}
        {[100, 120, 140, 160].filter(v => v >= minSys && v <= maxSys + 10).map(v => {
          const y = toY(v);
          return <g key={v}><line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#e0dbd5" strokeWidth="0.5" strokeDasharray="4 4"/><text x={PAD - 6} y={y + 4} fontSize="9" fill="#aaa" textAnchor="end">{v}</text></g>;
        })}
        {/* Diastolic line */}
        <path d={diaPath} fill="none" stroke={TEAL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3"/>
        {diaPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={TEAL} stroke="#fff" strokeWidth="1.5"/>)}
        {/* Systolic line */}
        <path d={sysPath} fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {sysPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={bpCategory(last30[i].systolic, last30[i].diastolic).color} stroke="#fff" strokeWidth="1.5"/>)}
        {/* Date labels */}
        {last30.map((r, i) => i % Math.ceil(last30.length / 7) === 0 && (
          <text key={i} x={sysPoints[i].x} y={H - 4} fontSize="9" fill="#aaa" textAnchor="middle">
            {new Date(r.timestamp).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
          </text>
        ))}
      </svg>
      <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem", fontSize: "0.78rem", color: WARM_GRAY }}>
        <span><span style={{ display: "inline-block", width: 16, height: 3, background: "#c0392b", borderRadius: 2, verticalAlign: "middle", marginRight: 4 }}/>Systolic</span>
        <span><span style={{ display: "inline-block", width: 16, height: 2, background: TEAL, borderRadius: 2, verticalAlign: "middle", marginRight: 4, borderTop: "2px dashed " + TEAL }}/>Diastolic</span>
        <span><span style={{ display: "inline-block", width: 16, height: 8, background: "#e8f0eb", borderRadius: 2, verticalAlign: "middle", marginRight: 4 }}/>Normal range</span>
      </div>
    </div>
  );
}

function BPReadingCard({ reading, onDelete }) {
  const cat = bpCategory(reading.systolic, reading.diastolic);
  return (
    <div style={{ background: "#fff", borderRadius: "0.875rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ textAlign: "center", minWidth: 72 }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: cat.color, lineHeight: 1 }}>
            {reading.systolic}<span style={{ fontSize: "0.9rem", fontWeight: 400, color: WARM_GRAY }}>/</span>{reading.diastolic}
          </div>
          <div style={{ fontSize: "0.7rem", color: WARM_GRAY, marginTop: 2 }}>mmHg</div>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
            <span style={{ background: cat.bg, color: cat.color, fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "100px" }}>{cat.label}</span>
            {reading.pulse && <span style={{ fontSize: "0.75rem", color: WARM_GRAY, display:"inline-flex", alignItems:"center", gap:"0.25rem" }}><Icon name="pulse" size={16} /> {reading.pulse} bpm</span>}
            {reading.arm && <span style={{ fontSize: "0.72rem", color: "#aaa" }}>{reading.arm} arm</span>}
          </div>
          <div style={{ fontSize: "0.78rem", color: WARM_GRAY }}>{formatBPTime(reading.timestamp)}</div>
          {reading.notes && <div style={{ fontSize: "0.78rem", color: INK_LIGHT, marginTop: "0.25rem", fontStyle: "italic" }}>{reading.notes}</div>}
          {reading.position && <div style={{ fontSize: "0.72rem", color: "#aaa" }}>{reading.position}</div>}
        </div>
      </div>
      <button onClick={() => onDelete(reading.id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: "1rem", padding: "0.25rem", flexShrink: 0 }}><Icon name="close" size={16} /></button>
    </div>
  );
}


/* ─── Med picker in log modal ───────────────────────────────────────────── */
function MedPicker({ medications, selectedIds, onToggle, onAddAll, manualText, onManualChange, onSaveUnlisted, onScanAdd }) {
  const [showList, setShowList]       = React.useState(false);
  const [scanning, setScanning]       = React.useState(false);
  const [scanError, setScanError]     = React.useState("");
  const [scanPreview, setScanPreview] = React.useState(null);
  const [scannedMed, setScannedMed]   = React.useState(null);
  const scanInputRef = React.useRef(null);

  const selectedMeds = medications.filter(m => selectedIds.includes(m.id));
  const hasSelected  = selectedMeds.length > 0;

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setScanError(""); setScannedMed(null);
    const reader = new FileReader();
    reader.onload = evt => setScanPreview(evt.target.result);
    reader.readAsDataURL(file);
    setScanning(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload  = () => resolve(r.result.split(",")[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 500,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
            { type: "text", text: `Photo of a prescription or supplement bottle. Extract info and respond ONLY with JSON (no markdown):\n{"name":"medication name","dose":"strength e.g. 25mg","frequency":"e.g. Once daily","notes":"important instructions or empty string"}\nIf unreadable: {"name":"","dose":"","frequency":"","notes":""}` },
          ]}],
        }),
      });
      const data   = await response.json();
      const text   = data.content?.[0]?.text || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (parsed.name) { setScannedMed(parsed); setScanPreview(null); }
      else { setScanError("Couldn't read the label clearly. Try a clearer photo or type it below."); setScanPreview(null); }
    } catch { setScanError("Something went wrong scanning. Please try again or type it in."); setScanPreview(null); }
    setScanning(false);
  };

  const confirmScanned = (saveToList) => {
    if (!scannedMed) return;
    if (onScanAdd) onScanAdd(scannedMed, saveToList);
    setScannedMed(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>

      {/* ── Selected pill tags ── */}
      {hasSelected && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {selectedMeds.map(med => (
            <span key={med.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: SAGE_LIGHT, color: SAGE_DARK, borderRadius: "100px", padding: "0.25rem 0.75rem", fontSize: "0.78rem", fontWeight: 600 }}>
              {med.name}{med.dose ? ` ${med.dose}` : ""}
              <button onClick={() => onToggle(med.id)} style={{ background: "none", border: "none", cursor: "pointer", color: SAGE_DARK, fontSize: "0.85rem", padding: 0, lineHeight: 1, display: "flex", alignItems: "center" }}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* ── Expandable saved list ── */}
      {medications.length > 0 && (
        <div style={{ border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: "0.75rem", overflow: "hidden" }}>
          <button onClick={() => setShowList(s => !s)}
            style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.9rem", background: showList ? SAGE_LIGHT : "#fafaf8", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: SAGE_DARK }}>
              {hasSelected ? `${selectedMeds.length} selected` : "Select from your medications"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {!hasSelected && (
                <span onClick={e => { e.stopPropagation(); onAddAll(); }}
                  style={{ fontSize: "0.72rem", fontWeight: 600, color: SAGE_DARK, background: "rgba(74,112,88,0.1)", borderRadius: "100px", padding: "0.15rem 0.6rem", cursor: "pointer" }}>Add all</span>
              )}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: showList ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: SAGE_DARK }}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
          {showList && (
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "0.5rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.1rem", maxHeight: "200px", overflowY: "auto" }}>
              {medications.map(med => (
                <label key={med.id} style={{ display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer", padding: "0.4rem 0.25rem", borderRadius: "0.4rem" }}>
                  <input type="checkbox" checked={selectedIds.includes(med.id)} onChange={() => onToggle(med.id)}
                    style={{ accentColor: SAGE_DARK, width: 15, height: 15, flexShrink: 0 }}/>
                  <span style={{ fontSize: "0.875rem", color: INK, flex: 1 }}>
                    {med.name}
                    {med.dose && <span style={{ color: WARM_GRAY, marginLeft: "0.35rem", fontSize: "0.82rem" }}>{med.dose}</span>}
                    {med.frequency && <span style={{ color: "#bbb", marginLeft: "0.35rem", fontSize: "0.75rem" }}>· {med.frequency}</span>}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Scan bottle label ── */}
      <label style={{ cursor: scanning ? "default" : "pointer" }}>
        <input ref={scanInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleScan} disabled={scanning}/>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.55rem 0.9rem", borderRadius: "0.65rem", border: `1.5px dashed ${scanning ? "#ccc" : SAGE}`, background: scanning ? "#fafaf8" : SAGE_LIGHT, color: scanning ? WARM_GRAY : SAGE_DARK, fontSize: "0.82rem", fontWeight: 600, cursor: scanning ? "default" : "pointer", opacity: scanning ? 0.7 : 1, transition: "all 0.15s" }}>
          {scanning ? (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Scanning label...</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>Scan bottle label</>
          )}
        </span>
      </label>

      {/* ── Scan preview ── */}
      {scanPreview && scanning && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: SAGE_LIGHT, borderRadius: "0.65rem", padding: "0.75rem 1rem" }}>
          <img src={scanPreview} alt="Scanning" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: "0.4rem", border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }}/>
          <div>
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: SAGE_DARK, margin: "0 0 0.15rem" }}>Reading label...</p>
            <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: 0 }}>Claude is extracting medication info from your photo</p>
          </div>
        </div>
      )}

      {/* ── Scan error ── */}
      {scanError && (
        <div style={{ background: "#fdecea", borderRadius: "0.65rem", padding: "0.6rem 0.9rem", fontSize: "0.8rem", color: "#c0392b", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
          <span>{scanError}</span>
          <button onClick={() => setScanError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#c0392b", flexShrink: 0, padding: 0, display: "flex" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      )}

      {/* ── Scanned result confirmation ── */}
      {scannedMed && (
        <div style={{ background: SAGE_LIGHT, borderRadius: "0.75rem", border: `1.5px solid ${SAGE}`, padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: SAGE_DARK, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.2rem" }}>Label scanned ✓</p>
              <p style={{ fontSize: "0.95rem", fontWeight: 700, color: INK, margin: "0 0 0.1rem" }}>{scannedMed.name}{scannedMed.dose ? ` · ${scannedMed.dose}` : ""}</p>
              {scannedMed.frequency && <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0 }}>{scannedMed.frequency}{scannedMed.notes ? ` · ${scannedMed.notes}` : ""}</p>}
            </div>
            <button onClick={() => setScannedMed(null)} style={{ background: "none", border: "none", cursor: "pointer", color: WARM_GRAY, padding: 0, flexShrink: 0, display: "flex" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button onClick={() => confirmScanned(false)}
              style={{ flex: 1, background: SAGE_DARK, color: "#fff", border: "none", borderRadius: "100px", padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Add to this log
            </button>
            <button onClick={() => confirmScanned(true)}
              style={{ flex: 1, background: "#fff", color: SAGE_DARK, border: `1.5px solid ${SAGE}`, borderRadius: "100px", padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Add + save to my list
            </button>
          </div>
        </div>
      )}

      {/* ── Free-type / unlisted ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4a4540" }}>
          {medications.length > 0 ? "Other / unlisted medications" : "Medications taken"}
        </span>
        <textarea value={manualText} onChange={e => onManualChange(e.target.value)}
          placeholder={medications.length > 0 ? "Any other medications not in your list..." : "Any medications or supplements?"}
          rows={2} style={{ padding: "0.65rem 0.9rem", borderRadius: "0.65rem", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "0.875rem", color: INK, background: "#fafaf8", outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", width: "100%" }}/>
        {manualText.trim() && (
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.75rem", color: SAGE_DARK }}>
            <input type="checkbox" checked={onSaveUnlisted?.enabled || false} onChange={() => onSaveUnlisted?.toggle()} style={{ accentColor: SAGE_DARK, width: 13, height: 13 }}/>
            Save to my medication list in Account Settings
          </label>
        )}
      </div>
    </div>
  );
}

/* ─── Frequency options ──────────────────────────────────────────────────── */
const FREQUENCIES = [
  "As needed (PRN)", "At bedtime", "Every 4 hours", "Every 6 hours",
  "Every 8 hours", "Once daily", "Three times daily", "Twice daily",
  "Weekly", "With meals", "Other",
];


/* ─── Report: Severity bar chart (daily avg) ─────────────────────────────── */
function SeverityBarChart({ entries }) {
  const last30 = (() => {
    const byDay = {};
    entries.forEach(e => {
      const day = new Date(e.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!byDay[day]) byDay[day] = { total: 0, count: 0, date: new Date(e.timestamp) };
      byDay[day].total += e.severity;
      byDay[day].count += 1;
    });
    return Object.entries(byDay)
      .sort((a, b) => a[1].date - b[1].date)
      .slice(-30)
      .map(([day, d]) => ({ day, avg: d.total / d.count }));
  })();
  if (last30.length < 2) return null;
  const W = 560, H = 120, PAD = 20, barW = Math.min(18, (W - PAD * 2) / last30.length - 2);
  const xStep = (W - PAD * 2) / last30.length;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 24}`} style={{ overflow: "visible" }}>
      {[2,4,6,8,10].map(v => {
        const y = H - PAD - ((v / 10) * (H - PAD * 2));
        return <g key={v}>
          <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#e8e4e0" strokeWidth="0.5" strokeDasharray="3 3"/>
          <text x={PAD - 4} y={y + 4} fontSize="9" fill="#bbb" textAnchor="end">{v}</text>
        </g>;
      })}
      {last30.map((d, i) => {
        const barH = Math.max(2, (d.avg / 10) * (H - PAD * 2));
        const x = PAD + i * xStep + xStep / 2 - barW / 2;
        const y = H - PAD - barH;
        const col = d.avg <= 3 ? "#7a9e87" : d.avg <= 6 ? "#e8a838" : "#c0392b";
        return <g key={i}>
          <rect x={x} y={y} width={barW} height={barH} fill={col} rx="2" opacity="0.85"/>
          {last30.length <= 14 && <text x={x + barW/2} y={H + 14} fontSize="8" fill="#aaa" textAnchor="middle">{d.day}</text>}
        </g>;
      })}
      {last30.length > 14 && (
        <>
          <text x={PAD} y={H + 14} fontSize="8" fill="#aaa" textAnchor="start">{last30[0].day}</text>
          <text x={W - PAD} y={H + 14} fontSize="8" fill="#aaa" textAnchor="end">{last30[last30.length - 1].day}</text>
        </>
      )}
    </svg>
  );
}

/* ─── Report: Symptom frequency horizontal bars ──────────────────────────── */
function SymptomFrequencyChart({ entries }) {
  const KEYWORDS = ["headache","migraine","fatigue","pain","dizziness","nausea","brain fog",
    "palpitation","anxiety","insomnia","bloating","reflux","rash","swelling","stiffness",
    "cramp","shortness of breath","numbness","tingling","joint","muscle","depression",
    "diarrhea","constipation","fever","cough","chest pain","tachycardia","syncope"];
  const days = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size || 1;
  const counts = {};
  entries.forEach(e => {
    if (!e.symptoms) return;
    const text = e.symptoms.toLowerCase();
    KEYWORDS.forEach(kw => { if (text.includes(kw)) counts[kw] = (counts[kw] || 0) + 1; });
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (!top.length) return <p style={{ fontSize: "0.8rem", color: "#aaa", fontStyle: "italic" }}>No recognizable symptom keywords found.</p>;
  const max = top[0][1];
  const W = 560, rowH = 22, PAD = 140;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${top.length * rowH + 8}`} style={{ overflow: "visible" }}>
      {top.map(([kw, count], i) => {
        const barW = Math.max(4, ((count / max) * (W - PAD - 60)));
        const pct = Math.round((count / days) * 100);
        const col = pct >= 60 ? "#c0392b" : pct >= 30 ? "#e8a838" : "#7a9e87";
        return <g key={kw} transform={`translate(0, ${i * rowH + 4})`}>
          <text x={PAD - 8} y={14} fontSize="11" fill="#4a4540" textAnchor="end" style={{ textTransform: "capitalize" }}>
            {kw.charAt(0).toUpperCase() + kw.slice(1)}
          </text>
          <rect x={PAD} y={4} width={barW} height={14} fill={col} rx="2" opacity="0.75"/>
          <text x={PAD + barW + 6} y={14} fontSize="10" fill="#888">{count}x · {pct}% of days</text>
        </g>;
      })}
    </svg>
  );
}

/* ─── Report: Sleep & stress trend lines ─────────────────────────────────── */
function SleepStressChart({ entries }) {
  const sleepEntries = [...entries].reverse().filter(e => e.sleep != null).slice(-30);
  const stressEntries = [...entries].reverse().filter(e => e.stress != null).slice(-30);
  if (sleepEntries.length < 2 && stressEntries.length < 2) return null;
  const W = 560, H = 100, PAD = 20;
  const makePath = (data, field) => {
    if (data.length < 2) return null;
    const xStep = (W - PAD * 2) / (data.length - 1);
    return data.map((e, i) => `${i === 0 ? "M" : "L"} ${PAD + i * xStep} ${H - PAD - ((e[field] / 10) * (H - PAD * 2))}`).join(" ");
  };
  const sleepPath = makePath(sleepEntries, "sleep");
  const stressPath = makePath(stressEntries, "stress");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: "visible" }}>
      {[2,4,6,8,10].map(v => {
        const y = H - PAD - ((v / 10) * (H - PAD * 2));
        return <g key={v}>
          <line x1={PAD} y1={y} x2={W-PAD} y2={y} stroke="#e8e4e0" strokeWidth="0.5" strokeDasharray="3 3"/>
          <text x={PAD-4} y={y+4} fontSize="9" fill="#bbb" textAnchor="end">{v}</text>
        </g>;
      })}
      {sleepPath && <path d={sleepPath} fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>}
      {stressPath && <path d={stressPath} fill="none" stroke="#e8a838" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" strokeDasharray="5 3"/>}
      <g transform={`translate(${PAD}, ${H + 14})`}>
        <rect width="10" height="3" fill={TEAL} y="-1" rx="1"/>
        <text x="13" y="3" fontSize="9" fill="#888">Sleep quality</text>
        <rect x="90" width="10" height="3" fill="#e8a838" y="-1" rx="1"/>
        <text x="103" y="3" fontSize="9" fill="#888">Stress level</text>
      </g>
    </svg>
  );
}

/* ─── Report: Summary stat boxes ─────────────────────────────────────────── */
function ReportStatBox({ label, value, sub, color = "#4a4540" }) {
  return (
    <div style={{ flex: 1, minWidth: 100, background: "#fafaf8", borderRadius: "0.75rem", border: "1px solid #ece8e3", padding: "0.875rem 1rem", textAlign: "center" }}>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.6rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "0.7rem", color: "#888", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      {sub && <div style={{ fontSize: "0.7rem", color, marginTop: "0.2rem", fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}


/* ─── SearchableSelect — type-to-search dropdown ─────────────────────────── */
function SearchableSelect({ value, onChange, options, placeholder = "Select...", style: extraStyle = {} }) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen]   = React.useState(false);
  const ref = React.useRef(null);
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(""); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const selectedLabel = options.find(o => (o.value !== undefined ? o.value : o) === value)?.label ?? value ?? "";
  const toLabel = (o) => String(o?.label ?? o ?? "");
  const filtered = options.filter(o => { const l = toLabel(o); return !query || l.toLowerCase().includes(query.toLowerCase()); });
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50); }}
        style={{ padding: "0.75rem 1rem", borderRadius: "0.65rem", border: `1.5px solid ${open ? SAGE_DARK : "rgba(0,0,0,0.12)"}`, fontSize: "0.92rem", color: INK, background: "#fafaf8", outline: "none", fontFamily: "inherit", cursor: "pointer", width: "100%", boxSizing: "border-box", ...extraStyle }}>
        {open ? (
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder={selectedLabel || placeholder}
            style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "0.92rem", color: INK, fontFamily: "inherit" }} autoComplete="off"/>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: selectedLabel ? INK : "#aaa" }}>{selectedLabel || placeholder}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}><path d="M2 4l4 4 4-4" stroke={WARM_GRAY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        )}
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999, background: "#fff", borderRadius: "0.75rem", border: "1.5px solid rgba(0,0,0,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", maxHeight: 240, overflowY: "auto" }}>
          {filtered.length === 0 ? <div style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#aaa" }}>No matches</div>
          : filtered.map((o, i) => {
            const val = o.value !== undefined ? o.value : o;
            const label = toLabel(o);
            const isSel = val === value;
            return <div key={String(val)+i} onMouseDown={() => { onChange(val); setOpen(false); setQuery(""); }}
              style={{ padding: "0.65rem 1rem", fontSize: "0.875rem", cursor: "pointer", color: isSel ? SAGE_DARK : INK, background: isSel ? SAGE_LIGHT : "transparent", fontWeight: isSel ? 600 : 400, fontFamily: "inherit", borderBottom: i < filtered.length-1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
              onMouseEnter={e => { if(!isSel) e.currentTarget.style.background="#f5f9f6"; }}
              onMouseLeave={e => { if(!isSel) e.currentTarget.style.background="transparent"; }}>
              {query ? (() => { const idx=label.toLowerCase().indexOf(query.toLowerCase()); if(idx<0) return label; return <>{label.slice(0,idx)}<strong style={{color:SAGE_DARK}}>{label.slice(idx,idx+query.length)}</strong>{label.slice(idx+query.length)}</>; })() : label}
            </div>;
          })}
        </div>
      )}
    </div>
  );
}

function TrendsTab({ entries, dateFilter, allEntries, userTrackedSymptoms }) {
  const [symptomSearch, setSymptomSearch] = React.useState("");
  const [activeSymFilter, setActiveSymFilter] = React.useState(null); // null = all

  if (entries.length < 2) return <div style={s.emptyState}><p style={s.emptyDesc}>Add more entries to see symptom trends and frequency reports.</p></div>;

  const days = dateFilter === "today" ? 1 : dateFilter === "week" ? 7 : dateFilter === "month" ? 30 : new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;
  const label = dateFilter === "today" ? "today" : dateFilter === "week" ? "past 7 days" : dateFilter === "month" ? "past 30 days" : "all time";

  const symptomCounts = {};

  // Helper: add a symptom occurrence to counts
  const addSymptomOccurrence = (label, entry) => {
    const key = label.toLowerCase();
    if (!symptomCounts[key]) symptomCounts[key] = { label, days: new Set(), entries: [], totalSeverity: 0 };
    symptomCounts[key].days.add(new Date(entry.timestamp).toDateString());
    symptomCounts[key].entries.push(entry);
    symptomCounts[key].totalSeverity += entry.severity;
  };

  entries.forEach(e => {
    // Primary: use structured tracked symptoms if present
    if (e.trackedSymptoms && e.trackedSymptoms.length > 0) {
      e.trackedSymptoms.forEach(ts => addSymptomOccurrence(ts.label, e));
    } else if (e.symptoms) {
      // Fallback: keyword parse for older entries without tracked symptoms
      const words = e.symptoms.toLowerCase();
      ["headache","migraine","pain","fatigue","nausea","dizziness","brain fog","palpitation","anxiety","insomnia","bloating","reflux","rash","swelling","stiffness","cramp","shortness of breath","numbness","tingling","joint","muscle","depression","diarrhea","constipation","vomiting","fever","cough"].forEach(kw => {
        if (words.includes(kw)) addSymptomOccurrence(kw.charAt(0).toUpperCase() + kw.slice(1), e);
      });
    }
  });
  const topSymptoms = Object.entries(symptomCounts).map(([key, data]) => ({ keyword: data.label || key, dayCount: data.days.size, entryCount: data.entries.length, avgSeverity: (data.totalSeverity / data.entries.length).toFixed(1) })).sort((a, b) => b.dayCount - a.dayCount).slice(0, 8);
  const avgSev = entries.length ? (entries.reduce((sum, e) => sum + e.severity, 0) / entries.length).toFixed(1) : "—";
  const daysLogged = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;

  return (
    <div style={s.trendsWrap}>
      <div style={s.trendsHeader}>
        <p style={s.sectionLabel}>Symptom frequency report — {label}</p>
      </div>
      <div style={s.trendsSummary}>
        <div style={s.trendsStat}><span style={s.trendsStatVal}>{entries.length}</span><span style={s.trendsStatLabel}>Entries logged</span></div>
        <div style={s.trendsStat}><span style={s.trendsStatVal}>{daysLogged}{dateFilter !== "all" ? `/${days}` : ""}</span><span style={s.trendsStatLabel}>Days with entries</span></div>
        <div style={s.trendsStat}><span style={s.trendsStatVal}>{avgSev}</span><span style={s.trendsStatLabel}>Avg severity</span></div>
      </div>
      {topSymptoms.length > 0 ? (
        <div style={s.trendsCards}>
          <p style={{ ...s.sectionLabel, marginBottom: "0.75rem" }}>Most frequent symptoms — {label}</p>
          {topSymptoms.map(({ keyword, dayCount, entryCount, avgSeverity }) => (
            <div key={keyword} style={s.trendCard}>
              <div style={s.trendCardLeft}>
                <span style={s.trendKeyword}>{keyword.charAt(0).toUpperCase() + keyword.slice(1)}</span>
                <span style={s.trendSubtext}>{entryCount} {entryCount === 1 ? "entry" : "entries"} · avg severity {avgSeverity}/10</span>
              </div>
              <div style={s.trendBarWrap}>
                <div style={{ ...s.trendBar, width: `${(dayCount / days) * 100}%`, background: dayCount / days > 0.6 ? "#c0392b" : dayCount / days > 0.3 ? "#e8a838" : SAGE }}/>
                <span style={s.trendDayCount}>{dayCount} {dayCount === 1 ? "day" : "days"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={s.emptyState}><p style={s.emptyDesc}>No recognizable symptom keywords found. Try describing symptoms using common terms like "headache", "fatigue", "pain", or "nausea".</p></div>
      )}

      {/* ── Symptom search ── */}
      <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: "0 0 0.25rem" }}>Symptom search</h3>
          <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0 }}>Search across all your entries to find every time you logged a specific symptom, activity, or keyword.</p>
        </div>
        <div style={{ padding: "1rem 1.25rem" }}>
          <div style={{ position: "relative", marginBottom: "0.875rem" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: WARM_GRAY, pointerEvents: "none" }}><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            <input
              value={symptomSearch}
              onChange={e => setSymptomSearch(e.target.value)}
              placeholder="e.g. dizziness, driving, shoulder, headache behind eye..."
              style={{ width: "100%", boxSizing: "border-box", padding: "0.65rem 0.75rem 0.65rem 2.25rem", borderRadius: "0.75rem", border: "1.5px solid " + (symptomSearch ? SAGE : "rgba(0,0,0,0.12)"), fontSize: "0.875rem", color: INK, background: OFF_WHITE, outline: "none", fontFamily: "inherit", transition: "border-color 0.15s" }}
            />
          </div>

          {symptomSearch.trim() && (() => {
            const q = symptomSearch.toLowerCase().trim();
            const searchPool = allEntries || entries;
            const matches = searchPool.filter(e => {
              const text = ((e.symptoms || "") + " " + (e.notes || "") + " " + (e.activity || "") + " " + (e.food || "")).toLowerCase();
              return text.includes(q);
            });

            if (!matches.length) return (
              <p style={{ fontSize: "0.82rem", color: WARM_GRAY, fontStyle: "italic", textAlign: "center", padding: "1rem 0" }}>
                No entries found for "{symptomSearch}"
              </p>
            );

            const avgSev = (matches.reduce((s, e) => s + e.severity, 0) / matches.length).toFixed(1);
            const days = new Set(matches.map(e => new Date(e.timestamp).toDateString())).size;

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {/* Summary */}
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                  <div style={{ background: SAGE_LIGHT, borderRadius: "0.625rem", padding: "0.5rem 0.875rem", textAlign: "center" }}>
                    <p style={{ fontSize: "1.1rem", fontWeight: 700, color: SAGE_DARK, margin: 0 }}>{matches.length}</p>
                    <p style={{ fontSize: "0.7rem", color: SAGE_DARK, margin: 0 }}>entries</p>
                  </div>
                  <div style={{ background: SAGE_LIGHT, borderRadius: "0.625rem", padding: "0.5rem 0.875rem", textAlign: "center" }}>
                    <p style={{ fontSize: "1.1rem", fontWeight: 700, color: SAGE_DARK, margin: 0 }}>{days}</p>
                    <p style={{ fontSize: "0.7rem", color: SAGE_DARK, margin: 0 }}>days</p>
                  </div>
                  <div style={{ background: SAGE_LIGHT, borderRadius: "0.625rem", padding: "0.5rem 0.875rem", textAlign: "center" }}>
                    <p style={{ fontSize: "1.1rem", fontWeight: 700, color: SAGE_DARK, margin: 0 }}>{avgSev}</p>
                    <p style={{ fontSize: "0.7rem", color: SAGE_DARK, margin: 0 }}>avg severity</p>
                  </div>
                  <div style={{ flex: 1, minWidth: 120, background: "#f5f5f3", borderRadius: "0.625rem", padding: "0.5rem 0.875rem", display: "flex", alignItems: "center" }}>
                    <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0, lineHeight: 1.5 }}>
                      First: {new Date(matches[matches.length - 1].timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Matching entries */}
                {matches.map(e => {
                  const date = new Date(e.timestamp);
                  const highlight = (text) => {
                    if (!text) return null;
                    const idx = text.toLowerCase().indexOf(q);
                    if (idx < 0) return <span style={{ fontSize: "0.82rem", color: WARM_GRAY }}>{text}</span>;
                    return <span style={{ fontSize: "0.82rem", color: INK }}>
                      {text.slice(0, idx)}<mark style={{ background: SAGE_LIGHT, color: SAGE_DARK, borderRadius: "2px", padding: "0 2px" }}>{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}
                    </span>;
                  };
                  return (
                    <div key={e.id} style={{ background: "#fafaf8", borderRadius: "0.75rem", border: "1px solid rgba(0,0,0,0.06)", padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                        <span style={{ fontSize: "0.72rem", color: WARM_GRAY }}>{date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, background: severityColor(e.severity), color: "#fff", borderRadius: "100px", padding: "0.1rem 0.5rem" }}>{e.severity}/10</span>
                      </div>
                      {e.symptoms && <div style={{ marginBottom: "0.2rem" }}>{highlight(e.symptoms)}</div>}
                      {e.activity && <div style={{ marginBottom: "0.2rem" }}>{highlight(e.activity)}</div>}
                      {e.notes && <div>{highlight(e.notes)}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────────────── */
/* ─── Lab Results Tab                                                      ── */
/* ─────────────────────────────────────────────────────────────────────────── */


function LabResultsTab({ entries }) {
  const LABS_STORAGE = "care-compass-labs-v1";
  const [savedLabs, setSavedLabs] = React.useState(() => {
    try { const s = localStorage.getItem(LABS_STORAGE); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [analyzing, setAnalyzing]     = React.useState(false);
  const [selectedLab, setSelectedLab] = React.useState(null);
  const [view, setView]               = React.useState("list"); // list | context | analyzing | detail
  const [dragOver, setDragOver]       = React.useState(false);
  const [uploadError, setUploadError] = React.useState("");
  const [pendingFile, setPendingFile] = React.useState(null);
  const [labContext, setLabContext]   = React.useState({ name: "", date: "", orderedBy: "", questions: "", background: "" });
  const fileInputRef = React.useRef(null);

  const saveLabs = (updated) => {
    setSavedLabs(updated);
    try { localStorage.setItem(LABS_STORAGE, JSON.stringify(updated)); } catch {}
  };

  const [confirmDeleteLabId, setConfirmDeleteLabId] = React.useState(null);
  const deleteLab = (id) => setConfirmDeleteLabId(id);
  const confirmDeleteLab = () => {
    saveLabs(savedLabs.filter(l => l.id !== confirmDeleteLabId));
    setConfirmDeleteLabId(null);
  };

  const getUserContext = () => {
    const profile = (() => { try { return JSON.parse(localStorage.getItem("cc-profile") || "{}"); } catch { return {}; } })();
    const meds = (() => { try { return JSON.parse(localStorage.getItem("care-compass-medications-v1") || "[]"); } catch { return []; } })();
    const family = (() => { try { return JSON.parse(localStorage.getItem("cc-family-history") || "[]"); } catch { return []; } })();
    const recentEntries = (entries || []).slice(0, 14);
    const medsStr = meds.filter(m => m.name).map(m => m.name + (m.dose ? " " + m.dose : "") + (m.frequency ? " (" + m.frequency + ")" : "")).join(", ");
    const conditionsStr = (profile.conditions || []).join(", ");
    const familyStr = family.filter(e => e.member && e.conditions && e.conditions.length).map(e => e.member + ": " + e.conditions.join(", ")).join("; ");
    const symptomSummary = recentEntries.length
      ? "Recent symptom log summary (" + recentEntries.length + " entries): " + recentEntries.slice(0, 5).map(e => {
          const tracked = (e.trackedSymptoms || []).map(ts => ts.label + " " + ts.severity + "/10").join(", ");
          const freeText = e.symptoms || "";
          const symDesc = tracked || freeText || "no symptoms noted";
          return "[Severity " + e.severity + "/10] " + symDesc;
        }).join(" | ")
      : "";
    return { medsStr, conditionsStr, familyStr, symptomSummary };
  };

  const runAnalysis = async (file, ctx) => {
    setView("analyzing");
    setAnalyzing(true);

    // Inject loading animation
    const styleEl = document.getElementById("labs-loading-styles") || document.createElement("style");
    styleEl.id = "labs-loading-styles";
    styleEl.innerHTML = "@keyframes labProgress { 0%{width:0%} 10%{width:8%} 30%{width:30%} 60%{width:58%} 80%{width:75%} 95%{width:90%} 100%{width:94%} }";
    if (!document.getElementById("labs-loading-styles")) document.head.appendChild(styleEl);

    const uctx = getUserContext();

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const isImage = file.type.startsWith("image/");

      const systemPrompt = "You are a compassionate health navigation assistant for Care Compass, helping people with chronic and complex illness understand their lab results and advocate for themselves. Your tone is warm, clear, and empowering. You write for patients, not clinicians — no jargon, plain language throughout. Never diagnose. Use language like 'may be worth discussing', 'some practitioners consider', 'worth asking your doctor about'. CRITICAL PHILOSOPHY: Normal range does not always mean optimal for this individual. Borderline values, patterns across multiple results, and results that conflict with reported symptoms all deserve attention even if technically within range. Many patients are told their labs are normal and dismissed — your job is to help them see the full picture and ask better questions.";

      const contextBlock = [
        ctx.name ? "Test name: " + ctx.name : "",
        ctx.date ? "Test date: " + ctx.date : "",
        ctx.orderedBy ? "Ordered by: " + ctx.orderedBy : "",
        ctx.background ? "Patient background on this test: " + ctx.background : "",
        ctx.questions ? "Patient's specific questions: " + ctx.questions : "",
      ].filter(Boolean).join("\n");

      const userPrompt = "Please analyze the attached lab result for this patient.\n\n" +
        "PATIENT-PROVIDED CONTEXT:\n" + (contextBlock || "No additional context provided") + "\n\n" +
        "PATIENT HEALTH PROFILE (use to give personalised, contextual insights):\n" +
        (uctx.conditionsStr ? "Existing conditions: " + uctx.conditionsStr + "\n" : "") +
        (uctx.medsStr ? "Current medications: " + uctx.medsStr + "\n" : "") +
        (uctx.familyStr ? "Family history: " + uctx.familyStr + "\n" : "") +
        (uctx.symptomSummary ? uctx.symptomSummary + "\n" : "") +
        "\nPlease structure your response with these sections. Write in clear paragraphs — no bullet points, no markdown symbols, no asterisks or dashes. Use plain conversational prose throughout.\n\n" +
        "WHAT THESE RESULTS SHOW\n" +
        "Go through each test result found. For each one explain in plain language what it measures, what the value is, what the reference range is, and what this result means. Write it as if explaining to a friend.\n\n" +
        "RESULTS WORTH PAYING ATTENTION TO\n" +
        "Highlight any results that are out of range, borderline, or technically normal but potentially significant given this patient's symptoms or conditions. Explain clearly why each matters in their specific context. Do not skip borderline values just because they fall within the printed range.\n\n" +
        "WHY NORMAL IS NOT ALWAYS ENOUGH\n" +
        "If any results would likely be dismissed as normal, explain what the result actually tells us and why it may still warrant further discussion, especially given their reported symptoms.\n\n" +
        "QUESTIONS TO BRING TO YOUR DOCTOR\n" +
        (ctx.questions ? "Make sure to address the patient's specific questions above. Also include " : "Include ") +
        "5 to 8 specific, ready-to-use questions for their next appointment. Write them out in full, as if the patient is speaking.\n\n" +
        "FURTHER TESTS WORTH REQUESTING\n" +
        "Based on these results and the patient's symptom history, suggest specific additional tests. Explain why each one is relevant to their situation.\n\n" +
        "SPECIALISTS WHO MAY HELP\n" +
        "Based on these results and their symptom picture, suggest relevant specialists and explain the connection to what these results show.\n\n" +
        "A NOTE ON ADVOCATING FOR YOURSELF\n" +
        "Close with a warm, empowering paragraph reminding the patient that normal on a lab report is a statistical range, not a personal guarantee of optimal health — and that they have every right to ask for follow-up, second opinions, and further investigation.\n\n" +
        "IMPORTANT: Complete every section — never skip any. Keep each section concise: 2–4 bullets max, 1–2 sentences per bullet. Lead with the insight, not background context. If a section has little to say, write one brief sentence rather than padding. Always end with the full A NOTE ON ADVOCATING FOR YOURSELF section. The goal is a report someone can read in under 5 minutes.";

      const messageContent = isImage
        ? [{ type: "image", source: { type: "base64", media_type: file.type, data: base64 } }, { type: "text", text: userPrompt }]
        : [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }, { type: "text", text: userPrompt }];

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 3500,
          system: systemPrompt,
          messages: [{ role: "user", content: messageContent }],
        }),
      });

      if (!response.ok) throw new Error("API error " + response.status);
      const data = await response.json();
      const analysis = data.content && data.content[0] ? data.content[0].text : "";

      const newLab = {
        id: Date.now(),
        name: ctx.name || file.name.replace(/\.[^.]+$/, ""),
        fileName: file.name,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        testDate: ctx.date || "",
        orderedBy: ctx.orderedBy || "",
        analysis,
        contextSnapshot: {
          conditions: uctx.conditionsStr,
          medications: uctx.medsStr,
          questions: ctx.questions,
        },
      };

      const updated = [newLab, ...savedLabs];
      saveLabs(updated);
      setSelectedLab(newLab);
      setView("detail");
    } catch (err) {
      console.error(err);
      setUploadError("We had trouble analyzing this result. Please try again.");
      setView("list");
    }
    setAnalyzing(false);
  };

  const handleFile = (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    if (!allowed.includes(file.type) && !file.type.startsWith("image/")) {
      setUploadError("Please upload a JPG, PNG, HEIC, or PDF file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("File is too large. Please use a file under 20MB.");
      return;
    }
    setUploadError("");
    setPendingFile(file);
    setLabContext({ name: "", date: "", orderedBy: "", questions: "", background: "" });
    setView("context");
  };

  // ── Lab results renderer — handles any markdown the model returns ──────────
  const LAB_SECTION_STYLES = {
    "results worth paying attention to": { bg: "#fff8e8", border: "#f0d58a", head: "#9a6f00", accent: "#f0d58a" },
    "why normal is not always enough":   { bg: "#fff0f0", border: "#f5c0c0", head: "#9b2c2c", accent: "#f5c0c0" },
    "questions to bring to your doctor": { bg: "#f0f4ff", border: "#c0caf5", head: "#2c3d9b", accent: "#c0caf5" },
    "a note on advocating for yourself": { bg: SAGE_LIGHT, border: SAGE,     head: SAGE_DARK, accent: SAGE },
    "further tests worth requesting":    { bg: "#f5f0ff", border: "#d4bfff", head: "#5b3d9e", accent: "#d4bfff" },
    "specialists who may help":          { bg: TEAL_LIGHT, border: TEAL,     head: "#2c6e72", accent: TEAL },
  };

  const renderAnalysis = (text) => {
    if (!text) return null;

    // Normalize — strip markdown artifacts, preamble, dividers
    const normalized = text
      .replace(/^#{1,4}\s*/gm, "")
      .replace(/^[-]{2,}\s*$/gm, "")
      .replace(/^\*\*([^*]+)\*\*\s*$/gm, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Known section headings the model uses
    const KNOWN_HEADS = [
      "WHAT THESE RESULTS SHOW", "RESULTS WORTH PAYING",
      "WHY NORMAL", "WHAT NORMAL", "QUESTIONS TO BRING",
      "FURTHER TESTS", "SPECIALISTS WHO", "A NOTE ON ADVOCATING",
    ];

    // Scan lines to build sections — discard preamble before first heading
    const rawLines = normalized.split("\n");
    const sections = [];
    let curSection = null;
    for (const line of rawLines) {
      const t = line.trim();
      const isKnown = KNOWN_HEADS.some(h => t.toUpperCase().startsWith(h));
      const isAllCaps = /^[A-Z][A-Z\s&]{5,}$/.test(t) && t.length < 80;
      if ((isKnown || isAllCaps) && t.length > 5) {
        if (curSection) sections.push(curSection);
        curSection = { heading: t, bodyLines: [] };
      } else if (curSection) {
        curSection.bodyLines.push(line);
      }
    }
    if (curSection) sections.push(curSection);

    const parts = sections.map(s => s.heading + "\n" + s.bodyLines.join("\n"));

    const rendered = parts.map((part, i) => {
      const newlineIdx = part.indexOf("\n");
      if (newlineIdx < 0) return null;

      const rawHeading = part.slice(0, newlineIdx).trim().replace(/\*\*/g, "");
      const body = part.slice(newlineIdx + 1).trim();
      if (!rawHeading || rawHeading.length < 3 || !body) return null;

      const headingKey = rawHeading.toLowerCase().replace(/[^a-z\s]/g, "").trim();
      const col = LAB_SECTION_STYLES[headingKey] || { bg: "#fff", border: "rgba(0,0,0,0.08)", head: SAGE_DARK, accent: SAGE_LIGHT };

      // Clean body text
      const cleanBody = body
        .replace(/\*\*/g, "")
        .replace(/\*([^*]+)\*/g, "$1")
        .trim();

      // Split into blocks — paragraphs separated by blank lines, or lines starting with numbers/bullets
      const isQuestionSection = headingKey.includes("question");
      const isBulletSection   = headingKey.includes("test") || headingKey.includes("specialist") || headingKey.includes("further");

      const blocks = cleanBody.split(/\n\n+/);

      // Title-case the heading nicely
      const displayHeading = rawHeading
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace(/\bIs\b|\bAnd\b|\bOr\b|\bFor\b|\bTo\b|\bThe\b|\bA\b|\bOf\b/g, w => w.toLowerCase())
        .replace(/^./, c => c.toUpperCase());

      return (
        <div key={i} style={{ background: col.bg, border: "1.5px solid " + col.border, borderRadius: "1.25rem", overflow: "hidden", marginBottom: "1rem" }}>
          {/* Section header bar */}
          <div style={{ borderBottom: "1.5px solid " + col.border, padding: "0.875rem 1.5rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: 4, height: 20, borderRadius: 2, background: col.head, flexShrink: 0 }}/>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: col.head, margin: 0, letterSpacing: "-0.01em" }}>
              {displayHeading}
            </h3>
          </div>
          {/* Section body */}
          <div style={{ padding: "1.1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {blocks.map((block, j) => {
              const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
              if (!lines.length) return null;

              // Detect if block contains numbered items or bullet items
              const hasNumbers = lines.some(l => /^\d+[.)]\s/.test(l));
              const hasBullets = lines.some(l => /^[-•*]\s/.test(l));

              if (isQuestionSection || hasNumbers) {
                // Each question as its own pill
                return (
                  <div key={j} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {lines.map((line, k) => {
                      const clean = line.replace(/^\d+[.)]\s*/, "").replace(/^[-•*]\s*/, "").trim();
                      if (!clean) return null;
                      return (
                        <div key={k} style={{ background: "rgba(255,255,255,0.7)", border: "1px solid " + col.border, borderRadius: "0.625rem", padding: "0.75rem 1rem", fontSize: "0.875rem", color: INK, lineHeight: 1.7, display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: col.head, flexShrink: 0, marginTop: "0.55rem" }}/>
                          <span>{clean}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              if (hasBullets || isBulletSection) {
                return (
                  <div key={j} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {lines.map((line, k) => {
                      const clean = line.replace(/^[-•*]\s*/, "").trim();
                      if (!clean) return null;
                      return (
                        <div key={k} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: col.head, flexShrink: 0, marginTop: "0.55rem" }}/>
                          <p style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.75, margin: 0 }}>{clean}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              // Plain paragraph — join lines into flowing text
              return (
                <p key={j} style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.85, margin: 0 }}>
                  {lines.join(" ")}
                </p>
              );
            })}
          </div>
        </div>
      );
    }).filter(Boolean);

    return rendered.length > 0 ? rendered : (
      // Fallback: plain text if no sections detected
      <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "1.25rem", padding: "1.5rem" }}>
        {normalized.split("\n\n").filter(Boolean).map((p, i) => (
          <p key={i} style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.85, margin: i > 0 ? "0.75rem 0 0" : 0 }}>{p}</p>
        ))}
      </div>
    );
  };

  // ── Icons ──────────────────────────────────────────────────────────────────
  const LOCK_ICON  = <Icon name="lock" size={14} />;
  const CLIP_ICON  = <Icon name="clipboard" size={16} />;
  const ATTACH_ICO = <Icon name="attachment" size={22} color={SAGE_DARK} />;
  const TIP_ICON   = <Icon name="tip" size={16} />;
  const BACK_ICO   = <Icon name="back" size={12} />;
  const TRASH_ICO  = <Icon name="trash" size={12} />;

  const inputStyle = { width: "100%", boxSizing: "border-box", padding: "0.65rem 0.9rem", borderRadius: "0.65rem", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "0.875rem", color: INK, background: OFF_WHITE, outline: "none", fontFamily: "inherit" };
  const labelStyle = { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: WARM_GRAY, display: "block", marginBottom: "0.35rem", fontFamily: "sans-serif" };

  // ── Context form view ─────────────────────────────────────────────────────
  if (view === "context") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => { setView("list"); setPendingFile(null); }} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "8px", padding: "0.4rem 0.75rem", fontSize: "0.8rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            {BACK_ICO} Back
          </button>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.15rem", fontWeight: 700, color: INK, margin: 0 }}>Add context before analyzing</h2>
            <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: 0 }}>
              {pendingFile ? pendingFile.name : ""}
            </p>
          </div>
        </div>

        <div style={{ background: SAGE_LIGHT, borderRadius: "0.875rem", padding: "0.875rem 1.1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <span style={{ color: SAGE_DARK }}>{TIP_ICON}</span>
          <p style={{ fontSize: "0.8rem", color: SAGE_DARK, lineHeight: 1.65, margin: 0 }}>
            The more context you provide, the more personalised and useful your analysis will be. All fields are optional — fill in what you know.
          </p>
        </div>

        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.08)", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Test or report name</label>
              <input style={inputStyle} value={labContext.name} onChange={e => setLabContext(c => ({ ...c, name: e.target.value }))} placeholder="e.g. Thyroid panel, CBC, MRI report"/>
            </div>
            <div>
              <label style={labelStyle}>Test date <span style={{ textTransform: "none", fontWeight: 400, color: "#bbb" }}>(optional)</span></label>
              <input type="date" style={inputStyle} value={labContext.date} onChange={e => setLabContext(c => ({ ...c, date: e.target.value }))}/>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Ordered by <span style={{ textTransform: "none", fontWeight: 400, color: "#bbb" }}>(optional)</span></label>
            <input style={inputStyle} value={labContext.orderedBy} onChange={e => setLabContext(c => ({ ...c, orderedBy: e.target.value }))} placeholder="e.g. Dr. Patel, Endocrinologist"/>
          </div>

          <div>
            <label style={labelStyle}>Why was this test ordered? What were you hoping to find out?</label>
            <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} value={labContext.background} onChange={e => setLabContext(c => ({ ...c, background: e.target.value }))} placeholder="e.g. I have been experiencing extreme fatigue and hair loss for 8 months. My doctor ordered this to check my thyroid. I was previously told my results were normal but my symptoms have continued."/>
          </div>

          <div>
            <label style={labelStyle}>Do you have specific questions about these results?</label>
            <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} value={labContext.questions} onChange={e => setLabContext(c => ({ ...c, questions: e.target.value }))} placeholder="e.g. My TSH came back at 3.8 — is that actually optimal for me? What is the difference between TSH, T3, and T4? Should I ask for additional thyroid tests?"/>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <button
            onClick={() => runAnalysis(pendingFile, labContext)}
            style={{ background: SAGE_DARK, color: "#fff", border: "none", borderRadius: "100px", padding: "1rem", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Analyze my results
          </button>
          <button
            onClick={() => runAnalysis(pendingFile, { name: "", date: "", orderedBy: "", questions: "", background: "" })}
            style={{ background: "none", border: "none", color: WARM_GRAY, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.2)" }}>
            Skip and analyze without context
          </button>
        </div>
      </div>
    );
  }

  // ── Loading view ──────────────────────────────────────────────────────────
  if (view === "analyzing") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ background: "#fff", borderRadius: "1.5rem", padding: "2.5rem 2rem", maxWidth: 440, width: "100%", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 32px rgba(0,0,0,0.06)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <BotanicalMark size={52}/>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.3rem", fontWeight: 700, color: INK, margin: "0 0 0.4rem" }}>Analyzing your results</h2>
            <p style={{ fontSize: "0.875rem", color: WARM_GRAY, lineHeight: 1.7, margin: 0 }}>
              Care Compass is reading your results alongside your symptom history, medications, and health profile — looking for what the numbers really mean for you.
            </p>
          </div>
          <div style={{ width: "100%", height: 6, background: SAGE_LIGHT, borderRadius: 100, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 100, background: SAGE_DARK, animation: "labProgress 28s ease-in-out forwards" }}/>
          </div>
          <p style={{ fontSize: "0.78rem", color: "#aaa", margin: 0, fontStyle: "italic" }}>
            This usually takes 20-30 seconds. Please don't close this tab.
          </p>
        </div>
      </div>
    );
  }

  // ── Detail view ───────────────────────────────────────────────────────────
  if (view === "detail" && selectedLab) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <button onClick={() => setView("list")} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "8px", padding: "0.4rem 0.75rem", fontSize: "0.8rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            {BACK_ICO} All results
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: INK, margin: 0 }}>{selectedLab.name}</h2>
            <p style={{ fontSize: "0.72rem", color: WARM_GRAY, margin: 0 }}>
              {"Uploaded " + new Date(selectedLab.uploadedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              {selectedLab.testDate ? " · Test date: " + new Date(selectedLab.testDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
              {selectedLab.orderedBy ? " · Ordered by: " + selectedLab.orderedBy : ""}
            </p>
          </div>
          <button onClick={() => window.print()} style={{ background: SAGE_DARK, color: "#fff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            Save as PDF
          </button>
        </div>

        {selectedLab.contextSnapshot && (selectedLab.contextSnapshot.conditions || selectedLab.contextSnapshot.medications) && (
          <div style={{ background: SAGE_LIGHT, borderRadius: "0.75rem", padding: "0.625rem 1rem", fontSize: "0.75rem", color: SAGE_DARK, lineHeight: 1.6 }}>
            <strong>Analyzed in context of: </strong>
            {[selectedLab.contextSnapshot.conditions, selectedLab.contextSnapshot.medications].filter(Boolean).join(" · ")}
          </div>
        )}

        {selectedLab.contextSnapshot && selectedLab.contextSnapshot.questions && (
          <div style={{ background: "#f0f4ff", borderRadius: "0.75rem", padding: "0.625rem 1rem", fontSize: "0.75rem", color: "#2c3d9b", lineHeight: 1.6 }}>
            <strong>Your questions: </strong>{selectedLab.contextSnapshot.questions}
          </div>
        )}

        <div>{renderAnalysis(selectedLab.analysis)}</div>

        <div style={{ background: "#fafaf8", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.75rem", padding: "0.875rem 1rem", fontSize: "0.75rem", color: WARM_GRAY, lineHeight: 1.65 }}>
          <strong style={{ color: INK }}>Important: </strong>
          This analysis is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always discuss your results with a qualified healthcare provider.
        </div>

        <InsightChat reportType="labs" reportText={selectedLab.analysis || ""} accentColor="#4a9fa5" />

        <button onClick={() => { setView("list"); setPendingFile(null); }} style={{ background: SAGE_DARK, color: "#fff", border: "none", borderRadius: "100px", padding: "0.875rem", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Upload another result
        </button>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      <div style={{ padding: "0.875rem 1rem", background: SAGE_LIGHT, borderRadius: "0.875rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <span style={{ color: SAGE_DARK, marginTop: "0.1rem" }}>{TIP_ICON}</span>
        <div>
          <p style={{ fontSize: "0.82rem", fontWeight: 600, color: SAGE_DARK, margin: "0 0 0.15rem" }}>Your results, in full context</p>
          <p style={{ fontSize: "0.78rem", color: SAGE_DARK, lineHeight: 1.65, margin: 0 }}>
            Normal on a lab report does not always mean normal for you. Care Compass reads your results alongside your symptom patterns, medications, and health history — and helps you know what questions to ask next.
          </p>
        </div>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        style={{ border: "2px dashed " + (dragOver ? SAGE_DARK : "rgba(0,0,0,0.12)"), borderRadius: "1rem", padding: "2.5rem 1.5rem", textAlign: "center", cursor: "pointer", background: dragOver ? SAGE_LIGHT : "#fff", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}
      >
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display:"none" }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = ""; }}/>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: SAGE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {ATTACH_ICO}
        </div>
        <div>
          <p style={{ fontSize: "0.95rem", fontWeight: 600, color: INK, margin: "0 0 0.25rem" }}>Upload a lab result or report</p>
          <p style={{ fontSize: "0.8rem", color: WARM_GRAY, margin: 0 }}>Photo, scan, or PDF · JPG, PNG, HEIC, PDF · up to 20MB</p>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center" }}>
          {["Blood work", "Thyroid panel", "Metabolic panel", "CBC", "Imaging report", "Hormone panel", "Urinalysis", "Genetic test"].map(type => (
            <span key={type} style={{ fontSize: "0.72rem", background: CREAM, color: WARM_GRAY, borderRadius: "100px", padding: "0.2rem 0.7rem" }}>{type}</span>
          ))}
        </div>
      </div>

      {uploadError && (
        <div style={{ background: "#fff0f0", border: "1px solid #f5c0c0", borderRadius: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#9b2c2c" }}>
          {uploadError}
        </div>
      )}

      {savedLabs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: 0 }}>Previous results</h3>
          {savedLabs.map(lab => (
            <div key={lab.id} onClick={() => { setSelectedLab(lab); setView("detail"); }}
              style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.08)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", cursor: "pointer" }}>
              <div style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start", flex: 1 }}>
                <div style={{ width: 36, height: 36, borderRadius: "0.5rem", background: SAGE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: SAGE_DARK }}>
                  {CLIP_ICON}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.95rem", fontWeight: 700, color: INK, margin: "0 0 0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lab.name}</p>
                  <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: 0 }}>
                    {"Uploaded " + new Date(lab.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {lab.testDate ? " · Test date: " + new Date(lab.testDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                  </p>
                  {lab.contextSnapshot && lab.contextSnapshot.conditions && (
                    <p style={{ fontSize: "0.72rem", color: SAGE_DARK, margin: "0.2rem 0 0", fontStyle: "italic" }}>{"Analyzed with: " + lab.contextSnapshot.conditions}</p>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                <button onClick={e => { e.stopPropagation(); setSelectedLab(lab); setView("detail"); }}
                  style={{ background: SAGE_LIGHT, border: "none", borderRadius: "6px", padding: "0.3rem 0.8rem", fontSize: "0.72rem", color: SAGE_DARK, cursor: "pointer", fontWeight: 600 }}>
                  View
                </button>
                <button onClick={e => { e.stopPropagation(); deleteLab(lab.id); }}
                  style={{ background: "none", border: "1px solid #f5c0c0", borderRadius: "6px", padding: "0.3rem 0.5rem", cursor: "pointer", color: "#c0392b", display: "flex", alignItems: "center" }}>
                  {TRASH_ICO}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {savedLabs.length === 0 && (
        <p style={{ textAlign: "center", fontSize: "0.82rem", color: WARM_GRAY, fontStyle: "italic", margin: 0 }}>
          No results uploaded yet. Upload your first lab result above to get started.
        </p>
      )}

      <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", padding: "0.875rem 1rem", background: "#fafaf8", borderRadius: "0.75rem", border: "1px solid rgba(0,0,0,0.08)" }}>
        <span style={{ color: SAGE_DARK, marginTop: "0.15rem" }}>{LOCK_ICON}</span>
        <p style={{ fontSize: "0.75rem", color: WARM_GRAY, lineHeight: 1.65, margin: 0 }}>
          <strong style={{ color: INK }}>Privacy: </strong>
          Your lab results are sent to the Anthropic AI to generate your analysis, then saved privately on this device only. They are never stored on our servers, sold, or shared.
        </p>
      </div>

      {confirmDeleteLabId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setConfirmDeleteLabId(null)}>
          <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "2rem", maxWidth: 360, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"0.75rem", color:"#c0392b" }}>
              <Icon name="trash" size={32} />
            </div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.15rem", fontWeight: 700, color: INK, margin: "0 0 0.5rem", textAlign: "center" }}>Delete this result?</h3>
            <p style={{ fontSize: "0.85rem", color: WARM_GRAY, textAlign: "center", margin: "0 0 1.5rem", lineHeight: 1.6 }}>This result and its analysis will be permanently removed. This cannot be undone.</p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setConfirmDeleteLabId(null)} style={{ flex: 1, background: "transparent", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.7rem", fontSize: "0.875rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Keep result</button>
              <button onClick={confirmDeleteLab} style={{ flex: 1, background: "#c0392b", color: "#fff", border: "none", borderRadius: "100px", padding: "0.7rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



/* ─── End Lab Results Tab ────────────────────────────────────────────────── */

/* ─── Cycle Tracker Tab ──────────────────────────────────────────────────── */

const CYCLE_SYMPTOMS = [
  "Cramps", "Heavy flow", "Clots", "Back pain", "Headache / migraine",
  "Bloating", "Breast tenderness", "Fatigue", "Nausea", "Mood swings",
  "Anxiety", "Depression", "Irritability", "Acne", "Food cravings",
  "Insomnia", "Spotting", "Discharge changes", "Pelvic pain",
  "Pain during intercourse", "Ovulation pain (mittelschmerz)",
];
const FLOW_LEVELS = ["Spotting", "Light", "Moderate", "Heavy", "Very heavy"];

function cyclePhaseForDay(dayOffset, cycleLength = 28) {
  if (dayOffset < 0 || dayOffset >= cycleLength) return null;
  if (dayOffset < 5) return "period";
  if (dayOffset < 13) return "follicular";
  if (dayOffset >= 13 && dayOffset <= 15) return "ovulation";
  return "luteal";
}

const PHASE_STYLES = {
  period:     { bg: "#fdeef4", border: ROSE,     dot: ROSE,      label: "Period" },
  follicular: { bg: "#e8f0eb", border: SAGE,      dot: SAGE_DARK, label: "Follicular" },
  ovulation:  { bg: "#e0f2f4", border: TEAL,      dot: TEAL,      label: "Ovulation" },
  luteal:     { bg: "#f5f3ff", border: LAVENDER,  dot: LAVENDER,  label: "Luteal" },
};

function CycleTab({ globalEntries }) {
  const [cycles, setCycles] = useState(() => {
    try { const s = localStorage.getItem(CYCLE_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date(); return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [activeView, setActiveView] = useState("calendar"); // "calendar" | "history" | "insights"
  const blankForm = { startDate: "", endDate: "", flow: "Moderate", pain: 5, symptoms: [], notes: "", mood: "" };
  const [form, setForm] = useState(blankForm);

  const saveCycles = (updated) => {
    setCycles(updated);
    try { localStorage.setItem(CYCLE_KEY, JSON.stringify(updated)); } catch {}
  };

  const handleSave = () => {
    if (!form.startDate) return;
    if (editingId) {
      saveCycles(cycles.map(c => c.id === editingId ? { ...form, id: editingId } : c));
    } else {
      saveCycles([...cycles, { ...form, id: Date.now() }]);
    }
    setForm(blankForm); setShowForm(false); setEditingId(null);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = (id) => saveCycles(cycles.filter(c => c.id !== id));

  const toggleSymptom = (sym) => {
    setForm(f => ({ ...f, symptoms: f.symptoms.includes(sym) ? f.symptoms.filter(s => s !== sym) : [...f.symptoms, sym] }));
  };

  // Sort cycles by start date descending
  const sorted = [...cycles].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  const latest = sorted[0];

  // Predict phases based on most recent cycle start
  const getPhaseForDate = (dateStr) => {
    if (!latest?.startDate) return null;
    const start = new Date(latest.startDate + "T12:00:00");
    const target = new Date(dateStr + "T12:00:00");
    const dayOffset = Math.round((target - start) / (1000 * 60 * 60 * 24));
    // Find if this date falls within a logged period
    const inPeriod = cycles.some(c => {
      if (!c.startDate) return false;
      const s = new Date(c.startDate + "T12:00:00");
      const e = c.endDate ? new Date(c.endDate + "T12:00:00") : new Date(c.startDate + "T12:00:00");
      return target >= s && target <= e;
    });
    if (inPeriod) return "period";
    // Calculate predicted phase using latest cycle
    const avgCycleLength = cycles.length >= 2
      ? Math.round(cycles.slice(0, -1).reduce((sum, c, i) => {
          const next = cycles[i];
          if (!c.startDate || !next?.startDate) return sum;
          return sum + Math.abs(Math.round((new Date(c.startDate) - new Date(next.startDate)) / (1000*60*60*24)));
        }, 0) / (cycles.length - 1))
      : 28;
    const normalizedOffset = ((dayOffset % avgCycleLength) + avgCycleLength) % avgCycleLength;
    return cyclePhaseForDay(normalizedOffset, avgCycleLength);
  };

  // Build calendar for current month
  const { year, month } = calMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calDays = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);
  while (calDays.length % 7 !== 0) calDays.push(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const dateStr = (d) => d ? `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}` : null;

  // Stats
  const avgCycleLen = cycles.length >= 2
    ? Math.round(cycles.slice(0, -1).reduce((sum, c, i) => {
        const prev = cycles[i+1]; if (!prev?.startDate) return sum;
        return sum + Math.abs(Math.round((new Date(c.startDate) - new Date(prev.startDate)) / (1000*60*60*24)));
      }, 0) / (cycles.length - 1))
    : null;
  const avgPeriodLen = cycles.filter(c => c.startDate && c.endDate).length
    ? Math.round(cycles.filter(c => c.startDate && c.endDate).reduce((sum, c) =>
        sum + Math.round((new Date(c.endDate) - new Date(c.startDate)) / (1000*60*60*24)) + 1, 0)
      / cycles.filter(c => c.endDate).length)
    : null;
  const nextPeriodDate = latest?.startDate && avgCycleLen
    ? new Date(new Date(latest.startDate + "T12:00:00").getTime() + avgCycleLen * 24*60*60*1000)
    : null;
  const daysUntilNext = nextPeriodDate ? Math.round((nextPeriodDate - today) / (1000*60*60*24)) : null;

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: ROSE, margin: "0 0 0.35rem" }}>Cycle Tracker</p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: "0 0 0.25rem" }}>Menstrual Health</h2>
          <p style={{ fontSize: "0.85rem", color: WARM_GRAY, margin: 0 }}>Track your cycle alongside your symptoms. Pattern data feeds into your AI insights and care team reports.</p>
        </div>
        <button onClick={() => { setForm(blankForm); setEditingId(null); setShowForm(true); }}
          style={{ background: ROSE, color: "#fff", border: "none", padding: "0.75rem 1.25rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          + Log Period
        </button>
      </div>

      {saved && <div style={{ background: ROSE_LIGHT, color: ROSE, borderRadius: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 600 }}>Period logged ✓</div>}

      {/* Stats row */}
      {cycles.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.875rem" }}>
          {[
            { label: "Cycles logged", value: cycles.length },
            avgCycleLen && { label: "Avg cycle length", value: `${avgCycleLen} days` },
            avgPeriodLen && { label: "Avg period length", value: `${avgPeriodLen} days` },
            daysUntilNext !== null && { label: daysUntilNext >= 0 ? "Next period in" : "Period overdue by", value: `${Math.abs(daysUntilNext)} days`, color: daysUntilNext < 0 ? ROSE : INK },
          ].filter(Boolean).map((stat, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "0.875rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: 0 }}>{stat.label}</p>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: stat.color || ROSE, margin: 0 }}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(0,0,0,0.07)", paddingBottom: 0 }}>
        {[{ id: "calendar", label: "Calendar" }, { id: "history", label: "Cycle History" }, { id: "insights", label: "Pattern Notes" }].map(t => (
          <button key={t.id} onClick={() => setActiveView(t.id)}
            style={{ background: "none", border: "none", borderBottom: activeView === t.id ? `2px solid ${ROSE}` : "2px solid transparent", color: activeView === t.id ? ROSE : WARM_GRAY, fontWeight: activeView === t.id ? 600 : 400, fontSize: "0.875rem", padding: "0.5rem 0.875rem", cursor: "pointer", fontFamily: "inherit" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Calendar view ── */}
      {activeView === "calendar" && (
        <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }}>
          {/* Month nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <button onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
              style={{ background: "none", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "0.5rem", padding: "0.35rem 0.75rem", cursor: "pointer", color: WARM_GRAY, fontFamily: "inherit", fontSize: "0.85rem" }}>←</button>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: INK, margin: 0 }}>{MONTH_NAMES[month]} {year}</p>
            <button onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
              style={{ background: "none", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "0.5rem", padding: "0.35rem 0.75rem", cursor: "pointer", color: WARM_GRAY, fontFamily: "inherit", fontSize: "0.85rem" }}>→</button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            {DAY_NAMES.map(d => <div key={d} style={{ padding: "0.5rem 0", textAlign: "center", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", color: WARM_GRAY }}>{d}</div>)}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {calDays.map((d, i) => {
              const ds = dateStr(d);
              const phase = ds ? getPhaseForDate(ds) : null;
              const ps = phase ? PHASE_STYLES[phase] : null;
              const isToday = ds === todayStr;
              const hasLog = ds && cycles.some(c => c.startDate === ds);
              return (
                <div key={i} style={{
                  minHeight: 52, padding: "0.3rem", position: "relative",
                  background: ps ? ps.bg : "transparent",
                  borderRight: "1px solid rgba(0,0,0,0.04)",
                  borderBottom: "1px solid rgba(0,0,0,0.04)",
                  cursor: d ? "pointer" : "default",
                  borderLeft: ps ? `2px solid ${ps.border}` : "2px solid transparent",
                }}
                  onClick={() => { if (d) { setForm({ ...blankForm, startDate: ds }); setEditingId(null); setShowForm(true); } }}>
                  {d && (
                    <>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: isToday ? ROSE : "transparent",
                        color: isToday ? "#fff" : phase === "period" ? ROSE : INK,
                        fontSize: "0.82rem", fontWeight: isToday || phase === "period" ? 700 : 400,
                      }}>{d}</div>
                      {hasLog && <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: ROSE }}/>}
                      {phase === "ovulation" && <div style={{ position: "absolute", top: 4, right: 4, fontSize: "0.55rem" }}>◉</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Phase legend */}
          <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", flexWrap: "wrap", gap: "0.875rem" }}>
            {Object.entries(PHASE_STYLES).map(([phase, ps]) => (
              <div key={phase} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: ps.dot }}/>
                <span style={{ fontSize: "0.75rem", color: WARM_GRAY }}>{ps.label}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: ROSE, border: `2px solid ${ROSE}` }}/>
              <span style={{ fontSize: "0.75rem", color: WARM_GRAY }}>Logged period day</span>
            </div>
          </div>

          {cycles.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: WARM_GRAY, fontSize: "0.875rem", fontStyle: "italic" }}>
              Log your first period to see cycle phase predictions on the calendar.
            </div>
          )}
        </div>
      )}

      {/* ── Cycle History ── */}
      {activeView === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {sorted.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "2rem", textAlign: "center" }}>
              <p style={{ color: WARM_GRAY, fontSize: "0.875rem", fontStyle: "italic", margin: 0 }}>No cycles logged yet. Tap "+ Log Period" to get started.</p>
            </div>
          ) : sorted.map(c => {
            const start = new Date(c.startDate + "T12:00:00");
            const end = c.endDate ? new Date(c.endDate + "T12:00:00") : null;
            const len = end ? Math.round((end - start) / (1000*60*60*24)) + 1 : null;
            return (
              <div key={c.id} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.1rem 1.25rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: ROSE_LIGHT, border: `2px solid ${ROSE}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ROSE} strokeWidth="2" strokeLinecap="round"><path d="M12 2C6 2 2 7 2 12s4 10 10 10 10-4.5 10-10S18 2 12 2z"/><path d="M12 8v4l3 3"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontWeight: 600, color: INK, fontSize: "0.92rem", margin: "0 0 0.15rem" }}>
                        {start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        {end && ` → ${end.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
                      </p>
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        {len && <span style={{ fontSize: "0.75rem", color: WARM_GRAY }}>{len} day{len !== 1 ? "s" : ""}</span>}
                        {c.flow && <span style={{ fontSize: "0.75rem", background: ROSE_LIGHT, color: ROSE, borderRadius: "100px", padding: "0.1rem 0.6rem", fontWeight: 600 }}>{c.flow}</span>}
                        {c.pain > 0 && <span style={{ fontSize: "0.75rem", color: WARM_GRAY }}>Pain: {c.pain}/10</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => { setForm({ startDate: c.startDate, endDate: c.endDate || "", flow: c.flow || "Moderate", pain: c.pain || 5, symptoms: c.symptoms || [], notes: c.notes || "", mood: c.mood || "" }); setEditingId(c.id); setShowForm(true); }}
                        style={{ background: "none", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "0.375rem", padding: "0.3rem 0.65rem", fontSize: "0.72rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                      <button onClick={() => handleDelete(c.id)}
                        style={{ background: "none", border: "1px solid #f5c0c0", borderRadius: "0.375rem", padding: "0.3rem 0.5rem", color: "#c0392b", cursor: "pointer" }}>
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  </div>
                  {c.symptoms?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.5rem" }}>
                      {c.symptoms.map(sym => <span key={sym} style={{ fontSize: "0.72rem", background: OFF_WHITE, border: "1px solid rgba(0,0,0,0.08)", borderRadius: "100px", padding: "0.15rem 0.55rem", color: INK_LIGHT }}>{sym}</span>)}
                    </div>
                  )}
                  {c.notes && <p style={{ fontSize: "0.8rem", color: WARM_GRAY, margin: "0.4rem 0 0", fontStyle: "italic", lineHeight: 1.5 }}>{c.notes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pattern Notes ── */}
      {activeView === "insights" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Apple Health note */}
          <div style={{ background: LAVENDER_LIGHT, borderRadius: "0.875rem", border: `1px solid ${LAVENDER}`, padding: "1rem 1.25rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: "0.1rem" }} stroke={LAVENDER} strokeWidth="1.6" strokeLinecap="round">
              <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 8v4l3 3"/>
            </svg>
            <div>
              <p style={{ fontSize: "0.82rem", fontWeight: 600, color: LAVENDER, margin: "0 0 0.2rem" }}>Importing from Apple Health or other apps</p>
              <p style={{ fontSize: "0.78rem", color: "#5a4a8a", lineHeight: 1.65, margin: 0 }}>
                Web apps can't directly access Apple Health data. To use your existing data, export from Apple Health (Health app → your profile → Export All Health Data), then manually enter your cycle dates here. Your data stays private on this device.
              </p>
            </div>
          </div>

          {cycles.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "2rem", textAlign: "center" }}>
              <p style={{ color: WARM_GRAY, fontSize: "0.875rem", margin: 0, fontStyle: "italic" }}>Log at least one cycle to see pattern notes.</p>
            </div>
          ) : (
            <>
              {/* Symptom frequency */}
              {(() => {
                const symCount = {};
                cycles.forEach(c => (c.symptoms || []).forEach(s => { symCount[s] = (symCount[s] || 0) + 1; }));
                const sorted = Object.entries(symCount).sort((a,b) => b[1]-a[1]).slice(0, 10);
                if (!sorted.length) return null;
                return (
                  <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.25rem" }}>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: "0 0 1rem" }}>Most frequent symptoms</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {sorted.map(([sym, count]) => (
                        <div key={sym} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontSize: "0.82rem", color: INK, minWidth: 160 }}>{sym}</span>
                          <div style={{ flex: 1, height: 6, background: ROSE_LIGHT, borderRadius: 100, overflow: "hidden" }}>
                            <div style={{ width: `${(count / cycles.length) * 100}%`, height: "100%", background: ROSE, borderRadius: 100 }}/>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: WARM_GRAY, minWidth: 32 }}>{count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Avg pain */}
              {cycles.some(c => c.pain) && (() => {
                const avg = (cycles.reduce((sum, c) => sum + (c.pain || 0), 0) / cycles.length).toFixed(1);
                const max = Math.max(...cycles.map(c => c.pain || 0));
                return (
                  <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.25rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    <div><p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.25rem" }}>Avg pain level</p><p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", color: ROSE, fontWeight: 700, margin: 0 }}>{avg}/10</p></div>
                    <div><p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.25rem" }}>Highest pain recorded</p><p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", color: ROSE, fontWeight: 700, margin: 0 }}>{max}/10</p></div>
                  </div>
                );
              })()}

              {/* Symptom overlap note */}
              {globalEntries?.length > 0 && cycles.length > 0 && (
                <div style={{ background: SAGE_LIGHT, borderRadius: "0.875rem", padding: "1rem 1.25rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <Icon name="info" size={16} color={SAGE_DARK} style={{ flexShrink:0, marginTop:"0.1rem" }} />
                  <p style={{ fontSize: "0.8rem", color: SAGE_DARK, margin: 0, lineHeight: 1.6 }}>
                    <strong>Your cycle data is included in AI pattern analysis.</strong> When you run AI Insights, Care Compass will cross-reference your period dates with your symptom entries to identify cycle-related symptom patterns — like flares around your period or ovulation.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Log form modal ── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9500, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", overflowY: "auto" }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: "#fff", borderRadius: "1.25rem", maxWidth: 500, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: INK, margin: 0 }}>{editingId ? "Edit period" : "Log a period"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: WARM_GRAY, fontSize: "1.1rem" }}>✕</button>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: INK }}>First day of period <span style={{ color: ROSE }}>*</span></label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    style={{ padding: "0.65rem 0.875rem", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "0.625rem", fontSize: "0.88rem", fontFamily: "inherit", color: INK, outline: "none" }}/>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: INK }}>Last day of bleeding <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    style={{ padding: "0.65rem 0.875rem", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "0.625rem", fontSize: "0.88rem", fontFamily: "inherit", color: INK, outline: "none" }}/>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: INK }}>Flow intensity</label>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {FLOW_LEVELS.map(f => (
                    <button key={f} onClick={() => setForm(p => ({ ...p, flow: f }))}
                      style={{ padding: "0.4rem 0.875rem", borderRadius: "100px", border: "1.5px solid", borderColor: form.flow === f ? ROSE : "rgba(0,0,0,0.12)", background: form.flow === f ? ROSE : "#fff", color: form.flow === f ? "#fff" : INK, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: INK }}>Pain level <span style={{ color: ROSE, fontWeight: 700 }}>{form.pain}/10</span></label>
                <input type="range" min="0" max="10" step="1" value={form.pain}
                  onChange={e => setForm(f => ({ ...f, pain: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: ROSE }}/>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.72rem", color: "#aaa" }}>None</span>
                  <span style={{ fontSize: "0.72rem", color: "#aaa" }}>Severe / debilitating</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: INK }}>Symptoms <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#aaa" }}>(select all that apply)</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {CYCLE_SYMPTOMS.map(sym => (
                    <button key={sym} onClick={() => toggleSymptom(sym)}
                      style={{ padding: "0.3rem 0.75rem", borderRadius: "100px", border: "1.5px solid", borderColor: form.symptoms.includes(sym) ? ROSE : "rgba(0,0,0,0.1)", background: form.symptoms.includes(sym) ? ROSE_LIGHT : "#fff", color: form.symptoms.includes(sym) ? ROSE : INK_LIGHT, fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit" }}>
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: INK }}>Notes <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  placeholder="e.g. Passed large clots, couldn't get out of bed, missed work, pain started a week before..."
                  style={{ padding: "0.65rem 0.875rem", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "0.625rem", fontSize: "0.88rem", fontFamily: "inherit", color: INK, outline: "none", resize: "vertical", lineHeight: 1.6 }}/>
              </div>
            </div>
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(0,0,0,0.07)", display: "flex", gap: "0.75rem", justifyContent: "flex-end", position: "sticky", bottom: 0, background: "#fff" }}>
              <button onClick={() => { setShowForm(false); setEditingId(null); }}
                style={{ background: "transparent", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.65rem 1.25rem", fontSize: "0.875rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleSave} disabled={!form.startDate}
                style={{ background: form.startDate ? ROSE : "#aaa", color: "#fff", border: "none", borderRadius: "100px", padding: "0.65rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: form.startDate ? "pointer" : "default", fontFamily: "inherit" }}>
                {editingId ? "Update →" : "Save period →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── End Cycle Tracker Tab ──────────────────────────────────────────────── */

/* ─── CareTeamDashboard — Step A: mode toggle + stat cards + severity chart ── */
function CareTeamDashboard({ entries, bpReadings = [] }) {
  // ── AI Key Takeaways state ─────────────────────────────────────────────────
  const [takeaways, setTakeaways]         = useState(null);   // array of {insight, category}
  const [takeawaysLoading, setTakeawaysLoading] = useState(false);
  const [takeawaysError, setTakeawaysError]     = useState(null);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const now        = new Date();
  const ms30       = 30 * 24 * 60 * 60 * 1000;
  const ms7        = 7  * 24 * 60 * 60 * 1000;
  const last30     = entries.filter(e => now - new Date(e.timestamp) <= ms30);
  const last7      = entries.filter(e => now - new Date(e.timestamp) <= ms7);
  const totalDays  = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;

  const avg = (arr, field) => {
    const valid = arr.filter(e => e[field] != null);
    return valid.length ? (valid.reduce((s, e) => s + e[field], 0) / valid.length) : null;
  };

  const avgSev30   = avg(last30, "severity");
  const avgSev7    = avg(last7,  "severity");
  const flareDays  = new Set(last30.filter(e => e.severity >= 7).map(e => new Date(e.timestamp).toDateString())).size;
  const avgSleep   = avg(last30, "sleep");

  // Severity trend: daily max over last 30 days
  const dailyMax = {};
  [...last30].reverse().forEach(e => {
    const d = new Date(e.timestamp).toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
    if (!dailyMax[d] || e.severity > dailyMax[d].val) dailyMax[d] = { val: e.severity, ts: e.timestamp };
  });
  const sevPoints = Object.entries(dailyMax).slice(-21); // max 21 days shown

  // SVG chart helpers
  const W = 560, H = 130, PAD = { t: 12, b: 28, l: 24, r: 12 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const toX = i => PAD.l + (i / Math.max(sevPoints.length - 1, 1)) * cW;
  const toY = v => PAD.t + cH - ((v / 10) * cH);

  const pathD = sevPoints.map(([, d], i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(d.val).toFixed(1)}`).join(" ");
  const areaD = sevPoints.length > 1
    ? `${pathD} L ${toX(sevPoints.length - 1).toFixed(1)} ${(PAD.t + cH).toFixed(1)} L ${toX(0).toFixed(1)} ${(PAD.t + cH).toFixed(1)} Z`
    : "";

  // Stat card helper
  // ── AI Key Takeaways generator ─────────────────────────────────────────────
  const generateTakeaways = async () => {
    setTakeawaysLoading(true);
    setTakeawaysError(null);
    const avgSev30val = avgSev30 != null ? avgSev30.toFixed(1) : "N/A";
    const avgSev7val  = avgSev7  != null ? avgSev7.toFixed(1)  : "N/A";
    const avgSleepVal = avgSleep != null ? avgSleep.toFixed(1) : "N/A";
    const flare30     = new Set(last30.filter(e => e.severity >= 7).map(e => new Date(e.timestamp).toDateString())).size;
    const symFreq = {};
    entries.forEach(e => (e.trackedSymptoms || []).forEach(ts => {
      if (!symFreq[ts.id]) symFreq[ts.id] = { label: ts.label, count: 0, totalSev: 0 };
      symFreq[ts.id].count++; symFreq[ts.id].totalSev += ts.severity;
    }));
    const topSyms = Object.values(symFreq).sort((a,b) => b.count-a.count).slice(0,6)
      .map(s => `${s.label} (${s.count}x, avg ${(s.totalSev/s.count).toFixed(1)}/10)`).join(", ");
    const byDay2 = {};
    [...entries].reverse().forEach(e => {
      const k = new Date(e.timestamp).toDateString();
      if (!byDay2[k]) byDay2[k] = { sleep: null, sev: null };
      if (e.sleep != null && byDay2[k].sleep == null) byDay2[k].sleep = e.sleep;
      if (e.severity > (byDay2[k].sev || 0)) byDay2[k].sev = e.severity;
    });
    const sdKeys = Object.keys(byDay2).sort((a,b) => new Date(a)-new Date(b));
    const sPairs = sdKeys.slice(0,-1).map((d,i) => {
      const nx = sdKeys[i+1];
      return byDay2[d].sleep != null && byDay2[nx]?.sev != null ? { sleep: byDay2[d].sleep, sev: byDay2[nx].sev } : null;
    }).filter(Boolean);
    const sleepCorr = sPairs.length >= 3 ? (() => {
      const aS = sPairs.reduce((s,p)=>s+p.sleep,0)/sPairs.length;
      const aV = sPairs.reduce((s,p)=>s+p.sev,0)/sPairs.length;
      const c  = sPairs.reduce((s,p)=>s+(p.sleep-aS)*(p.sev-aV),0);
      return c<-2?"better sleep correlates with lower next-day severity":c>2?"unusual: more sleep correlated with higher next-day severity":"no strong sleep-severity correlation";
    })() : "insufficient data";
    const fnEntries = entries.filter(e => e.hoursUpright || e.energyEnvelope || e.tasksCompleted?.length);
    const energyDist = fnEntries.reduce((acc,e) => { if (e.energyEnvelope) acc[e.energyEnvelope]=(acc[e.energyEnvelope]||0)+1; return acc; }, {});
    const last30bp = bpReadings.filter(r => now - new Date(r.timestamp) <= ms30);
    const bpSummary = last30bp.length >= 2
      ? `avg systolic ${Math.round(last30bp.reduce((s,r)=>s+r.systolic,0)/last30bp.length)}, avg diastolic ${Math.round(last30bp.reduce((s,r)=>s+r.diastolic,0)/last30bp.length)} (${last30bp.length} readings)`
      : "no readings";
    const dataBlock = [
      `Period: ${totalDays} days tracked, ${entries.length} entries`,
      `Avg severity 30d: ${avgSev30val}/10 | 7d: ${avgSev7val}/10`,
      `Flare days (≥7) last 30d: ${flare30}`,
      `Avg sleep quality 30d: ${avgSleepVal}/10`,
      `Sleep pattern: ${sleepCorr}`,
      topSyms ? `Top symptoms: ${topSyms}` : "No structured symptom data yet",
      Object.keys(energyDist).length ? `Energy envelope: ${Object.entries(energyDist).map(([k,v])=>`${k} ${v}x`).join(", ")}` : "",
      `Blood pressure: ${bpSummary}`,
    ].filter(Boolean).join("\n");
    const prompt = `You are a clinical health data analyst reviewing a chronic illness patient's self-tracked data. Generate exactly 4-6 key takeaways a healthcare provider would find useful in a short appointment.

${dataBlock}

Rules: Each takeaway is one specific sentence grounded in the numbers. Include quantitative details. Focus on patterns, trends, correlations, and functional impact. Flag anything warranting clinical attention. Use cautious language: "data suggests", "pattern observed". Do NOT diagnose or recommend treatments.

Respond ONLY with valid JSON, no markdown:
[{"insight":"...","category":"pattern|trend|correlation|alert|functional"},...]`;
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 800, messages: [{ role: "user", content: prompt }] }),
      });
      const data  = await res.json();
      const raw   = data.content?.[0]?.text || "[]";
      const clean = raw.replace(/```json|```/g, "").trim();
      setTakeaways(JSON.parse(clean));
    } catch { setTakeawaysError("Unable to generate takeaways. Please try again."); }
    setTakeawaysLoading(false);
  };

  const StatCard = ({ label, value, sub, accent }) => (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "0.875rem", padding: "1rem 1.25rem", flex: 1, minWidth: 120 }}>
      <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.35rem" }}>{label}</p>
      <p style={{ fontSize: "1.6rem", fontWeight: 700, color: accent || INK, margin: "0 0 0.15rem", lineHeight: 1 }}>{value ?? "—"}</p>
      {sub && <p style={{ fontSize: "0.72rem", color: WARM_GRAY, margin: 0 }}>{sub}</p>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── Section label ── */}
      <div style={{ paddingBottom: "0.75rem", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.2rem" }}>Care Team View</p>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.3rem", fontWeight: 700, color: INK, margin: "0 0 0.25rem" }}>Clinical Summary</h2>
        <p style={{ fontSize: "0.8rem", color: WARM_GRAY, margin: 0 }}>
          Based on {entries.length} {entries.length === 1 ? "entry" : "entries"} across {totalDays} {totalDays === 1 ? "day" : "days"} · Last updated {now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* ── Stat cards row ── */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <StatCard
          label="Avg severity (30d)"
          value={avgSev30 != null ? avgSev30.toFixed(1) : "—"}
          sub={avgSev7 != null ? `${avgSev7.toFixed(1)} last 7 days` : undefined}
          accent={avgSev30 >= 7 ? "#c0392b" : avgSev30 >= 4 ? "#e8a838" : SAGE_DARK}
        />
        <StatCard
          label="Flare days (30d)"
          value={flareDays}
          sub="severity ≥ 7"
          accent={flareDays >= 10 ? "#c0392b" : flareDays >= 5 ? "#e8a838" : SAGE_DARK}
        />
        <StatCard
          label="Days tracked"
          value={totalDays}
          sub={`${entries.length} total entries`}
          accent={SAGE_DARK}
        />
        {avgSleep != null && (
          <StatCard
            label="Avg sleep quality"
            value={`${avgSleep.toFixed(1)}/10`}
            sub="30-day average"
            accent={avgSleep >= 7 ? SAGE_DARK : avgSleep >= 4 ? "#e8a838" : "#c0392b"}
          />
        )}
      </div>

      {/* ── Severity over time chart ── */}
      <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "0.875rem", padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.875rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.15rem" }}>Symptom Severity Over Time</p>
            <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: 0 }}>Daily peak — last {sevPoints.length} days · dots ≥ 7 indicate flares</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.7rem", color: WARM_GRAY }}>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: SAGE_DARK, marginRight: 4 }}/>1–3</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#e8a838", marginRight: 4 }}/>4–6</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#c0392b", marginRight: 4 }}/>7–10 flare</span>
          </div>
        </div>
        {sevPoints.length < 2 ? (
          <p style={{ fontSize: "0.82rem", color: WARM_GRAY, textAlign: "center", padding: "2rem 0" }}>Add at least 2 days of entries to see this chart</p>
        ) : (
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", display: "block" }}>
            <defs>
              <linearGradient id="ctv-sev-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SAGE} stopOpacity="0.2"/>
                <stop offset="100%" stopColor={SAGE} stopOpacity="0"/>
              </linearGradient>
            </defs>
            {/* Grid lines */}
            {[2, 4, 6, 8, 10].map(v => {
              const y = toY(v);
              return (
                <g key={v}>
                  <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#e8e4e0" strokeWidth="0.5" strokeDasharray="4 4"/>
                  <text x={PAD.l - 4} y={y + 3.5} fontSize="9" fill="#bbb" textAnchor="end">{v}</text>
                  {v === 7 && <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#c0392b" strokeWidth="0.75" strokeOpacity="0.3" strokeDasharray="6 3"/>}
                </g>
              );
            })}
            {/* Flare threshold label */}
            <text x={W - PAD.r} y={toY(7) - 3} fontSize="8" fill="#c0392b" textAnchor="end" opacity="0.6">flare threshold</text>
            {/* Area fill */}
            {areaD && <path d={areaD} fill="url(#ctv-sev-grad)"/>}
            {/* Line */}
            <path d={pathD} fill="none" stroke={SAGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Dots */}
            {sevPoints.map(([label, d], i) => {
              const x = toX(i), y = toY(d.val);
              const col = severityColor(d.val);
              const isFlare = d.val >= 7;
              return (
                <g key={i}>
                  {isFlare && <circle cx={x} cy={y} r="7" fill="#c0392b" opacity="0.12"/>}
                  <circle cx={x} cy={y} r={isFlare ? 5 : 4} fill={col} stroke="#fff" strokeWidth="1.5"/>
                  {/* Date label — show every 3rd to avoid crowding */}
                  {i % Math.ceil(sevPoints.length / 7) === 0 && (
                    <text x={x} y={H - 6} fontSize="8.5" fill="#bbb" textAnchor="middle">{label}</text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* ── Flare Pattern Map ── */}
      {(() => {
        const days30 = Array.from({ length: 30 }, (_, i) => {
          const d = new Date(now); d.setDate(d.getDate() - (29 - i)); return d;
        });
        const dayMap = {};
        last30.forEach(e => {
          const k = new Date(e.timestamp).toDateString();
          if (!dayMap[k] || e.severity > dayMap[k]) dayMap[k] = e.severity;
        });
        return (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "0.875rem", padding: "1.25rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.15rem" }}>Flare Pattern — Last 30 Days</p>
            <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: "0 0 0.875rem" }}>Each cell = daily peak severity · red = flare (≥7)</p>
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
              {days30.map((d, i) => {
                const sev = dayMap[d.toDateString()];
                const bg  = sev == null ? "#f0ece8" : sev >= 7 ? "#c0392b" : sev >= 4 ? "#e8a838" : SAGE_DARK;
                const isToday = d.toDateString() === now.toDateString();
                return (
                  <div key={i} title={`${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}${sev != null ? ` · ${sev}/10` : " · no entry"}`}
                    style={{ width: 22, height: 22, borderRadius: "0.25rem", background: bg, opacity: sev == null ? 0.25 : 1, border: isToday ? `2px solid ${INK}` : "2px solid transparent", boxSizing: "border-box" }}
                  />
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.625rem", fontSize: "0.7rem", color: WARM_GRAY }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: SAGE_DARK, marginRight: 4, verticalAlign: "middle" }}/>1–3</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#e8a838", marginRight: 4, verticalAlign: "middle" }}/>4–6</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#c0392b", marginRight: 4, verticalAlign: "middle" }}/>7–10 flare</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#f0ece8", opacity: 0.4, marginRight: 4, verticalAlign: "middle" }}/>no entry</span>
            </div>
          </div>
        );
      })()}

      {/* ── Flare Composition — what drove severity on bad days ── */}
      {(() => {
        const flareDayEntries = last30.filter(e => e.severity >= 7);
        if (flareDayEntries.length === 0) return null;

        // Unified composition: merge tracked symptoms + keyword fallback from free text
        // Use a shared map keyed by label so both sources contribute to the same bars
        const FLARE_KEYWORD_MAP = {
          "fatigue": "Fatigue", "tired": "Fatigue", "exhausted": "Fatigue",
          "headache": "Headache", "migraine": "Headache", "head pain": "Head pain",
          "nausea": "Nausea", "vomiting": "Nausea",
          "dizziness": "Dizziness", "dizzy": "Dizziness",
          "brain fog": "Brain fog", "fog": "Brain fog",
          "palpitation": "Heart palpitations", "heart racing": "Heart palpitations",
          "shoulder": "Shoulder pain", "neck": "Neck pain", "back pain": "Back pain",
          "joint": "Joint pain", "knee": "Joint pain", "hip": "Joint pain",
          "numbness": "Numbness / tingling", "tingling": "Numbness / tingling",
          "anxiety": "Anxiety", "chest pain": "Chest pain",
          "abdominal": "Abdominal pain", "bloating": "Bloating",
          "pain": "Pain", // generic fallback
        };
        const unified = {};
        const addUnified = (label, sev) => {
          const k = label.toLowerCase();
          if (!unified[k]) unified[k] = { label, count: 0, totalSev: 0, source: "tracked" };
          unified[k].count++;
          unified[k].totalSev += sev;
        };

        flareDayEntries.forEach(e => {
          if (e.trackedSymptoms && e.trackedSymptoms.length > 0) {
            // Use structured data — most accurate
            e.trackedSymptoms.forEach(ts => addUnified(ts.label, ts.severity));
          } else if (e.symptoms) {
            // Keyword parse free text — fallback for older entries
            const text = e.symptoms.toLowerCase();
            let matched = false;
            Object.entries(FLARE_KEYWORD_MAP).forEach(([kw, label]) => {
              if (text.includes(kw)) { addUnified(label, e.severity); matched = true; }
            });
            // If no keyword matched, add a generic "Unspecified symptoms" entry
            if (!matched) addUnified("Unspecified symptoms", e.severity);
          }
        });

        const compositionList = Object.entries(unified)
          .sort((a,b) => b[1].count - a[1].count || b[1].totalSev - a[1].totalSev)
          .slice(0, 8);

        if (compositionList.length === 0) return null;
        const maxCount = Math.max(...compositionList.map(([,v]) => v.count));

        return (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "0.875rem", padding: "1.25rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.15rem" }}>Flare Day Composition</p>
            <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: "0 0 0.875rem" }}>What drove severity ≥ 7 across {flareDayEntries.length} flare {flareDayEntries.length === 1 ? "entry" : "entries"} in the last 30 days</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {compositionList.map(([key, d]) => (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.2rem" }}>
                    <span style={{ fontWeight: 600, color: INK }}>{d.label}</span>
                    <span style={{ color: WARM_GRAY }}>{d.count}× · avg {(d.totalSev/d.count).toFixed(1)}/10</span>
                  </div>
                  <div style={{ height: 8, background: "rgba(0,0,0,0.06)", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${Math.round((d.count/maxCount)*100)}%`, background: d.totalSev/d.count >= 7 ? "#c0392b" : d.totalSev/d.count >= 4 ? "#e8a838" : SAGE_DARK, borderRadius: 4 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Per-Symptom Trend Lines ── */}
      {(() => {
        const COLORS = ["#4a7058","#4a9fa5","#c0392b","#e8a838","#8b7ab8","#c0567a"];

        // Keyword → { id, label } map so free-text matches merge with tracked-pill data
        const FREETEXT_KW = {
          "fatigue": { id: "fatigue", label: "Fatigue" },
          "tired": { id: "fatigue", label: "Fatigue" },
          "exhausted": { id: "fatigue", label: "Fatigue" },
          "brain fog": { id: "brain-fog", label: "Brain fog" },
          "fog": { id: "brain-fog", label: "Brain fog" },
          "malaise": { id: "malaise", label: "Malaise" },
          "headache": { id: "pain-head", label: "Head pain" },
          "migraine": { id: "pain-head", label: "Head pain" },
          "head pain": { id: "pain-head", label: "Head pain" },
          "neck pain": { id: "pain-neck", label: "Neck pain" },
          "neck": { id: "pain-neck", label: "Neck pain" },
          "shoulder pain": { id: "pain-shoulder", label: "Shoulder pain" },
          "shoulder": { id: "pain-shoulder", label: "Shoulder pain" },
          "back pain": { id: "pain-back", label: "Back pain" },
          "joint pain": { id: "pain-joint", label: "Joint pain" },
          "joint": { id: "pain-joint", label: "Joint pain" },
          "chest pain": { id: "pain-chest", label: "Chest pain" },
          "dizziness": { id: "dizziness", label: "Dizziness" },
          "dizzy": { id: "dizziness", label: "Dizziness" },
          "lightheaded": { id: "dizziness", label: "Dizziness" },
          "numbness": { id: "numbness", label: "Numbness / tingling" },
          "tingling": { id: "numbness", label: "Numbness / tingling" },
          "light sensitivity": { id: "light-sound", label: "Light / sound sensitivity" },
          "sound sensitivity": { id: "light-sound", label: "Light / sound sensitivity" },
          "vision": { id: "vision", label: "Vision changes" },
          "palpitation": { id: "palpitations", label: "Heart palpitations" },
          "heart racing": { id: "palpitations", label: "Heart palpitations" },
          "racing heart": { id: "palpitations", label: "Heart palpitations" },
          "shortness of breath": { id: "sob", label: "Shortness of breath" },
          "short of breath": { id: "sob", label: "Shortness of breath" },
          "temperature": { id: "temp-dysreg", label: "Temperature dysregulation" },
          "nausea": { id: "nausea", label: "Nausea" },
          "nauseous": { id: "nausea", label: "Nausea" },
          "vomiting": { id: "nausea", label: "Nausea" },
          "bloating": { id: "bloating", label: "Bloating" },
          "bloated": { id: "bloating", label: "Bloating" },
          "abdominal pain": { id: "abdominal", label: "Abdominal pain" },
          "abdominal": { id: "abdominal", label: "Abdominal pain" },
          "stomach pain": { id: "abdominal", label: "Abdominal pain" },
          "anxiety": { id: "anxiety", label: "Anxiety" },
          "anxious": { id: "anxiety", label: "Anxiety" },
          "low mood": { id: "low-mood", label: "Low mood" },
          "depressed": { id: "low-mood", label: "Low mood" },
          "depression": { id: "low-mood", label: "Low mood" },
        };

        // Build per-symptom data across ALL entries (bucket by calendar date)
        // Primary: structured tracked symptom pills
        // Fallback: keyword-parse free-text symptoms field for entries without pills
        const symDaysAll = {};
        const addToSymDays = (map, id, label, d, sev) => {
          if (!map[id]) map[id] = { label, days: {}, count: 0, totalSev: 0 };
          if (!map[id].days[d] || sev > map[id].days[d]) map[id].days[d] = sev;
          map[id].count++;
          map[id].totalSev += sev;
        };
        entries.forEach(e => {
          const d = new Date(e.timestamp).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
          if (e.trackedSymptoms && e.trackedSymptoms.length > 0) {
            // Structured data — use per-symptom severity directly
            e.trackedSymptoms.forEach(ts => addToSymDays(symDaysAll, ts.id, ts.label, d, ts.severity));
          } else if (e.symptoms) {
            // Free-text fallback — keyword match, use entry's overall severity
            const text = e.symptoms.toLowerCase();
            const matched = new Set();
            // Check multi-word phrases first to avoid "back pain" matching "pain" alone
            Object.entries(FREETEXT_KW).sort((a,b) => b[0].length - a[0].length).forEach(([kw, sym]) => {
              if (!matched.has(sym.id) && text.includes(kw)) {
                addToSymDays(symDaysAll, sym.id, sym.label, d, e.severity);
                matched.add(sym.id);
              }
            });
          }
        });

        // Top symptoms by occurrence across all time
        const allSymList = Object.entries(symDaysAll)
          .map(([id, v]) => ({ id, label: v.label, days: v.days, count: v.count, totalSev: v.totalSev }))
          .filter(s => Object.keys(s.days).length >= 2)
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        if (allSymList.length === 0) return null;

        // Range options — resolve to ms cutoff (null = all time)
        const RANGES = [
          { label: "30d", ms: 30 * 86400000 },
          { label: "90d", ms: 90 * 86400000 },
          { label: "6mo", ms: 180 * 86400000 },
          { label: "All", ms: null },
        ];
        const [rangeIdx, setRangeIdx] = React.useState(0);
        const range = RANGES[rangeIdx];

        // Filter entries to selected range
        const rangeEntries = range.ms ? entries.filter(e => now - new Date(e.timestamp) <= range.ms) : entries;

        // Rebuild per-symptom days for the selected range
        const symDays = {};
        rangeEntries.forEach(e => {
          const d = new Date(e.timestamp).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
          (e.trackedSymptoms || []).forEach(ts => {
            if (!allSymList.find(s => s.id === ts.id)) return; // only top symptoms
            if (!symDays[ts.id]) symDays[ts.id] = { label: ts.label, days: {}, count: 0, totalSev: 0 };
            if (!symDays[ts.id].days[d] || ts.severity > symDays[ts.id].days[d]) symDays[ts.id].days[d] = ts.severity;
            symDays[ts.id].count++;
            symDays[ts.id].totalSev += ts.severity;
          });
        });

        const symList = allSymList.map(s => ({
          ...s,
          days: symDays[s.id]?.days || {},
          dayCount: Object.keys(symDays[s.id]?.days || {}).length,
          avgSev: symDays[s.id]?.count ? symDays[s.id].totalSev / symDays[s.id].count : 0,
        })).filter(s => s.dayCount >= 1);

        // X-axis: all unique dates in range, sorted chronologically
        const allDates = [...new Set(rangeEntries.map(e =>
          new Date(e.timestamp).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
        ))].sort((a, b) => new Date(a) - new Date(b));

        // For dense data, bucket into weekly averages to keep chart readable
        const useWeekly = allDates.length > 60;
        let chartDates, getVal;
        if (useWeekly) {
          // Group dates into ISO weeks
          const weekMap = {};
          rangeEntries.forEach(e => {
            const dt = new Date(e.timestamp);
            const weekStart = new Date(dt); weekStart.setDate(dt.getDate() - dt.getDay());
            const wk = weekStart.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
            (e.trackedSymptoms || []).forEach(ts => {
              const key = ts.id + "||" + wk;
              if (!weekMap[key]) weekMap[key] = { id: ts.id, wk, vals: [] };
              weekMap[key].vals.push(ts.severity);
            });
          });
          const allWeeks = [...new Set(Object.values(weekMap).map(v => v.wk))].sort((a,b) => {
            const [am,ad] = a.split("/").map(Number), [bm,bd] = b.split("/").map(Number);
            return am !== bm ? am - bm : ad - bd;
          });
          chartDates = allWeeks;
          getVal = (symId, wk) => {
            const k = symId + "||" + wk;
            if (!weekMap[k]) return null;
            const vals = weekMap[k].vals;
            return Math.max(...vals);
          };
        } else {
          chartDates = allDates;
          getVal = (symId, d) => symDays[symId]?.days[d] ?? null;
        }

        const rangeLabel = range.ms
          ? `last ${range.label}${useWeekly ? " (weekly avg)" : ""}`
          : `all time${useWeekly ? " (weekly)" : ""}`;

        const TW = 560, TH = 110, TP = { t: 8, b: 24, l: 24, r: 8 };
        const tCW = TW - TP.l - TP.r, tCH = TH - TP.t - TP.b;
        const tX = i => TP.l + (i / Math.max(chartDates.length - 1, 1)) * tCW;
        const tY = v => TP.t + tCH - ((v / 10) * tCH);

        // X label step: aim for ~6 labels
        const labelStep = Math.max(1, Math.ceil(chartDates.length / 6));

        // Format date label: show year only if data spans multiple years
        const allYears = new Set(rangeEntries.map(e => new Date(e.timestamp).getFullYear()));
        const showYear = allYears.size > 1;
        const fmtLabel = d => {
          if (useWeekly) return d; // already "M/D"
          const parts = d.split("/"); // M/D/YYYY
          return showYear ? `${parts[0]}/${parts[1]}/${parts[2].slice(2)}` : `${parts[0]}/${parts[1]}`;
        };

        return (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "0.875rem", padding: "1.25rem" }}>
            {/* Header + range toggle */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem", gap: "0.5rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.1rem" }}>Per-Symptom Severity Trends</p>
                <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: 0 }}>Daily peak per tracked symptom — {rangeLabel}</p>
              </div>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                {RANGES.map((r, ri) => (
                  <button key={r.label} onClick={() => setRangeIdx(ri)}
                    style={{ fontSize: "0.68rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: 6, border: `1.5px solid ${rangeIdx === ri ? SAGE_DARK : "rgba(0,0,0,0.12)"}`, background: rangeIdx === ri ? SAGE_DARK : "transparent", color: rangeIdx === ri ? "#fff" : WARM_GRAY, cursor: "pointer", transition: "all 0.12s" }}
                  >{r.label}</button>
                ))}
              </div>
            </div>

            {chartDates.length < 2 || symList.length === 0 ? (
              <p style={{ fontSize: "0.78rem", color: WARM_GRAY, fontStyle: "italic", margin: "0.5rem 0" }}>Not enough data in this range yet.</p>
            ) : (
              <svg width="100%" viewBox={`0 0 ${TW} ${TH}`} style={{ overflow: "visible", display: "block" }}>
                {[2,4,6,8,10].map(v => (
                  <g key={v}>
                    <line x1={TP.l} y1={tY(v)} x2={TW-TP.r} y2={tY(v)} stroke="#e8e4e0" strokeWidth="0.5" strokeDasharray="3 3"/>
                    <text x={TP.l-4} y={tY(v)+3} fontSize="8" fill="#bbb" textAnchor="end">{v}</text>
                  </g>
                ))}
                {symList.map((sym, si) => {
                  const color = COLORS[si % COLORS.length];
                  const points = chartDates.map((d, i) => {
                    const v = getVal(sym.id, d);
                    return v != null ? { x: tX(i), y: tY(v), v } : null;
                  }).filter(Boolean);
                  if (points.length < 2) return null;
                  const path = points.map((p, pi) => `${pi === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
                  return (
                    <g key={sym.id}>
                      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8"/>
                      {points.map((p, pi) => (
                        <circle key={pi} cx={p.x} cy={p.y} r="2.5" fill={color} stroke="#fff" strokeWidth="1">
                          <title>{sym.label}: {p.v}/10</title>
                        </circle>
                      ))}
                    </g>
                  );
                })}
                {chartDates.map((d, i) => i % labelStep === 0 && (
                  <text key={d} x={tX(i)} y={TH-4} fontSize="8" fill="#bbb" textAnchor="middle">{fmtLabel(d)}</text>
                ))}
              </svg>
            )}

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              {symList.map((sym, si) => (
                <div key={sym.id} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", color: WARM_GRAY }}>
                  <span style={{ display: "inline-block", width: 16, height: 2.5, background: COLORS[si % COLORS.length], borderRadius: 2 }}/>
                  {sym.label} <span style={{ color: SAGE_DARK, fontWeight: 600 }}>{sym.avgSev.toFixed(1)}/10 avg</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Sleep × Next-Day Severity ── */}
      {(() => {
        const byDay = {};
        [...entries].reverse().forEach(e => {
          const k = new Date(e.timestamp).toDateString();
          if (!byDay[k]) byDay[k] = { sleep: null, sev: null };
          if (e.sleep != null && byDay[k].sleep == null) byDay[k].sleep = e.sleep;
          if (e.severity > (byDay[k].sev || 0)) byDay[k].sev = e.severity;
        });
        const sortedDays = Object.keys(byDay).sort((a, b) => new Date(a) - new Date(b));
        const pairs = sortedDays.slice(0, -1).map((day, i) => {
          const nextDay = sortedDays[i + 1];
          const sleep = byDay[day].sleep;
          const nextSev = byDay[nextDay]?.sev;
          return sleep != null && nextSev != null ? { sleep, nextSev } : null;
        }).filter(Boolean);
        if (pairs.length < 3) return null;

        const SW = 300, SH = 120, SP = { t: 10, b: 24, l: 28, r: 10 };
        const sCW = SW - SP.l - SP.r, sCH = SH - SP.t - SP.b;
        const sX = v => SP.l + ((v - 1) / 9) * sCW;
        const sY = v => SP.t + sCH - ((v - 1) / 9) * sCH;
        const avgSleepP = pairs.reduce((s, p) => s + p.sleep, 0) / pairs.length;
        const avgSevP   = pairs.reduce((s, p) => s + p.nextSev, 0) / pairs.length;
        const corr = pairs.reduce((s, p) => s + (p.sleep - avgSleepP) * (p.nextSev - avgSevP), 0);
        const corrLabel = corr < -2 ? "Better sleep correlates with lower next-day severity" : corr > 2 ? "Unusual pattern — more sleep associated with higher next-day severity" : "No strong correlation detected yet";

        return (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "0.875rem", padding: "1.25rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.15rem" }}>Sleep Quality → Next-Day Severity</p>
            <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: "0 0 0.875rem" }}>Each dot = one night's sleep vs following day's peak severity · {pairs.length} data points</p>
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
              <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ overflow: "visible", flexShrink: 0 }}>
                {[2,4,6,8,10].map(v => (
                  <g key={v}>
                    <line x1={SP.l} y1={sY(v)} x2={SW-SP.r} y2={sY(v)} stroke="#e8e4e0" strokeWidth="0.5" strokeDasharray="3 3"/>
                    <text x={SP.l-4} y={sY(v)+3} fontSize="8" fill="#bbb" textAnchor="end">{v}</text>
                    <line x1={sX(v)} y1={SP.t} x2={sX(v)} y2={SP.t+sCH} stroke="#e8e4e0" strokeWidth="0.5" strokeDasharray="3 3"/>
                    <text x={sX(v)} y={SH-4} fontSize="8" fill="#bbb" textAnchor="middle">{v}</text>
                  </g>
                ))}
                <text x={SP.l} y={SH} fontSize="7.5" fill="#bbb">sleep →</text>
                <text x={SP.l-6} y={SP.t+sCH/2} fontSize="7.5" fill="#bbb" textAnchor="middle" transform={`rotate(-90, ${SP.l-6}, ${SP.t+sCH/2})`}>severity</text>
                {pairs.map((p, i) => (
                  <circle key={i} cx={sX(p.sleep)} cy={sY(p.nextSev)} r="4" fill={severityColor(p.nextSev)} stroke="#fff" strokeWidth="1" opacity="0.85"/>
                ))}
              </svg>
              <div style={{ flex: 1, minWidth: 140 }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: INK, margin: "0 0 0.35rem" }}>Pattern</p>
                <p style={{ fontSize: "0.8rem", color: WARM_GRAY, margin: "0 0 0.875rem", lineHeight: 1.5 }}>{corrLabel}</p>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <div>
                    <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: WARM_GRAY, margin: "0 0 0.1rem" }}>Avg sleep</p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 700, color: TEAL, margin: 0 }}>{avgSleepP.toFixed(1)}/10</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: WARM_GRAY, margin: "0 0 0.1rem" }}>Avg next-day sev</p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 700, color: severityColor(Math.round(avgSevP)), margin: 0 }}>{avgSevP.toFixed(1)}/10</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Good Day / Bad Day Snapshot ── */}
      {(() => {
        const dayAvg = {};
        [...entries].reverse().forEach(e => {
          const k = new Date(e.timestamp).toDateString();
          if (!dayAvg[k]) dayAvg[k] = { sevs: [], symptoms: [], sleep: null, stress: null };
          dayAvg[k].sevs.push(e.severity);
          if (e.symptoms) dayAvg[k].symptoms.push(e.symptoms);
          if (e.trackedSymptoms && e.trackedSymptoms.length) dayAvg[k].trackedSymptoms = [...(dayAvg[k].trackedSymptoms || []), ...e.trackedSymptoms];
          if (e.sleep != null && dayAvg[k].sleep == null) dayAvg[k].sleep = e.sleep;
          if (e.stress != null) dayAvg[k].stress = e.stress;
        });
        const daySummaries = Object.entries(dayAvg)
          .map(([k, v]) => ({ date: k, avg: v.sevs.reduce((a, b) => a + b, 0) / v.sevs.length, ...v }))
          .filter(d => d.sevs.length > 0);
        if (daySummaries.length < 2) return null;

        const best  = daySummaries.reduce((a, b) => a.avg < b.avg ? a : b);
        const worst = daySummaries.reduce((a, b) => a.avg > b.avg ? a : b);

        const DayCard = ({ label, day, accent, bg }) => (
          <div style={{ flex: 1, minWidth: 160, background: bg, borderRadius: "0.75rem", padding: "1rem 1.1rem" }}>
            <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: accent, margin: "0 0 0.2rem" }}>{label}</p>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: INK, margin: "0 0 0.5rem" }}>{new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: "0.65rem", color: WARM_GRAY, margin: "0 0 0.1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Avg severity</p>
                <p style={{ fontSize: "1.4rem", fontWeight: 700, color: accent, margin: 0, lineHeight: 1 }}>{day.avg.toFixed(1)}</p>
              </div>
              {day.sleep != null && <div>
                <p style={{ fontSize: "0.65rem", color: WARM_GRAY, margin: "0 0 0.1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sleep</p>
                <p style={{ fontSize: "1.4rem", fontWeight: 700, color: TEAL, margin: 0, lineHeight: 1 }}>{day.sleep}/10</p>
              </div>}
              {day.stress != null && <div>
                <p style={{ fontSize: "0.65rem", color: WARM_GRAY, margin: "0 0 0.1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Stress</p>
                <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#e8a838", margin: 0, lineHeight: 1 }}>{day.stress}/10</p>
              </div>}
            </div>
            {day.symptoms.length > 0 && !day.trackedSymptoms?.length && (
              <p style={{ fontSize: "0.74rem", color: WARM_GRAY, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{day.symptoms[0].slice(0, 80)}{day.symptoms[0].length > 80 ? "…" : ""}"</p>
            )}
            {day.trackedSymptoms && day.trackedSymptoms.length > 0 && (
              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                {[...new Map(day.trackedSymptoms.map(ts => [ts.id, ts])).values()].slice(0,4).map(ts => (
                  <span key={ts.id} style={{ fontSize: "0.68rem", background: "rgba(0,0,0,0.06)", borderRadius: "100px", padding: "0.15rem 0.5rem", color: INK }}>
                    {ts.label} {ts.severity}/10
                  </span>
                ))}
              </div>
            )}
          </div>
        );

        return (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "0.875rem", padding: "1.25rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.875rem" }}>Best Day vs Worst Day</p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <DayCard label="Best day" day={best}  accent={SAGE_DARK} bg={SAGE_LIGHT}/>
              <DayCard label="Worst day" day={worst} accent="#c0392b"  bg="#fdeaea"/>
            </div>
          </div>
        );
      })()}

      {/* ── Functional Impact ── */}
      {(() => {
        const withFn = entries.filter(e => e.hoursUpright || (e.tasksCompleted && e.tasksCompleted.length > 0) || e.energyEnvelope);
        if (withFn.length < 2) return null;
        const uprightCounts = { "< 2h": 0, "2–4h": 0, "4–8h": 0, "8+h": 0 };
        withFn.forEach(e => { if (e.hoursUpright && uprightCounts[e.hoursUpright] != null) uprightCounts[e.hoursUpright]++; });
        const uprightTotal = Object.values(uprightCounts).reduce((a, b) => a + b, 0);
        const energyCounts = { Low: 0, Medium: 0, High: 0 };
        withFn.forEach(e => { if (e.energyEnvelope && energyCounts[e.energyEnvelope] != null) energyCounts[e.energyEnvelope]++; });
        const energyTotal = Object.values(energyCounts).reduce((a, b) => a + b, 0);
        const taskCounts = {};
        withFn.forEach(e => (e.tasksCompleted || []).forEach(t => { taskCounts[t] = (taskCounts[t] || 0) + 1; }));
        const topTasks = Object.entries(taskCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

        const BarRow = ({ label, count, total, color }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div style={{ marginBottom: "0.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: WARM_GRAY, marginBottom: "0.2rem" }}>
                <span>{label}</span><span>{pct}%</span>
              </div>
              <div style={{ height: 7, background: "rgba(0,0,0,0.06)", borderRadius: 4 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4 }}/>
              </div>
            </div>
          );
        };

        return (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "0.875rem", padding: "1.25rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.875rem" }}>Functional Impact · {withFn.length} evening logs</p>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {uprightTotal > 0 && (
                <div style={{ flex: 1, minWidth: 150 }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, color: INK, margin: "0 0 0.5rem" }}>Hours upright</p>
                  {Object.entries(uprightCounts).map(([label, count]) => (
                    <BarRow key={label} label={label} count={count} total={uprightTotal} color={SAGE}/>
                  ))}
                </div>
              )}
              {energyTotal > 0 && (
                <div style={{ flex: 1, minWidth: 150 }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, color: INK, margin: "0 0 0.5rem" }}>Energy envelope</p>
                  {[["Low", SAGE_DARK], ["Medium", "#e8a838"], ["High", "#c0392b"]].map(([level, color]) => (
                    <BarRow key={level} label={level} count={energyCounts[level]} total={energyTotal} color={color}/>
                  ))}
                </div>
              )}
              {topTasks.length > 0 && (
                <div style={{ flex: 1, minWidth: 150 }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, color: INK, margin: "0 0 0.5rem" }}>Tasks managed</p>
                  {topTasks.map(([task, count]) => (
                    <BarRow key={task} label={task} count={count} total={withFn.length} color={TEAL}/>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Blood Pressure Trends ── */}
      {(() => {
        const last30bp = [...bpReadings]
          .filter(r => now - new Date(r.timestamp) <= ms30)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .slice(-20);
        if (last30bp.length < 2) return (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "0.875rem", padding: "1.25rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.35rem" }}>Blood Pressure Trends</p>
            <p style={{ fontSize: "0.82rem", color: WARM_GRAY, fontStyle: "italic" }}>No readings in the last 30 days. Log readings in the Blood Pressure tab to see trends here.</p>
          </div>
        );
        const BW = 520, BH = 120, BP2 = { t: 10, b: 24, l: 32, r: 10 };
        const bCW = BW - BP2.l - BP2.r, bCH = BH - BP2.t - BP2.b;
        const allVals = last30bp.flatMap(r => [r.systolic, r.diastolic]);
        const bMax = Math.max(...allVals, 160), bMin = Math.min(...allVals, 60);
        const bY = v => BP2.t + bCH - ((v - bMin) / Math.max(bMax - bMin, 1)) * bCH;
        const bX = i => BP2.l + (i / Math.max(last30bp.length - 1, 1)) * bCW;
        const sysPath = last30bp.map((r, i) => `${i === 0 ? "M" : "L"} ${bX(i).toFixed(1)} ${bY(r.systolic).toFixed(1)}`).join(" ");
        const diaPath = last30bp.map((r, i) => `${i === 0 ? "M" : "L"} ${bX(i).toFixed(1)} ${bY(r.diastolic).toFixed(1)}`).join(" ");
        const avgSys = Math.round(last30bp.reduce((s, r) => s + r.systolic, 0) / last30bp.length);
        const avgDia = Math.round(last30bp.reduce((s, r) => s + r.diastolic, 0) / last30bp.length);
        return (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "0.875rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.875rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.15rem" }}>Blood Pressure Trends</p>
                <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: 0 }}>Last {last30bp.length} readings · 30-day window</p>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: WARM_GRAY, margin: "0 0 0.1rem" }}>Avg systolic</p>
                  <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#c0392b", margin: 0 }}>{avgSys}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: WARM_GRAY, margin: "0 0 0.1rem" }}>Avg diastolic</p>
                  <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e8a838", margin: 0 }}>{avgDia}</p>
                </div>
              </div>
            </div>
            <svg width="100%" viewBox={`0 0 ${BW} ${BH}`} style={{ overflow: "visible", display: "block" }}>
              <rect x={BP2.l} y={bY(120)} width={bCW} height={Math.abs(bY(90) - bY(120))} fill={SAGE_LIGHT} opacity="0.5"/>
              {[80, 100, 120, 140, 160].filter(v => v >= bMin - 10 && v <= bMax + 10).map(v => (
                <g key={v}>
                  <line x1={BP2.l} y1={bY(v)} x2={BW-BP2.r} y2={bY(v)} stroke="#e8e4e0" strokeWidth="0.5" strokeDasharray="3 3"/>
                  <text x={BP2.l-4} y={bY(v)+3} fontSize="8" fill="#bbb" textAnchor="end">{v}</text>
                </g>
              ))}
              <path d={sysPath} fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d={diaPath} fill="none" stroke="#e8a838" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3"/>
              {last30bp.map((r, i) => (
                <g key={i}>
                  <circle cx={bX(i)} cy={bY(r.systolic)}  r="3.5" fill="#c0392b" stroke="#fff" strokeWidth="1"/>
                  <circle cx={bX(i)} cy={bY(r.diastolic)} r="3.5" fill="#e8a838" stroke="#fff" strokeWidth="1"/>
                  {i % Math.ceil(last30bp.length / 5) === 0 && (
                    <text x={bX(i)} y={BH-4} fontSize="8" fill="#bbb" textAnchor="middle">
                      {new Date(r.timestamp).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
                    </text>
                  )}
                </g>
              ))}
            </svg>
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.7rem", color: WARM_GRAY }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-block", width: 20, height: 2, background: "#c0392b" }}/>Systolic</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-block", width: 20, height: 2, background: "#e8a838" }}/>Diastolic</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-block", width: 10, height: 10, background: SAGE_LIGHT }}/>Normal range</span>
            </div>
          </div>
        );
      })()}

      {/* ── AI Key Takeaways ── */}
      <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "0.875rem", padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.875rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.15rem" }}>AI Key Takeaways</p>
            <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: 0 }}>Clinical insights generated from your tracking data · for discussion with your provider</p>
          </div>
          {takeaways && !takeawaysLoading && (
            <button onClick={generateTakeaways} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.35rem 0.875rem", fontSize: "0.75rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>
              Regenerate
            </button>
          )}
        </div>

        {!takeaways && !takeawaysLoading && !takeawaysError && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "1rem 0" }}>
            <p style={{ fontSize: "0.82rem", color: WARM_GRAY, margin: 0, textAlign: "center", maxWidth: 340, lineHeight: 1.6 }}>
              Generate AI-powered clinical insights from your {entries.length} entries across {totalDays} days of tracking.
            </p>
            <button onClick={generateTakeaways}
              style={{ background: SAGE_DARK, color: "#fff", border: "none", borderRadius: "100px", padding: "0.65rem 1.75rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Generate Key Takeaways →
            </button>
          </div>
        )}

        {takeawaysLoading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1.25rem 0" }}>
            <div style={{ width: 28, height: 28, border: `3px solid ${SAGE_LIGHT}`, borderTop: `3px solid ${SAGE_DARK}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/>
            <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0 }}>Analysing your data…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {takeawaysError && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.625rem", padding: "0.75rem 0" }}>
            <p style={{ fontSize: "0.82rem", color: "#c0392b", margin: 0 }}>{takeawaysError}</p>
            <button onClick={generateTakeaways} style={{ background: SAGE_DARK, color: "#fff", border: "none", borderRadius: "100px", padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Try again
            </button>
          </div>
        )}

        {takeaways && !takeawaysLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {takeaways.map((t, i) => {
              const catColors = {
                alert:       { bg: "#fdeaea", border: "#c0392b", dot: "#c0392b" },
                correlation: { bg: TEAL_LIGHT, border: TEAL, dot: TEAL },
                trend:       { bg: "#fef3da", border: "#e8a838", dot: "#e8a838" },
                functional:  { bg: SAGE_LIGHT, border: SAGE_DARK, dot: SAGE_DARK },
                pattern:     { bg: SAGE_LIGHT, border: SAGE, dot: SAGE },
              };
              const col = catColors[t.category] || catColors.pattern;
              return (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", background: col.bg, border: `1px solid ${col.border}22`, borderRadius: "0.625rem", padding: "0.75rem 0.875rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.dot, flexShrink: 0, marginTop: "0.3rem" }}/>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: INK, lineHeight: 1.6 }}>{t.insight}</p>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: col.dot }}>{t.category}</p>
                  </div>
                </div>
              );
            })}
            <p style={{ fontSize: "0.68rem", color: WARM_GRAY, margin: "0.25rem 0 0", fontStyle: "italic" }}>
              These insights are generated from self-reported tracking data and are not a medical assessment. Always discuss with your healthcare provider.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
function ReportPromptView({ careTeam, reportPrompt, setReportPrompt, entries, handleGenerateReport, s }) {
  const selectedMember    = careTeam.find(p => p.name === reportPrompt.providerName);
  const isOther           = reportPrompt.showOther;
  const recipientIsCaregiver = selectedMember
    ? selectedMember.type === "caregiver"
    : isOther ? reportPrompt.otherType === "caregiver" : false;
  const canGenerate = recipientIsCaregiver
    ? !!reportPrompt.providerName.trim()
    : isOther
      ? !!(reportPrompt.otherType && (reportPrompt.focus.trim() || reportPrompt.specialty))
      : !!(reportPrompt.focus.trim() || reportPrompt.specialty);
  const providerMembers  = careTeam.filter(p => p.name && p.type !== "caregiver");
  const caregiverMembers = careTeam.filter(p => p.name && p.type === "caregiver");
  const hasTeam          = careTeam.filter(p => p.name).length > 0;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div>
        <p style={s.eyebrow}>Care Team Report</p>
        <h2 style={{ ...s.title, fontSize: "1.5rem", marginBottom: "0.4rem" }}>
          {recipientIsCaregiver ? "Prepare a health update" : "Prepare your visit report"}
        </h2>
        <p style={{ fontSize: "0.92rem", color: WARM_GRAY, margin: 0, lineHeight: 1.65 }}>
          {recipientIsCaregiver
            ? "Care Compass will generate a plain-language health update for your caregiver or support person — no medical jargon, just a clear picture of how you've been doing."
            : "Tell us about your upcoming appointment and Care Compass will generate a focused, AI-powered report with your metrics, relevant entries, and questions tailored to your visit."}
        </p>
      </div>

      <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* ── Who is this report for? ── */}
        <div style={s.formGroup}>
          <label style={s.label}>Who is this report for?</label>
          {hasTeam ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {providerMembers.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Medical Providers</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {providerMembers.map((p, i) => (
                      <button key={i}
                        onClick={() => setReportPrompt(prev => ({ ...prev, providerName: p.name, specialty: p.specialty || prev.specialty, saveToTeam: false, otherType: "", showOther: false }))}
                        style={{ padding: "0.4rem 0.875rem", borderRadius: "100px", border: "1.5px solid", borderColor: reportPrompt.providerName === p.name && !isOther ? SAGE_DARK : "rgba(0,0,0,0.12)", background: reportPrompt.providerName === p.name && !isOther ? SAGE_DARK : "#fff", color: reportPrompt.providerName === p.name && !isOther ? "#fff" : INK, fontSize: "0.85rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                        {p.name}{p.specialty ? ` · ${p.specialty}` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {caregiverMembers.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Caregivers & Support People</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {caregiverMembers.map((p, i) => (
                      <button key={i}
                        onClick={() => setReportPrompt(prev => ({ ...prev, providerName: p.name, specialty: "", saveToTeam: false, otherType: "", showOther: false }))}
                        style={{ padding: "0.4rem 0.875rem", borderRadius: "100px", border: "1.5px solid", borderColor: reportPrompt.providerName === p.name && !isOther ? TEAL : "rgba(0,0,0,0.12)", background: reportPrompt.providerName === p.name && !isOther ? TEAL : "#fff", color: reportPrompt.providerName === p.name && !isOther ? "#fff" : INK, fontSize: "0.85rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                        {p.name}{p.careRole ? ` · ${p.careRole}` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.15rem" }}>
                <button
                  onClick={() => setReportPrompt(prev => ({ ...prev, showOther: true, providerName: prev.showOther ? prev.providerName : "" }))}
                  style={{ padding: "0.4rem 0.875rem", borderRadius: "100px", border: `1.5px ${isOther ? "solid" : "dashed"}`, borderColor: isOther ? SAGE_DARK : "rgba(0,0,0,0.15)", background: isOther ? SAGE_DARK : "#fff", color: isOther ? "#fff" : WARM_GRAY, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", fontWeight: isOther ? 600 : 400 }}>
                  + Someone else
                </button>
              </div>
              {isOther && (
                <input style={s.input} value={reportPrompt.providerName}
                  onChange={e => setReportPrompt(p => ({ ...p, providerName: e.target.value, saveToTeam: false, otherType: "", otherRole: "" }))}
                  placeholder="Enter name" autoFocus/>
              )}
              {isOther && reportPrompt.providerName.trim() && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Who is this?</p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => setReportPrompt(p => ({ ...p, otherType: "provider" }))}
                      style={{ padding: "0.4rem 0.875rem", borderRadius: "100px", border: "1.5px solid", borderColor: reportPrompt.otherType === "provider" ? SAGE_DARK : "rgba(0,0,0,0.12)", background: reportPrompt.otherType === "provider" ? SAGE_DARK : "#fff", color: reportPrompt.otherType === "provider" ? "#fff" : INK, fontSize: "0.85rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                      Medical Provider
                    </button>
                    <button
                      onClick={() => setReportPrompt(p => ({ ...p, otherType: "caregiver", otherRole: "" }))}
                      style={{ padding: "0.4rem 0.875rem", borderRadius: "100px", border: "1.5px solid", borderColor: reportPrompt.otherType === "caregiver" ? TEAL : "rgba(0,0,0,0.12)", background: reportPrompt.otherType === "caregiver" ? TEAL : "#fff", color: reportPrompt.otherType === "caregiver" ? "#fff" : INK, fontSize: "0.85rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                      Caregiver / Support Person
                    </button>
                  </div>
                  {reportPrompt.otherType === "caregiver" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <p style={{ fontSize: "0.7rem", fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Their role</p>
                      <select style={s.input} value={reportPrompt.otherRole} onChange={e => setReportPrompt(p => ({ ...p, otherRole: e.target.value }))}>
                        <option value="">Select role…</option>
                        {["Family Caregiver","Spouse / Partner","Parent","Sibling","Child / Adult Child","Home Health Aide","Personal Care Assistant","Case Manager","Social Worker","Patient Advocate","Hospice / Palliative Care Worker","Other"].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
              {reportPrompt.providerName.trim() && isOther && (
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8rem", color: SAGE_DARK }}>
                  <input type="checkbox" checked={reportPrompt.saveToTeam || false} onChange={() => setReportPrompt(p => ({ ...p, saveToTeam: !p.saveToTeam }))} style={{ accentColor: SAGE_DARK, width: 14, height: 14 }}/>
                  Save to my care team in Account Settings
                </label>
              )}
            </div>
          ) : (
            <input style={s.input} value={reportPrompt.providerName}
              onChange={e => setReportPrompt(p => ({ ...p, providerName: e.target.value }))}
              placeholder="e.g. Dr. Smith or Mom"/>
          )}
        </div>

        {/* ── Doctor fields ── */}
        {!recipientIsCaregiver && (
          <>
            <div style={s.formGroup}>
              <label style={s.label}>Specialty</label>
              <select style={s.input} value={reportPrompt.specialty} onChange={e => setReportPrompt(p => ({ ...p, specialty: e.target.value }))}>
                <option value="">Select a specialty…</option>
                {APPT_SPECIALTIES.map(sp => <option key={sp} value={sp}>{sp}</option>)}
              </select>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>What are you being seen for?</label>
              <input style={s.input} value={reportPrompt.focus} onChange={e => setReportPrompt(p => ({ ...p, focus: e.target.value }))} placeholder="e.g. Neck and knee pain, flare management, medication review"/>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Symptoms to highlight <span style={s.optional}>(optional)</span></label>
              <textarea style={{ ...s.input, resize: "vertical" }} rows={2} value={reportPrompt.symptoms} onChange={e => setReportPrompt(p => ({ ...p, symptoms: e.target.value }))} placeholder="e.g. Neck stiffness after sitting, knee pain on stairs, morning joint pain lasting 2+ hours"/>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Questions or concerns to raise <span style={s.optional}>(optional)</span></label>
              <textarea style={{ ...s.input, resize: "vertical" }} rows={2} value={reportPrompt.questions} onChange={e => setReportPrompt(p => ({ ...p, questions: e.target.value }))} placeholder="e.g. Is my pain pattern consistent with inflammation? Should we adjust my current treatment?"/>
            </div>
          </>
        )}

        {/* ── Caregiver fields ── */}
        {recipientIsCaregiver && (
          <>
            <div style={s.formGroup}>
              <label style={s.label}>What do you want them to understand? <span style={s.optional}>(optional)</span></label>
              <input style={s.input} value={reportPrompt.focus} onChange={e => setReportPrompt(p => ({ ...p, focus: e.target.value }))} placeholder="e.g. How bad my fatigue has been, what I need help with"/>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Symptoms to highlight <span style={s.optional}>(optional)</span></label>
              <textarea style={{ ...s.input, resize: "vertical" }} rows={2} value={reportPrompt.symptoms} onChange={e => setReportPrompt(p => ({ ...p, symptoms: e.target.value }))} placeholder="e.g. The exhaustion after small tasks, the unpredictability of flares"/>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Anything specific to include? <span style={s.optional}>(optional)</span></label>
              <textarea style={{ ...s.input, resize: "vertical" }} rows={2} value={reportPrompt.questions} onChange={e => setReportPrompt(p => ({ ...p, questions: e.target.value }))} placeholder="e.g. I'd like them to understand why I had to cancel plans last week"/>
            </div>
          </>
        )}
      </div>

      <div style={{ background: recipientIsCaregiver ? TEAL_LIGHT : SAGE_LIGHT, borderRadius: "0.875rem", padding: "0.875rem 1.1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <Icon name="info" size={16} color={recipientIsCaregiver ? TEAL : SAGE_DARK} style={{ flexShrink:0, marginTop:"0.1rem" }} />
        <p style={{ fontSize: "0.8rem", color: recipientIsCaregiver ? TEAL : SAGE_DARK, margin: 0, lineHeight: 1.6 }}>
          {recipientIsCaregiver
            ? <span>Your update will be written in <strong>plain language</strong> — warm, clear, and easy to understand. Based on {entries.length} entries across {new Set(entries.map(e => new Date(e.timestamp).toDateString())).size} days.</span>
            : <span>Your report will include <strong>metrics and charts</strong>, <strong>highlighted entries</strong> relevant to your visit, and <strong>tailored questions</strong> — based on {entries.length} entries across {new Set(entries.map(e => new Date(e.timestamp).toDateString())).size} days.</span>
          }
        </p>
      </div>

      <button onClick={handleGenerateReport} disabled={!canGenerate}
        style={{ ...s.addBtn, padding: "1rem 2rem", fontSize: "1rem", opacity: canGenerate ? 1 : 0.5, background: recipientIsCaregiver ? TEAL : SAGE_DARK }}>
        {recipientIsCaregiver ? "Generate Health Update →" : "Generate My Report →"}
      </button>
      {!canGenerate && (
        <p style={{ fontSize: "0.8rem", color: "#aaa", margin: "-1rem 0 0", textAlign: "center", fontStyle: "italic" }}>
          {recipientIsCaregiver
            ? "Select a caregiver to get started"
            : isOther && !reportPrompt.otherType
              ? "Select whether this person is a provider or caregiver"
              : "Select a specialty or enter a visit focus to get started"}
        </p>
      )}
    </div>
  );
}

export default function CareCompassTracker() {
  const { signOut } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => { try { return localStorage.getItem('cc-tracker-onboarded') === 'true'; } catch { return false; } });
  const [entries, setEntries]           = useState([]);
  const [view, setView]                 = useState("log");
  const [showForm, setShowForm]         = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [insights, setInsights]         = useState(null);
  const [apptContext, setApptContext]    = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  // ── Doctor report state ───────────────────────────────────────────────────
  const [reportMode, setReportMode]     = useState(() => { try { return localStorage.getItem("cc-report-mode") || "patient"; } catch { return "patient"; } }); // "patient" | "careteam"
  const [reportView, setReportView]     = useState("prompt"); // "prompt" | "generating" | "report"
  const [reportPrompt, setReportPrompt] = useState({ providerName: "", specialty: "", focus: "", symptoms: "", questions: "", saveToTeam: false, otherType: "", otherRole: "", showOther: false });
  const [reportAI, setReportAI]         = useState(null);
  // ── ER Report state ───────────────────────────────────────────────────────
  const [erView, setErView]             = useState("prompt"); // "prompt" | "generating" | "report"
  const [erPrompt, setErPrompt]         = useState({ chiefComplaint: "", severity: 8, duration: "", relevantHistory: "", allergies: "" });
  const [erAI, setErAI]                 = useState(null);
  const [saved, setSaved]               = useState(false);
  // ── Quick Log state ────────────────────────────────────────────────────────
  const [quickTracked, setQuickTracked]   = useState([]); // [{id, label, severity}]
  const [quickSymptoms, setQuickSymptoms] = useState("");
  const [quickSaved, setQuickSaved]       = useState(false);
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);
  const [logTipDismissed, setLogTipDismissed] = useState(() => !!localStorage.getItem("cc-log-tip-dismissed"));
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteLabId, setConfirmDeleteLabId] = useState(null);
  const [showMorningCheckin, setShowMorningCheckin] = useState(false);
  const [showEveningCheckin, setShowEveningCheckin] = useState(false);
  // SAGE_CHAT_DISABLED: Uncomment to re-enable Sage chat logging
  // const [showSageChat, setShowSageChat]           = useState(false);
  // const [sageChatMode, setSageChatMode]           = useState(null);
  const [morningForm, setMorningForm] = useState({ sleep: 7, severity: 5, symptoms: "", energy: 5, notes: "" });
  const [eveningForm, setEveningForm] = useState({ severity: 5, symptoms: "", food: "", medications: "", selectedMedIds: [], activity: "", stress: 5, notes: "", hoursUpright: null, tasksCompleted: [], energyEnvelope: null });
  const [checkinSaved, setCheckinSaved] = useState(""); // id of entry pending delete confirmation
  const [saveError, setSaveError]         = useState("");
  const [safetyAlert, setSafetyAlert]     = useState(null); // null | { triggers, bpCrisis }
  const [chartField, setChartField]     = useState("severity");
  const [dateFilter, setDateFilter]     = useState("all");
  const [showAdvFilter, setShowAdvFilter] = useState(false);
  const [advFilter, setAdvFilter] = useState({ symptomQuery: "", severity: null, tags: [] }); // severity: null = disabled, 1-10 = filter

  // ── Blood pressure state ──────────────────────────────────────────────────
  const [bpReadings, setBpReadings]       = useState([]);
  const [bpReminders, setBpReminders]     = useState([]);
  const [showBpForm, setShowBpForm]       = useState(false);
  const [bpView, setBpView]               = useState("log"); // log | history | report
  const [bpSaved, setBpSaved]             = useState(false);
  const blankBpForm = { systolic: "", diastolic: "", pulse: "", arm: "left", position: "sitting", notes: "" };
  const [bpForm, setBpForm]               = useState(blankBpForm);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderTime, setReminderTime]   = useState("08:00");
  const [reminderLabel, setReminderLabel] = useState("Morning reading");
  const [editingReminderId, setEditingReminderId] = useState(null);
  const [editTime, setEditTime]           = useState("08:00");
  const [editLabel, setEditLabel]         = useState("");

  const blankForm = { symptoms: "", severity: 5, food: "", medications: "", selectedMedIds: [], saveUnlistedMed: false, activity: "", sleep: null, stress: 5, weather: "", notes: "", photos: [], hoursUpright: null, tasksCompleted: [], energyEnvelope: null, trackedSymptoms: [] };
  const [form, setForm] = useState(blankForm);

  useEffect(() => { try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) setEntries(JSON.parse(stored)); } catch {} }, []);

  // Read appointment context from URL and auto-trigger insights or prefill report
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("insight") === "1") {
      try { localStorage.setItem("cc-tracker-onboarded", "true"); } catch {}
      setHasSeenOnboarding(true);
      setView("insights");
      const specialty = params.get("specialty") || "";
      const doctor = params.get("doctor") || "";
      const reason = params.get("reason") || "";
      const date = params.get("date") || "";
      if (specialty) setApptContext({ specialty, doctor, reason, date });
      window.history.replaceState({}, "", "/tracker");
    }
    if (params.get("report") === "1") {
      try { localStorage.setItem("cc-tracker-onboarded", "true"); } catch {}
      setHasSeenOnboarding(true);
      setView("report");
      setReportView("prompt");
      setReportPrompt(p => ({
        ...p,
        providerName: params.get("doctor") || "",
        specialty: params.get("specialty") || "",
        focus: params.get("reason") || "",
      }));
      window.history.replaceState({}, "", "/tracker");
    }
  }, []);
  useEffect(() => { try { const stored = localStorage.getItem(BP_STORAGE_KEY); if (stored) setBpReadings(JSON.parse(stored)); } catch {} }, []);
  useEffect(() => { try { const stored = localStorage.getItem(BP_REMINDERS_KEY); if (stored) setBpReminders(JSON.parse(stored)); } catch {} }, []);

  const saveEntries = (updated) => {
    setEntries(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSaveError("");
    } catch (e) {
      if (e.name === "QuotaExceededError" || e.code === 22) {
        // Storage full — likely caused by photos. Try saving without photos as fallback.
        try {
          const stripped = updated.map(entry => ({ ...entry, photos: [] }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
          setSaveError("Storage limit reached — photos were not saved to keep your entries. Consider reducing photo size or clearing old entries.");
        } catch {
          setSaveError("⚠️ Could not save your entry — device storage is full. Please free up space and try again.");
        }
      }
    }
  };
  const saveBpReadings = (updated) => { setBpReadings(updated); try { localStorage.setItem(BP_STORAGE_KEY, JSON.stringify(updated)); } catch {} };
  const saveBpReminders = (updated) => { setBpReminders(updated); try { localStorage.setItem(BP_REMINDERS_KEY, JSON.stringify(updated)); } catch {} };

  const handleBpSubmit = () => {
    if (!bpForm.systolic || !bpForm.diastolic) return;
    const reading = { ...bpForm, id: Date.now(), timestamp: new Date().toISOString(),
      systolic: Number(bpForm.systolic), diastolic: Number(bpForm.diastolic),
      pulse: bpForm.pulse ? Number(bpForm.pulse) : null };
    saveBpReadings([reading, ...bpReadings]);
    setBpForm(blankBpForm); setShowBpForm(false);
    setBpSaved(true); setTimeout(() => setBpSaved(false), 3000);

    // Safety alert check
    if (checkEmergencyBP(bpForm.systolic, bpForm.diastolic)) {
      logSafetyAlertShown({ source: "bp", systolic: bpForm.systolic, diastolic: bpForm.diastolic });
      setSafetyAlert({ triggers: [], bpCrisis: true });
    }
  };

  const handleBpDelete = (id) => saveBpReadings(bpReadings.filter(r => r.id !== id));

  const handleAddReminder = async () => {
    if (!reminderTime) return;
    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    const reminder = { id: Date.now(), time: reminderTime, label: reminderLabel, enabled: true };
    saveBpReminders([...bpReminders, reminder]);
    setShowReminderForm(false); setReminderTime("08:00"); setReminderLabel("Morning reading");
  };

  const toggleReminder = (id) => {
    saveBpReminders(bpReminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteReminder = (id) => saveBpReminders(bpReminders.filter(r => r.id !== id));
  const startEditReminder = (r) => { setEditingReminderId(r.id); setEditTime(r.time); setEditLabel(r.label || ""); };
  const saveEditReminder = () => {
    saveBpReminders(bpReminders.map(r => r.id === editingReminderId ? { ...r, time: editTime, label: editLabel } : r));
    setEditingReminderId(null);
  };

  const handleBpPrint = () => {
    const style = document.createElement("style");
    style.innerHTML = `@media print { .no-print { display: none !important; } @page { margin: 1.5cm; } }`;
    document.head.appendChild(style); window.print(); setTimeout(() => document.head.removeChild(style), 1000);
  };

  const bpAvgRecent = () => {
    const recent = bpReadings.slice(0, 10);
    if (!recent.length) return null;
    return {
      systolic: Math.round(recent.reduce((s, r) => s + r.systolic, 0) / recent.length),
      diastolic: Math.round(recent.reduce((s, r) => s + r.diastolic, 0) / recent.length),
    };
  };

  const dismissOnboarding = () => {
    try { localStorage.setItem("cc-tracker-onboarded", "true"); } catch {}
    setHasSeenOnboarding(true);
  };

  const isFirstEntryToday = !entries.some(e => new Date(e.timestamp).toDateString() === new Date().toDateString());

  const openNew = () => {
    // SAGE_CHAT_DISABLED: Previously opened Sage chat — now opens form directly
    // To re-enable: setSageChatMode(mode); setShowSageChat(true);
    openNewForm();
  };

  // Auto-open Sage if navigated here from dashboard "Tell Sage instead"
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const url = new URL(window.location.href);

      if (params.get("sage") === "1") {
        // SAGE_CHAT_DISABLED: Previously opened Sage chat — now opens form directly
        openNewForm();
        url.searchParams.delete("sage");
        window.history.replaceState({}, "", url.toString());
      }

      if (params.get("form") === "1") {
        // Pick up any quick log selections carried from the dashboard
        const prefill = (() => {
          try { return JSON.parse(sessionStorage.getItem("cc-dash-quicklog") || "null"); } catch { return null; }
        })();
        sessionStorage.removeItem("cc-dash-quicklog");
        const last = entries[0] || null;
        setEditingEntry(null);
        setForm({
          ...blankForm,
          sleep:           isFirstEntryToday ? 7 : null,
          selectedMedIds:  last?.selectedMedIds?.length ? last.selectedMedIds : [],
          weather:         last?.weather ?? "",
          trackedSymptoms: prefill ? [...prefill] : [],
        });
        setShowAllSymptoms(false);
        setShowSageChat(false);
        setShowForm(true);
        url.searchParams.delete("form");
        window.history.replaceState({}, "", url.toString());
      }
    } catch {}
  }, []);

  const openNewForm = () => {
    setEditingEntry(null);
    const last = entries[0] || null;
    const defaultMedIds  = last?.selectedMedIds?.length ? last.selectedMedIds : [];
    const defaultWeather = last?.weather ?? "";
    setForm({
      ...blankForm,
      sleep:          isFirstEntryToday ? 7 : null,
      selectedMedIds: defaultMedIds,
      weather:        defaultWeather,
    });
    setShowAllSymptoms(false);
    setShowSageChat(false);
    setShowForm(true);
  };
  const openEdit = (entry) => {
    setEditingEntry(entry);
    setForm({
      ...blankForm,
      ...entry,
      symptoms:       entry.symptoms       ?? "",
      food:           entry.food           ?? "",
      medications:    entry.medications    ?? "",
      activity:       entry.activity       ?? "",
      notes:          entry.notes          ?? "",
      weather:        entry.weather        ?? "",
      severity:       entry.severity       ?? 5,
      stress:         entry.stress         ?? 5,
      sleep:          entry.sleep          ?? null,
      photos:          entry.photos          || [],
      selectedMedIds:  entry.selectedMedIds  || [],
      saveUnlistedMed: false,
      hoursUpright:    entry.hoursUpright    ?? null,
      tasksCompleted:  entry.tasksCompleted  || [],
      energyEnvelope:  entry.energyEnvelope  ?? null,
      trackedSymptoms: entry.trackedSymptoms || [],
    });
    setShowForm(true);
  };

  const buildPreviousContext = () => {
    const todayEntries = entries.filter(e =>
      new Date(e.timestamp).toDateString() === new Date().toDateString()
    );
    if (!todayEntries.length) return null;
    return todayEntries.map(e => {
      const time = new Date(e.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const syms = e.trackedSymptoms?.length
        ? e.trackedSymptoms.map(ts => `${ts.label} (${ts.severity}/10)`).join(", ")
        : e.symptoms || "no symptoms noted";
      return `${time}: severity ${e.severity}/10, ${syms}${e.notes ? `, notes: ${e.notes}` : ""}`;
    }).join("; ");
  };

  const handleSageLogSave = (entryData, mode) => {
    const tag = mode === "morning" ? "Morning check-in" : mode === "evening" ? "Evening check-in" : undefined;
    const finalEntry = {
      ...blankForm,
      ...entryData,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      source: "sage_chat",
      ...(tag ? { tag } : {}),
    };
    saveEntries([finalEntry, ...entries]);

    // Register morning/evening checkins so the banner knows they're done
    if (mode === "morning" || mode === "evening") {
      saveCheckin(mode, entryData);
    }

    setShowSageChat(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    const combinedText = [finalEntry.symptoms, finalEntry.notes, finalEntry.activity].filter(Boolean).join(" ");
    const triggers = checkEmergencySymptoms(combinedText);
    if (triggers.length) {
      logSafetyAlertShown({ source: "sage_chat", triggers });
      setSafetyAlert({ triggers, bpCrisis: false });
    }
  };

  const handleSageToForm = (prefillData) => {
    const last = entries[0] || null;
    setForm({
      ...blankForm,
      sleep: isFirstEntryToday ? 7 : null,
      selectedMedIds: last?.selectedMedIds?.length ? last.selectedMedIds : [],
      weather: last?.weather ?? "",
      ...(prefillData || {}),
    });
    setShowSageChat(false);
    setShowAllSymptoms(false);
    setShowForm(true);
  };

  const handleQuickLog = () => {
    if (!quickTracked.length) return;
    const autoSev = Math.max(...quickTracked.map(ts => ts.severity));
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      severity: autoSev,
      trackedSymptoms: quickTracked,
      symptoms: quickSymptoms.trim(),
      source: "quick",
      food: "", medications: "", selectedMedIds: [], activity: "",
      sleep: null, stress: 5, weather: "", notes: "", photos: [],
      hoursUpright: null, tasksCompleted: [], energyEnvelope: null,
    };
    saveEntries([entry, ...entries]);
    setQuickTracked([]);
    setQuickSymptoms("");
    setQuickSaved(true);
    setShowQuickNote(false);
    setTimeout(() => setQuickSaved(false), 4000);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) { alert("Please choose a photo under 2MB."); return; }
      const reader = new FileReader();
      reader.onload = evt => {
        setForm(f => ({
          ...f,
          photos: [...(f.photos || []), { data: evt.target.result, name: file.name, type: file.type }].slice(0, 3)
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (idx) => setForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));

  const handleSubmit = () => {
    // Merge selected med ids into medications string
    const selectedMedsStr = buildMedString(form.selectedMedIds || []);
    const finalMeds = [selectedMedsStr, form.medications].filter(Boolean).join(", ");

    // Auto-derive overall severity from tracked symptoms (max) if any are active
    const tracked = form.trackedSymptoms || [];
    const autoSeverity = tracked.length > 0
      ? Math.max(...tracked.map(ts => ts.severity))
      : form.severity;

    const finalForm = { ...form, medications: finalMeds, severity: autoSeverity };

    // Save unlisted med to settings list if opted in
    if (form.saveUnlistedMed && (form.medications || "").trim()) {
      try {
        const existing = JSON.parse(localStorage.getItem(MED_STORAGE_KEY) || "[]");
        // Split on comma in case multiple unlisted were entered
        const newNames = form.medications.split(",").map(n => n.trim()).filter(Boolean);
        newNames.forEach(name => {
          const alreadyExists = existing.some(m => m.name.toLowerCase() === name.toLowerCase());
          if (!alreadyExists) {
            existing.push({ id: Date.now() + Math.random(), name, dose: "", frequency: "", duration: "", notes: "", reminder: false, reminderTime: "08:00" });
          }
        });
        localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(existing));
        setMedications(existing);
      } catch {}
    }

    if (editingEntry) {
      saveEntries(entries.map(e => e.id === editingEntry.id ? { ...finalForm, id: editingEntry.id, timestamp: editingEntry.timestamp } : e));
    } else {
      saveEntries([{ ...finalForm, id: Date.now(), timestamp: new Date().toISOString() }, ...entries]);
    }
    setShowForm(false); setEditingEntry(null); setForm(blankForm);
    setSaved(true); setTimeout(() => setSaved(false), 3000);

    // Safety alert check
    const combinedText = [finalForm.symptoms, finalForm.notes, finalForm.activity].filter(Boolean).join(" ");
    const triggers = checkEmergencySymptoms(combinedText);
    if (triggers.length) {
      logSafetyAlertShown({ source: "entry", triggers });
      setSafetyAlert({ triggers, bpCrisis: false });
    }
  };

  const handleDelete = (id) => setConfirmDeleteId(id);
  const confirmDelete = () => { saveEntries(entries.filter(e => e.id !== confirmDeleteId)); setConfirmDeleteId(null); };

  const uniqueDaysLogged = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;

  const careTeam = (() => {
    try {
      const s = localStorage.getItem("cc-care-team");
      if (!s) return [];
      const members = JSON.parse(s);
      // Back-fill any entries saved before type was tracked — default to "provider"
      const migrated = members.map(p => p.type ? p : { ...p, type: "provider" });
      // Persist the migration silently if anything changed
      if (migrated.some((p, i) => p.type !== members[i]?.type)) {
        localStorage.setItem("cc-care-team", JSON.stringify(migrated));
      }
      return migrated;
    } catch { return []; }
  })();
  const careTeamStr = careTeam.filter(p => p.name).map(p => {
    const role = p.type === "caregiver" ? (p.careRole || "Caregiver") : (p.specialty || "");
    return `${p.name}${role ? " (" + role + ")" : ""}`;
  }).join(", ");

  // Read family history from settings
  const familyHistory = (() => {
    try { const s = localStorage.getItem("cc-family-history"); return s ? JSON.parse(s) : []; } catch { return []; }
  })();
  const familyHistoryStr = familyHistory.filter(e => e.member && e.conditions.length > 0).map(e => {
    const MEMBERS = { mother:"Mother", father:"Father", maternal_grandmother:"Maternal grandmother", maternal_grandfather:"Maternal grandfather", paternal_grandmother:"Paternal grandmother", paternal_grandfather:"Paternal grandfather", sister:"Sister", brother:"Brother", maternal_aunt:"Maternal aunt", maternal_uncle:"Maternal uncle", paternal_aunt:"Paternal aunt", paternal_uncle:"Paternal uncle", daughter:"Daughter", son:"Son" };
    return `${MEMBERS[e.member] || e.member}: ${e.conditions.join(", ")}${e.notes ? " (" + e.notes + ")" : ""}`;
  }).join("\n");

  // Read cycle data for AI context
  const cycleData = (() => { try { return JSON.parse(localStorage.getItem(CYCLE_KEY) || "[]"); } catch { return []; } })();
  const cycleStr = cycleData.length > 0 ? cycleData.slice(0, 6).map(c => {
    const start = c.startDate;
    const end = c.endDate ? ` to ${c.endDate}` : "";
    const flow = c.flow ? ` | Flow: ${c.flow}` : "";
    const pain = c.pain ? ` | Pain: ${c.pain}/10` : "";
    const syms = c.symptoms?.length ? ` | Symptoms: ${c.symptoms.join(", ")}` : "";
    const notes = c.notes ? ` | Notes: ${c.notes}` : "";
    return `Period: ${start}${end}${flow}${pain}${syms}${notes}`;
  }).join("\n") : null;


  // ── Shared patient context builder — used by ALL AI features ────────────────
  // Returns a structured string block containing every data source the AI should
  // be aware of. Pass `options` to control which sections to include.
  const buildPatientContext = ({
    includeBP       = true,
    includeCycle    = true,
    includeMeds     = true,
    includeFamily   = true,
    includeLabs     = true,
    includeGoals    = true,
    includeProfile  = true,
    bpLimit         = 20,
    labLimit        = 6,
  } = {}) => {
    const lines = [];

    // Profile / diagnoses
    if (includeProfile) {
      try {
        const profile = JSON.parse(localStorage.getItem("cc-profile") || "{}");
        const conditions = (profile.conditions || []).join(", ");
        const age        = profile.ageRange || profile.age || "";
        const pronouns   = profile.pronouns || "";
        if (conditions) lines.push(`CONFIRMED / SUSPECTED DIAGNOSES: ${conditions}`);
        if (age)        lines.push(`AGE RANGE: ${age}`);
        if (pronouns)   lines.push(`PRONOUNS: ${pronouns}`);
      } catch {}
    }

    // Medications (full list with dose + frequency, not just duration context)
    if (includeMeds && medications.length) {
      const DURATION_LABELS = {
        less_than_1_month: "< 1 month", "1_3_months": "1–3 months", "3_6_months": "3–6 months",
        "6_12_months": "6–12 months", "1_2_years": "1–2 years", "2_5_years": "2–5 years",
        "5_10_years": "5–10 years", "10_plus_years": "10+ years", "lifelong": "lifelong/since childhood",
      };
      const medLines = medications.filter(m => m.name).map(m =>
        `  - ${m.name}${m.dose ? " " + m.dose : ""}${m.frequency ? " (" + m.frequency + ")" : ""}${m.duration ? " — taking for " + (DURATION_LABELS[m.duration] || m.duration) : ""}${m.notes ? " | " + m.notes : ""}`
      );
      if (medLines.length) lines.push(`CURRENT MEDICATIONS:\n${medLines.join("\n")}`);
    }

    // Family history
    if (includeFamily && familyHistoryStr) {
      lines.push(`FAMILY HISTORY:\n${familyHistoryStr}`);
    }

    // Blood pressure readings
    if (includeBP && bpReadings.length) {
      const bpLines = bpReadings.slice(0, bpLimit).map(r =>
        `  ${formatBPTime(r.timestamp)}: ${r.systolic}/${r.diastolic} mmHg${r.pulse ? " | Pulse: " + r.pulse + " bpm" : ""}${r.position ? " | Position: " + r.position : ""}${r.notes ? " | " + r.notes : ""} — ${bpCategory(r.systolic, r.diastolic).label}`
      );
      lines.push(`BLOOD PRESSURE READINGS (most recent first, up to ${bpLimit}):\n${bpLines.join("\n")}`);
    }

    // Cycle data
    if (includeCycle && cycleStr) {
      lines.push(`MENSTRUAL CYCLE DATA (recent):\n${cycleStr}`);
    }

    // Lab results (summaries — name, date, ordered-by, and AI-generated analysis if available)
    if (includeLabs) {
      try {
        const labs = JSON.parse(localStorage.getItem("care-compass-labs-v1") || "[]");
        const labsWithAnalysis = labs.filter(l => l.name && l.analysis).slice(0, labLimit);
        if (labsWithAnalysis.length) {
          const labLines = labsWithAnalysis.map(l => {
            const dateStr = l.testDate ? ` (${l.testDate})` : "";
            const ordStr  = l.orderedBy ? ` — ordered by ${l.orderedBy}` : "";
            // Trim analysis to first 400 chars to keep prompt lean
            const summary = l.analysis ? "\n    " + l.analysis.slice(0, 400).replace(/\n/g, "\n    ") + (l.analysis.length > 400 ? "…" : "") : "";
            return `  - ${l.name}${dateStr}${ordStr}:${summary}`;
          });
          lines.push(`LAB RESULTS (AI-analyzed summaries, most recent ${labsWithAnalysis.length}):\n${labLines.join("\n")}`);
        }
      } catch {}
    }

    // Health goals
    if (includeGoals) {
      try {
        const goals = loadGoals();
        if (goals.length) {
          const goalLines = goals.map(g => `  - ${g.title}${g.notes ? " (" + g.notes + ")" : ""}`);
          lines.push(`PATIENT HEALTH GOALS:\n${goalLines.join("\n")}`);
        }
      } catch {}
    }

    // Care team
    if (careTeamStr) {
      lines.push(`CARE TEAM: ${careTeamStr}`);
    }

    return lines.join("\n\n");
  };

  const handleInsights = async (extraContext) => {
    if (uniqueDaysLogged < 3) return;
    setLoadingInsights(true); setInsights(null);
    try {
      // Group entries by day to show full daily picture, preserving time-of-day context
      const entriesByDay = entries.slice(0, 60).reduce((acc, e) => {
        const day = new Date(e.timestamp).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        if (!acc[day]) acc[day] = [];
        acc[day].push(e);
        return acc;
      }, {});

      const summary = Object.entries(entriesByDay).slice(0, 14).map(([day, dayEntries]) => {
        const sorted = [...dayEntries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const allMeds = [...new Set(sorted.flatMap(e => e.medications ? [e.medications] : []))].join(", ");
        const allFood = [...new Set(sorted.flatMap(e => e.food ? [e.food] : []))].join(", ");
        const allActivity = [...new Set(sorted.flatMap(e => e.activity ? [e.activity] : []))].join(", ");
        const sleep = sorted.find(e => e.sleep != null);
        const timeEntries = sorted.map(e =>
          `  ${new Date(e.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}: Severity ${e.severity}/10${e.symptoms ? ` — ${e.symptoms}` : ""}${e.stress ? ` | Stress: ${e.stress}/10` : ""}${e.notes ? ` | Notes: ${e.notes}` : ""}`
        ).join("\n");
        return `${day}:${sleep ? ` Sleep: ${sleep.sleep}/10` : ""}${allMeds ? ` | Medications: ${allMeds}` : ""}${allFood ? ` | Food: ${allFood}` : ""}${allActivity ? ` | Activity/Function: ${allActivity}` : ""}\n${timeEntries}`;
      }).join("\n\n");

      const styleEl = document.createElement("style");
      styleEl.id = "insights-loading-styles";
      styleEl.innerHTML = INSIGHTS_LOADING_STYLES;
      document.head.appendChild(styleEl);

      const apptPromptContext = apptContext ? `

APPOINTMENT CONTEXT: This report is being generated to prepare for an upcoming ${apptContext.specialty} appointment${apptContext.doctor ? ` with ${apptContext.doctor}` : ""}${apptContext.date ? ` on ${new Date(apptContext.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}${apptContext.reason ? `. Reason for visit: ${apptContext.reason}` : ""}.

Please tailor your analysis specifically for a ${apptContext.specialty} visit. Focus on symptoms, patterns, and findings most relevant to ${apptContext.specialty} conditions. Prioritize insights the ${apptContext.specialty} would find most actionable. Add a ## Questions to Raise with Your ${apptContext.specialty} section at the end with specific, targeted questions based on the data.` : "";

      const extraContextBlock = extraContext ? `

ADDITIONAL CONTEXT PROVIDED BY USER (incorporate this into your analysis — treat it as important supplementary history that was not captured in the tracker entries above):
${extraContext}` : "";

      const patientContext = buildPatientContext();

      const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 3500, messages: [{ role: "user", content: `You are Care Compass, a compassionate health navigation assistant. Analyze these symptom tracker entries and identify patterns, triggers, and insights to discuss with a doctor.

CORE PHILOSOPHY — WEIGHT SYMPTOMS OVER LABELS:
Your analysis must be grounded primarily in what the user actually logs — their symptoms, timing, triggers, and patterns across days. Existing diagnoses and family history are context, not conclusions. Complex conditions are frequently misdiagnosed or incompletely diagnosed. A symptom pattern that doesn't fully align with a listed diagnosis is a signal worth noting, not ignoring. Let the data speak first, then layer in context.

WEIGHTING HIERARCHY:
1. HIGHEST — Logged symptoms and how they pattern across time, time-of-day, and days of the week
2. HIGH — Correlations with food, medications, activity, sleep, stress
3. MODERATE — Family history (genetic context) and lab results (objective data points)
4. LOWER — Existing diagnoses (treat as one possible explanation; flag if symptoms suggest something additional or misaligned)
5. LOWEST — Long-standing medications (unlikely to cause new symptoms unless recently changed)

MEDICATION INTERACTION ANALYSIS — always perform this regardless of symptom data:
Scan all medications in the patient context and assess: (1) known interactions between any two or more listed medications, (2) logged symptoms that are known side effects of a listed medication, (3) medications that may reduce the efficacy of another listed medication, (4) medications that appear misaligned with listed conditions. Flag anything notable in the ## Medication Notes section. Use cautious language — never advise stopping or changing anything. If no medications are listed or no concerns found, note that briefly.

PATIENT CONTEXT (use all sections below to inform your analysis — cross-reference with symptom entries for correlations):
${patientContext}

MEDICATION DURATION NOTE: A long-standing medication is less likely to be causing a NEW symptom than a recently started one. Use the "taking for" duration in the medications list when assessing causality.

LAB RESULTS NOTE: If lab results are provided above, cross-reference abnormal findings with symptom patterns. Note if logged symptoms align with what those results might indicate.

IMPORTANT CONTEXT: Users log entries MULTIPLE TIMES per day. Each day shows all entries chronologically with timestamps. Medications, food, and activity listed for a day represent the COMBINED picture across all that day's entries — not that each item was logged at every entry. Do NOT interpret partial fields in individual entries as missed doses or incomplete information. Look for TIME-BASED CORRELATIONS within days — e.g. a medication logged in the morning followed by symptom changes hours later, or food logged before a symptom spike.

ENTRIES (grouped by day, chronological within each day):
${summary}

FUNCTIONAL IMPACT INSTRUCTIONS — CRITICAL:
Scan every entry's activity field and symptom descriptions for mentions of activities that were difficult, modified, avoided, or impossible due to symptoms. These include (but are not limited to): driving, cooking, showering, getting dressed, blow-drying hair, laundry, grocery shopping, walking, climbing stairs, lifting, writing, typing, phone use, working, attending appointments, caring for children/pets, exercise, socialising, sleeping in a bed vs couch, and any other daily task. 

When you find these, compile them into a dedicated ## Daily Life Impact section. This section is one of the most important things a doctor can see — it translates abstract severity scores into real-world consequences. Be specific: quote or closely paraphrase what the user wrote. Group by activity type if multiple entries mention the same task.

IMPORTANT: Complete every section — never skip any. Keep each section tight: 3–5 bullets, 1–2 sentences each. Lead with the insight directly — avoid preamble or restating what the user logged. If a section has little to say, keep it to one brief sentence. Always end with a full "Questions to Bring to Your Doctor" section. The goal is a focused, scannable report a person can read in under 5 minutes.

Please provide a warm, specific analysis:
## Patterns We Notice
## Daily Life Impact
## Time-Based Correlations Worth Exploring
## Potential Triggers
## Medication Notes
Review the medications in the patient context. Flag any: (1) potential interactions between listed medications, (2) logged symptoms that may be known side effects of a listed medication, (3) medications that may be reducing the efficacy of another, (4) medications that seem misaligned with listed conditions. Use cautious language — "worth discussing with your prescriber", "some people experience...", "it may be worth asking...". If no medications are listed or no concerns are apparent, note that briefly. Never advise stopping or changing anything.
## What's Improving vs Worsening
## Questions to Bring to Your Doctor

Never diagnose. Focus on patterns across days AND within-day timing. Be specific about which days or time patterns seem significant. If logged symptoms don't fully align with any existing diagnosis the user may have mentioned, gently note what the pattern does suggest and encourage them to explore it with their doctor. Many chronic illness patients carry incomplete or incorrect diagnoses — validating their lived experience is as important as pattern recognition.` + apptPromptContext + extraContextBlock + (bpReadings.length > 0 ? `

Please also include a ## Blood Pressure Patterns section analyzing the BP readings provided in the patient context above. Note correlations between BP readings and symptoms (e.g. high BP days correlating with headaches, stress, poor sleep, or specific activities).` : "") + (cycleStr ? `

Please also include a ## Cycle & Symptom Patterns section. Cross-reference the cycle dates in the patient context with symptom entries. Look for symptom flares around period start, ovulation window, or premenstrual phase. This is especially important for conditions like endometriosis, PCOS, PMDD, fibromyalgia, and autoimmune conditions.` : "") }] }) });
      const data = await response.json();
      setInsights(data.content[0].text); setView("insights");
    } catch { setInsights("Something went wrong. Please try again."); }
    finally {
      setLoadingInsights(false);
      const styleEl = document.getElementById("insights-loading-styles");
      if (styleEl) styleEl.remove();
    }
  };

  const handlePrint = () => { const style = document.createElement("style"); style.innerHTML = `@media print { .no-print { display: none !important; } @page { margin: 1.5cm; } }`; document.head.appendChild(style); window.print(); setTimeout(() => document.head.removeChild(style), 1000); };

  const handleGenerateReport = async (extraContext) => {
    if (!entries.length) return;
    setReportView("generating");
    setReportAI(null);
    // Save new provider to care team if requested
    const { providerName, specialty, saveToTeam } = reportPrompt;
    if (saveToTeam && providerName.trim() && !careTeam.find(p => p.name.toLowerCase() === providerName.trim().toLowerCase())) {
      try {
        const existing = JSON.parse(localStorage.getItem("cc-care-team") || "[]");
        const saveIsCaregiver = reportPrompt.otherType === "caregiver";
        existing.push({
          id: Date.now(),
          name: providerName.trim(),
          type: saveIsCaregiver ? "caregiver" : "provider",
          specialty: saveIsCaregiver ? "" : (specialty || ""),
          careRole: saveIsCaregiver ? (reportPrompt.otherRole || "") : "",
        });
        localStorage.setItem("cc-care-team", JSON.stringify(existing));
      } catch {}
    }

    // Detect if recipient is a caregiver (non-clinical)
    const recipientEntry = careTeam.find(p => p.name === providerName);
    const isCaregiver = recipientEntry ? recipientEntry.type === "caregiver" : reportPrompt.otherType === "caregiver";
    const caregiverRole = recipientEntry?.careRole || reportPrompt.otherRole || "Caregiver";

    const since = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const workingEntries = entries.filter(e => e.timestamp >= since).length >= 5
      ? entries.filter(e => e.timestamp >= since) : entries;
    const grouped = {};
    [...workingEntries].sort((a, b) => a.timestamp - b.timestamp).forEach(e => {
      const day = new Date(e.timestamp).toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(e);
    });
    const summary = Object.entries(grouped).map(([day, dayEntries]) => {
      const sorted = [...dayEntries].sort((a, b) => a.timestamp - b.timestamp);
      const allMeds = [...new Set(sorted.flatMap(e => e.medications ? [e.medications] : []))].join(", ");
      const allFood = [...new Set(sorted.flatMap(e => e.food ? [e.food] : []))].join(", ");
      const sleepEntry = sorted.find(e => e.sleep != null);
      const dayHeader = `${day}:${sleepEntry ? ` Sleep: ${sleepEntry.sleep}/10` : ""}${allMeds ? ` | Medications: ${allMeds}` : ""}${allFood ? ` | Food: ${allFood}` : ""}`;
      const entryLines = sorted.map(e => {
        const tracked = (e.trackedSymptoms || []).map(ts => `${ts.label} ${ts.severity}/10`).join(", ");
        const symPart = tracked
          ? ` — Tracked: ${tracked}${e.symptoms ? ` | Notes: ${e.symptoms}` : ""}`
          : e.symptoms ? ` — ${e.symptoms}` : "";
        return `  ${new Date(e.timestamp).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}: Severity ${e.severity}/10${symPart}${e.stress?` | Stress: ${e.stress}/10`:""}${e.activity?` | Activity: ${e.activity}`:""}${e.notes?` | Notes: ${e.notes}`:""}`;
      }).join("\n");
      return `${dayHeader}\n${entryLines}`;
    }).join("\n\n");
    const patientContext = buildPatientContext();
    const { focus, symptoms: highlightSymptoms, questions } = reportPrompt;
    const prompt = isCaregiver
      ? `You are Care Compass, a compassionate health navigation assistant. Generate a clear health update report for a caregiver or support person — someone who helps care for the patient but is not a medical provider. Use plain, warm language — no clinical jargon. Focus on practical day-to-day picture.

RECIPIENT: ${providerName} (${caregiverRole})
UPDATE FOCUS: ${focus || "General health update"}
${highlightSymptoms ? `- Symptoms to highlight: ${highlightSymptoms}` : ""}
${questions ? `- Notes for recipient: ${questions}` : ""}

PATIENT CONTEXT:
${patientContext}

TRACKER DATA (last 60 days):
${summary}

Write a warm, clear update using exactly these section headers (##):

## How I've Been Feeling
2-3 sentences summarising the overall picture in plain language.

## Day-to-Day Patterns
What daily life has looked like — good days vs harder days, energy, sleep, symptoms that come and go.

## What's Been Most Difficult
The symptoms or limitations that have had the biggest impact. Be honest and specific.

## What's Helping
Any patterns around what makes things better — rest, medication timing, food, activity, etc.

## How You Can Help
2-4 specific, practical ways this person can support the patient based on the data.

## What I'd Like You to Know
A short personal note — things the patient wants their caregiver to understand about their experience.

Never diagnose. Write as if the patient is speaking to someone who loves and supports them.${extraContext ? `\n\nADDITIONAL CONTEXT: ${extraContext}` : ""}`
      : `You are Care Compass, a compassionate health navigation assistant helping a patient prepare for a medical appointment. Generate a focused, appointment-ready report.

APPOINTMENT DETAILS:
- Provider: ${providerName || "their doctor"}
- Specialty: ${specialty || "General"}
- Visit focus: ${focus || "General symptom review"}
${highlightSymptoms ? `- Symptoms to highlight: ${highlightSymptoms}` : ""}
${questions ? `- Patient's questions: ${questions}` : ""}

PATIENT CONTEXT (use ALL sections below when building the report — cross-reference lab results, BP trends, medications, and family history with the symptom data):
${patientContext}

TRACKER DATA (last 60 days — includes symptoms, food, sleep, stress, activity, medications taken):
${summary}

Write a warm, specific, appointment-focused report using exactly these section headers (##):

## Visit Summary
2-3 sentences on the overall picture and visit focus.

## Key Patterns for This Visit
Patterns most relevant to ${specialty || "this appointment"} and the focus. Be specific — reference dates and trends. If blood pressure readings are in the patient context and this is a cardiology/primary care/internal medicine visit, summarize BP trends here.

## Highlighted Symptom Entries
Pull 4-6 most relevant entries from the log. Note date, severity, and quote the patient's words.

## Relevant Lab Results & Vitals
If lab results or blood pressure readings are in the patient context, summarize the findings most relevant to this visit. Note any abnormal values and how they correlate with logged symptoms. If no labs are available, omit this section.

## Medication Notes
Review the medications in the patient context. Flag any potential interactions, symptoms that may be side effects of a listed medication, medications that may reduce the efficacy of another, or medications that seem worth revisiting given the symptom picture and the specialty of this visit. Use cautious language — "worth discussing at this visit", "some patients find...". If no concerns are apparent, note that briefly. Never advise stopping or changing anything.

## Daily Life Impact
How symptoms affect real-world functioning — driving, work, sleep, physical tasks. Be specific.

## What's Improving vs What's Worsening
Honest assessment of trends. Note if patterns are unclear.

## Questions to Raise at This Visit
5-7 specific, targeted questions for ${providerName || "their " + (specialty || "doctor")} grounded in the data. If lab results or BP trends are present, include questions about those findings.

## Suggested Next Steps
2-3 concrete things to discuss or request (tests, referrals, adjustments).

Never diagnose. Use language like "worth discussing", "the data suggests".${extraContext ? `

ADDITIONAL CONTEXT FROM USER (incorporate this — it was shared after the original report was generated and contains important supplementary information):
${extraContext}` : ""}`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2500, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      setReportAI(data.content?.[0]?.text || "Unable to generate report. Please try again.");
    } catch { setReportAI("Something went wrong. Please try again."); }
    setReportView("report");
  };

  const handleGenerateER = async (extraContext) => {
    if (!entries.length && !erPrompt.chiefComplaint.trim()) return;
    setErView("generating");
    setErAI(null);

    const allergiesFromPrompt = erPrompt.allergies.trim();
    const patientContext = buildPatientContext({ bpLimit: 10 });

    // Recent entries — last 14 days for acute context, with full fields
    const since14 = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const recentEntries = [...entries].filter(e => e.timestamp >= since14).sort((a,b) => b.timestamp - a.timestamp);
    const entrySummary = recentEntries.slice(0, 30).map(e =>
      `${new Date(e.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric"})} ${new Date(e.timestamp).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}: Severity ${e.severity}/10${e.symptoms?` — ${e.symptoms}`:""}${e.stress?` | Stress: ${e.stress}/10`:""}${e.food?` | Food: ${e.food}`:""}${e.medications?` | Medications taken: ${e.medications}`:""}${e.activity?` | Functional impact: ${e.activity}`:""}${e.notes?` | ${e.notes}`:""}`
    ).join("\n");

    const prompt = `You are helping a patient with chronic and complex illness prepare a clear, professional emergency room handoff document. This document needs to communicate quickly and authoritatively to ER staff who are unfamiliar with this patient's history.

CRITICAL CONTEXT: ER staff are trained in acute care, not complex chronic illness management. Many chronic illness patients are dismissed, undertreated, or sent home without answers because their complexity is not immediately visible. This document should be structured, scannable, and credible — formatted to be taken seriously. It should communicate the urgency of TODAY'S visit while also giving enough medical context that staff understand who this patient is.

TODAY'S VISIT:
- Chief complaint: ${erPrompt.chiefComplaint || "See symptom history"}
- Current severity: ${erPrompt.severity}/10
- Duration of current symptoms: ${erPrompt.duration || "See symptom history"}
${erPrompt.relevantHistory ? `- Additional context the patient wants to highlight: ${erPrompt.relevantHistory}` : ""}
${allergiesFromPrompt ? `- Known allergies (patient-reported): ${allergiesFromPrompt}` : ""}

PATIENT MEDICAL CONTEXT:
${patientContext}

RECENT SYMPTOM TRACKING (last 14 days):
${entrySummary || "No recent entries logged"}

Generate a structured ER handoff document using exactly these section headers (##). Keep each section tight and scannable — ER staff need to absorb this quickly. Use clinical-adjacent language (clear, not jargon-heavy). Be direct and factual.

## Patient Overview
2-3 sentences: who this patient is, their primary conditions, and why they are here today. Write this as if briefing a physician cold.

## Chief Complaint & Current Symptoms
What is happening right now, how severe, how long, and what makes it better or worse. Include functional impact — what they cannot do because of this.

## Relevant Symptom Pattern (Last 14 Days)
Key patterns from their tracking data that are relevant to today's visit. Highlight any escalation, high-severity days, or notable triggers. Be specific with dates where relevant.

## Confirmed Diagnoses & Known Conditions
Bulleted list of diagnoses and conditions on record. Include how long they've had each where known.

## Current Medications
Bulleted list of current medications with doses. Note any that are relevant to today's presentation.

## Known Allergies & Sensitivities
List any known medication allergies, sensitivities, or adverse reactions. If none stated, say "None reported by patient."

## Medication Notes for ER Staff
Review the current medications list. Flag any: (1) combinations with known interaction risks that ER staff should be aware of before administering additional medications, (2) medications that affect standard ER protocols (e.g. blood thinners, immunosuppressants, stimulants, MAOIs), (3) symptoms that may be side effects of a current medication rather than a new acute issue. Use direct clinical language appropriate for ER staff. If no concerns are apparent, state that briefly.

## Recent Lab Results
If lab results are in the patient context above, summarize the most clinically relevant findings here. Note any abnormal values. If no labs are available, omit this section.

## Care Team
List of current providers with specialties. Include this so ER staff know who to coordinate with if needed.

## What to Know About This Patient
2-4 bullet points that give ER staff important context for treating this patient well — their complexity, any conditions that are commonly misunderstood, sensitivities to standard protocols, or things that have not worked in the past. Frame this as clinical context, not patient advocacy.

## What This Patient Needs From This Visit
Clear, specific statement of what the patient is seeking — diagnosis, pain management, imaging, IV fluids, etc. Frame as clinical goals.

End with a one-line footer: "This document was prepared by the patient using Care Compass health tracking software. joincarecompass.com"${extraContext ? `

ADDITIONAL CONTEXT FROM USER (incorporate this — shared after the original report was generated):
${extraContext}` : ""}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2500, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      setErAI(data.content?.[0]?.text || "Unable to generate report. Please try again.");
    } catch { setErAI("Something went wrong. Please try again."); }
    setErView("report");
  };
  const [medications, setMedications]     = useState([]);
  const [userTrackedSymptoms, setUserTrackedSymptoms] = useState(() => {
    try {
      const stored = localStorage.getItem(TRACKED_SYM_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_TRACKED_SYMPTOMS;
    } catch { return DEFAULT_TRACKED_SYMPTOMS; }
  });
  const [showMedForm, setShowMedForm]     = useState(false);
  const [editingMed, setEditingMed]       = useState(null);
  const [medSaved, setMedSaved]           = useState(false);
  const blankMed = { name: "", dose: "", frequency: "", notes: "", reminder: false, reminderTime: "08:00" };
  const [medForm, setMedForm]             = useState(blankMed);
  const [medEditId, setMedEditId]         = useState(null);
  const [bulkText, setBulkText]           = useState("");
  const [showBulk, setShowBulk]           = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem(MED_STORAGE_KEY); if (s) setMedications(JSON.parse(s)); } catch {}
  }, []);

  // Read care team from settings — migrate legacy entries that are missing a type field
  const saveMedications = (updated) => {
    setMedications(updated);
    try { localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(updated)); } catch {}
  };

  const handleSaveMed = () => {
    if (!medForm.name.trim()) return;
    if (medEditId) {
      saveMedications(medications.map(m => m.id === medEditId ? { ...medForm, id: medEditId } : m));
      setMedEditId(null);
    } else {
      saveMedications([...medications, { ...medForm, id: Date.now() }]);
    }
    setMedForm(blankMed); setShowMedForm(false);
    setMedSaved(true); setTimeout(() => setMedSaved(false), 2500);
  };

  const handleDeleteMed = (id) => saveMedications(medications.filter(m => m.id !== id));

  const handleEditMed = (med) => {
    setMedForm({ ...med }); setMedEditId(med.id); setShowMedForm(true);
  };

  const handleBulkImport = () => {
    const lines = bulkText.replace(/,|;/g, "\n").split("\n").map(l => l.trim()).filter(Boolean);
    const newMeds = lines.map(line => {
      const parts = line.split(" ");
      const name = parts[0] || line;
      const dose = parts.length > 1 ? parts.slice(1, 3).join(" ") : "";
      return { name, dose, frequency: "", notes: "", reminder: false, reminderTime: "08:00", id: Date.now() + Math.random() };
    });
    saveMedications([...medications, ...newMeds]);
    setBulkText(""); setShowBulk(false);
    setMedSaved(true); setTimeout(() => setMedSaved(false), 2500);
  };

  // Build med string for log entry from selected med ids
  const buildMedString = (selectedIds) => {
    return medications
      .filter(m => selectedIds.includes(m.id))
      .map(m => `${m.name}${m.dose ? " " + m.dose : ""}${m.frequency ? " (" + m.frequency + ")" : ""}`)
      .join(", ");
  };

    // ── Check-in time detection ────────────────────────────────────────────────
  const getCheckinPrefs = () => {
    try {
      const s = localStorage.getItem("cc-notif-checkins");
      return s ? JSON.parse(s) : { morningTime: "04:00", eveningTime: "18:00" };
    } catch { return { morningTime: "04:00", eveningTime: "18:00" }; }
  };

  const hasDoneCheckinToday = (type) => {
    try {
      const s = localStorage.getItem(CHECKIN_KEY);
      if (!s) return false;
      const checkins = JSON.parse(s);
      const today = new Date().toDateString();
      return checkins.some(c => c.type === type && new Date(c.timestamp).toDateString() === today);
    } catch { return false; }
  };

  const saveCheckin = (type, data) => {
    try {
      const s = localStorage.getItem(CHECKIN_KEY);
      const existing = s ? JSON.parse(s) : [];
      // Ensure every field blankForm expects is present so openEdit never hits undefined
      const safeData = {
        symptoms: "", food: "", medications: "", activity: "",
        notes: "", weather: "", severity: 5, stress: 5, sleep: null,
        photos: [], selectedMedIds: [], saveUnlistedMed: false,
        ...data,
        symptoms:       data.symptoms       ?? "",
        food:           data.food           ?? "",
        medications:    data.medications    ?? "",
        activity:       data.activity       ?? "",
        notes:          data.notes          ?? "",
        weather:        data.weather        ?? "",
        photos:         data.photos         || [],
        selectedMedIds: data.selectedMedIds || [],
      };
      const entry = { ...safeData, type, id: Date.now(), timestamp: new Date().toISOString(), tag: type === "morning" ? "Morning check-in" : "Evening check-in" };
      // Also save as a regular tracker entry
      saveEntries([entry, ...entries]);
      // Record checkin done
      existing.push({ type, timestamp: entry.timestamp });
      localStorage.setItem(CHECKIN_KEY, JSON.stringify(existing.slice(-60)));
    } catch {}
  };

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const prefs = getCheckinPrefs();
  const parseMins = (t) => { const [h, m] = (t || "00:00").split(":").map(Number); return h * 60 + m; };
  const morningStartMins = parseMins(prefs.morningTime);
  const eveningStartMins = parseMins(prefs.eveningTime);
  const isMorningTime = nowMins >= morningStartMins && nowMins < eveningStartMins;
  const isEveningTime = nowMins >= eveningStartMins;
  const shouldShowMorning = isMorningTime && !hasDoneCheckinToday("morning") && view === "log" && prefs.morningOn !== false;
  const shouldShowEvening = isEveningTime && !hasDoneCheckinToday("evening") && view === "log" && prefs.eveningOn !== false;

    const avgSeverity = entries.length ? (entries.reduce((sum, e) => sum + e.severity, 0) / entries.length).toFixed(1) : "—";
  const todayCount = entries.filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString()).length;
  const filteredEntries = entries.filter(e => {
    // Date filter
    const entryDate = new Date(e.timestamp);
    const now = new Date();
    if (dateFilter === "today" && entryDate.toDateString() !== now.toDateString()) return false;
    if (dateFilter === "week" && entryDate < new Date(now - 7 * 86400000)) return false;
    if (dateFilter === "month" && entryDate < new Date(now - 30 * 86400000)) return false;
    // Advanced filters
    // Symptom/keyword search — optional, only applied if user typed something
    if (advFilter.symptomQuery) {
      const q = advFilter.symptomQuery.toLowerCase();
      const text = ((e.symptoms || "") + " " + (e.notes || "") + " " + (e.activity || "") + " " + (e.food || "")).toLowerCase();
      if (!text.includes(q)) return false;
    }
    // Severity — optional, only applied if user selected a value
    if (advFilter.severity !== null && e.severity !== advFilter.severity) return false;
    // Entry type — optional, only applied if user selected types
    if (advFilter.tags.length > 0) {
      const tag = e.tag || "";
      const isManual = !tag.includes("Morning") && !tag.includes("Evening") && e.source !== "sage_chat";
      const matchesMorning = advFilter.tags.includes("morning") && tag.includes("Morning");
      const matchesEvening = advFilter.tags.includes("evening") && tag.includes("Evening");
      const matchesManual  = advFilter.tags.includes("manual")  && isManual;
      const matchesSage    = advFilter.tags.includes("sage")    && e.source === "sage_chat";
      if (!matchesMorning && !matchesEvening && !matchesManual && !matchesSage) return false;
    }
    return true;
  });
  const hasActiveFilter = dateFilter !== "all" || advFilter.symptomQuery || advFilter.severity !== null || advFilter.tags.length > 0;

  const CHART_OPTIONS = [{ field: "severity", label: "Overall severity", color: SAGE }, { field: "stress", label: "Stress level", color: "#e8a838" }, { field: "sleep", label: "Sleep quality", color: TEAL }];
  const ALL_TABS = [
    { id: "log", label: "Log" },
    { id: "bp", label: "Blood Pressure" },
    { id: "trends", label: "Trends" },
    { id: "insights", label: "AI Insights" },
    { id: "report", label: "Care Team Report" },
    { id: "labs", label: "Lab Results" },
    { id: "er", label: "ER Report" },
    { id: "cycle", label: "Cycle Tracker" },
    { id: "ask", label: "Ask Sage" },
  ];

  const DEFAULT_TAB_ORDER = ["log", "bp", "trends", "insights", "report", "labs", "er", "cycle", "ask"];
  const DEFAULT_HIDDEN = []; // all tabs visible by default; user can hide/reorder

  const TAB_ORDER_KEY  = "cc-tab-order";
  const TAB_HIDDEN_KEY = "cc-tab-hidden";

  const [tabOrder, setTabOrder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TAB_ORDER_KEY) || "null");
      // Merge saved with any new tabs not yet in saved order
      if (saved && Array.isArray(saved)) {
        const known = saved.filter(id => ALL_TABS.find(t => t.id === id));
        const newTabs = ALL_TABS.map(t => t.id).filter(id => !known.includes(id));
        return [...known, ...newTabs];
      }
    } catch {}
    return DEFAULT_TAB_ORDER;
  });

  const [hiddenTabs, setHiddenTabs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TAB_HIDDEN_KEY) || "null");
      if (saved && Array.isArray(saved)) return saved;
    } catch {}
    return DEFAULT_HIDDEN;
  });

  const [showTabConfig, setShowTabConfig] = useState(false);

  const tabs = tabOrder.map(id => ALL_TABS.find(t => t.id === id)).filter(t => t && !hiddenTabs.includes(t.id));

  const saveTabOrder = (order) => {
    setTabOrder(order);
    try { localStorage.setItem(TAB_ORDER_KEY, JSON.stringify(order)); } catch {}
  };

  const toggleHidden = (id) => {
    const next = hiddenTabs.includes(id) ? hiddenTabs.filter(h => h !== id) : [...hiddenTabs, id];
    setHiddenTabs(next);
    try { localStorage.setItem(TAB_HIDDEN_KEY, JSON.stringify(next)); } catch {}
    // If hiding current view, switch to log
    if (!hiddenTabs.includes(id) && view === id) setView("log");
  };

  const moveTab = (id, dir) => {
    const idx = tabOrder.indexOf(id);
    if (dir === -1 && idx === 0) return;
    if (dir === 1 && idx === tabOrder.length - 1) return;
    const next = [...tabOrder];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    saveTabOrder(next);
  };

  if (!hasSeenOnboarding) {
    return (
      <div style={s.root}>
        <nav style={s.nav}>
          <a href="/" style={s.navLogo}><BotanicalMark size={30}/><span style={s.navLogoText}>Care Compass</span></a>
          <div style={s.navLinks}><a href="/compass" style={s.navLink}>Assessment</a><span style={s.navActive}>Tracker</span><button onClick={signOut} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", color: WARM_GRAY, fontFamily: "inherit", padding: "0.25rem 0.5rem" }}>Sign out</button></div>
        </nav>
        <main style={{ ...s.main, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={s.onboardingWrap}>
            <BotanicalMark size={56}/>
            <h1 style={s.onboardingTitle}>Welcome to your symptom tracker</h1>
            <p style={s.onboardingDesc}>
              Your tracker is a private health journal — just for you. Log your symptoms, food, sleep,
              stress, and activity as often as you like throughout the day.
            </p>
            <div style={s.onboardingSteps}>
              <div style={s.onboardingStep}>
                <span style={s.onboardingStepNum}>1</span>
                <div>
                  <p style={s.onboardingStepTitle}>Log entries throughout the day</p>
                  <p style={s.onboardingStepDesc}>You can log once or many times — whenever you notice something worth recording.</p>
                </div>
              </div>
              <div style={s.onboardingStep}>
                <span style={s.onboardingStepNum}>2</span>
                <div>
                  <p style={s.onboardingStepTitle}>Track variables alongside symptoms</p>
                  <p style={s.onboardingStepDesc}>Food, medications, activity, sleep, and stress help Care Compass find connections.</p>
                </div>
              </div>
              <div style={s.onboardingStep}>
                <span style={s.onboardingStepNum}>3</span>
                <div>
                  <p style={s.onboardingStepTitle}>Uncover patterns over time</p>
                  <p style={s.onboardingStepDesc}>After a few entries, use AI Insights and Trends to surface what your data is telling you.</p>
                </div>
              </div>
              <div style={s.onboardingStep}>
                <span style={s.onboardingStepNum}>4</span>
                <div>
                  <p style={s.onboardingStepTitle}>Share reports with your care team</p>
                  <p style={s.onboardingStepDesc}>Generate a formatted Care Team Report — tailored for doctors, specialists, and caregivers.</p>
                </div>
              </div>
            </div>
            <div style={s.onboardingPrivacy}>
              <span style={{ color:"#7a9e87" }}><Icon name="lock" size={16} /></span>
              <p style={s.onboardingPrivacyText}>
                Your data is stored privately on this device only. It is never uploaded, sold, or shared.
              </p>
            </div>
            <div style={s.onboardingActions}>
              <button onClick={dismissOnboarding} style={s.onboardingBtn}>Start Tracking →</button>
              <a href="/compass" style={s.onboardingSecondary}>Take the assessment first instead</a>
            </div>
          </div>
        </main>
        <footer style={s.footer}>
          <p style={s.footerText}>© {new Date().getFullYear()} Care Compass · <a href="mailto:hello@joincarecompass.com" style={s.footerLink}>hello@joincarecompass.com</a></p>
          <p style={s.footerDisclaimer}>Care Compass is not a medical service and does not provide medical advice, diagnosis, or treatment.</p>
        </footer>
      </div>
    );
  }

  return (
    <div style={s.root}>
      <nav style={s.nav}>
        <a href="/" style={s.navLogo}><BotanicalMark size={30}/><span style={s.navLogoText}>Care Compass</span></a>
        <div style={s.navLinks} className="no-print"><a href="/compass" style={s.navLink}>Assessment</a><span style={s.navActive}>Tracker</span></div>
      </nav>
      <main style={s.main}>
        <div style={s.container}>
          <div style={s.header} className="no-print">
            <p style={s.eyebrow}>Symptom Tracker</p>
            <h1 style={s.title}>Your daily health log</h1>
            <p style={s.subtitle}>Track symptoms and variables over time to uncover patterns worth sharing with your doctor.</p>
          </div>
          {/* ── Morning check-in banner ── */}
          {shouldShowMorning && !showMorningCheckin && (
            <div style={{ background: `linear-gradient(135deg, #fff8e8, #fff3d4)`, borderRadius: "1rem", border: "1px solid #f0d58a", padding: "1rem 1.25rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }} className="no-print">
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9a7a00", margin: "0 0 0.2rem" }}><span style={{ display:"flex", alignItems:"center", gap: "0.3rem" }}><MorningSunIcon size={18} /><span>Morning check-in</span></span></p>
                <p style={{ fontSize: "0.88rem", fontWeight: 600, color: INK, margin: "0 0 0.15rem" }}>Good morning! How did you sleep?</p>
                <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0 }}>A quick check-in takes under a minute.</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button onClick={() => setShowMorningCheckin(true)} style={{ background: "#e8a838", color: "#fff", border: "none", borderRadius: "100px", padding: "0.55rem 1.1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Quick check-in →</button>
                <button onClick={() => { saveCheckin("morning", { skipped: true }); }} style={{ background: "none", border: "none", fontSize: "0.75rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>Skip</button>
              </div>
            </div>
          )}

          {/* ── Evening check-in banner ── */}
          {shouldShowEvening && !showEveningCheckin && (
            <div style={{ background: `linear-gradient(135deg, #f0ebff, #e8e0ff)`, borderRadius: "1rem", border: "1px solid #c4aff5", padding: "1rem 1.25rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }} className="no-print">
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5c3d9e", margin: "0 0 0.2rem" }}><span style={{ display:"flex", alignItems:"center", gap: "0.3rem" }}><EveningMoonIcon size={18} /><span>Evening check-in</span></span></p>
                <p style={{ fontSize: "0.88rem", fontWeight: 600, color: INK, margin: "0 0 0.15rem" }}>How was your day?</p>
                <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0 }}>Reflect on today or summarise your symptoms.</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button onClick={() => setShowEveningCheckin(true)} style={{ background: "#7c5cbf", color: "#fff", border: "none", borderRadius: "100px", padding: "0.55rem 1.1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Quick check-in →</button>
                <button onClick={() => { saveCheckin("evening", { skipped: true }); }} style={{ background: "none", border: "none", fontSize: "0.75rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>Skip</button>
              </div>
            </div>
          )}

          <div style={s.addBtnWrap} className="no-print">
            <style>{SAGE_KEYFRAMES}</style>
            <style>{`
              .cc-modal-body textarea:focus {
                scroll-margin-bottom: 120px;
              }
            `}</style>
            {/* SAGE_CHAT_DISABLED: Uncomment to re-enable "Talk to Sage" primary button
            							<button onClick={openNew} style={{ ...s.addBtn, display: "flex", alignItems: "center", gap: "0.6rem", paddingLeft: "1.5rem", paddingRight: "1.75rem" }}>
              								<FireflyBare size={32} />
              								Talk to Sage
            							</button>
            							*/}
          </div>
          {entries.length > 0 && (
            <div style={s.statsRow} className="no-print">
              {[{ label: "Total entries", val: entries.length }, { label: "Today's entries", val: todayCount }, { label: "Avg severity", val: avgSeverity }, { label: "Days tracked", val: new Set(entries.map(e => new Date(e.timestamp).toDateString())).size }].map(({ label, val }) => (
                <div key={label} style={s.statCard}><p style={s.statLabel}>{label}</p><p style={s.statValue}>{val}</p></div>
              ))}
            </div>
          )}
          <div style={{ ...s.tabs, position: "relative", justifyContent: "space-between", alignItems: "center" }} className="no-print">
            <div style={{ display: "flex", overflowX: "auto", gap: 0, flex: 1 }}>
              {tabs.map(tab => <button key={tab.id} onClick={() => setView(tab.id)} style={{ ...s.tab, borderBottom: view === tab.id ? `2px solid ${SAGE_DARK}` : "2px solid transparent", color: view === tab.id ? SAGE_DARK : WARM_GRAY, fontWeight: view === tab.id ? 600 : 400, whiteSpace: "nowrap" }}>{tab.label}</button>)}
            </div>
            <button onClick={() => setShowTabConfig(v => !v)} title="Customize tab order"
              style={{ flexShrink: 0, background: showTabConfig ? SAGE_LIGHT : "none", border: showTabConfig ? `1px solid ${SAGE}` : "none", borderRadius: "0.5rem", cursor: "pointer", color: showTabConfig ? SAGE_DARK : WARM_GRAY, padding: "0.3rem", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </button>
          </div>

          {/* Tab order config panel */}
          {showTabConfig && (
            <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "1rem", padding: "1.25rem", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.875rem" }} className="no-print">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: INK, margin: 0 }}>Customize tabs</p>
                  <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: "0.1rem 0 0" }}>Show/hide tabs and reorder them to match how you use the tracker.</p>
                </div>
                <button onClick={() => { saveTabOrder(DEFAULT_TAB_ORDER); setHiddenTabs(DEFAULT_HIDDEN); try { localStorage.setItem(TAB_HIDDEN_KEY, JSON.stringify(DEFAULT_HIDDEN)); } catch {} }}
                  style={{ fontSize: "0.75rem", color: WARM_GRAY, background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.3rem 0.75rem", cursor: "pointer", fontFamily: "inherit" }}>Reset</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {tabOrder.map((id, idx) => {
                  const tab = ALL_TABS.find(t => t.id === id);
                  if (!tab) return null;
                  const isHidden = hiddenTabs.includes(id);
                  const isLocked = id === "log"; // Log tab can't be hidden
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: isHidden ? "#fafaf8" : OFF_WHITE, borderRadius: "0.625rem", padding: "0.5rem 0.875rem", opacity: isHidden ? 0.6 : 1, border: `1px solid ${isHidden ? "rgba(0,0,0,0.06)" : "transparent"}` }}>
                      {/* Show/hide toggle */}
                      <button onClick={() => !isLocked && toggleHidden(id)} title={isLocked ? "This tab can't be hidden" : isHidden ? "Show tab" : "Hide tab"}
                        style={{ background: "none", border: "none", cursor: isLocked ? "default" : "pointer", padding: 0, flexShrink: 0, display: "flex", alignItems: "center" }}>
                        {isLocked ? (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="4" y="7" width="8" height="7" rx="1.5" stroke={SAGE_DARK} strokeWidth="1.3"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke={SAGE_DARK} strokeWidth="1.3" strokeLinecap="round"/></svg>
                        ) : isHidden ? (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="3" stroke="rgba(0,0,0,0.2)" strokeWidth="1.3"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="3" fill={SAGE_DARK} stroke={SAGE_DARK} strokeWidth="1.3"/><path d="M4 8l3 3 5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </button>
                      <span style={{ flex: 1, fontSize: "0.88rem", color: isHidden ? WARM_GRAY : INK, fontWeight: 500 }}>{tab.label}</span>
                      {/* Reorder buttons — only show for visible tabs */}
                      {!isHidden && (
                        <>
                          <button onClick={() => moveTab(id, -1)} disabled={idx === 0}
                            style={{ background: "none", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "0.375rem", width: 28, height: 28, cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.3 : 1, fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
                          <button onClick={() => moveTab(id, 1)} disabled={idx === tabOrder.length - 1}
                            style={{ background: "none", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "0.375rem", width: 28, height: 28, cursor: idx === tabOrder.length - 1 ? "default" : "pointer", opacity: idx === tabOrder.length - 1 ? 0.3 : 1, fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>↓</button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setShowTabConfig(false)} style={{ alignSelf: "flex-end", background: SAGE_DARK, color: "#fff", border: "none", borderRadius: "100px", padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Done</button>
            </div>
          )}

          {view === "log" && (
            <div style={s.tabContent}>
              {saved && <div style={s.savedBanner}><span style={{ color:"#7a9e87", marginRight:"0.4rem" }}><Icon name="leaf" size={16} /></span>{editingEntry ? "Entry updated!" : "Entry saved!"}</div>}
              {checkinSaved && <div style={{ ...s.savedBanner, background: TEAL_LIGHT, color: TEAL }}>{checkinSaved}</div>}

              {/* ── Logging philosophy tip — shown until dismissed ── */}
              {!logTipDismissed && (
                <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "0.875rem", padding: "0.875rem 1rem 0.875rem 1.25rem", marginBottom: "0.75rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <span style={{ color:"#7a9e87", display:"flex", alignItems:"center" }}><Icon name="tip" size={16} /></span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: INK, margin: "0 0 0.2rem" }}>Two ways to track — both work</p>
                    <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0, lineHeight: 1.6 }}>
                      <strong>Log as it happens</strong> for the most accurate patterns — tap "+ Log Entry" whenever you notice something. Or use <strong>morning & evening check-ins</strong> for a daily rhythm. If you logged throughout the day, your evening check-in is just a quick reflection — no need to re-enter what you already noted.
                    </p>
                  </div>
                  <button
                    onClick={() => { localStorage.setItem("cc-log-tip-dismissed", "1"); setLogTipDismissed(true); }}
                    style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: "1rem", padding: "0 0.25rem", flexShrink: 0, lineHeight: 1 }}
                  >×</button>
                </div>
              )}

              {/* ── Quick Log — compact inline bar ── */}
              {quickSaved ? (
                <div style={{ background: SAGE_LIGHT, border: `1px solid ${SAGE}`, borderRadius: "1rem", padding: "0.875rem 1.25rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: SAGE_DARK, display: "flex" }}><Icon name="leaf" size={16} /></span>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: SAGE_DARK }}>
                    Logged ✓ &nbsp;·&nbsp;
                    {(() => {
                      const todayStr = new Date().toDateString();
                      const todayCt  = entries.filter(e => new Date(e.timestamp).toDateString() === todayStr).length;
                      const avg      = entries.slice(0,7).length ? (entries.slice(0,7).reduce((s,e) => s+(e.severity||0),0)/entries.slice(0,7).length).toFixed(1) : null;
                      return `${todayCt} ${todayCt===1?"entry":"entries"} today${avg ? ` · avg: ${avg}` : ""}`;
                    })()}
                  </p>
                </div>
              ) : (
                <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "1rem", padding: "0.875rem 1.25rem", marginBottom: "0.75rem" }}>
                  {/* Chip row */}
                  {(() => {
                    const freqMap = {};
                    entries.forEach(e => (e.trackedSymptoms || []).forEach(ts => { freqMap[ts.id] = (freqMap[ts.id] || 0) + 1; }));
                    const hasHistory = Object.keys(freqMap).length > 0;
                    const topIds = hasHistory
                      ? Object.entries(freqMap).sort((a,b) => b[1]-a[1]).slice(0,6).map(([id]) => id)
                      : ["fatigue","brain-fog","pain-head","dizziness","nausea","pain-joint"];
                    const topSyms = userTrackedSymptoms.filter(s => topIds.includes(s.id));
                    const autoSev = quickTracked.length ? Math.max(...quickTracked.map(ts => ts.severity)) : null;
                    return (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: WARM_GRAY, whiteSpace: "nowrap", flexShrink: 0 }}>Quick log:</p>
                          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", flex: 1 }}>
                            {topSyms.map(sym => {
                              const active = quickTracked.find(ts => ts.id === sym.id);
                              return (
                                <button key={sym.id} type="button"
                                  onClick={() => setQuickTracked(prev => {
                                    const exists = prev.find(ts => ts.id === sym.id);
                                    return exists ? prev.filter(ts => ts.id !== sym.id) : [...prev, { id: sym.id, label: sym.label, severity: 5 }];
                                  })}
                                  style={{ padding: "0.25rem 0.625rem", borderRadius: "100px", border: `1.5px solid ${active ? SAGE_DARK : "rgba(0,0,0,0.12)"}`, background: active ? SAGE_DARK : "transparent", color: active ? "#fff" : INK, fontSize: "0.72rem", fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s" }}>
                                  {sym.label}{active ? ` · ${active.severity}` : ""}
                                </button>
                              );
                            })}
                          </div>
                          <button type="button" onClick={handleQuickLog} disabled={!quickTracked.length}
                            style={{ background: quickTracked.length ? SAGE_DARK : "rgba(0,0,0,0.1)", color: quickTracked.length ? "#fff" : WARM_GRAY, border: "none", borderRadius: "100px", padding: "0.4rem 0.875rem", fontSize: "0.78rem", fontWeight: 600, cursor: quickTracked.length ? "pointer" : "default", fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0 }}>
                            Log →
                          </button>
                        </div>
                        {/* Active sliders */}
                        {quickTracked.length > 0 && (
                          <div style={{ marginTop: "0.625rem", display: "flex", flexDirection: "column", gap: "0.35rem", background: SAGE_LIGHT, borderRadius: "0.625rem", padding: "0.5rem 0.75rem" }}>
                            {quickTracked.map(ts => (
                              <div key={ts.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: SAGE_DARK, minWidth: 100 }}>{ts.label}</span>
                                <input type="range" min="1" max="10" step="1" value={ts.severity}
                                  onChange={e => setQuickTracked(prev => prev.map(s => s.id === ts.id ? { ...s, severity: Number(e.target.value) } : s))}
                                  style={{ flex: 1, accentColor: severityColor(ts.severity) }}
                                />
                                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: severityColor(ts.severity), minWidth: 24, textAlign: "right" }}>{ts.severity}</span>
                              </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.2rem" }}>
                              <span style={{ fontSize: "0.7rem", color: WARM_GRAY }}>Overall severity: <strong style={{ color: severityColor(autoSev) }}>{autoSev}/10</strong></span>
                              <button type="button" onClick={() => {
                                // Carry quick log selections into the full form
                                const last = entries[0] || null;
                                setEditingEntry(null);
                                setForm({
                                  ...blankForm,
                                  sleep:           isFirstEntryToday ? 7 : null,
                                  selectedMedIds:  last?.selectedMedIds?.length ? last.selectedMedIds : [],
                                  weather:         last?.weather ?? "",
                                  trackedSymptoms: [...quickTracked],
                                });
                                setShowAllSymptoms(false);
                                setQuickTracked([]);
                                setShowForm(true);
                              }}
                                style={{ background: "none", border: "none", color: WARM_GRAY, fontSize: "0.7rem", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", padding: 0 }}>
                                Add more detail
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {entries.length === 0 ? (
                <>
                  <div style={s.assessmentPrompt}>
                    <div style={s.assessmentPromptLeft}>
                      <p style={s.assessmentPromptTitle}>Start with a full assessment</p>
                      <p style={s.assessmentPromptDesc}>Not sure where to begin? Take the Care Compass assessment first — it maps your symptoms across all body systems and surfaces patterns to discuss with your doctor.</p>
                    </div>
                    <a href="/compass" style={s.assessmentPromptBtn}>Take the Assessment →</a>
                  </div>
                  <div style={s.emptyState}><BotanicalMark size={48}/><h2 style={s.emptyTitle}>Start tracking today</h2><p style={s.emptyDesc}>Log your first entry to begin building your health picture.</p></div>
                </>
              ) : (
                <>
                  <div style={s.chartCard}>
                    <div style={s.chartHeader}>
                      <p style={s.chartTitle}>Trend view</p>
                      <div style={s.chartSelector}>
                        {CHART_OPTIONS.map(opt => <button key={opt.field} onClick={() => setChartField(opt.field)} style={{ ...s.chartOptBtn, background: chartField === opt.field ? opt.color : "transparent", color: chartField === opt.field ? "#fff" : WARM_GRAY, borderColor: chartField === opt.field ? opt.color : "rgba(0,0,0,0.1)" }}>{opt.label}</button>)}
                      </div>
                    </div>
                    <LineChart entries={filteredEntries} field={chartField} color={CHART_OPTIONS.find(o => o.field === chartField)?.color}/>
                  </div>
                  <div style={s.recentEntries}>
                    {/* ── Advanced filter panel ── */}
                    <div style={{ marginBottom: "0.875rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.625rem", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                          {[{val:"all",label:"All time"},{val:"today",label:"Today"},{val:"week",label:"7 days"},{val:"month",label:"30 days"}].map(opt => (
                            <button key={opt.val} onClick={() => setDateFilter(opt.val)} style={{ ...s.dateFilterBtn, background: dateFilter === opt.val ? SAGE_DARK : "transparent", color: dateFilter === opt.val ? "#fff" : WARM_GRAY, borderColor: dateFilter === opt.val ? SAGE_DARK : "rgba(0,0,0,0.12)" }}>{opt.label}</button>
                          ))}
                        </div>
                        <button onClick={() => setShowAdvFilter(f => !f)}
                          style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: hasActiveFilter ? SAGE_LIGHT : "none", border: "1px solid " + (hasActiveFilter ? SAGE : "rgba(0,0,0,0.12)"), borderRadius: "100px", padding: "0.3rem 0.75rem", fontSize: "0.78rem", color: hasActiveFilter ? SAGE_DARK : WARM_GRAY, cursor: "pointer", fontFamily: "inherit", fontWeight: hasActiveFilter ? 600 : 400 }}>
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          {showAdvFilter ? "Hide filters" : "More filters"}{hasActiveFilter ? " · active" : ""}
                        </button>
                      </div>

                      {showAdvFilter && (
                        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.875rem", padding: "1rem 1.25rem", marginTop: "0.625rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                          <div>
                            <label style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: WARM_GRAY, display: "block", marginBottom: "0.35rem" }}>Search symptoms &amp; notes</label>
                            <div style={{ position: "relative" }}>
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: WARM_GRAY, pointerEvents: "none" }}><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                              <input value={advFilter.symptomQuery} onChange={e => setAdvFilter(f => ({ ...f, symptomQuery: e.target.value }))}
                                placeholder="e.g. headache, dizziness, shoulder pain..."
                                style={{ width: "100%", boxSizing: "border-box", padding: "0.55rem 0.75rem 0.55rem 2.25rem", borderRadius: "0.625rem", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "0.875rem", color: INK, background: OFF_WHITE, outline: "none", fontFamily: "inherit" }}/>
                            </div>
                          </div>
                          <div>
                            <label style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: WARM_GRAY, display: "block", marginBottom: "0.35rem" }}>
                              Severity <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{advFilter.severity !== null ? "— showing " + advFilter.severity + "/10" : "— optional"}</span>
                            </label>
                            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                              {advFilter.severity !== null && (
                                <button onClick={() => setAdvFilter(f => ({ ...f, severity: null }))}
                                  style={{ background: "rgba(0,0,0,0.06)", color: WARM_GRAY, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.25rem 0.65rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>
                                  Any
                                </button>
                              )}
                              {[1,2,3,4,5,6,7,8,9,10].map(n => {
                                const active = advFilter.severity === n;
                                const col = n >= 7 ? "#c0392b" : n >= 4 ? "#e8a838" : SAGE_DARK;
                                return (
                                  <button key={n} onClick={() => setAdvFilter(f => ({ ...f, severity: active ? null : n }))}
                                    style={{ background: active ? col : "transparent", color: active ? "#fff" : col, border: "1.5px solid " + (active ? col : "rgba(0,0,0,0.12)"), borderRadius: "100px", padding: "0.25rem 0", width: 34, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit", fontWeight: active ? 700 : 500, textAlign: "center" }}>
                                    {n}
                                  </button>
                                );
                              })}
                            </div>
                            <p style={{ fontSize: "0.7rem", color: "#aaa", margin: "0.3rem 0 0", fontStyle: "italic" }}>Tap a number to filter by exact severity. Leave unselected to show all.</p>
                          </div>
                          <div>
                            <label style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: WARM_GRAY, display: "block", marginBottom: "0.35rem" }}>Entry type</label>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                              {[{val:"morning",label:"Morning check-in"},{val:"evening",label:"Evening check-in"},{val:"manual",label:"Symptom log"},{val:"sage",label:"✦ Sage"}].map(tag => {
                                const active = advFilter.tags.includes(tag.val);
                                return <button key={tag.val} onClick={() => setAdvFilter(f => ({ ...f, tags: active ? f.tags.filter(t => t !== tag.val) : [...f.tags, tag.val] }))}
                                  style={{ background: active ? SAGE_DARK : "transparent", color: active ? "#fff" : WARM_GRAY, border: "1px solid " + (active ? SAGE_DARK : "rgba(0,0,0,0.12)"), borderRadius: "100px", padding: "0.3rem 0.75rem", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit", fontWeight: active ? 600 : 400 }}>{tag.label}</button>;
                              })}
                            </div>
                          </div>
                          {hasActiveFilter && (
                            <button onClick={() => { setDateFilter("all"); setAdvFilter({ symptomQuery: "", severity: null, tags: [] }); }}
                              style={{ background: "none", border: "none", color: WARM_GRAY, fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.2)", textAlign: "left", padding: 0 }}>
                              Clear all filters
                            </button>
                          )}
                        </div>
                      )}

                      <p style={{ fontSize: "0.72rem", color: WARM_GRAY, margin: "0.4rem 0 0", fontStyle: "italic" }}>
                        {hasActiveFilter ? filteredEntries.length + " of " + entries.length + " entries match" : entries.length + " total entries"}
                      </p>
                    </div>

                    {filteredEntries.length === 0 ? (
                      <p style={s.noEntriesMsg}>{hasActiveFilter ? "No entries match your filters." : "No entries yet."}</p>
                    ) : (
                      filteredEntries.map(e => <EntryCard key={e.id} entry={e} onDelete={handleDelete} onEdit={openEdit}/>)
                    )}
                  </div>
                </>
              )}
            </div>
          )}



          {view === "trends" && (
            <div style={s.tabContent}>
              <div style={s.recentHeader}>
                <p style={s.sectionLabel}>Filter period</p>
                <div style={s.dateFilterWrap}>
                  {[{val:"all",label:"All"},{val:"today",label:"Today"},{val:"week",label:"7 days"},{val:"month",label:"30 days"}].map(opt => (
                    <button key={opt.val} onClick={() => setDateFilter(opt.val)} style={{ ...s.dateFilterBtn, background: dateFilter === opt.val ? SAGE_DARK : "transparent", color: dateFilter === opt.val ? "#fff" : WARM_GRAY, borderColor: dateFilter === opt.val ? SAGE_DARK : "rgba(0,0,0,0.12)" }}>{opt.label}</button>
                  ))}
                </div>
              </div>
              <TrendsTab entries={filteredEntries} dateFilter={dateFilter} allEntries={entries} userTrackedSymptoms={userTrackedSymptoms}/>
            </div>
          )}

          {view === "insights" && (
            <div style={s.tabContent}>
              {/* Loading overlay */}
              {loadingInsights && (
                <div style={s.insightsLoadingOverlay}>
                  <div style={s.insightsLoadingCard}>
                    <BotanicalMark size={48}/>
                    <h2 style={s.insightsLoadingTitle}>Analyzing your patterns</h2>
                    <p style={s.insightsLoadingDesc}>Care Compass is reviewing your entries day by day — looking for symptom patterns, timing correlations, and potential triggers across your full health picture.</p>
                    <div style={s.insightsLoadingBarWrap}>
                      <div style={s.insightsLoadingBar}/>
                    </div>
                    <p style={s.insightsLoadingNote}>This usually takes 15–25 seconds. Please don't close this page.</p>
                  </div>
                </div>
              )}
              {uniqueDaysLogged < 3 ? (
                <div style={s.emptyState}>
                  <p style={s.emptyDesc}>Log entries across at least 3 different days before running AI pattern analysis. You've logged on {uniqueDaysLogged} {uniqueDaysLogged === 1 ? "day" : "days"} so far.</p>
                  <a href="/compass" style={{ ...s.assessmentPromptBtn, marginTop: "0.5rem" }}>Or take the full assessment →</a>
                </div>
              ) : !insights ? (
                <div style={s.emptyState}>
                  {apptContext && (
                    <div style={{ background: `linear-gradient(135deg, ${SAGE_LIGHT}, ${TEAL_LIGHT})`, borderRadius: "1rem", padding: "1rem 1.25rem", marginBottom: "1rem", width: "100%", boxSizing: "border-box", textAlign: "left" }}>
                      <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: SAGE_DARK, margin: "0 0 0.35rem" }}>Preparing for your appointment</p>
                      <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: "0 0 0.15rem" }}>
                        {apptContext.specialty}{apptContext.doctor ? ` · ${apptContext.doctor}` : ""}
                      </p>
                      {apptContext.date && <p style={{ fontSize: "0.78rem", color: TEAL, margin: 0 }}>{new Date(apptContext.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>}
                      {apptContext.reason && <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: "0.25rem 0 0", fontStyle: "italic" }}>{apptContext.reason}</p>}
                    </div>
                  )}
                  <BotanicalMark size={48}/>
                  <h2 style={s.emptyTitle}>{apptContext ? `Prepare your ${apptContext.specialty} report` : "Ready to find your patterns?"}</h2>
                  <p style={s.emptyDesc}>
                    {apptContext
                      ? `Care Compass will analyze your ${entries.length} entries and tailor the insights specifically for your upcoming ${apptContext.specialty} appointment — highlighting what matters most for that visit.`
                      : `Care Compass will analyze your ${entries.length} entries across ${uniqueDaysLogged} days — including time-of-day correlations between medications, food, activity, and symptoms.`
                    }
                  </p>
                  <button onClick={handleInsights} disabled={loadingInsights} style={s.addBtn}>
                    {apptContext ? `Generate ${apptContext.specialty} Report →` : "Analyze My Patterns →"}
                  </button>
                </div>
              ) : (
                <div style={s.insightsWrap}>
                  {/* Polished report header */}
                  <div style={s.insightsReportHeader}>
                    <div style={s.insightsReportHeaderTop}>
                      <BotanicalMark size={44}/>
                      <div>
                        <p style={s.insightsReportEyebrow}>Care Compass Pattern Report</p>
                        <h2 style={s.insightsTitle}>Your Health Pattern Insights</h2>
                        <p style={s.insightsMeta}>Based on {entries.length} entries across {uniqueDaysLogged} days · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </div>
                    <div style={s.insightsReportActions} className="no-print">
                      <button onClick={() => {
                        const style = document.createElement("style");
                        style.innerHTML = `@media print { .no-print { display: none !important; } @page { margin: 1.5cm; } }`;
                        document.head.appendChild(style);
                        window.print();
                        setTimeout(() => document.head.removeChild(style), 1000);
                      }} style={s.insightsExportBtn}>↓ Save as PDF</button>
                      <button onClick={handleInsights} style={s.rerunBtn}>Re-run Analysis →</button>
                    </div>
                  </div>
                  <div style={s.disclaimer}><strong>Important:</strong> These are patterns to explore with your doctor — not medical advice or diagnosis.</div>

                  {/* ── Visual summary — shown when generating appointment report ── */}
                  {apptContext && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                      {/* Stats row */}
                      <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 1rem" }}>At a Glance</p>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                          {(() => {
                            const totalDays = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;
                            const avgSev = (entries.reduce((s, e) => s + e.severity, 0) / entries.length).toFixed(1);
                            const highDays = new Set(entries.filter(e => e.severity >= 7).map(e => new Date(e.timestamp).toDateString())).size;
                            const sleepEntries = entries.filter(e => e.sleep != null);
                            const avgSleep = sleepEntries.length ? (sleepEntries.reduce((s, e) => s + e.sleep, 0) / sleepEntries.length).toFixed(1) : null;
                            const stressEntries = entries.filter(e => e.stress != null);
                            const avgStress = stressEntries.length ? (stressEntries.reduce((s, e) => s + e.stress, 0) / stressEntries.length).toFixed(1) : null;
                            const sevColor = avgSev <= 3 ? SAGE_DARK : avgSev <= 6 ? "#e8a838" : "#c0392b";
                            return <>
                              <ReportStatBox label="Days tracked" value={totalDays} sub={`${entries.length} total entries`}/>
                              <ReportStatBox label="Avg severity" value={`${avgSev}/10`} color={sevColor} sub={avgSev <= 3 ? "Manageable" : avgSev <= 6 ? "Moderate" : "High"}/>
                              <ReportStatBox label="High severity days" value={highDays} color={highDays > 0 ? "#c0392b" : SAGE_DARK} sub="≥7/10"/>
                              {avgSleep && <ReportStatBox label="Avg sleep quality" value={`${avgSleep}/10`} color={TEAL}/>}
                              {avgStress && <ReportStatBox label="Avg stress level" value={`${avgStress}/10`} color="#e8a838"/>}
                            </>;
                          })()}
                        </div>
                      </div>

                      {/* Daily severity bar chart */}
                      <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.5rem" }}>Daily Severity — Last 30 Days</p>
                        <p style={{ fontSize: "0.72rem", color: "#aaa", margin: "0 0 0.75rem", fontStyle: "italic" }}>
                          <span style={{ color: SAGE_DARK }}>■</span> Low (1–3) &nbsp;
                          <span style={{ color: "#e8a838" }}>■</span> Moderate (4–6) &nbsp;
                          <span style={{ color: "#c0392b" }}>■</span> High (7–10)
                        </p>
                        <SeverityBarChart entries={entries}/>
                      </div>

                      {/* Symptom frequency */}
                      <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.5rem" }}>Most Frequent Symptoms</p>
                        <p style={{ fontSize: "0.72rem", color: "#aaa", margin: "0 0 0.75rem", fontStyle: "italic" }}>Frequency as % of days tracked</p>
                        <SymptomFrequencyChart entries={entries}/>
                      </div>

                      {/* Sleep & stress */}
                      {entries.some(e => e.sleep != null) && (
                        <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem" }}>
                          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.75rem" }}>Sleep Quality & Stress Levels</p>
                          <SleepStressChart entries={entries}/>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={s.insightsContent}>
                    {(() => {
                      const INSIGHT_SECTION_STYLES = {
                        "patterns we notice":                     { border: SAGE,     head: SAGE_DARK,  bg: "#fff" },
                        "daily life impact":                      { border: "#f0d58a", head: "#9a6f00", bg: "#fff8e8" },
                        "time-based correlations worth exploring": { border: TEAL,     head: "#2c6e72",  bg: TEAL_LIGHT },
                        "potential triggers":                     { border: "#f5c0c0", head: "#9b2c2c", bg: "#fff0f0" },
                        "what's improving vs worsening":          { border: SAGE,     head: SAGE_DARK,  bg: SAGE_LIGHT },
                        "questions to bring to your doctor":      { border: "#c0caf5", head: "#2c3d9b", bg: "#f0f4ff" },
                        "blood pressure patterns":                { border: TEAL,     head: "#2c6e72",  bg: TEAL_LIGHT },
                      };

                      // Split on ## headings
                      const sections = insights.split(/\n(?=## )/).filter(Boolean);

                      return sections.map((section, si) => {
                        const lines = section.split("\n");
                        const heading = lines[0].replace(/^##\s*/, "").trim();
                        const body = lines.slice(1).join("\n").trim();
                        if (!heading || !body) return null;

                        const key = heading.toLowerCase().replace(/[^a-z\s']/g, "").trim();
                        const col = INSIGHT_SECTION_STYLES[key] || { border: SAGE, head: SAGE_DARK, bg: "#fff" };
                        const isQuestions = key.includes("question");

                        // Parse body into blocks
                        const bodyLines = body.split("\n").map(l => l.trim()).filter(Boolean);

                        // Group consecutive bullet lines and paragraph lines
                        const blocks = [];
                        let currentBlock = { type: "para", lines: [] };
                        bodyLines.forEach(line => {
                          const isBullet = /^[-*•]\s/.test(line) || /^\d+[.)]\s/.test(line);
                          const type = isBullet ? "bullet" : "para";
                          if (type !== currentBlock.type && currentBlock.lines.length) {
                            blocks.push({ ...currentBlock });
                            currentBlock = { type, lines: [] };
                          }
                          currentBlock.type = type;
                          currentBlock.lines.push(line);
                        });
                        if (currentBlock.lines.length) blocks.push(currentBlock);

                        return (
                          <div key={si} style={{ background: col.bg, border: "1.5px solid " + col.border, borderRadius: "1.25rem", overflow: "hidden", marginBottom: "1rem" }}>
                            <div style={{ padding: "0.875rem 1.5rem", borderBottom: "1.5px solid " + col.border, display: "flex", alignItems: "center", gap: "0.625rem" }}>
                              <div style={{ width: 4, height: 20, borderRadius: 2, background: col.head, flexShrink: 0 }}/>
                              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: col.head, margin: 0 }}>{heading}</h3>
                            </div>
                            <div style={{ padding: "1.1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                              {blocks.map((block, bi) => {
                                if (block.type === "bullet" || isQuestions) {
                                  return (
                                    <div key={bi} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                                      {block.lines.map((line, li) => {
                                        const clean = line.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1").trim();
                                        if (!clean) return null;
                                        if (isQuestions) return (
                                          <div key={li} style={{ background: "rgba(255,255,255,0.7)", border: "1px solid " + col.border, borderRadius: "0.625rem", padding: "0.75rem 1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: col.head, flexShrink: 0, marginTop: "0.55rem" }}/>
                                            <span style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.7 }}>{clean}</span>
                                          </div>
                                        );
                                        return (
                                          <div key={li} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
                                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: col.head, flexShrink: 0, marginTop: "0.6rem" }}/>
                                            <p style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.75, margin: 0 }}>
                                              {line.replace(/^[-*•]\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                }
                                // Paragraph block
                                const text = block.lines.join(" ").replace(/\*\*(.*?)\*\*/g, "$1");
                                return <p key={bi} style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.85, margin: 0 }}>{text}</p>;
                              })}
                            </div>
                          </div>
                        );
                      }).filter(Boolean);
                    })()}
                  </div>
                  <div style={s.insightsFooter} className="no-print">
                    <p style={{...s.insightsFooterNote, display:"flex", alignItems:"center", gap:"0.4rem"}}><span style={{ color:"#7a9e87" }}><Icon name="leaf" size={16} /></span> Bring this report to your next appointment and ask your provider to help you explore these patterns.</p>
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                      <button onClick={() => {
                        const style = document.createElement("style");
                        style.innerHTML = `@media print { .no-print { display: none !important; } @page { margin: 1.5cm; } }`;
                        document.head.appendChild(style);
                        window.print();
                        setTimeout(() => document.head.removeChild(style), 1000);
                      }} style={s.insightsExportBtn}>↓ Save as PDF</button>
                      <button onClick={handleInsights} style={s.rerunBtn}>Re-run Analysis →</button>
                    </div>
                  </div>
                  <InsightChat reportType="insights" reportText={insights || ""} onRerun={handleInsights} />
                </div>
              )}
            </div>
          )}

          {view === "report" && (
            <div style={s.tabContent}>
              {entries.length === 0 ? (
                <div style={s.emptyState}><p style={s.emptyDesc}>No entries yet. Start logging to generate a care team report.</p></div>
              ) : (
                <>
                  {/* ── Mode toggle ── */}
                  <div style={{ display: "flex", background: "rgba(0,0,0,0.04)", borderRadius: "100px", padding: "0.25rem", marginBottom: "1.25rem", width: "fit-content" }} className="no-print">
                    {[["patient", "Patient View"], ["careteam", "Care Team View"]].map(([mode, label]) => (
                      <button
                        key={mode}
                        onClick={() => { setReportMode(mode); try { localStorage.setItem("cc-report-mode", mode); } catch {} }}
                        style={{ padding: "0.45rem 1.1rem", borderRadius: "100px", border: "none", background: reportMode === mode ? "#fff" : "transparent", color: reportMode === mode ? INK : WARM_GRAY, fontWeight: reportMode === mode ? 600 : 400, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit", boxShadow: reportMode === mode ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* ── Care Team View ── */}
                  {reportMode === "careteam" && (
                    <CareTeamDashboard entries={entries} bpReadings={bpReadings}/>
                  )}

                  {/* ── Patient View ── */}
                  {reportMode === "patient" && (
                    reportView === "prompt" ? (
                      <ReportPromptView
                        careTeam={careTeam}
                        reportPrompt={reportPrompt}
                        setReportPrompt={setReportPrompt}
                        entries={entries}
                        handleGenerateReport={handleGenerateReport}
                        s={s}
                      />
                    ) : reportView === "generating" ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: "1.5rem", textAlign: "center" }}>
                  <BotanicalMark size={56}/>
                  <div>
                    <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: "0 0 0.5rem" }}>Building your report…</h2>
                    {(() => {
                      const loadMember = careTeam.find(p => p.name === reportPrompt.providerName);
                      const loadIsCaregiver = loadMember ? loadMember.type === "caregiver" : reportPrompt.otherType === "caregiver";
                      return (
                        <p style={{ fontSize: "0.92rem", color: WARM_GRAY, margin: 0, lineHeight: 1.7, maxWidth: 360 }}>
                          {loadIsCaregiver
                            ? `Care Compass is preparing a plain-language health update for ${reportPrompt.providerName}…`
                            : `Care Compass is analyzing your entries and tailoring insights for your ${reportPrompt.specialty || "appointment"}${reportPrompt.providerName ? " with " + reportPrompt.providerName : ""}.`}
                        </p>
                      );
                    })()}
                  </div>
                  <div style={{ width: "100%", maxWidth: 320, height: 6, background: SAGE_LIGHT, borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 100, background: SAGE_DARK, animation: "insightProgress 18s ease-in-out forwards" }}/>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "#aaa", margin: 0, fontStyle: "italic" }}>This usually takes 10–20 seconds</p>
                </div>
              ) : (
                <div style={s.reportWrap}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }} className="no-print">
                    <button onClick={() => { setReportView("prompt"); setReportAI(null); }} style={{ background: "transparent", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.5rem 1.1rem", fontSize: "0.85rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>← Edit report details</button>
                    <button onClick={handlePrint} style={s.printBtn}>↓ Save as PDF</button>
                  </div>
                  <div style={s.reportCard}>
                    <div style={s.reportHead}>
                      <BotanicalMark size={44}/>
                      <div style={{ flex: 1 }}>
                        <p style={s.reportEyebrow}>Care Compass · Care Team Report</p>
                        {(() => {
                          const rMember = careTeam.find(p => p.name === reportPrompt.providerName);
                          const rIsCaregiver = rMember
                            ? rMember.type === "caregiver"
                            : reportPrompt.otherType === "caregiver";
                          const rRole = rMember?.careRole || (rIsCaregiver ? reportPrompt.otherRole : "");
                          const titleText = rIsCaregiver
                            ? `Health Update — ${reportPrompt.providerName}${rRole ? " · " + rRole : ""}`
                            : `${reportPrompt.specialty ? reportPrompt.specialty + " — " : ""}${reportPrompt.providerName || "Doctor"}`;
                          return (
                            <>
                              <h2 style={s.reportTitle}>{titleText}</h2>
                              <p style={s.reportMeta}>Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {entries.length} entries over {new Set(entries.map(e => new Date(e.timestamp).toDateString())).size} days</p>
                              {reportPrompt.focus && (
                                <div style={{ marginTop: "0.875rem", background: rIsCaregiver ? `linear-gradient(135deg, ${TEAL_LIGHT}, #e8f8f9)` : `linear-gradient(135deg, ${SAGE_LIGHT}, ${TEAL_LIGHT})`, borderRadius: "0.75rem", padding: "0.75rem 1rem" }}>
                                  <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: rIsCaregiver ? TEAL : SAGE_DARK, margin: "0 0 0.2rem" }}>
                                    {rIsCaregiver ? "Update focus" : "Visit focus"}
                                  </p>
                                  <p style={{ fontSize: "0.9rem", color: INK, margin: 0, lineHeight: 1.5 }}>{reportPrompt.focus}</p>
                                </div>
                              )}
                            </>
                          );
                        })()}
                        {careTeam.filter(p => p.name).length > 0 && (() => {
                          const ctProviders  = careTeam.filter(p => p.name && p.type !== "caregiver");
                          const ctCaregivers = careTeam.filter(p => p.name && p.type === "caregiver");
                          return (
                            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: 0 }}>Care team</p>
                              {ctProviders.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                  {ctProviders.map((p, i) => (
                                    <span key={i} style={{ background: SAGE_LIGHT, color: SAGE_DARK, fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.7rem", borderRadius: "100px" }}>
                                      {p.name}{p.specialty ? ` · ${p.specialty}` : ""}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {ctCaregivers.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                  {ctCaregivers.map((p, i) => (
                                    <span key={i} style={{ background: TEAL_LIGHT, color: TEAL, fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.7rem", borderRadius: "100px" }}>
                                      {p.name}{p.careRole ? ` · ${p.careRole}` : ""}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div style={s.reportSection}>
                      <h3 style={s.reportSectionTitle}>At a Glance</h3>
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        {(() => {
                          const totalDays = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;
                          const avgSev = (entries.reduce((sum, e) => sum + e.severity, 0) / entries.length).toFixed(1);
                          const highDays = new Set(entries.filter(e => e.severity >= 7).map(e => new Date(e.timestamp).toDateString())).size;
                          const sleepEntries = entries.filter(e => e.sleep != null);
                          const avgSleep = sleepEntries.length ? (sleepEntries.reduce((sum, e) => sum + e.sleep, 0) / sleepEntries.length).toFixed(1) : null;
                          const stressEntries = entries.filter(e => e.stress != null);
                          const avgStress = stressEntries.length ? (stressEntries.reduce((sum, e) => sum + e.stress, 0) / stressEntries.length).toFixed(1) : null;
                          const sevColor = avgSev <= 3 ? SAGE_DARK : avgSev <= 6 ? "#e8a838" : "#c0392b";
                          return <>
                            <ReportStatBox label="Days tracked" value={totalDays} sub={`${entries.length} total entries`}/>
                            <ReportStatBox label="Avg severity" value={`${avgSev}/10`} color={sevColor} sub={avgSev <= 3 ? "Manageable" : avgSev <= 6 ? "Moderate" : "High"}/>
                            <ReportStatBox label="High severity days" value={highDays} color={highDays > 0 ? "#c0392b" : SAGE_DARK} sub="≥7/10"/>
                            {avgSleep && <ReportStatBox label="Avg sleep quality" value={`${avgSleep}/10`} color={TEAL}/>}
                            {avgStress && <ReportStatBox label="Avg stress level" value={`${avgStress}/10`} color="#e8a838"/>}
                          </>;
                        })()}
                      </div>
                    </div>
                    <div style={s.reportSection}>
                      <h3 style={s.reportSectionTitle}>Daily Severity — Last 30 Days</h3>
                      <p style={{ fontSize: "0.75rem", color: "#aaa", margin: "0 0 0.75rem", fontStyle: "italic" }}><span style={{ color: SAGE_DARK }}>■</span> Low (1–3) &nbsp;<span style={{ color: "#e8a838" }}>■</span> Moderate (4–6) &nbsp;<span style={{ color: "#c0392b" }}>■</span> High (7–10)</p>
                      <SeverityBarChart entries={entries}/>
                    </div>
                    <div style={s.reportSection}>
                      <h3 style={s.reportSectionTitle}>Most Frequent Symptoms</h3>
                      <SymptomFrequencyChart entries={entries}/>
                    </div>
                    {entries.some(e => e.sleep != null) && (
                      <div style={s.reportSection}>
                        <h3 style={s.reportSectionTitle}>Sleep Quality & Stress Levels</h3>
                        <SleepStressChart entries={entries}/>
                      </div>
                    )}
                    {reportAI && (() => {
                      const SECTION_STYLES = {
                        "visit summary":              { border: SAGE,      head: SAGE_DARK,  bg: "#fff" },
                        "key patterns for this visit":{ border: TEAL,      head: "#2c6e72",  bg: TEAL_LIGHT },
                        "highlighted symptom entries":{ border: "#e8a838", head: "#8a5a00",  bg: "#fff8e8" },
                        "daily life impact":          { border: "#f0d58a", head: "#8a5a00",  bg: "#fff8e8" },
                        "what's improving vs what's worsening": { border: SAGE, head: SAGE_DARK, bg: SAGE_LIGHT },
                        "questions to raise at this visit":     { border: "#c0caf5", head: "#2c3d9b", bg: "#f0f4ff" },
                        "suggested next steps":       { border: TEAL,      head: "#2c6e72",  bg: TEAL_LIGHT },
                      };
                      return reportAI.split(/\n(?=## )/).filter(Boolean).map((section, si) => {
                        const lines = section.split("\n");
                        const heading = lines[0].replace(/^##\s*/, "").trim();
                        const body = lines.slice(1).join("\n").trim();
                        if (!heading || !body) return null;
                        const key = heading.toLowerCase().replace(/[^a-z\s']/g, "").trim();
                        const col = SECTION_STYLES[key] || { border: SAGE, head: SAGE_DARK, bg: "#fff" };
                        return (
                          <div key={si} style={{ background: col.bg, border: `1.5px solid ${col.border}`, borderRadius: "1.25rem", overflow: "hidden", marginBottom: "1rem" }}>
                            <div style={{ padding: "0.875rem 1.5rem", borderBottom: `1.5px solid ${col.border}`, display: "flex", alignItems: "center", gap: "0.625rem" }}>
                              <div style={{ width: 4, height: 20, borderRadius: 2, background: col.head, flexShrink: 0 }}/>
                              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: col.head, margin: 0 }}>{heading}</h3>
                            </div>
                            <div style={{ padding: "1.1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                              {body.split("\n").map(l => l.trim()).filter(Boolean).map((line, li) => {
                                const isBullet = /^[-*•]\s/.test(line) || /^\d+[.)]\s/.test(line);
                                const clean = line.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1").trim();
                                if (!clean) return null;
                                if (isBullet) return (
                                  <div key={li} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: col.head, flexShrink: 0, marginTop: "0.6rem" }}/>
                                    <p style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.75, margin: 0 }}>{clean}</p>
                                  </div>
                                );
                                return <p key={li} style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.85, margin: 0 }}>{clean}</p>;
                              })}
                            </div>
                          </div>
                        );
                      }).filter(Boolean);
                    })()}
                    <div style={s.reportFooter}>
                      <p style={s.reportFooterText}>Generated by Care Compass · joincarecompass.com · Not a medical record or medical advice. Review with your healthcare provider.</p>
                    </div>
                    <InsightChat reportType="doctor" reportText={reportAI || ""} onRerun={handleGenerateReport} />
                  </div>
                </div>
              )
                  )}
              </>
            )}
          </div>
          )}

          {view === "er" && (
            <div style={s.tabContent}>
              {erView === "prompt" ? (

                /* ── ER Prompt screen ── */
                <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                  <div>
                    <p style={{ ...s.eyebrow, color: "#c0392b" }}>Emergency Room</p>
                    <h2 style={{ ...s.title, fontSize: "1.5rem", marginBottom: "0.4rem" }}>ER Visit Report</h2>
                    <p style={{ fontSize: "0.92rem", color: WARM_GRAY, margin: 0, lineHeight: 1.65 }}>
                      Generate a professional handoff document for emergency room staff — structured to communicate your medical history, current condition, and today's chief complaint clearly and credibly.
                    </p>
                  </div>

                  {/* Context banner */}
                  <div style={{ background: "#fff5f5", borderRadius: "1rem", border: "1.5px solid #f5c0c0", padding: "1.1rem 1.25rem", display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: "0.1rem" }}>
                      <circle cx="10" cy="10" r="9" stroke="#c0392b" strokeWidth="1.5"/>
                      <path d="M10 6v5" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round"/>
                      <circle cx="10" cy="14" r="0.8" fill="#c0392b"/>
                    </svg>
                    <div>
                      <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#9b2c2c", margin: "0 0 0.25rem" }}>How to use this report</p>
                      <p style={{ fontSize: "0.82rem", color: "#9b2c2c", margin: 0, lineHeight: 1.65 }}>
                        Print or show this on your phone when you arrive. Hand it to the triage nurse or physician. Having your history documented makes you harder to dismiss — and easier to treat.
                      </p>
                    </div>
                  </div>

                  <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                    {/* Chief complaint */}
                    <div style={s.formGroup}>
                      <label style={s.label}>Chief complaint — why are you going to the ER? <span style={{ color: "#c0392b" }}>*</span></label>
                      <textarea style={{ ...s.input, resize: "vertical" }} rows={2}
                        value={erPrompt.chiefComplaint}
                        onChange={e => setErPrompt(p => ({ ...p, chiefComplaint: e.target.value }))}
                        placeholder="e.g. Severe chest pain radiating to left arm, started 2 hours ago, not relieved by rest"/>
                    </div>

                    {/* Severity */}
                    <div style={s.formGroup}>
                      <label style={s.label}>Current severity <span style={{ fontSize: "0.85rem", fontWeight: 700, color: erPrompt.severity >= 8 ? "#c0392b" : erPrompt.severity >= 5 ? "#e8a838" : SAGE_DARK }}>{erPrompt.severity}/10</span></label>
                      <input type="range" min="1" max="10" step="1" value={erPrompt.severity}
                        onChange={e => setErPrompt(p => ({ ...p, severity: Number(e.target.value) }))}
                        style={{ width: "100%", accentColor: erPrompt.severity >= 8 ? "#c0392b" : erPrompt.severity >= 5 ? "#e8a838" : SAGE_DARK }}/>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.72rem", color: "#aaa" }}>Manageable</span>
                        <span style={{ fontSize: "0.72rem", color: "#aaa" }}>Severe / unbearable</span>
                      </div>
                    </div>

                    {/* Duration */}
                    <div style={s.formGroup}>
                      <label style={s.label}>How long have you had these symptoms?</label>
                      <input style={s.input} value={erPrompt.duration}
                        onChange={e => setErPrompt(p => ({ ...p, duration: e.target.value }))}
                        placeholder="e.g. Sudden onset 2 hours ago, or worsening over the past 3 days"/>
                    </div>

                    {/* Allergies */}
                    <div style={s.formGroup}>
                      <label style={s.label}>Known medication allergies or sensitivities <span style={s.optional}>(optional — add any not already in your profile)</span></label>
                      <input style={s.input} value={erPrompt.allergies}
                        onChange={e => setErPrompt(p => ({ ...p, allergies: e.target.value }))}
                        placeholder="e.g. Penicillin — rash; NSAIDs — GI bleed; Contrast dye — reaction"/>
                    </div>

                    {/* Relevant history */}
                    <div style={s.formGroup}>
                      <label style={s.label}>Anything specific you want the ER team to know <span style={s.optional}>(optional)</span></label>
                      <textarea style={{ ...s.input, resize: "vertical" }} rows={2}
                        value={erPrompt.relevantHistory}
                        onChange={e => setErPrompt(p => ({ ...p, relevantHistory: e.target.value }))}
                        placeholder="e.g. I've had similar episodes before — my cardiologist Dr. Koning is aware. Previous ER visit in March found nothing on standard workup but symptoms persisted."/>
                    </div>
                  </div>

                  {/* What will be included */}
                  <div style={{ background: SAGE_LIGHT, borderRadius: "0.875rem", padding: "0.875rem 1.1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <Icon name="info" size={16} color={SAGE_DARK} style={{ flexShrink:0, marginTop:"0.1rem" }} />
                    <p style={{ fontSize: "0.8rem", color: SAGE_DARK, margin: 0, lineHeight: 1.6 }}>
                      Your report will automatically include your <strong>confirmed diagnoses</strong>, <strong>current medications</strong>, <strong>care team</strong>, <strong>family history</strong>, and <strong>recent symptom data</strong> from the last 14 days — giving ER staff a complete picture of who you are.
                    </p>
                  </div>

                  <button onClick={handleGenerateER} disabled={!erPrompt.chiefComplaint.trim()}
                    style={{ ...s.addBtn, padding: "1rem 2rem", fontSize: "1rem", background: erPrompt.chiefComplaint.trim() ? "#c0392b" : "#aaa", opacity: 1, border: "none" }}>
                    Generate ER Report →
                  </button>
                  {!erPrompt.chiefComplaint.trim() && (
                    <p style={{ fontSize: "0.8rem", color: "#aaa", margin: "-1rem 0 0", textAlign: "center", fontStyle: "italic" }}>Enter your chief complaint to get started</p>
                  )}
                </div>

              ) : erView === "generating" ? (

                /* ── Generating screen ── */
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: "1.5rem", textAlign: "center" }}>
                  <BotanicalMark size={56}/>
                  <div>
                    <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: "0 0 0.5rem" }}>Building your ER report…</h2>
                    <p style={{ fontSize: "0.92rem", color: WARM_GRAY, margin: 0, lineHeight: 1.7, maxWidth: 380 }}>
                      Compiling your medical history, diagnoses, medications, and recent symptom data into a document ER staff can read at a glance.
                    </p>
                  </div>
                  <div style={{ width: "100%", maxWidth: 320, height: 6, background: "#fdeaea", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 100, background: "#c0392b", animation: "insightProgress 18s ease-in-out forwards" }}/>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "#aaa", margin: 0, fontStyle: "italic" }}>This usually takes 10–20 seconds</p>
                </div>

              ) : (

                /* ── Generated ER report ── */
                <div style={s.reportWrap}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }} className="no-print">
                    <button onClick={() => { setErView("prompt"); setErAI(null); }}
                      style={{ background: "transparent", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.5rem 1.1rem", fontSize: "0.85rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>
                      ← Edit details
                    </button>
                    <button onClick={handlePrint} style={{ ...s.printBtn, background: "#c0392b" }}>↓ Save as PDF</button>
                  </div>

                  <div style={{ ...s.reportCard, borderTop: "4px solid #c0392b" }}>

                    {/* ER Report Header */}
                    <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fff0f0", border: "2px solid #f5c0c0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>🚨</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c0392b", margin: "0 0 0.2rem" }}>Emergency Department · Patient Handoff</p>
                        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: "0 0 0.25rem" }}>Medical History & Current Presentation</h2>
                        <p style={{ fontSize: "0.8rem", color: WARM_GRAY, margin: 0 }}>
                          Generated {new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" })} at {new Date().toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" })}
                        </p>
                      </div>
                      <div style={{ flexShrink: 0, background: erPrompt.severity >= 8 ? "#fdeaea" : erPrompt.severity >= 5 ? "#fef3da" : SAGE_LIGHT, border: `2px solid ${erPrompt.severity >= 8 ? "#c0392b" : erPrompt.severity >= 5 ? "#e8a838" : SAGE}`, borderRadius: "0.875rem", padding: "0.6rem 1rem", textAlign: "center", minWidth: 80 }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: erPrompt.severity >= 8 ? "#c0392b" : erPrompt.severity >= 5 ? "#8a5a00" : SAGE_DARK, lineHeight: 1 }}>{erPrompt.severity}/10</div>
                        <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: erPrompt.severity >= 8 ? "#c0392b" : erPrompt.severity >= 5 ? "#8a5a00" : SAGE_DARK, marginTop: "0.2rem" }}>Severity</div>
                      </div>
                    </div>

                    {/* AI narrative sections */}
                    {erAI && (() => {
                      const ER_SECTION_STYLES = {
                        "patient overview":                  { border: "#c0392b", head: "#c0392b",  bg: "#fff5f5" },
                        "chief complaint & current symptoms":{ border: "#c0392b", head: "#9b2c2c",  bg: "#fff0f0" },
                        "relevant symptom pattern (last 14 days)": { border: "#e8a838", head: "#8a5a00", bg: "#fff8e8" },
                        "confirmed diagnoses & known conditions":   { border: "#7a6fa0", head: "#4a3a80", bg: "#f5f3ff" },
                        "current medications":               { border: TEAL,      head: "#2c6e72",  bg: TEAL_LIGHT },
                        "known allergies & sensitivities":   { border: "#e8a838", head: "#8a5a00",  bg: "#fff8e8" },
                        "care team":                         { border: SAGE,      head: SAGE_DARK,  bg: SAGE_LIGHT },
                        "what to know about this patient":   { border: "#7a6fa0", head: "#4a3a80",  bg: "#f5f3ff" },
                        "what this patient needs from this visit": { border: "#c0392b", head: "#9b2c2c", bg: "#fff5f5" },
                      };
                      return erAI.split(/\n(?=## )/).filter(Boolean).map((section, si) => {
                        const lines = section.split("\n");
                        const heading = lines[0].replace(/^##\s*/, "").trim();
                        const body = lines.slice(1).join("\n").trim();
                        if (!heading || !body) return null;
                        const key = heading.toLowerCase().replace(/[^a-z\s()&]/g, "").trim();
                        const col = ER_SECTION_STYLES[key] || { border: "#c0392b", head: "#9b2c2c", bg: "#fff" };
                        return (
                          <div key={si} style={{ background: col.bg, border: `1.5px solid ${col.border}`, borderRadius: "1.25rem", overflow: "hidden", marginBottom: "0.875rem" }}>
                            <div style={{ padding: "0.75rem 1.25rem", borderBottom: `1.5px solid ${col.border}`, display: "flex", alignItems: "center", gap: "0.625rem" }}>
                              <div style={{ width: 4, height: 18, borderRadius: 2, background: col.head, flexShrink: 0 }}/>
                              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: col.head, margin: 0 }}>{heading}</h3>
                            </div>
                            <div style={{ padding: "0.875rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              {body.split("\n").map(l => l.trim()).filter(Boolean).map((line, li) => {
                                if (line.startsWith("---") || line.startsWith("___")) return <hr key={li} style={{ border: "none", borderTop: `1px solid ${col.border}`, margin: "0.25rem 0" }}/>;
                                const isBullet = /^[-*•]\s/.test(line) || /^\d+[.)]\s/.test(line);
                                const clean = line.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1").trim();
                                if (!clean) return null;
                                if (isBullet) return (
                                  <div key={li} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: col.head, flexShrink: 0, marginTop: "0.55rem" }}/>
                                    <p style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.7, margin: 0 }}>{clean}</p>
                                  </div>
                                );
                                return <p key={li} style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.8, margin: 0 }}>{clean}</p>;
                              })}
                            </div>
                          </div>
                        );
                      }).filter(Boolean);
                    })()}

                    <div style={{ ...s.reportFooter, borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: "1rem" }}>
                      <p style={{ ...s.reportFooterText, fontSize: "0.72rem" }}>This document was prepared by the patient using Care Compass health tracking software · joincarecompass.com · This is not a medical record. For clinical decisions, verify information directly with the patient.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {view === "cycle" && (
            <div style={s.tabContent}>
              <CycleTab globalEntries={entries} />
            </div>
          )}

          {view === "ask" && (
            <div style={{ ...s.tabContent, paddingBottom: "env(safe-area-inset-bottom, 1rem)" }}>
{/* SAGE_CHAT_DISABLED: Uncomment to re-enable SageAskWidget on Ask tab
              <SageAskWidget mode="tracker" />
              */}
            </div>
          )}

          {view === "bp" && (
            <div style={s.tabContent}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <p style={s.eyebrow}>Blood Pressure</p>
                  <h2 style={{ ...s.title, fontSize: "1.4rem", marginBottom: "0.25rem" }}>BP Log</h2>
                  <p style={{ fontSize: "0.85rem", color: WARM_GRAY, margin: 0 }}>Track readings separately from your symptom log. Your cardiologist report is always one tap away.</p>
                </div>
                <button onClick={() => setShowBpForm(true)} style={s.addBtn}>+ Log Reading</button>
              </div>

              {bpSaved && <div style={s.savedBanner}>Reading saved!</div>}

              {/* Sub-tabs */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(0,0,0,0.07)", paddingBottom: "0" }} className="no-print">
                {[{ id: "log", label: "Overview" }, { id: "history", label: "History" }, { id: "report", label: "Care Team Report" }].map(t => (
                  <button key={t.id} onClick={() => setBpView(t.id)} style={{ ...s.tab, borderBottom: bpView === t.id ? `2px solid #c0392b` : "2px solid transparent", color: bpView === t.id ? "#c0392b" : WARM_GRAY, fontWeight: bpView === t.id ? 600 : 400 }}>{t.label}</button>
                ))}
              </div>

              {/* ── Overview ── */}
              {bpView === "log" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {bpReadings.length === 0 ? (
                    <div style={s.emptyState}>
                      <div style={{ color:"#7a9e87", display:"flex", justifyContent:"center", marginBottom:"0.5rem" }}><Icon name="pulse" size={32} /></div>
                      <h2 style={s.emptyTitle}>Start your BP log</h2>
                      <p style={s.emptyDesc}>Log your first reading. Your cardiologist wants a record — this will build it automatically.</p>
                      <button onClick={() => setShowBpForm(true)} style={s.addBtn}>+ Log First Reading</button>
                    </div>
                  ) : (
                    <>
                      {/* Stats row */}
                      {(() => {
                        const avg = bpAvgRecent();
                        const cat = avg ? bpCategory(avg.systolic, avg.diastolic) : null;
                        const last = bpReadings[0];
                        const lastCat = last ? bpCategory(last.systolic, last.diastolic) : null;
                        return (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
                            <div style={s.statCard}>
                              <p style={s.statLabel}>Last reading</p>
                              <p style={{ ...s.statValue, color: lastCat?.color, fontFamily: "'Playfair Display', Georgia, serif" }}>{last ? `${last.systolic}/${last.diastolic}` : "—"}</p>
                              {lastCat && <p style={{ fontSize: "0.75rem", color: lastCat.color, fontWeight: 600, margin: 0 }}>{lastCat.label}</p>}
                            </div>
                            <div style={s.statCard}>
                              <p style={s.statLabel}>10-reading avg</p>
                              <p style={{ ...s.statValue, color: cat?.color, fontFamily: "'Playfair Display', Georgia, serif" }}>{avg ? `${avg.systolic}/${avg.diastolic}` : "—"}</p>
                              {cat && <p style={{ fontSize: "0.75rem", color: cat.color, fontWeight: 600, margin: 0 }}>{cat.label}</p>}
                            </div>
                            <div style={s.statCard}>
                              <p style={s.statLabel}>Total readings</p>
                              <p style={s.statValue}>{bpReadings.length}</p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Chart */}
                      <div style={s.chartCard}>
                        <p style={s.chartTitle}>Trend — last 30 readings</p>
                        <BPChart readings={bpReadings}/>
                      </div>

                      {/* Recent readings */}
                      <div>
                        <p style={s.sectionLabel}>Recent readings</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {bpReadings.slice(0, 5).map(r => <BPReadingCard key={r.id} reading={r} onDelete={handleBpDelete}/>)}
                          {bpReadings.length > 5 && <button onClick={() => setBpView("history")} style={s.viewAllBtn}>View all {bpReadings.length} readings →</button>}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Reminders */}
                  <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem" }} className="no-print">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <div>
                        <p style={{ ...s.sectionLabel, marginBottom: "0.15rem" }}>Daily reminders</p>
                        <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0 }}>Get notified to take your BP at consistent times each day.</p>
                      </div>
                      <button onClick={() => setShowReminderForm(r => !r)} style={{ ...s.chartOptBtn, background: SAGE_DARK, color: "#fff", borderColor: SAGE_DARK, fontSize: "0.8rem" }}>+ Add time</button>
                    </div>

                    {showReminderForm && (
                      <div style={{ background: SAGE_LIGHT, borderRadius: "0.875rem", padding: "1rem", marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <label style={s.label}>Time</label>
                          <BPTimePicker value={reminderTime} onChange={setReminderTime}/>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1, minWidth: 160 }}>
                          <label style={s.label}>Label <span style={s.optional}>(optional)</span></label>
                          <input type="text" value={reminderLabel} onChange={e => setReminderLabel(e.target.value)} placeholder="e.g. Morning reading" style={s.input}/>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button onClick={handleAddReminder} style={s.saveBtn}>Save</button>
                          <button onClick={() => setShowReminderForm(false)} style={s.cancelBtn}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {bpReminders.length === 0 ? (
                      <p style={{ fontSize: "0.82rem", color: "#aaa", fontStyle: "italic" }}>No reminders set yet.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {bpReminders.map(r => (
                          <div key={r.id} style={{ borderRadius: "0.75rem", overflow: "hidden", background: r.enabled ? SAGE_LIGHT : "#f5f5f5" }}>
                            {/* View row */}
                            {editingReminderId !== r.id && (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                  <span style={{ color:"#7a9e87", display:"flex", alignItems:"center" }}><Icon name="alarm" size={16} /></span>
                                  <div>
                                    <p style={{ fontSize: "0.9rem", fontWeight: 600, color: INK, margin: 0 }}>
                                      {(() => {
                                        const [hh, mm] = r.time.split(":").map(Number);
                                        const p = hh >= 12 ? "PM" : "AM";
                                        const h12 = hh % 12 || 12;
                                        return `${h12}:${String(mm).padStart(2,"0")} ${p}`;
                                      })()}
                                    </p>
                                    {r.label && <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: 0 }}>{r.label}</p>}
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <button onClick={() => startEditReminder(r)} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.2rem 0.65rem", fontSize: "0.72rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                                  <button onClick={() => toggleReminder(r.id)} style={{ background: r.enabled ? SAGE_DARK : "#ccc", color: "#fff", border: "none", borderRadius: "100px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                    {r.enabled ? "On" : "Off"}
                                  </button>
                                  <button onClick={() => deleteReminder(r.id)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}><Icon name="close" size={16} /></button>
                                </div>
                              </div>
                            )}
                            {/* Inline edit row */}
                            {editingReminderId === r.id && (
                              <div style={{ padding: "0.875rem 1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: INK_LIGHT }}>Time</span>
                                  <BPTimePicker value={editTime} onChange={setEditTime}/>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: 140 }}>
                                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: INK_LIGHT }}>Label <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span></span>
                                  <input value={editLabel} onChange={e => setEditLabel(e.target.value)} style={{ ...s.input }} placeholder="e.g. Morning reading"/>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                  <button onClick={saveEditReminder} style={s.saveBtn}>Save</button>
                                  <button onClick={() => setEditingReminderId(null)} style={s.cancelBtn}>Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <p style={{ fontSize: "0.72rem", color: "#aaa", marginTop: "0.5rem", fontStyle: "italic" }}>
                          Note: Reminders require push notifications to be enabled in your browser. Full push support coming when backend is ready.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── History ── */}
              {bpView === "history" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <p style={s.sectionLabel}>{bpReadings.length} readings total</p>
                  {bpReadings.length === 0
                    ? <p style={{ fontSize: "0.85rem", color: WARM_GRAY }}>No readings yet.</p>
                    : bpReadings.map(r => <BPReadingCard key={r.id} reading={r} onDelete={handleBpDelete}/>)
                  }
                </div>
              )}

              {/* ── Care Team Report ── */}
              {bpView === "report" && (
                <div style={s.reportWrap}>
                  <div style={s.reportTopBar} className="no-print">
                    <p style={s.reportTopNote}>Formatted for your cardiologist. Print or save as PDF.</p>
                    <button onClick={handleBpPrint} style={s.printBtn}>↓ Save as PDF</button>
                  </div>
                  <div style={s.reportCard}>
                    <div style={s.reportHead}>
                      <BotanicalMark size={44}/>
                      <div>
                        <p style={s.reportEyebrow}>Care Compass · Blood Pressure Report</p>
                        <h2 style={s.reportTitle}>BP Tracking Summary</h2>
                        <p style={s.reportMeta}>
                          Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {bpReadings.length} readings
                          {bpReadings.length > 0 && ` · ${new Date(bpReadings[bpReadings.length - 1].timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(bpReadings[0].timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                        </p>
                      </div>
                    </div>

                    {/* Summary stats */}
                    {bpReadings.length > 0 && (() => {
                      const avg = bpAvgRecent();
                      const cat = avg ? bpCategory(avg.systolic, avg.diastolic) : null;
                      const highs = bpReadings.filter(r => r.systolic >= 140 || r.diastolic >= 90);
                      return (
                        <div style={s.reportSection}>
                          <h3 style={s.reportSectionTitle}>Summary</h3>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                            <div style={s.statCard}><p style={s.statLabel}>10-reading average</p><p style={{ ...s.statValue, color: cat?.color }}>{avg ? `${avg.systolic}/${avg.diastolic}` : "—"} <span style={s.statUnit}>mmHg</span></p></div>
                            <div style={s.statCard}><p style={s.statLabel}>Total readings</p><p style={s.statValue}>{bpReadings.length}</p></div>
                            <div style={s.statCard}><p style={s.statLabel}>High readings (≥140/90)</p><p style={{ ...s.statValue, color: highs.length > 0 ? "#c0392b" : SAGE_DARK }}>{highs.length}</p></div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Chart */}
                    {bpReadings.length >= 2 && (
                      <div style={s.reportSection}>
                        <h3 style={s.reportSectionTitle}>Trend Chart</h3>
                        <BPChart readings={bpReadings}/>
                      </div>
                    )}

                    {/* Full table */}
                    <div style={s.reportSection}>
                      <h3 style={s.reportSectionTitle}>Complete Reading Log</h3>
                      <table style={s.reportTable}>
                        <thead>
                          <tr>{["Date & Time", "Systolic", "Diastolic", "Pulse (bpm)", "Category", "Arm", "Position", "Notes"].map(h => <th key={h} style={s.reportTh}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {[...bpReadings].reverse().map((r, i) => {
                            const cat = bpCategory(r.systolic, r.diastolic);
                            return (
                              <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : OFF_WHITE }}>
                                <td style={s.reportTd}>{new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}<br/><span style={{ fontSize: "0.72rem", color: "#aaa" }}>{new Date(r.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span></td>
                                <td style={{ ...s.reportTd, textAlign: "center", fontWeight: 700, color: "#c0392b" }}>{r.systolic}</td>
                                <td style={{ ...s.reportTd, textAlign: "center", fontWeight: 700, color: TEAL }}>{r.diastolic}</td>
                                <td style={{ ...s.reportTd, textAlign: "center" }}>{r.pulse || "—"}</td>
                                <td style={s.reportTd}><span style={{ background: cat.bg, color: cat.color, fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "100px" }}>{cat.label}</span></td>
                                <td style={s.reportTd}>{r.arm || "—"}</td>
                                <td style={s.reportTd}>{r.position || "—"}</td>
                                <td style={s.reportTd}>{r.notes || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={s.reportFooter}>
                      <p style={s.reportFooterText}>Generated by Care Compass · joincarecompass.com · This is not a medical record. Please review with your healthcare provider.</p>
                    </div>
                    <InsightChat reportType="er" reportText={erAI || ""} accentColor="#c0392b" onRerun={handleGenerateER} />
                  </div>
                </div>
              )}

              {/* ── Log Reading Modal ── */}
              {showBpForm && (
                <div style={s.modalOverlay} onClick={() => setShowBpForm(false)}>
                  <div style={s.modal} onClick={e => e.stopPropagation()}>
                    <div style={s.modalHeader}>
                      <h2 style={s.modalTitle}>Log Blood Pressure Reading</h2>
                      <button onClick={() => setShowBpForm(false)} style={s.modalClose}><Icon name="close" size={16} /></button>
                    </div>
                    <div style={s.modalBody}>
                      {/* Systolic / Diastolic */}
                      <div style={{ background: SAGE_LIGHT, borderRadius: "1rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <p style={{ ...s.label, margin: 0, fontSize: "0.8rem", color: WARM_GRAY }}>Enter your reading from your BP monitor</p>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                          <div style={s.formGroup}>
                            <label style={s.label}>Systolic <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#aaa" }}>(top number)</span></label>
                            <input type="number" min="60" max="250" value={bpForm.systolic} onChange={e => setBpForm(f => ({ ...f, systolic: e.target.value }))} placeholder="e.g. 128" style={{ ...s.input, fontSize: "1.5rem", fontWeight: 700, textAlign: "center", color: "#c0392b" }} autoFocus/>
                          </div>
                          <div style={{ fontSize: "2rem", color: WARM_GRAY, paddingBottom: "0.6rem", fontWeight: 300 }}>/</div>
                          <div style={s.formGroup}>
                            <label style={s.label}>Diastolic <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#aaa" }}>(bottom number)</span></label>
                            <input type="number" min="40" max="150" value={bpForm.diastolic} onChange={e => setBpForm(f => ({ ...f, diastolic: e.target.value }))} placeholder="e.g. 82" style={{ ...s.input, fontSize: "1.5rem", fontWeight: 700, textAlign: "center", color: TEAL }}/>
                          </div>
                          <div style={{ fontSize: "0.85rem", color: WARM_GRAY, paddingBottom: "0.85rem" }}>mmHg</div>
                        </div>
                        {bpForm.systolic && bpForm.diastolic && (() => {
                          const cat = bpCategory(Number(bpForm.systolic), Number(bpForm.diastolic));
                          return <div style={{ background: cat.bg, color: cat.color, borderRadius: "0.65rem", padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: 700, textAlign: "center" }}>{cat.label}</div>;
                        })()}
                      </div>

                      {/* Pulse */}
                      <div style={s.formGroup}>
                        <label style={s.label}>Pulse <span style={s.optional}>(optional)</span></label>
                        <input type="number" min="30" max="200" value={bpForm.pulse} onChange={e => setBpForm(f => ({ ...f, pulse: e.target.value }))} placeholder="bpm" style={{ ...s.input, maxWidth: 140 }}/>
                      </div>

                      {/* Arm + Position */}
                      <div style={s.formRow}>
                        <div style={s.formGroup}>
                          <label style={s.label}>Arm used</label>
                          <select value={bpForm.arm} onChange={e => setBpForm(f => ({ ...f, arm: e.target.value }))} style={s.input}>
                            <option value="left">Left arm</option>
                            <option value="right">Right arm</option>
                          </select>
                        </div>
                        <div style={s.formGroup}>
                          <label style={s.label}>Position</label>
                          <select value={bpForm.position} onChange={e => setBpForm(f => ({ ...f, position: e.target.value }))} style={s.input}>
                            <option value="sitting">Sitting</option>
                            <option value="standing">Standing</option>
                            <option value="lying down">Lying down</option>
                          </select>
                        </div>
                      </div>

                      {/* Notes */}
                      <div style={s.formGroup}>
                        <label style={s.label}>Notes <span style={s.optional}>(optional)</span></label>
                        <textarea value={bpForm.notes} onChange={e => setBpForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. After exercise, felt stressed, took medication this morning..." rows={3} style={s.textarea}/>
                      </div>
                    </div>
                    <div style={s.modalFooter}>
                      <button onClick={() => setShowBpForm(false)} style={s.cancelBtn}>Cancel</button>
                      <button onClick={handleBpSubmit} disabled={!bpForm.systolic || !bpForm.diastolic} style={{ ...s.saveBtn, opacity: (!bpForm.systolic || !bpForm.diastolic) ? 0.5 : 1 }}>Save Reading</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === "meds" && (
            <div style={s.tabContent}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <p style={s.eyebrow}>Medications</p>
                  <h2 style={{ ...s.title, fontSize: "1.4rem", marginBottom: "0.25rem" }}>Your medication list</h2>
                  <p style={{ fontSize: "0.85rem", color: WARM_GRAY, margin: 0 }}>Saved meds appear as quick-select options when logging entries.</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button onClick={() => setShowBulk(b => !b)} style={{ ...s.cancelBtn, fontSize: "0.82rem" }}>↑ Bulk import</button>
                  <button onClick={() => { setMedForm({ name: "", dose: "", frequency: "", notes: "", reminder: false, reminderTime: "08:00" }); setMedEditId(null); setShowMedForm(true); }} style={s.addBtn}>+ Add medication</button>
                </div>
              </div>

              {medSaved && <div style={s.savedBanner}>Saved!</div>}

              {/* Bulk import */}
              {showBulk && (
                <div style={{ background: SAGE_LIGHT, borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <p style={{ ...s.sectionLabel, margin: 0 }}>Bulk import</p>
                  <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0 }}>Paste or type your medications — one per line, or separated by commas. Format: <em>Medication Name Dose</em> (e.g. "Metoprolol 25mg")</p>
                  <textarea
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    placeholder={"Metoprolol 25mg\nLevothyroxine 50mcg\nCetirizine 10mg\nOmeprazole 20mg"}
                    rows={5}
                    style={s.textarea}
                  />
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={handleBulkImport} disabled={!bulkText.trim()} style={{ ...s.saveBtn, opacity: bulkText.trim() ? 1 : 0.5 }}>Import</button>
                    <button onClick={() => { setShowBulk(false); setBulkText(""); }} style={s.cancelBtn}>Cancel</button>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "0.75rem" }}>
                    <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: "0 0 0.4rem", fontWeight: 600 }}>Or upload a file</p>
                    <label style={{ cursor: "pointer", display: "inline-block" }}>
                      <span style={{ ...s.uploadBtn, fontSize: "0.82rem" }}><span style={{ display:"inline-flex", alignItems:"center", gap:"0.35rem" }}><Icon name="attachment" size={16} /> Upload .txt or .csv file</span></span>
                      <input type="file" accept=".txt,.csv" style={{ display: "none" }} onChange={e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = evt => setBulkText(evt.target.result.slice(0, 5000));
                        reader.readAsText(file);
                        e.target.value = "";
                      }}/>
                    </label>
                  </div>
                </div>
              )}

              {/* Add / Edit form */}
              {showMedForm && (
                <div style={{ background: OFF_WHITE, borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <p style={{ ...s.sectionLabel, marginBottom: "1rem" }}>{medEditId ? "Edit medication" : "New medication"}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {/* Name + Dose */}
                    <div style={s.formRow}>
                      <div style={s.formGroup}>
                        <label style={s.label}>Medication name <span style={{ color: "#c0392b" }}>*</span></label>
                        <input value={medForm.name} onChange={e => setMedForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Metoprolol" style={s.input}/>
                      </div>
                      <div style={s.formGroup}>
                        <label style={s.label}>Dose <span style={s.optional}>(optional)</span></label>
                        <input value={medForm.dose} onChange={e => setMedForm(f => ({ ...f, dose: e.target.value }))} placeholder="e.g. 25mg, 1 tablet" style={s.input}/>
                      </div>
                    </div>

                    {/* Frequency */}
                    <div style={s.formGroup}>
                      <label style={s.label}>How often <span style={s.optional}>(optional)</span></label>
                      <SearchableSelect
                        value={medForm.frequency}
                        onChange={val => setMedForm(f => ({ ...f, frequency: val }))}
                        options={["", ...FREQUENCIES].map(f => ({ value: f, label: f || "Select frequency..." }))}
                        placeholder="Select frequency..."
                      />
                    </div>

                    {/* Notes */}
                    <div style={s.formGroup}>
                      <label style={s.label}>Notes <span style={s.optional}>(optional)</span></label>
                      <input value={medForm.notes} onChange={e => setMedForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Take on empty stomach, avoid grapefruit..." style={s.input}/>
                    </div>

                    {/* Reminder toggle */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
                        <input type="checkbox" checked={medForm.reminder} onChange={() => setMedForm(f => ({ ...f, reminder: !f.reminder }))} style={{ accentColor: SAGE_DARK, width: 16, height: 16 }}/>
                        <span style={{ fontSize: "0.875rem", color: INK }}>Set daily reminder</span>
                      </label>
                      {medForm.reminder && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingLeft: "1.5rem" }}>
                          <span style={{ fontSize: "0.8rem", color: WARM_GRAY }}>Remind me daily at</span>
                          <BPTimePicker value={medForm.reminderTime} onChange={val => setMedForm(f => ({ ...f, reminderTime: val }))}/>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                      <button onClick={() => { setShowMedForm(false); setMedEditId(null); setMedForm(blankMed); }} style={s.cancelBtn}>Cancel</button>
                      <button onClick={handleSaveMed} disabled={!medForm.name.trim()} style={{ ...s.saveBtn, opacity: medForm.name.trim() ? 1 : 0.5 }}>
                        {medEditId ? "Save changes" : "Add medication"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Medication list */}
              {medications.length === 0 && !showMedForm && !showBulk ? (
                <div style={s.emptyState}>
                  <div style={{ color:"#7a9e87", display:"flex", justifyContent:"center", marginBottom:"0.5rem" }}><Icon name="pill" size={32} /></div>
                  <h2 style={s.emptyTitle}>No medications yet</h2>
                  <p style={s.emptyDesc}>Add your medications once — then select them with one tap when logging daily entries.</p>
                  <button onClick={() => setShowMedForm(true)} style={s.addBtn}>+ Add first medication</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {medications.map(med => (
                    <div key={med.id} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK }}>{med.name}</span>
                          {med.dose && <span style={{ fontSize: "0.82rem", color: SAGE_DARK, fontWeight: 600 }}>{med.dose}</span>}
                          {med.frequency && <span style={{ fontSize: "0.75rem", color: WARM_GRAY, background: CREAM, borderRadius: "100px", padding: "0.15rem 0.6rem" }}>{med.frequency}</span>}
                        </div>
                        {med.notes && <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: "0 0 0.3rem", fontStyle: "italic" }}>{med.notes}</p>}
                        {med.reminder && (
                          <span style={{ fontSize: "0.7rem", background: SAGE_LIGHT, color: SAGE_DARK, borderRadius: "100px", padding: "0.15rem 0.6rem", fontWeight: 500 }}>
                            ⏰ {(() => {
                              const [hh, mm] = med.reminderTime.split(":").map(Number);
                              const p = hh >= 12 ? "PM" : "AM";
                              return `Daily ${hh % 12 || 12}:${String(mm).padStart(2,"0")} ${p}`;
                            })()}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                        <button onClick={() => handleEditMed(med)} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "6px", padding: "0.25rem 0.65rem", fontSize: "0.72rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                        <button onClick={() => handleDeleteMed(med.id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: "1rem" }}><Icon name="close" size={16} /></button>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: "0.72rem", color: "#aaa", textAlign: "center", marginTop: "0.5rem", fontStyle: "italic" }}>
                    {medications.length} medication{medications.length !== 1 ? "s" : ""} saved · These appear as quick-select options when logging entries
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

          {view === "labs" && (
            <div style={s.tabContent}>
              <div style={{ maxWidth: 720, margin: "0 auto" }}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <p style={s.eyebrow}>Lab Results</p>
                  <h2 style={{ ...s.title, fontSize: "1.4rem", marginBottom: "0.25rem" }}>Lab Results</h2>
                  <p style={{ fontSize: "0.85rem", color: WARM_GRAY, margin: 0 }}>Upload lab results, imaging reports, or test results for a plain-language breakdown cross-referenced with your symptoms and health profile.</p>
                </div>
                <LabResultsTab entries={entries} />
              </div>
            </div>
          )}
      </main>

      {/* ── Morning check-in modal ── */}
      {showMorningCheckin && (
        <div style={s.modalOverlay} onClick={() => setShowMorningCheckin(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ ...s.modalHeader, background: "linear-gradient(135deg, #fff8e8, #fff3d4)", borderBottom: "1px solid #f0d58a" }}>
              <h2 style={{ ...s.modalTitle, display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "1.05rem" }}>
                <MorningSunIcon size={18} /> Morning check-in
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
{/* SAGE_CHAT_DISABLED: Uncomment to re-enable "Tell Sage instead" in morning check-in
                <button onClick={() => { setShowMorningCheckin(false); setSageChatMode("morning"); setShowSageChat(true); }}
                  style={{ background: SAGE_LIGHT, border: `1px solid ${SAGE}`, borderRadius: "100px", padding: "0.3rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, color: SAGE_DARK, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  ✦ Tell Sage instead
                </button>
                */}
                <button onClick={() => setShowMorningCheckin(false)} style={s.modalClose}><Icon name="close" size={16} /></button>
              </div>
            </div>

            <div style={{ ...s.modalBody, gap: "1rem" }} className="cc-modal-body">

              {/* Severity — full width, prominent */}
              <div style={{ background: OFF_WHITE, borderRadius: "0.875rem", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                  <label style={{ ...s.label, margin: 0 }}>Overall severity this morning</label>
                  <span style={{ ...s.sevValue, fontSize: "1.1rem" }}>{morningForm.severity}<span style={{ fontSize: "0.7rem", fontWeight: 400, color: WARM_GRAY }}>/10</span></span>
                </div>
                <SeveritySlider value={morningForm.severity} onChange={v => setMorningForm(f => ({ ...f, severity: v }))}/>
              </div>

              {/* Sleep + Energy side by side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div style={{ background: OFF_WHITE, borderRadius: "0.875rem", padding: "0.875rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                    <label style={{ ...s.label, margin: 0, fontSize: "0.78rem" }}>Sleep quality</label>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: TEAL }}>{morningForm.sleep}/10</span>
                  </div>
                  <input type="range" min="1" max="10" step="1" value={morningForm.sleep}
                    onChange={e => setMorningForm(f => ({ ...f, sleep: Number(e.target.value) }))}
                    style={{ width: "100%", accentColor: TEAL, margin: "0.25rem 0" }}/>
                  <div style={s.sevLabels}><span style={s.sevLabel}>Poor</span><span style={s.sevLabel}>Great</span></div>
                </div>
                <div style={{ background: OFF_WHITE, borderRadius: "0.875rem", padding: "0.875rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                    <label style={{ ...s.label, margin: 0, fontSize: "0.78rem" }}>Energy level</label>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#e8a838" }}>{morningForm.energy}/10</span>
                  </div>
                  <input type="range" min="1" max="10" step="1" value={morningForm.energy}
                    onChange={e => setMorningForm(f => ({ ...f, energy: Number(e.target.value) }))}
                    style={{ width: "100%", accentColor: "#e8a838", margin: "0.25rem 0" }}/>
                  <div style={s.sevLabels}><span style={s.sevLabel}>Low</span><span style={s.sevLabel}>High</span></div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", margin: "0" }} />

              <div style={s.formGroup}>
                <label style={s.label}>Anything to note? <span style={s.optional}>(optional)</span></label>
                <textarea
                  value={morningForm.notes || morningForm.symptoms}
                  onChange={e => setMorningForm(f => ({ ...f, notes: e.target.value, symptoms: e.target.value }))}
                  onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" }), 320)}
                  placeholder="Symptoms on waking, sleep quality notes, anything worth capturing..."
                  style={{ ...s.textarea, width: "100%", boxSizing: "border-box" }}
                  rows={3}
                />
              </div>

            </div>

            <div style={{ ...s.modalFooter, justifyContent: "space-between" }}>
              <button onClick={() => setShowMorningCheckin(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={() => {
                saveCheckin("morning", { sleep: morningForm.sleep, severity: morningForm.severity, stress: morningForm.energy, symptoms: morningForm.notes, notes: morningForm.notes });
                setShowMorningCheckin(false);
                setCheckinSaved("Morning check-in saved!");
                setTimeout(() => setCheckinSaved(""), 3000);
                setMorningForm({ sleep: 7, severity: 5, symptoms: "", energy: 5, notes: "" });
              }} style={s.saveBtn}>Save check-in →</button>
            </div>

          </div>
        </div>
      )}

      {/* ── Evening check-in modal ── */}
      {showEveningCheckin && (() => {
        const todayEntries = entries.filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString() && e.tag !== "Evening check-in");
        const hasLoggedToday = todayEntries.length > 0;
        const todaySymptoms = [...new Set(todayEntries.map(e => e.symptoms).filter(Boolean))].join("; ");
        const todayActivity = [...new Set(todayEntries.map(e => e.activity).filter(Boolean))].join("; ");
        const todayFood = [...new Set(todayEntries.map(e => e.food).filter(Boolean))].join("; ");
        const avgSeverity = hasLoggedToday ? Math.round(todayEntries.reduce((s, e) => s + e.severity, 0) / todayEntries.length) : 5;
        return (
          <div style={s.modalOverlay} onClick={() => setShowEveningCheckin(false)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ ...s.modalHeader, background: "linear-gradient(135deg, #f0eeff, #e8e0ff)", borderBottom: "1px solid #c4aff5" }}>
                <h2 style={{ ...s.modalTitle, display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "1.05rem" }}>
                  <EveningMoonIcon size={18} /> Evening check-in
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
{/* SAGE_CHAT_DISABLED: Uncomment to re-enable "Tell Sage instead" in evening check-in
                  <button onClick={() => { setShowEveningCheckin(false); setSageChatMode("evening"); setShowSageChat(true); }}
                    style={{ background: SAGE_LIGHT, border: `1px solid ${SAGE}`, borderRadius: "100px", padding: "0.3rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, color: SAGE_DARK, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    ✦ Tell Sage instead
                  </button>
                  */}
                  <button onClick={() => setShowEveningCheckin(false)} style={s.modalClose}><Icon name="close" size={16} /></button>
                </div>
              </div>

              <div style={{ ...s.modalBody, gap: "1rem" }}>

                {/* Context banner */}
                {hasLoggedToday ? (
                  <div style={{ background: SAGE_LIGHT, borderRadius: "0.75rem", padding: "0.625rem 0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", color: SAGE_DARK }}>
                      You logged {todayEntries.length} {todayEntries.length === 1 ? "entry" : "entries"} today — just add anything you missed or want to capture overall.
                    </span>
                  </div>
                ) : (
                  <div style={{ background: "#fff8e8", borderRadius: "0.75rem", padding: "0.625rem 0.875rem", border: "1px solid #f0d58a" }}>
                    <span style={{ fontSize: "0.8rem", color: "#9a7a00" }}>No entries today yet — capture your full day here.</span>
                  </div>
                )}

                {/* Section: How was your day */}
                <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: 0 }}>How was your day</p>

                {/* Severity + Stress side by side */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ background: OFF_WHITE, borderRadius: "0.875rem", padding: "0.875rem", gridColumn: "1 / -1" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                      <label style={{ ...s.label, margin: 0 }}>Overall severity today</label>
                      <span style={{ ...s.sevValue, fontSize: "1.1rem" }}>{hasLoggedToday && eveningForm.severity === 5 ? avgSeverity : eveningForm.severity}<span style={{ fontSize: "0.7rem", fontWeight: 400, color: WARM_GRAY }}>/10</span></span>
                    </div>
                    <SeveritySlider value={hasLoggedToday && eveningForm.severity === 5 ? avgSeverity : eveningForm.severity} onChange={v => setEveningForm(f => ({ ...f, severity: v }))}/>
                    {hasLoggedToday && <p style={{ fontSize: "0.7rem", color: "#bbb", margin: "0.3rem 0 0", fontStyle: "italic" }}>Pre-set from your entries — adjust if today felt different overall</p>}
                  </div>
                  <div style={{ background: OFF_WHITE, borderRadius: "0.875rem", padding: "0.875rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                      <label style={{ ...s.label, margin: 0, fontSize: "0.78rem" }}>Stress level</label>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: SAGE_DARK }}>{eveningForm.stress}/10</span>
                    </div>
                    <input type="range" min="1" max="10" step="1" value={eveningForm.stress}
                      onChange={e => setEveningForm(f => ({ ...f, stress: Number(e.target.value) }))}
                      style={{ width: "100%", accentColor: SAGE_DARK, margin: "0.25rem 0" }}/>
                    <div style={s.sevLabels}><span style={s.sevLabel}>Low</span><span style={s.sevLabel}>High</span></div>
                  </div>
                  <div style={{ background: OFF_WHITE, borderRadius: "0.875rem", padding: "0.875rem" }}>
                    <label style={{ ...s.label, margin: "0 0 0.5rem", fontSize: "0.78rem", display: "block" }}>Energy used today</label>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      {[["Low", "#4A8C7A"], ["Med", "#e8a838"], ["High", "#c0392b"]].map(([level, color]) => {
                        const fullLabel = level === "Med" ? "Medium" : level;
                        const active = eveningForm.energyEnvelope === fullLabel;
                        return (
                          <button key={level} type="button"
                            onClick={() => setEveningForm(f => ({ ...f, energyEnvelope: active ? null : fullLabel }))}
                            style={{ flex: 1, padding: "0.4rem 0", borderRadius: "0.5rem", border: `1.5px solid ${active ? color : "rgba(0,0,0,0.12)"}`, background: active ? color : "transparent", color: active ? "#fff" : INK, fontSize: "0.75rem", fontWeight: active ? 700 : 400, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} />
                <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: 0 }}>Functional impact</p>

                <div style={s.formGroup}>
                  <label style={s.label}>{hasLoggedToday ? "Anything to add about symptoms?" : "How did you feel today?"} <span style={s.optional}>(optional)</span></label>
                  {hasLoggedToday && todaySymptoms && (
                    <div style={{ background: OFF_WHITE, borderRadius: "0.5rem", padding: "0.4rem 0.65rem", marginBottom: "0.4rem", fontSize: "0.72rem", color: WARM_GRAY, fontStyle: "italic", lineHeight: 1.5 }}>
                      Already noted: {todaySymptoms.length > 100 ? todaySymptoms.slice(0, 100) + "…" : todaySymptoms}
                    </div>
                  )}
                  <textarea value={eveningForm.symptoms} onChange={e => setEveningForm(f => ({ ...f, symptoms: e.target.value }))}
                      placeholder={hasLoggedToday ? "Anything that changed as the day went on?" : "Describe each symptom..."}
                      style={{ ...s.textarea, width: "100%", boxSizing: "border-box" }} rows={2}/>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>What did symptoms stop or limit you from doing? <span style={s.optional}>(optional)</span></label>
                  <textarea value={eveningForm.activity} onChange={e => setEveningForm(f => ({ ...f, activity: e.target.value }))}
                    placeholder="e.g. couldn't drive, had to sit while cooking, skipped the gym..."
                    style={s.textarea} rows={2}/>
                  {hasLoggedToday && todayActivity && (
                    <p style={{ fontSize: "0.7rem", color: "#bbb", margin: "0.25rem 0 0", fontStyle: "italic" }}>Already noted: {todayActivity.length > 80 ? todayActivity.slice(0,80)+"…" : todayActivity}</p>
                  )}
                </div>

                {/* Hours upright + Tasks */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ ...s.label, display: "block", marginBottom: "0.4rem" }}>Hours upright <span style={s.optional}>(optional)</span></label>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {["< 2h", "2–4h", "4–8h", "8+h"].map(opt => {
                        const active = eveningForm.hoursUpright === opt;
                        return (
                          <button key={opt} type="button"
                            onClick={() => setEveningForm(f => ({ ...f, hoursUpright: active ? null : opt }))}
                            style={{ padding: "0.35rem 0.65rem", borderRadius: "100px", border: `1.5px solid ${active ? SAGE_DARK : "rgba(0,0,0,0.15)"}`, background: active ? SAGE_DARK : "transparent", color: active ? "#fff" : INK, fontSize: "0.75rem", fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label style={{ ...s.label, display: "block", marginBottom: "0.4rem" }}>Tasks managed <span style={s.optional}>(optional)</span></label>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {[["Work", "Work / school"], ["Self-care", "Self-care"], ["Chores", "Chores"], ["Social", "Social / errands"]].map(([short, full]) => {
                        const checked = (eveningForm.tasksCompleted || []).includes(full);
                        return (
                          <button key={full} type="button"
                            onClick={() => setEveningForm(f => ({ ...f, tasksCompleted: checked ? (f.tasksCompleted || []).filter(t => t !== full) : [...(f.tasksCompleted || []), full] }))}
                            style={{ padding: "0.35rem 0.65rem", borderRadius: "100px", border: `1.5px solid ${checked ? TEAL : "rgba(0,0,0,0.15)"}`, background: checked ? TEAL : "transparent", color: checked ? "#fff" : INK, fontSize: "0.75rem", fontWeight: checked ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                            {checked ? "✓ " : ""}{short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Food/meds only if not logged today */}
                {!hasLoggedToday && (
                  <>
                    <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} />
                    <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: 0 }}>Food & medications</p>
                    <div style={s.formGroup}>
                      <label style={s.label}>Medications today</label>
                      <MedPicker
                        medications={medications}
                        selectedIds={eveningForm.selectedMedIds || []}
                        onToggle={id => setEveningForm(f => ({ ...f, selectedMedIds: (f.selectedMedIds || []).includes(id) ? (f.selectedMedIds || []).filter(i => i !== id) : [...(f.selectedMedIds || []), id] }))}
                        onAddAll={() => setEveningForm(f => ({ ...f, selectedMedIds: medications.map(m => m.id) }))}
                        manualText={eveningForm.medications}
                        onManualChange={val => setEveningForm(f => ({ ...f, medications: val }))}
                        onScanAdd={(scanned, saveToList) => {
                          const medStr = scanned.name + (scanned.dose ? ` ${scanned.dose}` : "");
                          setEveningForm(f => ({ ...f, medications: f.medications ? `${f.medications}, ${medStr}` : medStr }));
                          if (saveToList) {
                            try {
                              const existing = JSON.parse(localStorage.getItem(MED_STORAGE_KEY) || "[]");
                              if (!existing.some(m => m.name.toLowerCase() === scanned.name.toLowerCase())) {
                                existing.push({ id: Date.now() + Math.random(), name: scanned.name, dose: scanned.dose || "", frequency: scanned.frequency || "", notes: scanned.notes || "", reminder: false, reminderTime: "08:00" });
                                localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(existing));
                                setMedications(existing);
                              }
                            } catch {}
                          }
                        }}
                      />
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>Food & drink today <span style={s.optional}>(optional)</span></label>
                      <textarea value={eveningForm.food} onChange={e => setEveningForm(f => ({ ...f, food: e.target.value }))}
                        placeholder="Anything notable about what you ate or drank?"
                        style={s.textarea} rows={2}/>
                    </div>
                  </>
                )}

                {/* Reflections */}
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} />
                <div style={s.formGroup}>
                  <label style={s.label}>{hasLoggedToday ? "Anything else to reflect on?" : "Reflections"} <span style={s.optional}>(optional)</span></label>
                  <textarea value={eveningForm.notes} onChange={e => setEveningForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder={hasLoggedToday ? "Overall thoughts on today..." : "Anything you want to remember from today..."}
                      style={{ ...s.textarea, width: "100%", boxSizing: "border-box" }} rows={2}/>
                </div>

              </div>

              <div style={{ ...s.modalFooter, justifyContent: "space-between" }}>
                <button onClick={() => setShowEveningCheckin(false)} style={s.cancelBtn}>Cancel</button>
                <button onClick={() => {
                  const selectedMedsStr = buildMedString(eveningForm.selectedMedIds || []);
                  const finalMeds = [selectedMedsStr, eveningForm.medications].filter(Boolean).join(", ");
                  saveCheckin("evening", { ...eveningForm, medications: finalMeds });
                  setShowEveningCheckin(false);
                  setCheckinSaved("Evening check-in saved!");
                  setTimeout(() => setCheckinSaved(""), 3000);
                  setEveningForm({ severity: 5, symptoms: "", food: "", medications: "", selectedMedIds: [], activity: "", stress: 5, notes: "", hoursUpright: null, tasksCompleted: [], energyEnvelope: null });
                }} style={s.saveBtn}>Save check-in →</button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ── Delete confirmation ── */}
      <SafetyAlertModal
        triggers={safetyAlert?.triggers}
        bpCrisis={safetyAlert?.bpCrisis}
        onDismiss={() => setSafetyAlert(null)}
      />

      {confirmDeleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9500, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setConfirmDeleteId(null)}>
          <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "2rem", maxWidth: 360, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"0.75rem", color:"#c0392b" }}><Icon name="trash" size={32} /></div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.15rem", fontWeight: 700, color: INK, margin: "0 0 0.5rem", textAlign: "center" }}>Delete this entry?</h3>
            <p style={{ fontSize: "0.85rem", color: WARM_GRAY, textAlign: "center", margin: "0 0 1.5rem", lineHeight: 1.6 }}>This entry will be permanently removed from your tracker. This cannot be undone.</p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{ flex: 1, background: "transparent", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.7rem", fontSize: "0.875rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
              >Keep entry</button>
              <button
                onClick={confirmDelete}
                style={{ flex: 1, background: "#c0392b", color: "#fff", border: "none", borderRadius: "100px", padding: "0.7rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >Yes, delete</button>
            </div>
          </div>
        </div>
      )}

{/* SAGE_CHAT_DISABLED: Uncomment this entire block to re-enable Sage chat log entry
      {showSageChat && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9600, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "stretch" }} onClick={() => setShowSageChat(false)}>
          <div style={{ width: "100%", maxWidth: 540, margin: "0 auto", height: "100dvh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <SageLogChat
              mode={sageChatMode}
              onSave={handleSageLogSave}
              onCancel={() => setShowSageChat(false)}
              onSwitchToForm={handleSageToForm}
              previousContext={buildPreviousContext()}
            />
          </div>
        </div>
      )}
      */}

      {showForm && (
        <div style={s.modalOverlay} onClick={() => { setShowForm(false); }}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ ...s.modalHeader, background: editingEntry ? OFF_WHITE : SAGE_LIGHT, borderBottom: `1px solid ${editingEntry ? "rgba(0,0,0,0.07)" : "rgba(74,112,88,0.15)"}` }}>
              <h2 style={{ ...s.modalTitle, fontSize: "1.05rem" }}>
                {editingEntry ? "Edit entry" : "Log a symptom"}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
{/* SAGE_CHAT_DISABLED: Uncomment to re-enable "Tell Sage instead" in form header
                {!editingEntry && (
                  <button onClick={() => {
                    setShowForm(false);
                    const morningEndMins = morningStartMins + 4 * 60;
                    const mode = (nowMins >= morningStartMins && nowMins < morningEndMins) ? "morning" : isEveningTime ? "evening" : "intraday";
                    setSageChatMode(mode);
                    setShowSageChat(true);
                  }} style={{ background: "#fff", border: `1px solid ${SAGE}`, borderRadius: "100px", padding: "0.3rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, color: SAGE_DARK, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    ✦ Tell Sage instead
                  </button>
                )}
                */}
                <button onClick={() => { setShowForm(false); }} style={s.modalClose}><Icon name="close" size={16} /></button>
              </div>
            </div>

            <div style={{ ...s.modalBody, gap: "1rem" }} className="cc-modal-body">
              {userTrackedSymptoms.length > 0 && (() => {
                const freqMap = {};
                entries.forEach(e => (e.trackedSymptoms || []).forEach(ts => {
                  freqMap[ts.id] = (freqMap[ts.id] || 0) + 1;
                }));
                const hasHistory = Object.keys(freqMap).length > 0;
                const topIds = hasHistory
                  ? Object.entries(freqMap).sort((a,b) => b[1]-a[1]).slice(0,6).map(([id]) => id)
                  : ["fatigue","brain-fog","pain-head","dizziness","nausea","pain-joint"];
                const topSymptoms   = userTrackedSymptoms.filter(s => topIds.includes(s.id));
                const remainingSyms = userTrackedSymptoms.filter(s => !topIds.includes(s.id));
                const activeSymptoms = form.trackedSymptoms || [];

                const SymChip = ({ sym }) => {
                  const active = activeSymptoms.find(ts => ts.id === sym.id);
                  return (
                    <button type="button"
                      onClick={() => setForm(f => {
                        const cur = f.trackedSymptoms || [];
                        const exists = cur.find(ts => ts.id === sym.id);
                        return { ...f, trackedSymptoms: exists ? cur.filter(ts => ts.id !== sym.id) : [...cur, { id: sym.id, label: sym.label, severity: 5 }] };
                      })}
                      style={{ padding: "0.35rem 0.75rem", borderRadius: "100px", border: `1.5px solid ${active ? SAGE_DARK : "rgba(0,0,0,0.12)"}`, background: active ? SAGE_DARK : "transparent", color: active ? "#fff" : INK, fontSize: "0.78rem", fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      {sym.label}
                      {active && <span style={{ fontSize: "0.7rem", opacity: 0.85 }}>· {active.severity}/10</span>}
                    </button>
                  );
                };

                return (
                  <div style={s.formGroup}>
                    <label style={s.label}>What's bothering you? <span style={s.optional}>(tap to add, slide to rate)</span></label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {/* Top chips row */}
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        {topSymptoms.map(sym => <SymChip key={sym.id} sym={sym}/>)}
                      </div>

                      {/* Expand to full list */}
                      {remainingSyms.length > 0 && (
                        <div>
                          <button type="button" onClick={() => setShowAllSymptoms(v => !v)}
                            style={{ background: "none", border: "none", color: WARM_GRAY, fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.2)", padding: 0 }}>
                            {showAllSymptoms ? "Show fewer" : `+ ${remainingSyms.length} more symptoms`}
                          </button>
                          {showAllSymptoms && (
                            <div style={{ marginTop: "0.625rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              {Object.entries(
                                remainingSyms.reduce((acc, sym) => { if (!acc[sym.category]) acc[sym.category] = []; acc[sym.category].push(sym); return acc; }, {})
                              ).map(([cat, syms]) => (
                                <div key={cat}>
                                  <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.3rem" }}>{cat}</p>
                                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                                    {syms.map(sym => <SymChip key={sym.id} sym={sym}/>)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Active sliders — always below all chips */}
                      {activeSymptoms.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", background: SAGE_LIGHT, borderRadius: "0.625rem", padding: "0.625rem 0.875rem" }}>
                          {activeSymptoms.map(ts => (
                            <div key={ts.id} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: SAGE_DARK, minWidth: 110 }}>{ts.label}</span>
                              <input type="range" min="1" max="10" step="1" value={ts.severity}
                                onChange={e => setForm(f => ({ ...f, trackedSymptoms: (f.trackedSymptoms||[]).map(s => s.id === ts.id ? { ...s, severity: Number(e.target.value) } : s) }))}
                                style={{ flex: 1, accentColor: severityColor(ts.severity) }}
                              />
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: severityColor(ts.severity), minWidth: 28, textAlign: "right" }}>{ts.severity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── 2. Overall severity — auto when tracked symptoms active, manual otherwise ── */}
              {(() => {
                const tracked = form.trackedSymptoms || [];
                if (tracked.length > 0) {
                  const autoSev = Math.max(...tracked.map(ts => ts.severity));
                  const col = severityColor(autoSev);
                  return (
                    <div style={s.formGroup}>
                      <label style={s.label}>Overall severity</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: autoSev >= 7 ? "#fdeaea" : autoSev >= 4 ? "#fef3da" : SAGE_LIGHT, borderRadius: "0.625rem", padding: "0.625rem 0.875rem" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: col, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>{autoSev}</span>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: INK }}>
                            {autoSev >= 7 ? "Severe" : autoSev >= 4 ? "Moderate" : "Manageable"}
                          </p>
                          <p style={{ margin: 0, fontSize: "0.72rem", color: WARM_GRAY }}>
                            Auto-calculated from your highest symptom · {tracked.map(ts => `${ts.label} ${ts.severity}`).join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div style={s.formGroup}>
                    <label style={s.label}>Overall severity right now</label>
                    <SeveritySlider value={form.severity} onChange={v => setForm(f => ({ ...f, severity: v }))}/>
                  </div>
                );
              })()}

              {/* ── Detail fields — always visible, all optional ── */}
              {/* ── Symptom description + recent shortcuts ── */}
              <div style={s.formGroup}>
                <label style={s.label}>Describe your symptoms <span style={s.optional}>(optional)</span></label>
                <div style={{ position: "relative" }}>
                  <textarea
                    value={form.symptoms}
                    onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
                    placeholder="Where exactly, what it feels like, what triggered or worsened it…"
                    style={{ ...s.textarea, width: "100%", boxSizing: "border-box" }}
                    rows={3}
                  />
                </div>
                {/* ── Recent symptom shortcuts ── */}
                {(() => {
                  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
                  const recentText = entries
                    .filter(e => new Date(e.timestamp).getTime() >= cutoff && e.symptoms)
                    .map(e => e.symptoms).join(", ");
                  if (!recentText.trim()) return null;
                  const counts = {};
                  recentText.split(/[,;\n]+/).forEach(chunk => {
                    const word = chunk.trim().toLowerCase().replace(/[^a-z\s-]/g, "").trim();
                    if (word.length >= 3) counts[word] = (counts[word] || 0) + 1;
                  });
                  const chips = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,6)
                    .map(([w]) => w).filter(w => !form.symptoms.toLowerCase().includes(w));
                  if (!chips.length) return null;
                  return (
                    <div style={{ marginTop: "0.4rem" }}>
                      <p style={{ fontSize: "0.72rem", color: WARM_GRAY, margin: "0 0 0.35rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent phrases</p>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        {chips.map(chip => (
                          <button key={chip} type="button"
                            onClick={() => setForm(f => ({ ...f, symptoms: f.symptoms ? `${f.symptoms.trimEnd()}, ${chip}` : chip }))}
                            style={{ padding: "0.3rem 0.75rem", borderRadius: "100px", border: "1.5px solid rgba(0,0,0,0.12)", background: "transparent", color: WARM_GRAY, fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s" }}>
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Food & Drink</label>
                <textarea value={form.food} onChange={e => setForm(f => ({ ...f, food: e.target.value }))} placeholder="Have you eaten or had anything to drink?" style={{ ...s.textarea, width: "100%", boxSizing: "border-box" }} rows={2}/>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Medications taken</label>
                <MedPicker
                  medications={medications}
                  selectedIds={form.selectedMedIds || []}
                  onToggle={id => setForm(f => ({
                    ...f,
                    selectedMedIds: (f.selectedMedIds || []).includes(id)
                      ? (f.selectedMedIds || []).filter(i => i !== id)
                      : [...(f.selectedMedIds || []), id]
                  }))}
                  onAddAll={() => setForm(f => ({ ...f, selectedMedIds: medications.map(m => m.id) }))}
                  manualText={form.medications}
                  onManualChange={val => setForm(f => ({ ...f, medications: val }))}
                  onSaveUnlisted={{
                    enabled: form.saveUnlistedMed,
                    toggle: () => setForm(f => ({ ...f, saveUnlistedMed: !f.saveUnlistedMed }))
                  }}
                  onScanAdd={(scanned, saveToList) => {
                    const medStr = scanned.name + (scanned.dose ? ` ${scanned.dose}` : "");
                    setForm(f => ({ ...f, medications: f.medications ? `${f.medications}, ${medStr}` : medStr }));
                    if (saveToList) {
                      try {
                        const existing = JSON.parse(localStorage.getItem(MED_STORAGE_KEY) || "[]");
                        if (!existing.some(m => m.name.toLowerCase() === scanned.name.toLowerCase())) {
                          existing.push({ id: Date.now() + Math.random(), name: scanned.name, dose: scanned.dose || "", frequency: scanned.frequency || "", notes: scanned.notes || "", reminder: false, reminderTime: "08:00" });
                          localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(existing));
                          setMedications(existing);
                        }
                      } catch {}
                    }
                  }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div style={s.formGroup}>
                  <label style={s.label}>Activity & limitations</label>
                  <input value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
                    placeholder="e.g. couldn't drive, sat while cooking…" style={s.input}/>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Weather / environment</label>
                  <input value={form.weather} onChange={e => setForm(f => ({ ...f, weather: e.target.value }))}
                    placeholder="e.g. hot, humid, cold…" style={s.input}/>
                </div>
              </div>
              {/* ── Functional Impact — evening only ── */}
              {isEveningTime && (
                <div style={{ background: OFF_WHITE, borderRadius: "0.875rem", overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: 0, padding: "0.625rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>Functional impact</p>
                  <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <label style={{ ...s.label, display: "block", marginBottom: "0.4rem" }}>Hours upright today <span style={s.optional}>(optional)</span></label>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      {["< 2h", "2–4h", "4–8h", "8+h"].map(opt => {
                        const active = form.hoursUpright === opt;
                        return (
                          <button key={opt} type="button"
                            onClick={() => setForm(f => ({ ...f, hoursUpright: active ? null : opt }))}
                            style={{ padding: "0.4rem 0.875rem", borderRadius: "100px", border: `1.5px solid ${active ? SAGE_DARK : "rgba(0,0,0,0.15)"}`, background: active ? SAGE_DARK : "transparent", color: active ? "#fff" : INK, fontSize: "0.8rem", fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <label style={{ ...s.label, display: "block", marginBottom: "0.4rem" }}>Tasks managed <span style={s.optional}>(optional)</span></label>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      {[["Work", "Work / school"], ["Self-care", "Self-care"], ["Chores", "Chores"], ["Social", "Social / errands"]].map(([short, full]) => {
                        const checked = (form.tasksCompleted || []).includes(full);
                        return (
                          <button key={full} type="button"
                            onClick={() => setForm(f => ({ ...f, tasksCompleted: checked ? (f.tasksCompleted || []).filter(t => t !== full) : [...(f.tasksCompleted || []), full] }))}
                            style={{ padding: "0.4rem 0.875rem", borderRadius: "100px", border: `1.5px solid ${checked ? TEAL : "rgba(0,0,0,0.15)"}`, background: checked ? TEAL : "transparent", color: checked ? "#fff" : INK, fontSize: "0.8rem", fontWeight: checked ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                            {checked ? "✓ " : ""}{short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ padding: "0.875rem 1rem" }}>
                    <label style={{ ...s.label, display: "block", marginBottom: "0.4rem" }}>Energy envelope used <span style={s.optional}>(optional)</span></label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {[["Low", "#4A8C7A"], ["Medium", "#e8a838"], ["High", "#c0392b"]].map(([level, color]) => {
                        const active = form.energyEnvelope === level;
                        return (
                          <button key={level} type="button"
                            onClick={() => setForm(f => ({ ...f, energyEnvelope: active ? null : level }))}
                            style={{ flex: 1, padding: "0.5rem 0", borderRadius: "0.5rem", border: `1.5px solid ${active ? color : "rgba(0,0,0,0.12)"}`, background: active ? color : "transparent", color: active ? "#fff" : INK, fontSize: "0.8rem", fontWeight: active ? 700 : 400, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── More details card ── */}
              <div style={{ background: OFF_WHITE, borderRadius: "0.875rem", overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: 0, padding: "0.625rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>More details <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></p>

                <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)", display: "grid", gridTemplateColumns: form.sleep != null ? "1fr 1fr" : "1fr", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
                      <label style={{ ...s.label, margin: 0, fontSize: "0.78rem" }}>Stress level</label>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: SAGE_DARK }}>{form.stress}/10</span>
                    </div>
                    <input type="range" min="1" max="10" step="1" value={form.stress} onChange={e => setForm(f => ({ ...f, stress: Number(e.target.value) }))} style={{ width: "100%", accentColor: SAGE_DARK }}/>
                    <div style={s.sevLabels}><span style={s.sevLabel}>Low</span><span style={s.sevLabel}>High</span></div>
                  </div>
                  {form.sleep != null && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
                        <label style={{ ...s.label, margin: 0, fontSize: "0.78rem" }}>Sleep quality</label>
                        <span style={{ fontSize: "0.88rem", fontWeight: 700, color: TEAL }}>{form.sleep}/10</span>
                      </div>
                      <input type="range" min="1" max="10" step="1" value={form.sleep} onChange={e => setForm(f => ({ ...f, sleep: Number(e.target.value) }))} style={{ width: "100%", accentColor: TEAL }}/>
                      <div style={s.sevLabels}><span style={s.sevLabel}>Poor</span><span style={s.sevLabel}>Excellent</span></div>
                    </div>
                  )}
                </div>

                <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <label style={{ ...s.label, marginBottom: "0.4rem", display: "block" }}>Additional notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Anything else worth noting…" style={{ ...s.textarea, width: "100%", boxSizing: "border-box", background: "#fff" }} rows={2}/>
                </div>

                <div style={{ padding: "0.875rem 1rem" }}>
                  <label style={{ ...s.label, marginBottom: "0.4rem", display: "block" }}>Photos</label>
                  <label style={s.photoUploadArea}>
                    <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoUpload}/>
                    <span style={{ ...s.photoUploadIcon, color:"#7a9e87", display:"flex", alignItems:"center" }}><Icon name="camera" size={20} /></span>
                    <span style={s.photoUploadText}>Tap to add photos</span>
                    <span style={s.photoUploadSub}>Rashes, swelling, bruising — anything worth documenting</span>
                  </label>
                  {(form.photos || []).length > 0 && (
                    <div style={s.photoPreviewRow}>
                      {(form.photos || []).map((photo, idx) => (
                        <div key={idx} style={s.photoPreviewWrap}>
                          <img src={photo.data} alt={photo.name} style={s.photoPreview}/>
                          <button onClick={() => removePhoto(idx)} style={s.photoRemoveBtn}><Icon name="close" size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
            <div style={{ ...s.modalFooter, justifyContent: "space-between" }}>
              <button onClick={() => { setShowForm(false); }} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleSubmit} style={s.saveBtn}>{editingEntry ? "Update Entry →" : "Save Entry →"}</button>
            </div>
          </div>
        </div>
      )}

      <footer style={s.footer} className="no-print">
        <p style={s.footerText}>© {new Date().getFullYear()} Care Compass · <a href="mailto:hello@joincarecompass.com" style={s.footerLink}>hello@joincarecompass.com</a></p>
        <p style={s.footerDisclaimer}>Care Compass is not a medical service and does not provide medical advice, diagnosis, or treatment.</p>
      </footer>

      <div className="no-print">{!showMorningCheckin && !showEveningCheckin && !showForm && <SageChatbot hideOnAsk={view === "ask"} />}</div>

    </div>
  );
}

/* ─── Sage Chatbot ───────────────────────────────────────────────────────── */
const SAGE_KEYFRAMES = `
  @keyframes ffDrift { 0%,100%{transform:translate(0,0)} 33%{transform:translate(0.6px,-0.8px)} 66%{transform:translate(-0.5px,0.6px)} }
  @keyframes ffWingL { 0%,100%{transform-origin:50% 50%;transform:rotate(0deg) scaleY(1);opacity:0.55} 50%{transform-origin:50% 50%;transform:rotate(-18deg) scaleY(0.82);opacity:0.8} }
  @keyframes ffWingR { 0%,100%{transform-origin:50% 50%;transform:rotate(0deg) scaleY(1);opacity:0.55} 50%{transform-origin:50% 50%;transform:rotate(18deg) scaleY(0.82);opacity:0.8} }
  @keyframes ffLeaf  { 0%,100%{transform-origin:36px 36px;transform:scale(1)} 50%{transform-origin:36px 36px;transform:scale(1.03)} }
  @keyframes ffAntL  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-5deg)} }
  @keyframes ffAntR  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(5deg)} }
  @keyframes sageGreetIn  { from{opacity:0;transform:translateY(10px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes sageGreetOut { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(6px) scale(0.97)} }
  @keyframes sageDrawerIn { from{opacity:0;transform:translateY(12px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes ffFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-3px)} }
`;

/* Bare firefly — no circle background, no botanical petals. For button use. */
const FireflyBare = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ animation:"ffFloat 3s ease-in-out infinite", display:"block", flexShrink: 0 }}>
    {/* Body — cream so it reads against dark green */}
    <ellipse cx="36" cy="36" rx="4" ry="6.5" fill="#e8f5e0"/>
    {/* Wings — sage-light with more opacity */}
    <ellipse cx="28" cy="34" rx="8" ry="3.5" fill="#a8d4b0" opacity="0.85" style={{ animation:"ffWingL 0.6s ease-in-out infinite" }}/>
    <ellipse cx="44" cy="34" rx="8" ry="3.5" fill="#a8d4b0" opacity="0.85" style={{ animation:"ffWingR 0.6s ease-in-out infinite", animationDelay:"0.05s" }}/>
    {/* Antennae */}
    <g style={{ transformOrigin:"34.5px 30px", animation:"ffAntL 2.8s ease-in-out infinite" }}>
      <line x1="34.5" y1="30" x2="31" y2="25" stroke="#c8f0c0" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="31" cy="24.5" fill="#d4ffb0"><animate attributeName="r" values="1.2;2;1.2" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;1;0.7" dur="2.4s" repeatCount="indefinite"/></circle>
    </g>
    <g style={{ transformOrigin:"37.5px 30px", animation:"ffAntR 2.8s ease-in-out infinite", animationDelay:"0.4s" }}>
      <line x1="37.5" y1="30" x2="41" y2="25" stroke="#c8f0c0" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="41" cy="24.5" fill="#d4ffb0"><animate attributeName="r" values="1.2;2;1.2" dur="2.4s" begin="0.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;1;0.7" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle>
    </g>
    {/* Bioluminescent spots on body */}
    <ellipse cx="34.2" cy="33.5" fill="#d4ffb0">
      <animate attributeName="rx" values="1.5;1.5;1.5;0.2;1.5" dur="5s" keyTimes="0;0.7;0.85;0.9;1" repeatCount="indefinite"/>
      <animate attributeName="ry" values="1.5;1.5;1.5;0.15;1.5" dur="5s" keyTimes="0;0.7;0.85;0.9;1" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="37.8" cy="33.5" fill="#d4ffb0">
      <animate attributeName="rx" values="1.5;1.5;1.5;0.2;1.5" dur="5s" keyTimes="0;0.7;0.85;0.9;1" begin="0.08s" repeatCount="indefinite"/>
      <animate attributeName="ry" values="1.5;1.5;1.5;0.15;1.5" dur="5s" keyTimes="0;0.7;0.85;0.9;1" begin="0.08s" repeatCount="indefinite"/>
    </ellipse>
    {/* Glow — bright chartreuse, high opacity */}
    <circle cx="36" cy="41" r="5" fill="#aaff88" opacity="0.25"/>
    <circle cx="36" cy="41" fill="#d4ffb0">
      <animate attributeName="r" values="3;5;3" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite"/>
    </circle>
  </svg>
);

const FireflyMark = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ animation:"ffDrift 4s ease-in-out infinite", display:"block" }}>
    <circle cx="36" cy="36" r="34" fill="#e8f0eb" stroke="#7a9e87" strokeWidth="1"/>
    <g style={{ animation:"ffLeaf 3.5s ease-in-out infinite" }}>
      <ellipse cx="36" cy="17" rx="7" ry="17" fill="#4a7058"/>
      <ellipse cx="36" cy="55" rx="5.5" ry="13" fill="#7a9e87" opacity="0.55"/>
      <ellipse cx="55" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.8"/>
      <ellipse cx="17" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.45"/>
      <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.35" transform="rotate(42 36 36) translate(0 -14)"/>
      <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.35" transform="rotate(-42 36 36) translate(0 -14)"/>
      <ellipse cx="36" cy="36" rx="3.5" ry="9" fill="#4a9fa5" opacity="0.5" transform="rotate(135 36 36) translate(0 -14)"/>
      <ellipse cx="36" cy="36" rx="3.5" ry="9" fill="#4a9fa5" opacity="0.5" transform="rotate(-135 36 36) translate(0 -14)"/>
    </g>
    <ellipse cx="36" cy="36" rx="4" ry="6.5" fill="#2d4a35"/>
    <ellipse cx="28" cy="34" rx="8" ry="3.5" fill="#a8d4b0" opacity="0.55" style={{ animation:"ffWingL 0.6s ease-in-out infinite" }}/>
    <ellipse cx="44" cy="34" rx="8" ry="3.5" fill="#a8d4b0" opacity="0.55" style={{ animation:"ffWingR 0.6s ease-in-out infinite", animationDelay:"0.05s" }}/>
    <g style={{ transformOrigin:"34.5px 30px", animation:"ffAntL 2.8s ease-in-out infinite" }}>
      <line x1="34.5" y1="30" x2="31" y2="25" stroke="#4a7058" strokeWidth="0.9" strokeLinecap="round"/>
      <circle cx="31" cy="24.5" fill="#a8ffb0"><animate attributeName="r" values="1;1.6;1" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.4s" repeatCount="indefinite"/></circle>
    </g>
    <g style={{ transformOrigin:"37.5px 30px", animation:"ffAntR 2.8s ease-in-out infinite", animationDelay:"0.4s" }}>
      <line x1="37.5" y1="30" x2="41" y2="25" stroke="#4a7058" strokeWidth="0.9" strokeLinecap="round"/>
      <circle cx="41" cy="24.5" fill="#a8ffb0"><animate attributeName="r" values="1;1.6;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle>
    </g>
    <ellipse cx="34.2" cy="33.5" fill="#b8f0b0">
      <animate attributeName="rx" values="1.3;1.3;1.3;0.2;1.3" dur="5s" keyTimes="0;0.7;0.85;0.9;1" repeatCount="indefinite"/>
      <animate attributeName="ry" values="1.3;1.3;1.3;0.15;1.3" dur="5s" keyTimes="0;0.7;0.85;0.9;1" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="37.8" cy="33.5" fill="#b8f0b0">
      <animate attributeName="rx" values="1.3;1.3;1.3;0.2;1.3" dur="5s" keyTimes="0;0.7;0.85;0.9;1" begin="0.08s" repeatCount="indefinite"/>
      <animate attributeName="ry" values="1.3;1.3;1.3;0.15;1.3" dur="5s" keyTimes="0;0.7;0.85;0.9;1" begin="0.08s" repeatCount="indefinite"/>
    </ellipse>
    <circle cx="36" cy="41" r="3" fill="#7fff7a" opacity="0.18"/>
    <circle cx="36" cy="41" fill="#c8ffb0">
      <animate attributeName="r" values="2.8;4;2.8" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.25;1;0.25" dur="1.8s" repeatCount="indefinite"/>
    </circle>
  </svg>
);


/* ─── InsightChat — inline "Ask Sage about this report" panel ─────────────── */
/**
 * Self-contained panel that appears at the bottom of any AI-generated result.
 * Props:
 *   reportType  — "insights" | "doctor" | "er" | "labs" | "assessment"
 *   reportText  — the full AI-generated text for this report (injected as context)
 *   accentColor — optional hex for the header stripe (defaults to SAGE_DARK)
 */
function InsightChat({ reportType, reportText, accentColor, onRerun }) {
  const [open, setOpen]             = React.useState(false);
  const [messages, setMessages]     = React.useState([]);
  const [input, setInput]           = React.useState("");
  const [loading, setLoading]       = React.useState(false);
  const [note, setNote]             = React.useState("");
  const [noteSaved, setNoteSaved]   = React.useState(false);
  const [tab, setTab]               = React.useState("chat");
  const [rerunning, setRerunning]   = React.useState(false);
  const endRef = React.useRef(null);
  const accent = accentColor || "#4a7058";

  // All user messages joined — this is the additional context to inject on re-run
  const userContext = messages.filter(m => m.role === "user").map(m => m.content).join("\n").trim();
  const hasContext  = userContext.length > 20 && !!onRerun;

  React.useEffect(() => {
    if (open && endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const SUGGESTIONS = {
    insights: [
      "What does this pattern mean for my day-to-day life?",
      "Which of these findings should I prioritise with my doctor?",
      "I forgot to mention I had surgery — does that change anything?",
      "Can you explain what you mean by [section name]?",
    ],
    doctor: [
      "Can you help me prepare for how to explain this to my doctor?",
      "I remembered something I didn't log — how do I add it?",
      "What does this term in my report mean?",
      "Which questions here are most important to raise?",
    ],
    er: [
      "What information is most important for triage staff?",
      "I want to add an allergy I forgot — can you help?",
      "How do I explain my condition quickly to a nurse?",
      "What should I do if staff dismiss my history?",
    ],
    labs: [
      "What does this result mean in plain language?",
      "My doctor said this is normal — why does the report flag it?",
      "I had a follow-up test since this — does that matter?",
      "Which result should I ask my doctor about first?",
    ],
    assessment: [
      "Can you explain what this pattern means?",
      "I forgot to mention a previous surgery or test.",
      "Which specialist recommendation should I follow up on first?",
      "What questions should I bring to my first appointment?",
    ],
  };

  const systemPrompt = `You are Sage, a warm and knowledgeable Care Compass health navigation guide. The user is reviewing an AI-generated ${reportType} report and has questions or wants to add context.

REPORT CONTENT (use this as your primary reference — answer questions based on it):
---
${(reportText || "").slice(0, 6000)}
---

Your role:
- Help the user understand specific terms, findings, or recommendations in their report
- If they mention something they forgot to include (a surgery, test, medication, condition), acknowledge it, explain how it might be relevant to what the report says, and suggest they note it down or re-run the report
- Be warm, specific, and reference actual content from their report where relevant
- Never diagnose or prescribe. Use language like "worth discussing with your doctor", "may be relevant because..."
- Keep responses concise — 2-4 sentences unless the question genuinely needs more
- No bullet points or markdown symbols. Write in natural prose.
- If they ask something unrelated to their health or this report, gently redirect.`;

  const send = async (text) => {
    const t = (text || input).trim();
    if (!t || loading) return;
    const next = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 600, system: systemPrompt, messages: next }),
      });
      const data  = await res.json();
      const reply = data.content?.[0]?.text || "I'm having trouble connecting. Please try again.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const saveNote = () => {
    if (!note.trim()) return;
    try {
      const key  = `cc-insight-notes-${reportType}`;
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push({ text: note.trim(), timestamp: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 3000);
    setNote("");
  };

  const suggestions = SUGGESTIONS[reportType] || SUGGESTIONS.insights;

  /* ── Collapsed teaser ── */
  if (!open) return (
    <div className="no-print" style={{ background: "#fff", borderRadius: "1.25rem", border: `1.5px solid ${accent}22`, padding: "1.1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#e8f0eb", border: "1.5px solid #c2d9c8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 72 72" fill="none">
            <ellipse cx="36" cy="17" rx="7" ry="17" fill="#4a7058"/>
            <ellipse cx="55" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.8"/>
            <ellipse cx="17" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.45"/>
            <circle cx="36" cy="36" r="7" fill="#4a7058"/>
            <circle cx="36" cy="36" r="3" fill="#e8f0eb"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2d2926", margin: "0 0 0.1rem" }}>Questions about this report?</p>
          <p style={{ fontSize: "0.78rem", color: "#6b6560", margin: 0 }}>Ask Sage to explain any finding, or add something you forgot to include.</p>
        </div>
      </div>
      <button onClick={() => setOpen(true)}
        style={{ background: accent, color: "#fff", border: "none", borderRadius: "100px", padding: "0.6rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
        Ask Sage →
      </button>
    </div>
  );

  /* ── Open panel ── */
  return (
    <div className="no-print" style={{ background: "#fff", borderRadius: "1.25rem", border: `1.5px solid ${accent}33`, overflow: "hidden", marginTop: "0.5rem" }}>

      {/* Header */}
      <div style={{ background: accent, padding: "0.875rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <svg width="16" height="16" viewBox="0 0 72 72" fill="none">
            <ellipse cx="36" cy="17" rx="7" ry="17" fill="#e8f0eb"/>
            <ellipse cx="55" cy="36" rx="17" ry="7" fill="#e0f2f4" opacity="0.9"/>
            <circle cx="36" cy="36" r="7" fill="#e8f0eb"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#fff" }}>Ask Sage about this report</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button onClick={() => setTab("chat")} style={{ background: tab === "chat" ? "rgba(255,255,255,0.25)" : "transparent", color: "#fff", border: "none", borderRadius: "100px", padding: "0.3rem 0.75rem", fontSize: "0.78rem", fontWeight: tab === "chat" ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>Chat</button>
          <button onClick={() => setTab("note")} style={{ background: tab === "note" ? "rgba(255,255,255,0.25)" : "transparent", color: "#fff", border: "none", borderRadius: "100px", padding: "0.3rem 0.75rem", fontSize: "0.78rem", fontWeight: tab === "note" ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>Add a note</button>
          <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 28, height: 28, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.85rem" }}>✕</button>
        </div>
      </div>

      {tab === "note" ? (
        /* ── Add-a-note tab ── */
        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#2d2926", margin: "0 0 0.25rem" }}>Add something you remembered</p>
            <p style={{ fontSize: "0.78rem", color: "#6b6560", margin: 0, lineHeight: 1.6 }}>Forgot a previous surgery, test result, or medication? Jot it here — it'll be saved and you can reference it when you re-run this report or share it with your doctor.</p>
          </div>
          <div style={{ position: "relative" }}>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Had gallbladder removed in 2019. Also had a thyroid ultrasound in March — it showed a small nodule they said was benign..."
              rows={4}
              style={{ width: "100%", boxSizing: "border-box", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "0.875rem", color: "#2d2926", background: "#fafaf8", outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button onClick={saveNote} disabled={!note.trim()}
              style={{ background: note.trim() ? accent : "#ccc", color: "#fff", border: "none", borderRadius: "100px", padding: "0.65rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: note.trim() ? "pointer" : "default", fontFamily: "inherit" }}>
              Save note →
            </button>
            {noteSaved && <span style={{ fontSize: "0.82rem", color: accent, fontWeight: 600 }}>✓ Saved</span>}
          </div>
          <p style={{ fontSize: "0.75rem", color: "#aaa", margin: 0, fontStyle: "italic" }}>Notes are saved to this device only. To update your report with this information, switch to Chat and tell Sage, or re-run the report and include it.</p>
        </div>
      ) : (
        /* ── Chat tab ── */
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Message area */}
          <div style={{ maxHeight: 340, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <p style={{ fontSize: "0.82rem", color: "#6b6560", margin: 0, fontStyle: "italic", textAlign: "center", paddingBottom: "0.5rem" }}>I've read your report. Ask me anything about it, or tap a suggestion below.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {suggestions.map(q => (
                    <button key={q} onClick={() => send(q)}
                      style={{ background: "#f0f7f2", border: "1px solid #c2d9c8", borderRadius: "100px", padding: "0.35rem 0.875rem", fontSize: "0.78rem", color: "#4a7058", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", lineHeight: 1.4, textAlign: "left" }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? accent : "#e8f0eb",
                color: m.role === "user" ? "#fff" : "#2d2926",
                borderRadius: m.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                padding: "0.65rem 0.9rem", fontSize: "0.875rem", lineHeight: 1.6,
                maxWidth: "85%",
              }}>{m.content}</div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", background: "#e8f0eb", borderRadius: "1rem 1rem 1rem 0.25rem", padding: "0.65rem 0.9rem" }}>
                <span style={{ color: "#7a9e87", letterSpacing: "0.1em", fontSize: "0.75rem" }}>●&nbsp;●&nbsp;●</span>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          {/* Re-run banner — appears once user has shared meaningful context */}
          {hasContext && (
            <div style={{ margin: "0 0.75rem 0.75rem", background: "#f0f7f2", border: `1.5px solid ${accent}44`, borderRadius: "0.875rem", padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <div>
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#2d2926", margin: "0 0 0.2rem" }}>Re-run with your new context?</p>
                <p style={{ fontSize: "0.75rem", color: "#6b6560", margin: 0, lineHeight: 1.55 }}>
                  You've shared information Sage thinks would improve this report. Re-running will generate a fresh report with everything you've mentioned included.
                </p>
              </div>
              <div style={{ background: "#fff", borderRadius: "0.6rem", padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "#4a4540", fontStyle: "italic", lineHeight: 1.55, border: "1px solid rgba(0,0,0,0.07)", maxHeight: 72, overflowY: "auto" }}>
                {userContext.length > 200 ? userContext.slice(0, 200) + "…" : userContext}
              </div>
              <button
                onClick={async () => {
                  setRerunning(true);
                  try { await onRerun(userContext); } finally { setRerunning(false); }
                }}
                disabled={rerunning}
                style={{ background: rerunning ? "#aaa" : accent, color: "#fff", border: "none", borderRadius: "100px", padding: "0.6rem 1.25rem", fontSize: "0.82rem", fontWeight: 600, cursor: rerunning ? "default" : "pointer", fontFamily: "inherit", alignSelf: "flex-start" }}>
                {rerunning ? "Re-running…" : "↻ Re-run report with this context"}
              </button>
            </div>
          )}

          {/* Input row */}
          <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#fafaf8", display: "flex", gap: "0.5rem" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about this report…"
              disabled={loading}
              style={{ flex: 1, padding: "0.65rem 0.9rem", borderRadius: "0.75rem", border: "1.5px solid rgba(0,0,0,0.1)", fontSize: "0.875rem", fontFamily: "inherit", color: "#2d2926", background: "#fff", outline: "none" }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              style={{ width: 40, height: 40, borderRadius: "0.75rem", background: (loading || !input.trim()) ? "#ccc" : accent, color: "#fff", border: "none", cursor: (loading || !input.trim()) ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


const TRACKER_SYSTEM_PROMPT = `You are Sage, the friendly Care Compass guide on the symptom tracker. Care Compass helps people with chronic illness track symptoms, food, medications, sleep, stress, and blood pressure over time to surface patterns and generate doctor-ready reports.

Help users with questions about how to use the tracker effectively — what to log, how detailed to be, what the AI insights do, how to use the doctor report, and how their data stays private. Be warm, encouraging, and concise — 2-3 sentences max. No bullet points or markdown. Never give medical advice.`;

const TRACKER_SUGGESTIONS = [
  "How detailed should my entries be?",
  "What do the AI insights do?",
  "How do I generate a care team report?",
  "How is my tracking data stored?",
  "What's the morning check-in for?",
  "How does the blood pressure log work?",
];

function SageChatbot({ hideOnAsk = false }) {
  // greeting phases: "hidden" | "showing" | "fading" | "gone"
  const [greetPhase, setGreetPhase] = useState("hidden");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Show greeting after 3s, fade after 3.5s of display, remove after fade
    const showTimer  = setTimeout(() => setGreetPhase("showing"), 3000);
    const fadeTimer  = setTimeout(() => setGreetPhase("fading"),  6500);
    const goneTimer  = setTimeout(() => setGreetPhase("gone"),    7200);
    return () => { clearTimeout(showTimer); clearTimeout(fadeTimer); clearTimeout(goneTimer); };
  }, []);

  useEffect(() => {
    if (open && messagesEndRef.current)
      messagesEndRef.current.scrollIntoView({ behavior:"smooth" });
  }, [messages, open]);

  const sendMessageWith = async (text) => {
    if (!text || loading) return;
    const newMessages = [...messages, { role:"user", content:text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:TRACKER_SYSTEM_PROMPT, messages:newMessages }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I'm having trouble connecting. Please try again in a moment.";
      setMessages([...newMessages, { role:"assistant", content:reply }]);
    } catch {
      setMessages([...newMessages, { role:"assistant", content:"I'm having trouble connecting. Please try again in a moment." }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => { const t = input.trim(); if (t) await sendMessageWith(t); };
  const handleKey = (e) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const openChat = () => { setOpen(true); setGreetPhase("gone"); };

  return (
    <>
      <style>{SAGE_KEYFRAMES}</style>

      {/* Auto-fading greeting bubble — hidden on ask tab */}
      {!hideOnAsk && (greetPhase === "showing" || greetPhase === "fading") && !open && (
        <div style={{
          position:"fixed", bottom:"5.75rem", right:"1.5rem",
          background:"#fff", borderRadius:"1rem",
          boxShadow:"0 4px 32px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.06)",
          padding:"0.875rem 1.1rem", maxWidth:240, zIndex:9000,
          animation: greetPhase === "showing"
            ? "sageGreetIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards"
            : "sageGreetOut 0.65s ease forwards",
          pointerEvents: greetPhase === "fading" ? "none" : "auto",
        }}>
          <p style={{ margin:"0 0 0.2rem", fontSize:"0.88rem", fontWeight:600, color:"#4a7058" }}>Hi, I'm Sage! 🌿</p>
          <p style={{ margin:0, fontSize:"0.82rem", color:"#2d2926", lineHeight:1.5 }}>Questions about your tracker? Tap me anytime.</p>
        </div>
      )}

      {/* Chat drawer */}
      {open && (
        <div className="no-print" style={ss.drawer}>
          <div style={ss.drawerHeader}>
            <div style={ss.drawerHeaderLeft}>
              <FireflyMark size={44}/>
              <div>
                <div style={ss.drawerName}>Sage</div>
                <div style={ss.drawerSub}>Your Care Compass guide</div>
              </div>
            </div>
            <button style={ss.drawerClose} onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>
          <div style={ss.messages}>
            {messages.length === 0 && (
              <div>
                <div style={ss.emptyState}>Questions about tracking? I'm here to help.</div>
                <div style={ss.suggestedWrap}>
                  {TRACKER_SUGGESTIONS.map(q => (
                    <button key={q} style={ss.suggestedPill} onClick={() => sendMessageWith(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={m.role==="user" ? ss.userBubble : ss.sageBubble}>{m.content}</div>
            ))}
            {loading && <div style={ss.sageBubble}><span style={ss.typing}>●&nbsp;●&nbsp;●</span></div>}
            <div ref={messagesEndRef}/>
          </div>
          <div style={ss.inputRow}>
            <input style={ss.chatInput} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey} placeholder="Ask Sage a question…" disabled={loading}/>
            <button style={ss.sendBtn} onClick={sendMessage} disabled={loading || !input.trim()} aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB — hidden on ask tab to avoid blocking SageAskWidget */}
      {!open && !hideOnAsk && (
        <button className="no-print" style={ss.fab} onClick={openChat} aria-label="Chat with Sage">
          <FireflyMark size={48}/>
        </button>
      )}
    </>
  );
}

const ss = {
  fab:{ position:"fixed", bottom:"1.5rem", right:"1.5rem", width:68, height:68, borderRadius:"50%", background:"#e8f0eb", border:"2px solid #c2d9c8", boxShadow:"0 4px 24px rgba(74,112,88,0.18)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9000, padding:0 },
  drawer:{ position:"fixed", bottom:"1.5rem", right:"1.5rem", width:340, maxWidth:"calc(100vw - 2rem)", maxHeight:"70vh", background:"#fff", borderRadius:"1.25rem", boxShadow:"0 8px 48px rgba(0,0,0,0.14)", border:"1px solid rgba(0,0,0,0.07)", display:"flex", flexDirection:"column", zIndex:9000, overflow:"hidden", animation:"sageDrawerIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" },
  drawerHeader:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.1rem", borderBottom:"1px solid rgba(0,0,0,0.06)", background:"#fafaf8" },
  drawerHeaderLeft:{ display:"flex", alignItems:"center", gap:"0.75rem" },
  drawerName:{ fontWeight:700, fontSize:"0.95rem", color:"#2d2926", lineHeight:1.2 },
  drawerSub:{ fontSize:"0.75rem", color:"#7a9e87" },
  drawerClose:{ background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:"1rem", padding:"4px", lineHeight:1 },
  messages:{ flex:1, overflowY:"auto", padding:"1rem", display:"flex", flexDirection:"column", gap:"0.75rem" },
  emptyState:{ fontSize:"0.875rem", color:"#aaa", textAlign:"center", lineHeight:1.6, padding:"1rem 0.5rem 0.75rem", fontStyle:"italic" },
  suggestedWrap:{ display:"flex", flexWrap:"wrap", gap:"0.45rem", justifyContent:"center", padding:"0 0.25rem 0.5rem" },
  suggestedPill:{ background:"#f0f7f2", border:"1px solid #c2d9c8", borderRadius:"100px", padding:"0.4rem 0.85rem", fontSize:"0.78rem", color:"#4a7058", fontWeight:600, cursor:"pointer", fontFamily:"inherit", lineHeight:1.4 },
  userBubble:{ alignSelf:"flex-end", background:"#4a7058", color:"#fff", borderRadius:"1rem 1rem 0.25rem 1rem", padding:"0.65rem 0.9rem", fontSize:"0.88rem", lineHeight:1.5, maxWidth:"82%" },
  sageBubble:{ alignSelf:"flex-start", background:"#e8f0eb", color:"#2d2926", borderRadius:"1rem 1rem 1rem 0.25rem", padding:"0.65rem 0.9rem", fontSize:"0.88rem", lineHeight:1.5, maxWidth:"82%" },
  typing:{ color:"#7a9e87", letterSpacing:"0.1em", fontSize:"0.75rem" },
  inputRow:{ display:"flex", gap:"0.5rem", padding:"0.75rem", borderTop:"1px solid rgba(0,0,0,0.06)", background:"#fafaf8" },
  chatInput:{ flex:1, padding:"0.65rem 0.9rem", borderRadius:"0.75rem", border:"1.5px solid rgba(0,0,0,0.1)", fontSize:"0.88rem", fontFamily:"inherit", color:"#2d2926", background:"#fff", outline:"none" },
  sendBtn:{ width:40, height:40, borderRadius:"0.75rem", background:"#4a7058", color:"#fff", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
};

const s = {
  root: { fontFamily: "'DM Sans', Helvetica, sans-serif", color: INK, background: OFF_WHITE, minHeight: "100vh", display: "flex", flexDirection: "column" },
  nav: { padding: "1rem 2rem", borderBottom: `1px solid rgba(0,0,0,0.07)`, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 },
  navLogo: { display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" },
  navLogoText: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: SAGE_DARK },
  navLinks: { display: "flex", alignItems: "center", gap: "1.5rem" },
  navLink: { fontSize: "0.875rem", color: WARM_GRAY, textDecoration: "none" },
  navActive: { fontSize: "0.875rem", color: SAGE_DARK, fontWeight: 600 },
  main: { flex: 1, padding: "2.5rem 1.5rem" },
  container: { maxWidth: 860, margin: "0 auto" },
  header: { marginBottom: "0.5rem" },
  eyebrow: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.35rem" },
  title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: INK, margin: "0 0 0.5rem", letterSpacing: "-0.02em" },
  subtitle: { fontSize: "0.95rem", color: WARM_GRAY, lineHeight: 1.7, margin: 0 },
  addBtnWrap: { display: "flex", justifyContent: "center", margin: "1.25rem 0 1.5rem" },
  addBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.85rem 2.25rem", borderRadius: "100px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" },
  statCard: { background: "#fff", borderRadius: "0.75rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1rem", textAlign: "center" },
  statLabel: { fontSize: "0.75rem", color: WARM_GRAY, margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" },
  statValue: { fontSize: "1.75rem", fontWeight: 700, color: SAGE_DARK, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" },
  tabs: { display: "flex", borderBottom: `1px solid rgba(0,0,0,0.08)`, marginBottom: "1.5rem", gap: "0.1rem", overflowX: "auto" },
  tab: { padding: "0.75rem 1rem", background: "transparent", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", fontSize: "0.875rem", fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap" },
  tabContent: { minHeight: 300 },
  savedBanner: { background: SAGE_LIGHT, color: SAGE_DARK, padding: "0.75rem 1.25rem", borderRadius: "0.75rem", fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", textAlign: "center" },
  chartCard: { background: "#fff", borderRadius: "1rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1.5rem", marginBottom: "1.5rem" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" },
  chartTitle: { fontSize: "0.85rem", fontWeight: 600, color: WARM_GRAY, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" },
  chartSelector: { display: "flex", gap: "0.4rem", flexWrap: "wrap" },
  chartOptBtn: { padding: "0.35rem 0.85rem", borderRadius: "100px", border: "1px solid", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },
  chartEmpty: { fontSize: "0.9rem", color: "#aaa", textAlign: "center", padding: "2rem" },
  recentEntries: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  recentHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.25rem" },
  dateFilterWrap: { display: "flex", gap: "0.3rem" },
  dateFilterBtn: { padding: "0.3rem 0.75rem", borderRadius: "100px", border: "1px solid", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },
  noEntriesMsg: { fontSize: "0.9rem", color: "#aaa", textAlign: "center", padding: "2rem 0", margin: 0 },
  sectionLabel: { fontSize: "0.8rem", fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.75rem" },
  entryCard: { background: "#fff", borderRadius: "0.75rem", border: `1px solid rgba(0,0,0,0.07)`, overflow: "hidden" },
  entryCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "1rem 1.25rem", cursor: "pointer", gap: "0.5rem" },
  entryCardLeft: { display: "flex", alignItems: "flex-start", gap: "0.75rem", flex: 1, minWidth: 0 },
  entryCardRight: { display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 },
  severityBadge: { color: "#fff", fontSize: "0.8rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: "100px", whiteSpace: "nowrap", flexShrink: 0 },
  entryDate: { fontSize: "0.78rem", color: WARM_GRAY, margin: "0 0 0.2rem" },
  entryPreview: { fontSize: "0.9rem", color: INK, margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  expandChevron: { fontSize: "0.7rem", color: "#aaa" },
  editEntryBtn: { background: "transparent", border: `1px solid ${SAGE}`, color: SAGE_DARK, fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "100px", cursor: "pointer", fontFamily: "inherit" },
  deleteBtn: { background: "transparent", border: "none", color: "#ccc", cursor: "pointer", fontSize: "0.8rem", padding: "0.25rem 0.5rem" },
  entryDetail: { padding: "0.75rem 1.25rem 1rem", borderTop: `1px solid rgba(0,0,0,0.05)`, display: "flex", flexDirection: "column", gap: "0.5rem" },
  detailRow: { display: "flex", gap: "1rem", alignItems: "flex-start" },
  detailLabel: { fontSize: "0.78rem", fontWeight: 600, color: WARM_GRAY, minWidth: 110, flexShrink: 0 },
  detailValue: { fontSize: "0.875rem", color: INK, lineHeight: 1.6 },
  viewAllBtn: { background: "transparent", border: `1px solid ${SAGE}`, color: SAGE_DARK, padding: "0.6rem 1.25rem", borderRadius: "100px", fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit", alignSelf: "flex-start", marginTop: "0.5rem" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "4rem 2rem", textAlign: "center" },
  emptyTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: 0 },
  emptyDesc: { fontSize: "0.95rem", color: WARM_GRAY, lineHeight: 1.75, maxWidth: 420, margin: 0 },
  trendsWrap: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  trendsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" },
  trendsSummary: { display: "flex", gap: "1.5rem", background: "#fff", borderRadius: "1rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1.25rem 1.5rem" },
  trendsStat: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  trendsStatVal: { fontSize: "1.5rem", fontWeight: 700, color: SAGE_DARK, fontFamily: "'Playfair Display', Georgia, serif" },
  trendsStatLabel: { fontSize: "0.75rem", color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.05em" },
  periodToggle: { display: "flex", gap: "0.25rem", background: SAGE_LIGHT, borderRadius: "100px", padding: "0.2rem" },
  periodBtn: { padding: "0.35rem 1rem", borderRadius: "100px", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },
  trendsCards: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  trendCard: { background: "#fff", borderRadius: "0.75rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" },
  trendCardLeft: { display: "flex", flexDirection: "column", gap: "0.2rem", minWidth: 140 },
  trendKeyword: { fontSize: "0.95rem", fontWeight: 600, color: INK },
  trendSubtext: { fontSize: "0.75rem", color: WARM_GRAY },
  trendBarWrap: { display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 120 },
  trendBar: { height: 8, borderRadius: 4, transition: "width 0.4s ease", minWidth: 4 },
  trendDayCount: { fontSize: "0.82rem", fontWeight: 600, color: WARM_GRAY, whiteSpace: "nowrap" },
  insightsWrap: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  insightsHeader: { paddingBottom: "1rem", borderBottom: `1px solid ${SAGE_LIGHT}` },
  insightsTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: "0 0 0.25rem" },
  insightsMeta: { fontSize: "0.8rem", color: "#aaa", margin: 0 },
  disclaimer: { background: "#fff8e8", border: `1px solid #f0d080`, borderRadius: "0.75rem", padding: "0.875rem 1.1rem", fontSize: "0.82rem", color: "#7a6020", lineHeight: 1.7 },
  insightsContent: { background: "#fff", borderRadius: "1rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" },
  insightSection: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: SAGE_DARK, margin: "0.75rem 0 0.25rem", borderBottom: `1px solid ${SAGE_LIGHT}`, paddingBottom: "0.4rem" },
  insightBullet: { display: "flex", gap: "0.75rem", fontSize: "0.92rem", color: INK_LIGHT, lineHeight: 1.7 },
  bulletDot: { color: SAGE, fontWeight: 700, flexShrink: 0 },
  insightPara: { fontSize: "0.92rem", color: INK_LIGHT, lineHeight: 1.75, margin: 0 },
  insightDivider: { border: "none", borderTop: `1px solid ${SAGE_LIGHT}`, margin: "0.5rem 0" },
  rerunBtn: { background: "transparent", border: `1.5px solid ${SAGE_DARK}`, color: SAGE_DARK, padding: "0.7rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", alignSelf: "flex-start" },
  reportWrap: { display: "flex", flexDirection: "column", gap: "1rem" },
  reportTopBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" },
  reportTopNote: { fontSize: "0.875rem", color: WARM_GRAY, margin: 0 },
  printBtn: { background: TEAL, color: "#fff", border: "none", padding: "0.7rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  reportCard: { background: "#fff", borderRadius: "1.25rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "2rem", display: "flex", flexDirection: "column", gap: "1.75rem" },
  reportHead: { display: "flex", gap: "1.25rem", alignItems: "flex-start", paddingBottom: "1.5rem", borderBottom: `1px solid ${SAGE_LIGHT}` },
  reportEyebrow: { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.35rem" },
  reportTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: INK, margin: "0 0 0.35rem" },
  reportMeta: { fontSize: "0.78rem", color: "#aaa", margin: 0 },
  reportSection: { display: "flex", flexDirection: "column", gap: "1rem" },
  reportSectionTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: SAGE_DARK, margin: 0, paddingBottom: "0.5rem", borderBottom: `1px solid ${SAGE_LIGHT}` },
  reportTable: { width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" },
  reportTh: { background: SAGE_LIGHT, color: SAGE_DARK, padding: "0.6rem 0.75rem", textAlign: "left", fontWeight: 600, fontSize: "0.76rem" },
  reportTd: { padding: "0.6rem 0.75rem", borderBottom: `1px solid rgba(0,0,0,0.05)`, verticalAlign: "top", color: INK_LIGHT, lineHeight: 1.5 },
  reportFooter: { borderTop: `1px solid ${SAGE_LIGHT}`, paddingTop: "1rem", textAlign: "center" },
  reportFooterText: { fontSize: "0.75rem", color: "#aaa", margin: 0 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9500, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0", overscrollBehavior: "none", WebkitTapHighlightColor: "transparent", WebkitOverflowScrolling: "touch" },
  modal: { background: "#fff", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 680, maxHeight: "88dvh", display: "flex", flexDirection: "column", overflowX: "hidden", boxSizing: "border-box" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: `1px solid rgba(0,0,0,0.07)` },
  modalTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: INK, margin: 0 },
  modalClose: { background: "transparent", border: "none", color: WARM_GRAY, fontSize: "1rem", cursor: "pointer" },
  modalBody: { flex: 1, overflowY: "auto", overflowX: "hidden", padding: "1.25rem", paddingBottom: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem", boxSizing: "border-box", width: "100%", WebkitOverflowScrolling: "touch" },
  modalFooter: { padding: "1rem 1.5rem", paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))", borderTop: `1px solid rgba(0,0,0,0.07)`, display: "flex", justifyContent: "flex-end", gap: "0.75rem" },
  formGroup: { display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 },
  formRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" },
  label: { fontSize: "0.85rem", fontWeight: 600, color: INK_LIGHT },
  optional: { fontWeight: 400, color: "#aaa", fontSize: "0.8rem" },
  input: { padding: "0.75rem 1rem", borderRadius: "0.65rem", border: `1.5px solid rgba(0,0,0,0.12)`, fontSize: "0.92rem", color: INK, background: OFF_WHITE, outline: "none", fontFamily: "inherit" },
  textarea: { padding: "0.75rem 1rem", borderRadius: "0.65rem", border: `1.5px solid rgba(0,0,0,0.12)`, fontSize: "0.92rem", color: INK, background: OFF_WHITE, outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 },
  sevSliderWrap: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  sevSliderRow: { display: "flex", alignItems: "center", gap: "1rem" },
  sevDisplay: { width: 48, height: 48, borderRadius: "50%", border: "2px solid", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700, flexShrink: 0, fontFamily: "inherit" },
  sevLabels: { display: "flex", justifyContent: "space-between" },
  sevLabel: { fontSize: "0.72rem", color: "#aaa" },
  sevValue: { fontWeight: 400, color: SAGE_DARK, marginLeft: "0.5rem" },
  uploadLabel: { cursor: "pointer", display: "inline-block", marginTop: "0.25rem" },
  uploadBtn: { fontSize: "0.78rem", color: SAGE_DARK, fontWeight: 600, textDecoration: "underline", textDecorationColor: "rgba(74,112,88,0.3)" },
  photoUploadArea: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", padding: "1.25rem", borderRadius: "0.75rem", border: `2px dashed rgba(74,112,88,0.3)`, background: SAGE_LIGHT, cursor: "pointer", textAlign: "center" },
  photoUploadIcon: { fontSize: "1.5rem" },
  photoUploadText: { fontSize: "0.9rem", fontWeight: 600, color: SAGE_DARK },
  photoUploadSub: { fontSize: "0.75rem", color: WARM_GRAY },
  photoPreviewRow: { display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" },
  photoPreviewWrap: { position: "relative", display: "inline-block" },
  photoPreview: { width: 80, height: 80, objectFit: "cover", borderRadius: "0.6rem", border: `1px solid rgba(0,0,0,0.1)` },
  photoRemoveBtn: { position: "absolute", top: -6, right: -6, background: "#c0392b", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: "0.6rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 },
  entryPhotos: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  entryPhotoRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  entryPhotoThumb: { width: 72, height: 72, objectFit: "cover", borderRadius: "0.5rem", border: `1px solid rgba(0,0,0,0.1)`, cursor: "pointer" },
  cancelBtn: { background: "transparent", border: `1.5px solid rgba(0,0,0,0.15)`, color: WARM_GRAY, padding: "0.7rem 1.5rem", borderRadius: "100px", fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit" },
  saveBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.7rem 1.75rem", borderRadius: "100px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  footer: { padding: "1.5rem 2rem", borderTop: `1px solid rgba(0,0,0,0.07)`, textAlign: "center" },
  footerText: { fontSize: "0.85rem", color: WARM_GRAY, margin: "0 0 0.25rem" },
  footerLink: { color: SAGE_DARK, textDecoration: "none" },
  footerDisclaimer: { fontSize: "0.75rem", color: "#aaa", margin: 0 },
  insightsLoadingOverlay: { position: "fixed", inset: 0, background: "rgba(250,250,248,0.96)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", backdropFilter: "blur(4px)" },
  insightsLoadingCard: { background: "#fff", borderRadius: "1.5rem", border: "1px solid rgba(0,0,0,0.07)", padding: "2.5rem 2rem", maxWidth: 480, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem", boxShadow: "0 8px 40px rgba(0,0,0,0.08)" },
  insightsLoadingTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: 0 },
  insightsLoadingDesc: { fontSize: "0.9rem", color: WARM_GRAY, lineHeight: 1.75, margin: 0, maxWidth: 380 },
  insightsLoadingBarWrap: { width: "100%", height: 6, background: SAGE_LIGHT, borderRadius: 100, overflow: "hidden" },
  insightsLoadingBar: { height: "100%", borderRadius: 100, background: SAGE_DARK, animation: "insightProgress 22s ease-in-out forwards" },
  insightsLoadingNote: { fontSize: "0.78rem", color: "#aaa", margin: 0, fontStyle: "italic" },
  insightsReportHeader: { background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" },
  insightsReportHeaderTop: { display: "flex", gap: "1.25rem", alignItems: "flex-start" },
  insightsReportEyebrow: { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.35rem" },
  insightsReportActions: { display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" },
  insightsExportBtn: { background: TEAL, color: "#fff", border: "none", padding: "0.65rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  insightsFooter: { background: SAGE_LIGHT, borderRadius: "1rem", padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", textAlign: "center" },
  insightsFooterNote: { fontSize: "0.92rem", color: SAGE_DARK, lineHeight: 1.7, margin: 0, fontStyle: "italic" },
  onboardingWrap: { maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", textAlign: "center", padding: "2rem 1rem" },
  onboardingTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: INK, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 },
  onboardingDesc: { fontSize: "1rem", color: WARM_GRAY, lineHeight: 1.75, margin: 0, maxWidth: 480 },
  onboardingSteps: { display: "flex", flexDirection: "column", gap: "1rem", width: "100%", textAlign: "left" },
  onboardingStep: { display: "flex", gap: "1rem", alignItems: "flex-start", background: "#fff", borderRadius: "0.875rem", padding: "1rem 1.25rem", border: "1px solid rgba(0,0,0,0.07)" },
  onboardingStepNum: { width: 28, height: 28, borderRadius: "50%", background: SAGE_DARK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0, marginTop: "0.1rem" },
  onboardingStepTitle: { fontSize: "0.9rem", fontWeight: 600, color: INK, margin: "0 0 0.2rem" },
  onboardingStepDesc: { fontSize: "0.82rem", color: WARM_GRAY, lineHeight: 1.6, margin: 0 },
  onboardingPrivacy: { display: "flex", alignItems: "center", gap: "0.5rem", background: SAGE_LIGHT, borderRadius: "0.75rem", padding: "0.875rem 1.25rem", width: "100%" },
  onboardingPrivacyText: { fontSize: "0.82rem", color: SAGE_DARK, lineHeight: 1.6, margin: 0, textAlign: "left" },
  onboardingActions: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", width: "100%" },
  onboardingBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.95rem 2.5rem", borderRadius: "100px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: "100%" },
  onboardingSecondary: { fontSize: "0.875rem", color: WARM_GRAY, textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.2)" },
  assessmentPrompt: { background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1.5rem" },
  assessmentPromptLeft: { display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1 },
  assessmentPromptTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: INK, margin: 0 },
  assessmentPromptDesc: { fontSize: "0.875rem", color: WARM_GRAY, lineHeight: 1.6, margin: 0 },
  assessmentPromptBtn: { background: SAGE_DARK, color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" },
};
