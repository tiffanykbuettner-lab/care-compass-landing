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

/* ─── Exercise database ────────────────────────────────────────────────────── */
const EXERCISES = [
  /* ── STRENGTH ── */
  {
    id: "leg-press",
    name: "Leg press",
    category: "strength",
    flareSafe: false,
    sessions: ["Full Body A"],
    sets: "2–3 sets · 8–12 reps",
    joints: { load: ["Knees", "Hips"], support: ["Ankles"], neutral: ["Low back"] },
    cue: "Feet hip-width, toes slightly out. Press through the whole foot — avoid locking knees at the top. Control the return slowly. Think 'heel drive', not 'toe push'.",
    whyItMatters: "One of the safest quad and glute builders for hEDS because the machine controls the range — your joints don't have to work to stabilise the load path.",
    progression: [
      { step: "Bodyweight sit-to-stand", detail: "Control and body awareness first", status: "done" },
      { step: "Leg press — low load", detail: "2×8, very light, full control", status: "current" },
      { step: "Add reps to 2×12", detail: "Before adding any weight", status: "upcoming" },
      { step: "Add small load", detail: "Return to 2×8, repeat cycle", status: "upcoming" },
    ],
    mods: [
      { trigger: "Knee flare",     type: "flare",    text: "Reduce range of motion to 90°. Widen stance slightly to reduce knee valgus load." },
      { trigger: "Hip flare",      type: "flare",    text: "Elevate foot plate, reduce depth. Or swap to seated leg extension (single leg, light)." },
      { trigger: "No machine",     type: "alt",      text: "Sit-to-stand from a high chair or box. Add a resistance band above knees for glute activation." },
      { trigger: "Too easy",       type: "progress", text: "Add a small resistance band just above the knees to challenge hip stability during the press." },
    ],
    tags: ["quads", "glutes", "hips", "lower body"],
  },
  {
    id: "seated-cable-row",
    name: "Seated cable row",
    category: "strength",
    flareSafe: false,
    sessions: ["Full Body A"],
    sets: "2–3 sets · 8–12 reps",
    joints: { load: ["Shoulders", "Wrists"], support: ["Low back"], neutral: ["Neck"] },
    cue: "Set shoulder blades before pulling — think 'tuck and hold.' Pull to lower ribs, exhale on effort. Return under full control. Never let the weight pull your shoulders forward.",
    whyItMatters: "Builds the upper back muscles that hold your shoulder blades in place, directly reducing subluxation risk in the shoulder joint.",
    progression: [
      { step: "Scapular setting isometric", detail: "Learn the position before loading it", status: "done" },
      { step: "Band pull-apart seated", detail: "Light, elbow close to body", status: "done" },
      { step: "Cable row — light", detail: "2×8, controlled", status: "current" },
      { step: "Add reps to 2×12", detail: "Hold load constant first", status: "upcoming" },
    ],
    mods: [
      { trigger: "Shoulder flare", type: "flare",    text: "Switch to isometric external rotation only. Or: band pull-apart seated, very light." },
      { trigger: "Wrist flare",    type: "flare",    text: "Use a neutral grip handle. Or wrap wrists and reduce load significantly." },
      { trigger: "No cable",       type: "alt",      text: "Resistance band anchored to a door. Same movement, less stabilisation demand." },
      { trigger: "Neck / rib flare", type: "flare",  text: "Skip today. Replace with scapular setting (isometric) only." },
    ],
    tags: ["upper back", "scapular stability", "shoulders", "upper body"],
  },
  {
    id: "glute-bridge",
    name: "Glute bridge",
    category: "strength",
    flareSafe: true,
    sessions: ["Full Body A"],
    sets: "2–3 sets · 10–15 reps",
    joints: { load: ["Hips"], support: [], neutral: ["Knees", "Low back", "Ankles"] },
    cue: "Feet hip-width, heels close to hips. Drive through heels — not toes. Squeeze glutes at the top, hold 1–2 sec. Avoid hyperextending the low back at the top.",
    whyItMatters: "Glute strength is the single most important stabiliser for hip joints and reduces load on the low back. One of the safest loading positions for hEDS.",
    progression: [
      { step: "Supine heel slide", detail: "Hip awareness with no load", status: "done" },
      { step: "Glute bridge — bodyweight", detail: "2×10, hold 1 sec", status: "current" },
      { step: "Add hold time", detail: "2×12–15, hold 2 sec at top", status: "upcoming" },
      { step: "Single-leg glute bridge", detail: "Easier leg first", status: "upcoming" },
    ],
    mods: [
      { trigger: "Knee sensitivity",  type: "flare",    text: "Move feet further from hips to reduce knee bend. Still fully activates glutes." },
      { trigger: "Low back flare",    type: "flare",    text: "Reduce height of bridge. Focus on posterior pelvic tilt only — partial range still works." },
      { trigger: "Add challenge",     type: "progress", text: "Place a resistance band just above knees to increase glute med activation." },
      { trigger: "Hip flare",         type: "flare",    text: "This is actually one of the safest exercises during a hip flare. Keep range small." },
    ],
    tags: ["glutes", "hips", "low back", "lower body"],
  },
  {
    id: "incline-push-up",
    name: "Incline / wall push-up",
    category: "strength",
    flareSafe: false,
    sessions: ["Full Body A"],
    sets: "2 sets · 8–12 reps",
    joints: { load: ["Shoulders", "Wrists"], support: ["Elbows"], neutral: ["Neck"] },
    cue: "Hands wider than shoulder-width, elbows at ~45°. Lead with your chest, not your nose. Keep a straight line from head to heels. Full control on the return — don't drop.",
    whyItMatters: "Builds anterior shoulder and chest strength which, combined with the rowing movements, creates balanced shoulder stability — essential for reducing subluxation.",
    progression: [
      { step: "Wall push-up", detail: "Hands on wall, minimal load", status: "done" },
      { step: "High incline (counter height)", detail: "2×8", status: "current" },
      { step: "Lower incline (bench height)", detail: "Increase demand gradually", status: "upcoming" },
      { step: "Floor push-up", detail: "Only when incline is consistent", status: "upcoming" },
    ],
    mods: [
      { trigger: "Shoulder flare",    type: "flare",    text: "Raise the incline further — stand closer to the wall. Less load, same motor pattern." },
      { trigger: "Wrist flare",       type: "flare",    text: "Use fists or push-up handles to keep wrists neutral throughout." },
      { trigger: "Elbow sensitivity", type: "flare",    text: "Reduce range. Even a quarter push-up with perfect form trains the pattern." },
    ],
    tags: ["chest", "shoulders", "upper body", "push"],
  },
  {
    id: "box-squat",
    name: "Box squat / sit-to-stand",
    category: "strength",
    flareSafe: false,
    sessions: ["Full Body B"],
    sets: "2–3 sets · 8–12 reps",
    joints: { load: ["Knees", "Hips"], support: ["Ankles", "Low back"], neutral: [] },
    cue: "Sit back to a raised surface. Feet hip-width. Weight through whole foot. Drive knees out slightly on the way up. Lower slowly — control the descent entirely.",
    whyItMatters: "The box removes the fear of going too deep and gives a consistent target, making it safer for hypermobile knees that lose proprioception at end range.",
    progression: [
      { step: "Sit-to-stand — high surface", detail: "Confident, controlled", status: "done" },
      { step: "Box squat — standard chair height", detail: "2×8", status: "current" },
      { step: "Lower the surface", detail: "Increase range over weeks", status: "upcoming" },
      { step: "Goblet squat — light", detail: "Add load at comfortable range", status: "upcoming" },
    ],
    mods: [
      { trigger: "Knee flare",  type: "flare",    text: "Raise the box height to reduce knee bend. Even a slight squat still builds strength." },
      { trigger: "Hip flare",   type: "flare",    text: "Use armrests to reduce load through hips on the descent." },
      { trigger: "Ankle pain",  type: "flare",    text: "Elevate heels slightly on a small wedge or plate. Reduces ankle dorsiflexion demand." },
    ],
    tags: ["quads", "glutes", "hips", "lower body", "knees"],
  },
  {
    id: "chest-supported-row",
    name: "Chest-supported row",
    category: "strength",
    flareSafe: false,
    sessions: ["Full Body B"],
    sets: "2–3 sets · 8–12 reps",
    joints: { load: ["Shoulders"], support: ["Wrists"], neutral: ["Low back", "Neck"] },
    cue: "Lie face-down on an incline bench. Let arms hang. Row to lower ribs with scapulae set. The chest support removes spinal load — focus entirely on the scapular retraction and pull.",
    whyItMatters: "The chest support eliminates the low back from the equation, making this safer than a bent-over row for people with low back or spinal instability.",
    progression: [
      { step: "Prone Y-T-W on floor", detail: "Bodyweight scapular patterns", status: "done" },
      { step: "Chest-supported row — light", detail: "2×8, focus on scapular movement", status: "current" },
      { step: "Add reps then load", detail: "2×10 → 2×12 → small load increase", status: "upcoming" },
    ],
    mods: [
      { trigger: "No bench",         type: "alt",   text: "Seated cable row or band pull from doorframe anchor." },
      { trigger: "Shoulder flare",   type: "flare", text: "Reduce load significantly. Focus on scapular retraction alone — even that has value." },
    ],
    tags: ["upper back", "shoulders", "scapular stability", "upper body", "pull"],
  },
  {
    id: "hamstring-curl",
    name: "Hamstring curl",
    category: "strength",
    flareSafe: false,
    sessions: ["Full Body B"],
    sets: "2–3 sets · 10–12 reps",
    joints: { load: ["Knees"], support: ["Hips"], neutral: ["Ankles"] },
    cue: "Machine: keep hips pressed down throughout. Curl fully, return slowly. The eccentric (return) is as important as the curl. Stability ball: bridge hips and curl ball toward you.",
    whyItMatters: "Hamstring strength directly protects the knee from hyperextension — one of the most common injury mechanisms in hEDS. Builds posterior chain balance.",
    progression: [
      { step: "Supine heel drag", detail: "Lying on floor, drag heel toward hips", status: "done" },
      { step: "Machine curl — light", detail: "2×10, slow return", status: "current" },
      { step: "Add reps to 2×12", detail: "Control the eccentric", status: "upcoming" },
    ],
    mods: [
      { trigger: "Knee flare",   type: "flare", text: "Reduce range of motion. Partial curls at a comfortable range still build the hamstrings effectively." },
      { trigger: "No machine",   type: "alt",   text: "Stability ball hamstring curl lying on your back. Bridges and curls simultaneously." },
    ],
    tags: ["hamstrings", "knees", "lower body", "posterior chain"],
  },
  {
    id: "cable-chest-press",
    name: "Cable chest press",
    category: "strength",
    flareSafe: false,
    sessions: ["Full Body B"],
    sets: "2 sets · 8–12 reps",
    joints: { load: ["Shoulders", "Wrists"], support: ["Elbows"], neutral: ["Neck"] },
    cue: "Stand with cables at chest height, elbows below shoulder level. Press forward and slightly down. Avoid shrugging. Control the return — don't let cables snap back. Scapulae stay set.",
    whyItMatters: "Cable provides constant tension through the range, unlike dumbbells, which challenges the stabilisers more evenly — especially important for hypermobile shoulder joints.",
    progression: [
      { step: "Band chest press", detail: "Seated, light resistance", status: "done" },
      { step: "Cable press — light", detail: "2×8, controlled", status: "current" },
      { step: "Add reps to 2×12", detail: "Before adding weight", status: "upcoming" },
    ],
    mods: [
      { trigger: "Shoulder flare",  type: "flare", text: "Reduce range of motion. Press only 75% — still effective, far less shoulder stress." },
      { trigger: "No cables",        type: "alt",   text: "Light dumbbell chest press lying on your back. Support wrists with neutral grip." },
    ],
    tags: ["chest", "shoulders", "upper body", "push"],
  },

  /* ── STABILITY ── */
  {
    id: "band-external-rotation",
    name: "Band external rotation",
    category: "stability",
    flareSafe: true,
    sessions: ["Full Body A"],
    sets: "2 sets · 10–12 reps/side",
    joints: { load: ["Shoulders"], support: [], neutral: ["Elbows", "Wrists"] },
    cue: "Elbow pinned at 90° against your side throughout. Only the forearm rotates out. Use the lightest band — this is about position and control, not load.",
    whyItMatters: "External rotators are the most commonly weak and unstable group in hEDS shoulders. Strengthening them is the primary defence against shoulder subluxation.",
    progression: [
      { step: "Isometric ER — wall press", detail: "Press back of hand into wall, hold 5 sec", status: "done" },
      { step: "Band ER — very light", detail: "Focus on scapular control", status: "current" },
      { step: "Add reps to 12/side", detail: "Before progressing band weight", status: "upcoming" },
      { step: "Cable ER standing", detail: "More demand and feedback", status: "upcoming" },
    ],
    mods: [
      { trigger: "Shoulder flare",      type: "flare",    text: "Isometric only: press the back of your wrist into a wall at 90°. Hold 5 sec × 5 reps. Zero movement." },
      { trigger: "Wrist sensitivity",   type: "flare",    text: "Loop band around forearm above wrist instead of holding it. Eliminates wrist load entirely." },
      { trigger: "No band",             type: "alt",      text: "Motor patterning without resistance has real value. Go through the motion mindfully with a water bottle." },
    ],
    tags: ["shoulders", "rotator cuff", "stability", "upper body"],
  },
  {
    id: "face-pull",
    name: "Face pull",
    category: "stability",
    flareSafe: false,
    sessions: ["Full Body B"],
    sets: "2 sets · 10–12 reps",
    joints: { load: ["Shoulders"], support: ["Wrists", "Elbows"], neutral: ["Neck"] },
    cue: "Cable or band at face height. Pull toward your forehead, elbows high and wide. Think: separate your hands as you pull. Squeeze at the back. Return under control — don't let it snap forward.",
    whyItMatters: "Directly trains the posterior shoulder and mid-traps, improving shoulder blade positioning and reducing internal rotation dominance — a common pattern in hypermobility.",
    progression: [
      { step: "Band pull-apart", detail: "In front of chest, light band", status: "done" },
      { step: "Face pull — light", detail: "2×10, focus on elbows going high", status: "current" },
      { step: "Add reps then load", detail: "2×12 before increasing weight", status: "upcoming" },
    ],
    mods: [
      { trigger: "Shoulder flare", type: "flare", text: "Swap to band pull-apart in front of chest — far less shoulder demand." },
      { trigger: "Neck flare",     type: "flare", text: "Keep chin neutral. Avoid pulling into a position that loads your neck." },
    ],
    tags: ["shoulders", "upper back", "stability", "upper body"],
  },
  {
    id: "scapular-setting",
    name: "Scapular setting",
    category: "stability",
    flareSafe: true,
    sessions: ["Full Body A — warm-up", "Full Body B — warm-up"],
    sets: "8 reps · 2–3 sec hold",
    joints: { load: ["Shoulders"], support: [], neutral: ["Neck", "Wrists"] },
    cue: "Gently draw shoulder blades down and slightly together — like tucking them into your back pockets. Hold without holding your breath. No shrugging. Release fully between reps.",
    whyItMatters: "This is the foundational position for all upper body exercises. Learning to 'set' the scapulae before loading protects the shoulder joint in every pulling and pushing movement.",
    progression: [
      { step: "Scapular setting — isometric", detail: "Just find and hold the position", status: "current" },
      { step: "Setting + arm raise", detail: "Add a small forward arm raise", status: "upcoming" },
      { step: "Wall serratus reach", detail: "Dynamic scapular control", status: "upcoming" },
    ],
    mods: [
      { trigger: "Severe shoulder pain", type: "flare", text: "Reduce hold to 1 sec. Or simply practice the awareness without a formal hold — just 'find' the position." },
      { trigger: "Neck involvement",     type: "flare", text: "Do this lying down. Gravity changes the load when sitting or standing with a sore neck." },
    ],
    tags: ["shoulders", "scapular stability", "warm-up", "upper body"],
  },
  {
    id: "pallof-press",
    name: "Pallof press",
    category: "stability",
    flareSafe: true,
    sessions: ["Full Body B"],
    sets: "2 sets · 8–10 reps/side",
    joints: { load: [], support: ["Shoulders", "Low back"], neutral: ["Hips", "Knees"] },
    cue: "Stand sideways to the anchor. Brace your core as you press out — resist the rotation, do not let it happen. Start close to the anchor for less tension. Switch sides.",
    whyItMatters: "Anti-rotation core training directly reduces rotational stress on the spine. This is safer than crunches or twisting movements for people with spinal instability.",
    progression: [
      { step: "Pallof hold — no press", detail: "Hands at chest, just resist", status: "done" },
      { step: "Pallof press — close stance", detail: "Minimal band tension", status: "current" },
      { step: "Wider stance", detail: "More anti-rotation demand", status: "upcoming" },
    ],
    mods: [
      { trigger: "Low back flare",     type: "flare", text: "Seated Pallof press on a chair. Same movement, less spinal load, still effective." },
      { trigger: "Shoulder sensitive", type: "flare", text: "Reduce extension. Even pressing halfway trains anti-rotation." },
      { trigger: "No equipment",       type: "alt",   text: "Walk slowly while carrying a light weight at arm's length — same anti-rotation demand." },
    ],
    tags: ["core", "anti-rotation", "stability", "spine"],
  },
  {
    id: "wall-sit",
    name: "Wall sit",
    category: "stability",
    flareSafe: true,
    sessions: ["Full Body A — finisher", "Full Body B — finisher"],
    sets: "2 holds · 20–30 sec",
    joints: { load: ["Knees", "Hips"], support: [], neutral: ["Low back", "Ankles"] },
    cue: "Back flat against wall. Feet hip-width, directly below knees. Lower to a comfortable angle — doesn't need to be 90°. Breathe throughout. Don't let your back peel off the wall.",
    whyItMatters: "Isometric quad loading builds strength without joint movement, which is ideal for hypermobile knees that can be destabilised by heavy dynamic loading.",
    progression: [
      { step: "High angle (120°)", detail: "15 sec, low knee demand", status: "done" },
      { step: "Standard (90–100°)", detail: "20–30 sec", status: "current" },
      { step: "Extended duration", detail: "30–45 sec", status: "upcoming" },
    ],
    mods: [
      { trigger: "Knee flare", type: "flare", text: "Raise the angle significantly — even 130° still activates quads meaningfully. Duration still counts." },
      { trigger: "Hip flare",  type: "flare", text: "Skip today. Swap for seated leg extension (very light, short range)." },
    ],
    tags: ["quads", "knees", "isometric", "lower body"],
  },

  /* ── CORE ── */
  {
    id: "dead-bug",
    name: "Dead bug",
    category: "core",
    flareSafe: true,
    sessions: ["Full Body A"],
    sets: "2 sets · 5–8 reps/side",
    joints: { load: [], support: ["Low back", "Shoulders", "Hips"], neutral: [] },
    cue: "Press low back firmly into floor — keep it there the entire time. Move opposite arm and leg slowly. If your back lifts: smaller range, or pause. Exhale on the extension.",
    whyItMatters: "Dead bug trains deep core stability (especially the transversus abdominis) without spinal flexion or rotation, making it the safest core exercise for people with hypermobile spines.",
    progression: [
      { step: "Supine march", detail: "Legs only, arms stay still", status: "done" },
      { step: "Dead bug — arms only", detail: "Legs at 90°, only arms move", status: "done" },
      { step: "Dead bug — full", detail: "Opposite arm + leg, 5/side", status: "current" },
      { step: "Slow tempo", detail: "3 sec out, 3 sec back", status: "upcoming" },
    ],
    mods: [
      { trigger: "Shoulder flare",     type: "flare",    text: "Legs only — keep arms resting by your sides. Still trains trunk stability effectively." },
      { trigger: "Low back sensitive", type: "flare",    text: "Reduce range. Even 2–3 inches of movement counts if the back stays flat." },
      { trigger: "Neck strain",        type: "flare",    text: "Small towel roll under head. Keep chin neutral — don't look at your feet." },
      { trigger: "Too easy",           type: "progress", text: "Add a light resistance band between hands and knees for added tension throughout." },
    ],
    tags: ["core", "deep stability", "spine", "transversus abdominis"],
  },
  {
    id: "supine-march",
    name: "Supine march",
    category: "core",
    flareSafe: true,
    sessions: ["Full Body A — warm-up", "Flare Session A", "Flare Session B"],
    sets: "8 reps/side",
    joints: { load: [], support: ["Low back", "Hips"], neutral: ["Knees"] },
    cue: "Lie on your back, knees bent. Slowly lift one foot a few inches — pelvis stays completely still. Lower slowly. Alternate sides. Think of the pelvis as a bowl of water that must not spill.",
    whyItMatters: "Teaches the pelvis to remain stable while the legs move — the foundational skill for all lower body exercises and everyday movement.",
    progression: [
      { step: "Supine march — basic", detail: "Find pelvic neutral first", status: "current" },
      { step: "Supine march — arms overhead", detail: "Add arm movement for more challenge", status: "upcoming" },
      { step: "Dead bug full", detail: "Progresses from this pattern", status: "upcoming" },
    ],
    mods: [
      { trigger: "Low back pain", type: "flare", text: "Place hands under your low back for feedback on pelvis position. Reduce lift height." },
      { trigger: "Hip pain",     type: "flare", text: "Just do diaphragmatic breathing. Lie still and breathe. That is still a session." },
    ],
    tags: ["core", "pelvis", "stability", "warm-up"],
  },

  /* ── WARM-UP ── */
  {
    id: "360-breathing",
    name: "360 breathing",
    category: "warmup",
    flareSafe: true,
    sessions: ["Full Body A — warm-up", "Full Body B — warm-up", "All flare sessions"],
    sets: "2 min",
    joints: { load: [], support: [], neutral: ["Neck", "Low back"] },
    cue: "Breathe into your sides and back — not just your chest. Feel your rib cage expand in all directions on the inhale. Full release on the exhale. No forcing. No holding.",
    whyItMatters: "Diaphragmatic breathing activates deep core muscles, reduces sympathetic nervous system activation (which worsens pain sensitivity), and sets up proper rib position for all other exercises.",
    progression: [
      { step: "360 breathing — basic", detail: "Learn the pattern", status: "current" },
      { step: "Breathing with pelvic floor engagement", detail: "Coordinate breath and PF", status: "upcoming" },
    ],
    mods: [
      { trigger: "Rib pain or costochondritis", type: "flare", text: "Reduce breathing depth. Gentle, shallow breathing is still beneficial. Lying flat may feel better than seated." },
    ],
    tags: ["breathing", "warm-up", "nervous system", "core"],
  },
  {
    id: "bird-dog",
    name: "Bird dog",
    category: "warmup",
    flareSafe: true,
    sessions: ["Full Body B — warm-up"],
    sets: "6 reps/side",
    joints: { load: [], support: ["Low back", "Shoulders", "Wrists"], neutral: ["Hips", "Knees"] },
    cue: "On hands and knees. Extend opposite arm and leg — only as far as you can keep your spine completely still. Small range is correct here. Think 'long', not 'high'.",
    whyItMatters: "Trains the back extensors and glutes to work together while the spine stays neutral — essential for everyday movements like walking and lifting.",
    progression: [
      { step: "Bird dog — small ROM", detail: "Spine stays still", status: "current" },
      { step: "Bird dog — full extension", detail: "With 2 sec hold", status: "upcoming" },
      { step: "Bird dog — slow tempo", detail: "3 sec out, 3 sec back", status: "upcoming" },
    ],
    mods: [
      { trigger: "Wrist pain",      type: "flare", text: "Do this on fists or forearms. Same movement, neutral wrist position." },
      { trigger: "Low back flare",  type: "flare", text: "Reduce range significantly. Even 2 inches of movement with full control is valuable." },
      { trigger: "Knee sensitivity", type: "flare", text: "Fold a towel under the kneeling leg for padding." },
    ],
    tags: ["warm-up", "back extensors", "glutes", "balance"],
  },
  {
    id: "wall-serratus-reach",
    name: "Wall serratus reach",
    category: "warmup",
    flareSafe: true,
    sessions: ["Full Body A — warm-up", "Full Body B — warm-up", "Flare Session A"],
    sets: "8 reps",
    joints: { load: ["Shoulders"], support: [], neutral: ["Wrists", "Elbows"] },
    cue: "Stand or sit facing wall, hands flat. Gently press into the wall and let your shoulder blades spread apart (protract). Hold 2 sec. Return. This is small and controlled — not a push-up.",
    whyItMatters: "Trains the serratus anterior, which holds the shoulder blade flat against the rib cage. Winging scapulae is common in hEDS and directly contributes to shoulder instability.",
    progression: [
      { step: "Wall serratus reach — basic", detail: "Find the protraction movement", status: "current" },
      { step: "Serratus wall slide", detail: "Slide arms up while maintaining contact", status: "upcoming" },
    ],
    mods: [
      { trigger: "Shoulder flare", type: "flare", text: "Press palms together in front of chest instead. Same serratus activation, no wall needed." },
    ],
    tags: ["warm-up", "shoulders", "scapular stability", "serratus"],
  },
];

const CATEGORIES = [
  { key: "all",       label: "All exercises" },
  { key: "strength",  label: "Strength"       },
  { key: "stability", label: "Stability"      },
  { key: "core",      label: "Core"           },
  { key: "warmup",    label: "Warm-up"        },
];

const JOINTS_LIST = ["Shoulders", "Knees", "Hips", "Low back", "Wrists", "Neck", "Ankles"];

const CAT_COLORS = {
  strength:  { bg: MIST,        color: NAVY,      border: MIST_BORDER  },
  stability: { bg: SAGE_LIGHT,  color: SAGE_DARK, border: "#9FE1CB"    },
  core:      { bg: "#EEEDFE",   color: "#3C3489", border: "#AFA9EC"    },
  warmup:    { bg: TERRA_LIGHT, color: TERRA_DARK, border: TERRA_BORDER },
};

/* ─── Exercise figure (slate colorway) ────────────────────────────────────── */
function ExFigure({ name }) {
  const c = SLATE, l = MIST;
  const anim = `@keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}} @keyframes breathe{0%,100%{opacity:.4;transform:scale(0.96)}50%{opacity:1;transform:scale(1.04)}}`;
  const figures = {
    "Leg press": <svg width="170" height="110" viewBox="0 0 170 110" fill="none"><style>{anim}</style><rect x="130" y="10" width="20" height="80" rx="5" fill={c} opacity="0.12" stroke={c} strokeWidth="0.5"/><circle cx="52" cy="28" r="13" fill={c} opacity="0.85"/><line x1="52" y1="41" x2="48" y2="62" stroke={c} strokeWidth="3.5" strokeLinecap="round"/><line x1="48" y1="62" x2="36" y2="90" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="48" y1="62" x2="78" y2="55" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="78" y1="55" x2="130" y2="55" stroke={c} strokeWidth="2" strokeLinecap="round" strokeDasharray="5 3"/><circle cx="128" cy="55" r="4" fill={c} style={{animation:"pulse 1.8s ease-in-out infinite"}}/><text x="80" y="104" textAnchor="middle" fontSize="9" fill={c} opacity="0.6">press through whole foot</text></svg>,
    "Seated cable row": <svg width="170" height="110" viewBox="0 0 170 110" fill="none"><style>{anim}</style><circle cx="52" cy="28" r="13" fill={c} opacity="0.85"/><line x1="52" y1="41" x2="48" y2="74" stroke={c} strokeWidth="3.5" strokeLinecap="round"/><line x1="48" y1="74" x2="36" y2="93" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="48" y1="74" x2="62" y2="93" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="52" y1="52" x2="30" y2="60" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="52" y1="52" x2="78" y2="50" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="78" y1="50" x2="115" y2="50" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3"/><circle cx="113" cy="50" r="4" fill={c} style={{animation:"pulse 1.8s ease-in-out infinite"}}/><text x="90" y="104" textAnchor="middle" fontSize="9" fill={c} opacity="0.6">pull to lower ribs</text></svg>,
    "Glute bridge": <svg width="170" height="110" viewBox="0 0 170 110" fill="none"><style>{anim}</style><rect x="10" y="86" width="150" height="5" rx="2" fill={c} opacity="0.15"/><circle cx="50" cy="44" r="13" fill={c} opacity="0.85"/><line x1="50" y1="57" x2="58" y2="74" stroke={c} strokeWidth="3.5" strokeLinecap="round"/><line x1="58" y1="74" x2="46" y2="89" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="58" y1="74" x2="86" y2="76" stroke={c} strokeWidth="3" strokeLinecap="round"/><circle cx="72" cy="68" r="5" fill={c} style={{animation:"pulse 2s ease-in-out infinite"}}/><line x1="86" y1="76" x2="100" y2="89" stroke={c} strokeWidth="3" strokeLinecap="round"/><text x="120" y="70" textAnchor="middle" fontSize="9" fill={c} opacity="0.6">drive through heels</text></svg>,
    "Dead bug": <svg width="170" height="110" viewBox="0 0 170 110" fill="none"><style>{anim}</style><rect x="10" y="78" width="150" height="5" rx="2" fill={c} opacity="0.15"/><circle cx="56" cy="48" r="13" fill={c} opacity="0.85"/><line x1="56" y1="61" x2="56" y2="80" stroke={c} strokeWidth="3.5" strokeLinecap="round"/><line x1="56" y1="80" x2="40" y2="80" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="56" y1="80" x2="76" y2="68" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="56" y1="66" x2="34" y2="55" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><circle cx="32" cy="54" r="4" fill={c} style={{animation:"pulse 2.2s ease-in-out infinite"}}/><text x="110" y="68" textAnchor="middle" fontSize="9" fill={c} opacity="0.6">back stays flat · slow</text></svg>,
    "Band external rotation": <svg width="160" height="110" viewBox="0 0 160 110" fill="none"><style>{anim}</style><circle cx="58" cy="26" r="13" fill={c} opacity="0.85"/><line x1="58" y1="39" x2="56" y2="73" stroke={c} strokeWidth="3.5" strokeLinecap="round"/><line x1="56" y1="73" x2="43" y2="93" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="56" y1="73" x2="70" y2="93" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="58" y1="52" x2="40" y2="58" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="58" y1="52" x2="58" y2="73" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="58" y1="73" x2="105" y2="73" stroke={c} strokeWidth="2" strokeLinecap="round"/><circle cx="105" cy="73" r="4" fill={c} style={{animation:"pulse 1.8s ease-in-out infinite"}}/><text x="88" y="95" textAnchor="middle" fontSize="9" fill={c} opacity="0.6">elbow pinned</text></svg>,
    "Pallof press": <svg width="160" height="110" viewBox="0 0 160 110" fill="none"><style>{anim}</style><circle cx="62" cy="26" r="13" fill={c} opacity="0.85"/><line x1="62" y1="39" x2="59" y2="76" stroke={c} strokeWidth="3.5" strokeLinecap="round"/><line x1="59" y1="76" x2="45" y2="96" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="59" y1="76" x2="73" y2="96" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="62" y1="53" x2="42" y2="60" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="62" y1="53" x2="62" y2="62" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="62" y1="62" x2="108" y2="62" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><circle cx="108" cy="62" r="4" fill={c} style={{animation:"pulse 1.8s ease-in-out infinite"}}/><text x="84" y="90" textAnchor="middle" fontSize="9" fill={c} opacity="0.6">resist rotation</text></svg>,
    "Wall sit": <svg width="150" height="110" viewBox="0 0 150 110" fill="none"><style>{anim}</style><rect x="128" y="10" width="8" height="90" rx="4" fill={c} opacity="0.15"/><circle cx="70" cy="26" r="13" fill={c} opacity="0.85"/><line x1="70" y1="39" x2="70" y2="62" stroke={c} strokeWidth="3.5" strokeLinecap="round"/><line x1="70" y1="62" x2="50" y2="82" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="70" y1="62" x2="100" y2="62" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="100" y1="62" x2="105" y2="88" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="70" y1="50" x2="50" y2="56" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="70" y1="50" x2="128" y2="50" stroke={c} strokeWidth="2" strokeLinecap="round"/><text x="75" y="104" textAnchor="middle" fontSize="9" fill={c} opacity="0.6">back to wall · breathe</text></svg>,
    "Scapular setting": <svg width="140" height="110" viewBox="0 0 140 110" fill="none"><style>{anim}</style><circle cx="70" cy="28" r="13" fill={c} opacity="0.85"/><line x1="70" y1="41" x2="70" y2="78" stroke={c} strokeWidth="3.5" strokeLinecap="round"/><line x1="70" y1="56" x2="47" y2="66" stroke={c} strokeWidth="3" strokeLinecap="round"/><circle cx="46" cy="66" r="4" fill={c} style={{animation:"pulse 2s ease-in-out infinite"}}/><line x1="70" y1="56" x2="93" y2="66" stroke={c} strokeWidth="3" strokeLinecap="round"/><circle cx="94" cy="66" r="4" fill={c} style={{animation:"pulse 2s ease-in-out infinite"}}/><line x1="70" y1="78" x2="57" y2="97" stroke={c} strokeWidth="3" strokeLinecap="round"/><line x1="70" y1="78" x2="83" y2="97" stroke={c} strokeWidth="3" strokeLinecap="round"/><text x="70" y="108" textAnchor="middle" fontSize="9" fill={c} opacity="0.6">back pockets</text></svg>,
    "360 breathing": <svg width="140" height="110" viewBox="0 0 140 110" fill="none"><style>{anim}</style><circle cx="70" cy="55" r="40" stroke={c} strokeWidth="1" opacity="0.2" style={{animation:"breathe 4s ease-in-out infinite"}}/><circle cx="70" cy="55" r="26" stroke={c} strokeWidth="1.5" opacity="0.4" style={{animation:"breathe 4s ease-in-out infinite",animationDelay:"0.6s"}}/><circle cx="70" cy="55" r="13" fill={l} stroke={c} strokeWidth="1.5" style={{animation:"breathe 4s ease-in-out infinite",animationDelay:"1.2s"}}/><text x="70" y="59" textAnchor="middle" fontSize="9" fill={c} opacity="0.7">breathe</text></svg>,
  };
  return figures[name] || <svg width="120" height="90" viewBox="0 0 120 90" fill="none"><style>{anim}</style><circle cx="60" cy="45" r="28" stroke={c} strokeWidth="1.5" opacity="0.4" style={{animation:"breathe 3s ease-in-out infinite"}}/></svg>;
}

/* ─── Detail panel ─────────────────────────────────────────────────────────── */
function ExerciseDetail({ ex, onClose, onStartSession }) {
  const [showAllMods, setShowAllMods] = useState(false);
  const cat = CAT_COLORS[ex.category] || CAT_COLORS.strength;
  const MOD_TYPE = { flare: { label: "Flare mod", bg: TERRA_LIGHT, color: TERRA_DARK, border: TERRA_BORDER }, alt: { label: "Alternative", bg: MIST, color: NAVY, border: MIST_BORDER }, progress: { label: "Progression", bg: SAGE_LIGHT, color: SAGE_DARK, border: "#9FE1CB" } };
  const visibleMods = showAllMods ? ex.mods : ex.mods.slice(0, 2);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "1.5rem 1.5rem 0 0", width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", padding: "1.75rem 1.5rem 2.5rem" }}>
        {/* handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.12)", margin: "0 auto 1.25rem" }}/>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.75rem", borderRadius: "100px", background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>{ex.category}</span>
              {ex.flareSafe && <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.75rem", borderRadius: "100px", background: SAGE_LIGHT, color: SAGE_DARK, border: "1px solid #9FE1CB" }}>Flare-safe</span>}
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: 0 }}>{ex.name}</h2>
            <p style={{ fontSize: "0.82rem", color: WARM_GRAY, margin: "4px 0 0" }}>{ex.sets}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: WARM_GRAY, fontSize: "1.5rem", lineHeight: 1, flexShrink: 0, padding: "0.25rem" }}>×</button>
        </div>

        {/* figure */}
        <div style={{ background: OFF_WHITE, borderRadius: "0.875rem", height: 130, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
          <ExFigure name={ex.name}/>
        </div>

        {/* cue */}
        <div style={{ fontSize: "0.875rem", color: INK_LIGHT, lineHeight: 1.75, padding: "0.875rem 1rem", background: MIST, borderRadius: "0.75rem", borderLeft: `3px solid ${SLATE}`, marginBottom: "1.25rem" }}>
          {ex.cue}
        </div>

        {/* why it matters */}
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: SLATE, margin: "0 0 0.4rem" }}>Why it matters for hEDS</p>
          <p style={{ fontSize: "0.85rem", color: INK_LIGHT, lineHeight: 1.65, margin: 0 }}>{ex.whyItMatters}</p>
        </div>

        {/* joints */}
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: WARM_GRAY, margin: "0 0 0.5rem" }}>Joint involvement</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ex.joints.load.map(j => <span key={j} style={{ fontSize: "0.72rem", padding: "0.2rem 0.65rem", borderRadius: "100px", background: "#FCEBEB", color: "#791F1F", border: "0.5px solid #F7C1C1", fontWeight: 600 }}>{j} · load</span>)}
            {ex.joints.support.map(j => <span key={j} style={{ fontSize: "0.72rem", padding: "0.2rem 0.65rem", borderRadius: "100px", background: MIST, color: NAVY, border: `0.5px solid ${MIST_BORDER}`, fontWeight: 600 }}>{j} · support</span>)}
            {ex.joints.neutral.map(j => <span key={j} style={{ fontSize: "0.72rem", padding: "0.2rem 0.65rem", borderRadius: "100px", background: CREAM, color: WARM_GRAY, border: "0.5px solid rgba(0,0,0,0.1)" }}>{j}</span>)}
          </div>
        </div>

        {/* progression */}
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: WARM_GRAY, margin: "0 0 0.75rem" }}>Progression path</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {ex.progression.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: 14, position: "relative" }}>
                {i < ex.progression.length - 1 && <div style={{ position: "absolute", left: 14, top: 30, bottom: 0, width: 1, background: "rgba(0,0,0,0.08)" }}/>}
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: p.status === "done" ? SLATE : p.status === "current" ? MIST : "rgba(0,0,0,0.05)", border: p.status === "current" ? `2px solid ${SLATE}` : "none" }}>
                  {p.status === "done" && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  {p.status === "current" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: SLATE }}/>}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: p.status === "current" ? 600 : 400, color: p.status === "current" ? NAVY : p.status === "done" ? WARM_GRAY : INK_LIGHT }}>{p.step}</div>
                  <div style={{ fontSize: "0.75rem", color: WARM_GRAY, marginTop: 1 }}>{p.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* modifications */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: WARM_GRAY, margin: "0 0 0.65rem" }}>Modifications</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {visibleMods.map((m, i) => {
              const mt = MOD_TYPE[m.type] || MOD_TYPE.alt;
              return (
                <div key={i} style={{ background: mt.bg, border: `1px solid ${mt.border}`, borderRadius: "0.875rem", padding: "0.875rem 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: INK }}>{m.trigger}</span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "100px", background: "rgba(255,255,255,0.6)", color: mt.color }}>{mt.label}</span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: INK_LIGHT, lineHeight: 1.6, margin: 0 }}>{m.text}</p>
                </div>
              );
            })}
            {ex.mods.length > 2 && (
              <button onClick={() => setShowAllMods(s => !s)} style={{ background: "none", border: "none", color: SLATE, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, padding: 0, textAlign: "left" }}>
                {showAllMods ? "Show fewer" : `+ ${ex.mods.length - 2} more modifications`}
              </button>
            )}
          </div>
        </div>

        {/* sessions this appears in */}
        {ex.sessions.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: WARM_GRAY, margin: "0 0 0.5rem" }}>Appears in</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ex.sessions.map(s => <span key={s} style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem", borderRadius: "100px", background: MIST, color: NAVY, border: `1px solid ${MIST_BORDER}`, fontWeight: 500 }}>{s}</span>)}
            </div>
          </div>
        )}

        {/* actions */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button onClick={() => onStartSession(ex)} style={{ ...dStyles.btnPrimary, flex: 1 }}>Start a session with this →</button>
          <button onClick={onClose} style={dStyles.btnGhost}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main library page ────────────────────────────────────────────────────── */
export default function AnchorLibrary() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [category, setCategory]     = useState("all");
  const [search, setSearch]         = useState("");
  const [activeJoints, setActiveJoints] = useState([]);
  const [flareOnly, setFlareOnly]   = useState(false);
  const [selected, setSelected]     = useState(null);

  const firstName = user?.firstName || user?.username?.split(" ")[0] || "there";

  const toggleJoint = j => setActiveJoints(prev => prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]);

  const filtered = useMemo(() => {
    return EXERCISES.filter(ex => {
      if (category !== "all" && ex.category !== category) return false;
      if (flareOnly && !ex.flareSafe) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!ex.name.toLowerCase().includes(q) && !ex.tags.some(t => t.includes(q)) && !ex.cue.toLowerCase().includes(q)) return false;
      }
      if (activeJoints.length > 0) {
        const allJoints = [...ex.joints.load, ...ex.joints.support, ...ex.joints.neutral];
        if (!activeJoints.some(j => allJoints.includes(j))) return false;
      }
      return true;
    });
  }, [category, search, activeJoints, flareOnly]);

  /* exercises that PUT LOAD through flagged joints */
  const jointWarnings = useMemo(() => {
    if (!activeJoints.length) return new Set();
    return new Set(EXERCISES.filter(ex => ex.joints.load.some(j => activeJoints.includes(j))).map(ex => ex.id));
  }, [activeJoints]);

  function handleStartSession(ex) {
    const sessionName = ex.sessions.find(s => !s.includes("warm-up") && !s.includes("flare")) || "Full Body A";
    const cleanName = sessionName.replace(" — finisher", "").replace(" — warm-up", "");
    if (cleanName.toLowerCase().includes("flare")) { navigate("/movement/flare"); }
    else { navigate(`/movement/session/${encodeURIComponent(cleanName)}`); }
  }

  const NAV_ITEMS = [
    { key: "dashboard", label: "Dashboard", action: () => navigate("/movement") },
    { key: "session",   label: "Session",   action: () => navigate("/movement/session/Full%20Body%20A") },
    { key: "library",   label: "Library",   action: () => {} },
    { key: "progress",  label: "Progress",  action: () => navigate("/movement/progress") },
  ];

  return (
    <div style={styles.root}>
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.navBrand} onClick={() => navigate("/movement")} role="button">
            <AnchorMark size={28}/>
            <div><span style={styles.navProductName}>Anchor</span><span style={styles.navSister}>by Care Compass</span></div>
          </div>
          <div style={styles.navLinks}>
            {NAV_ITEMS.map(n => <button key={n.key} onClick={n.action} style={{ ...styles.navLink, ...(n.key === "library" ? styles.navLinkActive : {}) }}>{n.label}</button>)}
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
              <p style={styles.eyebrow}>Movement library</p>
              <h1 style={styles.title}>Exercises</h1>
              <p style={styles.subtitle}>{EXERCISES.length} exercises · joint-safe cues · hEDS modifications</p>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <circle cx="7" cy="7" r="5" stroke={WARM_GRAY} strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke={WARM_GRAY} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exercises, joints, or muscle groups..."
              style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", borderRadius: "0.875rem", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "0.9rem", color: INK, background: "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.15s" }}
              onFocus={e => e.target.style.borderColor = SLATE}
              onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.12)"}
            />
          </div>

          {/* Filters row */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            {/* category chips */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={() => setCategory(c.key)}
                  style={{ flexShrink: 0, padding: "0.4rem 0.9rem", borderRadius: "100px", border: `1.5px solid ${category === c.key ? NAVY : "rgba(0,0,0,0.1)"}`, background: category === c.key ? NAVY : "#fff", color: category === c.key ? "#fff" : WARM_GRAY, fontSize: "0.82rem", fontWeight: category === c.key ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                  {c.label}
                </button>
              ))}
            </div>
            {/* flare-safe toggle */}
            <button onClick={() => setFlareOnly(f => !f)}
              style={{ flexShrink: 0, padding: "0.4rem 0.9rem", borderRadius: "100px", border: `1.5px solid ${flareOnly ? TERRA : "rgba(0,0,0,0.1)"}`, background: flareOnly ? TERRA_LIGHT : "#fff", color: flareOnly ? TERRA_DARK : WARM_GRAY, fontSize: "0.82rem", fontWeight: flareOnly ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
              Flare-safe only
            </button>
          </div>

          {/* Joint filter */}
          <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: INK_LIGHT, margin: 0 }}>Filter by what's bothering you today</p>
              {activeJoints.length > 0 && (
                <button onClick={() => setActiveJoints([])} style={{ fontSize: "0.75rem", color: SLATE, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Clear</button>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {JOINTS_LIST.map(j => (
                <button key={j} onClick={() => toggleJoint(j)}
                  style={{ padding: "0.4rem 0.9rem", borderRadius: "100px", border: `1.5px solid ${activeJoints.includes(j) ? TERRA : "rgba(0,0,0,0.1)"}`, background: activeJoints.includes(j) ? TERRA_LIGHT : "#fff", color: activeJoints.includes(j) ? TERRA_DARK : WARM_GRAY, fontSize: "0.82rem", fontWeight: activeJoints.includes(j) ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  {j}
                </button>
              ))}
            </div>
            {activeJoints.length > 0 && (
              <p style={{ fontSize: "0.75rem", color: TERRA_DARK, margin: "0.75rem 0 0", lineHeight: 1.5 }}>
                Showing exercises involving {activeJoints.join(", ")}. Exercises marked with a warning put load through these joints.
              </p>
            )}
          </div>

          {/* Results count + grid */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: "0.82rem", color: WARM_GRAY, margin: 0 }}>
              {filtered.length} {filtered.length === 1 ? "exercise" : "exercises"}
              {search ? ` matching "${search}"` : ""}
              {activeJoints.length > 0 ? ` · ${activeJoints.join(", ")} flagged` : ""}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)" }}>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: "0 0 0.5rem" }}>No exercises match</p>
              <p style={{ fontSize: "0.875rem", color: WARM_GRAY, margin: "0 0 1rem" }}>Try clearing a filter or adjusting your search.</p>
              <button onClick={() => { setSearch(""); setCategory("all"); setActiveJoints([]); setFlareOnly(false); }} style={dStyles.btnPrimary}>Clear all filters</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "0.875rem" }}>
              {filtered.map(ex => {
                const cat = CAT_COLORS[ex.category] || CAT_COLORS.strength;
                const hasJointWarning = jointWarnings.has(ex.id);
                return (
                  <button key={ex.id} onClick={() => setSelected(ex)}
                    style={{ background: "#fff", borderRadius: "1rem", border: `1px solid ${hasJointWarning && activeJoints.length > 0 ? TERRA_BORDER : "rgba(0,0,0,0.07)"}`, padding: "1.1rem 1.25rem", textAlign: "left", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div>
                        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, display: "block", marginBottom: 4 }}>{ex.name}</span>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "100px", background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>{ex.category}</span>
                          {ex.flareSafe && <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "100px", background: SAGE_LIGHT, color: SAGE_DARK, border: "1px solid #9FE1CB" }}>Flare-safe</span>}
                          {hasJointWarning && activeJoints.length > 0 && <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "100px", background: TERRA_LIGHT, color: TERRA_DARK, border: `1px solid ${TERRA_BORDER}` }}>Modify needed</span>}
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 4 }}><path d="M6 3l5 5-5 5" stroke={WARM_GRAY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0 }}>{ex.sets}</p>
                    <p style={{ fontSize: "0.78rem", color: INK_LIGHT, margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ex.cue}</p>
                    {ex.joints.load.length > 0 && (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {ex.joints.load.map(j => <span key={j} style={{ fontSize: "0.65rem", padding: "0.1rem 0.5rem", borderRadius: "100px", background: "#FCEBEB", color: "#791F1F", border: "0.5px solid #F7C1C1" }}>{j}</span>)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

        </div>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>Anchor by Care Compass · <a href="https://joincarecompass.com" style={styles.footerLink}>joincarecompass.com</a></p>
        <p style={styles.footerDisclaimer}>Not medical advice. Always work with your healthcare team.</p>
      </footer>

      {selected && <ExerciseDetail ex={selected} onClose={() => setSelected(null)} onStartSession={ex => { setSelected(null); handleStartSession(ex); }}/>}
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
  container:       { maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" },
  header:          { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" },
  eyebrow:         { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: SLATE, margin: "0 0 0.3rem" },
  title:           { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: INK, margin: "0 0 0.4rem", letterSpacing: "-0.02em" },
  subtitle:        { fontSize: "0.95rem", color: WARM_GRAY, margin: 0, lineHeight: 1.6 },
  footer:          { padding: "1.5rem 2rem", borderTop: "1px solid rgba(0,0,0,0.07)", textAlign: "center" },
  footerText:      { fontSize: "0.85rem", color: WARM_GRAY, margin: "0 0 0.25rem" },
  footerLink:      { color: SAGE_DARK, textDecoration: "none" },
  footerDisclaimer: { fontSize: "0.75rem", color: "#aaa", margin: 0 },
};

const dStyles = {
  btnPrimary: { background: NAVY, color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit" },
  btnGhost:   { background: "transparent", color: WARM_GRAY, border: "1px solid rgba(0,0,0,0.15)", padding: "0.75rem 1.25rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
};
