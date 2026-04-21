import React, { useState, useEffect, useRef } from "react";

/**
 * SageAskWidget — context-aware "Ask Sage" chat
 *
 * Props:
 *   mode        — "dashboard" | "tracker"
 *                 dashboard: rendered as a card, no tracker data injected
 *                 tracker:   rendered as a full tab panel, full patient context injected
 *   compact     — bool, if true renders as a smaller card (for dashboard sidebar)
 */

/* ── Brand tokens (match CareCompassTracker) ─────────────────────────── */
const SAGE      = "#7a9e87";
const SAGE_LIGHT = "#e8f0eb";
const SAGE_DARK  = "#4a7058";
const TEAL       = "#4a9fa5";
const WARM_GRAY  = "#6b6560";
const OFF_WHITE  = "#fafaf8";
const INK        = "#2d2926";
const INK_LIGHT  = "#4a4540";

/* ── Storage keys (must match tracker) ──────────────────────────────── */
const STORAGE_KEY    = "care-compass-tracker-v1";
const BP_STORAGE_KEY = "care-compass-bp-v1";
const MED_KEY        = "care-compass-medications-v1";
const CYCLE_KEY      = "care-compass-cycle-v1";
const LABS_KEY       = "care-compass-labs-v1";
const GOALS_KEY      = "care-compass-goals-v1";

/* ── Botanical mark (mini) ───────────────────────────────────────────── */
const SageMark = ({ size = 32 }) => (
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

/* ── Suggested starter questions ─────────────────────────────────────── */
const SUGGESTIONS = [
  "Should I be feeling effects from my new medication by now?",
  "Are there any patterns in my recent entries worth noting?",
  "How long does it usually take for [medication] to work?",
  "What might be causing my symptoms to be worse in the mornings?",
  "Is my blood pressure trend something I should mention to my doctor?",
  "What questions should I ask my cardiologist about my BP readings?",
];

/* ── Context builder — pulls relevant patient data from localStorage ── */
function buildAskContext() {
  const sections = [];

  try {
    const profile = JSON.parse(localStorage.getItem("cc-profile") || "{}");
    const conditions = (profile.conditions || []).join(", ");
    if (conditions) sections.push(`Diagnoses / conditions: ${conditions}`);
  } catch {}

  try {
    const meds = JSON.parse(localStorage.getItem(MED_KEY) || "[]");
    const medLines = meds.filter(m => m.name).map(m =>
      `${m.name}${m.dose ? " " + m.dose : ""}${m.frequency ? " (" + m.frequency + ")" : ""}${m.startDate ? ", started " + m.startDate : ""}`
    );
    if (medLines.length) sections.push(`Current medications:\n${medLines.map(l => "  - " + l).join("\n")}`);
  } catch {}

  try {
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const recent = [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 14);
    if (recent.length) {
      const lines = recent.map(e =>
        `${new Date(e.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric"})}: Severity ${e.severity}/10${e.symptoms ? " — " + e.symptoms : ""}${e.medications ? " | Meds: " + e.medications : ""}${e.food ? " | Food: " + e.food : ""}${e.notes ? " | " + e.notes : ""}`
      );
      sections.push(`Recent symptom entries (last ${recent.length}):\n${lines.map(l => "  " + l).join("\n")}`);
    }
  } catch {}

  try {
    const bp = JSON.parse(localStorage.getItem(BP_STORAGE_KEY) || "[]");
    const recent = [...bp].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    if (recent.length) {
      const lines = recent.map(r =>
        `${new Date(r.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric"})}: ${r.systolic}/${r.diastolic} mmHg${r.pulse ? " | Pulse: " + r.pulse : ""}${r.notes ? " | " + r.notes : ""}`
      );
      sections.push(`Blood pressure readings (recent):\n${lines.map(l => "  " + l).join("\n")}`);
    }
  } catch {}

  try {
    const labs = JSON.parse(localStorage.getItem(LABS_KEY) || "[]");
    const withSummary = labs.filter(l => l.name && l.aiSummary).slice(0, 4);
    if (withSummary.length) {
      const lines = withSummary.map(l =>
        `${l.name}${l.date ? " (" + l.date + ")" : ""}: ${l.aiSummary.slice(0, 200)}${l.aiSummary.length > 200 ? "…" : ""}`
      );
      sections.push(`Lab results (summaries):\n${lines.map(l => "  - " + l).join("\n")}`);
    }
  } catch {}

  try {
    const family = JSON.parse(localStorage.getItem("cc-family-history") || "[]");
    const lines = family.filter(e => e.member && e.conditions?.length).map(e =>
      `${e.member}: ${e.conditions.join(", ")}`
    );
    if (lines.length) sections.push(`Family history:\n${lines.map(l => "  - " + l).join("\n")}`);
  } catch {}

  return sections.join("\n\n");
}

/* ── System prompt factory ────────────────────────────────────────────── */
function buildSystemPrompt(patientContext) {
  const hasContext = patientContext.trim().length > 0;

  return `You are Sage, a warm and knowledgeable Care Compass health navigation guide — like a well-informed friend who happens to know a lot about chronic illness, medications, and how to navigate the healthcare system.

The user can ask you anything health-related: questions about their medications, what to expect from a new treatment, how to interpret their symptoms, what to bring up with their doctor, and more.
${hasContext ? `
PATIENT CONTEXT (use this ONLY when clearly relevant to the question — don't force it in):
---
${patientContext}
---
` : ""}
Your approach:
- Be warm, conversational, and genuinely helpful — like a knowledgeable friend, not a textbook
- When patient data is relevant, reference it naturally and specifically (e.g. "Given that you started Qulipta recently, it's worth knowing that...")
- For medication questions, share what's generally known about onset, typical effects, and what to watch for
- Never diagnose or prescribe. Use language like "worth discussing with your doctor", "typically people find...", "you might ask about..."
- Keep responses 2-5 sentences unless the question genuinely needs more depth
- Write in natural prose — no bullet points, no markdown headers
- If something in their data seems worth flagging, mention it gently and suggest they bring it up with their care team
- If the question has nothing to do with health, gently redirect`;
}

/* ── Send icon ───────────────────────────────────────────────────────── */
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

/* ── Main component ───────────────────────────────────────────────────── */
export default function SageAskWidget({ mode = "tracker", compact = false }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [focused, setFocused]     = useState(false);
  const endRef                    = useRef(null);
  const inputRef                  = useRef(null);

  // For dashboard card — collapsed/expanded state
  const [expanded, setExpanded]   = useState(mode === "tracker");

  useEffect(() => {
    if (endRef.current && messages.length > 0) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const send = async (text) => {
    const t = (text || input).trim();
    if (!t || loading) return;
    if (!expanded) setExpanded(true);

    const patientContext = buildAskContext();
    const systemPrompt   = buildSystemPrompt(patientContext);
    const next           = [...messages, { role: "user", content: t }];

    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          system: systemPrompt,
          messages: next,
        }),
      });
      const data  = await res.json();
      const reply = data.content?.[0]?.text || "I'm having a little trouble connecting right now. Please try again in a moment.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleSuggestion = (q) => {
    setInput(q);
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  /* ── Dashboard mode — card with collapsible chat ── */
  if (mode === "dashboard") {
    return (
      <div style={ds.card}>
        {/* Card header */}
        <div style={ds.header}>
          <div style={ds.headerLeft}>
            <SageMark size={36}/>
            <div>
              <p style={ds.eyebrow}>Ask Sage</p>
              <h2 style={ds.title}>Questions? Just ask.</h2>
            </div>
          </div>
        </div>

        {/* Suggestions — shown before first message */}
        {messages.length === 0 && !expanded && (
          <div style={ds.suggestions}>
            <p style={ds.suggestionsLabel}>Try asking…</p>
            <div style={ds.suggestionsGrid}>
              {SUGGESTIONS.slice(0, compact ? 3 : 4).map((q, i) => (
                <button key={i} onClick={() => handleSuggestion(q)} style={ds.suggestionChip}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message thread */}
        {(expanded || messages.length > 0) && (
          <div style={ds.thread}>
            {messages.map((m, i) => (
              <div key={i} style={m.role === "user" ? ds.userMsg : ds.assistantMsg}>
                {m.role === "assistant" && (
                  <div style={ds.assistantAvatar}><SageMark size={22}/></div>
                )}
                <p style={m.role === "user" ? ds.userText : ds.assistantText}>{m.content}</p>
              </div>
            ))}
            {loading && (
              <div style={ds.assistantMsg}>
                <div style={ds.assistantAvatar}><SageMark size={22}/></div>
                <div style={ds.typingDots}>
                  <span style={{ ...ds.dot, animationDelay: "0ms" }}/>
                  <span style={{ ...ds.dot, animationDelay: "160ms" }}/>
                  <span style={{ ...ds.dot, animationDelay: "320ms" }}/>
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>
        )}

        {/* Input */}
        <div style={{ ...ds.inputRow, boxShadow: focused ? `0 0 0 2px ${SAGE}44` : "none" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask about your medications, symptoms, next steps…"
            disabled={loading}
            style={ds.input}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{ ...ds.sendBtn, background: (loading || !input.trim()) ? "#ddd" : SAGE_DARK }}>
            <SendIcon/>
          </button>
        </div>

        <p style={ds.disclaimer}>Sage is not a doctor. Always confirm with your care team.</p>
      </div>
    );
  }

  /* ── Tracker tab mode — full panel ── */
  return (
    <div style={ts.wrap}>
      <style>{TYPING_KEYFRAMES}</style>

      {/* Header */}
      <div style={ts.header}>
        <div style={ts.headerLeft}>
          <SageMark size={40}/>
          <div>
            <p style={ts.eyebrow}>Ask Sage</p>
            <h2 style={ts.title}>Your health questions, answered</h2>
            <p style={ts.subtitle}>Ask about medications, symptoms, patterns, or what to bring up with your doctor. Sage knows your data and can give you context — like a knowledgeable friend.</p>
          </div>
        </div>
      </div>

      {/* Suggestions — shown until first message */}
      {messages.length === 0 && (
        <div style={ts.suggestionsWrap}>
          <p style={ts.suggestionsLabel}>Some things you can ask…</p>
          <div style={ts.suggestionsGrid}>
            {SUGGESTIONS.map((q, i) => (
              <button key={i} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }} style={ts.chip}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Thread */}
      {messages.length > 0 && (
        <div style={ts.thread}>
          {messages.map((m, i) => (
            <div key={i} style={m.role === "user" ? ts.userBubbleRow : ts.assistantBubbleRow}>
              {m.role === "assistant" && <div style={ts.avatar}><SageMark size={28}/></div>}
              <div style={m.role === "user" ? ts.userBubble : ts.assistantBubble}>
                <p style={ts.bubbleText}>{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div style={ts.assistantBubbleRow}>
              <div style={ts.avatar}><SageMark size={28}/></div>
              <div style={ts.assistantBubble}>
                <div style={ts.typingDots}>
                  <span style={{ ...ts.dot, animationDelay: "0ms" }}/>
                  <span style={{ ...ts.dot, animationDelay: "160ms" }}/>
                  <span style={{ ...ts.dot, animationDelay: "320ms" }}/>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>
      )}

      {/* Input area */}
      <div style={ts.inputArea}>
        {messages.length > 0 && (
          <div style={ts.suggestionsRow}>
            {SUGGESTIONS.slice(0, 3).map((q, i) => (
              <button key={i} onClick={() => handleSuggestion(q)} style={ts.inlineChip}>{q}</button>
            ))}
          </div>
        )}
        <div style={{ ...ts.inputRow, boxShadow: focused ? `0 0 0 2.5px ${SAGE}55` : "0 0 0 1.5px rgba(0,0,0,0.1)" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask anything — medications, symptoms, what to bring to your next appointment…"
            disabled={loading}
            rows={2}
            style={ts.textarea}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{ ...ts.sendBtn, background: (loading || !input.trim()) ? "#ccc" : SAGE_DARK }}>
            <SendIcon/>
          </button>
        </div>
        <p style={ts.disclaimer}>Sage is not a doctor. Always confirm important questions with your care team.</p>
      </div>
    </div>
  );
}

/* ── Typing animation ─────────────────────────────────────────────────── */
const TYPING_KEYFRAMES = `
@keyframes sageDotBounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40%           { transform: translateY(-5px); opacity: 1; }
}`;

/* ── Dashboard styles ─────────────────────────────────────────────────── */
const ds = {
  card: { background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem", boxShadow: "0 2px 20px rgba(0,0,0,0.04)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { display: "flex", alignItems: "center", gap: "0.875rem" },
  eyebrow: { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.2rem" },
  title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: INK, margin: 0 },
  suggestions: { display: "flex", flexDirection: "column", gap: "0.6rem" },
  suggestionsLabel: { fontSize: "0.72rem", fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 },
  suggestionsGrid: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  suggestionChip: { background: SAGE_LIGHT, color: SAGE_DARK, border: "none", borderRadius: "0.625rem", padding: "0.6rem 0.875rem", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", textAlign: "left", lineHeight: 1.45, transition: "background 0.15s" },
  thread: { display: "flex", flexDirection: "column", gap: "0.875rem", maxHeight: 320, overflowY: "auto", padding: "0.25rem 0" },
  userMsg: { display: "flex", justifyContent: "flex-end" },
  assistantMsg: { display: "flex", alignItems: "flex-start", gap: "0.6rem" },
  assistantAvatar: { flexShrink: 0, marginTop: "0.1rem" },
  userText: { background: SAGE_DARK, color: "#fff", borderRadius: "1rem 1rem 0.2rem 1rem", padding: "0.65rem 0.875rem", fontSize: "0.875rem", lineHeight: 1.6, margin: 0, maxWidth: "80%" },
  assistantText: { background: SAGE_LIGHT, color: INK, borderRadius: "0.2rem 1rem 1rem 1rem", padding: "0.65rem 0.875rem", fontSize: "0.875rem", lineHeight: 1.6, margin: 0, maxWidth: "80%" },
  typingDots: { background: SAGE_LIGHT, borderRadius: "0.2rem 1rem 1rem 1rem", padding: "0.65rem 0.875rem", display: "flex", gap: "0.3rem", alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: "50%", background: SAGE_DARK, display: "inline-block", animation: "sageDotBounce 1.2s ease-in-out infinite" },
  inputRow: { display: "flex", gap: "0.5rem", alignItems: "center", background: OFF_WHITE, borderRadius: "0.875rem", padding: "0.4rem 0.4rem 0.4rem 0.875rem", transition: "box-shadow 0.15s" },
  input: { flex: 1, border: "none", background: "transparent", fontSize: "0.875rem", color: INK, outline: "none", fontFamily: "inherit", padding: "0.35rem 0" },
  sendBtn: { width: 36, height: 36, borderRadius: "0.625rem", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" },
  disclaimer: { fontSize: "0.72rem", color: "#bbb", margin: 0, textAlign: "center", fontStyle: "italic" },
};

/* ── Tracker tab styles ───────────────────────────────────────────────── */
const ts = {
  wrap: { display: "flex", flexDirection: "column", gap: "1.5rem", padding: "0.5rem 0 6rem" },
  header: { display: "flex", alignItems: "flex-start", gap: "1rem", padding: "0.5rem 0" },
  headerLeft: { display: "flex", alignItems: "flex-start", gap: "1rem", flex: 1 },
  eyebrow: { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.2rem" },
  title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.3rem, 3vw, 1.6rem)", fontWeight: 700, color: INK, margin: "0 0 0.4rem", letterSpacing: "-0.01em" },
  subtitle: { fontSize: "0.875rem", color: WARM_GRAY, lineHeight: 1.7, margin: 0, maxWidth: 520 },
  suggestionsWrap: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  suggestionsLabel: { fontSize: "0.75rem", fontWeight: 700, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 },
  suggestionsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.5rem" },
  chip: { background: "#fff", border: `1.5px solid ${SAGE_LIGHT}`, borderRadius: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.85rem", color: INK_LIGHT, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", textAlign: "left", lineHeight: 1.5, transition: "border-color 0.15s, background 0.15s" },
  thread: { display: "flex", flexDirection: "column", gap: "1rem", background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.25rem", minHeight: 120, maxHeight: 460, overflowY: "auto" },
  userBubbleRow: { display: "flex", justifyContent: "flex-end" },
  assistantBubbleRow: { display: "flex", alignItems: "flex-start", gap: "0.75rem" },
  avatar: { flexShrink: 0, marginTop: "0.1rem" },
  userBubble: { background: SAGE_DARK, borderRadius: "1.1rem 1.1rem 0.2rem 1.1rem", padding: "0.75rem 1rem", maxWidth: "75%" },
  assistantBubble: { background: SAGE_LIGHT, borderRadius: "0.2rem 1.1rem 1.1rem 1.1rem", padding: "0.75rem 1rem", maxWidth: "75%" },
  bubbleText: { fontSize: "0.9rem", lineHeight: 1.7, margin: 0, color: "inherit" },
  typingDots: { display: "flex", gap: "0.3rem", alignItems: "center", padding: "0.15rem 0" },
  dot: { width: 7, height: 7, borderRadius: "50%", background: SAGE_DARK, display: "inline-block", animation: "sageDotBounce 1.2s ease-in-out infinite" },
  inputArea: { display: "flex", flexDirection: "column", gap: "0.625rem", position: "sticky", bottom: 0, background: OFF_WHITE, paddingTop: "0.75rem", paddingBottom: "1rem" },
  suggestionsRow: { display: "flex", gap: "0.4rem", flexWrap: "wrap" },
  inlineChip: { background: "#fff", border: `1px solid rgba(0,0,0,0.1)`, borderRadius: "100px", padding: "0.3rem 0.75rem", fontSize: "0.75rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  inputRow: { display: "flex", gap: "0.5rem", alignItems: "flex-end", background: "#fff", borderRadius: "1rem", padding: "0.5rem 0.5rem 0.5rem 1rem", transition: "box-shadow 0.15s" },
  textarea: { flex: 1, border: "none", background: "transparent", fontSize: "0.9rem", color: INK, outline: "none", fontFamily: "inherit", resize: "none", lineHeight: 1.6, padding: "0.25rem 0" },
  sendBtn: { width: 40, height: 40, borderRadius: "0.75rem", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" },
  disclaimer: { fontSize: "0.72rem", color: "#bbb", margin: 0, textAlign: "center", fontStyle: "italic" },
};
