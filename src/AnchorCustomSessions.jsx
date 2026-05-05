import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ── Brand tokens (matches Anchor system) ─────────────────────────────────── */
const NAVY   = "#1a3a5c";
const SLATE  = "#3a6ea8";
const MIST   = "#eaf2f8";
const CREAM  = "#fdf8f3";
const TERRA  = "#b05a3a";
const TERRA_L = "#fdf3ee";
const SAGE   = "#7a9e87";
const SAGE_D = "#4a7a5a";
const INK    = "#1a1a2e";
const INK_L  = "#4a4a6a";
const WARM_G = "#8a8a9a";
const WHITE  = "#ffffff";
const BORDER = "#dde5f0";

/* ── Exercise library (same data as AnchorLibrary) ───────────────────────── */
const LIBRARY = [
  { id: "e1",  name: "Glute Bridge",         category: "Lower Body",  joints: ["hips","low back"], tags: ["glutes","posterior chain"], flare: false, duration: "45s" },
  { id: "e2",  name: "Wall Sit",             category: "Lower Body",  joints: ["knees","hips"],    tags: ["quads","isometric"],        flare: false, duration: "30s" },
  { id: "e3",  name: "Clamshell",            category: "Lower Body",  joints: ["hips"],            tags: ["hip abductors","glutes"],   flare: true,  duration: "45s" },
  { id: "e4",  name: "Terminal Knee Ext.",   category: "Lower Body",  joints: ["knees"],           tags: ["quads","VMO"],              flare: true,  duration: "45s" },
  { id: "e5",  name: "Seated Hip Flexion",   category: "Lower Body",  joints: ["hips"],            tags: ["hip flexors","core"],       flare: true,  duration: "30s" },
  { id: "e6",  name: "Dead Bug",             category: "Core",        joints: ["low back"],        tags: ["core","stability"],         flare: true,  duration: "45s" },
  { id: "e7",  name: "Pallof Press",         category: "Core",        joints: ["wrists","low back"],tags: ["anti-rotation","core"],   flare: false, duration: "40s" },
  { id: "e8",  name: "Cat-Cow",             category: "Mobility",    joints: ["low back","neck"],  tags: ["spine","mobility"],        flare: true,  duration: "60s" },
  { id: "e9",  name: "Scapular Retraction", category: "Upper Body",  joints: ["shoulders"],       tags: ["rhomboids","posture"],      flare: true,  duration: "40s" },
  { id: "e10", name: "Wall Angels",         category: "Upper Body",  joints: ["shoulders","neck"],tags: ["scapular","mobility"],      flare: true,  duration: "45s" },
  { id: "e11", name: "Band Pull-Apart",     category: "Upper Body",  joints: ["shoulders","wrists"],tags: ["posterior shoulder"],    flare: false, duration: "45s" },
  { id: "e12", name: "Seated Row",          category: "Upper Body",  joints: ["shoulders","wrists"],tags: ["rhomboids","lats"],      flare: false, duration: "45s" },
  { id: "e13", name: "Supine Hip Rotation", category: "Mobility",    joints: ["hips","low back"], tags: ["mobility","spine"],        flare: true,  duration: "60s" },
  { id: "e14", name: "Heel Raise",          category: "Lower Body",  joints: ["ankles"],          tags: ["calves","proprioception"], flare: true,  duration: "45s" },
  { id: "e15", name: "Prone Cobra",         category: "Upper Body",  joints: ["low back","neck"], tags: ["extensors","posture"],     flare: true,  duration: "30s" },
  { id: "e16", name: "Standing March",      category: "Core",        joints: ["hips","ankles"],   tags: ["balance","hip flexors"],   flare: true,  duration: "45s" },
];

const CATEGORIES = ["All", "Lower Body", "Upper Body", "Core", "Mobility"];

const CUSTOM_KEY = "anchor-custom-sessions";

function loadCustomSessions() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || []; }
  catch { return []; }
}
function saveCustomSessions(arr) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(arr));
}

/* ── Drag-to-reorder mini hook ───────────────────────────────────────────── */
function useDragList(items, setItems) {
  const dragIdx = useRef(null);
  const onDragStart = (i) => { dragIdx.current = i; };
  const onDragOver  = (e, i) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    const next = [...items];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(i, 0, moved);
    dragIdx.current = i;
    setItems(next);
  };
  const onDragEnd = () => { dragIdx.current = null; };
  return { onDragStart, onDragOver, onDragEnd };
}

/* ── Small components ────────────────────────────────────────────────────── */
function AnchorMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="8" r="4" stroke={NAVY} strokeWidth="2.5" fill="none"/>
      <line x1="16" y1="12" x2="16" y2="28" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="8"  y1="20" x2="24" y2="20" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M9 27 Q16 31 23 27" stroke={NAVY} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function CategoryPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${active ? SLATE : BORDER}`,
      background: active ? MIST : WHITE, color: active ? SLATE : WARM_G,
      fontSize: "0.78rem", fontWeight: active ? 700 : 500, cursor: "pointer",
      transition: "all 0.15s", whiteSpace: "nowrap",
    }}>
      {label}
    </button>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function AnchorCustomSessions() {
  const navigate = useNavigate();

  // view: "list" | "builder"
  const [view, setView]               = useState("list");
  const [saved, setSaved]             = useState(loadCustomSessions);

  // Builder state
  const [sessionName, setSessionName] = useState("");
  const [sessionExs,  setSessionExs]  = useState([]);  // array of exercise ids in order
  const [editingId,   setEditingId]   = useState(null); // id of saved session being edited

  // Library filter state (inside builder)
  const [filterCat,   setFilterCat]   = useState("All");
  const [search,      setSearch]      = useState("");
  const [flareOnly,   setFlareOnly]   = useState(false);

  // Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const drag = useDragList(sessionExs, setSessionExs);

  /* ── Filtered library ── */
  const filtered = LIBRARY.filter(ex => {
    if (filterCat !== "All" && ex.category !== filterCat) return false;
    if (flareOnly && !ex.flare) return false;
    if (search) {
      const q = search.toLowerCase();
      return ex.name.toLowerCase().includes(q) || ex.tags.some(t => t.includes(q));
    }
    return true;
  });

  /* ── Builder helpers ── */
  function openNew() {
    setSessionName(""); setSessionExs([]); setEditingId(null);
    setView("builder");
  }
  function openEdit(s) {
    setSessionName(s.name); setSessionExs(s.exercises); setEditingId(s.id);
    setView("builder");
  }
  function toggleExercise(id) {
    setSessionExs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }
  function removeFromSession(id) {
    setSessionExs(prev => prev.filter(x => x !== id));
  }
  function moveUp(i) {
    if (i === 0) return;
    const next = [...sessionExs]; [next[i-1], next[i]] = [next[i], next[i-1]]; setSessionExs(next);
  }
  function moveDown(i) {
    if (i === sessionExs.length - 1) return;
    const next = [...sessionExs]; [next[i], next[i+1]] = [next[i+1], next[i]]; setSessionExs(next);
  }
  function saveSession() {
    if (!sessionName.trim() || sessionExs.length === 0) return;
    const id = editingId || `custom-${Date.now()}`;
    const session = { id, name: sessionName.trim(), exercises: sessionExs, updatedAt: Date.now() };
    const updated = editingId
      ? saved.map(s => s.id === editingId ? session : s)
      : [session, ...saved];
    setSaved(updated);
    saveCustomSessions(updated);
    setView("list");
  }
  function deleteSession(id) {
    const updated = saved.filter(s => s.id !== id);
    setSaved(updated); saveCustomSessions(updated); setDeleteConfirm(null);
  }
  function launchSession(s) {
    // Navigate to session player with custom session name
    navigate(`/movement/session/${encodeURIComponent(s.name)}`, {
      state: { customExercises: s.exercises }
    });
  }

  const canSave = sessionName.trim().length > 0 && sessionExs.length > 0;
  const exMap   = Object.fromEntries(LIBRARY.map(e => [e.id, e]));

  /* ──────────────────────────────────────────────────────────────────────── */
  /*  RENDER: SESSION LIST                                                    */
  /* ──────────────────────────────────────────────────────────────────────── */
  if (view === "list") return (
    <div style={S.root}>
      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <button onClick={() => navigate("/movement")} style={S.navBrand}>
            <AnchorMark size={26}/><span style={S.navName}>Anchor</span>
          </button>
          <div style={S.navLinks}>
            {[["Dashboard","/movement"],["Library","/movement/library"],["Progress","/movement/progress"]].map(([label, path]) => (
              <button key={path} onClick={() => navigate(path)} style={S.navLink}>{label}</button>
            ))}
          </div>
        </div>
      </nav>

      <main style={S.main}>
        <div style={S.container}>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap", marginBottom:32 }}>
            <div>
              <p style={S.eyebrow}>My Sessions</p>
              <h1 style={S.h1}>Custom Sessions</h1>
              <p style={S.subtitle}>Build named sessions from the exercise library and launch them anytime.</p>
            </div>
            <button onClick={openNew} style={S.primaryBtn}>
              + New Session
            </button>
          </div>

          {/* Empty state */}
          {saved.length === 0 && (
            <div style={S.emptyCard}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🏗️</div>
              <p style={{ ...S.bodyText, fontWeight: 700, marginBottom: 6 }}>No custom sessions yet</p>
              <p style={{ ...S.bodyText, color: WARM_G, marginBottom: 20 }}>
                Build your first session by picking exercises from the library and giving it a name.
              </p>
              <button onClick={openNew} style={S.primaryBtn}>Build your first session</button>
            </div>
          )}

          {/* Session cards */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {saved.map(s => {
              const exCount = s.exercises.length;
              const flareCount = s.exercises.filter(id => exMap[id]?.flare).length;
              return (
                <div key={s.id} style={S.sessionCard}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={S.sessionCardName}>{s.name}</span>
                      <span style={S.badge}>{exCount} exercise{exCount !== 1 ? "s" : ""}</span>
                      {flareCount > 0 && <span style={{ ...S.badge, background: TERRA_L, color: TERRA }}>🌿 Flare-safe</span>}
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {s.exercises.slice(0,4).map(id => (
                        <span key={id} style={S.exTag}>{exMap[id]?.name || id}</span>
                      ))}
                      {s.exercises.length > 4 && <span style={S.exTag}>+{s.exercises.length - 4} more</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    <button onClick={() => openEdit(s)} style={S.ghostBtn}>Edit</button>
                    <button onClick={() => setDeleteConfirm(s.id)} style={{ ...S.ghostBtn, color: TERRA, borderColor: TERRA }}>Delete</button>
                    <button onClick={() => launchSession(s)} style={S.primaryBtn}>▶ Start</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <p style={{ ...S.bodyText, fontWeight: 700, marginBottom: 8 }}>Delete this session?</p>
            <p style={{ ...S.bodyText, color: WARM_G, marginBottom: 20 }}>This can't be undone.</p>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setDeleteConfirm(null)} style={S.ghostBtn}>Cancel</button>
              <button onClick={() => deleteSession(deleteConfirm)} style={{ ...S.primaryBtn, background: TERRA }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ──────────────────────────────────────────────────────────────────────── */
  /*  RENDER: SESSION BUILDER                                                 */
  /* ──────────────────────────────────────────────────────────────────────── */
  return (
    <div style={S.root}>
      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <button onClick={() => navigate("/movement")} style={S.navBrand}>
            <AnchorMark size={26}/><span style={S.navName}>Anchor</span>
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={() => setView("list")} style={S.ghostBtn}>← Back to sessions</button>
          </div>
        </div>
      </nav>

      <main style={S.main}>
        <div style={S.container}>

          <p style={S.eyebrow}>{editingId ? "Edit Session" : "Session Builder"}</p>
          <h1 style={{ ...S.h1, marginBottom: 4 }}>
            {editingId ? "Update your session" : "Build a custom session"}
          </h1>
          <p style={{ ...S.subtitle, marginBottom: 28 }}>
            Name your session, pick exercises from the library, then arrange them in order.
          </p>

          {/* Session name input */}
          <div style={S.nameBlock}>
            <label style={S.label}>Session name</label>
            <input
              type="text"
              placeholder="e.g. Morning Hip & Core, Gentle Shoulder Day…"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              maxLength={60}
              style={S.nameInput}
            />
          </div>

          {/* Two-column layout */}
          <div style={S.builderLayout}>

            {/* ── LEFT: Library picker ── */}
            <div style={S.panel}>
              <div style={S.panelHeader}>
                <span style={S.panelTitle}>Exercise Library</span>
                <span style={S.panelCount}>{filtered.length} shown</span>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search exercises…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...S.nameInput, marginBottom: 10 }}
              />

              {/* Category pills */}
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                {CATEGORIES.map(c => (
                  <CategoryPill key={c} label={c} active={filterCat === c} onClick={() => setFilterCat(c)}/>
                ))}
              </div>

              {/* Flare toggle */}
              <label style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, cursor:"pointer", fontSize:"0.82rem", color: SAGE_D }}>
                <input
                  type="checkbox"
                  checked={flareOnly}
                  onChange={e => setFlareOnly(e.target.checked)}
                  style={{ accentColor: SAGE_D, width:15, height:15 }}
                />
                Show flare-safe exercises only
              </label>

              {/* Exercise list */}
              <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:420, overflowY:"auto", paddingRight:4 }}>
                {filtered.map(ex => {
                  const inSession = sessionExs.includes(ex.id);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => toggleExercise(ex.id)}
                      style={{
                        ...S.libCard,
                        borderColor: inSession ? SLATE : BORDER,
                        background:  inSession ? MIST  : WHITE,
                      }}
                    >
                      <div style={{ flex:1, textAlign:"left" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:"0.88rem", fontWeight:700, color: INK }}>{ex.name}</span>
                          {ex.flare && <span style={{ fontSize:"0.65rem", color: SAGE_D, background:"#e8f5e9", padding:"2px 6px", borderRadius:8 }}>🌿 Flare-safe</span>}
                        </div>
                        <span style={{ fontSize:"0.72rem", color: WARM_G }}>{ex.category} · {ex.duration}</span>
                      </div>
                      <div style={{
                        width:22, height:22, borderRadius:"50%",
                        border: `2px solid ${inSession ? SLATE : BORDER}`,
                        background: inSession ? SLATE : "transparent",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        flexShrink:0,
                        transition:"all 0.15s",
                      }}>
                        {inSession && <span style={{ color:WHITE, fontSize:"0.7rem", fontWeight:900 }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p style={{ color: WARM_G, fontSize:"0.82rem", textAlign:"center", padding:"24px 0" }}>No exercises match your filters.</p>
                )}
              </div>
            </div>

            {/* ── RIGHT: Session order ── */}
            <div style={S.panel}>
              <div style={S.panelHeader}>
                <span style={S.panelTitle}>Your Session</span>
                <span style={S.panelCount}>{sessionExs.length} exercise{sessionExs.length !== 1 ? "s" : ""}</span>
              </div>

              {sessionExs.length === 0 ? (
                <div style={S.emptyPanel}>
                  <p style={{ color: WARM_G, fontSize:"0.84rem", textAlign:"center" }}>
                    Tap exercises in the library to add them here. Drag to reorder.
                  </p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:480, overflowY:"auto", paddingRight:4 }}>
                  {sessionExs.map((id, i) => {
                    const ex = exMap[id];
                    if (!ex) return null;
                    return (
                      <div
                        key={id}
                        draggable
                        onDragStart={() => drag.onDragStart(i)}
                        onDragOver={e => drag.onDragOver(e, i)}
                        onDragEnd={drag.onDragEnd}
                        style={S.orderCard}
                      >
                        <span style={S.dragHandle} title="Drag to reorder">⠿</span>
                        <span style={S.orderNum}>{i + 1}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:"0.86rem", color:INK, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{ex.name}</div>
                          <div style={{ fontSize:"0.72rem", color:WARM_G }}>{ex.category} · {ex.duration}</div>
                        </div>
                        <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                          <button onClick={() => moveUp(i)} disabled={i===0} style={S.arrowBtn}>↑</button>
                          <button onClick={() => moveDown(i)} disabled={i===sessionExs.length-1} style={S.arrowBtn}>↓</button>
                          <button onClick={() => removeFromSession(id)} style={{ ...S.arrowBtn, color:TERRA }}>×</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Save button */}
              <div style={{ marginTop:20, borderTop:`1px solid ${BORDER}`, paddingTop:16 }}>
                {!canSave && (
                  <p style={{ fontSize:"0.78rem", color:WARM_G, marginBottom:10 }}>
                    {!sessionName.trim() ? "Add a session name to save." : "Add at least one exercise to save."}
                  </p>
                )}
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => setView("list")} style={{ ...S.ghostBtn, flex:1 }}>Cancel</button>
                  <button
                    onClick={saveSession}
                    disabled={!canSave}
                    style={{
                      ...S.primaryBtn, flex:2,
                      opacity: canSave ? 1 : 0.4,
                      cursor: canSave ? "pointer" : "not-allowed",
                    }}
                  >
                    {editingId ? "Update session" : "Save session"}
                  </button>
                </div>
              </div>
            </div>

          </div>{/* end builderLayout */}
        </div>
      </main>
    </div>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const S = {
  root: { minHeight:"100vh", background:CREAM, fontFamily:"'Lato', 'Helvetica Neue', sans-serif" },

  nav: { background:WHITE, borderBottom:`1px solid ${BORDER}`, position:"sticky", top:0, zIndex:50 },
  navInner: { maxWidth:1100, margin:"0 auto", padding:"0 24px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" },
  navBrand: { display:"flex", alignItems:"center", gap:10, background:"none", border:"none", cursor:"pointer", padding:0 },
  navName: { fontFamily:"'Playfair Display', Georgia, serif", fontSize:"1.1rem", fontWeight:700, color:NAVY },
  navLinks: { display:"flex", gap:4 },
  navLink: { background:"none", border:"none", cursor:"pointer", padding:"6px 14px", borderRadius:8, fontSize:"0.85rem", color:INK_L, fontWeight:500 },

  main: { padding:"40px 24px 80px" },
  container: { maxWidth:1100, margin:"0 auto" },

  eyebrow: { fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:SLATE, marginBottom:6 },
  h1: { fontFamily:"'Playfair Display', Georgia, serif", fontSize:"2rem", fontWeight:700, color:NAVY, marginBottom:8 },
  subtitle: { fontSize:"0.92rem", color:INK_L, lineHeight:1.6 },
  bodyText: { fontSize:"0.9rem", color:INK_L, lineHeight:1.6 },
  label: { display:"block", fontSize:"0.78rem", fontWeight:700, color:INK_L, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 },

  primaryBtn: {
    background:NAVY, color:WHITE, border:"none", borderRadius:10, padding:"10px 20px",
    fontSize:"0.86rem", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
    transition:"opacity 0.15s",
  },
  ghostBtn: {
    background:"transparent", color:INK_L, border:`1.5px solid ${BORDER}`, borderRadius:10,
    padding:"9px 16px", fontSize:"0.84rem", fontWeight:600, cursor:"pointer",
    transition:"all 0.15s",
  },
  arrowBtn: {
    background:"transparent", border:`1px solid ${BORDER}`, borderRadius:6,
    width:26, height:26, fontSize:"0.8rem", cursor:"pointer", color:INK_L,
    display:"flex", alignItems:"center", justifyContent:"center",
    padding:0,
  },

  emptyCard: {
    background:WHITE, border:`1.5px dashed ${BORDER}`, borderRadius:16,
    padding:"48px 32px", textAlign:"center",
  },
  sessionCard: {
    background:WHITE, border:`1.5px solid ${BORDER}`, borderRadius:14,
    padding:"18px 20px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap",
    transition:"box-shadow 0.15s",
  },
  sessionCardName: { fontFamily:"'Playfair Display', Georgia, serif", fontSize:"1.05rem", fontWeight:700, color:NAVY },
  badge: { fontSize:"0.72rem", fontWeight:700, background:MIST, color:SLATE, padding:"3px 8px", borderRadius:8 },
  exTag: { fontSize:"0.72rem", color:INK_L, background:CREAM, border:`1px solid ${BORDER}`, borderRadius:6, padding:"2px 8px" },

  nameBlock: { marginBottom:24 },
  nameInput: {
    width:"100%", padding:"11px 14px", border:`1.5px solid ${BORDER}`, borderRadius:10,
    fontSize:"0.9rem", color:INK, background:WHITE, outline:"none", boxSizing:"border-box",
    fontFamily:"inherit",
  },

  builderLayout: {
    display:"grid",
    gridTemplateColumns:"1fr 1fr",
    gap:20,
  },
  panel: {
    background:WHITE, border:`1.5px solid ${BORDER}`, borderRadius:16,
    padding:20,
  },
  panelHeader: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 },
  panelTitle: { fontFamily:"'Playfair Display', Georgia, serif", fontSize:"1rem", fontWeight:700, color:NAVY },
  panelCount: { fontSize:"0.75rem", color:WARM_G },
  emptyPanel: {
    minHeight:160, border:`1.5px dashed ${BORDER}`, borderRadius:10,
    display:"flex", alignItems:"center", justifyContent:"center", padding:24,
  },

  libCard: {
    display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
    border:"1.5px solid", borderRadius:10, cursor:"pointer",
    transition:"all 0.12s", background:WHITE, width:"100%",
  },
  orderCard: {
    display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
    border:`1.5px solid ${BORDER}`, borderRadius:10, background:CREAM,
    cursor:"grab",
  },
  dragHandle: { fontSize:"1rem", color:WARM_G, cursor:"grab", userSelect:"none" },
  orderNum: {
    width:22, height:22, borderRadius:"50%", background:MIST, color:SLATE,
    fontSize:"0.72rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center",
    flexShrink:0,
  },

  modalOverlay: {
    position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex",
    alignItems:"center", justifyContent:"center", zIndex:200, padding:24,
  },
  modal: {
    background:WHITE, borderRadius:16, padding:28, maxWidth:360, width:"100%",
    boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
  },
};
