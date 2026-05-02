import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { Icon } from "./SageIcons";

/* ─── Brand tokens (mirrors Care Compass conventions) ─────────────────────── */
const SAGE        = "#7a9e87";   // shared — nav, borders
const SAGE_LIGHT  = "#e8f0eb";
const SAGE_DARK   = "#4a7058";
const TEAL        = "#4a9fa5";   // shared accent
const TEAL_LIGHT  = "#e0f2f4";
const AMBER       = "#c47b2b";   // MC primary accent
const AMBER_LIGHT = "#fdf0e0";
const AMBER_DARK  = "#8a5218";
const WARM_GRAY   = "#6b6560";
const OFF_WHITE   = "#fafaf8";
const CREAM       = "#f4f1ec";
const INK         = "#2d2926";
const INK_LIGHT   = "#4a4540";

const STORAGE_KEY = "movement-compass-sessions-v1";
const PROGRAM_KEY = "movement-compass-program-v1";
const CHECKIN_KEY = "movement-compass-checkin-v1";

/* ─── Compass mark (sister to Care Compass BotanicalMark) ─────────────────── */
const CompassMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
    <circle cx="36" cy="36" r="34" fill={AMBER_LIGHT} stroke={AMBER} strokeWidth="1"/>
    {/* Cardinal spokes */}
    <line x1="36" y1="8" x2="36" y2="64" stroke={AMBER_DARK} strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
    <line x1="8" y1="36" x2="64" y2="36" stroke={AMBER_DARK} strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
    {/* Diagonal spokes */}
    <line x1="16" y1="16" x2="56" y2="56" stroke={AMBER} strokeWidth="0.8" strokeLinecap="round" opacity="0.25"/>
    <line x1="56" y1="16" x2="16" y2="56" stroke={AMBER} strokeWidth="0.8" strokeLinecap="round" opacity="0.25"/>
    {/* North needle — movement direction */}
    <polygon points="36,10 32,36 36,30 40,36" fill={AMBER_DARK}/>
    {/* South needle */}
    <polygon points="36,62 32,36 36,42 40,36" fill={AMBER} opacity="0.5"/>
    {/* Center rings */}
    <circle cx="36" cy="36" r="7" fill={AMBER_DARK}/>
    <circle cx="36" cy="36" r="3" fill={AMBER_LIGHT}/>
  </svg>
);

/* ─── Shared input / label style helpers (identical to CC) ────────────────── */
const inp = {
  padding: "0.65rem 0.9rem", borderRadius: "0.65rem",
  border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "0.9rem",
  color: INK, background: OFF_WHITE, outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
const lbl = {
  fontSize: "0.78rem", fontWeight: 600, color: INK_LIGHT,
  marginBottom: "0.3rem", display: "block",
};

/* ─── Today's date helpers ─────────────────────────────────────────────────── */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

/* ─── Session log storage helpers ─────────────────────────────────────────── */
function loadSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveSessions(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}
function loadProgram() {
  try { return JSON.parse(localStorage.getItem(PROGRAM_KEY)) || null; }
  catch { return null; }
}
function loadCheckin() {
  try { return JSON.parse(localStorage.getItem(CHECKIN_KEY)) || null; }
  catch { return null; }
}
function saveCheckin(c) {
  localStorage.setItem(CHECKIN_KEY, JSON.stringify(c));
}

/* ─── Static program definition (Foundation week) ─────────────────────────── */
const FOUNDATION_PROGRAM = {
  name: "Foundation",
  type: "2 days strength + 1 optional",
  weekStructure: [
    { day: "Mon", code: "A", label: "Full Body A", type: "strength" },
    { day: "Tue", code: "·", label: "Rest / walk",  type: "rest" },
    { day: "Wed", code: "B", label: "Full Body B",  type: "strength" },
    { day: "Thu", code: "·", label: "Rest / walk",  type: "rest" },
    { day: "Fri", code: "+", label: "Cardio + core", type: "optional" },
    { day: "Sat", code: "·", label: "Rest",          type: "rest" },
    { day: "Sun", code: "·", label: "Full rest",     type: "rest" },
  ],
};

const QUICK_ACTIONS = [
  { label: "Start today's session", desc: "Full Body A — strength + stability", color: AMBER_DARK, href: "#session" },
  { label: "Log a flare day",       desc: "Switch to minimum-dose mode",         color: TEAL,       href: "#flare" },
  { label: "Exercise library",      desc: "Browse modifications by joint",        color: SAGE_DARK,  href: "#library" },
  { label: "View progress",         desc: "Strength gains + consistency",         color: INK_LIGHT,  href: "#progress" },
];

/* ─── Day-of-week dot for week strip ──────────────────────────────────────── */
function WeekDot({ code, day, type, isToday, isDone, isFlare }) {
  const bg = isDone
    ? SAGE_DARK
    : isFlare
    ? AMBER
    : isToday
    ? "#fff"
    : type === "rest"
    ? CREAM
    : AMBER_LIGHT;
  const border = isToday ? `2px solid ${AMBER_DARK}` : `1.5px solid ${isDone || isFlare ? "transparent" : "rgba(0,0,0,0.1)"}`;
  const color = isDone || isFlare ? "#fff" : isToday ? AMBER_DARK : WARM_GRAY;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div style={{ fontSize: "0.65rem", color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em" }}>{day}</div>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: bg, border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, color, boxSizing: "border-box" }}>
        {isDone ? "✓" : isFlare ? "F" : code}
      </div>
    </div>
  );
}

/* ─── Session log card ────────────────────────────────────────────────────── */
function SessionCard({ session, onDelete }) {
  const typeColor = session.type === "flare" ? AMBER : session.type === "rest" ? WARM_GRAY : SAGE_DARK;
  const typeBg   = session.type === "flare" ? AMBER_LIGHT : session.type === "rest" ? CREAM : SAGE_LIGHT;
  return (
    <div style={{
      background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)",
      borderLeft: `4px solid ${typeColor}`, padding: "1rem 1.25rem",
      display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.95rem", fontWeight: 700, color: INK }}>
            {session.sessionName}
          </span>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "100px", background: typeBg, color: typeColor, marginLeft: "auto", whiteSpace: "nowrap" }}>
            {session.type === "flare" ? "Flare day" : session.type === "rest" ? "Rest" : "Standard"}
          </span>
        </div>
        <p style={{ fontSize: "0.78rem", color: TEAL, margin: "0 0 0.2rem", fontWeight: 500 }}>
          {formatDate(session.date)} · {session.duration} min
        </p>
        {session.painLevel && (
          <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: 0 }}>
            Pain going in: {session.painLevel}/10 · Energy: {session.energyLevel}/10
          </p>
        )}
        {session.notes && (
          <p style={{ fontSize: "0.78rem", color: INK_LIGHT, margin: "0.25rem 0 0", fontStyle: "italic" }}>"{session.notes}"</p>
        )}
      </div>
      <button onClick={() => onDelete(session.id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: "0.9rem", flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
    </div>
  );
}

/* ─── Log session modal ────────────────────────────────────────────────────── */
function LogSessionModal({ onSave, onCancel }) {
  const blank = { sessionName: "Full Body A", type: "standard", date: todayStr(), duration: 45, painLevel: "", energyLevel: "", notes: "" };
  const [form, setForm] = useState(blank);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const SESSION_TYPES = [
    { value: "standard", label: "Standard session" },
    { value: "flare",    label: "Flare session" },
    { value: "optional", label: "Optional / cardio day" },
    { value: "rest",     label: "Rest day" },
  ];
  const SESSION_NAMES = ["Full Body A", "Full Body B", "Flare Session A", "Flare Session B", "Flare Session C", "Cardio + Core", "Rest day", "Other"];
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: INK, margin: 0 }}>Log a session</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: WARM_GRAY, fontSize: "1.2rem" }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={lbl}>Session</label>
            <select value={form.sessionName} onChange={set("sessionName")} style={{ ...inp, WebkitAppearance: "none" }}>
              {SESSION_NAMES.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Type</label>
            <select value={form.type} onChange={set("type")} style={{ ...inp, WebkitAppearance: "none" }}>
              {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" value={form.date} onChange={set("date")} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Duration (min)</label>
              <input type="number" value={form.duration} onChange={set("duration")} min="5" max="180" style={inp}/>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={lbl}>Pain going in (1–10)</label>
              <input type="number" value={form.painLevel} onChange={set("painLevel")} min="1" max="10" placeholder="Optional" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Energy (1–10)</label>
              <input type="number" value={form.energyLevel} onChange={set("energyLevel")} min="1" max="10" placeholder="Optional" style={inp}/>
            </div>
          </div>
          <div>
            <label style={lbl}>Notes <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
            <textarea value={form.notes} onChange={set("notes")} rows={3} placeholder="How did it feel? Any modifications? Joint flares?" style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}/>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button onClick={onCancel} style={styles.btnSecondary}>Cancel</button>
            <button onClick={() => { if (form.sessionName && form.date) onSave({ ...form, id: Date.now(), duration: Number(form.duration) || 0 }); }} style={styles.btnPrimary}>Save session</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Check-in modal ─────────────────────────────────────────────────────── */
function CheckInModal({ onSave, onCancel }) {
  const [feel, setFeel] = useState(null);
  const [joints, setJoints] = useState([]);
  const [energy, setEnergy] = useState(null);
  const FEELS = [
    { key: "baseline", label: "At or near baseline", desc: "Pain is manageable, joints feel stable" },
    { key: "okay",     label: "A bit off, but moving", desc: "Some stiffness or achiness, but functional" },
    { key: "flare",    label: "Flaring today",         desc: "Elevated pain, joints feel slippy or unstable" },
    { key: "rest",     label: "I need full rest",      desc: "Body is saying no — and that's information" },
  ];
  const JOINTS = ["Shoulders", "Knees", "Hips", "Low back", "Wrists", "Neck / ribs", "Ankles"];
  const toggleJoint = (j) => setJoints(prev => prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]);

  const recommendation = (() => {
    if (!feel) return null;
    if (feel === "rest") return { label: "Full rest day", session: null, color: WARM_GRAY };
    if (feel === "flare" || (feel === "okay" && energy === "low")) {
      const hasUpper = joints.some(j => ["Shoulders", "Neck / ribs"].includes(j));
      return { label: hasUpper ? "Flare Session A — shoulders / ribs" : "Flare Session B — low back / hips", session: "flare", color: AMBER_DARK };
    }
    return { label: "Full Body A — Strength + Stability", session: "standard", color: SAGE_DARK };
  })();

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalCard, maxWidth: 520 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: INK, margin: 0 }}>How's your body today?</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: WARM_GRAY, fontSize: "1.2rem" }}>×</button>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <div style={lbl}>Overall, I feel...</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            {FEELS.map(f => (
              <div key={f.key} onClick={() => setFeel(f.key)} style={{ padding: "0.85rem 1rem", borderRadius: "0.875rem", border: `1.5px solid ${feel === f.key ? (f.key === "flare" ? AMBER_DARK : SAGE_DARK) : "rgba(0,0,0,0.1)"}`, background: feel === f.key ? (f.key === "flare" ? AMBER_LIGHT : SAGE_LIGHT) : "#fff", cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: INK, marginBottom: 2 }}>{f.label}</div>
                <div style={{ fontSize: "0.75rem", color: WARM_GRAY, lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {feel && feel !== "rest" && (
          <>
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={lbl}>Anything specific bothering you?</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {JOINTS.map(j => (
                  <div key={j} onClick={() => toggleJoint(j)} style={{ padding: "0.4rem 0.9rem", borderRadius: "100px", border: `1.5px solid ${joints.includes(j) ? AMBER_DARK : "rgba(0,0,0,0.1)"}`, background: joints.includes(j) ? AMBER_LIGHT : "#fff", fontSize: "0.82rem", color: joints.includes(j) ? AMBER_DARK : WARM_GRAY, cursor: "pointer", fontWeight: joints.includes(j) ? 600 : 400, transition: "all 0.15s" }}>{j}</div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={lbl}>Energy level</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["low", "moderate", "good"].map(e => (
                  <div key={e} onClick={() => setEnergy(e)} style={{ flex: 1, padding: "0.6rem", borderRadius: "0.65rem", border: `1.5px solid ${energy === e ? TEAL : "rgba(0,0,0,0.1)"}`, background: energy === e ? TEAL_LIGHT : "#fff", textAlign: "center", fontSize: "0.85rem", color: energy === e ? TEAL : WARM_GRAY, cursor: "pointer", fontWeight: energy === e ? 600 : 400, textTransform: "capitalize", transition: "all 0.15s" }}>{e}</div>
                ))}
              </div>
            </div>
          </>
        )}

        {recommendation && (
          <div style={{ background: recommendation.color === AMBER_DARK ? AMBER_LIGHT : SAGE_LIGHT, border: `1.5px solid ${recommendation.color === AMBER_DARK ? AMBER : SAGE}`, borderRadius: "0.875rem", padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: recommendation.color, marginBottom: 4 }}>Recommended today</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK }}>{recommendation.label}</div>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={onCancel} style={styles.btnSecondary}>Not now</button>
          <button
            onClick={() => { if (feel) onSave({ date: todayStr(), feel, joints, energy, recommendation: recommendation?.label }); }}
            disabled={!feel}
            style={{ ...styles.btnPrimary, background: feel === "flare" ? AMBER_DARK : SAGE_DARK, opacity: !feel ? 0.4 : 1 }}
          >
            {feel === "rest" ? "Mark as rest day" : "See my session"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main dashboard ─────────────────────────────────────────────────────── */
export default function MovementCompassDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions]       = useState(loadSessions);
  const [program]                     = useState(() => loadProgram() || FOUNDATION_PROGRAM);
  const [todayCheckin, setTodayCheckin] = useState(() => {
    const c = loadCheckin();
    return c?.date === todayStr() ? c : null;
  });
  const [showLogModal, setShowLogModal] = useState(false);
  const [showCheckin, setShowCheckin]   = useState(false);
  const [activeNav, setActiveNav]       = useState("dashboard");

  const firstName = user?.firstName || user?.username?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  /* stats derived from sessions */
  const thisMonth = sessions.filter(s => s.date?.slice(0, 7) === todayStr().slice(0, 7));
  const standardCount = thisMonth.filter(s => s.type === "standard" || s.type === "optional").length;
  const flareCount    = thisMonth.filter(s => s.type === "flare").length;
  const totalMins     = thisMonth.reduce((a, s) => a + (Number(s.duration) || 0), 0);

  /* streak calculation */
  const streak = (() => {
    if (!sessions.length) return 0;
    const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
    let count = 0;
    let cursor = new Date();
    for (const d of dates) {
      const diff = Math.round((cursor - new Date(d)) / 86400000);
      if (diff > 1) break;
      count++;
      cursor = new Date(d);
    }
    return count;
  })();

  /* week strip — which days have sessions this week */
  const weekStart = (() => {
    const d = new Date();
    const day = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return mon;
  })();
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  function handleLogSave(session) {
    const updated = [session, ...sessions];
    setSessions(updated);
    saveSessions(updated);
    setShowLogModal(false);
  }
  function handleDeleteSession(id) {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    saveSessions(updated);
  }
  function handleCheckinSave(checkin) {
    setTodayCheckin(checkin);
    saveCheckin(checkin);
    setShowCheckin(false);
  }

  /* ── nav items ── */
  const NAV = [
    { key: "dashboard", label: "Dashboard",  icon: "home" },
    { key: "session",   label: "Session",    icon: "activity" },
    { key: "library",   label: "Library",    icon: "book" },
    { key: "progress",  label: "Progress",   icon: "trending-up" },
  ];

  return (
    <div style={styles.root}>

      {/* ── Top nav (mirrors CC nav exactly) ── */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.navBrand}>
            <CompassMark size={28}/>
            <div>
              <span style={styles.navProductName}>Movement Compass</span>
              <span style={styles.navSister}>by Care Compass</span>
            </div>
          </div>
          <div style={styles.navLinks}>
            {NAV.map(n => (
              <button key={n.key} onClick={() => setActiveNav(n.key)} style={{ ...styles.navLink, ...(activeNav === n.key ? styles.navLinkActive : {}) }}>
                {n.label}
              </button>
            ))}
          </div>
          <div style={styles.navActions}>
            <button onClick={() => setShowCheckin(true)} style={styles.navCheckinBtn}>
              Daily check-in
            </button>
            <div style={styles.navAvatar}>
              {firstName[0]?.toUpperCase()}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main style={styles.main}>
        <div style={styles.container}>

          {/* ── Header ── */}
          <div style={styles.header}>
            <div>
              <p style={styles.eyebrow}>{greeting}, {firstName}</p>
              <h1 style={styles.title}>Movement Compass</h1>
              <p style={styles.subtitle}>
                {todayCheckin
                  ? `Today: ${todayCheckin.recommendation || "session logged"} · ${formatDate(todayStr())}`
                  : `${formatDate(todayStr())} · How's your body today?`}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button onClick={() => setShowCheckin(true)} style={styles.btnPrimary}>
                {todayCheckin ? "Update check-in" : "Check in for today"}
              </button>
              <button onClick={() => setShowLogModal(true)} style={styles.btnSecondary}>
                Log a session
              </button>
            </div>
          </div>

          {/* ── Check-in result banner ── */}
          {todayCheckin && (
            <div style={{ background: todayCheckin.feel === "flare" ? AMBER_LIGHT : todayCheckin.feel === "rest" ? CREAM : SAGE_LIGHT, border: `1px solid ${todayCheckin.feel === "flare" ? AMBER : todayCheckin.feel === "rest" ? "rgba(0,0,0,0.08)" : SAGE}`, borderRadius: "1rem", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: todayCheckin.feel === "flare" ? AMBER_DARK : SAGE_DARK, display: "block", marginBottom: 3 }}>
                  {todayCheckin.feel === "flare" ? "Flare mode" : todayCheckin.feel === "rest" ? "Rest day" : "Standard day"}
                </span>
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.95rem", fontWeight: 700, color: INK }}>
                  {todayCheckin.recommendation || "Session ready"}
                </span>
                {todayCheckin.joints?.length > 0 && (
                  <span style={{ fontSize: "0.75rem", color: WARM_GRAY, display: "block", marginTop: 2 }}>
                    Flagged: {todayCheckin.joints.join(", ")}
                  </span>
                )}
              </div>
              <button onClick={() => setShowLogModal(true)} style={{ ...styles.btnPrimary, background: todayCheckin.feel === "flare" ? AMBER_DARK : SAGE_DARK, fontSize: "0.85rem", padding: "0.6rem 1.25rem" }}>
                Log this session
              </button>
            </div>
          )}

          {/* ── Stat cards ── */}
          <div style={styles.statsRow}>
            {[
              { label: "Sessions this month", value: thisMonth.length, unit: "", sub: `${standardCount} standard · ${flareCount} flare`, action: "View all", href: "#progress" },
              { label: "Current streak",      value: streak,           unit: " days", sub: "flare days still count", action: null },
              { label: "Time moved",          value: Math.round(totalMins / 60 * 10) / 10, unit: "h", sub: "this month", action: null },
              { label: "Program",             value: program.name,     unit: "", sub: program.type, isText: true, action: "Adjust", href: "#program" },
            ].map((s, i) => (
              <div key={i} style={styles.statCard}>
                <div style={styles.statCardInner}>
                  <div>
                    <p style={styles.statLabel}>{s.label}</p>
                    <p style={styles.statValue}>
                      {s.isText
                        ? <span style={{ fontSize: "1.1rem" }}>{s.value}</span>
                        : <>{s.value}<span style={styles.statUnit}>{s.unit}</span></>}
                    </p>
                    <p style={styles.statSub}>{s.sub}</p>
                    {s.action && <a href={s.href} style={styles.statAction}>{s.action} →</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Week strip + quick actions grid ── */}
          <div style={styles.contentGrid}>

            {/* Week view */}
            <div style={styles.sectionCard}>
              <div style={styles.sectionCardHeader}>
                <div>
                  <p style={styles.sectionEyebrow}>This week</p>
                  <h2 style={styles.sectionTitle}>{program.name} program</h2>
                </div>
                <a href="#program" style={styles.sectionAction}>Edit week →</a>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                {program.weekStructure.map((d, i) => {
                  const dateStr = weekDates[i];
                  const isToday = dateStr === todayStr();
                  const sessionOnDay = sessions.find(s => s.date === dateStr);
                  const isDone  = !!sessionOnDay && sessionOnDay.type !== "flare";
                  const isFlare = sessionOnDay?.type === "flare";
                  return <WeekDot key={d.day} {...d} isToday={isToday} isDone={isDone} isFlare={isFlare}/>;
                })}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {program.weekStructure.map((d, i) => {
                  const dateStr = weekDates[i];
                  const isToday = dateStr === todayStr();
                  const sessionOnDay = sessions.find(s => s.date === dateStr);
                  if (!isToday && !sessionOnDay) return null;
                  return (
                    <div key={d.day} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "0.65rem", background: isToday ? AMBER_LIGHT : SAGE_LIGHT }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: WARM_GRAY, width: 28 }}>{d.day}</span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: isToday ? AMBER_DARK : SAGE_DARK, flex: 1 }}>
                        {sessionOnDay ? sessionOnDay.sessionName : d.label}
                      </span>
                      {sessionOnDay && <span style={{ fontSize: "0.7rem", color: WARM_GRAY }}>{sessionOnDay.duration} min</span>}
                      {isToday && !sessionOnDay && (
                        <button onClick={() => setShowLogModal(true)} style={{ fontSize: "0.72rem", background: AMBER_DARK, color: "#fff", border: "none", borderRadius: "100px", padding: "0.2rem 0.75rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Log</button>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div style={{ display: "flex", gap: "1rem", paddingTop: "0.5rem", borderTop: `1px solid ${CREAM}` }}>
                {[{ color: SAGE_DARK, label: "Standard" }, { color: AMBER, label: "Flare" }, { color: CREAM, label: "Rest", border: "1px solid rgba(0,0,0,0.1)" }].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, border: l.border || "none" }}/>
                    <span style={{ fontSize: "0.72rem", color: WARM_GRAY }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={styles.sectionCard}>
                <div style={styles.sectionCardHeader}>
                  <div>
                    <p style={styles.sectionEyebrow}>Where to next</p>
                    <h2 style={styles.sectionTitle}>Quick actions</h2>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  {QUICK_ACTIONS.map((a, i) => (
                    <a key={i} href={a.href} style={{ ...styles.quickActionCard, borderLeft: `3px solid ${a.color}` }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: INK, margin: 0 }}>{a.label}</div>
                      <div style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0, lineHeight: 1.5 }}>{a.desc}</div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Progression reminder */}
              <div style={{ ...styles.sectionCard, background: AMBER_LIGHT, border: `1px solid ${AMBER}` }}>
                <div>
                  <p style={{ ...styles.sectionEyebrow, color: AMBER_DARK }}>Progression note</p>
                  <h2 style={{ ...styles.sectionTitle, fontSize: "0.95rem" }}>Boring is good.</h2>
                </div>
                <p style={{ fontSize: "0.85rem", color: INK_LIGHT, lineHeight: 1.7, margin: 0 }}>
                  The best program for hEDS isn't the hardest one. It's the one you can repeat consistently — without triggering a flare or destabilising your joints.
                </p>
                <div style={{ fontSize: "0.78rem", color: AMBER_DARK, fontWeight: 600 }}>
                  Week 3 target: add reps before load. 2×10 on all main lifts first.
                </div>
              </div>
            </div>
          </div>

          {/* ── Recent sessions ── */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionCardHeader}>
              <div>
                <p style={styles.sectionEyebrow}>History</p>
                <h2 style={styles.sectionTitle}>Recent sessions</h2>
              </div>
              <button onClick={() => setShowLogModal(true)} style={{ ...styles.btnPrimary, fontSize: "0.82rem", padding: "0.55rem 1.1rem" }}>
                + Log session
              </button>
            </div>

            {sessions.length === 0 ? (
              <div style={styles.emptyCard}>
                <CompassMark size={48}/>
                <h3 style={styles.emptyTitle}>No sessions logged yet</h3>
                <p style={styles.emptyDesc}>Log your first session to start tracking your consistency, strength progression, and flare patterns.</p>
                <button onClick={() => setShowLogModal(true)} style={styles.emptyBtn}>Log your first session</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {sessions.slice(0, 8).map(s => (
                  <SessionCard key={s.id} session={s} onDelete={handleDeleteSession}/>
                ))}
                {sessions.length > 8 && (
                  <p style={{ textAlign: "center", fontSize: "0.82rem", color: WARM_GRAY }}>
                    <a href="#progress" style={{ color: SAGE_DARK, fontWeight: 600 }}>View all {sessions.length} sessions →</a>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Care Compass link ── */}
          <div style={{ background: SAGE_LIGHT, border: `1px solid ${SAGE}`, borderRadius: "1rem", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: SAGE_DARK, margin: "0 0 0.25rem" }}>Care Compass</p>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.95rem", fontWeight: 700, color: INK, margin: "0 0 0.2rem" }}>Cross-reference your movement + symptoms</p>
              <p style={{ fontSize: "0.8rem", color: WARM_GRAY, margin: 0 }}>Your daily tracker data can help explain flare patterns in your movement sessions.</p>
            </div>
            <a href="https://joincarecompass.com" style={{ ...styles.btnSecondary, textDecoration: "none", whiteSpace: "nowrap", fontSize: "0.85rem" }}>Open Care Compass →</a>
          </div>

        </div>
      </main>

      {/* ── Footer (mirrors CC) ── */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Movement Compass · <a href="https://joincarecompass.com" style={styles.footerLink}>joincarecompass.com</a>
        </p>
        <p style={styles.footerDisclaimer}>
          Not medical advice. Always work with your healthcare team. Movement Compass is a tool, not a replacement for professional guidance.
        </p>
      </footer>

      {/* ── Modals ── */}
      {showLogModal && <LogSessionModal onSave={handleLogSave} onCancel={() => setShowLogModal(false)}/>}
      {showCheckin  && <CheckInModal    onSave={handleCheckinSave} onCancel={() => setShowCheckin(false)}/>}
    </div>
  );
}

/* ─── Styles (same structure as CareCompassDashboard) ─────────────────────── */
const styles = {
  root: { minHeight: "100vh", background: OFF_WHITE, display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif", color: INK },

  nav: { background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: 1100, margin: "0 auto", padding: "0 1.25rem", height: 60, display: "flex", alignItems: "center", gap: "1.5rem" },
  navBrand: { display: "flex", alignItems: "center", gap: "0.65rem", textDecoration: "none", flexShrink: 0 },
  navProductName: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, display: "block", lineHeight: 1.2 },
  navSister: { fontSize: "0.65rem", color: WARM_GRAY, display: "block", fontWeight: 500 },
  navLinks: { display: "flex", gap: "0.25rem", flex: 1 },
  navLink: { background: "none", border: "none", padding: "0.4rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.875rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" },
  navLinkActive: { background: AMBER_LIGHT, color: AMBER_DARK, fontWeight: 600 },
  navActions: { display: "flex", alignItems: "center", gap: "0.75rem" },
  navCheckinBtn: { background: AMBER_DARK, color: "#fff", border: "none", borderRadius: "100px", padding: "0.45rem 1.1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  navAvatar: { width: 32, height: 32, borderRadius: "50%", background: AMBER_DARK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", fontFamily: "'Playfair Display', Georgia, serif" },

  main: { flex: 1, padding: "2rem 1.25rem", boxSizing: "border-box", width: "100%" },
  container: { maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" },
  eyebrow: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: AMBER_DARK, margin: "0 0 0.3rem" },
  title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: INK, margin: "0 0 0.4rem", letterSpacing: "-0.02em" },
  subtitle: { fontSize: "0.95rem", color: WARM_GRAY, margin: 0, lineHeight: 1.6 },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" },
  statCard: { background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.25rem 1.5rem" },
  statCardInner: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" },
  statLabel: { fontSize: "0.75rem", fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.35rem" },
  statValue: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: AMBER_DARK, margin: "0 0 0.25rem", lineHeight: 1 },
  statUnit: { fontSize: "0.9rem", fontWeight: 400, color: WARM_GRAY },
  statSub: { fontSize: "0.78rem", color: WARM_GRAY, margin: 0 },
  statAction: { fontSize: "0.8rem", color: SAGE_DARK, fontWeight: 600, textDecoration: "none" },

  contentGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" },
  sectionCard: { background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
  sectionCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  sectionEyebrow: { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.3rem" },
  sectionTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: INK, margin: 0 },
  sectionAction: { fontSize: "0.82rem", color: SAGE_DARK, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", marginTop: "0.25rem" },

  quickActionCard: { background: "#fff", borderRadius: "0.875rem", padding: "1rem 1.25rem", textDecoration: "none", border: "1px solid rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "0.3rem", transition: "box-shadow 0.2s", cursor: "pointer" },

  emptyCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "2.5rem 1rem", textAlign: "center" },
  emptyTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: 0 },
  emptyDesc: { fontSize: "0.875rem", color: WARM_GRAY, lineHeight: 1.7, margin: 0, maxWidth: 300 },
  emptyBtn: { background: AMBER_DARK, color: "#fff", padding: "0.65rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: "0.25rem" },

  btnPrimary: { background: AMBER_DARK, color: "#fff", padding: "0.7rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s" },
  btnSecondary: { background: "transparent", color: SAGE_DARK, border: `1px solid ${SAGE}`, padding: "0.7rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" },
  modalCard: { background: "#fff", borderRadius: "1.5rem", padding: "2rem", maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },

  footer: { padding: "1.5rem 2rem", borderTop: "1px solid rgba(0,0,0,0.07)", textAlign: "center" },
  footerText: { fontSize: "0.85rem", color: WARM_GRAY, margin: "0 0 0.25rem" },
  footerLink: { color: SAGE_DARK, textDecoration: "none" },
  footerDisclaimer: { fontSize: "0.75rem", color: "#aaa", margin: 0 },
};
