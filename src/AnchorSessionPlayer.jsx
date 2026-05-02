import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate, useParams } from "react-router-dom";

/* ─── Anchor brand tokens ──────────────────────────────────────────────────── */
const SAGE        = "#7a9e87";
const SAGE_LIGHT  = "#e8f0eb";
const SAGE_DARK   = "#4a7058";
const NAVY        = "#1a3a5c";
const SLATE       = "#3a6ea8";
const SLATE_MID   = "#7aa8cc";
const MIST        = "#eaf2f8";
const MIST_BORDER = "#b8d4e8";
const TERRA       = "#b05a3a";
const TERRA_LIGHT = "#fdf3ee";
const TERRA_BORDER= "#e8b89a";
const WARM_GRAY   = "#6b6560";
const OFF_WHITE   = "#fafaf8";
const CREAM       = "#f4f1ec";
const INK         = "#2d2926";
const INK_LIGHT   = "#4a4540";

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

/* ─── Full Body A exercise data ────────────────────────────────────────────── */
const FULL_BODY_A = {
  name: "Full Body A",
  focus: "Lower body · upper back · shoulder stability · core",
  type: "standard",
  warmup: [
    { name: "360 breathing",    target: "2 min",      cue: "Breathe into your sides and back — not just your chest. Feel your rib cage expand in all directions. Let it fully release on the exhale. No forcing.",                            type: "timed",  duration: 120 },
    { name: "Scapular setting", target: "8 reps · 2 sec hold", cue: "Draw shoulder blades gently down and slightly together — like tucking them into your back pockets. Hold without holding your breath. Release fully between reps.", type: "reps",   reps: 8  },
    { name: "Supine marching",  target: "8 reps/side", cue: "Lie on your back, knees bent. Slowly lift one foot a few inches — pelvis stays completely still. Lower slowly. Alternate. No rushing.",                                      type: "sides",  reps: 8  },
    { name: "Wall serratus reach", target: "8 reps",  cue: "Hands flat on wall. Gently press in and let shoulder blades spread apart. Hold 2 sec. Return. This is small and controlled — not a push-up.",                               type: "reps",   reps: 8  },
    { name: "Sit-to-stand",     target: "8 reps",      cue: "Sit at the front of a firm chair. Lean slightly forward and stand using your legs, not momentum. Lower back down slowly — the down phase matters most.",                     type: "reps",   reps: 8  },
  ],
  exercises: [
    {
      name: "Leg press", sets: "2–3 sets", reps: "8–12", category: "Strength",
      cue: "Feet hip-width, toes slightly out. Press through the whole foot — avoid locking knees at the top. Control the return slowly.",
      joints: ["Knees", "Hips"],
      mods: [
        { trigger: "Knee flare",   text: "Reduce range of motion to 90°. Widen stance slightly to reduce knee valgus load." },
        { trigger: "Hip flare",    text: "Raise foot plate, reduce depth. Or swap to seated leg extension (single leg, light)." },
        { trigger: "No machine",   text: "Sit-to-stand from a high chair or box. Add a resistance band above knees for glute activation." },
        { trigger: "Too hard",     text: "Supine heel slides — lying down, slide one heel toward your body. No load, full control." },
      ],
    },
    {
      name: "Seated cable row", sets: "2–3 sets", reps: "8–12", category: "Strength",
      cue: "Set shoulder blades before pulling — think 'tuck and hold.' Pull to lower ribs, exhale on effort. Return under full control.",
      joints: ["Shoulders", "Wrists"],
      mods: [
        { trigger: "Shoulder flare", text: "Switch to isometric external rotation only. Or: band pull-apart seated, very light, elbow close to body." },
        { trigger: "Wrist flare",    text: "Use a neutral grip handle. Or wrap wrists and reduce load significantly." },
        { trigger: "No cable",       text: "Resistance band anchored to a door. Same movement, less stabilisation demand." },
        { trigger: "Neck / rib flare", text: "Skip today. Replace with scapular setting (isometric) only." },
      ],
    },
    {
      name: "Glute bridge", sets: "2–3 sets", reps: "10–15", category: "Strength",
      cue: "Feet hip-width, heels close to hips. Drive through heels — not toes. Squeeze glutes at top, hold 1–2 sec. Avoid hyperextending the low back.",
      joints: [],
      mods: [
        { trigger: "Knee sensitivity", text: "Adjust foot distance from hips. Closer = more knee bend. Further = less. Find pain-free range." },
        { trigger: "Low back flare",   text: "Reduce height of bridge — even a partial lift activates glutes. Focus on posterior pelvic tilt." },
        { trigger: "Add challenge",    text: "Place a resistance band just above knees to increase glute med activation." },
      ],
    },
    {
      name: "Incline / wall push-up", sets: "2 sets", reps: "8–12", category: "Strength",
      cue: "Hands wider than shoulder-width. Lead with your chest, not your nose. Keep a straight line from head to heels. Control the return.",
      joints: ["Shoulders", "Wrists"],
      mods: [
        { trigger: "Shoulder flare", text: "Raise the incline further — stand closer to the wall. Less load, same motor pattern." },
        { trigger: "Wrist flare",    text: "Use fists or push-up handles to keep wrist neutral." },
        { trigger: "Too easy",       text: "Lower the incline. A countertop is a good middle step between wall and floor." },
      ],
    },
    {
      name: "Band external rotation", sets: "2 sets", reps: "10–12/side", category: "Stability",
      cue: "Elbow pinned at 90° against your side throughout. Only the forearm rotates out. Use the lightest band — this is about position and control, not load.",
      joints: ["Shoulders"],
      mods: [
        { trigger: "Shoulder flare", text: "Swap to isometric: press the back of your wrist into a wall at 90°. Hold 5 sec × 5 reps. Zero movement." },
        { trigger: "Wrist sensitivity", text: "Loop band around forearm above wrist instead. Eliminates wrist load entirely." },
        { trigger: "No band",         text: "Even the motor patterning without resistance has value. Go through the motion mindfully." },
      ],
    },
    {
      name: "Dead bug", sets: "2 sets", reps: "5–8/side", category: "Core",
      cue: "Press low back firmly into floor — keep it there the entire time. Move opposite arm and leg slowly. If your back lifts: smaller range, or pause. Exhale on the extension.",
      joints: [],
      mods: [
        { trigger: "Shoulder flare", text: "Legs only — keep arms resting by your sides. Still trains trunk stability effectively." },
        { trigger: "Low back sensitive", text: "Reduce range. Even a 2–3 inch movement counts if the back stays flat. Less is more." },
        { trigger: "Too easy",         text: "Add a light resistance band between hands and knees for added tension throughout." },
      ],
    },
  ],
};

const FULL_BODY_B = {
  name: "Full Body B",
  focus: "Posterior chain · chest · shoulder control · trunk stability",
  type: "standard",
  warmup: [
    { name: "360 breathing",      target: "2 min",       cue: "Breathe into your sides and back. Expand in all directions. Full release on exhale.",                                                                          type: "timed", duration: 120 },
    { name: "Rib stacking",       target: "5 breaths",    cue: "Sit or lie comfortably. Find neutral spine. Take 5 slow breaths, letting your ribs expand naturally. No forcing.",                                            type: "timed", duration: 30  },
    { name: "Wall serratus slide", target: "8 reps",      cue: "Hands flat on wall, arms extended. Slide arms slowly upward while maintaining gentle wall contact. Keep shoulder blades from winging.",                      type: "reps",  reps: 8      },
    { name: "Bird dog (small ROM)", target: "6 reps/side", cue: "On hands and knees. Extend opposite arm and leg — only as far as you can keep your spine completely still. Small range is correct here.",                   type: "sides", reps: 6      },
    { name: "Box squat",          target: "8 reps",       cue: "Sit back onto a box or chair. Feet hip-width. Drive through whole foot to stand. Return slowly with control.",                                               type: "reps",  reps: 8      },
  ],
  exercises: [
    {
      name: "Box squat / sit-to-stand", sets: "2–3 sets", reps: "8–12", category: "Strength",
      cue: "Sit back to a raised surface. Feet hip-width. Weight through whole foot. Drive knees out slightly on the way up. Lower slowly — control the descent.",
      joints: ["Knees", "Hips"],
      mods: [
        { trigger: "Knee flare",  text: "Raise the box height to reduce knee bend. Even a slight squat still builds strength." },
        { trigger: "Hip flare",   text: "Reduce depth significantly. Sit-to-stand from a standard chair height with armrest support if needed." },
        { trigger: "Too easy",    text: "Add a light resistance band above knees for glute med activation during the movement." },
      ],
    },
    {
      name: "Chest-supported row", sets: "2–3 sets", reps: "8–12", category: "Strength",
      cue: "Lie face-down on an incline bench. Let arms hang. Row to lower ribs with scapulae set. The chest support removes spinal load — focus entirely on the pull.",
      joints: ["Shoulders"],
      mods: [
        { trigger: "Shoulder flare",  text: "Reduce load significantly and focus on scapular setting alone. Even the retraction without a full row counts." },
        { trigger: "No bench",         text: "Seated cable row or band pull from a doorframe anchor." },
      ],
    },
    {
      name: "Hamstring curl", sets: "2–3 sets", reps: "10–12", category: "Strength",
      cue: "Machine: keep hips pressed down. Curl fully, return slowly. Stability ball: lie on back, feet on ball, curl ball toward hips with bridged hips. Control is everything.",
      joints: ["Knees"],
      mods: [
        { trigger: "Knee flare",  text: "Reduce range of motion. Partial curls at a comfortable range still build the hamstrings." },
        { trigger: "No machine",  text: "Stability ball hamstring curl lying on your back. Light and joint-friendly." },
      ],
    },
    {
      name: "Cable chest press", sets: "2 sets", reps: "8–12", category: "Strength",
      cue: "Stand with cables at chest height, elbows slightly below shoulder level. Press forward and slightly down. Avoid shrugging. Control the return — don't let cables snap back.",
      joints: ["Shoulders", "Wrists"],
      mods: [
        { trigger: "Shoulder flare", text: "Reduce range of motion. Press only to 75% extension. Still effective, far less shoulder stress." },
        { trigger: "No cables",       text: "Light dumbbell chest press lying on your back. Support wrists with neutral grip." },
      ],
    },
    {
      name: "Face pull", sets: "2 sets", reps: "10–12", category: "Stability",
      cue: "Cable or band at face height. Pull toward your forehead, elbows high and wide. Think: separate your hands as you pull. Squeeze at the back. Return under control.",
      joints: ["Shoulders"],
      mods: [
        { trigger: "Shoulder flare", text: "Reduce load dramatically. Or swap to band pull-apart in front of chest — far less demand." },
        { trigger: "Neck flare",     text: "Keep chin neutral. Avoid pulling into a position that loads your neck." },
      ],
    },
    {
      name: "Pallof press", sets: "2 sets", reps: "8–10/side", category: "Core",
      cue: "Stand sideways to the anchor. Brace your core as you press out — resist the rotation, do not let it happen. Start close to the anchor for less tension. Switch sides.",
      joints: [],
      mods: [
        { trigger: "Low back flare",  text: "Seated Pallof press on a chair. Same movement, less spinal load, still effective." },
        { trigger: "Shoulder sensitive", text: "Reduce extension distance. Even pressing halfway still trains anti-rotation." },
        { trigger: "No equipment",    text: "Carry a light weight (water bottle) at arm's length while walking slowly — same anti-rotation demand." },
      ],
    },
  ],
};

const SESSIONS = {
  "Full Body A": FULL_BODY_A,
  "Full Body B": FULL_BODY_B,
};

/* ─── Warm-up figure illustrations ────────────────────────────────────────── */
function ExerciseFigure({ name, isFlare }) {
  const color = isFlare ? TERRA : SLATE;
  const light = isFlare ? TERRA_LIGHT : MIST;
  const figures = {
    "360 breathing": (
      <svg width="140" height="100" viewBox="0 0 140 100" fill="none">
        <circle cx="70" cy="50" r="38" stroke={color} strokeWidth="1" opacity="0.3" style={{ animation: "pulse 3.5s ease-in-out infinite" }}/>
        <circle cx="70" cy="50" r="26" stroke={color} strokeWidth="1.5" opacity="0.5" style={{ animation: "pulse 3.5s ease-in-out infinite", animationDelay: "0.5s" }}/>
        <circle cx="70" cy="50" r="14" fill={light} stroke={color} strokeWidth="1.5" style={{ animation: "pulse 3.5s ease-in-out infinite", animationDelay: "1s" }}/>
        <text x="70" y="54" textAnchor="middle" fontSize="9" fill={color} opacity="0.7">breathe</text>
        <style>{`@keyframes pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}`}</style>
      </svg>
    ),
    "Scapular setting": (
      <svg width="140" height="100" viewBox="0 0 140 100" fill="none">
        <circle cx="70" cy="28" r="13" fill={color} opacity="0.85"/>
        <line x1="70" y1="41" x2="70" y2="78" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="70" y1="56" x2="47" y2="66" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="46" cy="66" r="4" fill={color} style={{ animation: "pulse2 2s ease-in-out infinite" }}/>
        <line x1="70" y1="56" x2="93" y2="66" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="94" cy="66" r="4" fill={color} style={{ animation: "pulse2 2s ease-in-out infinite" }}/>
        <line x1="70" y1="78" x2="57" y2="97" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="70" y1="78" x2="83" y2="97" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <style>{`@keyframes pulse2{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}`}</style>
      </svg>
    ),
    "Supine marching": (
      <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
        <rect x="10" y="80" width="140" height="5" rx="2" fill={color} opacity="0.2"/>
        <circle cx="55" cy="42" r="13" fill={color} opacity="0.85"/>
        <line x1="55" y1="55" x2="55" y2="82" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="55" y1="82" x2="40" y2="82" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="55" y1="82" x2="76" y2="66" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="76" cy="66" r="4.5" fill={color} style={{ animation: "march 1.8s ease-in-out infinite" }}/>
        <line x1="55" y1="64" x2="35" y2="72" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="55" y1="64" x2="75" y2="70" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <text x="100" y="60" textAnchor="middle" fontSize="9" fill={color} opacity="0.6">pelvis stays still</text>
        <style>{`@keyframes march{0%,100%{opacity:.4;transform:translateY(0)}50%{opacity:1;transform:translateY(-6px)}}`}</style>
      </svg>
    ),
    "Glute bridge": (
      <svg width="170" height="100" viewBox="0 0 170 100" fill="none">
        <rect x="10" y="84" width="150" height="5" rx="2" fill={color} opacity="0.2"/>
        <circle cx="50" cy="44" r="13" fill={color} opacity="0.85"/>
        <line x1="50" y1="57" x2="58" y2="74" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="58" y1="74" x2="46" y2="89" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="58" y1="74" x2="86" y2="76" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="72" cy="68" r="5" fill={color} style={{ animation: "pulse2 2s ease-in-out infinite" }}/>
        <line x1="86" y1="76" x2="100" y2="89" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <text x="120" y="65" textAnchor="middle" fontSize="9" fill={color} opacity="0.6">drive through heels</text>
      </svg>
    ),
    "Dead bug": (
      <svg width="170" height="100" viewBox="0 0 170 100" fill="none">
        <rect x="10" y="78" width="150" height="5" rx="2" fill={color} opacity="0.2"/>
        <circle cx="56" cy="48" r="13" fill={color} opacity="0.85"/>
        <line x1="56" y1="61" x2="56" y2="80" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="56" y1="80" x2="40" y2="80" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="56" y1="80" x2="76" y2="68" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="56" y1="66" x2="34" y2="55" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="32" cy="54" r="4" fill={color} style={{ animation: "pulse2 2.2s ease-in-out infinite" }}/>
        <text x="110" y="65" textAnchor="middle" fontSize="9" fill={color} opacity="0.6">back stays flat · slow</text>
      </svg>
    ),
    "Seated cable row": (
      <svg width="170" height="100" viewBox="0 0 170 100" fill="none">
        <rect x="10" y="72" width="150" height="5" rx="2" fill={color} opacity="0.2"/>
        <circle cx="52" cy="28" r="13" fill={color} opacity="0.85"/>
        <line x1="52" y1="41" x2="48" y2="74" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="48" y1="74" x2="36" y2="93" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="48" y1="74" x2="62" y2="93" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="52" y1="52" x2="30" y2="60" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="52" y1="52" x2="78" y2="50" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="78" y1="50" x2="112" y2="50" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3"/>
        <circle cx="112" cy="50" r="4" fill={color} style={{ animation: "pulse2 1.8s ease-in-out infinite" }}/>
        <text x="90" y="90" textAnchor="middle" fontSize="9" fill={color} opacity="0.6">pull to lower ribs</text>
      </svg>
    ),
    "Band external rotation": (
      <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
        <circle cx="58" cy="26" r="13" fill={color} opacity="0.85"/>
        <line x1="58" y1="39" x2="56" y2="73" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="56" y1="73" x2="43" y2="93" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="56" y1="73" x2="70" y2="93" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="58" y1="52" x2="40" y2="58" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="58" y1="52" x2="58" y2="73" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="58" y1="73" x2="100" y2="73" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="100" cy="73" r="4" fill={color} style={{ animation: "pulse2 1.8s ease-in-out infinite" }}/>
        <text x="100" y="95" textAnchor="middle" fontSize="9" fill={color} opacity="0.6">elbow pinned</text>
      </svg>
    ),
    "Pallof press": (
      <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
        <circle cx="62" cy="26" r="13" fill={color} opacity="0.85"/>
        <line x1="62" y1="39" x2="59" y2="76" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="59" y1="76" x2="45" y2="96" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="59" y1="76" x2="73" y2="96" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="62" y1="53" x2="42" y2="60" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="62" y1="53" x2="62" y2="62" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="62" y1="62" x2="106" y2="62" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="106" cy="62" r="4" fill={color} style={{ animation: "pulse2 1.8s ease-in-out infinite" }}/>
        <text x="84" y="85" textAnchor="middle" fontSize="9" fill={color} opacity="0.6">resist the rotation</text>
      </svg>
    ),
    "Leg press": (
      <svg width="170" height="100" viewBox="0 0 170 100" fill="none">
        <rect x="130" y="10" width="20" height="80" rx="5" fill={color} opacity="0.15" stroke={color} strokeWidth="0.5"/>
        <circle cx="55" cy="28" r="13" fill={color} opacity="0.85"/>
        <line x1="55" y1="41" x2="52" y2="62" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="52" y1="62" x2="40" y2="90" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="52" y1="62" x2="80" y2="55" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="80" y1="55" x2="130" y2="55" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="5 3"/>
        <circle cx="128" cy="55" r="4" fill={color} style={{ animation: "pulse2 1.8s ease-in-out infinite" }}/>
        <text x="80" y="90" textAnchor="middle" fontSize="9" fill={color} opacity="0.6">press through whole foot</text>
      </svg>
    ),
  };
  return figures[name] || (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
      <circle cx="60" cy="40" r="28" stroke={color} strokeWidth="1.5" opacity="0.4" style={{ animation: "pulse2 2s ease-in-out infinite" }}/>
    </svg>
  );
}

/* ─── RestOverlay ──────────────────────────────────────────────────────────── */
function RestOverlay({ seconds, onSkip, isFlare }) {
  const [remaining, setRemaining] = useState(seconds);
  const color = isFlare ? TERRA : NAVY;
  useEffect(() => {
    if (remaining <= 0) { onSkip(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);
  const pct = Math.round((remaining / seconds) * 100);
  return (
    <div style={{ textAlign: "center", padding: "2rem 1rem", background: isFlare ? TERRA_LIGHT : MIST, borderRadius: "1.25rem", border: `1px solid ${isFlare ? TERRA_BORDER : MIST_BORDER}` }}>
      <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color, marginBottom: 8 }}>Rest period</p>
      <p style={{ fontSize: "0.85rem", color: WARM_GRAY, marginBottom: "1.25rem" }}>Let your joints settle. Breathe.</p>
      <div style={{ fontSize: "3.5rem", fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", color, lineHeight: 1, marginBottom: "1rem" }}>{remaining}</div>
      <div style={{ height: 4, background: "rgba(0,0,0,0.1)", borderRadius: 2, margin: "0 auto 1.25rem", maxWidth: 200 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 1s linear" }}/>
      </div>
      <button onClick={onSkip} style={{ background: "none", border: `1px solid ${color}`, borderRadius: "100px", padding: "0.5rem 1.25rem", fontSize: "0.82rem", color, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
        Ready — skip rest
      </button>
    </div>
  );
}

/* ─── Main session player ──────────────────────────────────────────────────── */
export default function AnchorSessionPlayer({ sessionName: propName, onComplete, onExit }) {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { name: paramName } = useParams();
  const resolvedName = propName || (paramName ? decodeURIComponent(paramName) : "Full Body A");
  const session  = SESSIONS[resolvedName] || FULL_BODY_A;
  function handleExit() { if (onExit) onExit(); else navigate("/movement"); }
  const isFlare  = session.type === "flare";
  const primaryColor = isFlare ? TERRA : NAVY;
  const primaryLight = isFlare ? TERRA_LIGHT : MIST;
  const primaryBorder = isFlare ? TERRA_BORDER : MIST_BORDER;

  /* phase: warmup | exercise | complete */
  const [phase, setPhase]           = useState("warmup");
  const [warmupIdx, setWarmupIdx]   = useState(0);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [setNum, setSetNum]         = useState(1);
  const [reps, setReps]             = useState(0);
  const [weight, setWeight]         = useState(0);
  const [showRest, setShowRest]     = useState(false);
  const [showMods, setShowMods]     = useState(false);
  const [painRating, setPainRating] = useState(null);
  const [sessionLog, setSessionLog] = useState([]);
  const [startTime]                 = useState(Date.now());

  /* warmup timed steps */
  const [timerSecs, setTimerSecs]   = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const warmupItem  = session.warmup[warmupIdx];
  const exercise    = session.exercises[exerciseIdx];
  const totalPhases = session.warmup.length + session.exercises.length;
  const donePhases  = (phase === "warmup" ? warmupIdx : session.warmup.length + exerciseIdx);
  const progress    = Math.round((donePhases / totalPhases) * 100);
  const targetSets  = exercise ? parseInt(exercise.sets.split("–")[1] || exercise.sets) || 3 : 3;

  useEffect(() => {
    if (warmupItem?.type === "timed") setTimerSecs(warmupItem.duration);
    else setTimerSecs(null);
    setTimerRunning(false);
    clearInterval(timerRef.current);
  }, [warmupIdx, phase]);

  function toggleTimer() {
    if (timerRunning) { clearInterval(timerRef.current); setTimerRunning(false); }
    else {
      setTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimerSecs(s => { if (s <= 1) { clearInterval(timerRef.current); setTimerRunning(false); return 0; } return s - 1; });
      }, 1000);
    }
  }

  function advanceWarmup() {
    clearInterval(timerRef.current);
    if (warmupIdx < session.warmup.length - 1) { setWarmupIdx(i => i + 1); }
    else { setPhase("exercise"); setExerciseIdx(0); setSetNum(1); setReps(0); }
  }

  function completeSet() {
    setSessionLog(log => [...log, { exercise: exercise.name, set: setNum, reps, weight }]);
    if (setNum < targetSets) {
      setSetNum(s => s + 1);
      setReps(0);
      setShowRest(true);
    } else { advanceExercise(); }
  }

  function advanceExercise() {
    setShowRest(false); setShowMods(false); setPainRating(null);
    if (exerciseIdx < session.exercises.length - 1) {
      setExerciseIdx(i => i + 1);
      setSetNum(1); setReps(0); setWeight(0);
      setShowRest(true);
    } else { setPhase("complete"); saveSession(); }
  }

  function saveSession() {
    const mins = Math.round((Date.now() - startTime) / 60000);
    const saved = { id: Date.now(), sessionName: session.name, type: session.type, date: todayStr(), duration: Math.max(1, mins), notes: "" };
    const all = [saved, ...loadSessions()];
    saveSessions(all);
    if (onComplete) onComplete(saved);
  }

  /* ── warmup screen ── */
  if (phase === "warmup") return (
    <div style={styles.root}>
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <AnchorMark size={24}/>
          <span style={styles.navTitle}>{session.name}</span>
          <div style={{ flex: 1 }}/>
          <button onClick={handleExit} style={styles.exitBtn}>Exit</button>
        </div>
      </nav>
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={styles.phaseLabel}>Warm-up · {warmupIdx + 1} of {session.warmup.length}</div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${Math.round(((warmupIdx) / totalPhases) * 100)}%`, background: primaryColor }}/>
            </div>
          </div>

          <div style={styles.exCard}>
            <div style={styles.exTop}>
              <div>
                <div style={styles.exName}>{warmupItem.name}</div>
                <div style={styles.exTarget}>{warmupItem.target}</div>
              </div>
              <span style={{ ...styles.categoryPill, background: primaryLight, color: primaryColor, borderColor: primaryBorder }}>Warm-up</span>
            </div>

            <div style={styles.figureWrap}>
              <ExerciseFigure name={warmupItem.name} isFlare={isFlare}/>
            </div>

            <div style={{ ...styles.cueBox, borderLeftColor: primaryColor }}>
              {warmupItem.cue}
            </div>

            {warmupItem.type === "timed" ? (
              <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "3.5rem", fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", color: primaryColor, lineHeight: 1, marginBottom: 8 }}>
                  {Math.floor(timerSecs / 60)}:{String(timerSecs % 60).padStart(2, "0")}
                </div>
                <div style={{ height: 4, background: "rgba(0,0,0,0.08)", borderRadius: 2, margin: "0 auto 1rem", maxWidth: 200 }}>
                  <div style={{ height: "100%", width: `${Math.round((timerSecs / warmupItem.duration) * 100)}%`, background: primaryColor, borderRadius: 2, transition: "width 1s linear" }}/>
                </div>
                <button onClick={toggleTimer} style={{ ...styles.btnGhost, color: primaryColor, borderColor: primaryColor }}>
                  {timerRunning ? "Pause" : timerSecs === warmupItem.duration ? "Start timer" : "Resume"}
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div style={styles.counterBox}>
                  <div style={styles.counterLabel}>{warmupItem.type === "sides" ? "Each side" : "Reps"}</div>
                  <div style={{ ...styles.counterVal, color: primaryColor }}>{warmupItem.reps}</div>
                  <div style={styles.counterSub}>target</div>
                </div>
                <div style={styles.counterBox}>
                  <div style={styles.counterLabel}>Pace</div>
                  <div style={{ ...styles.counterVal, fontSize: "1rem", color: WARM_GRAY }}>Slow & controlled</div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              {warmupIdx > 0 && <button onClick={() => setWarmupIdx(i => i - 1)} style={styles.btnGhost}>← Back</button>}
              <button onClick={advanceWarmup} style={{ ...styles.btnPrimary, background: primaryColor, flex: 1 }}>
                {warmupIdx < session.warmup.length - 1 ? "Next warm-up →" : "Start strength →"}
              </button>
            </div>
          </div>

          {/* warmup queue */}
          <div style={styles.queueScroll}>
            {session.warmup.map((w, i) => (
              <div key={i} style={{ ...styles.qChip, ...(i === warmupIdx ? { background: primaryColor, color: "#fff", borderColor: primaryColor } : i < warmupIdx ? styles.qChipDone : {}) }}>
                {w.name}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );

  /* ── exercise screen ── */
  if (phase === "exercise") return (
    <div style={styles.root}>
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <AnchorMark size={24}/>
          <span style={styles.navTitle}>{session.name}</span>
          <div style={{ flex: 1 }}/>
          <button onClick={handleExit} style={styles.exitBtn}>Exit</button>
        </div>
      </nav>
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={styles.phaseLabel}>Exercise {exerciseIdx + 1} of {session.exercises.length} · Set {setNum} of {targetSets}</div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%`, background: primaryColor }}/>
            </div>
          </div>

          {/* set progress dots */}
          <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
            {Array.from({ length: targetSets }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < setNum - 1 ? SLATE : i === setNum - 1 ? primaryColor : "rgba(0,0,0,0.08)", transition: "background 0.3s" }}/>
            ))}
          </div>

          {showRest ? (
            <>
              <RestOverlay seconds={60} onSkip={() => setShowRest(false)} isFlare={isFlare}/>
              <div style={{ marginTop: "1rem" }}>
                <button onClick={() => setShowRest(false)} style={{ ...styles.btnPrimary, background: primaryColor, width: "100%" }}>Ready early</button>
              </div>
            </>
          ) : (
            <div style={styles.exCard}>
              <div style={styles.exTop}>
                <div>
                  <div style={styles.exName}>{exercise.name}</div>
                  <div style={styles.exTarget}>{exercise.sets} · {exercise.reps} reps</div>
                </div>
                <span style={{ ...styles.categoryPill, background: exercise.category === "Stability" ? "#e8f0eb" : exercise.category === "Core" ? "#eeedfe" : primaryLight, color: exercise.category === "Stability" ? SAGE_DARK : exercise.category === "Core" ? "#3C3489" : primaryColor, borderColor: exercise.category === "Stability" ? "#9FE1CB" : exercise.category === "Core" ? "#AFA9EC" : primaryBorder }}>
                  {exercise.category}
                </span>
              </div>

              <div style={styles.figureWrap}>
                <ExerciseFigure name={exercise.name} isFlare={isFlare}/>
              </div>

              <div style={{ ...styles.cueBox, borderLeftColor: primaryColor }}>{exercise.cue}</div>

              {exercise.joints.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.72rem", color: WARM_GRAY, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", alignSelf: "center" }}>Joint load:</span>
                  {exercise.joints.map(j => <span key={j} style={{ fontSize: "0.72rem", padding: "0.2rem 0.65rem", borderRadius: "100px", background: "#FCEBEB", color: "#791F1F", border: "0.5px solid #F7C1C1", fontWeight: 600 }}>{j}</span>)}
                </div>
              )}

              {/* counters */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div style={styles.counterBox}>
                  <div style={styles.counterLabel}>Set</div>
                  <div style={{ ...styles.counterVal, color: primaryColor }}>{setNum}</div>
                  <div style={styles.counterSub}>of {targetSets}</div>
                </div>
                <div style={styles.counterBox}>
                  <div style={styles.counterLabel}>Reps</div>
                  <div style={{ ...styles.counterVal, color: primaryColor }}>{reps}</div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 6 }}>
                    <button onClick={() => setReps(r => Math.max(0, r - 1))} style={styles.adjBtn}>−</button>
                    <button onClick={() => setReps(r => r + 1)} style={styles.adjBtn}>+</button>
                  </div>
                </div>
                <div style={styles.counterBox}>
                  <div style={styles.counterLabel}>Weight (lbs)</div>
                  <div style={{ ...styles.counterVal, color: primaryColor }}>{weight || "BW"}</div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 6 }}>
                    <button onClick={() => setWeight(w => Math.max(0, w - 5))} style={styles.adjBtn}>−</button>
                    <button onClick={() => setWeight(w => w + 5)} style={styles.adjBtn}>+</button>
                  </div>
                </div>
              </div>

              {/* pain check */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: INK_LIGHT, marginBottom: 8 }}>Pain during this exercise</div>
                <div style={{ display: "flex", gap: 7 }}>
                  {[{ key: "good", label: "None" }, { key: "okay", label: "Mild" }, { key: "high", label: "High" }, { key: "stop", label: "Stop" }].map(p => (
                    <button key={p.key} onClick={() => setPainRating(p.key)}
                      style={{ flex: 1, padding: "0.5rem 0", borderRadius: "0.65rem", border: `1.5px solid ${painRating === p.key ? (p.key === "stop" ? "#E24B4A" : primaryColor) : "rgba(0,0,0,0.1)"}`, background: painRating === p.key ? (p.key === "stop" ? "#FCEBEB" : primaryLight) : "#fff", fontSize: "0.78rem", color: painRating === p.key ? (p.key === "stop" ? "#791F1F" : primaryColor) : WARM_GRAY, cursor: "pointer", fontWeight: painRating === p.key ? 600 : 400, fontFamily: "inherit", transition: "all 0.15s" }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* stop panel — replaces action buttons when pain is "stop" */}
              {painRating === "stop" ? (
                <div style={{ background: "#FCEBEB", border: "1px solid #F7C1C1", borderRadius: "1rem", padding: "1.25rem", marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#791F1F", margin: "0 0 0.4rem" }}>Stop and rest.</p>
                  <p style={{ fontSize: "0.82rem", color: "#A32D2D", lineHeight: 1.65, margin: "0 0 1rem" }}>
                    Don't push through this. Rest, note what happened, and contact your healthcare team if pain continues or worsens.
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button onClick={() => { setPainRating(null); advanceExercise(); }}
                      style={{ flex: 1, padding: "0.75rem 1rem", borderRadius: "100px", background: NAVY, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: "0.875rem" }}>
                      Skip to next exercise →
                    </button>
                    <button onClick={() => { setPhase("complete"); saveSession(); }}
                      style={{ padding: "0.75rem 1rem", borderRadius: "100px", background: "transparent", color: "#791F1F", border: "1px solid #F7C1C1", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: "0.875rem" }}>
                      End session
                    </button>
                  </div>
                </div>
              ) : (
                /* normal action buttons */
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                  <button onClick={() => setShowMods(m => !m)} style={{ ...styles.btnGhost, flex: "none", padding: "0.7rem 1rem" }}>
                    Modify
                  </button>
                  <button onClick={completeSet} style={{ ...styles.btnPrimary, background: primaryColor, flex: 1 }}>
                    {setNum < targetSets ? `Complete set ${setNum} →` : "Done — next exercise →"}
                  </button>
                </div>
              )}

              {/* modifications panel */}
              {showMods && (
                <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: "0.875rem", padding: "1rem", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: INK_LIGHT, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Modifications</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    {exercise.mods.map((m, i) => (
                      <div key={i} style={{ padding: "0.75rem 1rem", background: "#fff", borderRadius: "0.75rem", border: "1px solid rgba(0,0,0,0.07)" }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: INK, marginBottom: 3 }}>{m.trigger}</div>
                        <div style={{ fontSize: "0.78rem", color: WARM_GRAY, lineHeight: 1.55 }}>{m.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* exercise queue */}
          <div style={styles.queueScroll}>
            {session.exercises.map((e, i) => (
              <div key={i} style={{ ...styles.qChip, ...(i === exerciseIdx ? { background: primaryColor, color: "#fff", borderColor: primaryColor } : i < exerciseIdx ? styles.qChipDone : {}) }}>
                {e.name}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );

  /* ── complete screen ── */
  const elapsed = Math.round((Date.now() - startTime) / 60000);
  return (
    <div style={styles.root}>
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <AnchorMark size={24}/>
          <span style={styles.navTitle}>Session complete</span>
          <div style={{ flex: 1 }}/>
          <a href="/movement" style={styles.exitBtn}>Dashboard</a>
        </div>
      </nav>
      <main style={styles.main}>
        <div style={{ ...styles.container, alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: MIST, border: `1.5px solid ${MIST_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <AnchorMark size={40}/>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.8rem", fontWeight: 700, color: INK, margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
            {session.name} complete.
          </h1>
          <p style={{ fontSize: "0.95rem", color: WARM_GRAY, lineHeight: 1.75, maxWidth: 420, margin: "0 auto 2rem" }}>
            You showed up, you moved your body safely, and you built a little more stability than you had yesterday. That compounds over time.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", width: "100%", maxWidth: 480, marginBottom: "2rem" }}>
            {[
              { label: "Duration", value: `${Math.max(1, elapsed)} min` },
              { label: "Exercises", value: session.exercises.length },
              { label: "Total sets", value: sessionLog.length },
            ].map((s, i) => (
              <div key={i} style={{ background: MIST, borderRadius: "0.875rem", padding: "1rem", border: `1px solid ${MIST_BORDER}` }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: SLATE, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.6rem", fontWeight: 700, color: NAVY }}>{s.value}</div>
              </div>
            ))}
          </div>

          {sessionLog.length > 0 && (
            <div style={{ width: "100%", maxWidth: 480, marginBottom: "1.5rem", textAlign: "left" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: WARM_GRAY, marginBottom: "0.75rem" }}>What you logged</div>
              {Object.entries(sessionLog.reduce((acc, l) => { if (!acc[l.exercise]) acc[l.exercise] = []; acc[l.exercise].push(l); return acc; }, {})).map(([name, sets]) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "0.65rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <span style={{ fontSize: "0.875rem", color: INK, fontWeight: 500 }}>{name}</span>
                  <span style={{ fontSize: "0.82rem", color: WARM_GRAY }}>{sets.length} sets · {sets.map(s => s.reps).join(", ")} reps</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={() => navigate("/movement")} style={{ ...styles.btnPrimary, background: NAVY }}>Back to dashboard</button>
            <button onClick={() => navigate("/dashboard")} style={styles.btnGhost}>Open Care Compass →</button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */
const styles = {
  root:          { minHeight: "100vh", background: OFF_WHITE, display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif", color: INK },
  nav:           { background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)", position: "sticky", top: 0, zIndex: 100 },
  navInner:      { maxWidth: 800, margin: "0 auto", padding: "0 1.25rem", height: 56, display: "flex", alignItems: "center", gap: "0.75rem" },
  navTitle:      { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK },
  exitBtn:       { background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.3rem 0.85rem", fontSize: "0.8rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit", textDecoration: "none" },
  main:          { flex: 1, padding: "1.5rem 1.25rem", boxSizing: "border-box" },
  container:     { maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" },
  phaseLabel:    { fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: WARM_GRAY, marginBottom: 6 },
  progressBar:   { height: 4, background: "rgba(0,0,0,0.08)", borderRadius: 2 },
  progressFill:  { height: "100%", borderRadius: 2, transition: "width 0.5s ease" },
  exCard:        { background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem" },
  exTop:         { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" },
  exName:        { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.25rem", fontWeight: 700, color: INK },
  exTarget:      { fontSize: "0.82rem", color: WARM_GRAY, marginTop: 3 },
  categoryPill:  { fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.75rem", borderRadius: "100px", border: "1px solid", whiteSpace: "nowrap" },
  figureWrap:    { background: OFF_WHITE, borderRadius: "0.875rem", height: 130, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" },
  cueBox:        { fontSize: "0.85rem", color: INK_LIGHT, lineHeight: 1.7, padding: "0.875rem 1rem", background: OFF_WHITE, borderRadius: "0.75rem", borderLeft: "3px solid", marginBottom: "1rem" },
  counterBox:    { background: OFF_WHITE, borderRadius: "0.875rem", padding: "0.875rem 0.75rem", textAlign: "center" },
  counterLabel:  { fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: WARM_GRAY, marginBottom: 4 },
  counterVal:    { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.75rem", fontWeight: 700, lineHeight: 1 },
  counterSub:    { fontSize: "0.7rem", color: WARM_GRAY, marginTop: 3 },
  adjBtn:        { width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(0,0,0,0.12)", background: "#fff", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: INK },
  btnPrimary:    { background: NAVY, color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "center" },
  btnGhost:      { background: "transparent", color: WARM_GRAY, border: "1px solid rgba(0,0,0,0.15)", padding: "0.75rem 1.25rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "center" },
  queueScroll:   { display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" },
  qChip:         { flexShrink: 0, padding: "5px 12px", borderRadius: 14, fontSize: "0.75rem", border: "1px solid rgba(0,0,0,0.1)", color: WARM_GRAY, background: "#fff", whiteSpace: "nowrap" },
  qChipDone:     { background: OFF_WHITE, color: WARM_GRAY, borderColor: "transparent" },
};
