import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

/* ─── Brand tokens ─────────────────────────────────────────────────────────── */
const SAGE         = "#7a9e87";
const SAGE_LIGHT   = "#e8f0eb";
const SAGE_DARK    = "#4a7058";
const NAVY         = "#1a3a5c";
const SLATE        = "#3a6ea8";
const SLATE_MID    = "#7aa8cc";
const MIST         = "#eaf2f8";
const MIST_BORDER  = "#b8d4e8";
const TERRA        = "#b05a3a";
const TERRA_LIGHT  = "#fdf3ee";
const TERRA_BORDER = "#e8b89a";
const TERRA_DARK   = "#7a3a22";
const WARM_GRAY    = "#6b6560";
const OFF_WHITE    = "#fafaf8";
const CREAM        = "#f4f1ec";
const INK          = "#2d2926";
const INK_LIGHT    = "#4a4540";

const STORAGE_KEY = "anchor-sessions-v1";

/* ─── Anchor mark ──────────────────────────────────────────────────────────── */
const AnchorMark = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
    <circle cx="36" cy="36" r="34" fill={MIST} stroke={SLATE} strokeWidth="1"/>
    <circle cx="36" cy="22" r="6" fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="36" y1="28" x2="36" y2="58" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="24" y1="34" x2="48" y2="34" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M36 58 Q26 52 24 44" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M36 58 Q46 52 48 44" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="24" cy="44" r="2.5" fill={SLATE}/>
    <circle cx="48" cy="44" r="2.5" fill={SLATE}/>
    <circle cx="36" cy="16" r="3.5" fill="none" stroke={SLATE} strokeWidth="2"/>
  </svg>
);

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function todayStr() { return new Date().toISOString().slice(0, 10); }
function monthStr(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return d.toISOString().slice(0, 7);
}
function loadSessions() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function saveSessions(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

function formatShortDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function formatMonthYear(str) {
  const [y, m] = str.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function getDayOfWeek(dateStr) { const [y, m, d] = dateStr.split("-").map(Number); return new Date(y, m - 1, d).getDay(); }
function daysInMonth(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}
function firstDayOfMonth(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  return (new Date(y, m - 1, 1).getDay() + 6) % 7; // Mon=0
}

export default function AnchorProgress() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [tab, setTab]             = useState("overview");
  const [viewMonth, setViewMonth] = useState(monthStr(0));
  const [sessions, setSessions]   = useState(loadSessions);
  const [activeNav, setActiveNav] = useState("progress");

  const firstName = user?.firstName || user?.username?.split(" ")[0] || "there";

  /* ── derived stats ── */
  const allSessions = useMemo(() => sessions.sort((a, b) => b.date?.localeCompare(a.date)), [sessions]);

  const thisMonth  = useMemo(() => sessions.filter(s => s.date?.startsWith(monthStr(0))), [sessions]);
  const lastMonth  = useMemo(() => sessions.filter(s => s.date?.startsWith(monthStr(1))), [sessions]);

  const standardCount  = thisMonth.filter(s => s.type === "standard" || s.type === "optional").length;
  const flareCount     = thisMonth.filter(s => s.type === "flare").length;
  const totalMins      = thisMonth.reduce((a, s) => a + (Number(s.duration) || 0), 0);
  const lastStandard   = lastMonth.filter(s => s.type === "standard" || s.type === "optional").length;
  const lastTotalMins  = lastMonth.reduce((a, s) => a + (Number(s.duration) || 0), 0);

  const streak = useMemo(() => {
    if (!sessions.length) return 0;
    const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
    let count = 0, cursor = new Date();
    for (const d of dates) { if (Math.round((cursor - new Date(d)) / 86400000) > 1) break; count++; cursor = new Date(d); }
    return count;
  }, [sessions]);

  const longestStreak = useMemo(() => {
    if (!sessions.length) return 0;
    const dates = [...new Set(sessions.map(s => s.date))].sort();
    let max = 1, cur = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = Math.round((new Date(dates[i]) - new Date(dates[i - 1])) / 86400000);
      if (diff === 1) { cur++; max = Math.max(max, cur); } else cur = 1;
    }
    return max;
  }, [sessions]);

  /* flare pattern analysis */
  const flareByDay = useMemo(() => {
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    sessions.filter(s => s.type === "flare" && s.date).forEach(s => { const dow = getDayOfWeek(s.date); counts[dow]++; });
    return counts;
  }, [sessions]);
  const flareDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const maxFlareDay   = Object.entries(flareByDay).sort((a, b) => b[1] - a[1])[0];
  const worstFlareDay = maxFlareDay?.[1] > 0 ? flareDayNames[maxFlareDay[0]] : null;

  /* weekly session counts (last 8 weeks) */
  const weeklyData = useMemo(() => {
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() - (i * 7));
      const weekStart = new Date(weekEnd); weekStart.setDate(weekEnd.getDate() - 6);
      const ws = weekStart.toISOString().slice(0, 10);
      const we = weekEnd.toISOString().slice(0, 10);
      const inWeek = sessions.filter(s => s.date >= ws && s.date <= we);
      weeks.push({
        label: `W${8 - i}`,
        dateLabel: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        standard: inWeek.filter(s => s.type === "standard" || s.type === "optional").length,
        flare: inWeek.filter(s => s.type === "flare").length,
        total: inWeek.length,
      });
    }
    return weeks;
  }, [sessions]);
  const maxWeekly = Math.max(...weeklyData.map(w => w.total), 1);

  /* calendar heatmap */
  const calendarDays = useMemo(() => {
    const firstDow = firstDayOfMonth(viewMonth);
    const total    = daysInMonth(viewMonth);
    const days = [];
    for (let i = 0; i < firstDow; i++) days.push({ empty: true });
    for (let d = 1; d <= total; d++) {
      const dateStr = `${viewMonth}-${String(d).padStart(2, "0")}`;
      const sess    = sessions.filter(s => s.date === dateStr);
      const isFuture = dateStr > todayStr();
      const isToday  = dateStr === todayStr();
      days.push({ date: dateStr, d, sess, isFuture, isToday, type: sess.find(s => s.type === "flare") ? "flare" : sess.length > 0 ? "standard" : "none" });
    }
    return days;
  }, [viewMonth, sessions]);

  /* consistency pct */
  const consistencyPct = useMemo(() => {
    const daysElapsed = new Date().getDate();
    if (!daysElapsed) return 0;
    const activeDays = new Set(thisMonth.map(s => s.date)).size;
    return Math.round((activeDays / daysElapsed) * 100);
  }, [thisMonth]);

  function handleDeleteSession(id) {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated); saveSessions(updated);
  }

  const NAV_ITEMS = [
    { key: "dashboard", label: "Dashboard", action: () => navigate("/movement") },
    { key: "session",   label: "Session",   action: () => navigate("/movement/session/Full%20Body%20A") },
    { key: "library",   label: "Library",   action: () => navigate("/movement/library") },
    { key: "progress",  label: "Progress",  action: () => {} },
  ];

  return (
    <div style={styles.root}>

      {/* ── Nav ── */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.navBrand} onClick={() => navigate("/movement")} role="button">
            <AnchorMark size={28}/>
            <div><span style={styles.navProductName}>Anchor</span><span style={styles.navSister}>by Care Compass</span></div>
          </div>
          <div style={styles.navLinks}>
            {NAV_ITEMS.map(n => <button key={n.key} onClick={n.action} style={{ ...styles.navLink, ...(n.key === "progress" ? styles.navLinkActive : {}) }}>{n.label}</button>)}
          </div>
          <div style={styles.navActions}>
            <button onClick={() => navigate("/movement/flare")} style={{ ...styles.navCheckinBtn, background: TERRA }}>Flare mode</button>
            <div style={styles.navAvatar}>{firstName[0]?.toUpperCase()}</div>
          </div>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.container}>

          {/* Header */}
          <div style={styles.header}>
            <div>
              <p style={styles.eyebrow}>Your journey</p>
              <h1 style={styles.title}>Progress</h1>
              <p style={styles.subtitle}>{formatMonthYear(monthStr(0))} · {allSessions.length} total sessions logged</p>
            </div>
            <button onClick={() => navigate("/movement")} style={styles.btnSecondary}>← Dashboard</button>
          </div>

          {/* ── Tab bar ── */}
          <div style={styles.tabBar}>
            {[["overview", "Overview"], ["calendar", "Calendar"], ["sessions", "Session log"], ["insights", "Insights"]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{ ...styles.tab, ...(tab === key ? styles.tabActive : {}) }}>{label}</button>
            ))}
          </div>

          {/* ══════════ OVERVIEW TAB ══════════ */}
          {tab === "overview" && (
            <>
              {/* stat cards */}
              <div style={styles.statsGrid}>
                {[
                  { label: "Sessions this month",  value: thisMonth.length,     unit: "",     delta: thisMonth.length - lastMonth.length,       sub: `${standardCount} standard · ${flareCount} flare` },
                  { label: "Current streak",        value: streak,               unit: " days", delta: null,                                      sub: `Longest: ${longestStreak} days` },
                  { label: "Time moved",            value: Math.round(totalMins / 60 * 10) / 10, unit: "h", delta: Math.round((totalMins - lastTotalMins) / 60 * 10) / 10, sub: "this month" },
                  { label: "Consistency",           value: consistencyPct,       unit: "%",    delta: null,                                      sub: "active days / days elapsed" },
                ].map((s, i) => (
                  <div key={i} style={styles.statCard}>
                    <p style={styles.statLabel}>{s.label}</p>
                    <p style={styles.statValue}>{s.value}<span style={styles.statUnit}>{s.unit}</span></p>
                    {s.delta !== null && s.delta !== 0 && (
                      <p style={{ fontSize: "0.72rem", color: s.delta > 0 ? SLATE : TERRA, fontWeight: 600, margin: "0 0 0.2rem" }}>
                        {s.delta > 0 ? "+" : ""}{s.delta}{s.unit} vs last month
                      </p>
                    )}
                    <p style={styles.statSub}>{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* weekly bar chart */}
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div>
                    <p style={styles.sectionEyebrow}>Last 8 weeks</p>
                    <h2 style={styles.sectionTitle}>Weekly sessions</h2>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: SLATE }}/><span style={{ fontSize: "0.72rem", color: WARM_GRAY }}>Standard</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: TERRA }}/><span style={{ fontSize: "0.72rem", color: WARM_GRAY }}>Flare</span></div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, paddingBottom: 24 }}>
                  {weeklyData.map((w, i) => {
                    const stdH = Math.round((w.standard / maxWeekly) * 100);
                    const flrH = Math.round((w.flare / maxWeekly) * 100);
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0, height: "100%", justifyContent: "flex-end", position: "relative" }}>
                        {w.total > 0 && <span style={{ fontSize: "0.65rem", color: WARM_GRAY, marginBottom: 3, position: "absolute", top: -18 }}>{w.total}</span>}
                        {w.flare > 0 && <div style={{ width: "100%", background: TERRA, borderRadius: "3px 3px 0 0", height: `${flrH}%`, minHeight: 4, transition: "height 0.5s ease" }}/>}
                        {w.standard > 0 && <div style={{ width: "100%", background: SLATE, borderRadius: w.flare > 0 ? 0 : "3px 3px 0 0", height: `${stdH}%`, minHeight: 4, transition: "height 0.5s ease" }}/>}
                        {w.total === 0 && <div style={{ width: "100%", height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 2 }}/>}
                        <span style={{ fontSize: "0.62rem", color: WARM_GRAY, position: "absolute", bottom: -18 }}>{w.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* flare vs standard split */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={styles.sectionCard}>
                  <p style={styles.sectionEyebrow}>This month</p>
                  <h2 style={{ ...styles.sectionTitle, marginBottom: "1rem" }}>Session types</h2>
                  {thisMonth.length === 0 ? (
                    <p style={{ fontSize: "0.85rem", color: WARM_GRAY }}>No sessions yet this month.</p>
                  ) : (
                    <>
                      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: "0.75rem" }}>
                        <div style={{ width: `${Math.round((standardCount / thisMonth.length) * 100)}%`, background: SLATE }}/>
                        <div style={{ flex: 1, background: TERRA }}/>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: NAVY }}>{standardCount}</div>
                          <div style={{ fontSize: "0.72rem", color: WARM_GRAY }}>standard</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: TERRA }}>{flareCount}</div>
                          <div style={{ fontSize: "0.72rem", color: WARM_GRAY }}>flare</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: SLATE_MID }}>{thisMonth.filter(s => s.type === "optional").length}</div>
                          <div style={{ fontSize: "0.72rem", color: WARM_GRAY }}>optional</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div style={styles.sectionCard}>
                  <p style={styles.sectionEyebrow}>Progression</p>
                  <h2 style={{ ...styles.sectionTitle, marginBottom: "1rem" }}>Where you are</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    {[
                      { label: "Improve control", done: true },
                      { label: "Improve consistency", done: streak >= 5 },
                      { label: "Add reps", done: false },
                      { label: "Add load", done: false },
                    ].map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: s.done ? SLATE : "rgba(0,0,0,0.06)", border: s.done ? "none" : "1px solid rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {s.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span style={{ fontSize: "0.82rem", color: s.done ? INK : WARM_GRAY, fontWeight: s.done ? 500 : 400 }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Care Compass bridge */}
              <div style={{ background: SAGE_LIGHT, border: `1px solid ${SAGE}`, borderRadius: "1rem", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: SAGE_DARK, margin: "0 0 0.25rem" }}>Care Compass</p>
                  <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.95rem", fontWeight: 700, color: INK, margin: "0 0 0.2rem" }}>Cross-reference flare patterns with symptoms</p>
                  <p style={{ fontSize: "0.8rem", color: WARM_GRAY, margin: 0 }}>Your daily tracker data can help explain what's driving your flare days.</p>
                </div>
                <button onClick={() => navigate("/dashboard")} style={{ ...styles.btnSecondary, whiteSpace: "nowrap", fontSize: "0.85rem" }}>Open Care Compass →</button>
              </div>
            </>
          )}

          {/* ══════════ CALENDAR TAB ══════════ */}
          {tab === "calendar" && (
            <>
              <div style={styles.sectionCard}>
                {/* month nav */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <button onClick={() => { const d = new Date(viewMonth + "-01"); d.setMonth(d.getMonth() - 1); setViewMonth(d.toISOString().slice(0, 7)); }}
                    style={styles.monthNavBtn}>←</button>
                  <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: INK }}>{formatMonthYear(viewMonth)}</h2>
                  <button onClick={() => { const d = new Date(viewMonth + "-01"); d.setMonth(d.getMonth() + 1); setViewMonth(d.toISOString().slice(0, 7)); }}
                    disabled={viewMonth >= monthStr(0)}
                    style={{ ...styles.monthNavBtn, opacity: viewMonth >= monthStr(0) ? 0.3 : 1 }}>→</button>
                </div>
                {/* day labels */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: "0.65rem", color: WARM_GRAY, fontWeight: 600 }}>{d}</div>)}
                </div>
                {/* calendar grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {calendarDays.map((day, i) => {
                    if (day.empty) return <div key={i}/>;
                    const bg = day.isFuture ? "transparent" : day.type === "flare" ? TERRA_LIGHT : day.type === "standard" ? MIST : "transparent";
                    const border = day.isToday ? `2px solid ${NAVY}` : day.isFuture ? "1px solid rgba(0,0,0,0.06)" : day.type !== "none" ? `1px solid ${day.type === "flare" ? TERRA_BORDER : MIST_BORDER}` : "1px solid rgba(0,0,0,0.06)";
                    const color = day.isFuture ? WARM_GRAY : day.type === "flare" ? TERRA_DARK : day.type === "standard" ? NAVY : WARM_GRAY;
                    return (
                      <div key={i} style={{ aspectRatio: "1", borderRadius: 6, background: bg, border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: day.isToday ? 700 : 400, color, cursor: day.sess?.length > 0 ? "pointer" : "default" }}
                        title={day.sess?.map(s => s.sessionName).join(", ")}>
                        {day.d}
                      </div>
                    );
                  })}
                </div>
                {/* legend */}
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  {[{ color: SLATE, bg: MIST, border: MIST_BORDER, label: "Standard" }, { color: TERRA_DARK, bg: TERRA_LIGHT, border: TERRA_BORDER, label: "Flare" }, { color: WARM_GRAY, bg: "transparent", border: "rgba(0,0,0,0.06)", label: "Rest / no session" }].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: l.bg, border: `1px solid ${l.border}` }}/>
                      <span style={{ fontSize: "0.72rem", color: WARM_GRAY }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* sessions in viewed month */}
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div>
                    <p style={styles.sectionEyebrow}>{formatMonthYear(viewMonth)}</p>
                    <h2 style={styles.sectionTitle}>Sessions this month</h2>
                  </div>
                  <span style={{ fontSize: "0.82rem", color: WARM_GRAY, fontWeight: 500 }}>{sessions.filter(s => s.date?.startsWith(viewMonth)).length} total</span>
                </div>
                {sessions.filter(s => s.date?.startsWith(viewMonth)).length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: WARM_GRAY, textAlign: "center", padding: "1.5rem 0" }}>No sessions logged in {formatMonthYear(viewMonth)}.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    {sessions.filter(s => s.date?.startsWith(viewMonth)).sort((a, b) => b.date.localeCompare(a.date)).map(s => (
                      <SessionRow key={s.id} session={s} onDelete={handleDeleteSession}/>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══════════ SESSION LOG TAB ══════════ */}
          {tab === "sessions" && (
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div>
                  <p style={styles.sectionEyebrow}>All time</p>
                  <h2 style={styles.sectionTitle}>Session history</h2>
                </div>
                <span style={{ fontSize: "0.82rem", color: WARM_GRAY }}>{allSessions.length} sessions</span>
              </div>
              {allSessions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                  <AnchorMark size={48}/>
                  <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: "1rem 0 0.5rem" }}>No sessions yet</p>
                  <p style={{ fontSize: "0.875rem", color: WARM_GRAY, margin: "0 0 1.5rem" }}>Your first session will appear here.</p>
                  <button onClick={() => navigate("/movement/session/Full%20Body%20A")} style={styles.btnPrimary}>Start Full Body A →</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  {allSessions.map(s => <SessionRow key={s.id} session={s} onDelete={handleDeleteSession}/>)}
                </div>
              )}
            </div>
          )}

          {/* ══════════ INSIGHTS TAB ══════════ */}
          {tab === "insights" && (
            <>
              {allSessions.length < 3 ? (
                <div style={{ ...styles.sectionCard, textAlign: "center", padding: "2.5rem 1.5rem" }}>
                  <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: INK, margin: "0 0 0.5rem" }}>Insights need more data</p>
                  <p style={{ fontSize: "0.875rem", color: WARM_GRAY, lineHeight: 1.7, maxWidth: 360, margin: "0 auto 1.5rem" }}>Log at least 3 sessions to start seeing patterns. The more you log, the more useful this becomes.</p>
                  <button onClick={() => navigate("/movement")} style={styles.btnPrimary}>Start a session →</button>
                </div>
              ) : (
                <>
                  {/* consistency insight */}
                  <div style={{ ...styles.insightCard, borderColor: consistencyPct >= 60 ? MIST_BORDER : TERRA_BORDER, background: consistencyPct >= 60 ? MIST : TERRA_LIGHT }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: consistencyPct >= 60 ? SLATE : TERRA, margin: "0 0 0.35rem" }}>
                      {consistencyPct >= 60 ? "Consistency" : "Heads up"}
                    </p>
                    <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: "0 0 0.4rem" }}>
                      {consistencyPct >= 80 ? "Strong month — you're building real consistency." : consistencyPct >= 60 ? "Solid consistency this month. Keep the habit." : "Consistency is below 60% — the habit is the priority right now."}
                    </p>
                    <p style={{ fontSize: "0.82rem", color: INK_LIGHT, lineHeight: 1.6, margin: 0 }}>
                      {consistencyPct}% of days elapsed this month included a session. {consistencyPct < 60 ? "Even a 10-minute flare session counts — consistency over intensity." : "Flare days included."}
                    </p>
                  </div>

                  {/* flare pattern */}
                  {worstFlareDay && (
                    <div style={{ ...styles.insightCard, borderColor: TERRA_BORDER, background: TERRA_LIGHT }}>
                      <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: TERRA, margin: "0 0 0.35rem" }}>Pattern detected</p>
                      <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: "0 0 0.4rem" }}>
                        Your flare days cluster on {worstFlareDay}s
                      </p>
                      <p style={{ fontSize: "0.82rem", color: INK_LIGHT, lineHeight: 1.6, margin: "0 0 0.75rem" }}>
                        {flareCount} of your flare days this month fell on {worstFlareDay}. This could be cumulative fatigue from mid-week sessions, sleep patterns, or activity on the day before. Worth noting in Care Compass.
                      </p>
                      <button onClick={() => navigate("/dashboard")} style={{ fontSize: "0.8rem", background: "none", border: `1px solid ${TERRA_BORDER}`, borderRadius: "100px", padding: "0.35rem 1rem", color: TERRA_DARK, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Log this in Care Compass →</button>
                    </div>
                  )}

                  {/* flare recovery */}
                  {flareCount > 0 && (
                    <div style={{ ...styles.insightCard, borderColor: MIST_BORDER, background: MIST }}>
                      <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: SLATE, margin: "0 0 0.35rem" }}>Resilience</p>
                      <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: "0 0 0.4rem" }}>
                        You showed up on {flareCount} flare {flareCount === 1 ? "day" : "days"} this month.
                      </p>
                      <p style={{ fontSize: "0.82rem", color: INK_LIGHT, lineHeight: 1.6, margin: 0 }}>
                        Those sessions count. Maintaining the habit on hard days is exactly what prevents the boom/bust cycle. The program is working.
                      </p>
                    </div>
                  )}

                  {/* streak insight */}
                  <div style={{ ...styles.insightCard, borderColor: "rgba(0,0,0,0.08)", background: CREAM }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: WARM_GRAY, margin: "0 0 0.35rem" }}>Streak</p>
                    <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: "0 0 0.4rem" }}>
                      Current: {streak} days · Longest: {longestStreak} days
                    </p>
                    <p style={{ fontSize: "0.82rem", color: INK_LIGHT, lineHeight: 1.6, margin: 0 }}>
                      {streak === 0 ? "Start a session today to begin your streak. Rest days break the streak — but flare sessions keep it alive." : streak >= 7 ? "A week-long streak with hEDS is genuinely significant. Keep the habit — not the intensity." : "Every day you move safely, the habit gets stronger."}
                    </p>
                  </div>

                  {/* progression note */}
                  <div style={{ ...styles.insightCard, borderColor: MIST_BORDER, background: "#fff" }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: SLATE, margin: "0 0 0.35rem" }}>Next progression step</p>
                    <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: "0 0 0.4rem" }}>
                      Add reps before adding load.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: INK_LIGHT, lineHeight: 1.6, margin: "0 0 0.75rem" }}>
                      With hEDS, progression should be boring — and that's a good thing. Once you can hit 2×12 with full control across 3 consecutive sessions, you're ready to add a small load increment.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[
                        { step: "2×8 → 2×10", done: true },
                        { step: "2×10 → 2×12", done: standardCount >= 6 },
                        { step: "Add small load, return to 2×8", done: false },
                      ].map((s, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", background: s.done ? SLATE : "rgba(0,0,0,0.06)", border: s.done ? "none" : "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {s.done && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l1.5 1.5 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span style={{ fontSize: "0.8rem", color: s.done ? INK : WARM_GRAY }}>{s.step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>Anchor by Care Compass · <a href="https://joincarecompass.com" style={styles.footerLink}>joincarecompass.com</a></p>
        <p style={styles.footerDisclaimer}>Not medical advice. Always work with your healthcare team.</p>
      </footer>
    </div>
  );
}

/* ─── SessionRow ───────────────────────────────────────────────────────────── */
function SessionRow({ session, onDelete }) {
  const typeColor = session.type === "flare" ? TERRA : session.type === "rest" ? WARM_GRAY : SLATE;
  const typeBg    = session.type === "flare" ? TERRA_LIGHT : session.type === "rest" ? CREAM : MIST;
  const typeLabel = session.type === "flare" ? "Flare" : session.type === "rest" ? "Rest" : "Standard";
  return (
    <div style={{ background: "#fff", borderRadius: "0.875rem", border: "1px solid rgba(0,0,0,0.07)", borderLeft: `3px solid ${typeColor}`, padding: "0.875rem 1.1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.9rem", fontWeight: 700, color: INK }}>{session.sessionName}</span>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.12rem 0.55rem", borderRadius: "100px", background: typeBg, color: typeColor, marginLeft: "auto", whiteSpace: "nowrap" }}>{typeLabel}</span>
        </div>
        <p style={{ fontSize: "0.75rem", color: SLATE, margin: "0 0 0.15rem", fontWeight: 500 }}>{formatShortDate(session.date)} · {session.duration} min</p>
        {session.painLevel && <p style={{ fontSize: "0.72rem", color: WARM_GRAY, margin: 0 }}>Pain: {session.painLevel}/10 · Energy: {session.energyLevel}/10</p>}
        {session.notes && <p style={{ fontSize: "0.75rem", color: INK_LIGHT, margin: "0.2rem 0 0", fontStyle: "italic" }}>"{session.notes}"</p>}
      </div>
      <button onClick={() => onDelete(session.id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", flexShrink: 0, padding: "0.2rem" }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
    </div>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */
const styles = {
  root:            { minHeight: "100vh", background: OFF_WHITE, display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif", color: INK },
  nav:             { background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)", position: "sticky", top: 0, zIndex: 100 },
  navInner:        { maxWidth: 1100, margin: "0 auto", padding: "0 1.25rem", height: 60, display: "flex", alignItems: "center", gap: "1.5rem" },
  navBrand:        { display: "flex", alignItems: "center", gap: "0.65rem", flexShrink: 0, cursor: "pointer" },
  navProductName:  { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, display: "block", lineHeight: 1.2 },
  navSister:       { fontSize: "0.65rem", color: SAGE, display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" },
  navLinks:        { display: "flex", gap: "0.25rem", flex: 1 },
  navLink:         { background: "none", border: "none", padding: "0.4rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.875rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" },
  navLinkActive:   { background: MIST, color: NAVY, fontWeight: 600 },
  navActions:      { display: "flex", alignItems: "center", gap: "0.75rem" },
  navCheckinBtn:   { background: NAVY, color: "#fff", border: "none", borderRadius: "100px", padding: "0.45rem 1.1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  navAvatar:       { width: 32, height: 32, borderRadius: "50%", background: NAVY, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", fontFamily: "'Playfair Display', Georgia, serif" },
  main:            { flex: 1, padding: "2rem 1.25rem", boxSizing: "border-box", width: "100%" },
  container:       { maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" },
  header:          { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" },
  eyebrow:         { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: SLATE, margin: "0 0 0.3rem" },
  title:           { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: INK, margin: "0 0 0.4rem", letterSpacing: "-0.02em" },
  subtitle:        { fontSize: "0.95rem", color: WARM_GRAY, margin: 0, lineHeight: 1.6 },
  tabBar:          { display: "flex", gap: 0, borderBottom: "1px solid rgba(0,0,0,0.07)" },
  tab:             { padding: "0.6rem 1.1rem", fontSize: "0.875rem", color: WARM_GRAY, background: "none", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", fontFamily: "inherit", marginBottom: "-1px", transition: "all 0.15s" },
  tabActive:       { color: NAVY, borderBottomColor: NAVY, fontWeight: 600 },
  statsGrid:       { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem" },
  statCard:        { background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.25rem 1.5rem" },
  statLabel:       { fontSize: "0.72rem", fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.35rem" },
  statValue:       { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: NAVY, margin: "0 0 0.2rem", lineHeight: 1 },
  statUnit:        { fontSize: "0.9rem", fontWeight: 400, color: WARM_GRAY },
  statSub:         { fontSize: "0.72rem", color: WARM_GRAY, margin: 0 },
  sectionCard:     { background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
  sectionHeader:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  sectionEyebrow:  { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: SLATE, margin: "0 0 0.3rem" },
  sectionTitle:    { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: INK, margin: 0 },
  insightCard:     { borderRadius: "1rem", padding: "1.25rem 1.5rem", border: "1px solid" },
  monthNavBtn:     { background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "0.5rem", padding: "0.3rem 0.75rem", fontSize: "0.9rem", cursor: "pointer", color: WARM_GRAY, fontFamily: "inherit" },
  btnPrimary:      { background: NAVY, color: "#fff", padding: "0.7rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit" },
  btnSecondary:    { background: "transparent", color: SAGE_DARK, border: `1px solid ${SAGE}`, padding: "0.7rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  footer:          { padding: "1.5rem 2rem", borderTop: "1px solid rgba(0,0,0,0.07)", textAlign: "center" },
  footerText:      { fontSize: "0.85rem", color: WARM_GRAY, margin: "0 0 0.25rem" },
  footerLink:      { color: SAGE_DARK, textDecoration: "none" },
  footerDisclaimer: { fontSize: "0.75rem", color: "#aaa", margin: 0 },
};
