import { useState } from "react";

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
`;

/* ─── Brand tokens ───────────────────────────────────────────────────────── */
const SAGE       = "#7a9e87";
const SAGE_LIGHT = "#e8f0eb";
const SAGE_DARK  = "#4a7058";
const TEAL       = "#4a9fa5";
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
      "Do your joints crack, pop, or slip out of place?",
      "Do you feel stiff in the morning or after sitting?",
      "Does your pain move around or stay in one place?",
      "Do you bruise easily or feel like your skin tears?",
      "Do you feel like you have to 'crack' joints for relief?",
      "Do you experience muscle spasms or charlie horses?",
      "Do you have hypermobile or double-jointed areas?",
    ]
  },
  {
    system: "Heart & Circulation",
    examples: "palpitations, dizziness on standing, fainting, Raynaud's",
    hints: [
      "Do you feel dizzy, lightheaded, or faint when standing up?",
      "Do you notice your heart racing or skipping beats?",
      "Do your hands or feet turn white, blue, or red in the cold?",
      "Do you feel worse after standing for long periods?",
      "Do you have low blood pressure or feel faint in heat?",
      "Do you feel your heartbeat strongly in your chest or neck?",
      "Do you get shortness of breath just from standing or light activity?",
    ]
  },
  {
    system: "Digestive",
    examples: "nausea, reflux, difficulty swallowing, bloating, food intolerances",
    hints: [
      "Do you experience nausea regularly, even without eating?",
      "Does food or liquid come back up your throat?",
      "Do you have trouble swallowing or feel like things get stuck?",
      "Do certain foods consistently make you feel worse?",
      "Do you experience extreme bloating after eating?",
      "Do you have constipation, diarrhea, or alternating both?",
      "Do you feel full very quickly, even after small amounts?",
      "Do you experience stomach pain that is hard to explain?",
    ]
  },
  {
    system: "Neurological",
    examples: "migraines, brain fog, headaches, numbness, tingling",
    hints: [
      "Do you experience 'brain fog' — difficulty thinking or concentrating?",
      "Do you get frequent headaches or migraines?",
      "Do you have numbness, tingling, or burning in hands or feet?",
      "Do you have memory problems or difficulty finding words?",
      "Do you feel sensitive to light, sound, or smell?",
      "Do you experience visual disturbances or aura?",
      "Do you feel clumsy, uncoordinated, or drop things often?",
    ]
  },
  {
    system: "Skin & Immune",
    examples: "rashes, allergic reactions, sensitivity to adhesives or bug bites",
    hints: [
      "Do you have unexplained rashes or hives?",
      "Do bug bites cause unusually large welts?",
      "Do adhesives (bandages, tape) cause skin reactions?",
      "Do you react to medications, foods, or environmental triggers?",
      "Do you have skin that is very stretchy or velvety?",
      "Do you flush easily or get red patches on your skin?",
      "Do you have frequent infections or slow wound healing?",
      "Do you experience itching without a visible rash?",
    ]
  },
  {
    system: "Reproductive & Pelvic",
    examples: "painful periods, pelvic pain, endometriosis, urinary urgency",
    hints: [
      "Do you experience extremely painful periods?",
      "Do you have pelvic pain that is not related to your cycle?",
      "Do you experience urgency or frequency with urination?",
      "Do you have pain during intercourse?",
      "Have you been told you have endometriosis or PCOS?",
      "Do you experience pelvic floor issues or prolapse symptoms?",
      "Do you have unusual bleeding or hormonal irregularities?",
    ]
  },
  {
    system: "Breathing & Energy",
    examples: "shortness of breath, fatigue, exercise intolerance, sleep issues",
    hints: [
      "Do you feel exhausted even after a full night's sleep?",
      "Do you get short of breath with minimal exertion?",
      "Do you crash after exercise or activity (post-exertional malaise)?",
      "Do you have difficulty staying asleep or feel unrefreshed?",
      "Do you experience air hunger — feeling like you can't get enough air?",
      "Do you have a persistent cough or feel chest tightness?",
      "Do you feel worse in heat or humidity?",
      "Do you have caffeine intolerance — does it make you feel worse?",
    ]
  },
  {
    system: "Mental Health",
    examples: "anxiety, depression, mood changes, sleep disturbances",
    hints: [
      "Do you experience anxiety that feels physical — racing heart, trembling?",
      "Do you have periods of depression that seem to come out of nowhere?",
      "Do you feel emotionally overwhelmed more easily than others?",
      "Do you have difficulty regulating your mood?",
      "Do you experience panic attacks?",
      "Do you feel disconnected from yourself or your surroundings?",
      "Do you have heightened sensitivity to stress?",
    ]
  },
  {
    system: "Other",
    examples: "anything that doesn't fit above",
    hints: [
      "Is there anything else you experience that doesn't fit the categories above?",
      "Do you have symptoms that come and go without an obvious cause?",
      "Are there patterns you've noticed that your doctors haven't been able to explain?",
    ]
  },
];

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
          <p style={s.hintsPanelTitle}>Prompts to consider — you may have learned to live with some of these:</p>
          <ul style={s.hintsList}>
            {hints.map((h, i) => (
              <li key={i} style={s.hintsItem}>{h}</li>
            ))}
          </ul>
        </div>
      )}
      <textarea
        placeholder="Describe any symptoms here, or leave blank if none…"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={s.symptomTextarea}
        rows={2}
      />
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
          <p style={s.hintsPanelTitle}>Prompts to help you reflect:</p>
          <ul style={s.hintsList}>
            {hints.map((h, i) => <li key={i} style={s.hintsItem}>{h}</li>)}
          </ul>
        </div>
      )}
      <textarea value={val} onChange={e => set(e.target.value)} placeholder={placeholder} style={s.textarea} rows={rows}/>
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
        {guidance.split("\n").filter(l => l.trim()).map((line, i) => {
          if (line.startsWith("#") && !line.startsWith("##")) return null;
          if (line.startsWith("##")) return (
            <h3 key={i} style={s.guidanceSection}>{line.replace(/^##\s*/, "")}</h3>
          );
          if (line.startsWith("**") && line.endsWith("**")) return (
            <h4 key={i} style={s.guidanceSubSection}>{line.replace(/\*\*/g, "")}</h4>
          );
          if (line.startsWith("- ")) return (
            <div key={i} style={s.guidanceBullet}>
              <span style={s.bulletDot}>•</span>
              <span>{line.replace(/^- /, "").replace(/\*\*(.*?)\*\*/g, "$1")}</span>
            </div>
          );
          if (line === "---") return <hr key={i} style={{ border: "none", borderTop: `1px solid ${SAGE_LIGHT}`, margin: "0.5rem 0" }}/>;
          return <p key={i} style={s.guidancePara}>{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
        })}
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

      {/* Tracker prompt */}
      <div style={s.trackerPrompt} className="no-print">
        <div style={s.trackerPromptLeft}>
          <p style={s.trackerPromptTitle}>Build on these insights with daily tracking</p>
          <p style={s.trackerPromptDesc}>Log your symptoms, food, sleep, and stress every day to uncover patterns over time — and generate reports to bring to your doctor.</p>
        </div>
        <a href="/tracker" style={s.trackerPromptBtn}>Start Tracking →</a>
      </div>

      {/* Print-only footer */}
      <div style={s.printFooter}>
        <p style={s.printFooterText}>Generated by Care Compass · joincarecompass.com · {today}</p>
        <p style={s.printFooterDisclaimer}>This report is not medical advice. Always consult a qualified healthcare provider.</p>
      </div>

    </div>
  );
}

/* ─── Main POC component ─────────────────────────────────────────────────── */
export default function CareCompassPOC() {
  const [step, setStep]           = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [guidance, setGuidance]   = useState(null);
  const [error, setError]         = useState(null);

  const goToStep = (i) => {
    setStep(i);
    setMaxVisited(prev => Math.max(prev, i));
    saveFormState({ step: i });
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

  // Restore saved form state from sessionStorage on mount
  useState(() => {
    try {
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
      }
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

  const handleAnalyze = async (attempt = 1) => {
    const MAX_ATTEMPTS = 3;
    setLoading(true);
    setError(null);
    setRetryCount(attempt - 1);

    const styleEl = document.getElementById("loading-styles") || document.createElement("style");
    styleEl.id = "loading-styles";
    styleEl.innerHTML = LOADING_STYLES;
    if (!document.getElementById("loading-styles")) document.head.appendChild(styleEl);

    const prompt = `You are a compassionate, knowledgeable health navigation assistant for Care Compass — a platform that helps people with chronic illness understand their symptoms and advocate for themselves.

A user has shared the following health information. Your role is to:
1. Identify symptom patterns and clusters that may be connected
2. Suggest areas and conditions they might want to research and discuss with their doctor (NOT diagnose)
3. Recommend types of specialists who may be relevant
4. Provide thoughtful questions they can bring to their next appointment

IMPORTANT GUIDELINES:
- Never diagnose. Use language like "may be worth exploring", "could be connected to", "you might ask your doctor about"
- Be warm, empathetic, and validating — many chronic illness patients feel dismissed
- Focus on pattern recognition across systems — this is the key insight
- Be thorough but clear and readable
- Use ## for main sections and - for bullet points

USER'S HEALTH INFORMATION:
Name: ${name || "the user"}
Age range: ${ageRange || "Not provided"}
How long they've been experiencing symptoms: ${duration}
Overall severity (1-10): ${severity}

SYMPTOMS BY BODY SYSTEM:
${allSymptoms || "No specific symptoms entered"}

HEALTH HISTORY:
Existing diagnoses: ${diagnoses || "None provided"}
Current medications: ${medications || "None provided"}
Known allergies or sensitivities: ${allergies || "None provided"}

DAILY VARIABLES:
Diet notes: ${diet || "None provided"}
Activity level: ${activity || "None provided"}
Sleep quality: ${sleep || "None provided"}
Stress levels: ${stress || "None provided"}
Recent changes (new meds, foods, activities): ${recentChanges || "None provided"}

Please provide a Care Compass Insight Report with these sections:
## What We Notice
## Patterns Worth Exploring
## Specialists Who May Help
## Questions to Bring to Your Doctor
## A Note From Care Compass`;

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
          max_tokens: 2000,
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
                    Share symptoms across any body systems that feel relevant. You don't need to know
                    what's causing them — just describe what you notice. Leave any section blank if it doesn't apply.
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
                    <textarea value={val} onChange={e => set(e.target.value)} placeholder={placeholder} style={s.textarea} rows={3}/>
                    {upload && (
                      <label style={s.uploadLabel}>
                        <span style={s.uploadBtn}>📎 Upload medication list (.txt, .csv, .pdf)</span>
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
    		   "Do you wake up hungry or with no appetite?",
   	   	   "Do you eat breakfast? Do you eat 3 meals or many small ones?",
 		   "Do you skip meals or go long periods without eating?",
	           "Do you feel shaky, irritable, or foggy if you don't eat?",
	           "Do certain foods consistently make you feel worse — gluten, dairy, sugar, histamine?",
	           "Do you have food cravings, especially for salt or sugar?",
	           "Do you eat at regular times or irregularly?",
	           "Do you feel worse after large meals vs small ones?",
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
                      <p style={s.reviewLabel}>Symptoms shared across {filledSystems.length} body system{filledSystems.length !== 1 ? "s" : ""}</p>
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
                    🔒 <strong>Privacy notice:</strong> Your symptom information is processed securely via the Anthropic API to generate your insights. It is never stored permanently, never sold or shared, and is automatically deleted within 7 days. It will never be used to train AI models.{" "}
                    <a href="/privacy" target="_blank" rel="noreferrer" style={s.consentLink}>Read our Privacy Policy →</a>
                  </p>
                </div>
                {error && (
                  <div style={{ ...s.errorBox, background: error.includes("retrying") ? "#fff8e8" : "#fdeaea", borderColor: error.includes("retrying") ? "#f0d080" : "#f5c6c6" }}>
                    <p style={{ ...s.errorMsg, color: error.includes("retrying") ? "#8a6000" : "#c0392b" }}>
                      {error.includes("retrying") ? "⏳ " : "⚠️ "}{error}
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
                    <span>Analyzing your symptoms… <span style={s.spinner}>🌿</span></span>
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
