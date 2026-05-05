import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";

/* ── Brand tokens ─────────────────────────────────────────────────────────── */
const NAVY    = "#1a3a5c";
const SLATE   = "#3a6ea8";
const MIST    = "#eaf2f8";
const CREAM   = "#fdf8f3";
const TERRA   = "#b05a3a";
const TERRA_L = "#fdf3ee";
const SAGE    = "#7a9e87";
const SAGE_D  = "#4a7a5a";
const INK     = "#1a1a2e";
const INK_L   = "#4a4a6a";
const WARM_G  = "#8a8a9a";
const WHITE   = "#ffffff";
const BORDER  = "#dde5f0";
const GREEN   = "#2e7d32";
const GREEN_L = "#e8f5e9";

/* ── Exercise library (shared with AnchorLibrary & AnchorCustomSessions) ─── */
const LIBRARY = [
  { id: "e1",  name: "Glute Bridge",         category: "Lower Body",  joints: ["hips","low back"], tags: ["glutes","posterior chain"], flare: false, duration: "45s", sets: "3×10", cue: "Feet hip-width, press through heels, squeeze glutes at top." },
  { id: "e2",  name: "Wall Sit",             category: "Lower Body",  joints: ["knees","hips"],    tags: ["quads","isometric"],        flare: false, duration: "30s", sets: "3×30s", cue: "Back flat to wall, knees 90°, thighs parallel to floor." },
  { id: "e3",  name: "Clamshell",            category: "Lower Body",  joints: ["hips"],            tags: ["hip abductors","glutes"],   flare: true,  duration: "45s", sets: "3×12/side", cue: "Hips stacked, rotate top knee up like a clamshell opening." },
  { id: "e4",  name: "Terminal Knee Ext.",   category: "Lower Body",  joints: ["knees"],           tags: ["quads","VMO"],              flare: true,  duration: "45s", sets: "3×15", cue: "Band behind knee, straighten fully — hold 2s at end range." },
  { id: "e5",  name: "Seated Hip Flexion",   category: "Lower Body",  joints: ["hips"],            tags: ["hip flexors","core"],       flare: true,  duration: "30s", sets: "3×10/side", cue: "Sit tall, lift one knee slowly — no rocking in the trunk." },
  { id: "e6",  name: "Dead Bug",             category: "Core",        joints: ["low back"],        tags: ["core","stability"],         flare: true,  duration: "45s", sets: "3×8/side", cue: "Low back pressed to floor — opposite arm and leg extend slowly." },
  { id: "e7",  name: "Pallof Press",         category: "Core",        joints: ["wrists","low back"],tags: ["anti-rotation","core"],   flare: false, duration: "40s", sets: "3×10/side", cue: "Press band straight out, hold 2s — resist rotation throughout." },
  { id: "e8",  name: "Cat-Cow",             category: "Mobility",    joints: ["low back","neck"],  tags: ["spine","mobility"],        flare: true,  duration: "60s", sets: "2×10", cue: "Move with your breath — arch on inhale, round on exhale." },
  { id: "e9",  name: "Scapular Retraction", category: "Upper Body",  joints: ["shoulders"],       tags: ["rhomboids","posture"],      flare: true,  duration: "40s", sets: "3×15", cue: "Draw shoulder blades together and down — no shrugging." },
  { id: "e10", name: "Wall Angels",         category: "Upper Body",  joints: ["shoulders","neck"],tags: ["scapular","mobility"],      flare: true,  duration: "45s", sets: "3×10", cue: "Back and arms flat to wall — slide arms up slowly, keep contact." },
  { id: "e11", name: "Band Pull-Apart",     category: "Upper Body",  joints: ["shoulders","wrists"],tags: ["posterior shoulder"],    flare: false, duration: "45s", sets: "3×15", cue: "Arms straight, pull band apart at chest height — control the return." },
  { id: "e12", name: "Seated Row",          category: "Upper Body",  joints: ["shoulders","wrists"],tags: ["rhomboids","lats"],      flare: false, duration: "45s", sets: "3×12", cue: "Lead with elbows, squeeze shoulder blades together at end." },
  { id: "e13", name: "Supine Hip Rotation", category: "Mobility",    joints: ["hips","low back"], tags: ["mobility","spine"],        flare: true,  duration: "60s", sets: "2×8/side", cue: "Knees together, let them fall gently side to side — no forcing." },
  { id: "e14", name: "Heel Raise",          category: "Lower Body",  joints: ["ankles"],          tags: ["calves","proprioception"], flare: true,  duration: "45s", sets: "3×15", cue: "Rise slowly, hold at top, lower for 3 counts — use wall for balance." },
  { id: "e15", name: "Prone Cobra",         category: "Upper Body",  joints: ["low back","neck"], tags: ["extensors","posture"],     flare: true,  duration: "30s", sets: "3×8", cue: "Forehead down, lift chest slightly — thumbs point up, neck long." },
  { id: "e16", name: "Standing March",      category: "Core",        joints: ["hips","ankles"],   tags: ["balance","hip flexors"],   flare: true,  duration: "45s", sets: "3×10/side", cue: "Stand tall, lift knees to hip height — pelvis stays level." },
];
const CATEGORIES = ["All", "Lower Body", "Upper Body", "Core", "Mobility"];
const EX_MAP = Object.fromEntries(LIBRARY.map(e => [e.id, e]));

/* ── Preset sessions ──────────────────────────────────────────────────────── */
const PRESET_SESSIONS = {
  "Full Body A": [
    { id:"e8",  sets:2, reps:"10 reps",   label:"Cat-Cow" },
    { id:"e1",  sets:3, reps:"10 reps",   label:"Glute Bridge" },
    { id:"e6",  sets:3, reps:"8/side",    label:"Dead Bug" },
    { id:"e9",  sets:3, reps:"15 reps",   label:"Scapular Retraction" },
    { id:"e10", sets:3, reps:"10 reps",   label:"Wall Angels" },
  ],
  "Full Body B": [
    { id:"e8",  sets:2, reps:"10 reps",   label:"Cat-Cow" },
    { id:"e3",  sets:3, reps:"12/side",   label:"Clamshell" },
    { id:"e7",  sets:3, reps:"10/side",   label:"Pallof Press" },
    { id:"e11", sets:3, reps:"15 reps",   label:"Band Pull-Apart" },
    { id:"e14", sets:3, reps:"15 reps",   label:"Heel Raise" },
  ],
  "Cardio + Core": [
    { id:"e16", sets:3, reps:"10/side",   label:"Standing March" },
    { id:"e6",  sets:3, reps:"8/side",    label:"Dead Bug" },
    { id:"e7",  sets:3, reps:"10/side",   label:"Pallof Press" },
  ],
  "Flare Session A": [
    { id:"e8",  sets:2, reps:"8 reps",    label:"Cat-Cow" },
    { id:"e3",  sets:2, reps:"10/side",   label:"Clamshell" },
    { id:"e13", sets:2, reps:"6/side",    label:"Supine Hip Rotation" },
  ],
  "Flare Session B": [
    { id:"e8",  sets:2, reps:"8 reps",    label:"Cat-Cow" },
    { id:"e6",  sets:2, reps:"6/side",    label:"Dead Bug" },
    { id:"e9",  sets:2, reps:"12 reps",   label:"Scapular Retraction" },
  ],
};

const CUSTOM_KEY   = "anchor-custom-sessions";
const SESSIONS_KEY = "anchor-sessions";

function loadCustomSessions() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || []; } catch { return []; }
}
function loadSessionLog() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || []; } catch { return []; }
}
function saveSessionLog(arr) { localStorage.setItem(SESSIONS_KEY, JSON.stringify(arr)); }

/* ── AnchorMark ───────────────────────────────────────────────────────────── */
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

/* ── Rest timer ───────────────────────────────────────────────────────────── */
function RestTimer({ seconds, onDone }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) { onDone(); return; }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const pct = (left / seconds) * 100;
  return (
    <div style={{ textAlign:"center", padding:"24px 0" }}>
      <p style={{ fontSize:"0.78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:WARM_G, marginBottom:12 }}>Rest</p>
      <div style={{ position:"relative", width:80, height:80, margin:"0 auto 16px" }}>
        <svg width={80} height={80} style={{ transform:"rotate(-90deg)" }}>
          <circle cx={40} cy={40} r={34} stroke={BORDER} strokeWidth={6} fill="none"/>
          <circle cx={40} cy={40} r={34} stroke={SLATE} strokeWidth={6} fill="none"
            strokeDasharray={`${2*Math.PI*34}`}
            strokeDashoffset={`${2*Math.PI*34*(1-pct/100)}`}
            strokeLinecap="round"
            style={{ transition:"stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem", fontWeight:800, color:NAVY }}>{left}</div>
      </div>
      <button onClick={onDone} style={{ ...Btn.ghost, fontSize:"0.8rem" }}>Skip rest</button>
    </div>
  );
}

/* ── Library drawer ───────────────────────────────────────────────────────── */
function LibraryDrawer({ onAdd, onClose, alreadyAdded }) {
  const [cat, setCat]       = useState("All");
  const [search, setSearch] = useState("");
  const [flare, setFlare]   = useState(false);

  const filtered = LIBRARY.filter(ex => {
    if (cat !== "All" && ex.category !== cat) return false;
    if (flare && !ex.flare) return false;
    if (search) {
      const q = search.toLowerCase();
      return ex.name.toLowerCase().includes(q) || ex.tags.some(t => t.includes(q));
    }
    return true;
  });

  return (
    <div style={D.overlay} onClick={onClose}>
      <div style={D.drawer} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ width:40, height:4, background:BORDER, borderRadius:2, margin:"0 auto 16px" }}/>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <span style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:"1.05rem", fontWeight:700, color:NAVY }}>Add an exercise</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1.2rem", color:WARM_G }}>✕</button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search exercises…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={D.input}
          autoFocus
        />

        {/* Category pills */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", margin:"10px 0 10px" }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding:"5px 12px", borderRadius:20, border:`1.5px solid ${cat===c ? SLATE : BORDER}`,
              background: cat===c ? MIST : WHITE, color: cat===c ? SLATE : WARM_G,
              fontSize:"0.75rem", fontWeight: cat===c ? 700 : 500, cursor:"pointer",
            }}>{c}</button>
          ))}
        </div>

        {/* Flare toggle */}
        <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:"0.8rem", color:SAGE_D, marginBottom:12, cursor:"pointer" }}>
          <input type="checkbox" checked={flare} onChange={e => setFlare(e.target.checked)} style={{ accentColor:SAGE_D }}/>
          Flare-safe only
        </label>

        {/* Exercise list */}
        <div style={{ overflowY:"auto", maxHeight:"calc(60vh - 180px)", display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.map(ex => {
            const added = alreadyAdded.includes(ex.id);
            return (
              <div key={ex.id} style={D.exRow}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontWeight:700, fontSize:"0.88rem", color:INK }}>{ex.name}</span>
                    {ex.flare && <span style={{ fontSize:"0.65rem", color:SAGE_D, background:GREEN_L, padding:"2px 6px", borderRadius:8 }}>🌿</span>}
                  </div>
                  <span style={{ fontSize:"0.72rem", color:WARM_G }}>{ex.category} · {ex.sets}</span>
                </div>
                <button
                  onClick={() => !added && onAdd(ex)}
                  style={{
                    ...Btn.primary,
                    fontSize:"0.78rem", padding:"7px 14px",
                    background: added ? WARM_G : NAVY,
                    cursor: added ? "default" : "pointer",
                    minWidth:70,
                  }}
                >
                  {added ? "Added ✓" : "+ Add"}
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && <p style={{ color:WARM_G, fontSize:"0.82rem", textAlign:"center", padding:"24px 0" }}>No exercises match.</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Complete screen ──────────────────────────────────────────────────────── */
function CompleteScreen({ sessionName, exercisesDone, onBack }) {
  return (
    <div style={{ minHeight:"100vh", background:CREAM, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ maxWidth:420, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:"3rem", marginBottom:16 }}>⚓</div>
        <p style={{ fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:SLATE, marginBottom:8 }}>Session complete</p>
        <h1 style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:"2rem", color:NAVY, marginBottom:8 }}>You showed up.</h1>
        <p style={{ fontSize:"0.92rem", color:INK_L, lineHeight:1.6, marginBottom:24 }}>
          {exercisesDone} exercise{exercisesDone !== 1 ? "s" : ""} completed in <em>{sessionName}</em>. Every session counts, especially the hard ones.
        </p>
        <div style={{ background:WHITE, borderRadius:14, border:`1px solid ${BORDER}`, padding:"16px 20px", marginBottom:24, textAlign:"left" }}>
          <p style={{ fontSize:"0.78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:WARM_G, marginBottom:10 }}>Great work on</p>
          <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:6 }}>
            {["Staying within your safe range","Listening to your body","Building consistency"].map(t => (
              <li key={t} style={{ display:"flex", alignItems:"center", gap:8, fontSize:"0.86rem", color:INK_L }}>
                <span style={{ color:SAGE_D, fontWeight:700 }}>✓</span> {t}
              </li>
            ))}
          </ul>
        </div>
        <button onClick={onBack} style={{ ...Btn.primary, width:"100%", padding:"13px 0", fontSize:"0.95rem" }}>
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                            */
/* ══════════════════════════════════════════════════════════════════════════ */
export default function AnchorSessionPlayer({ sessionName: propName, onExit }) {
  const navigate  = useNavigate();
  const { name: paramName } = useParams();
  const resolvedName = propName || (paramName ? decodeURIComponent(paramName) : "Full Body A");

  /* ── Build initial queue from preset or custom session ── */
  function buildQueue(name) {
    // Check custom sessions first
    const customs = loadCustomSessions();
    const custom  = customs.find(s => s.name === name);
    if (custom) {
      return custom.exercises.map(id => {
        const ex = EX_MAP[id];
        return ex ? { id, sets:3, reps:ex.sets || "10 reps", label:ex.name } : null;
      }).filter(Boolean);
    }
    // Fall back to preset
    return PRESET_SESSIONS[name] || PRESET_SESSIONS["Full Body A"];
  }

  const [queue,       setQueue]       = useState(() => buildQueue(resolvedName));
  const [exIdx,       setExIdx]       = useState(0);
  const [setIdx,      setSetIdx]      = useState(0);
  const [phase,       setPhase]       = useState("exercise"); // "exercise" | "rest" | "done"
  const [painRating,  setPainRating]  = useState(null);
  const [showStop,    setShowStop]    = useState(false);
  const [showDrawer,  setShowDrawer]  = useState(false);
  const [showComplete,setShowComplete]= useState(false);
  const [doneCount,   setDoneCount]   = useState(0);

  const addedIds = queue.map(q => q.id);

  function handleExit() {
    if (onExit) onExit();
    else navigate("/movement");
  }

  /* ── Log session to localStorage ── */
  function logSession(count) {
    const log = loadSessionLog();
    const entry = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString().slice(0,10),
      sessionName: resolvedName,
      type: resolvedName.toLowerCase().includes("flare") ? "flare" : "strength",
      exercisesDone: count,
      duration: null,
      notes: "",
    };
    saveSessionLog([entry, ...log]);
  }

  /* ── Complete session ── */
  function completeSession(count) {
    logSession(count ?? doneCount);
    setShowComplete(true);
  }

  /* ── Advance through sets/exercises ── */
  function advanceSet() {
    const ex = queue[exIdx];
    if (setIdx < ex.sets - 1) {
      setSetIdx(s => s + 1);
      setPhase("rest");
      setPainRating(null);
      setShowStop(false);
    } else {
      advanceExercise();
    }
  }
  function advanceExercise() {
    const nextDone = doneCount + 1;
    setDoneCount(nextDone);
    setPainRating(null);
    setShowStop(false);
    if (exIdx < queue.length - 1) {
      setExIdx(i => i + 1);
      setSetIdx(0);
      setPhase("exercise");
    } else {
      completeSession(nextDone);
    }
  }

  /* ── Add exercise from drawer ── */
  function addExercise(ex) {
    const item = { id: ex.id, sets:3, reps: ex.sets || "10 reps", label: ex.name };
    setQueue(q => [...q, item]);
    setShowDrawer(false);
  }

  if (showComplete) {
    return <CompleteScreen sessionName={resolvedName} exercisesDone={doneCount} onBack={handleExit}/>;
  }

  const ex       = queue[exIdx];
  const libEx    = EX_MAP[ex?.id] || {};
  const isLast   = exIdx === queue.length - 1 && setIdx === (ex?.sets || 1) - 1;
  const progress = ((exIdx * (ex?.sets||1) + setIdx) / (queue.reduce((a,e)=>a+(e.sets||1),0))) * 100;

  /* ── REST PHASE ── */
  if (phase === "rest") {
    return (
      <div style={P.root}>
        <nav style={P.nav}>
          <button onClick={handleExit} style={P.exitBtn}>← Exit</button>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <AnchorMark size={22}/>
            <span style={P.navTitle}>{resolvedName}</span>
          </div>
          <div style={{ width:60 }}/>
        </nav>
        <ProgressBar pct={progress}/>
        <div style={P.main}>
          <p style={P.eyebrow}>Up next</p>
          <h2 style={P.exName}>{ex?.label}</h2>
          <RestTimer seconds={45} onDone={() => setPhase("exercise")}/>
          <button onClick={() => setPhase("exercise")} style={{ ...Btn.primary, width:"100%", marginTop:8 }}>
            Start set {setIdx + 1} of {ex?.sets}
          </button>
        </div>
      </div>
    );
  }

  /* ── EXERCISE PHASE ── */
  return (
    <div style={P.root}>
      {/* Nav */}
      <nav style={P.nav}>
        <button onClick={handleExit} style={P.exitBtn}>← Exit</button>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <AnchorMark size={22}/>
          <span style={P.navTitle}>{resolvedName}</span>
        </div>
        <div style={{ width:60 }}/>
      </nav>

      <ProgressBar pct={progress}/>

      <div style={P.main}>
        {/* Exercise counter */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <p style={P.eyebrow}>Exercise {exIdx + 1} of {queue.length} · Set {setIdx + 1} of {ex?.sets}</p>
          <div style={{ display:"flex", gap:8 }}>
            {/* Add exercise button */}
            <button onClick={() => setShowDrawer(true)} style={Btn.addEx} title="Add exercise">
              + Add
            </button>
            {/* Complete early button */}
            <button
              onClick={() => completeSession()}
              style={{ ...Btn.ghost, fontSize:"0.78rem", padding:"6px 12px", color:SAGE_D, borderColor:SAGE_D }}
              title="End session here"
            >
              ✓ Complete
            </button>
          </div>
        </div>

        {/* Exercise card */}
        <div style={P.card}>
          <h2 style={P.exName}>{ex?.label || libEx.name}</h2>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
            <span style={P.badge}>{ex?.reps}</span>
            {libEx.flare && <span style={{ ...P.badge, background:GREEN_L, color:SAGE_D }}>🌿 Flare-safe</span>}
          </div>

          {/* Movement cue */}
          {libEx.cue && (
            <div style={P.cueBox}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:SLATE, marginBottom:4 }}>Movement cue</p>
              <p style={{ fontSize:"0.88rem", color:INK_L, lineHeight:1.6 }}>{libEx.cue}</p>
            </div>
          )}

          {/* Joint tags */}
          {libEx.joints?.length > 0 && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:12 }}>
              {libEx.joints.map(j => (
                <span key={j} style={{ fontSize:"0.7rem", color:INK_L, background:CREAM, border:`1px solid ${BORDER}`, borderRadius:6, padding:"2px 8px" }}>
                  {j}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pain check */}
        {!showStop && (
          <div style={P.painBlock}>
            <p style={{ fontSize:"0.8rem", fontWeight:700, color:INK_L, marginBottom:10 }}>How does this feel?</p>
            <div style={{ display:"flex", gap:8 }}>
              {[
                { label:"Good",   color:GREEN,  bg:GREEN_L,  value:"good"   },
                { label:"Modify", color:SLATE,  bg:MIST,     value:"modify" },
                { label:"Stop",   color:TERRA,  bg:TERRA_L,  value:"stop"   },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setPainRating(opt.value);
                    if (opt.value === "stop") setShowStop(true);
                  }}
                  style={{
                    flex:1, padding:"10px 0", borderRadius:10,
                    border:`2px solid ${painRating===opt.value ? opt.color : BORDER}`,
                    background: painRating===opt.value ? opt.bg : WHITE,
                    color: painRating===opt.value ? opt.color : WARM_G,
                    fontWeight:700, fontSize:"0.84rem", cursor:"pointer", transition:"all 0.15s",
                  }}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Stop panel */}
        {showStop && (
          <div style={P.stopPanel}>
            <p style={{ fontWeight:700, fontSize:"0.9rem", color:TERRA, marginBottom:6 }}>That's okay — rest is part of the work.</p>
            <p style={{ fontSize:"0.84rem", color:INK_L, marginBottom:14, lineHeight:1.5 }}>
              Listen to your body. You can skip to the next exercise or end the session — both are valid choices.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={advanceExercise} style={{ ...Btn.primary, flex:1, background:SLATE, fontSize:"0.84rem" }}>
                Skip to next →
              </button>
              <button onClick={() => completeSession()} style={{ ...Btn.primary, flex:1, background:TERRA, fontSize:"0.84rem" }}>
                End session
              </button>
            </div>
            <button onClick={() => { setShowStop(false); setPainRating(null); }} style={{ ...Btn.ghost, width:"100%", marginTop:8, fontSize:"0.8rem" }}>
              Actually, I'll keep going
            </button>
          </div>
        )}

        {/* Complete set button */}
        {!showStop && (
          <button
            onClick={advanceSet}
            style={{
              ...Btn.primary, width:"100%", padding:"14px 0", fontSize:"0.95rem",
              marginTop:16,
              background: isLast ? SAGE_D : NAVY,
            }}
          >
            {isLast ? "Complete session ✓" : setIdx < (ex?.sets||1)-1 ? `Complete set → rest` : "Next exercise →"}
          </button>
        )}

        {/* Queue preview */}
        <div style={P.queueBlock}>
          <p style={{ fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:WARM_G, marginBottom:8 }}>
            Up next
          </p>
          {queue.slice(exIdx + 1, exIdx + 4).map((q, i) => (
            <div key={q.id+i} style={P.queueRow}>
              <span style={P.queueNum}>{exIdx + 2 + i}</span>
              <span style={{ fontSize:"0.84rem", color:INK_L }}>{q.label}</span>
              <span style={{ fontSize:"0.75rem", color:WARM_G, marginLeft:"auto" }}>{q.reps}</span>
            </div>
          ))}
          {queue.slice(exIdx + 1).length === 0 && (
            <p style={{ fontSize:"0.82rem", color:WARM_G, fontStyle:"italic" }}>This is the last exercise.</p>
          )}
        </div>
      </div>

      {/* Library drawer */}
      {showDrawer && (
        <LibraryDrawer
          onAdd={addExercise}
          onClose={() => setShowDrawer(false)}
          alreadyAdded={addedIds}
        />
      )}
    </div>
  );
}

/* ── Progress bar ─────────────────────────────────────────────────────────── */
function ProgressBar({ pct }) {
  return (
    <div style={{ height:4, background:BORDER, position:"sticky", top:60 }}>
      <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background:SLATE, transition:"width 0.4s ease", borderRadius:"0 2px 2px 0" }}/>
    </div>
  );
}

/* ── Style objects ────────────────────────────────────────────────────────── */
const P = {
  root:    { minHeight:"100vh", background:CREAM, fontFamily:"'Lato','Helvetica Neue',sans-serif" },
  nav:     { background:WHITE, borderBottom:`1px solid ${BORDER}`, position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", height:60 },
  exitBtn: { background:"none", border:"none", cursor:"pointer", color:INK_L, fontSize:"0.86rem", fontWeight:600, padding:"8px 0" },
  navTitle:{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:"0.95rem", fontWeight:700, color:NAVY },
  main:    { maxWidth:540, margin:"0 auto", padding:"28px 20px 80px" },
  eyebrow: { fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:SLATE, marginBottom:4 },
  exName:  { fontFamily:"'Playfair Display',Georgia,serif", fontSize:"1.7rem", fontWeight:700, color:NAVY, marginBottom:12 },
  badge:   { fontSize:"0.78rem", fontWeight:700, background:MIST, color:SLATE, padding:"4px 10px", borderRadius:8 },
  card:    { background:WHITE, border:`1.5px solid ${BORDER}`, borderRadius:16, padding:"20px 20px 18px", marginBottom:16 },
  cueBox:  { background:MIST, borderRadius:10, padding:"12px 14px" },
  painBlock:{ background:WHITE, border:`1.5px solid ${BORDER}`, borderRadius:14, padding:"16px 16px 14px", marginBottom:0 },
  stopPanel:{ background:TERRA_L, border:`1.5px solid ${TERRA}`, borderRadius:14, padding:"18px 18px 16px", marginTop:12 },
  queueBlock:{ marginTop:28, paddingTop:20, borderTop:`1px solid ${BORDER}` },
  queueRow:{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${BORDER}` },
  queueNum:{ width:22, height:22, borderRadius:"50%", background:MIST, color:SLATE, fontSize:"0.7rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
};

const Btn = {
  primary:{ background:NAVY, color:WHITE, border:"none", borderRadius:10, padding:"11px 20px", fontSize:"0.88rem", fontWeight:700, cursor:"pointer" },
  ghost:  { background:"transparent", color:INK_L, border:`1.5px solid ${BORDER}`, borderRadius:10, padding:"9px 16px", fontSize:"0.84rem", fontWeight:600, cursor:"pointer" },
  addEx:  { background:MIST, color:SLATE, border:`1.5px solid ${SLATE}`, borderRadius:8, padding:"6px 12px", fontSize:"0.78rem", fontWeight:700, cursor:"pointer" },
};

const D = {
  overlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:200, display:"flex", alignItems:"flex-end" },
  drawer: { background:WHITE, borderRadius:"20px 20px 0 0", padding:"16px 20px 32px", width:"100%", maxHeight:"80vh", overflowY:"auto", boxShadow:"0 -8px 40px rgba(0,0,0,0.18)" },
  input:  { width:"100%", padding:"10px 14px", border:`1.5px solid ${BORDER}`, borderRadius:10, fontSize:"0.9rem", boxSizing:"border-box", fontFamily:"inherit", outline:"none" },
  exRow:  { display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${BORDER}` },
};
