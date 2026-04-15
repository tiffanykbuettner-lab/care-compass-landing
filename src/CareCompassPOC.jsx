import React, { useState, useRef, useEffect } from "react";

const LOADING_STYLES = `
@keyframes loadProgress {
  0% { width: 0%; }
  10% { width: 15%; }
  30% { width: 40%; }
  60% { width: 65%; }
  80% { width: 80%; }
  95% { width: 92%; }
  100% { width: 95%; }
}
  0% { width: 0%; }
  10% { width: 15%; }
  30% { width: 40%; }
  60% { width: 65%; }
  80% { width: 80%; }
  95% { width: 92%; }
  100% { width: 95%; }
}
`;

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

/* ─── Step config ────────────────────────────────────────────────────────── */
const STEPS = [
  { id: "symptoms",    label: "Your Symptoms"   },
  { id: "history",     label: "Health History"  },
  { id: "lifestyle",   label: "Daily Variables" },
  { id: "review",      label: "Review"          },
];

const SEVERITY = ["1","2","3","4","5","6","7","8","9","10"];

const BODY_SYSTEMS = [
  {
    system: "Joints & Muscles",
    examples: "joint pain, muscle pain, instability, subluxations, stiffness",
    hints: [
      "joint cracking, popping, or slipping",
      "morning stiffness or stiffness after sitting",
      "pain that moves around",
      "easy bruising",
      "muscle spasms",
      "hypermobile or double-jointed areas",
    ]
  },
  {
    system: "Heart & Circulation",
    examples: "palpitations, dizziness on standing, fainting, Raynaud's",
    hints: [
      "dizziness or fainting when standing",
      "racing or skipping heartbeat",
      "hands or feet turning white/blue in cold",
      "worse after standing for long periods",
      "strongly feeling your heartbeat",
    ]
  },
  {
    system: "Digestive",
    examples: "nausea, reflux, difficulty swallowing, bloating, food intolerances",
    hints: [
      "nausea without eating",
      "food or liquid coming back up",
      "trouble swallowing",
      "extreme bloating after eating",
      "feeling full quickly after small amounts",
    ]
  },
  {
    system: "Neurological",
    examples: "migraines, brain fog, headaches, numbness, tingling",
    hints: [
      "brain fog or difficulty concentrating",
      "frequent headaches or migraines",
      "numbness, tingling, or burning in hands/feet",
      "memory issues or word-finding difficulty",
      "sensitivity to light, sound, or smell",
    ]
  },
  {
    system: "Skin & Immune",
    examples: "rashes, allergic reactions, sensitivity to adhesives or bug bites",
    hints: [
      "unexplained rashes or hives",
      "unusually large reactions to bug bites",
      "reactions to adhesives or bandages",
      "skin that is very stretchy or velvety",
      "easy flushing or skin redness",
    ]
  },
  {
    system: "Reproductive & Pelvic",
    examples: "painful periods, pelvic pain, endometriosis, urinary urgency",
    hints: [
      "extremely painful periods",
      "pelvic pain unrelated to your cycle",
      "urinary urgency or frequency",
      "pain during intercourse",
      "endometriosis or PCOS",
    ]
  },
  {
    system: "Breathing & Energy",
    examples: "shortness of breath, fatigue, exercise intolerance, unrefreshing sleep",
    hints: [
      "exhaustion after a full night's sleep",
      "shortness of breath with minimal exertion",
      "crashing after activity (post-exertional malaise)",
      "air hunger — feeling you can't get enough air",
      "worse in heat or humidity",
    ]
  },
  {
    system: "Mental Health",
    examples: "anxiety, depression, mood changes, emotional dysregulation",
    hints: [
      "anxiety that feels physical — racing heart, trembling",
      "depression that comes out of nowhere",
      "easily emotionally overwhelmed",
      "panic attacks",
      "feeling disconnected from yourself",
    ]
  },
  {
    system: "Other",
    examples: "anything that doesn't fit above",
    hints: [
      "symptoms that come and go without cause",
      "patterns your doctors haven't explained",
      "anything else worth mentioning",
    ]
  },
];


/* ─── Body systems tooltip ───────────────────────────────────────────────── */
function BodySystemsTooltip() {
  const [open, setOpen] = React.useState(false);
  return (
    <span style={{ display: "inline" }}>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: SAGE_DARK, fontWeight: 600, fontSize: "inherit",
          fontFamily: "inherit", padding: 0, textDecoration: "underline",
          textDecorationStyle: "dotted", textUnderlineOffset: "3px",
        }}
      >
        different areas of your health
      </button>
      {open && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: "1.25rem", padding: "2rem", maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: INK, margin: "0 0 0.75rem" }}>
              What are the different areas?
            </h3>
            <p style={{ fontSize: "0.85rem", color: WARM_GRAY, margin: "0 0 1rem", lineHeight: 1.6 }}>
              We ask about symptoms in nine areas of your body and health — not because you need to know medical terms, but because symptoms in different areas often connect in ways that aren't obvious.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                ["🦴", "Joints & Muscles", "pain, stiffness, instability"],
                ["❤️", "Heart & Circulation", "palpitations, dizziness, fainting"],
                ["🫁", "Breathing & Energy", "fatigue, breathlessness, exercise tolerance"],
                ["🧠", "Neurological", "brain fog, headaches, numbness"],
                ["🩺", "Digestive", "nausea, bloating, food sensitivities"],
                ["🌿", "Skin & Immune", "rashes, reactions, sensitivities"],
                ["🌸", "Reproductive & Pelvic", "periods, pelvic pain, urinary symptoms"],
                ["💭", "Mental Health", "anxiety, mood, emotional regulation"],
                ["✨", "Other", "anything that doesn't fit neatly"],
              ].map(([icon, label, desc]) => (
                <div key={label} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: 1 }}>{icon}</span>
                  <div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: INK }}>{label}</span>
                    <span style={{ fontSize: "0.78rem", color: WARM_GRAY }}> — {desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ marginTop: "1.5rem", width: "100%", background: SAGE_DARK, color: "#fff", border: "none", borderRadius: "100px", padding: "0.75rem", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </span>
  );
}

/* ─── Botanical logo mark ────────────────────────────────────────────────── */
const BotanicalMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
    <circle cx="36" cy="36" r="34" fill="#e8f0eb" stroke="#7a9e87" strokeWidth="1"/>
    <ellipse cx="36" cy="17" rx="7" ry="17" fill="#4a7058"/>
    <ellipse cx="36" cy="55" rx="5.5" ry="13" fill="#7a9e87" opacity="0.55"/>
    <ellipse cx="55" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.8"/>
    <ellipse cx="17" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.45"/>
    <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.4" transform="rotate(42 36 36) translate(0 -14)"/>
    <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.4" transform="rotate(-42 36 36) translate(0 -14)"/>
    <ellipse cx="36" cy="36" rx="3.5" ry="9" fill="#7a9e87" opacity="0.3" transform="rotate(135 36 36) translate(0 -14)"/>
    <ellipse cx="36" cy="36" rx="3.5" ry="9" fill="#7a9e87" opacity="0.3" transform="rotate(-135 36 36) translate(0 -14)"/>
    <circle cx="36" cy="36" r="7" fill="#4a7058"/>
    <circle cx="36" cy="36" r="3" fill="#e8f0eb"/>
    <line x1="36" y1="29" x2="36" y2="17" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.6"/>
    <line x1="36" y1="43" x2="36" y2="53" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.4"/>
    <line x1="43" y1="36" x2="55" y2="36" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.5"/>
    <line x1="29" y1="36" x2="17" y2="36" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.35"/>
  </svg>
);

/* ─── Progress bar ───────────────────────────────────────────────────────── */
function ProgressBar({ current, maxVisited, onStepClick }) {
  return (
    <div style={s.progressWrap}>
      {STEPS.map((step, i) => {
        const isClickable = i < current || i <= maxVisited;
        return (
          <div
            key={step.id}
            style={{ ...s.progressItem, cursor: isClickable ? "pointer" : "default" }}
            onClick={() => isClickable && onStepClick(i)}
            title={isClickable ? `Go to ${step.label}` : ""}
          >
            <div style={{
              ...s.progressDot,
              background: i <= current ? SAGE_DARK : i <= maxVisited ? SAGE : "#d4d0cb",
              transform: i === current ? "scale(1.25)" : "scale(1)",
              boxShadow: isClickable && i !== current ? `0 0 0 2px ${SAGE_LIGHT}` : "none",
              transition: "all 0.2s ease",
            }}/>
            <span style={{
              ...s.progressLabel,
              color: i === current ? SAGE_DARK : i <= maxVisited ? SAGE : "#aaa",
              fontWeight: i === current ? 600 : 400,
              textDecoration: isClickable && i !== current ? "underline" : "none",
              textDecorationColor: SAGE,
            }}>{step.label}</span>
          </div>
        );
      })}
      <div style={s.progressLine}>
        <div style={{ ...s.progressFill, width: `${(current / (STEPS.length - 1)) * 100}%` }}/>
      </div>
    </div>
  );
}

/* ─── Symptom row ────────────────────────────────────────────────────────── */
function SymptomRow({ system, examples, hints, value, onChange }) {
  const [showHints, setShowHints] = useState(false);
  return (
    <div style={s.symptomRow}>
      <div style={s.symptomSystem}>
        <div style={s.symptomSystemHeader}>
          <span style={s.symptomSystemName}>{system}</span>
          <button
            onClick={() => setShowHints(h => !h)}
            style={s.infoBtn}
            title="See example symptoms"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke={showHints ? SAGE_DARK : SAGE} strokeWidth="1.2"/>
              <text x="8" y="12" textAnchor="middle" fontSize="10" fill={showHints ? SAGE_DARK : SAGE} fontWeight="600" fontFamily="serif">i</text>
            </svg>
          </button>
        </div>
        <span style={s.symptomExamples}>{examples}</span>
      </div>
      {showHints && (
        <div style={s.hintsPanel}>
          <p style={s.hintsPanelTitle}>Examples:</p>
          <ul style={s.hintsList}>
            {hints.map((h, i) => (
              <li key={i} style={s.hintsItem}>{h}</li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ position: "relative" }}>
        <textarea
          placeholder="Describe any symptoms here, or leave blank if none…"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ ...s.symptomTextarea, width: "100%", boxSizing: "border-box" }}
          rows={2}
        />
      </div>
    </div>
  );
}

/* ─── Print styles injected into head ───────────────────────────────────── */
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden; }
  #care-compass-report, #care-compass-report * { visibility: visible; }
  #care-compass-report { position: absolute; left: 0; top: 0; width: 100%; padding: 2rem; }
  .no-print { display: none !important; }
  @page { margin: 1.5cm; }
}
`;

function LifestyleField({ label, val, set, placeholder, rows, hints }) {
  const [showHints, setShowHints] = useState(false);
  return (
    <div style={s.formGroup}>
      <div style={s.symptomSystemHeader}>
        <label style={s.label}>{label}</label>
        {hints && (
          <button onClick={() => setShowHints(h => !h)} style={s.infoBtn} title="See prompts">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke={showHints ? SAGE_DARK : SAGE} strokeWidth="1.2"/>
              <text x="8" y="12" textAnchor="middle" fontSize="10" fill={showHints ? SAGE_DARK : SAGE} fontWeight="600" fontFamily="serif">i</text>
            </svg>
          </button>
        )}
      </div>
      {showHints && hints && (
        <div style={s.hintsPanel}>
          <p style={s.hintsPanelTitle}>Examples:</p>
          <ul style={s.hintsList}>
            {hints.map((h, i) => <li key={i} style={s.hintsItem}>{h}</li>)}
          </ul>
        </div>
      )}
      <textarea value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
          style={{ ...s.textarea, width: "100%", boxSizing: "border-box" }} rows={rows}/>
    </div>
  );
}

/* ─── Guidance output ────────────────────────────────────────────────────── */
function GuidanceOutput({ guidance, onReset, onEdit, userName }) {
  if (!guidance) return null;

  const handleExport = () => {
    const style = document.createElement("style");
    style.innerHTML = PRINT_STYLES;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={s.guidanceWrap} id="care-compass-report">

      {/* Polished report header */}
      <div style={s.reportHeader}>
        <div style={s.reportHeaderTop}>
          <BotanicalMark size={48}/>
          <div style={s.reportHeaderText}>
            <p style={s.reportEyebrow}>Care Compass Insight Report</p>
            <h2 style={s.guidanceTitle}>
              {userName ? `${userName}'s Health Pattern Analysis` : "Your Health Pattern Analysis"}
            </h2>
            <p style={s.reportMeta}>Generated {today} · For personal use and discussion with your healthcare provider</p>
          </div>
        </div>
        <div style={s.reportDivider}/>
        <div style={s.reportActions} className="no-print">
          <button onClick={handleExport} style={s.exportBtn}>
            ↓ Save as PDF
          </button>
          <button onClick={onReset} style={s.resetBtn}>Start New Assessment</button>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={s.disclaimer}>
        <strong>Important:</strong> This report is not medical advice. Care Compass helps you identify
        patterns and prepare for conversations with your healthcare providers.
        Always consult a qualified medical professional before making any health decisions.
      </div>

      {/* Report content */}
      <div style={s.guidanceContent}>
        {(() => {
          const ASSESS_SECTION_STYLES = {
            "what we notice":          { border: SAGE,     head: SAGE_DARK,  bg: "#fff" },
            "daily life impact":       { border: "#f0d58a", head: "#9a6f00", bg: "#fff8e8" },
            "patterns worth exploring":{ border: TEAL,     head: "#2c6e72",  bg: TEAL_LIGHT },
            "specialists who may help":{ border: "#d4bfff", head: "#5b3d9e", bg: "#f5f0ff" },
            "questions to bring to your doctor": { border: "#c0caf5", head: "#2c3d9b", bg: "#f0f4ff" },
            "a note from care compass":{ border: SAGE,     head: SAGE_DARK,  bg: SAGE_LIGHT },
          };

          const sections = guidance.split(/\n(?=## )/).filter(Boolean);

          return sections.map((section, si) => {
            const lines = section.split("\n");
            const heading = lines[0].replace(/^##\s*/, "").trim();
            const body = lines.slice(1).join("\n").trim();
            if (!heading || !body) return null;

            const key = heading.toLowerCase().replace(/[^a-z\s']/g, "").trim();
            const col = ASSESS_SECTION_STYLES[key] || { border: SAGE, head: SAGE_DARK, bg: "#fff" };
            const isQuestions = key.includes("question");

            const bodyLines = body.split("\n").map(l => l.trim()).filter(Boolean);
            const blocks = [];
            let cur = { type: "para", lines: [] };
            bodyLines.forEach(line => {
              const isBullet = /^[-*•]\s/.test(line) || /^\d+[.)]\s/.test(line);
              const type = isBullet ? "bullet" : "para";
              if (type !== cur.type && cur.lines.length) { blocks.push({ ...cur }); cur = { type, lines: [] }; }
              cur.type = type;
              cur.lines.push(line);
            });
            if (cur.lines.length) blocks.push(cur);

            return (
              <div key={si} style={{ background: col.bg, border: "1.5px solid " + col.border, borderRadius: "1.25rem", overflow: "hidden", marginBottom: "1rem" }}>
                <div style={{ padding: "0.875rem 1.5rem", borderBottom: "1.5px solid " + col.border, display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: col.head, flexShrink: 0 }}/>
                  <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: col.head, margin: 0 }}>{heading}</h3>
                </div>
                <div style={{ padding: "1.1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {blocks.map((block, bi) => {
                    if (block.type === "bullet" || isQuestions) {
                      return (
                        <div key={bi} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                          {block.lines.map((line, li) => {
                            const clean = line.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1").trim();
                            if (!clean) return null;
                            if (isQuestions) return (
                              <div key={li} style={{ background: "rgba(255,255,255,0.7)", border: "1px solid " + col.border, borderRadius: "0.625rem", padding: "0.75rem 1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                                <div style={{ width: 7, height: 7, borderRadius: "50%", background: col.head, flexShrink: 0, marginTop: "0.55rem" }}/>
                                <span style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.7 }}>{clean}</span>
                              </div>
                            );
                            return (
                              <div key={li} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: col.head, flexShrink: 0, marginTop: "0.6rem" }}/>
                                <p style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.75, margin: 0 }}>{clean}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    const text = block.lines.join(" ").replace(/\*\*(.*?)\*\*/g, "$1");
                    return <p key={bi} style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.85, margin: 0 }}>{text}</p>;
                  })}
                </div>
              </div>
            );
          }).filter(Boolean);
        })()}
      </div>

      {/* Footer */}
      <div style={s.guidanceFooter}>
        <p style={s.guidanceFooterNote}>
          🌿 You are your own best advocate. Bring this report to your next appointment
          and ask your provider to help you explore these patterns together.
        </p>
        <div style={s.guidanceFooterActions} className="no-print">
          <button onClick={handleExport} style={s.exportBtn}>↓ Save as PDF</button>
          <button onClick={onEdit} style={s.editBtn}>Edit & Re-run →</button>
          <button onClick={onReset} style={s.resetBtn}>Start New Assessment</button>
        </div>
      </div>

      {/* Ask Sage about this report */}
      <InsightChat reportType="assessment" reportText={guidance || ""} onRerun={(ctx) => handleAnalyze(1, ctx)} />

      {/* Post-assessment CTAs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }} className="no-print">
        <div style={s.trackerPrompt}>
          <div style={s.trackerPromptLeft}>
            <p style={s.trackerPromptTitle}>Your insights are saved — here's what to do next</p>
            <p style={s.trackerPromptDesc}>Head to your dashboard to set up daily tracking, prepare for appointments, and get the most out of Care Compass.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem", flexShrink: 0 }}>
            <a
              href="/dashboard"
              style={s.trackerPromptBtn}
              onClick={() => {
                try {
                  localStorage.setItem("cc-onboarding-step", "complete");
                  // Set assessment done — only on first completion; retakes don't re-trigger welcome flow
                  if (!localStorage.getItem("cc-assessment-done")) {
                    localStorage.setItem("cc-assessment-done", "true");
                  }
                  // Also set the dashboard post-assessment banner flag (first time only)
                  if (!localStorage.getItem("cc-first-assessment-done")) {
                    localStorage.setItem("cc-first-assessment-done", "true");
                  }
                  // Clear skipped-assessment flag now that they've done it
                  localStorage.removeItem("cc-skipped-assessment");
                } catch {}
              }}
            >
              Go to my dashboard →
            </a>
            <a
              href="/tracker"
              style={{ fontSize: "0.78rem", color: WARM_GRAY, textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.2)", whiteSpace: "nowrap" }}
              onClick={() => { try { localStorage.setItem("cc-onboarding-step", "complete"); } catch {} }}
            >
              Start tracking now
            </a>
          </div>
        </div>
      </div>

      {/* Print-only footer */}
      <div style={s.printFooter}>
        <p style={s.printFooterText}>Generated by Care Compass · joincarecompass.com · {today}</p>
        <p style={s.printFooterDisclaimer}>This report is not medical advice. Always consult a qualified healthcare provider.</p>
      </div>

    </div>
  );
}


/* ─── InsightChat — inline "Ask Sage about this report" panel ─────────────── */
/**
 * Self-contained panel that appears at the bottom of any AI-generated result.
 * Props:
 *   reportType  — "insights" | "doctor" | "er" | "labs" | "assessment"
 *   reportText  — the full AI-generated text for this report (injected as context)
 *   accentColor — optional hex for the header stripe (defaults to SAGE_DARK)
 */
function InsightChat({ reportType, reportText, accentColor, onRerun }) {
  const [open, setOpen]             = React.useState(false);
  const [messages, setMessages]     = React.useState([]);
  const [input, setInput]           = React.useState("");
  const [loading, setLoading]       = React.useState(false);
  const [note, setNote]             = React.useState("");
  const [noteSaved, setNoteSaved]   = React.useState(false);
  const [tab, setTab]               = React.useState("chat");
  const [rerunning, setRerunning]   = React.useState(false);
  const endRef = React.useRef(null);
  const accent = accentColor || "#4a7058";

  // All user messages joined — this is the additional context to inject on re-run
  const userContext = messages.filter(m => m.role === "user").map(m => m.content).join("\n").trim();
  const hasContext  = userContext.length > 20 && !!onRerun;

  React.useEffect(() => {
    if (open && endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const SUGGESTIONS = {
    insights: [
      "What does this pattern mean for my day-to-day life?",
      "Which of these findings should I prioritise with my doctor?",
      "I forgot to mention I had surgery — does that change anything?",
      "Can you explain what you mean by [section name]?",
    ],
    doctor: [
      "Can you help me prepare for how to explain this to my doctor?",
      "I remembered something I didn't log — how do I add it?",
      "What does this term in my report mean?",
      "Which questions here are most important to raise?",
    ],
    er: [
      "What information is most important for triage staff?",
      "I want to add an allergy I forgot — can you help?",
      "How do I explain my condition quickly to a nurse?",
      "What should I do if staff dismiss my history?",
    ],
    labs: [
      "What does this result mean in plain language?",
      "My doctor said this is normal — why does the report flag it?",
      "I had a follow-up test since this — does that matter?",
      "Which result should I ask my doctor about first?",
    ],
    assessment: [
      "Can you explain what this pattern means?",
      "I forgot to mention a previous surgery or test.",
      "Which specialist recommendation should I follow up on first?",
      "What questions should I bring to my first appointment?",
    ],
  };

  const systemPrompt = `You are Sage, a warm and knowledgeable Care Compass health navigation guide. The user is reviewing an AI-generated ${reportType} report and has questions or wants to add context.

REPORT CONTENT (use this as your primary reference — answer questions based on it):
---
${(reportText || "").slice(0, 6000)}
---

Your role:
- Help the user understand specific terms, findings, or recommendations in their report
- If they mention something they forgot to include (a surgery, test, medication, condition), acknowledge it, explain how it might be relevant to what the report says, and suggest they note it down or re-run the report
- Be warm, specific, and reference actual content from their report where relevant
- Never diagnose or prescribe. Use language like "worth discussing with your doctor", "may be relevant because..."
- Keep responses concise — 2-4 sentences unless the question genuinely needs more
- No bullet points or markdown symbols. Write in natural prose.
- If they ask something unrelated to their health or this report, gently redirect.`;

  const send = async (text) => {
    const t = (text || input).trim();
    if (!t || loading) return;
    const next = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 600, system: systemPrompt, messages: next }),
      });
      const data  = await res.json();
      const reply = data.content?.[0]?.text || "I'm having trouble connecting. Please try again.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const saveNote = () => {
    if (!note.trim()) return;
    try {
      const key  = `cc-insight-notes-${reportType}`;
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push({ text: note.trim(), timestamp: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 3000);
    setNote("");
  };

  const suggestions = SUGGESTIONS[reportType] || SUGGESTIONS.insights;

  /* ── Collapsed teaser ── */
  if (!open) return (
    <div className="no-print" style={{ background: "#fff", borderRadius: "1.25rem", border: `1.5px solid ${accent}22`, padding: "1.1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#e8f0eb", border: "1.5px solid #c2d9c8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 72 72" fill="none">
            <ellipse cx="36" cy="17" rx="7" ry="17" fill="#4a7058"/>
            <ellipse cx="55" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.8"/>
            <ellipse cx="17" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.45"/>
            <circle cx="36" cy="36" r="7" fill="#4a7058"/>
            <circle cx="36" cy="36" r="3" fill="#e8f0eb"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2d2926", margin: "0 0 0.1rem" }}>Questions about this report?</p>
          <p style={{ fontSize: "0.78rem", color: "#6b6560", margin: 0 }}>Ask Sage to explain any finding, or add something you forgot to include.</p>
        </div>
      </div>
      <button onClick={() => setOpen(true)}
        style={{ background: accent, color: "#fff", border: "none", borderRadius: "100px", padding: "0.6rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
        Ask Sage →
      </button>
    </div>
  );

  /* ── Open panel ── */
  return (
    <div className="no-print" style={{ background: "#fff", borderRadius: "1.25rem", border: `1.5px solid ${accent}33`, overflow: "hidden", marginTop: "0.5rem" }}>

      {/* Header */}
      <div style={{ background: accent, padding: "0.875rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <svg width="16" height="16" viewBox="0 0 72 72" fill="none">
            <ellipse cx="36" cy="17" rx="7" ry="17" fill="#e8f0eb"/>
            <ellipse cx="55" cy="36" rx="17" ry="7" fill="#e0f2f4" opacity="0.9"/>
            <circle cx="36" cy="36" r="7" fill="#e8f0eb"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#fff" }}>Ask Sage about this report</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button onClick={() => setTab("chat")} style={{ background: tab === "chat" ? "rgba(255,255,255,0.25)" : "transparent", color: "#fff", border: "none", borderRadius: "100px", padding: "0.3rem 0.75rem", fontSize: "0.78rem", fontWeight: tab === "chat" ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>Chat</button>
          <button onClick={() => setTab("note")} style={{ background: tab === "note" ? "rgba(255,255,255,0.25)" : "transparent", color: "#fff", border: "none", borderRadius: "100px", padding: "0.3rem 0.75rem", fontSize: "0.78rem", fontWeight: tab === "note" ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>Add a note</button>
          <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 28, height: 28, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.85rem" }}>✕</button>
        </div>
      </div>

      {tab === "note" ? (
        /* ── Add-a-note tab ── */
        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#2d2926", margin: "0 0 0.25rem" }}>Add something you remembered</p>
            <p style={{ fontSize: "0.78rem", color: "#6b6560", margin: 0, lineHeight: 1.6 }}>Forgot a previous surgery, test result, or medication? Jot it here — it'll be saved and you can reference it when you re-run this report or share it with your doctor.</p>
          </div>
          <div style={{ position: "relative" }}>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Had gallbladder removed in 2019. Also had a thyroid ultrasound in March — it showed a small nodule they said was benign..."
              rows={4}
              style={{ width: "100%", boxSizing: "border-box", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "0.875rem", color: "#2d2926", background: "#fafaf8", outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button onClick={saveNote} disabled={!note.trim()}
              style={{ background: note.trim() ? accent : "#ccc", color: "#fff", border: "none", borderRadius: "100px", padding: "0.65rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: note.trim() ? "pointer" : "default", fontFamily: "inherit" }}>
              Save note →
            </button>
            {noteSaved && <span style={{ fontSize: "0.82rem", color: accent, fontWeight: 600 }}>✓ Saved</span>}
          </div>
          <p style={{ fontSize: "0.75rem", color: "#aaa", margin: 0, fontStyle: "italic" }}>Notes are saved to this device only. To update your report with this information, switch to Chat and tell Sage, or re-run the report and include it.</p>
        </div>
      ) : (
        /* ── Chat tab ── */
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Message area */}
          <div style={{ maxHeight: 340, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <p style={{ fontSize: "0.82rem", color: "#6b6560", margin: 0, fontStyle: "italic", textAlign: "center", paddingBottom: "0.5rem" }}>I've read your report. Ask me anything about it, or tap a suggestion below.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {suggestions.map(q => (
                    <button key={q} onClick={() => send(q)}
                      style={{ background: "#f0f7f2", border: "1px solid #c2d9c8", borderRadius: "100px", padding: "0.35rem 0.875rem", fontSize: "0.78rem", color: "#4a7058", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", lineHeight: 1.4, textAlign: "left" }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? accent : "#e8f0eb",
                color: m.role === "user" ? "#fff" : "#2d2926",
                borderRadius: m.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                padding: "0.65rem 0.9rem", fontSize: "0.875rem", lineHeight: 1.6,
                maxWidth: "85%",
              }}>{m.content}</div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", background: "#e8f0eb", borderRadius: "1rem 1rem 1rem 0.25rem", padding: "0.65rem 0.9rem" }}>
                <span style={{ color: "#7a9e87", letterSpacing: "0.1em", fontSize: "0.75rem" }}>●&nbsp;●&nbsp;●</span>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          {/* Re-run banner — appears once user has shared meaningful context */}
          {hasContext && (
            <div style={{ margin: "0 0.75rem 0.75rem", background: "#f0f7f2", border: `1.5px solid ${accent}44`, borderRadius: "0.875rem", padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <div>
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#2d2926", margin: "0 0 0.2rem" }}>Re-run with your new context?</p>
                <p style={{ fontSize: "0.75rem", color: "#6b6560", margin: 0, lineHeight: 1.55 }}>
                  You've shared information Sage thinks would improve this report. Re-running will generate a fresh report with everything you've mentioned included.
                </p>
              </div>
              <div style={{ background: "#fff", borderRadius: "0.6rem", padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "#4a4540", fontStyle: "italic", lineHeight: 1.55, border: "1px solid rgba(0,0,0,0.07)", maxHeight: 72, overflowY: "auto" }}>
                {userContext.length > 200 ? userContext.slice(0, 200) + "…" : userContext}
              </div>
              <button
                onClick={async () => {
                  setRerunning(true);
                  try { await onRerun(userContext); } finally { setRerunning(false); }
                }}
                disabled={rerunning}
                style={{ background: rerunning ? "#aaa" : accent, color: "#fff", border: "none", borderRadius: "100px", padding: "0.6rem 1.25rem", fontSize: "0.82rem", fontWeight: 600, cursor: rerunning ? "default" : "pointer", fontFamily: "inherit", alignSelf: "flex-start" }}>
                {rerunning ? "Re-running…" : "↻ Re-run report with this context"}
              </button>
            </div>
          )}

          {/* Input row */}
          <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#fafaf8", display: "flex", gap: "0.5rem" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about this report…"
              disabled={loading}
              style={{ flex: 1, padding: "0.65rem 0.9rem", borderRadius: "0.75rem", border: "1.5px solid rgba(0,0,0,0.1)", fontSize: "0.875rem", fontFamily: "inherit", color: "#2d2926", background: "#fff", outline: "none" }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              style={{ width: 40, height: 40, borderRadius: "0.75rem", background: (loading || !input.trim()) ? "#ccc" : accent, color: "#fff", border: "none", cursor: (loading || !input.trim()) ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


/* ─── Sage keyframes ─────────────────────────────────────────────────────── */
const SAGE_KEYFRAMES = `
  @keyframes ffDrift {
    0%,100% { transform: translate(0,0); }
    33%      { transform: translate(0.6px,-0.8px); }
    66%      { transform: translate(-0.5px,0.6px); }
  }
  @keyframes ffWingL {
    0%,100% { transform-origin:50% 50%; transform:rotate(0deg) scaleY(1); opacity:0.55; }
    50%      { transform-origin:50% 50%; transform:rotate(-18deg) scaleY(0.82); opacity:0.8; }
  }
  @keyframes ffWingR {
    0%,100% { transform-origin:50% 50%; transform:rotate(0deg) scaleY(1); opacity:0.55; }
    50%      { transform-origin:50% 50%; transform:rotate(18deg) scaleY(0.82); opacity:0.8; }
  }
  @keyframes ffLeaf {
    0%,100% { transform-origin:36px 36px; transform:scale(1); }
    50%      { transform-origin:36px 36px; transform:scale(1.03); }
  }
  @keyframes ffAntL { 0%,100% { transform:rotate(0deg); } 50% { transform:rotate(-5deg); } }
  @keyframes ffAntR { 0%,100% { transform:rotate(0deg); } 50% { transform:rotate(5deg); } }
  @keyframes sageNudgeIn {
    from { opacity:0; transform:translateX(-50%) translateY(-12px) scale(0.95); }
    to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
  }
  @keyframes sageNudgeOut {
    from { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
    to   { opacity:0; transform:translateX(-50%) translateY(-8px) scale(0.97); }
  }
  @keyframes sageIn {
    from { opacity:0; transform:translateY(12px) scale(0.95); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
`;

const FireflyMark = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ animation:"ffDrift 4s ease-in-out infinite", display:"block" }}>
    <circle cx="36" cy="36" r="34" fill="#e8f0eb" stroke="#7a9e87" strokeWidth="1"/>
    <g style={{ animation:"ffLeaf 3.5s ease-in-out infinite" }}>
      <ellipse cx="36" cy="17" rx="7" ry="17" fill="#4a7058"/>
      <ellipse cx="36" cy="55" rx="5.5" ry="13" fill="#7a9e87" opacity="0.55"/>
      <ellipse cx="55" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.8"/>
      <ellipse cx="17" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.45"/>
      <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.35" transform="rotate(42 36 36) translate(0 -14)"/>
      <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.35" transform="rotate(-42 36 36) translate(0 -14)"/>
      <ellipse cx="36" cy="36" rx="3.5" ry="9" fill="#4a9fa5" opacity="0.5" transform="rotate(135 36 36) translate(0 -14)"/>
      <ellipse cx="36" cy="36" rx="3.5" ry="9" fill="#4a9fa5" opacity="0.5" transform="rotate(-135 36 36) translate(0 -14)"/>
    </g>
    <ellipse cx="36" cy="36" rx="4" ry="6.5" fill="#2d4a35"/>
    <ellipse cx="28" cy="34" rx="8" ry="3.5" fill="#a8d4b0" opacity="0.55" style={{ animation:"ffWingL 0.6s ease-in-out infinite" }}/>
    <ellipse cx="44" cy="34" rx="8" ry="3.5" fill="#a8d4b0" opacity="0.55" style={{ animation:"ffWingR 0.6s ease-in-out infinite", animationDelay:"0.05s" }}/>
    <g style={{ transformOrigin:"34.5px 30px", animation:"ffAntL 2.8s ease-in-out infinite" }}>
      <line x1="34.5" y1="30" x2="31" y2="25" stroke="#4a7058" strokeWidth="0.9" strokeLinecap="round"/>
      <circle cx="31" cy="24.5" fill="#a8ffb0">
        <animate attributeName="r" values="1;1.6;1" dur="2.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.4s" repeatCount="indefinite"/>
      </circle>
    </g>
    <g style={{ transformOrigin:"37.5px 30px", animation:"ffAntR 2.8s ease-in-out infinite", animationDelay:"0.4s" }}>
      <line x1="37.5" y1="30" x2="41" y2="25" stroke="#4a7058" strokeWidth="0.9" strokeLinecap="round"/>
      <circle cx="41" cy="24.5" fill="#a8ffb0">
        <animate attributeName="r" values="1;1.6;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.4s" begin="0.5s" repeatCount="indefinite"/>
      </circle>
    </g>
    <ellipse cx="34.2" cy="33.5" fill="#b8f0b0">
      <animate attributeName="rx" values="1.3;1.3;1.3;0.2;1.3" dur="5s" keyTimes="0;0.7;0.85;0.9;1" repeatCount="indefinite"/>
      <animate attributeName="ry" values="1.3;1.3;1.3;0.15;1.3" dur="5s" keyTimes="0;0.7;0.85;0.9;1" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="37.8" cy="33.5" fill="#b8f0b0">
      <animate attributeName="rx" values="1.3;1.3;1.3;0.2;1.3" dur="5s" keyTimes="0;0.7;0.85;0.9;1" begin="0.08s" repeatCount="indefinite"/>
      <animate attributeName="ry" values="1.3;1.3;1.3;0.15;1.3" dur="5s" keyTimes="0;0.7;0.85;0.9;1" begin="0.08s" repeatCount="indefinite"/>
    </ellipse>
    <circle cx="36" cy="41" r="3" fill="#7fff7a" opacity="0.18"/>
    <circle cx="36" cy="41" fill="#c8ffb0">
      <animate attributeName="r" values="2.8;4;2.8" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.25;1;0.25" dur="1.8s" repeatCount="indefinite"/>
    </circle>
  </svg>
);

/* Step-specific nudge messages — null = no nudge shown */
const STEP_NUDGES = [
  null,
  "That took courage to share. You're doing great. 🌿",
  "History saved! This helps find your patterns.",
  "Almost there — you've got this. ✨",
];

function SageNudge({ message, onDone }) {
  const [phase, setPhase] = useState("in");
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 2800);
    const t2 = setTimeout(() => onDone(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div style={{
      position:"fixed", top:"5rem", left:"50%", transform:"translateX(-50%)",
      zIndex:9100, display:"flex", alignItems:"center", gap:"0.65rem",
      background:"#fff", borderRadius:"100px",
      boxShadow:"0 4px 24px rgba(0,0,0,0.12)", padding:"0.6rem 1.1rem 0.6rem 0.6rem",
      maxWidth:"calc(100vw - 2rem)", border:"1px solid #d4e4d8",
      pointerEvents:"none",
      animation: phase === "in"
        ? "sageNudgeIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards"
        : "sageNudgeOut 0.5s ease-in forwards",
    }}>
      <div style={{ flexShrink:0 }}><FireflyMark size={28}/></div>
      <p style={{ fontSize:"0.85rem", color:"#2d2926", lineHeight:1.4, margin:0 }}>
        {message}
      </p>
    </div>
  );
}

const ASSESSMENT_SYSTEM_PROMPT = `You are Sage, the Care Compass guide. The user is filling out a multi-step health assessment. Help them understand what each section is asking, reassure them if overwhelmed, and encourage them to share as much as they can. Never interpret symptoms or give medical advice. Keep responses warm and brief — 2-3 sentences. No markdown.`;

const ASSESSMENT_SUGGESTIONS = [
  "What is this assessment for?",
  "I feel overwhelmed — is that okay?",
  "Do I need to fill everything in?",
  "What happens after I submit?",
  "What's the Daily Variables step?",
];

function SageChatbot({ currentStep }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && messagesEndRef.current)
      messagesEndRef.current.scrollIntoView({ behavior:"smooth" });
  }, [messages, open]);

  const sendMessageWith = async (text) => {
    if (!text || loading) return;
    const stepLabel = STEPS[currentStep]?.label || "";
    const newMessages = [...messages, { role:"user", content:text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`${ASSESSMENT_SYSTEM_PROMPT} The user is currently on step ${currentStep + 1} of 4: "${stepLabel}".`,
          messages:newMessages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I'm having trouble connecting. Please try again.";
      setMessages([...newMessages, { role:"assistant", content:reply }]);
    } catch {
      setMessages([...newMessages, { role:"assistant", content:"I'm having trouble connecting. Please try again." }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => { const t = input.trim(); if (t) await sendMessageWith(t); };
  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <>
      {open && (
        <div style={ss.drawer}>
          <div style={ss.drawerHeader}>
            <div style={ss.drawerHeaderLeft}>
              <FireflyMark size={44}/>
              <div>
                <div style={ss.drawerName}>Sage</div>
                <div style={ss.drawerSub}>Your Care Compass guide</div>
              </div>
            </div>
            <button style={ss.drawerClose} onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>
          <div style={ss.messages}>
            {messages.length === 0 && (
              <div>
                <div style={ss.emptyState}>Have a question about this step? I'm here to help.</div>
                <div style={ss.suggestedWrap}>
                  {ASSESSMENT_SUGGESTIONS.map(q => (
                    <button key={q} style={ss.suggestedPill} onClick={() => sendMessageWith(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={m.role === "user" ? ss.userBubble : ss.sageBubble}>{m.content}</div>
            ))}
            {loading && <div style={ss.sageBubble}><span style={ss.typing}>●&nbsp;●&nbsp;●</span></div>}
            <div ref={messagesEndRef}/>
          </div>
          <div style={ss.inputRow}>
            <input style={ss.chatInput} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey} placeholder="Ask Sage a question…" disabled={loading}/>
            <button style={ss.sendBtn} onClick={sendMessage} disabled={loading || !input.trim()} aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
      {!open && (
        <button style={ss.fab} onClick={() => setOpen(true)} aria-label="Chat with Sage">
          <FireflyMark size={48}/>
        </button>
      )}
    </>
  );
}

const ss = {
  fab:{ position:"fixed", bottom:"1.5rem", right:"1.5rem", width:68, height:68, borderRadius:"50%", background:"#e8f0eb", border:"2px solid #c2d9c8", boxShadow:"0 4px 24px rgba(74,112,88,0.18)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9000, padding:0 },
  drawer:{ position:"fixed", bottom:"1.5rem", right:"1.5rem", width:340, maxWidth:"calc(100vw - 2rem)", maxHeight:"70vh", background:"#fff", borderRadius:"1.25rem", boxShadow:"0 8px 48px rgba(0,0,0,0.14)", border:"1px solid rgba(0,0,0,0.07)", display:"flex", flexDirection:"column", zIndex:9000, overflow:"hidden", animation:"sageIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" },
  drawerHeader:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.1rem", borderBottom:"1px solid rgba(0,0,0,0.06)", background:"#fafaf8" },
  drawerHeaderLeft:{ display:"flex", alignItems:"center", gap:"0.75rem" },
  drawerName:{ fontWeight:700, fontSize:"0.95rem", color:"#2d2926", lineHeight:1.2 },
  drawerSub:{ fontSize:"0.75rem", color:"#7a9e87" },
  drawerClose:{ background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:"1rem", padding:"4px", lineHeight:1 },
  messages:{ flex:1, overflowY:"auto", padding:"1rem", display:"flex", flexDirection:"column", gap:"0.75rem" },
  emptyState:{ fontSize:"0.875rem", color:"#aaa", textAlign:"center", lineHeight:1.6, padding:"1rem 0.5rem 0.75rem", fontStyle:"italic" },
  suggestedWrap:{ display:"flex", flexWrap:"wrap", gap:"0.45rem", justifyContent:"center", padding:"0 0.25rem 0.5rem" },
  suggestedPill:{ background:"#f0f7f2", border:"1px solid #c2d9c8", borderRadius:"100px", padding:"0.4rem 0.85rem", fontSize:"0.78rem", color:"#4a7058", fontWeight:600, cursor:"pointer", fontFamily:"inherit", lineHeight:1.4 },
  userBubble:{ alignSelf:"flex-end", background:"#4a7058", color:"#fff", borderRadius:"1rem 1rem 0.25rem 1rem", padding:"0.65rem 0.9rem", fontSize:"0.88rem", lineHeight:1.5, maxWidth:"82%" },
  sageBubble:{ alignSelf:"flex-start", background:"#e8f0eb", color:"#2d2926", borderRadius:"1rem 1rem 1rem 0.25rem", padding:"0.65rem 0.9rem", fontSize:"0.88rem", lineHeight:1.5, maxWidth:"82%" },
  typing:{ color:"#7a9e87", letterSpacing:"0.1em", fontSize:"0.75rem" },
  inputRow:{ display:"flex", gap:"0.5rem", padding:"0.75rem", borderTop:"1px solid rgba(0,0,0,0.06)", background:"#fafaf8" },
  chatInput:{ flex:1, padding:"0.65rem 0.9rem", borderRadius:"0.75rem", border:"1.5px solid rgba(0,0,0,0.1)", fontSize:"0.88rem", fontFamily:"inherit", color:"#2d2926", background:"#fff", outline:"none" },
  sendBtn:{ width:40, height:40, borderRadius:"0.75rem", background:"#4a7058", color:"#fff", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
};

/* ─── Main POC component ─────────────────────────────────────────────────── */
export default function CareCompassPOC() {
  const [step, setStep]             = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);
  const [loading, setLoading]       = useState(false);
  const [guidance, setGuidance]     = useState(null);
  const [error, setError]           = useState(null);
  const [nudge, setNudge]           = useState(null); // string | null

  const goToStep = (i) => {
    if (i > step && STEP_NUDGES[i]) setNudge(STEP_NUDGES[i]);
    setStep(i);
    setMaxVisited(prev => Math.max(prev, i));
    saveFormState({ step: i });
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const [symptoms, setSymptoms] = useState(
    Object.fromEntries(BODY_SYSTEMS.map(b => [b.system, ""]))
  );
  const [duration, setDuration]       = useState("");
  const [severity, setSeverity]       = useState("");
  const [ageRange, setAgeRange]       = useState("");
  const [diagnoses, setDiagnoses]     = useState("");
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies]     = useState("");
  const [diet, setDiet]               = useState("");
  const [activity, setActivity]       = useState("");
  const [sleep, setSleep]             = useState("");
  const [stress, setStress]           = useState("");
  const [recentChanges, setRecentChanges] = useState("");
  const [name, setName]               = useState("");
  const [retryCount, setRetryCount]   = useState(0);

  // Restore saved form state — priority: sessionStorage > localStorage/account settings > URL params
  useState(() => {
    try {
      // 1. Try sessionStorage first (in-progress assessment)
      const saved = sessionStorage.getItem("cc-assessment-form");
      if (saved) {
        const f = JSON.parse(saved);
        if (f.symptoms) setSymptoms(f.symptoms);
        if (f.name) setName(f.name);
        if (f.ageRange) setAgeRange(f.ageRange);
        if (f.duration) setDuration(f.duration);
        if (f.severity) setSeverity(f.severity);
        if (f.diagnoses) setDiagnoses(f.diagnoses);
        if (f.medications) setMedications(f.medications);
        if (f.allergies) setAllergies(f.allergies);
        if (f.diet) setDiet(f.diet);
        if (f.activity) setActivity(f.activity);
        if (f.sleep) setSleep(f.sleep);
        if (f.stress) setStress(f.stress);
        if (f.recentChanges) setRecentChanges(f.recentChanges);
        if (f.step) { setStep(f.step); setMaxVisited(f.step); }
        return; // session data takes priority — stop here
      }
    } catch {}

    // 2. Pre-fill from account settings (localStorage)
    try {
      // Name — prefer display name from settings
      const displayName = localStorage.getItem("cc-display-name") || "";
      if (displayName) setName(displayName);

      // Profile data
      const profile = localStorage.getItem("cc-profile");
      if (profile) {
        const p = JSON.parse(profile);
        if (p.ageRange) setAgeRange(p.ageRange);
        if (p.conditions?.length) setDiagnoses(p.conditions.join(", "));
      }

      // Conditions tag list
      const conditions = localStorage.getItem("cc-conditions");
      if (conditions) {
        const c = JSON.parse(conditions);
        if (Array.isArray(c) && c.length) setDiagnoses(c.join(", "));
      }

      // Medications list
      const meds = localStorage.getItem("care-compass-medications-v1");
      if (meds) {
        const medList = JSON.parse(meds);
        if (medList.length) {
          setMedications(medList.map(m => `${m.name}${m.dose ? " " + m.dose : ""}${m.frequency ? " (" + m.frequency + ")" : ""}`).join(", "));
        }
      }
    } catch {}

    // 3. URL params (passed from dashboard "Begin Assessment" button)
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("name") && !localStorage.getItem("cc-display-name")) setName(params.get("name"));
      if (params.get("age")) setAgeRange(params.get("age"));
      if (params.get("conditions")) setDiagnoses(params.get("conditions"));
      if (params.get("meds")) setMedications(params.get("meds"));
    } catch {}
  });

  // Save form state to sessionStorage whenever fields change
  const saveFormState = (updates = {}) => {
    try {
      const current = { symptoms, name, ageRange, duration, severity, diagnoses, medications, allergies, diet, activity, sleep, stress, recentChanges, step, ...updates };
      sessionStorage.setItem("cc-assessment-form", JSON.stringify(current));
    } catch {}
  };

  const clearSavedForm = () => { try { sessionStorage.removeItem("cc-assessment-form"); } catch {} };

  const filledSystems = Object.entries(symptoms).filter(([, v]) => v.trim());
  const allSymptoms   = filledSystems.map(([sys, desc]) => `${sys}: ${desc}`).join("\n");

  const handleAnalyze = async (attempt = 1, extraContext = "") => {
    const MAX_ATTEMPTS = 3;
    setLoading(true);
    setError(null);
    setRetryCount(attempt - 1);
    // Mark assessment as completed for new user flow
    try { localStorage.setItem("cc-assessment-complete", new Date().toISOString()); } catch {}

    const styleEl = document.getElementById("loading-styles") || document.createElement("style");
    styleEl.id = "loading-styles";
    styleEl.innerHTML = LOADING_STYLES;
    if (!document.getElementById("loading-styles")) document.head.appendChild(styleEl);

    // Read family history from account settings
    const familyHistoryEntries = (() => {
      try { const s = localStorage.getItem("cc-family-history"); return s ? JSON.parse(s) : []; } catch { return []; }
    })();
    const MLABELS = { mother:"Mother", father:"Father", maternal_grandmother:"Maternal grandmother", maternal_grandfather:"Maternal grandfather", paternal_grandmother:"Paternal grandmother", paternal_grandfather:"Paternal grandfather", sister:"Sister", brother:"Brother", maternal_aunt:"Maternal aunt", maternal_uncle:"Maternal uncle", paternal_aunt:"Paternal aunt", paternal_uncle:"Paternal uncle", daughter:"Daughter", son:"Son" };
    const familyHistoryStr = familyHistoryEntries.filter(e => e.member && e.conditions.length > 0)
      .map(e => `- ${MLABELS[e.member] || e.member}: ${e.conditions.join(", ")}${e.notes ? " (" + e.notes + ")" : ""}`)
      .join("\n");

    const prompt = `You are a compassionate, knowledgeable health navigation assistant for Care Compass — a platform that helps people with chronic illness understand their symptoms and advocate for themselves.

A user has shared the following health information. Your role is to:
1. Identify symptom patterns and clusters that may be connected
2. Suggest areas and conditions they might want to research and discuss with their doctor (NOT diagnose)
3. Recommend types of specialists who may be relevant
4. Provide thoughtful questions they can bring to their next appointment

CORE PHILOSOPHY — READ THIS CAREFULLY:
Your primary job is pattern recognition based on what the user actually experiences — their symptoms, timing, triggers, and how their body behaves. This takes precedence over any existing diagnoses or labels.

WHY THIS MATTERS: Complex conditions are frequently misdiagnosed. A user may carry a diagnosis that was the "simplest explanation" rather than the correct one. Seronegative presentations, atypical symptom clusters, and diagnostic momentum mean that labels on a chart can be wrong or incomplete. Do not anchor your analysis to existing diagnoses. Instead, let the symptom pattern speak for itself — then note where existing diagnoses align or potentially conflict.

HOW TO WEIGHT INFORMATION:
1. HIGHEST WEIGHT — Symptoms and lived experience: what the user actually describes experiencing across body systems, their severity, timing, and patterns
2. HIGH WEIGHT — Daily variables: food, medications, activity, sleep, stress and how they correlate with symptoms
3. MODERATE WEIGHT — Family history: genetic context that may inform pattern recognition, not restrict it
4. LOWER WEIGHT — Existing diagnoses: treat as context and one possible explanation, not confirmed truth. If symptoms don't fully align with a given diagnosis, say so gently. If the pattern suggests something additional or different, explore it.
5. LOWEST WEIGHT — Medication lists: unless a medication is new or the symptom is new, long-standing medications are less likely to be the cause of new symptoms

IMPORTANT GUIDELINES:
- Never diagnose. Use language like "may be worth exploring", "could be connected to", "you might ask your doctor about"
- Be warm, empathetic, and validating — many chronic illness patients feel dismissed. Many have been told their symptoms aren't real or don't fit a pattern
- If existing diagnoses seem incomplete or potentially misaligned with the symptom picture, gently note this — e.g. "Your current diagnosis may not fully account for [symptom cluster]" 
- Focus on cross-system pattern recognition — this is where Care Compass adds the most value
- Be thorough but clear and readable
- Use ## for main sections and - for bullet points

USER'S HEALTH INFORMATION:
Name: ${name || "the user"}
Age range: ${ageRange || "Not provided"}
How long they've been experiencing symptoms: ${duration}
Overall severity (1-10): ${severity}

SYMPTOMS BY BODY SYSTEM (PRIMARY SOURCE — weight these most heavily):
${allSymptoms || "No specific symptoms entered"}

HEALTH HISTORY (context only — do not anchor analysis to these):
Existing diagnoses: ${diagnoses || "None provided"}
Current medications: ${medications || "None provided"}
Known allergies or sensitivities: ${allergies || "None provided"}

DAILY VARIABLES:
Diet notes: ${diet || "None provided"}
Activity level: ${activity || "None provided"}
Sleep quality: ${sleep || "None provided"}
Stress levels: ${stress || "None provided"}
Recent changes (new meds, foods, activities): ${recentChanges || "None provided"}
${familyHistoryStr ? `\nFAMILY HISTORY:\n${familyHistoryStr}\n\nNote: Use family history to add hereditary context. Flag if any reported symptoms align with known familial patterns (e.g. connective tissue disorders, autoimmune conditions, cardiovascular disease). Mention potential genetic factors relevant to specialist referrals.` : ""}

FUNCTIONAL IMPACT INSTRUCTIONS:
Scan the symptom descriptions and daily variable notes for any mention of activities that were difficult, modified, avoided, or impossible due to symptoms. These include driving, cooking, showering, dressing, hair care, laundry, grocery shopping, walking, stairs, lifting, working, typing, social activities, caregiving, and any other daily task. If found, include a dedicated ## Daily Life Impact section. This is critically important — it helps doctors understand real-world severity rather than abstract numbers.

IMPORTANT: Always complete every section fully. Do not truncate, summarize, or abbreviate due to length. It is better to write less per section than to cut a section short. End every response with the full "A Note From Care Compass" section — if you find yourself running long, trim earlier sections slightly rather than leaving the final ones incomplete.

Please provide a Care Compass Insight Report with these sections:
## What We Notice
## Daily Life Impact
## Patterns Worth Exploring
## Specialists Who May Help
## Questions to Bring to Your Doctor
## A Note From Care Compass${extraContext ? `

ADDITIONAL CONTEXT FROM USER (incorporate this into your analysis — this was shared after the original report and contains important supplementary history):
${extraContext}` : ""}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-opus-4-6",
          max_tokens: 8000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      if (!data.content?.[0]?.text) throw new Error("Empty response");
      setGuidance(data.content[0].text);
      setStep(4);
      clearSavedForm();
    } catch (err) {
      if (attempt < MAX_ATTEMPTS) {
        // Auto-retry with delay: 3s then 6s
        const delay = attempt * 3000;
        setError(`Something went wrong — automatically retrying (attempt ${attempt} of ${MAX_ATTEMPTS})…`);
        setTimeout(() => handleAnalyze(attempt + 1), delay);
      } else {
        // All retries exhausted — show friendly final error
        setError("We weren't able to generate your insights after a few attempts. Your answers have been saved — please try again in a moment.");
        setLoading(false);
        const styleEl = document.getElementById("loading-styles");
        if (styleEl) styleEl.remove();
      }
      return;
    }

    setLoading(false);
    const styleElFinal = document.getElementById("loading-styles");
    if (styleElFinal) styleElFinal.remove();
  };

  const handleReset = () => {
    setStep(0);
    setMaxVisited(0);
    setGuidance(null);
    setError(null);
    setSymptoms(Object.fromEntries(BODY_SYSTEMS.map(b => [b.system, ""])));
    setDuration(""); setSeverity(""); setAgeRange(""); setDiagnoses("");
    setMedications(""); setAllergies(""); setDiet("");
    setActivity(""); setSleep(""); setStress("");
    setRecentChanges(""); setName("");
    clearSavedForm();
  };

  return (
    <div style={s.root}>
      {/* Nav */}
      <nav style={s.nav}>
        <a href="/" style={s.navLogo}>
          <BotanicalMark size={32}/>
          <span style={s.navLogoText}>Care Compass</span>
        </a>
        <span style={s.navBadge}>Early Access</span>
      </nav>

      <main style={s.main}>
        {/* Guidance output */}
        {step === 4 ? (
          <div style={s.container}>
            <GuidanceOutput guidance={guidance} onReset={handleReset} onEdit={() => goToStep(3)} userName={name}/>
          </div>
        ) : (
          <div style={s.container}>

            {/* Header */}
            <div style={s.header}>
              <p style={s.eyebrow}>Your health, seen whole</p>
              <h1 style={s.title}>Let's map your symptoms together</h1>
              <p style={s.subtitle}>
                Take a few minutes to share what you've been experiencing.
                Care Compass will look at the full picture — the way a great doctor would.
              </p>
            </div>

            {/* Progress */}
            <ProgressBar current={step} maxVisited={maxVisited} onStepClick={goToStep}/>

            {/* Step 0 — Symptoms */}
            {step === 0 && (
              <div style={s.stepWrap}>
                <div style={s.stepIntro}>
                  <h2 style={s.stepTitle}>What are you experiencing?</h2>
                  <p style={s.stepDesc}>
                    Share what you've been experiencing across <BodySystemsTooltip/> — from joints and energy to digestion and mood. You don't need to know what's causing them. Leave any section blank if it doesn't apply.
                  </p>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Your first name <span style={s.optional}>(optional)</span></label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="First name" style={s.input}/>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Your age range</label>
                  <div style={s.ageRangeWrap}>
                    {["18–25","26–35","36–45","46–55","56–65","65+"].map(range => (
                      <button key={range} onClick={() => setAgeRange(range)} style={{
                        ...s.ageRangeBtn,
                        background: ageRange === range ? SAGE_DARK : SAGE_LIGHT,
                        color: ageRange === range ? "#fff" : SAGE_DARK,
                        borderColor: ageRange === range ? SAGE_DARK : "transparent",
                      }}>{range}</button>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#aaa", margin: "0.25rem 0 0", textAlign: "center" }}>Care Compass is intended for users 18 and over.</p>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>How long have you been experiencing these symptoms?</label>
                  <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 6 months, several years, since childhood…" style={s.input}/>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Overall severity — how much do these symptoms affect your daily life?</label>
                  <div style={s.severitySliderWrap}>
                    <div style={s.severitySliderRow}>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={severity || 5}
                        onChange={e => setSeverity(e.target.value)}
                        style={{ flex: 1, accentColor: severity <= 3 ? SAGE_DARK : severity <= 6 ? "#e8a838" : "#c0392b" }}
                      />
                      <div style={{
                        ...s.severityDisplay,
                        background: !severity ? SAGE_LIGHT : severity <= 3 ? SAGE_LIGHT : severity <= 6 ? "#fef3da" : "#fdeaea",
                        color: !severity ? SAGE_DARK : severity <= 3 ? SAGE_DARK : severity <= 6 ? "#8a5a00" : "#c0392b",
                        borderColor: !severity ? SAGE : severity <= 3 ? SAGE : severity <= 6 ? "#e8a838" : "#c0392b",
                      }}>
                        {severity || "5"}<span style={{ fontSize: "0.7rem" }}>/10</span>
                      </div>
                    </div>
                    <div style={s.severityLabels}>
                      <span style={s.severityLabel}>1 — Manageable</span>
                      <span style={s.severityLabel}>5 — Moderate</span>
                      <span style={s.severityLabel}>10 — Severe</span>
                    </div>
                    {severity && (
                      <p style={s.severityDesc}>
                        {severity <= 3 ? "Noticeable but manageable — symptoms are present but don't significantly limit your day." :
                         severity <= 6 ? "Moderate — symptoms regularly affect your activities, energy, or comfort." :
                         "Significant — symptoms are severe and substantially impact your daily functioning."}
                      </p>
                    )}
                  </div>
                </div>
                <div style={s.systemsWrap}>
                  {BODY_SYSTEMS.map(b => (
                    <SymptomRow
                      key={b.system}
                      system={b.system}
                      examples={b.examples}
                      hints={b.hints}
                      value={symptoms[b.system]}
                      onChange={v => setSymptoms(prev => ({ ...prev, [b.system]: v }))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 1 — History */}
            {step === 1 && (
              <div style={s.stepWrap}>
                <div style={s.stepIntro}>
                  <h2 style={s.stepTitle}>Your health history</h2>
                  <p style={s.stepDesc}>
                    Help us understand your full picture. This context helps Care Compass
                    identify patterns more accurately.
                  </p>
                </div>
                {[
                  { label: "Any existing diagnoses", val: diagnoses, set: setDiagnoses, placeholder: "e.g. fibromyalgia, POTS, endometriosis, anxiety… or 'none yet'" },
                  { label: "Current medications or supplements", val: medications, set: setMedications, placeholder: "List any medications, supplements, or vitamins you take regularly", upload: true },
                  { label: "Known allergies or sensitivities", val: allergies, set: setAllergies, placeholder: "Food, environmental, medication, or contact allergies" },
                ].map(({ label, val, set, placeholder, upload }) => (
                  <div key={label} style={s.formGroup}>
                    <label style={s.label}>{label}</label>
                    <textarea value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                        style={{ ...s.textarea, width: "100%", boxSizing: "border-box" }} rows={3}/>
                    {upload && (
                      <label style={s.uploadLabel}>
                        <span style={{...s.uploadBtn, display:"inline-flex", alignItems:"center", gap:"0.35rem"}}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M13 7.5l-5.5 5.5a4 4 0 01-5.7-5.6L7 2.3a2.5 2.5 0 013.5 3.5L5.3 11a1 1 0 01-1.4-1.4l4.8-4.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> Upload medication list (.txt, .csv, .pdf)</span>
                        <input type="file" accept=".txt,.pdf,.csv" style={{ display: "none" }} onChange={e => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = evt => set(prev => prev ? prev + "\n" + evt.target.result.slice(0, 1000) : evt.target.result.slice(0, 1000));
                          reader.readAsText(file);
                        }}/>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Step 2 — Lifestyle */}
            {step === 2 && (
              <div style={s.stepWrap}>
                <div style={s.stepIntro}>
                  <h2 style={s.stepTitle}>Daily variables</h2>
                  <p style={s.stepDesc}>
                    Patterns often hide in the details of daily life. Share what you can —
                    this helps Care Compass connect triggers and variables to your symptoms.
                  </p>
                </div>
                {[
                  { label: "Diet & eating patterns", val: diet, set: setDiet, placeholder: "e.g. gluten-free, dairy-free, irregular eating, specific food triggers…", rows: 3, hints: [
                    "irregular eating, skipping meals",
                    "shaky or foggy when hungry",
                    "food triggers: gluten, dairy, sugar, histamine",
                    "salt or sugar cravings",
                    "worse after large meals",
                  ]},
                  { label: "Activity level", val: activity, set: setActivity, placeholder: "e.g. active but limited by symptoms, mostly sedentary, exercise intolerant…", rows: 3 },
                  { label: "Sleep quality", val: sleep, set: setSleep, placeholder: "e.g. difficulty falling asleep, waking frequently, unrefreshing sleep, 4-5 hours per night…", rows: 3 },
                  { label: "Stress & mental load", val: stress, set: setStress, placeholder: "e.g. high stress, caregiving responsibilities, work pressure…", rows: 3 },
                  { label: "Recent changes", val: recentChanges, set: setRecentChanges, placeholder: "New medications, diet changes, moved homes, new stressors, started a new activity…", rows: 3 },
                ].map(({ label, val, set, placeholder, rows, hints }) => (
              		       <LifestyleField key={label} label={label} val={val} set={set} placeholder={placeholder} rows={rows} hints={hints}/>
            		     ))}
              </div>
            )}

            {/* Step 3 — Review */}
            {step === 3 && (
              <div style={s.stepWrap}>
                <div style={s.stepIntro}>
                  <h2 style={s.stepTitle}>Ready to find your patterns?</h2>
                  <p style={s.stepDesc}>
                    Here's a summary of what you've shared. Care Compass will now analyze
                    the full picture and surface patterns worth exploring with your doctor.
                  </p>
                </div>
                <div style={s.reviewCard}>
                  {filledSystems.length > 0 && (
                    <div style={s.reviewSection}>
                      <p style={s.reviewLabel}>Symptoms shared across {filledSystems.length} area{filledSystems.length !== 1 ? "s" : ""} of health</p>
                      {filledSystems.map(([sys]) => (
                        <span key={sys} style={s.reviewTag}>{sys}</span>
                      ))}
                    </div>
                  )}
                  {ageRange && <div style={s.reviewItem}><span style={s.reviewKey}>Age range</span><span style={s.reviewVal}>{ageRange}</span></div>}
                  {duration && <div style={s.reviewItem}><span style={s.reviewKey}>Duration</span><span style={s.reviewVal}>{duration}</span></div>}
                  {severity && <div style={s.reviewItem}><span style={s.reviewKey}>Severity</span><span style={s.reviewVal}>{severity}/10</span></div>}
                  {diagnoses && <div style={s.reviewItem}><span style={s.reviewKey}>Diagnoses</span><span style={s.reviewVal}>{diagnoses}</span></div>}
                  {medications && <div style={s.reviewItem}><span style={s.reviewKey}>Medications</span><span style={s.reviewVal}>{medications}</span></div>}
                </div>
 		<div style={s.disclaimerBox}>
                  <p style={s.disclaimerText}>
                    Care Compass provides pattern insights and conversation starters — not medical advice or diagnosis.
                    Always discuss findings with a qualified healthcare provider.
                  </p>
                </div>
                <div style={s.consentBox}>
                  <p style={s.consentText}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="10.5" r="1" fill="currentColor"/></svg> <strong>Privacy notice:</strong> Your symptom information is processed securely via the Anthropic API to generate your insights. It is never stored permanently, never sold or shared, and is automatically deleted within 7 days. It will never be used to train AI models.{" "}
                    <a href="/privacy" target="_blank" rel="noreferrer" style={s.consentLink}>Read our Privacy Policy →</a>
                  </p>
                </div>
                {error && (
                  <div style={{ ...s.errorBox, background: error.includes("retrying") ? "#fff8e8" : "#fdeaea", borderColor: error.includes("retrying") ? "#f0d080" : "#f5c6c6" }}>
                    <p style={{ ...s.errorMsg, color: error.includes("retrying") ? "#8a6000" : "#c0392b" }}>
                      {error.includes("retrying") ? "" : ""}{error}
                    </p>
                    {!error.includes("retrying") && (
                      <button onClick={() => handleAnalyze(1)} style={s.retryBtn}>Try Again →</button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div style={s.navBtns}>
              {step > 0 && (
                <button onClick={() => goToStep(step - 1)} style={s.backBtn}>← Back</button>
              )}
              {step < 3 ? (
                <button onClick={() => goToStep(step + 1)} style={s.nextBtn}>
                  Continue →
                </button>
              ) : (
                <button onClick={handleAnalyze} disabled={loading} style={s.analyzeBtn}>
                  {loading ? (
                    <span style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem" }}>Analyzing your symptoms… <span style={{...s.spinner, display:"inline-flex", color:"#7a9e87"}}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 13c1-4 2-8 9-10-3 5-4 8-9 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M3 13c2-3 4-5 6-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg></span></span>
                  ) : guidance ? (
                    "Re-run Analysis →"
                  ) : (
                    "Find My Patterns →"
                  )}
                </button>
              )}
            </div>

          </div>
        )}
      {/* Loading overlay */}
      {loading && (
        <div style={s.loadingOverlay}>
          <div style={s.loadingCard}>
            <svg width="56" height="56" viewBox="0 0 72 72" fill="none" style={{ marginBottom: "1.25rem" }}>
              <circle cx="36" cy="36" r="34" fill="#e8f0eb" stroke="#7a9e87" strokeWidth="1"/>
              <ellipse cx="36" cy="17" rx="7" ry="17" fill="#4a7058"/>
              <ellipse cx="36" cy="55" rx="5.5" ry="13" fill="#7a9e87" opacity="0.55"/>
              <ellipse cx="55" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.8"/>
              <ellipse cx="17" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.45"/>
              <circle cx="36" cy="36" r="7" fill="#4a7058"/>
              <circle cx="36" cy="36" r="3" fill="#e8f0eb"/>
            </svg>
            <h2 style={s.loadingTitle}>Analyzing your symptoms</h2>
            <p style={s.loadingDesc}>Care Compass is looking at the full picture — connecting your symptoms, history, and daily variables to surface patterns worth exploring.</p>
            <div style={s.loadingBarWrap}>
              <div style={s.loadingBar}/>
            </div>
            <p style={s.loadingNote}>This usually takes 10–20 seconds. Please don't close this page.</p>
          </div>
        </div>
      )}

      </main>

      {/* Footer */}
      <footer style={s.footer}>
        <p style={s.footerText}>© {new Date().getFullYear()} Care Compass · <a href="mailto:hello@joincarecompass.com" style={s.footerLink}>hello@joincarecompass.com</a></p>
        <p style={s.footerDisclaimer}>Care Compass is not a medical service and does not provide medical advice, diagnosis, or treatment.</p>
      </footer>

      {/* ── Sage ── */}
      <style>{SAGE_KEYFRAMES}</style>
      {nudge && <SageNudge message={nudge} onDone={() => setNudge(null)} />}
      {step < 4 && <SageChatbot currentStep={step} />}

    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = {
  root: { fontFamily: "'DM Sans', Helvetica, sans-serif", color: INK, background: OFF_WHITE, minHeight: "100vh", display: "flex", flexDirection: "column" },
  nav: { padding: "1rem 2rem", borderBottom: `1px solid rgba(0,0,0,0.07)`, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 },
  navLogo: { display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" },
  navLogoText: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: SAGE_DARK, letterSpacing: "-0.01em" },
  navBadge: { fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: TEAL, background: "#e0f2f4", padding: "0.3rem 0.8rem", borderRadius: "100px" },
  main: { flex: 1, padding: "3rem 1.5rem" },
  container: { maxWidth: 760, margin: "0 auto" },
  header: { textAlign: "center", marginBottom: "2.5rem" },
  eyebrow: { fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: "0.5rem" },
  title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, color: INK, letterSpacing: "-0.02em", marginBottom: "1rem", marginTop: 0, lineHeight: 1.2 },
  subtitle: { fontSize: "1rem", color: WARM_GRAY, lineHeight: 1.75, maxWidth: 560, margin: "0 auto" },

  progressWrap: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem", position: "relative", padding: "0 0.5rem" },
  progressLine: { position: "absolute", top: 8, left: "0.5rem", right: "0.5rem", height: 2, background: "#e0dbd5", zIndex: 0 },
  progressFill: { height: "100%", background: SAGE_DARK, transition: "width 0.4s ease", borderRadius: 2 },
  progressItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", zIndex: 1, flex: 1 },
  progressDot: { width: 16, height: 16, borderRadius: "50%", transition: "all 0.3s ease" },
  progressLabel: { fontSize: "0.72rem", textAlign: "center", letterSpacing: "0.01em", transition: "color 0.3s" },

  stepWrap: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  stepIntro: { marginBottom: "0.5rem" },
  stepTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, marginBottom: "0.5rem", marginTop: 0 },
  stepDesc: { fontSize: "0.95rem", color: WARM_GRAY, lineHeight: 1.75, margin: 0 },

  formGroup: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: { fontSize: "0.875rem", fontWeight: 600, color: INK_LIGHT },
  optional: { fontWeight: 400, color: "#aaa", fontSize: "0.8rem" },
  input: { padding: "0.85rem 1.1rem", borderRadius: "0.75rem", border: `1.5px solid rgba(0,0,0,0.12)`, fontSize: "0.97rem", color: INK, background: "#fff", outline: "none", fontFamily: "inherit" },
  textarea: { padding: "0.85rem 1.1rem", borderRadius: "0.75rem", border: `1.5px solid rgba(0,0,0,0.12)`, fontSize: "0.95rem", color: INK, background: "#fff", outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 },

  severityWrap: { display: "flex", gap: "0.4rem", flexWrap: "wrap" },
  severityBtn: { width: 40, height: 40, borderRadius: "50%", border: "2px solid transparent", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, fontFamily: "inherit", transition: "all 0.2s" },
  severityLabels: { display: "flex", justifyContent: "space-between", marginTop: "0.25rem" },
  severityLabel: { fontSize: "0.75rem", color: "#aaa" },

  systemsWrap: { display: "flex", flexDirection: "column", gap: "1rem" },
  symptomRow: { background: "#fff", borderRadius: "1rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" },
  symptomSystem: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  symptomSystemHeader: { display: "flex", alignItems: "center", gap: "0.5rem" },
  symptomSystemName: { fontSize: "0.9rem", fontWeight: 600, color: SAGE_DARK },
  infoBtn: { background: "transparent", border: "none", cursor: "pointer", padding: "0.1rem", display: "flex", alignItems: "center", flexShrink: 0 },
  hintsPanel: { background: SAGE_LIGHT, borderRadius: "0.65rem", padding: "0.875rem 1rem", border: `1px solid rgba(74,112,88,0.15)` },
  hintsPanelTitle: { fontSize: "0.78rem", fontWeight: 600, color: SAGE_DARK, margin: "0 0 0.5rem", fontStyle: "italic", textAlign: "left" },
  hintsList: { margin: 0, paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.3rem", textAlign: "left" },
  hintsItem: { fontSize: "0.82rem", color: INK_LIGHT, lineHeight: 1.6 },
  symptomExamples: { fontSize: "0.78rem", color: "#aaa", fontStyle: "italic" },
  symptomTextarea: { padding: "0.7rem 0.9rem", borderRadius: "0.6rem", border: `1.5px solid rgba(0,0,0,0.1)`, fontSize: "0.9rem", color: INK, background: SAGE_LIGHT, outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 },
  severitySliderWrap: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  severitySliderRow: { display: "flex", alignItems: "center", gap: "1rem" },
  severityDisplay: { width: 52, height: 52, borderRadius: "50%", border: "2px solid", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 700, flexShrink: 0, transition: "all 0.2s", fontFamily: "inherit" },
  severityDesc: { fontSize: "0.82rem", color: WARM_GRAY, fontStyle: "italic", margin: 0, lineHeight: 1.6 },

  reviewCard: { background: "#fff", borderRadius: "1.25rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" },
  reviewSection: { display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" },
  reviewLabel: { fontSize: "0.85rem", fontWeight: 600, color: SAGE_DARK, width: "100%", margin: 0 },
  reviewTag: { background: SAGE_LIGHT, color: SAGE_DARK, fontSize: "0.78rem", fontWeight: 600, padding: "0.3rem 0.75rem", borderRadius: "100px" },
  reviewItem: { display: "flex", gap: "1rem", alignItems: "flex-start", paddingTop: "0.75rem", borderTop: `1px solid rgba(0,0,0,0.06)` },
  reviewKey: { fontSize: "0.82rem", fontWeight: 600, color: WARM_GRAY, minWidth: 100 },
  reviewVal: { fontSize: "0.9rem", color: INK, lineHeight: 1.6 },

  disclaimerBox: { background: CREAM, borderRadius: "0.75rem", padding: "1rem 1.25rem", border: `1px solid rgba(0,0,0,0.06)` },
  disclaimerText: { fontSize: "0.82rem", color: WARM_GRAY, lineHeight: 1.7, margin: 0, textAlign: "center" },

  navBtns: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", paddingTop: "1.5rem", borderTop: `1px solid rgba(0,0,0,0.07)` },
  backBtn: { background: "transparent", border: `1.5px solid rgba(0,0,0,0.15)`, color: WARM_GRAY, padding: "0.75rem 1.5rem", borderRadius: "100px", fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit" },
  nextBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.85rem 2rem", borderRadius: "100px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" },
  analyzeBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.95rem 2.25rem", borderRadius: "100px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" },
  spinner: { display: "inline-block", animation: "spin 1s linear infinite" },

  errorMsg: { fontSize: "0.875rem", textAlign: "center", margin: 0 },
  errorBox: { borderRadius: "0.75rem", padding: "1rem 1.25rem", border: "1px solid", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" },
  retryBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.6rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },

  guidanceWrap: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  reportHeader: { background: "#fff", borderRadius: "1.25rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" },
  reportHeaderTop: { display: "flex", gap: "1.25rem", alignItems: "flex-start" },
  reportHeaderText: { flex: 1 },
  reportEyebrow: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.4rem" },
  reportMeta: { fontSize: "0.8rem", color: "#aaa", margin: "0.35rem 0 0", lineHeight: 1.5 },
  reportDivider: { height: 1, background: `linear-gradient(to right, ${SAGE_LIGHT}, transparent)` },
  reportActions: { display: "flex", gap: "0.75rem", alignItems: "center" },
  guidanceTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: INK, margin: 0, lineHeight: 1.2 },
  guidanceSub: { fontSize: "0.95rem", color: WARM_GRAY, margin: 0, lineHeight: 1.6 },
  guidanceFooterActions: { display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" },
  exportBtn: { background: TEAL, color: "#fff", border: "none", padding: "0.75rem 1.75rem", borderRadius: "100px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  editBtn: { background: "transparent", border: `1.5px solid ${SAGE_DARK}`, color: SAGE_DARK, padding: "0.75rem 1.75rem", borderRadius: "100px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  printFooter: { borderTop: `1px solid ${SAGE_LIGHT}`, paddingTop: "1rem", textAlign: "center" },
  printFooterText: { fontSize: "0.8rem", color: WARM_GRAY, margin: "0 0 0.25rem" },
  printFooterDisclaimer: { fontSize: "0.75rem", color: "#aaa", margin: 0 },
  disclaimer: { background: "#fff8e8", border: `1px solid #f0d080`, borderRadius: "0.75rem", padding: "1rem 1.25rem", fontSize: "0.82rem", color: "#7a6020", lineHeight: 1.7 },
  guidanceContent: { background: "#fff", borderRadius: "1.25rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "2rem", display: "flex", flexDirection: "column", gap: "0.75rem" },
  guidanceSection: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.15rem", fontWeight: 700, color: SAGE_DARK, margin: "1rem 0 0.25rem", borderBottom: `1px solid ${SAGE_LIGHT}`, paddingBottom: "0.5rem" },
  guidanceSubSection: { fontSize: "0.95rem", fontWeight: 600, color: INK, margin: "0.5rem 0 0.25rem" },
  guidanceBullet: { display: "flex", gap: "0.75rem", fontSize: "0.95rem", color: INK_LIGHT, lineHeight: 1.7 },
  bulletDot: { color: SAGE, fontWeight: 700, flexShrink: 0, marginTop: "0.1rem" },
  guidancePara: { fontSize: "0.95rem", color: INK_LIGHT, lineHeight: 1.75, margin: 0 },
  guidanceFooter: { background: SAGE_LIGHT, borderRadius: "1rem", padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", textAlign: "center" },
  guidanceFooterNote: { fontSize: "0.95rem", color: SAGE_DARK, lineHeight: 1.7, margin: 0, fontStyle: "italic" },
  resetBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.75rem 1.75rem", borderRadius: "100px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },

  footer: { padding: "1.5rem 2rem", borderTop: `1px solid rgba(0,0,0,0.07)`, textAlign: "center" },
  footerText: { fontSize: "0.85rem", color: WARM_GRAY, margin: "0 0 0.25rem" },
  footerLink: { color: SAGE_DARK, textDecoration: "none" },
  footerDisclaimer: { fontSize: "0.75rem", color: "#aaa", margin: 0 },
  trackerPrompt: { background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" },
  trackerPromptLeft: { display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1 },
  trackerPromptTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: INK, margin: 0 },
  trackerPromptDesc: { fontSize: "0.875rem", color: WARM_GRAY, lineHeight: 1.6, margin: 0 },
  trackerPromptBtn: { background: TEAL, color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" },

  ageRangeWrap: { display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" },
  ageRangeBtn: { padding: "0.5rem 1rem", borderRadius: "100px", border: "2px solid transparent", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, fontFamily: "inherit", transition: "all 0.2s" },
  uploadLabel: { cursor: "pointer", display: "inline-block", marginTop: "0.25rem" },
  uploadBtn: { fontSize: "0.78rem", color: SAGE_DARK, fontWeight: 600, textDecoration: "underline", textDecorationColor: "rgba(74,112,88,0.3)" },
  consentBox: { background: "#e8f0eb", borderRadius: "0.75rem", padding: "1rem 1.25rem", border: `1px solid rgba(74,112,88,0.2)` },
  consentText: { fontSize: "0.82rem", color: SAGE_DARK, lineHeight: 1.7, margin: 0 },
  consentLink: { color: SAGE_DARK, fontWeight: 600, textDecoration: "underline" },
  loadingOverlay: { position: "fixed", inset: 0, background: "rgba(250,250,248,0.96)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", backdropFilter: "blur(4px)" },
  loadingCard: { background: "#fff", borderRadius: "1.5rem", border: "1px solid rgba(0,0,0,0.07)", padding: "2.5rem 2rem", maxWidth: 480, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem", boxShadow: "0 8px 40px rgba(0,0,0,0.08)" },
  loadingTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: 0 },
  loadingDesc: { fontSize: "0.92rem", color: WARM_GRAY, lineHeight: 1.75, margin: 0, maxWidth: 380 },
  loadingBarWrap: { width: "100%", height: 6, background: SAGE_LIGHT, borderRadius: 100, overflow: "hidden" },
  loadingBar: { height: "100%", borderRadius: 100, background: SAGE_DARK, animation: "loadProgress 18s ease-in-out forwards" },
  loadingNote: { fontSize: "0.78rem", color: "#aaa", margin: 0, fontStyle: "italic" },
};
