import React, { useState, useEffect, useRef } from "react";
import { Icon, MorningSunIcon, EveningMoonIcon } from "./SageIcons";

/* ─── Color constants ─────────────────────────────────────────────────────── */
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

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function getModeContext() {
  // Read user-configured checkin times (same key as CareCompassTracker)
  let morningStartMins = 4 * 60;  // 04:00 default
  let eveningStartMins = 18 * 60; // 18:00 default
  try {
    const prefs = JSON.parse(localStorage.getItem("cc-checkin-prefs") || "{}");
    const parse = (t) => { const [h, m] = (t || "00:00").split(":").map(Number); return h * 60 + m; };
    if (prefs.morningTime) morningStartMins = parse(prefs.morningTime);
    if (prefs.eveningTime) eveningStartMins = parse(prefs.eveningTime);
  } catch {}
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  // Morning window: morningStart → morningStart+4hrs (give a 4hr window)
  const morningEndMins = morningStartMins + 4 * 60;
  if (nowMins >= morningStartMins && nowMins < morningEndMins) return "morning";
  if (nowMins >= eveningStartMins) return "evening";
  return "intraday";
}

function getModeLabel(mode) {
  if (mode === "morning") return "Morning check-in";
  if (mode === "evening") return "Evening check-in";
  return "Symptom log";
}

function getModeColor(mode) {
  if (mode === "morning") return "#e8a838";
  if (mode === "evening") return "#7c5cbf";
  return SAGE_DARK;
}

function getModeIcon(mode) {
  if (mode === "morning") return <MorningSunIcon size={16} />;
  if (mode === "evening") return <EveningMoonIcon size={16} />;
  return <Icon name="leaf" size={16} color={SAGE_DARK} />;
}

/* ─── Sage system prompt builder ─────────────────────────────────────────── */
function buildSystemPrompt(mode, previousContext) {
  const isEvening = mode === "evening";
  const isMorning = mode === "morning";
  const isIntraday = mode === "intraday";

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const tzStr = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const modeInstructions = isMorning
    ? `This is a MORNING check-in. Start by asking about sleep quality, then how they're feeling this morning and their energy level. Keep it warm and gentle — mornings can be rough for chronic illness patients.`
    : isEvening
    ? `This is an EVENING check-in. Start by asking how their day went overall (severity), then symptoms, what their symptoms limited them from doing, food/medications if not already logged, stress, hours upright, tasks managed, and energy envelope used. This is a reflective end-of-day conversation.`
    : `This is an INTRADAY symptom log — the user is reporting something happening right now or recently. Start immediately with "what's going on right now?" — be present and responsive. Focus on current symptoms, severity, and what triggered or preceded this.`;

  return `You are Sage, the compassionate health companion inside CareCompass. You help chronic illness patients log their health data through natural conversation — not forms.

CURRENT TIME CONTEXT: It is ${timeStr} on ${dateStr} (${tzStr}). Use this to orient your questions naturally — e.g. "this morning", "earlier today", "just now".

Your role: Ask ONE focused question at a time. Wait for the answer. Ask a natural follow-up if needed to get useful detail, then move to the next topic. Keep the conversation feeling like talking to a caring, knowledgeable friend — never clinical or robotic.

${modeInstructions}

TOPICS TO COVER (in natural conversational order — don't rigidly follow this, let the conversation flow):
${isMorning ? `- Sleep quality last night (1-10)
- How they feel this morning / current symptoms
- Energy level this morning
- Any notes or concerns` : ""}
${isEvening ? `- Overall day severity (1-10)
- Symptoms experienced today
- What symptoms stopped or limited them (functional impact)
- Medications taken
- Food and drink (if relevant)
- Stress level (1-10)
- Hours upright today (< 2h, 2–4h, 4–8h, 8+h)
- Tasks managed (Work/school, Self-care, Chores, Social/errands)
- Energy envelope used (Low, Medium, High)
- Any reflections or notes` : ""}
${isIntraday ? `- Current symptoms and what's happening
- Severity right now (1-10)
- What they were doing before this started / potential trigger
- Medications taken
- Food or drink recently
- Activity level
- Stress level
- Any notes` : ""}

${previousContext ? `CONTEXT: The user has already logged entries today. Here's a brief summary of what they reported: ${previousContext.slice(0, 400)}${previousContext.length > 400 ? "… (truncated)" : ""}. Don't ask them to repeat info they've already given — reference it and build on it.` : ""}

TONE GUIDELINES:
- Warm, unhurried, validating
- Short messages — 1-2 sentences max per turn
- Ask one question, not multiple
- When they share something difficult, briefly acknowledge before moving on (e.g. "That sounds really tough.")
- Never say "I understand" — it's hollow. Show understanding through your follow-up
- Use "today" and "right now" language, not clinical terms
- Don't say "Great!" or "Awesome!" — be genuine, not performatively positive

WHEN TO WRAP UP:
When you've covered the essential topics and the conversation feels complete, you MUST append [CONVERSATION_COMPLETE] at the very end of your closing message. This token is machine-readable and triggers saving — without it, nothing gets saved.

Correct example: "Alright, that's everything I need. Take care of yourself today. [CONVERSATION_COMPLETE]"

CRITICAL RULE: Any message that is a farewell, closing, or wrap-up MUST end with [CONVERSATION_COMPLETE]. Never write a closing message without it.`;
}

/* ─── Extraction prompt ───────────────────────────────────────────────────── */
function buildExtractionPrompt(transcript, mode) {
  const isEvening = mode === "evening";
  const isMorning = mode === "morning";

  return `You are a medical data extraction assistant. Extract structured health data from this conversation transcript and return ONLY valid JSON with no markdown, no explanation, no preamble.

TRANSCRIPT:
${transcript}

Extract into this exact JSON shape (use null for fields not mentioned, empty array [] for empty arrays):
{
  "severity": <number 1-10 or null>,
  "symptoms": "<free text description of symptoms or empty string>",
  "food": "<food and drink mentioned or empty string>",
  "medications": "<medications mentioned or empty string>",
  "activity": "<activity limitations and functional impact or empty string>",
  "sleep": ${isMorning ? "<sleep quality 1-10 or null>" : "null"},
  "stress": <stress level 1-10 or null>,
  "notes": "<any additional notes, reflections, or context worth preserving or empty string>",
  "hoursUpright": ${isEvening ? "<one of: '< 2h', '2–4h', '4–8h', '8+h' or null>" : "null"},
  "tasksCompleted": ${isEvening ? "<array of tasks from: 'Work / school', 'Self-care', 'Chores', 'Social / errands' — only include ones mentioned>" : "[]"},
  "energyEnvelope": ${isEvening ? "<one of: 'Low', 'Medium', 'High' or null>" : "null"},
  "trackedSymptoms": []
}

Rules:
- severity: interpret phrases like "pretty bad", "manageable", "rough" into a 1-10 number using clinical judgment
- symptoms: combine all symptom mentions into a readable summary
- activity: focus on what the person COULDN'T do or what was LIMITED — this is critical for doctor reports
- notes: capture any emotional context, unusual observations, or things they wanted to remember
- Be conservative — only extract what was actually mentioned
- Return ONLY the JSON object, nothing else`;
}

/* ─── Firefly avatar — self-contained for chat use ───────────────────────── */
const FF_KEYFRAMES = `
  @keyframes slffFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-2px)} }
  @keyframes slffWingL { 0%,100%{transform:rotate(0deg) scaleY(1)} 50%{transform:rotate(-18deg) scaleY(0.82)} }
  @keyframes slffWingR { 0%,100%{transform:rotate(0deg) scaleY(1)} 50%{transform:rotate(18deg) scaleY(0.82)} }
  @keyframes slffAntL  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-5deg)} }
  @keyframes slffAntR  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(5deg)} }
`;

const FireflyAvatar = ({ size = 26, bg = SAGE_DARK }) => (
  <>
    <style>{FF_KEYFRAMES}</style>
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
      <svg width={size * 0.85} height={size * 0.85} viewBox="0 0 72 72" fill="none"
        style={{ animation: "slffFloat 3s ease-in-out infinite" }}>
        <ellipse cx="36" cy="36" rx="4" ry="6.5" fill="#e8f5e0"/>
        <ellipse cx="28" cy="34" rx="8" ry="3.5" fill="#a8d4b0" opacity="0.9" style={{ animation:"slffWingL 0.6s ease-in-out infinite", transformOrigin:"50% 50%" }}/>
        <ellipse cx="44" cy="34" rx="8" ry="3.5" fill="#a8d4b0" opacity="0.9" style={{ animation:"slffWingR 0.6s ease-in-out infinite", animationDelay:"0.05s", transformOrigin:"50% 50%" }}/>
        <g style={{ transformOrigin:"34.5px 30px", animation:"slffAntL 2.8s ease-in-out infinite" }}>
          <line x1="34.5" y1="30" x2="31" y2="25" stroke="#c8f0c0" strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="31" cy="24.5" fill="#d4ffb0"><animate attributeName="r" values="1;1.8;1" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite"/></circle>
        </g>
        <g style={{ transformOrigin:"37.5px 30px", animation:"slffAntR 2.8s ease-in-out infinite", animationDelay:"0.4s" }}>
          <line x1="37.5" y1="30" x2="41" y2="25" stroke="#c8f0c0" strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="41" cy="24.5" fill="#d4ffb0"><animate attributeName="r" values="1;1.8;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle>
        </g>
        <circle cx="36" cy="41" fill="#d4ffb0">
          <animate attributeName="r" values="2.5;4;2.5" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  </>
);
function StructuredPreview({ data, mode, onConfirm, onEdit }) {
  const isEvening = mode === "evening";
  const isMorning = mode === "morning";

  const fields = [
    { label: "Overall severity", value: data.severity ? `${data.severity}/10` : null },
    { label: "Symptoms", value: data.symptoms || null },
    { label: "Sleep quality", value: isMorning && data.sleep ? `${data.sleep}/10` : null },
    { label: "Stress level", value: data.stress ? `${data.stress}/10` : null },
    { label: "Activity & limitations", value: data.activity || null },
    { label: "Medications", value: data.medications || null },
    { label: "Food & drink", value: data.food || null },
    { label: "Hours upright", value: isEvening ? (data.hoursUpright || null) : null },
    { label: "Tasks managed", value: isEvening && data.tasksCompleted?.length ? data.tasksCompleted.join(", ") : null },
    { label: "Energy envelope", value: isEvening ? (data.energyEnvelope || null) : null },
    { label: "Notes", value: data.notes || null },
  ].filter(f => f.value !== null);

  return (
    <div style={styles.previewContainer}>
      <div style={styles.previewHeader}>
        <div style={styles.previewIcon}>✓</div>
        <div>
          <p style={styles.previewTitle}>Here's what I captured</p>
          <p style={styles.previewSubtitle}>Review before saving — tap "Edit" to adjust anything</p>
        </div>
      </div>

      <div style={styles.previewFields}>
        {fields.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: WARM_GRAY, fontStyle: "italic", margin: 0 }}>
            Not much was captured — consider adding details manually.
          </p>
        ) : (
          fields.map((f, i) => (
            <div key={i} style={styles.previewField}>
              <span style={styles.previewLabel}>{f.label}</span>
              <span style={styles.previewValue}>{f.value}</span>
            </div>
          ))
        )}
      </div>

      <div style={styles.previewActions}>
        <button onClick={onConfirm} style={styles.confirmBtn}>
          Save this entry →
        </button>
        <button onClick={onEdit} style={styles.editBtn}>
          Edit manually
        </button>
      </div>
    </div>
  );
}

/* ─── ChatBubble ──────────────────────────────────────────────────────────── */
function ChatBubble({ role, content, isStreaming }) {
  const isSage = role === "assistant";
  return (
    <div style={{ ...styles.bubble, ...(isSage ? styles.sageBubble : styles.userBubble) }}>
      {isSage && (
        <FireflyAvatar size={28} />
      )}
      <div style={{ ...styles.bubbleContent, ...(isSage ? styles.sageBubbleContent : styles.userBubbleContent) }}>
        <p style={styles.bubbleText}>
          {content}
          {isStreaming && <span style={styles.cursor}>▋</span>}
        </p>
      </div>
    </div>
  );
}

/* ─── Main SageLogChat component ──────────────────────────────────────────── */
export default function SageLogChat({ mode: modeProp, onSave, onCancel, onSwitchToForm, previousContext }) {
  const mode = modeProp || getModeContext();
  const modeColor = getModeColor(mode);

  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState("");
  const [isLoading, setIsLoading]         = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isComplete, setIsComplete]       = useState(false);
  const [isExtracting, setIsExtracting]   = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError]                 = useState("");

  const chatEndRef   = useRef(null);
  const inputRef     = useRef(null);
  const messagesRef  = useRef([]);

  /* Keep messagesRef current */
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  /* Auto-scroll to bottom */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  /* ── Closing language detection helper ── */
  function looksLikeClosing(text) {
    const lower = text.toLowerCase();
    const phrases = [
      "take care", "feel better", "get some rest", "hope you", "sending you",
      "be gentle with yourself", "rest up", "hope things ease", "wishing you",
      "that's everything", "we've covered", "all noted", "got everything",
      "take it easy", "hope you feel", "hope it eases", "alright, that",
      "i've got everything", "all set", "that covers", "dark and quiet",
      "step away", "i hope the", "i hope you can", "i hope things",
    ];
    return phrases.some(p => lower.includes(p));
  }

  /* Open with Sage's first message */
  useEffect(() => {
    startConversation();
  }, []);

  /* Focus input after Sage speaks */
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading]);

  /* ── Build conversation transcript for extraction ── */
  function buildTranscript(msgs) {
    return msgs
      .filter(m => m.role !== "system")
      .map(m => `${m.role === "assistant" ? "Sage" : "User"}: ${m.content}`)
      .join("\n");
  }

  /* ── Trim conversation history to cap context window cost ── */
  function trimHistory(msgs) {
    // Always keep the first assistant message (Sage's opening) + last 8 turns max
    // This prevents the context window from growing unboundedly across long check-ins
    if (msgs.length <= 10) return msgs;
    const first = msgs.slice(0, 1); // Sage's opening message
    const recent = msgs.slice(-8);  // last 8 messages
    return [...first, ...recent];
  }

  /* ── User sends a message ── */
  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");

    await callSage(updated);
  }

  /* ── Call Anthropic API with streaming (turns 2+) ── */
  async function callSage(conversationMessages) {
    setIsLoading(true);
    setStreamingText("");
    setError("");

    try {
      // API requires user turn first — prepend a silent seed
      // Trim history to cap input tokens (keeps first message + last 8 turns)
      const seed = { role: "user", content: `[START_${(mode || "intraday").toUpperCase()}_CHECKIN]` };
      const trimmed = trimHistory(conversationMessages);
      const apiMessages = [seed, ...trimmed].map(m => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          system: buildSystemPrompt(mode, previousContext),
          stream: true,
          messages: apiMessages,  // trimmed history — max ~10 turns
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

      /* Check for completion signal */
      const isConversationDone = fullText.includes("[CONVERSATION_COMPLETE]");
      const cleanText = fullText.replace("[CONVERSATION_COMPLETE]", "").trim();

      const assistantMsg = { role: "assistant", content: cleanText };
      const fullHistory = [...conversationMessages, assistantMsg];
      setMessages(fullHistory);
      setStreamingText("");

      if (isConversationDone) {
        setIsComplete(true);
        await extractData(fullHistory);
      } else if (fullHistory.length >= 4 && looksLikeClosing(cleanText)) {
        // Fallback: model wrapped up without the signal — detect and extract anyway
        setIsComplete(true);
        await extractData(fullHistory);
      }
    } catch (err) {
      setError("Something went wrong — tap to retry.");
    } finally {
      setIsLoading(false);
    }
  }

  /* ── Start conversation — Sage speaks first ── */
  async function startConversation() {
    const seed = { role: "user", content: `[START_${(mode || "intraday").toUpperCase()}_CHECKIN]` };
    setMessages([]);
    // Pass seed separately; callSage will store only the assistant reply in state
    await callSageWithSeed(seed);
  }

  /* First turn only — seed stays out of rendered messages */
  async function callSageWithSeed(seed) {
    setIsLoading(true);
    setStreamingText("");
    setError("");
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
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          system: buildSystemPrompt(mode, previousContext),
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
      const cleanText = fullText.replace("[CONVERSATION_COMPLETE]", "").trim();
      const firstAssistantMsg = { role: "assistant", content: cleanText };
      setMessages([firstAssistantMsg]);
      setStreamingText("");
    } catch {
      setError("Something went wrong — tap to retry.");
    } finally {
      setIsLoading(false);
    }
  }

  /* ── Extract structured data from transcript ── */
  async function extractData(msgs) {
    setIsExtracting(true);
    setError("");

    try {
      const transcript = buildTranscript(msgs || messagesRef.current);
      const response = await fetch("/api/claude {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          messages: [{ role: "user", content: buildExtractionPrompt(transcript, mode) }],
        }),
      });

      const data = await response.json();

      // Handle API-level errors (rate limit, auth, etc)
      if (data.error) {
        throw new Error(data.error.message || "API error");
      }

      const raw = data.content?.[0]?.text || "";

      if (!raw) {
        throw new Error("Empty response from API");
      }

      // Try to extract JSON even if the model adds surrounding text
      let parsed = null;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        const clean = raw.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean);
      }

      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid JSON structure");
      }

      setExtractedData(parsed);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 150);

    } catch (err) {
      // Show error with the actual reason so we can debug
      const msg = err?.message || "Unknown error";
      setError(`Couldn't organize your data (${msg}). Tap Retry or save manually.`);
    } finally {
      setIsExtracting(false);
    }
  }

  /* ── User confirms extracted data → save ── */
  function handleConfirm() {
    if (!extractedData) return;
    const entry = {
      ...extractedData,
      selectedMedIds: [],
      saveUnlistedMed: false,
      photos: [],
      trackedSymptoms: extractedData.trackedSymptoms || [],
      weather: "",
    };
    onSave(entry, mode);
  }

  /* ── User wants to edit manually → pass extracted data to form ── */
  function handleEditManually() {
    onSwitchToForm(extractedData || {});
  }

  /* ── Handle Enter key ── */
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /* ── "I'm done" button — user signals conversation is complete ── */
  async function handleDone() {
    setIsComplete(true);
    // messages state is current here since no async gap before this point
    await extractData(messages);
  }

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={{ ...styles.header, borderBottom: `2px solid ${modeColor}20` }}>
        <div style={styles.headerLeft}>
          <div style={{ ...styles.modeChip, background: `${modeColor}18`, color: modeColor }}>
            {getModeIcon(mode)}
            <span>{getModeLabel(mode)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", paddingLeft: "0.1rem" }}>
            <FireflyAvatar size={20} bg={SAGE_DARK} />
            <p style={styles.headerSub}>Talking with Sage</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          {!extractedData && !isExtracting && messages.length >= 3 && (
            <button onClick={handleDone} style={styles.doneBtn}>
              I'm done →
            </button>
          )}
          <button onClick={onCancel} style={styles.closeBtn}>
            <Icon name="close" size={16} color={WARM_GRAY} />
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div style={styles.chatArea}>

        {/* Messages */}
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {/* Streaming bubble */}
        {isLoading && streamingText && (
          <ChatBubble role="assistant" content={streamingText} isStreaming />
        )}

        {/* Loading dots when waiting for first word */}
        {isLoading && !streamingText && (
          <div style={styles.thinkingBubble}>
            <FireflyAvatar size={28} />
            <div style={styles.dots}>
              <span style={{ ...styles.dot, animationDelay: "0ms" }} />
              <span style={{ ...styles.dot, animationDelay: "160ms" }} />
              <span style={{ ...styles.dot, animationDelay: "320ms" }} />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Result panels — outside chatArea so always fully visible ── */}

      {/* Extraction loading */}
      {isExtracting && (
        <div style={{ ...styles.extractingBanner, margin: "0 1rem 0.5rem" }}>
          <div style={styles.extractingSpinner} />
          <span style={{ fontSize: "0.82rem", color: SAGE_DARK, fontWeight: 500 }}>
            Sage is organizing what you shared…
          </span>
        </div>
      )}

      {/* Structured data preview */}
      {extractedData && !isExtracting && (
        <div style={{ overflowY: "auto", flexShrink: 0, maxHeight: "60vh", padding: "0 1rem 0.5rem" }}>
          <StructuredPreview
            data={extractedData}
            mode={mode}
            onConfirm={handleConfirm}
            onEdit={handleEditManually}
          />
        </div>
      )}

      {/* Save nudge */}
      {isComplete && !extractedData && !isExtracting && !error && (
        <div style={{ background: SAGE_LIGHT, borderRadius: "0.875rem", padding: "0.875rem 1rem", margin: "0 1rem 0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexShrink: 0 }}>
          <span style={{ fontSize: "0.82rem", color: SAGE_DARK, fontWeight: 500, lineHeight: 1.4 }}>
            Looks like you're done — ready to save?
          </span>
          <button onClick={handleDone} style={{ background: SAGE_DARK, color: "#fff", border: "none", borderRadius: "100px", padding: "0.45rem 1rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            Save →
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ ...styles.errorBanner, flexDirection: "column", alignItems: "flex-start", gap: "0.625rem", margin: "0 1rem 0.5rem", flexShrink: 0 }}>
          <span style={{ fontSize: "0.82rem", color: "#c0392b", lineHeight: 1.5 }}>{error}</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => extractData(messagesRef.current)} style={styles.retryBtn}>Retry</button>
            <button onClick={() => onSwitchToForm({})} style={{ ...styles.retryBtn, borderColor: WARM_GRAY, color: WARM_GRAY }}>Save manually</button>
          </div>
        </div>
      )}

      {/* Input area — hidden once complete or extraction is showing */}
      {!extractedData && !isExtracting && !isComplete && (
        <div style={styles.inputArea}>
          <button onClick={onSwitchToForm} style={styles.switchBtn}>
            <Icon name="forward" size={14} color={WARM_GRAY} />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your reply…"
            rows={1}
            disabled={isLoading}
            style={styles.input}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{ ...styles.sendBtn, background: input.trim() && !isLoading ? modeColor : "#ccc" }}
          >
            <Icon name="forward" size={16} color="#fff" />
          </button>
        </div>
      )}

      {/* Switch to form hint — only while still chatting */}
      {!extractedData && !isExtracting && !isComplete && (
        <p style={styles.switchHint}>
          <button onClick={onSwitchToForm} style={styles.switchHintBtn}>
            Switch to quick form instead
          </button>
        </p>
      )}

      {/* Dot animation styles */}
      <style>{`
        @keyframes sageDotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes sageExtractSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: OFF_WHITE,
    borderRadius: "1.25rem",
    overflow: "auto",
    overflowX: "hidden",
  },

  /* Header */
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.25rem 0.875rem",
    background: "#fff",
    flexShrink: 0,
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: "0.15rem" },
  modeChip: {
    display: "inline-flex", alignItems: "center", gap: "0.35rem",
    borderRadius: "100px", padding: "0.25rem 0.75rem",
    fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.01em",
  },
  headerSub: { fontSize: "0.72rem", color: WARM_GRAY, margin: 0, paddingLeft: "0.1rem" },
  headerActions: { display: "flex", alignItems: "center", gap: "0.5rem" },
  doneBtn: {
    background: SAGE_LIGHT, color: SAGE_DARK, border: "none",
    borderRadius: "100px", padding: "0.4rem 0.875rem",
    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  closeBtn: {
    background: "none", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", padding: "0.25rem",
  },

  /* Chat area */
  chatArea: {
    flex: 1,
    flexShrink: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "1.25rem 1rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.875rem",
    WebkitOverflowScrolling: "touch",
  },

  /* Bubbles */
  bubble: { display: "flex", gap: "0.5rem", maxWidth: "88%" },
  sageBubble: { alignSelf: "flex-start", alignItems: "flex-end" },
  userBubble: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  sageAvatar: {
    width: 26, height: 26, borderRadius: "50%",
    background: SAGE_DARK, display: "flex",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  bubbleContent: {
    borderRadius: "1rem", padding: "0.625rem 0.875rem",
    maxWidth: "100%",
  },
  sageBubbleContent: {
    background: "#fff",
    borderBottomLeftRadius: "0.25rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  },
  userBubbleContent: {
    background: SAGE_DARK,
    borderBottomRightRadius: "0.25rem",
    color: "#fff",
  },
  bubbleText: {
    fontSize: "0.9rem", lineHeight: 1.65, margin: 0,
    color: "inherit", whiteSpace: "pre-wrap",
  },
  cursor: {
    display: "inline-block",
    animation: "sageDotPulse 1s infinite",
    marginLeft: "2px",
    opacity: 0.7,
  },

  /* Thinking dots */
  thinkingBubble: { display: "flex", gap: "0.5rem", alignItems: "flex-end", alignSelf: "flex-start" },
  dots: {
    background: "#fff", borderRadius: "1rem", borderBottomLeftRadius: "0.25rem",
    padding: "0.75rem 1rem", display: "flex", gap: "0.3rem", alignItems: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  },
  dot: {
    width: 7, height: 7, borderRadius: "50%", background: SAGE,
    display: "inline-block",
    animation: "sageDotPulse 1.2s ease-in-out infinite",
  },

  /* Extracting */
  extractingBanner: {
    display: "flex", alignItems: "center", gap: "0.625rem",
    background: SAGE_LIGHT, borderRadius: "0.875rem",
    padding: "0.75rem 1rem", alignSelf: "stretch",
  },
  extractingSpinner: {
    width: 16, height: 16, borderRadius: "50%",
    border: `2px solid ${SAGE}`,
    borderTopColor: SAGE_DARK,
    animation: "sageExtractSpin 0.8s linear infinite",
    flexShrink: 0,
  },

  /* Preview */
  previewContainer: {
    background: "#fff", borderRadius: "1rem",
    border: `1.5px solid ${SAGE_LIGHT}`,
    overflow: "hidden", alignSelf: "stretch",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  previewHeader: {
    display: "flex", alignItems: "center", gap: "0.75rem",
    padding: "0.875rem 1rem",
    background: SAGE_LIGHT,
    borderBottom: `1px solid rgba(74,112,88,0.15)`,
  },
  previewIcon: {
    width: 28, height: 28, borderRadius: "50%",
    background: SAGE_DARK, color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.85rem", fontWeight: 700, flexShrink: 0,
  },
  previewTitle: { fontSize: "0.875rem", fontWeight: 700, color: INK, margin: 0 },
  previewSubtitle: { fontSize: "0.72rem", color: WARM_GRAY, margin: 0 },
  previewFields: {
    display: "flex", flexDirection: "column", gap: 0,
    padding: "0.25rem 0",
  },
  previewField: {
    display: "flex", gap: "0.75rem",
    padding: "0.5rem 1rem",
    borderBottom: "1px solid rgba(0,0,0,0.04)",
    alignItems: "flex-start",
  },
  previewLabel: {
    fontSize: "0.72rem", fontWeight: 700, color: WARM_GRAY,
    letterSpacing: "0.04em", textTransform: "uppercase",
    minWidth: 110, flexShrink: 0, paddingTop: "0.1rem",
  },
  previewValue: {
    fontSize: "0.85rem", color: INK, lineHeight: 1.55,
  },
  previewActions: {
    display: "flex", flexDirection: "column", gap: "0.5rem",
    padding: "0.875rem 1rem",
    borderTop: `1px solid rgba(0,0,0,0.06)`,
  },
  confirmBtn: {
    background: SAGE_DARK, color: "#fff", border: "none",
    borderRadius: "100px", padding: "0.75rem",
    fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit", width: "100%",
  },
  editBtn: {
    background: "transparent", color: WARM_GRAY,
    border: "1.5px solid rgba(0,0,0,0.12)",
    borderRadius: "100px", padding: "0.65rem",
    fontSize: "0.85rem", fontWeight: 500, cursor: "pointer",
    fontFamily: "inherit", width: "100%",
  },

  /* Input */
  inputArea: {
    display: "flex", alignItems: "flex-end", gap: "0.5rem",
    padding: "0.75rem 1rem",
    background: "#fff",
    borderTop: "1px solid rgba(0,0,0,0.07)",
    flexShrink: 0,
  },
  switchBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: "0.4rem", display: "flex", alignItems: "center",
    opacity: 0.5, flexShrink: 0,
  },
  input: {
    flex: 1, border: "1.5px solid rgba(0,0,0,0.12)",
    borderRadius: "1.25rem", padding: "0.625rem 0.875rem",
    fontSize: "1rem", color: INK, background: OFF_WHITE,
    fontFamily: "inherit", resize: "none", outline: "none",
    lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: "50%",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "background 0.15s",
  },

  /* Switch hint */
  switchHint: {
    textAlign: "center", margin: "0 0 0.75rem", padding: 0,
  },
  switchHintBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: "0.75rem", color: WARM_GRAY,
    textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.2)",
    fontFamily: "inherit", padding: 0,
  },

  /* Error */
  errorBanner: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: "0.75rem", background: "#fdeaea",
    borderRadius: "0.875rem", padding: "0.75rem 1rem",
  },
  retryBtn: {
    background: "none", border: "1px solid #c0392b",
    borderRadius: "100px", padding: "0.3rem 0.75rem",
    fontSize: "0.75rem", color: "#c0392b",
    cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
  },
};
