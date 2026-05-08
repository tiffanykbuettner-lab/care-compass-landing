/**
 * SageAssessmentChat.jsx
 *
 * Conversational assessment intake powered by Sage.
 * Default experience at /compass — replaces the multi-step form as the primary entry.
 *
 * Props:
 *   onComplete(extractedData)  — called when extraction is done; parent runs the analysis
 *   onSwitchToForm(partial)    — called when user taps "Fill it out myself instead"
 *                                partial contains whatever has been extracted so far
 */

import React, { useState, useEffect, useRef } from "react";

/* ─── Color constants ─────────────────────────────────────────────────────── */
const SAGE       = "#7a9e87";
const SAGE_LIGHT = "#e8f0eb";
const SAGE_DARK  = "#4a7058";
const TEAL       = "#4a9fa5";
const TEAL_LIGHT = "#e0f2f4";
const WARM_GRAY  = "#6b6560";
const OFF_WHITE  = "#fafaf8";
const INK        = "#2d2926";
const INK_LIGHT  = "#4a4540";

/* ─── Phase definitions ───────────────────────────────────────────────────── */
// These map exactly to the form's 4 steps so the analysis prompt stays unchanged.
const PHASES = [
  { id: "intro",      label: "Getting started",  systemCount: 0  },
  { id: "symptoms",   label: "Body systems",      systemCount: 9  },
  { id: "history",    label: "Health history",    systemCount: 0  },
  { id: "lifestyle",  label: "Daily variables",   systemCount: 0  },
];

const BODY_SYSTEMS = [
  "Joints & Muscles",
  "Heart & Circulation",
  "Digestive",
  "Neurological",
  "Skin & Immune",
  "Reproductive & Pelvic",
  "Breathing & Energy",
  "Mental Health",
  "Other",
];

/* ─── sessionStorage key ─────────────────────────────────────────────────── */
const CHAT_SAVE_KEY = "cc-assessment-chat";

/* ─── Account data reader ─────────────────────────────────────────────────── */
function readAccountData() {
  const data = { name: "", ageRange: "", conditions: [], medications: [], familyHistory: [] };
  try {
    data.name = localStorage.getItem("cc-display-name") || "";
    const profile = JSON.parse(localStorage.getItem("cc-profile") || "{}");
    if (profile.ageRange) data.ageRange = profile.ageRange;
    if (profile.conditions?.length) data.conditions = profile.conditions;

    const condStore = localStorage.getItem("cc-conditions");
    if (condStore) {
      const c = JSON.parse(condStore);
      if (Array.isArray(c) && c.length) data.conditions = c;
    }

    const medStore = localStorage.getItem("care-compass-medications-v1");
    if (medStore) {
      const meds = JSON.parse(medStore);
      data.medications = meds.filter(m => m.name).map(m =>
        `${m.name}${m.dose ? " " + m.dose : ""}${m.frequency ? " (" + m.frequency + ")" : ""}`
      );
    }

    const famStore = localStorage.getItem("cc-family-history");
    if (famStore) {
      const fam = JSON.parse(famStore);
      const MLABELS = {
        mother: "Mother", father: "Father",
        maternal_grandmother: "Maternal grandmother", maternal_grandfather: "Maternal grandfather",
        paternal_grandmother: "Paternal grandmother", paternal_grandfather: "Paternal grandfather",
        sister: "Sister", brother: "Brother",
        maternal_aunt: "Maternal aunt", maternal_uncle: "Maternal uncle",
        paternal_aunt: "Paternal aunt", paternal_uncle: "Paternal uncle",
        daughter: "Daughter", son: "Son",
      };
      data.familyHistory = fam
        .filter(e => e.member && e.conditions?.length)
        .map(e => `${MLABELS[e.member] || e.member}: ${e.conditions.join(", ")}${e.notes ? " (" + e.notes + ")" : ""}`);
    }
  } catch {}
  return data;
}

/* ─── Progress calculation ────────────────────────────────────────────────── */
function calcProgress(phase, systemsDiscussed) {
  // Weights: intro=5%, symptoms=55% (spread across 9 systems), history=20%, lifestyle=20%
  if (phase === "intro")     return Math.round(2 + (systemsDiscussed / 9) * 3);
  if (phase === "symptoms")  return Math.round(5 + (systemsDiscussed / 9) * 55);
  if (phase === "history")   return 62;
  if (phase === "lifestyle") return 82;
  return 100;
}

/* ─── System prompt builder ───────────────────────────────────────────────── */
function buildSystemPrompt(phase, systemsDiscussed, account) {
  const { name, ageRange, conditions, medications, familyHistory } = account;

  const accountCtx = [
    name           ? `Name: ${name}` : null,
    ageRange       ? `Age range: ${ageRange} (already known — don't ask again)` : null,
    conditions.length ? `Known conditions: ${conditions.join(", ")} (already known — acknowledge if relevant, don't ask to confirm)` : null,
    medications.length ? `Current medications: ${medications.join(", ")} (already on file — don't ask for a full list, but do ask about recent changes)` : null,
    familyHistory.length ? `Family history: ${familyHistory.join("; ")}` : null,
  ].filter(Boolean).join("\n");

  const systemsLeft = BODY_SYSTEMS.slice(systemsDiscussed);
  const systemsDone = BODY_SYSTEMS.slice(0, systemsDiscussed);
  const nextSystem  = systemsLeft[0] || null;

  const phaseInstructions = {
    intro: `
CURRENT PHASE: Intro
Your goal in this phase: warmly welcome the user, briefly explain what's happening ("We'll talk through your symptoms together — I'll ask about different areas of your health one at a time"), then ask about:
1. How long they've been experiencing these symptoms (if name is known, use it naturally)
2. Overall severity on a scale of 1-10 — how much symptoms affect daily life

If name or age range are already known from their profile, acknowledge that you have them — don't ask again. Once you have duration and severity, signal completion with [PHASE_COMPLETE:intro].`,

    symptoms: `
CURRENT PHASE: Body systems (${systemsDiscussed} of 9 complete)
Systems already covered: ${systemsDone.length > 0 ? systemsDone.join(", ") : "none yet"}
Next system to cover: ${nextSystem || "all done"}

Your goal: work through the body systems one at a time. For each system:
- Ask a warm, open question about that area (e.g. "How have your joints and muscles been? Think pain, stiffness, or anything that feels unstable")
- If they mention something, ask ONE natural follow-up to get useful detail (e.g. "Does it move around, or is it in a specific spot?")
- If they say nothing or it doesn't apply, move on gracefully
- After covering a system, append [SYSTEM_DONE:SystemName] at the very end of your message (e.g. [SYSTEM_DONE:Joints & Muscles])

After all 9 systems are done, give a brief transition: "That covers all the body systems — you've done a really thorough job sharing all of that. Let's talk about your health history now." Then append [PHASE_COMPLETE:symptoms].

Systems to cover in order: ${BODY_SYSTEMS.join(", ")}`,

    history: `
CURRENT PHASE: Health history
Your goal: gather diagnoses, medications, and allergies/sensitivities.

${conditions.length ? `You already know their conditions (${conditions.join(", ")}) — don't ask them to list diagnoses from scratch. Instead, ask if there's anything they'd add or update, or if they've received any new diagnoses recently.` : "Ask what diagnoses or suspected conditions they have, if any. Make it clear 'none yet' is a completely valid answer."}

${medications.length ? `You already have their medication list on file — don't ask them to repeat it. Ask if there have been any recent changes (new meds, stopped anything, dose changes).` : "Ask about current medications and supplements. Keep it casual — 'anything prescribed, over-the-counter, or supplements you take regularly?'"}

Then ask about known allergies or sensitivities (food, medication, environmental, contact).

When you have enough on all three (diagnoses, medications, allergies), signal: [PHASE_COMPLETE:history]`,

    lifestyle: `
CURRENT PHASE: Daily variables
Your goal: understand diet, activity, sleep, stress, and recent changes — the daily factors that often correlate with symptoms.

Ask about these conversationally, not as a list. Good flow:
1. Diet and eating patterns — any specific triggers, restrictions, or notable patterns
2. Activity level — what they can and can't manage physically
3. Sleep quality — falling asleep, staying asleep, how refreshed they feel
4. Stress and mental load — life circumstances, caregiving, work pressure
5. Recent changes — anything new in the last few months: new meds, moved, new stressor, diet change

Keep it light and warm. These questions can feel intrusive — validate that they're useful for finding patterns, not for judgment.

When you have enough across all five areas, give a warm closing: "That's everything I need — you've been incredibly thorough. Let me pull all of this together and generate your insights now." Then append [PHASE_COMPLETE:lifestyle] [ASSESSMENT_COMPLETE].`,
  };

  return `You are Sage, the compassionate Care Compass health guide. You are conducting a health assessment — a warm, conversational intake that covers symptoms, health history, and daily variables. The goal is to gather the same information as a structured form, but through natural conversation.

PATIENT PROFILE (from their account — use this silently, don't expose it mechanically):
${accountCtx || "No account data available — ask for everything naturally."}

CONVERSATION RULES:
- Ask ONE question at a time. Never list multiple questions in one message.
- Be genuinely warm — many chronic illness patients have felt dismissed. This may be the first time someone has asked this carefully.
- Keep messages SHORT — 2-4 sentences max. This is a conversation, not a lecture.
- When a user shares something difficult or frustrating, briefly acknowledge it before moving on ("That sounds exhausting." / "I'm sorry you've been dealing with that.")
- Never say "Great!" or "Awesome!" — be real, not performatively positive.
- Never give medical interpretations, never diagnose, never say what a symptom "means."
- Don't repeat back everything they said verbatim — trust that you heard them.
- Use the patient's name naturally if you know it, but don't overdo it.
- Write in plain sentences. No bullet points, no markdown, no lists in your responses.

MACHINE TOKENS (append silently at end of message when applicable — user doesn't see these as instructions, they're parsed by the app):
- [SYSTEM_DONE:SystemName] — after finishing a body system in the symptoms phase
- [PHASE_COMPLETE:phaseName] — when a phase is fully covered
- [ASSESSMENT_COMPLETE] — only at the very end of the lifestyle phase closing message

${phaseInstructions[phase] || phaseInstructions.intro}`;
}

/* ─── Extraction prompt ───────────────────────────────────────────────────── */
function buildExtractionPrompt(transcript, account) {
  return `You are a medical data extraction assistant. Extract structured health assessment data from this conversation transcript. Return ONLY valid JSON with no markdown, no explanation, no preamble.

KNOWN ACCOUNT DATA (use to fill gaps if the conversation didn't cover something already on file):
Name: ${account.name || ""}
Age range: ${account.ageRange || ""}
Known conditions: ${account.conditions.join(", ") || ""}
Current medications: ${account.medications.join(", ") || ""}

TRANSCRIPT:
${transcript}

Extract into this exact shape (use empty string "" for fields not mentioned, null for numeric fields not mentioned):
{
  "name": "<first name or empty string>",
  "ageRange": "<age range string or empty string>",
  "duration": "<how long experiencing symptoms, e.g. '6 months', 'several years' or empty string>",
  "severity": "<overall severity 1-10 as string, or empty string>",
  "symptoms": {
    "Joints & Muscles": "<description or empty string>",
    "Heart & Circulation": "<description or empty string>",
    "Digestive": "<description or empty string>",
    "Neurological": "<description or empty string>",
    "Skin & Immune": "<description or empty string>",
    "Reproductive & Pelvic": "<description or empty string>",
    "Breathing & Energy": "<description or empty string>",
    "Mental Health": "<description or empty string>",
    "Other": "<description or empty string>"
  },
  "diagnoses": "<conditions and diagnoses mentioned or empty string>",
  "medications": "<medications mentioned or empty string>",
  "allergies": "<allergies and sensitivities or empty string>",
  "diet": "<diet and eating patterns or empty string>",
  "activity": "<activity level description or empty string>",
  "sleep": "<sleep quality description or empty string>",
  "stress": "<stress and mental load description or empty string>",
  "recentChanges": "<recent changes mentioned or empty string>"
}

Rules:
- For symptoms: combine everything mentioned about that body system into a readable paragraph. If nothing was mentioned, use "".
- For diagnoses: if they were already on file and confirmed in conversation, include them. If not mentioned, still include from known account data.
- For medications: same — include known meds plus anything new mentioned.
- Be conservative — only include what was actually discussed or confirmed.
- Return ONLY the JSON object, nothing else.`;
}

/* ─── Firefly avatar ──────────────────────────────────────────────────────── */
const FF_KEYFRAMES = `
  @keyframes sacFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-2px)} }
  @keyframes sacWingL { 0%,100%{transform:rotate(0deg) scaleY(1)} 50%{transform:rotate(-18deg) scaleY(0.82)} }
  @keyframes sacWingR { 0%,100%{transform:rotate(0deg) scaleY(1)} 50%{transform:rotate(18deg) scaleY(0.82)} }
  @keyframes sacAntL  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-5deg)} }
  @keyframes sacAntR  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(5deg)} }
  @keyframes sacDotPulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
`;

const FireflyAvatar = ({ size = 28 }) => (
  <>
    <style>{FF_KEYFRAMES}</style>
    <div style={{ width: size, height: size, borderRadius: "50%", background: SAGE_DARK, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={size * 0.82} height={size * 0.82} viewBox="0 0 72 72" fill="none"
        style={{ animation: "sacFloat 3s ease-in-out infinite" }}>
        <ellipse cx="36" cy="36" rx="4" ry="6.5" fill="#e8f5e0"/>
        <ellipse cx="28" cy="34" rx="8" ry="3.5" fill="#a8d4b0" opacity="0.9"
          style={{ animation: "sacWingL 0.6s ease-in-out infinite", transformOrigin: "50% 50%" }}/>
        <ellipse cx="44" cy="34" rx="8" ry="3.5" fill="#a8d4b0" opacity="0.9"
          style={{ animation: "sacWingR 0.6s ease-in-out infinite", animationDelay: "0.05s", transformOrigin: "50% 50%" }}/>
        <g style={{ transformOrigin: "34.5px 30px", animation: "sacAntL 2.8s ease-in-out infinite" }}>
          <line x1="34.5" y1="30" x2="31" y2="25" stroke="#c8f0c0" strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="31" cy="24.5" fill="#d4ffb0">
            <animate attributeName="r" values="1;1.8;1" dur="2.4s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite"/>
          </circle>
        </g>
        <g style={{ transformOrigin: "37.5px 30px", animation: "sacAntR 2.8s ease-in-out infinite", animationDelay: "0.4s" }}>
          <line x1="37.5" y1="30" x2="41" y2="25" stroke="#c8f0c0" strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="41" cy="24.5" fill="#d4ffb0">
            <animate attributeName="r" values="1;1.8;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" begin="0.5s" repeatCount="indefinite"/>
          </circle>
        </g>
        <circle cx="36" cy="41" fill="#d4ffb0">
          <animate attributeName="r" values="2.5;4;2.5" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  </>
);

/* ─── ChatBubble ──────────────────────────────────────────────────────────── */
function ChatBubble({ role, content, isStreaming }) {
  const isSage = role === "assistant";
  // Strip machine tokens from display
  const clean = content
    .replace(/\[SYSTEM_DONE:[^\]]+\]/g, "")
    .replace(/\[PHASE_COMPLETE:[^\]]+\]/g, "")
    .replace(/\[ASSESSMENT_COMPLETE\]/g, "")
    .trim();

  return (
    <div style={{
      display: "flex", gap: "0.5rem", maxWidth: "88%",
      alignSelf: isSage ? "flex-start" : "flex-end",
      flexDirection: isSage ? "row" : "row-reverse",
      alignItems: "flex-end",
    }}>
      {isSage && <FireflyAvatar size={28}/>}
      <div style={{
        borderRadius: isSage ? "1rem 1rem 1rem 0.25rem" : "1rem 1rem 0.25rem 1rem",
        padding: "0.65rem 0.9rem",
        background: isSage ? "#fff" : SAGE_DARK,
        color: isSage ? INK : "#fff",
        fontSize: "0.9rem", lineHeight: 1.65,
        boxShadow: isSage ? "0 1px 4px rgba(0,0,0,0.07)" : "none",
      }}>
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
          {clean}
          {isStreaming && (
            <span style={{ display: "inline-block", marginLeft: 2, opacity: 0.7,
              animation: "sacDotPulse 1s infinite" }}>▋</span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ─── Progress bar ────────────────────────────────────────────────────────── */
function ProgressHeader({ phase, systemsDiscussed, onSwitchToForm }) {
  const pct = calcProgress(phase, systemsDiscussed);
  const phaseIdx = PHASES.findIndex(p => p.id === phase);
  const phaseLabel = PHASES[phaseIdx]?.label || "Getting started";

  const systemLabel = phase === "symptoms" && systemsDiscussed < 9
    ? ` · ${BODY_SYSTEMS[systemsDiscussed] || "finishing up"}`
    : "";

  return (
    <div style={{ padding: "0.875rem 1.25rem", borderBottom: `1px solid rgba(0,0,0,0.06)`, background: "#fafaf8" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <FireflyAvatar size={30}/>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.92rem", color: INK, lineHeight: 1.2 }}>Sage</div>
            <div style={{ fontSize: "0.72rem", color: SAGE }}>Care Compass assessment guide</div>
          </div>
        </div>
        <button
          onClick={onSwitchToForm}
          style={{
            display: "flex", alignItems: "center", gap: "0.3rem",
            background: SAGE_LIGHT, color: SAGE_DARK,
            border: `1px solid ${SAGE}`, borderRadius: "100px",
            padding: "0.3rem 0.75rem", fontSize: "0.72rem",
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          ≡ Fill it out myself instead
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <div style={{ flex: 1, height: 5, background: "#e8e4e0", borderRadius: 100, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 100, background: SAGE_DARK,
            width: `${pct}%`, transition: "width 0.6s ease",
          }}/>
        </div>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: WARM_GRAY, whiteSpace: "nowrap", minWidth: 32 }}>
          {pct}%
        </span>
      </div>
      <p style={{ fontSize: "0.68rem", color: WARM_GRAY, margin: "0.2rem 0 0", fontStyle: "italic" }}>
        {phaseLabel}{systemLabel}
      </p>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function SageAssessmentChat({ onComplete, onSwitchToForm }) {
  const account = React.useMemo(() => readAccountData(), []);
  const apiKey  = import.meta.env.VITE_ANTHROPIC_API_KEY;

  const [messages,        setMessages]        = useState([]);
  const [input,           setInput]           = useState("");
  const [isLoading,       setIsLoading]       = useState(false);
  const [streamingText,   setStreamingText]   = useState("");
  const [phase,           setPhase]           = useState("intro");
  const [systemsDiscussed, setSystemsDiscussed] = useState(0);
  const [isExtracting,    setIsExtracting]    = useState(false);
  const [isComplete,      setIsComplete]      = useState(false);
  const [error,           setError]           = useState("");
  const [resumePrompt,    setResumePrompt]    = useState(false); // show "welcome back" UI

  const chatEndRef  = useRef(null);
  const inputRef    = useRef(null);
  const messagesRef = useRef([]);
  const phaseRef    = useRef("intro");
  const sysDoneRef  = useRef(0);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { sysDoneRef.current = systemsDiscussed; }, [systemsDiscussed]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Focus input after Sage speaks
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading]);

  // On mount — check for saved session
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(CHAT_SAVE_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (s.messages?.length > 1) {
          // Has meaningful progress — show welcome back prompt
          setResumePrompt(true);
          return;
        }
      }
    } catch {}
    // No saved session — start fresh
    startConversation();
  }, []);

  /* ── Save session to sessionStorage ── */
  function saveSession(msgs, ph, sysDone) {
    try {
      sessionStorage.setItem(CHAT_SAVE_KEY, JSON.stringify({
        messages: msgs,
        phase: ph,
        systemsDiscussed: sysDone,
        savedAt: new Date().toISOString(),
      }));
    } catch {}
  }

  function clearSession() {
    try { sessionStorage.removeItem(CHAT_SAVE_KEY); } catch {}
  }

  /* ── Resume saved session ── */
  function resumeSession() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(CHAT_SAVE_KEY) || "null");
      if (!saved) return;
      setMessages(saved.messages || []);
      setPhase(saved.phase || "intro");
      setSystemsDiscussed(saved.systemsDiscussed || 0);
      phaseRef.current = saved.phase || "intro";
      sysDoneRef.current = saved.systemsDiscussed || 0;
      setResumePrompt(false);
      // Sage sends a welcome-back message
      const resumeMsg = { role: "assistant", content: `Welcome back${account.name ? ", " + account.name : ""}! Let's pick up where we left off.` };
      const updated = [...(saved.messages || []), resumeMsg];
      setMessages(updated);
    } catch {}
  }

  /* ── Start fresh ── */
  function startFresh() {
    clearSession();
    setResumePrompt(false);
    setMessages([]);
    setPhase("intro");
    setSystemsDiscussed(0);
    phaseRef.current = "intro";
    sysDoneRef.current = 0;
    startConversation();
  }

  /* ── Parse tokens from Sage's response ── */
  function parseTokens(text) {
    let newPhase = phaseRef.current;
    let newSysDone = sysDoneRef.current;

    // Check for SYSTEM_DONE tokens
    const sysMatches = [...text.matchAll(/\[SYSTEM_DONE:([^\]]+)\]/g)];
    if (sysMatches.length > 0) {
      newSysDone = Math.min(sysDoneRef.current + sysMatches.length, 9);
    }

    // Check for PHASE_COMPLETE tokens
    const phaseMatch = text.match(/\[PHASE_COMPLETE:(\w+)\]/);
    if (phaseMatch) {
      const completedPhase = phaseMatch[1];
      const phaseOrder = ["intro", "symptoms", "history", "lifestyle"];
      const nextIdx = phaseOrder.indexOf(completedPhase) + 1;
      if (nextIdx < phaseOrder.length) {
        newPhase = phaseOrder[nextIdx];
      }
    }

    return { newPhase, newSysDone };
  }

  /* ── First turn — Sage speaks first ── */
  async function startConversation() {
    setIsLoading(true);
    setStreamingText("");
    setError("");

    const seed = { role: "user", content: "[START_ASSESSMENT]" };

    try {
      const response = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: buildSystemPrompt("intro", 0, account),
          stream: true,
          messages: [{ role: seed.role, content: seed.content }],
        }),
      });

      if (!response.ok) throw new Error("API error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              fullText += parsed.delta.text;
              setStreamingText(fullText);
            }
          } catch {}
        }
      }

      const firstMsg = { role: "assistant", content: fullText };
      setMessages([firstMsg]);
      setStreamingText("");
      saveSession([firstMsg], "intro", 0);
    } catch {
      setError("Couldn't connect to Sage. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  /* ── User sends a message ── */
  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading || isComplete) return;

    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");

    await callSage(updated);
  }

  /* ── Call Sage API (turns 2+) ── */
  async function callSage(conversationMessages) {
    setIsLoading(true);
    setStreamingText("");
    setError("");

    const currentPhase = phaseRef.current;
    const currentSysDone = sysDoneRef.current;

    // Seed stays out of rendered messages
    const seed = { role: "user", content: "[START_ASSESSMENT]" };
    const apiMessages = [seed, ...conversationMessages].map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: buildSystemPrompt(currentPhase, currentSysDone, account),
          stream: true,
          messages: apiMessages,
        }),
      });

      if (!response.ok) throw new Error("API error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              fullText += parsed.delta.text;
              setStreamingText(fullText);
            }
          } catch {}
        }
      }

      const assistantMsg = { role: "assistant", content: fullText };
      const fullHistory = [...conversationMessages, assistantMsg];

      // Parse phase/system tokens
      const { newPhase, newSysDone } = parseTokens(fullText);
      setPhase(newPhase);
      setSystemsDiscussed(newSysDone);
      phaseRef.current = newPhase;
      sysDoneRef.current = newSysDone;

      setMessages(fullHistory);
      setStreamingText("");

      // Save progress every turn
      saveSession(fullHistory, newPhase, newSysDone);

      // Check for assessment complete
      if (fullText.includes("[ASSESSMENT_COMPLETE]")) {
        setIsComplete(true);
        await extractData(fullHistory);
      }
    } catch {
      setError("Something went wrong — tap Retry to try again.");
    } finally {
      setIsLoading(false);
    }
  }

  /* ── Extract structured data from transcript ── */
  async function extractData(msgs) {
    setIsExtracting(true);
    setError("");

    const transcript = msgs
      .filter(m => m.role !== "system")
      .map(m => `${m.role === "assistant" ? "Sage" : "User"}: ${m.content}`)
      .join("\n");

    try {
      const response = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{ role: "user", content: buildExtractionPrompt(transcript, account) }],
        }),
      });

      const data = await response.json();
      const raw  = data.content?.[0]?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const extracted = JSON.parse(clean);

      clearSession();
      onComplete(extracted);
    } catch {
      setError("Couldn't process your responses. Please try again or switch to the manual form.");
      setIsComplete(false);
    } finally {
      setIsExtracting(false);
    }
  }

  /* ── Build partial data for form pre-fill on switch ── */
  function buildPartialData() {
    // Run a quick synchronous extraction from what we have so far
    // This is best-effort — we just pass what we've gathered from account + phase tracking
    return {
      name:      account.name,
      ageRange:  account.ageRange,
      diagnoses: account.conditions.join(", "),
      medications: account.medications.join(", "),
      // The form will show these pre-filled; user can edit
    };
  }

  /* ── Key handler ── */
  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /* ── Welcome back UI ── */
  if (resumePrompt) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", padding: "3rem 1.5rem", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
        <FireflyAvatar size={56}/>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: "0 0 0.5rem", lineHeight: 1.2 }}>
            Welcome back{account.name ? `, ${account.name}` : ""}
          </h2>
          <p style={{ fontSize: "0.92rem", color: WARM_GRAY, lineHeight: 1.7, margin: 0 }}>
            It looks like you started your assessment earlier. Would you like to pick up where you left off?
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
          <button
            onClick={resumeSession}
            style={{ background: SAGE_DARK, color: "#fff", border: "none", borderRadius: "100px", padding: "0.95rem", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            Continue where I left off →
          </button>
          <button
            onClick={startFresh}
            style={{ background: "transparent", color: WARM_GRAY, border: "none", borderRadius: "100px", padding: "0.65rem", fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.2)" }}
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  /* ── Extracting overlay ── */
  if (isExtracting) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", padding: "3rem 1.5rem", textAlign: "center" }}>
        <FireflyAvatar size={52}/>
        <div>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: INK, margin: "0 0 0.4rem" }}>
            Pulling everything together…
          </p>
          <p style={{ fontSize: "0.875rem", color: WARM_GRAY, margin: 0, lineHeight: 1.6 }}>
            Organising what you shared before running your analysis. This takes just a moment.
          </p>
        </div>
        <div style={{ width: "100%", maxWidth: 300, height: 5, background: SAGE_LIGHT, borderRadius: 100, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 100, background: SAGE_DARK, animation: "sacExtract 2.5s ease-in-out infinite alternate" }}/>
        </div>
        <style>{`@keyframes sacExtract { from{width:20%} to{width:90%} }`}</style>
      </div>
    );
  }

  /* ── Main chat UI ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>

      {/* Header with progress */}
      <ProgressHeader
        phase={phase}
        systemsDiscussed={systemsDiscussed}
        onSwitchToForm={() => onSwitchToForm(buildPartialData())}
      />

      {/* Message area */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "1.25rem 1rem 1rem",
        display: "flex", flexDirection: "column", gap: "0.875rem",
        WebkitOverflowScrolling: "touch",
      }}>
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} isStreaming={false}/>
        ))}

        {/* Streaming bubble */}
        {isLoading && streamingText && (
          <ChatBubble role="assistant" content={streamingText} isStreaming={true}/>
        )}

        {/* Thinking dots */}
        {isLoading && !streamingText && (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", alignSelf: "flex-start" }}>
            <FireflyAvatar size={28}/>
            <div style={{ background: "#fff", borderRadius: "1rem", borderBottomLeftRadius: "0.25rem", padding: "0.75rem 1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", gap: "0.3rem", alignItems: "center" }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: SAGE, display: "inline-block", animation: `sacDotPulse 1.2s ease-in-out ${delay}s infinite` }}/>
              ))}
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", background: "#fdeaea", borderRadius: "0.875rem", padding: "0.75rem 1rem" }}>
            <p style={{ fontSize: "0.82rem", color: "#c0392b", margin: 0 }}>{error}</p>
            <button
              onClick={() => { setError(""); callSage(messagesRef.current); }}
              style={{ background: "none", border: "1px solid #c0392b", borderRadius: "100px", padding: "0.3rem 0.75rem", fontSize: "0.75rem", color: "#c0392b", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              Retry
            </button>
          </div>
        )}

        <div ref={chatEndRef}/>
      </div>

      {/* Input area */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", padding: "0.75rem 1rem", background: "#fff", borderTop: "1px solid rgba(0,0,0,0.07)", flexShrink: 0 }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={isComplete ? "Assessment complete…" : "Type your response…"}
          disabled={isLoading || isComplete}
          rows={1}
          style={{
            flex: 1, border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "1.25rem",
            padding: "0.625rem 0.875rem", fontSize: "1rem", color: INK,
            background: OFF_WHITE, fontFamily: "inherit", resize: "none",
            outline: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim() || isComplete}
          style={{
            width: 38, height: 38, borderRadius: "50%", border: "none",
            background: (isLoading || !input.trim() || isComplete) ? "#d4d0cb" : SAGE_DARK,
            color: "#fff", cursor: (isLoading || !input.trim() || isComplete) ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "background 0.15s",
          }}
          aria-label="Send"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
