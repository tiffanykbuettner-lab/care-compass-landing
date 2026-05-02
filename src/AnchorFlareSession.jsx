import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

/* ─── Brand tokens ─────────────────────────────────────────────────────────── */
const SAGE         = "#7a9e87";
const SAGE_LIGHT   = "#e8f0eb";
const SAGE_DARK    = "#4a7058";
const NAVY         = "#1a3a5c";
const SLATE        = "#3a6ea8";
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
function loadSessions() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function saveSessions(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

/* ─── Flare session data ───────────────────────────────────────────────────── */
const FLARE_SESSIONS = {
  A: {
    key: "A",
    name: "Flare Session A",
    label: "Shoulders / ribs",
    desc: "For days when your upper body, ribs, or shoulders are most symptomatic.",
    duration: "10–15 min",
    exercises: [
      {
        name: "360 breathing",
        target: "2 min · the most important part",
        cue: "Breathe into your sides and back — not just your chest. Feel your rib cage expand in all directions on the inhale. Let it fully release on the exhale. No forcing. No holding. Just noticing.",
        type: "timed", duration: 120,
        mod: "If ribs are very sore, try lying flat. Remove any tight clothing if it helps.",
      },
      {
        name: "Rib stacking",
        target: "5 breaths · slow",
        cue: "Sit or lie comfortably. Stack your ribs over your pelvis — find neutral spine. Take 5 slow breaths here, letting your ribs expand naturally. This is not a stretch. It is a reset.",
        type: "timed", duration: 30,
        mod: "Lying down is always fine. This exercise has no wrong position — only a wrong effort level (too much).",
      },
      {
        name: "Scapular setting",
        target: "6 reps · 3 sec hold",
        cue: "Gently draw shoulder blades down and slightly together — like tucking them toward your back pockets. Hold without holding your breath. Release fully between reps. No shrugging.",
        type: "reps", reps: 6,
        mod: "If acute shoulder pain: reduce hold to 1 sec, or simply find the position and release. The awareness alone has value today.",
      },
      {
        name: "Wall serratus reach",
        target: "6 reps",
        cue: "Stand or sit facing a wall, hands flat. Gently press into the wall and let your shoulder blades spread apart. Hold 2 sec. Return. This is small and controlled — not a push-up.",
        type: "reps", reps: 6,
        mod: "If walls are inaccessible: press palms together in front of chest instead. Same movement, no wall needed.",
      },
      {
        name: "Isometric external rotation",
        target: "5 holds · 5 sec each",
        cue: "Elbow bent at 90° against your side. Press the back of your wrist into a wall or your own opposite hand. Hold 5 seconds without moving. No rotation needed — just resisted intention.",
        type: "timed", duration: 25,
        mod: "If any shoulder pain: reduce hold to 2–3 sec. Or skip and replace with scapular setting again.",
      },
      {
        name: "Supine march",
        target: "4 reps each side",
        cue: "Lie on your back, knees bent. Slowly lift one foot a few inches — pelvis stays completely still. Lower slowly. Alternate sides. There is no rush here.",
        type: "sides", reps: 4,
        mod: "If this causes any back or hip pain: just do pelvic floor engagement and breathing. Lie still and breathe. That is enough.",
      },
    ],
  },
  B: {
    key: "B",
    name: "Flare Session B",
    label: "Low back / hips",
    desc: "For days when your lower body, low back, or hips are most symptomatic.",
    duration: "10–15 min",
    exercises: [
      {
        name: "360 breathing",
        target: "2 min",
        cue: "Breathe into your sides and back. Let your rib cage expand in all directions. Full release on the exhale. No forcing.",
        type: "timed", duration: 120,
        mod: "Do this lying down if sitting is hard today.",
      },
      {
        name: "Supine march",
        target: "6 reps each side",
        cue: "Lie on your back, knees bent. Slowly lift one foot a few inches — pelvis stays completely still. Lower slowly. Alternate sides. Slow and controlled.",
        type: "sides", reps: 6,
        mod: "Place hands under your low back for feedback. Or just do breathing here if this is too much.",
      },
      {
        name: "Glute bridge",
        target: "8 reps · partial range okay",
        cue: "Feet hip-width, heels close to hips. Drive through heels to lift your hips. Hold 2 seconds at the top. Lower slowly. Keep this small if needed — even a partial bridge works today.",
        type: "reps", reps: 8,
        mod: "Lift only halfway if full range causes pain. Focus on posterior pelvic tilt rather than height. Still activates glutes.",
      },
      {
        name: "Sit-to-stand",
        target: "6 reps · slow tempo",
        cue: "Sit at the front of a firm chair. Feet hip-width. Lean forward slightly and stand using your legs, not momentum. Lower back down slowly. The descent is the most important part.",
        type: "reps", reps: 6,
        mod: "Use armrests if needed. Or raise the chair height with a cushion to reduce range. Never skip — this is one of the most functional movements you can do.",
      },
      {
        name: "Pallof press",
        target: "6 reps each side",
        cue: "Seated or standing with a band at chest height. Hold at your sternum, brace gently, press out slowly — resist the rotation. Return. Switch sides.",
        type: "sides", reps: 6,
        mod: "Seated version works identically. If no band: hold the position isometrically with your hands clasped at your chest.",
      },
      {
        name: "Wall sit",
        target: "2 holds · 15 sec",
        cue: "Back flat against wall. Feet hip-width, below your knees. Slide down to a comfortable angle — doesn't need to be 90°. Hold and breathe. Don't let your back peel off the wall.",
        type: "timed", duration: 30,
        mod: "High-angle wall sit (120–130° knee bend) still loads quads and glutes with much less knee stress.",
      },
    ],
  },
  C: {
    key: "C",
    name: "Flare Session C",
    label: "Everything / fatigue",
    desc: "The lowest-demand option. For days when everything feels like too much. Pick 3 items. Do them gently. That is enough.",
    duration: "10–20 min",
    exercises: [
      {
        name: "360 breathing",
        target: "3 min",
        cue: "Lie down if you can. Breathe into your sides and back. Every exhale is a release. You do not need to do anything else right now. Just breathe.",
        type: "timed", duration: 180,
        mod: "This is already the minimum. No modification needed.",
      },
      {
        name: "Rib stacking",
        target: "5 slow breaths",
        cue: "Find neutral spine. Five slow, full breaths. Expand into your sides and back. Let it go completely on the exhale.",
        type: "timed", duration: 30,
        mod: "Skip if any movement causes pain. Continue breathing.",
      },
      {
        name: "Scapular setting",
        target: "6 reps",
        cue: "Gently draw shoulder blades down and together. Hold 2 sec. Release. Lying down is fine.",
        type: "reps", reps: 6,
        mod: "Skip if any movement causes pain. Just breathe.",
      },
      {
        name: "Supine march",
        target: "4 reps each side",
        cue: "Lying down. Lift one foot a few inches. Lower. Switch. No pelvis movement. Very slow.",
        type: "sides", reps: 4,
        mod: "If this is too much: lie still and breathe. That is still a session.",
      },
      {
        name: "Gentle walk",
        target: "5–10 min · very easy pace",
        cue: "Flat surface, supported if needed. Slow enough to hold a conversation without effort. Stop if symptoms increase. Movement is the goal — pace is not.",
        type: "timed", duration: 300,
        mod: "Indoors is fine. Room to room counts. Seated marching counts.",
      },
    ],
  },
};

/* ─── Exercise figure (terra colorway) ────────────────────────────────────── */
function FlareFigure({ name }) {
  const anim = `@keyframes breathe{0%,100%{opacity:.4;transform:scale(0.96)}50%{opacity:1;transform:scale(1.04)}} @keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}`;
  const figs = {
    "360 breathing": (
      <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
        <style>{anim}</style>
        <circle cx="70" cy="55" r="42" stroke={TERRA} strokeWidth="1" opacity="0.25" style={{ animation: "breathe 4s ease-in-out infinite" }}/>
        <circle cx="70" cy="55" r="28" stroke={TERRA} strokeWidth="1.5" opacity="0.45" style={{ animation: "breathe 4s ease-in-out infinite", animationDelay: "0.6s" }}/>
        <circle cx="70" cy="55" r="15" fill={TERRA_LIGHT} stroke={TERRA} strokeWidth="1.5" style={{ animation: "breathe 4s ease-in-out infinite", animationDelay: "1.2s" }}/>
        <text x="70" y="59" textAnchor="middle" fontSize="9" fill={TERRA} opacity="0.7">breathe</text>
      </svg>
    ),
    "Rib stacking": (
      <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
        <style>{anim}</style>
        <circle cx="70" cy="55" r="38" stroke={TERRA} strokeWidth="1" opacity="0.25" style={{ animation: "breathe 4s ease-in-out infinite" }}/>
        <circle cx="70" cy="55" r="24" stroke={TERRA} strokeWidth="1.5" opacity="0.5" style={{ animation: "breathe 4s ease-in-out infinite", animationDelay: "0.8s" }}/>
        <text x="70" y="59" textAnchor="middle" fontSize="9" fill={TERRA} opacity="0.7">360 expand</text>
      </svg>
    ),
    "Scapular setting": (
      <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
        <style>{anim}</style>
        <circle cx="70" cy="28" r="13" fill={TERRA} opacity="0.85"/>
        <line x1="70" y1="41" x2="70" y2="78" stroke={TERRA} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="70" y1="56" x2="47" y2="66" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="46" cy="66" r="4" fill={TERRA} style={{ animation: "pulse 2s ease-in-out infinite" }}/>
        <line x1="70" y1="56" x2="93" y2="66" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="94" cy="66" r="4" fill={TERRA} style={{ animation: "pulse 2s ease-in-out infinite" }}/>
        <line x1="70" y1="78" x2="57" y2="97" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="70" y1="78" x2="83" y2="97" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <text x="70" y="108" textAnchor="middle" fontSize="9" fill={TERRA} opacity="0.6">back pockets</text>
      </svg>
    ),
    "Wall serratus reach": (
      <svg width="150" height="110" viewBox="0 0 150 110" fill="none">
        <style>{anim}</style>
        <rect x="130" y="10" width="8" height="90" rx="4" fill={TERRA} opacity="0.2"/>
        <circle cx="62" cy="28" r="13" fill={TERRA} opacity="0.85"/>
        <line x1="62" y1="41" x2="62" y2="78" stroke={TERRA} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="62" y1="55" x2="42" y2="63" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="62" y1="55" x2="88" y2="52" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="88" y1="52" x2="130" y2="52" stroke={TERRA} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="128" cy="52" r="4" fill={TERRA} style={{ animation: "pulse 2s ease-in-out infinite" }}/>
        <line x1="62" y1="78" x2="50" y2="97" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="62" y1="78" x2="75" y2="97" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
    "Isometric external rotation": (
      <svg width="150" height="110" viewBox="0 0 150 110" fill="none">
        <style>{anim}</style>
        <circle cx="58" cy="26" r="13" fill={TERRA} opacity="0.85"/>
        <line x1="58" y1="39" x2="56" y2="73" stroke={TERRA} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="56" y1="73" x2="43" y2="93" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="56" y1="73" x2="70" y2="93" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="58" y1="52" x2="40" y2="58" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="58" y1="52" x2="58" y2="73" stroke={TERRA} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="58" y1="73" x2="110" y2="73" stroke={TERRA} strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3"/>
        <rect x="110" y="60" width="8" height="28" rx="4" fill={TERRA} opacity="0.2"/>
        <circle cx="110" cy="73" r="4" fill={TERRA} style={{ animation: "pulse 2s ease-in-out infinite" }}/>
        <text x="80" y="105" textAnchor="middle" fontSize="9" fill={TERRA} opacity="0.6">hold · no movement</text>
      </svg>
    ),
    "Supine march": (
      <svg width="170" height="110" viewBox="0 0 170 110" fill="none">
        <style>{anim}</style>
        <rect x="10" y="84" width="150" height="5" rx="2" fill={TERRA} opacity="0.2"/>
        <circle cx="55" cy="42" r="13" fill={TERRA} opacity="0.85"/>
        <line x1="55" y1="55" x2="55" y2="84" stroke={TERRA} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="55" y1="84" x2="40" y2="84" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="55" y1="84" x2="78" y2="68" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="78" cy="68" r="5" fill={TERRA} style={{ animation: "pulse 1.8s ease-in-out infinite" }}/>
        <line x1="55" y1="64" x2="35" y2="72" stroke={TERRA} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="55" y1="64" x2="75" y2="70" stroke={TERRA} strokeWidth="2.5" strokeLinecap="round"/>
        <text x="105" y="65" textAnchor="middle" fontSize="9" fill={TERRA} opacity="0.6">pelvis stays still</text>
      </svg>
    ),
    "Glute bridge": (
      <svg width="170" height="110" viewBox="0 0 170 110" fill="none">
        <style>{anim}</style>
        <rect x="10" y="88" width="150" height="5" rx="2" fill={TERRA} opacity="0.2"/>
        <circle cx="50" cy="44" r="13" fill={TERRA} opacity="0.85"/>
        <line x1="50" y1="57" x2="58" y2="74" stroke={TERRA} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="58" y1="74" x2="46" y2="89" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="58" y1="74" x2="86" y2="76" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="72" cy="68" r="5" fill={TERRA} style={{ animation: "pulse 2s ease-in-out infinite" }}/>
        <line x1="86" y1="76" x2="100" y2="89" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <text x="120" y="65" textAnchor="middle" fontSize="9" fill={TERRA} opacity="0.6">drive through heels</text>
      </svg>
    ),
    "Sit-to-stand": (
      <svg width="160" height="110" viewBox="0 0 160 110" fill="none">
        <style>{anim}</style>
        <rect x="30" y="76" width="70" height="10" rx="4" fill={TERRA} opacity="0.2"/>
        <circle cx="80" cy="28" r="13" fill={TERRA} opacity="0.85"/>
        <line x1="80" y1="41" x2="76" y2="65" stroke={TERRA} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="76" y1="65" x2="60" y2="88" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="76" y1="65" x2="95" y2="80" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="80" y1="52" x2="60" y2="60" stroke={TERRA} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="80" y1="52" x2="100" y2="58" stroke={TERRA} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="80" cy="52" r="4" fill={TERRA} style={{ animation: "pulse 2s ease-in-out infinite" }}/>
        <text x="80" y="108" textAnchor="middle" fontSize="9" fill={TERRA} opacity="0.6">slow on the way down</text>
      </svg>
    ),
    "Pallof press": (
      <svg width="160" height="110" viewBox="0 0 160 110" fill="none">
        <style>{anim}</style>
        <circle cx="62" cy="26" r="13" fill={TERRA} opacity="0.85"/>
        <line x1="62" y1="39" x2="59" y2="76" stroke={TERRA} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="59" y1="76" x2="45" y2="96" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="59" y1="76" x2="73" y2="96" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="62" y1="53" x2="42" y2="60" stroke={TERRA} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="62" y1="53" x2="62" y2="62" stroke={TERRA} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="62" y1="62" x2="108" y2="62" stroke={TERRA} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="108" cy="62" r="4" fill={TERRA} style={{ animation: "pulse 2s ease-in-out infinite" }}/>
        <text x="84" y="85" textAnchor="middle" fontSize="9" fill={TERRA} opacity="0.6">resist the rotation</text>
      </svg>
    ),
    "Wall sit": (
      <svg width="150" height="110" viewBox="0 0 150 110" fill="none">
        <style>{anim}</style>
        <rect x="128" y="10" width="8" height="90" rx="4" fill={TERRA} opacity="0.2"/>
        <circle cx="70" cy="26" r="13" fill={TERRA} opacity="0.85"/>
        <line x1="70" y1="39" x2="70" y2="62" stroke={TERRA} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="70" y1="62" x2="50" y2="82" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="70" y1="62" x2="100" y2="62" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="62" x2="105" y2="88" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="70" y1="50" x2="50" y2="56" stroke={TERRA} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="70" y1="50" x2="128" y2="50" stroke={TERRA} strokeWidth="2" strokeLinecap="round"/>
        <text x="75" y="105" textAnchor="middle" fontSize="9" fill={TERRA} opacity="0.6">back to wall · breathe</text>
      </svg>
    ),
    "Gentle walk": (
      <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
        <style>{anim}</style>
        <circle cx="70" cy="28" r="13" fill={TERRA} opacity="0.85"/>
        <line x1="70" y1="41" x2="66" y2="72" stroke={TERRA} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="66" y1="72" x2="52" y2="96" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="66" y1="72" x2="80" y2="88" stroke={TERRA} strokeWidth="3" strokeLinecap="round"/>
        <line x1="70" y1="54" x2="50" y2="64" stroke={TERRA} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="70" y1="54" x2="88" y2="66" stroke={TERRA} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="50" cy="64" r="4" fill={TERRA} style={{ animation: "pulse 1.8s ease-in-out infinite" }}/>
        <text x="70" y="108" textAnchor="middle" fontSize="9" fill={TERRA} opacity="0.6">easy pace</text>
      </svg>
    ),
  };
  return figs[name] || (
    <svg width="120" height="90" viewBox="0 0 120 90" fill="none">
      <circle cx="60" cy="45" r="30" stroke={TERRA} strokeWidth="1.5" opacity="0.4" style={{ animation: "breathe 3s ease-in-out infinite" }}/>
    </svg>
  );
}

/* ─── Countdown timer hook ─────────────────────────────────────────────────── */
function useCountdown(total) {
  const [secs, setSecs]       = useState(total);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (running && secs > 0) { ref.current = setInterval(() => setSecs(s => s - 1), 1000); }
    else { clearInterval(ref.current); if (secs <= 0) setRunning(false); }
    return () => clearInterval(ref.current);
  }, [running, secs]);
  function reset(n) { clearInterval(ref.current); setSecs(n); setRunning(false); }
  return { secs, running, start: () => setRunning(true), pause: () => setRunning(false), reset };
}

/* ─── Main flare session player ────────────────────────────────────────────── */
export default function AnchorFlareSession() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();

  const suggestedKey = (() => {
    const name = location.state?.sessionName || "";
    if (name.includes("A")) return "A";
    if (name.includes("C")) return "C";
    return "B";
  })();

  /* phase: pick | exercise | complete */
  const [phase, setPhase]         = useState(suggestedKey === "B" && !location.state?.sessionName ? "pick" : "exercise");
  const [sessionKey, setSessionKey] = useState(suggestedKey);
  const [exIdx, setExIdx]         = useState(0);
  const [repsLeft, setRepsLeft]   = useState({ left: 0, right: 0, total: 0 });
  const [painRating, setPainRating] = useState(null);
  const [showMod, setShowMod]     = useState(false);
  const [sessionLog, setSessionLog] = useState([]);
  const [startTime]               = useState(Date.now());

  const session  = FLARE_SESSIONS[sessionKey];
  const exercise = session?.exercises[exIdx];
  const totalEx  = session?.exercises.length || 0;
  const progress = session ? Math.round((exIdx / totalEx) * 100) : 0;

  const timer = useCountdown(exercise?.duration || 60);
  useEffect(() => { if (exercise?.type === "timed") timer.reset(exercise.duration); }, [exIdx, sessionKey]);
  useEffect(() => { if (exercise?.type !== "timed") { setRepsLeft({ left: 0, right: 0, total: 0 }); setPainRating(null); setShowMod(false); } }, [exIdx]);

  function nextExercise() {
    setSessionLog(log => [...log, { name: exercise.name, done: true }]);
    setPainRating(null); setShowMod(false);
    if (exIdx < totalEx - 1) { setExIdx(i => i + 1); }
    else { setPhase("complete"); saveSession(); }
  }

  function saveSession() {
    const mins = Math.max(1, Math.round((Date.now() - startTime) / 60000));
    const saved = { id: Date.now(), sessionName: session.name, type: "flare", date: todayStr(), duration: mins, notes: "" };
    saveSessions([saved, ...loadSessions()]);
  }

  const mm = exercise?.duration ? `${Math.floor(timer.secs / 60)}:${String(timer.secs % 60).padStart(2, "0")}` : null;
  const timerPct = exercise?.duration ? Math.round((timer.secs / exercise.duration) * 100) : 100;

  /* ── SESSION PICKER ── */
  if (phase === "pick") return (
    <div style={styles.root}>
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <AnchorMark size={24}/>
          <span style={styles.navTitle}>Flare mode</span>
          <div style={{ flex: 1 }}/>
          <button onClick={() => navigate("/movement")} style={styles.exitBtn}>Dashboard</button>
        </div>
      </nav>
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={{ background: TERRA_LIGHT, border: `1px solid ${TERRA_BORDER}`, borderRadius: "1rem", padding: "1.25rem 1.5rem", marginBottom: "0.5rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: TERRA, margin: "0 0 0.4rem" }}>Flare mode active</p>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: "0 0 0.4rem" }}>Today's goal isn't progress.</p>
            <p style={{ fontSize: "0.875rem", color: INK_LIGHT, lineHeight: 1.7, margin: 0 }}>It's maintaining the habit without worsening symptoms. Gentle joint input. 10–15 minutes. That still counts as training.</p>
          </div>

          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: INK_LIGHT, marginBottom: "0.75rem" }}>What's flaring most today?</div>

          {Object.values(FLARE_SESSIONS).map(s => (
            <button key={s.key} onClick={() => { setSessionKey(s.key); setExIdx(0); setPhase("exercise"); }}
              style={{ ...styles.sessionPickCard, borderColor: sessionKey === s.key ? TERRA : "rgba(0,0,0,0.08)", background: sessionKey === s.key ? TERRA_LIGHT : "#fff", textAlign: "left", width: "100%", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, display: "block" }}>{s.name}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: TERRA }}>{s.label}</span>
                </div>
                <span style={{ fontSize: "0.72rem", background: TERRA_LIGHT, color: TERRA_DARK, border: `1px solid ${TERRA_BORDER}`, borderRadius: "100px", padding: "0.2rem 0.65rem", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 8 }}>{s.duration}</span>
              </div>
              <p style={{ fontSize: "0.8rem", color: WARM_GRAY, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {s.exercises.slice(0, 4).map(e => <span key={e.name} style={{ fontSize: "0.7rem", padding: "0.15rem 0.6rem", borderRadius: "100px", background: "rgba(0,0,0,0.05)", color: WARM_GRAY }}>{e.name}</span>)}
                {s.exercises.length > 4 && <span style={{ fontSize: "0.7rem", color: WARM_GRAY }}>+{s.exercises.length - 4} more</span>}
              </div>
            </button>
          ))}

          <button onClick={() => navigate("/movement")} style={styles.btnGhost}>Not today — back to dashboard</button>
        </div>
      </main>
    </div>
  );

  /* ── COMPLETE ── */
  if (phase === "complete") {
    const mins = Math.max(1, Math.round((Date.now() - startTime) / 60000));
    return (
      <div style={styles.root}>
        <nav style={styles.nav}>
          <div style={styles.navInner}><AnchorMark size={24}/><span style={styles.navTitle}>Flare session complete</span><div style={{ flex: 1 }}/><button onClick={() => navigate("/movement")} style={styles.exitBtn}>Dashboard</button></div>
        </nav>
        <main style={styles.main}>
          <div style={{ ...styles.container, alignItems: "center", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: TERRA_LIGHT, border: `1.5px solid ${TERRA_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M6 16l7 7 13-13" stroke={TERRA} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.7rem", fontWeight: 700, color: INK, margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>On a hard day, you still showed up.</h1>
            <p style={{ fontSize: "0.95rem", color: WARM_GRAY, lineHeight: 1.8, maxWidth: 420, margin: "0 auto 2rem" }}>
              You maintained joint input, kept the habit alive, and didn't push into a crash. That is exactly what this program is designed to do. A flare day where you showed up is not a setback. It's the program working.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", width: "100%", maxWidth: 420, marginBottom: "2rem" }}>
              {[{ label: "Time", value: `${mins} min` }, { label: "Exercises", value: sessionLog.length }, { label: "Streak", value: "intact" }].map((s, i) => (
                <div key={i} style={{ background: TERRA_LIGHT, borderRadius: "0.875rem", padding: "1rem", border: `1px solid ${TERRA_BORDER}` }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: TERRA, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: TERRA_DARK }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ background: MIST, border: `1px solid ${MIST_BORDER}`, borderRadius: "1rem", padding: "1rem 1.5rem", width: "100%", maxWidth: 420, marginBottom: "1.5rem", textAlign: "left" }}>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: SLATE, margin: "0 0 0.5rem" }}>Suggestions for the rest of today</p>
              {["Rest horizontally if you can — even 20 minutes", "Hydrate and eat something if you haven't", "Note what triggered today's flare in Care Compass", "Tomorrow: reassess — don't assume another flare day"].map((s, i) => (
                <p key={i} style={{ fontSize: "0.82rem", color: INK_LIGHT, margin: "0 0 0.35rem", lineHeight: 1.5 }}>· {s}</p>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button onClick={() => navigate("/movement")} style={{ ...styles.btnPrimary, background: NAVY }}>Back to dashboard</button>
              <button onClick={() => navigate("/dashboard")} style={styles.btnGhost}>Open Care Compass →</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── EXERCISE PLAYER ── */
  return (
    <div style={styles.root}>
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <AnchorMark size={24}/>
          <div>
            <span style={styles.navTitle}>{session.name}</span>
            <span style={{ fontSize: "0.7rem", color: TERRA, marginLeft: 8, fontWeight: 600 }}>{session.label}</span>
          </div>
          <div style={{ flex: 1 }}/>
          <button onClick={() => navigate("/movement")} style={styles.exitBtn}>Exit</button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.container}>

          {/* progress */}
          <div style={{ marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: WARM_GRAY }}>Exercise {exIdx + 1} of {totalEx}</span>
              <span style={{ fontSize: "0.72rem", color: WARM_GRAY }}>{session.duration}</span>
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%`, background: TERRA }}/>
            </div>
          </div>

          {/* exercise queue chips */}
          <div style={styles.queueScroll}>
            {session.exercises.map((e, i) => (
              <div key={i} style={{ ...styles.qChip, ...(i === exIdx ? { background: TERRA, color: "#fff", borderColor: TERRA } : i < exIdx ? styles.qChipDone : {}) }}>
                {e.name}
              </div>
            ))}
          </div>

          {/* main exercise card */}
          <div style={styles.exCard}>
            <div style={styles.exTop}>
              <div>
                <div style={styles.exName}>{exercise.name}</div>
                <div style={styles.exTarget}>{exercise.target}</div>
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.75rem", borderRadius: "100px", background: TERRA_LIGHT, color: TERRA_DARK, border: `1px solid ${TERRA_BORDER}` }}>Flare-safe</span>
            </div>

            <div style={styles.figureWrap}>
              <FlareFigure name={exercise.name}/>
            </div>

            <div style={{ ...styles.cueBox, borderLeftColor: TERRA }}>
              {exercise.cue}
            </div>

            {/* timer or rep counter */}
            {exercise.type === "timed" ? (
              <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "3.5rem", fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", color: TERRA, lineHeight: 1, marginBottom: 8 }}>
                  {mm}
                </div>
                <div style={{ height: 4, background: "rgba(0,0,0,0.08)", borderRadius: 2, margin: "0 auto 1rem", maxWidth: 200 }}>
                  <div style={{ height: "100%", width: `${timerPct}%`, background: TERRA, borderRadius: 2, transition: "width 1s linear" }}/>
                </div>
                <button onClick={timer.running ? timer.pause : timer.start}
                  style={{ background: "none", border: `1px solid ${TERRA}`, borderRadius: "100px", padding: "0.5rem 1.25rem", fontSize: "0.82rem", color: TERRA, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                  {timer.running ? "Pause" : timer.secs === exercise.duration ? "Start timer" : "Resume"}
                </button>
              </div>
            ) : exercise.type === "sides" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                {["left", "right"].map(side => (
                  <div key={side} style={styles.counterBox}>
                    <div style={styles.counterLabel}>{side.charAt(0).toUpperCase() + side.slice(1)} side</div>
                    <div style={{ ...styles.counterVal, color: TERRA }}>{repsLeft[side]}</div>
                    <div style={styles.counterSub}>of {exercise.reps}</div>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 6 }}>
                      <button onClick={() => setRepsLeft(r => ({ ...r, [side]: Math.max(0, r[side] - 1) }))} style={styles.adjBtn}>−</button>
                      <button onClick={() => setRepsLeft(r => ({ ...r, [side]: r[side] + 1 }))} style={styles.adjBtn}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div style={styles.counterBox}>
                  <div style={styles.counterLabel}>Reps</div>
                  <div style={{ ...styles.counterVal, color: TERRA }}>{repsLeft.total}</div>
                  <div style={styles.counterSub}>of {exercise.reps}</div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 6 }}>
                    <button onClick={() => setRepsLeft(r => ({ ...r, total: Math.max(0, r.total - 1) }))} style={styles.adjBtn}>−</button>
                    <button onClick={() => setRepsLeft(r => ({ ...r, total: r.total + 1 }))} style={styles.adjBtn}>+</button>
                  </div>
                </div>
                <div style={styles.counterBox}>
                  <div style={styles.counterLabel}>Pace</div>
                  <div style={{ fontSize: "0.9rem", color: WARM_GRAY, marginTop: 6, lineHeight: 1.4 }}>Slow &amp; controlled</div>
                </div>
              </div>
            )}

            {/* pain check */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: INK_LIGHT, marginBottom: 8 }}>How does this feel?</div>
              <div style={{ display: "flex", gap: 7 }}>
                {[{ key: "good", label: "Good" }, { key: "okay", label: "Okay" }, { key: "too-much", label: "Too much" }, { key: "stop", label: "Stop" }].map(p => (
                  <button key={p.key} onClick={() => setPainRating(p.key)}
                    style={{ flex: 1, padding: "0.5rem 0", borderRadius: "0.65rem", border: `1.5px solid ${painRating === p.key ? (p.key === "stop" ? "#E24B4A" : TERRA) : "rgba(0,0,0,0.1)"}`, background: painRating === p.key ? (p.key === "stop" ? "#FCEBEB" : TERRA_LIGHT) : "#fff", fontSize: "0.75rem", color: painRating === p.key ? (p.key === "stop" ? "#791F1F" : TERRA_DARK) : WARM_GRAY, cursor: "pointer", fontWeight: painRating === p.key ? 600 : 400, fontFamily: "inherit", transition: "all 0.15s" }}>
                    {p.label}
                  </button>
                ))}
              </div>
              {painRating === "stop" && (
                <div style={{ background: "#FCEBEB", border: "1px solid #F7C1C1", borderRadius: "0.75rem", padding: "0.75rem 1rem", marginTop: "0.75rem", fontSize: "0.82rem", color: "#791F1F", lineHeight: 1.6 }}>
                  Please stop and rest. If pain continues or worsens, contact your healthcare team. You don't need to finish today.
                </div>
              )}
              {painRating === "too-much" && (
                <div style={{ background: TERRA_LIGHT, border: `1px solid ${TERRA_BORDER}`, borderRadius: "0.75rem", padding: "0.75rem 1rem", marginTop: "0.75rem", fontSize: "0.82rem", color: TERRA_DARK, lineHeight: 1.6 }}>
                  Try the modification below — or skip this exercise and move to the next one. Both are completely fine.
                </div>
              )}
            </div>

            {/* actions */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
              <button onClick={() => setShowMod(m => !m)} style={{ ...styles.btnGhost, color: TERRA, borderColor: TERRA_BORDER, flex: "none", padding: "0.7rem 1rem" }}>
                Modify
              </button>
              <button onClick={nextExercise} style={{ ...styles.btnPrimary, background: TERRA, flex: 1 }}>
                {exIdx < totalEx - 1 ? "Done — next →" : "Complete session →"}
              </button>
            </div>
            <button onClick={() => nextExercise()} style={{ ...styles.btnGhost, width: "100%", fontSize: "0.82rem" }}>
              Skip this exercise
            </button>

            {/* modification panel */}
            {showMod && (
              <div style={{ background: TERRA_LIGHT, borderRadius: "0.875rem", padding: "1rem", border: `1px solid ${TERRA_BORDER}`, marginTop: "1rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: TERRA, marginBottom: "0.5rem" }}>Modification</div>
                <p style={{ fontSize: "0.85rem", color: INK_LIGHT, lineHeight: 1.65, margin: 0 }}>{exercise.mod}</p>
              </div>
            )}
          </div>

          {/* flare affirmation */}
          <div style={{ background: MIST, border: `1px solid ${MIST_BORDER}`, borderRadius: "0.875rem", padding: "1rem 1.25rem", fontSize: "0.82rem", color: NAVY, lineHeight: 1.6, textAlign: "center" }}>
            On a flare day, success = maintaining the habit without worsening symptoms. That still counts as training.
          </div>

        </div>
      </main>
    </div>
  );
}

const styles = {
  root:          { minHeight: "100vh", background: OFF_WHITE, display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif", color: INK },
  nav:           { background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)", position: "sticky", top: 0, zIndex: 100 },
  navInner:      { maxWidth: 800, margin: "0 auto", padding: "0 1.25rem", height: 56, display: "flex", alignItems: "center", gap: "0.75rem" },
  navTitle:      { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK },
  exitBtn:       { background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.3rem 0.85rem", fontSize: "0.8rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" },
  main:          { flex: 1, padding: "1.5rem 1.25rem", boxSizing: "border-box" },
  container:     { maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" },
  progressBar:   { height: 4, background: "rgba(0,0,0,0.08)", borderRadius: 2 },
  progressFill:  { height: "100%", borderRadius: 2, transition: "width 0.5s ease" },
  sessionPickCard: { background: "#fff", borderRadius: "1.25rem", border: "1.5px solid rgba(0,0,0,0.08)", padding: "1.25rem", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" },
  exCard:        { background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem" },
  exTop:         { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" },
  exName:        { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: INK },
  exTarget:      { fontSize: "0.82rem", color: WARM_GRAY, marginTop: 3 },
  figureWrap:    { background: OFF_WHITE, borderRadius: "0.875rem", height: 130, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" },
  cueBox:        { fontSize: "0.85rem", color: INK_LIGHT, lineHeight: 1.7, padding: "0.875rem 1rem", background: OFF_WHITE, borderRadius: "0.75rem", borderLeft: "3px solid", marginBottom: "1rem" },
  counterBox:    { background: OFF_WHITE, borderRadius: "0.875rem", padding: "0.875rem 0.75rem", textAlign: "center" },
  counterLabel:  { fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: WARM_GRAY, marginBottom: 4 },
  counterVal:    { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.75rem", fontWeight: 700, lineHeight: 1 },
  counterSub:    { fontSize: "0.7rem", color: WARM_GRAY, marginTop: 3 },
  adjBtn:        { width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(0,0,0,0.12)", background: "#fff", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: INK },
  queueScroll:   { display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" },
  qChip:         { flexShrink: 0, padding: "5px 12px", borderRadius: 14, fontSize: "0.75rem", border: "1px solid rgba(0,0,0,0.1)", color: WARM_GRAY, background: "#fff", whiteSpace: "nowrap" },
  qChipDone:     { background: OFF_WHITE, color: WARM_GRAY, borderColor: "transparent" },
  btnPrimary:    { background: TERRA, color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "center" },
  btnGhost:      { background: "transparent", color: WARM_GRAY, border: "1px solid rgba(0,0,0,0.15)", padding: "0.75rem 1.25rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "center" },
};
