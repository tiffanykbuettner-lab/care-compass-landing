import { useState, useEffect } from "react";

const SAGE       = "#7a9e87";
const SAGE_LIGHT = "#e8f0eb";
const SAGE_DARK  = "#4a7058";
const TEAL       = "#4a9fa5";
const WARM_GRAY  = "#6b6560";
const OFF_WHITE  = "#fafaf8";
const CREAM      = "#f4f1ec";
const INK        = "#2d2926";
const INK_LIGHT  = "#4a4540";
const STORAGE_KEY = "care-compass-tracker-v1";

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

const severityColor = (n) => {
  if (n <= 3) return "#7a9e87";
  if (n <= 6) return "#e8a838";
  return "#c0392b";
};

function SeveritySlider({ value, onChange }) {
  return (
    <div style={s.sevSliderWrap}>
      <div style={s.sevSliderRow}>
        <input type="range" min="1" max="10" step="1" value={value} onChange={e => onChange(Number(e.target.value))} style={{ flex: 1, accentColor: severityColor(value) }}/>
        <div style={{ ...s.sevDisplay, background: value <= 3 ? SAGE_LIGHT : value <= 6 ? "#fef3da" : "#fdeaea", color: value <= 3 ? SAGE_DARK : value <= 6 ? "#8a5a00" : "#c0392b", borderColor: severityColor(value) }}>
          {value}<span style={{ fontSize: "0.65rem" }}>/10</span>
        </div>
      </div>
      <div style={s.sevLabels}><span style={s.sevLabel}>1 — Manageable</span><span style={s.sevLabel}>5 — Moderate</span><span style={s.sevLabel}>10 — Severe</span></div>
    </div>
  );
}

function LineChart({ entries, field, color = SAGE }) {
  const filtered = [...entries].reverse().filter(e => e[field] != null);
  if (filtered.length < 2) return <div style={s.chartEmpty}>Add at least 2 entries to see this trend</div>;
  
  // For severity field: group by day and take max value per day
  const grouped = field === "severity"
    ? Object.values(filtered.reduce((acc, e) => {
        const day = new Date(e.timestamp).toDateString();
        if (!acc[day] || e[field] > acc[day][field]) acc[day] = e;
        return acc;
      }, {})).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    : filtered;

  const last14 = grouped.slice(-14);
  const W = 580, H = 120, PAD = 20;
  const xStep = (W - PAD * 2) / Math.max(last14.length - 1, 1);
  const points = last14.map((e, i) => ({ x: PAD + i * xStep, y: H - PAD - ((e[field] / 10) * (H - PAD * 2)) }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length-1].x} ${H-PAD} L ${points[0].x} ${H-PAD} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs><linearGradient id={`grad-${field}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      {[2,4,6,8,10].map(v => { const y = H - PAD - ((v/10) * (H - PAD*2)); return <g key={v}><line x1={PAD} y1={y} x2={W-PAD} y2={y} stroke="#e0dbd5" strokeWidth="0.5" strokeDasharray="4 4"/><text x={PAD-6} y={y+4} fontSize="10" fill="#aaa" textAnchor="end">{v}</text></g>; })}
      <path d={areaD} fill={`url(#grad-${field})`}/>
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={field === "severity" ? severityColor(last14[i][field]) : color} stroke="#fff" strokeWidth="1.5"/>)}
      {last14.map((e, i) => <text key={i} x={points[i].x} y={H-4} fontSize="9" fill="#aaa" textAnchor="middle">{new Date(e.timestamp).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}</text>)}
    </svg>
  );
}

function EntryCard({ entry, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(entry.timestamp);
  return (
    <div style={s.entryCard}>
      <div style={s.entryCardHeader} onClick={() => setExpanded(e => !e)}>
        <div style={s.entryCardLeft}>
          <div style={{ ...s.severityBadge, background: severityColor(entry.severity) }}>{entry.severity}/10</div>
          <div>
            <p style={s.entryDate}>{date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
            <p style={s.entryPreview}>{entry.symptoms || "No symptoms noted"}</p>
          </div>
        </div>
        <div style={s.entryCardRight}>
          <button onClick={e => { e.stopPropagation(); onEdit(entry); }} style={s.editEntryBtn}>Edit</button>
          <button onClick={e => { e.stopPropagation(); onDelete(entry.id); }} style={s.deleteBtn}>✕</button>
          <span style={s.expandChevron}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>
      {expanded && (
        <div style={s.entryDetail}>
          {entry.symptoms && <DR label="Symptoms" value={entry.symptoms}/>}
          {entry.food && <DR label="Food & drink" value={entry.food}/>}
          {entry.medications && <DR label="Medications" value={entry.medications}/>}
          {entry.activity && <DR label="Activity" value={entry.activity}/>}
          {entry.sleep != null && <DR label="Sleep" value={`${entry.sleep}/10`}/>}
          {entry.stress && <DR label="Stress" value={`${entry.stress}/10`}/>}
          {entry.weather && <DR label="Weather" value={entry.weather}/>}
          {entry.notes && <DR label="Notes" value={entry.notes}/>}
        </div>
      )}
    </div>
  );
}

const DR = ({ label, value }) => (
  <div style={s.detailRow}><span style={s.detailLabel}>{label}</span><span style={s.detailValue}>{value}</span></div>
);

function TrendsTab({ entries, dateFilter }) {
  if (entries.length < 2) return <div style={s.emptyState}><p style={s.emptyDesc}>Add more entries to see symptom trends and frequency reports.</p></div>;

  const days = dateFilter === "today" ? 1 : dateFilter === "week" ? 7 : dateFilter === "month" ? 30 : new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;
  const label = dateFilter === "today" ? "today" : dateFilter === "week" ? "past 7 days" : dateFilter === "month" ? "past 30 days" : "all time";

  const symptomCounts = {};
  entries.forEach(e => {
    if (!e.symptoms) return;
    const words = e.symptoms.toLowerCase();
    ["headache","migraine","pain","fatigue","nausea","dizziness","brain fog","palpitation","anxiety","insomnia","bloating","reflux","rash","swelling","stiffness","cramp","shortness of breath","numbness","tingling","joint","muscle","depression","diarrhea","constipation","vomiting","fever","cough"].forEach(kw => {
      if (words.includes(kw)) {
        if (!symptomCounts[kw]) symptomCounts[kw] = { days: new Set(), entries: [], totalSeverity: 0 };
        symptomCounts[kw].days.add(new Date(e.timestamp).toDateString());
        symptomCounts[kw].entries.push(e);
        symptomCounts[kw].totalSeverity += e.severity;
      }
    });
  });
  const topSymptoms = Object.entries(symptomCounts).map(([kw, data]) => ({ keyword: kw, dayCount: data.days.size, entryCount: data.entries.length, avgSeverity: (data.totalSeverity / data.entries.length).toFixed(1) })).sort((a, b) => b.dayCount - a.dayCount).slice(0, 8);
  const avgSev = entries.length ? (entries.reduce((sum, e) => sum + e.severity, 0) / entries.length).toFixed(1) : "—";
  const daysLogged = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;

  return (
    <div style={s.trendsWrap}>
      <div style={s.trendsHeader}>
        <p style={s.sectionLabel}>Symptom frequency report — {label}</p>
      </div>
      <div style={s.trendsSummary}>
        <div style={s.trendsStat}><span style={s.trendsStatVal}>{entries.length}</span><span style={s.trendsStatLabel}>Entries logged</span></div>
        <div style={s.trendsStat}><span style={s.trendsStatVal}>{daysLogged}{dateFilter !== "all" ? `/${days}` : ""}</span><span style={s.trendsStatLabel}>Days with entries</span></div>
        <div style={s.trendsStat}><span style={s.trendsStatVal}>{avgSev}</span><span style={s.trendsStatLabel}>Avg severity</span></div>
      </div>
      {topSymptoms.length > 0 ? (
        <div style={s.trendsCards}>
          <p style={{ ...s.sectionLabel, marginBottom: "0.75rem" }}>Most frequent symptoms — {label}</p>
          {topSymptoms.map(({ keyword, dayCount, entryCount, avgSeverity }) => (
            <div key={keyword} style={s.trendCard}>
              <div style={s.trendCardLeft}>
                <span style={s.trendKeyword}>{keyword.charAt(0).toUpperCase() + keyword.slice(1)}</span>
                <span style={s.trendSubtext}>{entryCount} {entryCount === 1 ? "entry" : "entries"} · avg severity {avgSeverity}/10</span>
              </div>
              <div style={s.trendBarWrap}>
                <div style={{ ...s.trendBar, width: `${(dayCount / days) * 100}%`, background: dayCount / days > 0.6 ? "#c0392b" : dayCount / days > 0.3 ? "#e8a838" : SAGE }}/>
                <span style={s.trendDayCount}>{dayCount} {dayCount === 1 ? "day" : "days"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={s.emptyState}><p style={s.emptyDesc}>No recognizable symptom keywords found. Try describing symptoms using common terms like "headache", "fatigue", "pain", or "nausea".</p></div>
      )}
    </div>
  );
}

export default function CareCompassTracker() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => { try { return localStorage.getItem('cc-tracker-onboarded') === 'true'; } catch { return false; } });
  const [entries, setEntries]           = useState([]);
  const [view, setView]                 = useState("log");
  const [showForm, setShowForm]         = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [insights, setInsights]         = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [saved, setSaved]               = useState(false);
  const [chartField, setChartField]     = useState("severity");
  const [dateFilter, setDateFilter]     = useState("all");

  const blankForm = { symptoms: "", severity: 5, food: "", medications: "", activity: "", sleep: null, stress: 5, weather: "", notes: "" };
  const [form, setForm] = useState(blankForm);

  useEffect(() => { try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) setEntries(JSON.parse(stored)); } catch {} }, []);

  const saveEntries = (updated) => { setEntries(updated); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {} };

  const dismissOnboarding = () => {
    try { localStorage.setItem("cc-tracker-onboarded", "true"); } catch {}
    setHasSeenOnboarding(true);
  };

  const isFirstEntryToday = !entries.some(e => new Date(e.timestamp).toDateString() === new Date().toDateString());

  const openNew = () => { setEditingEntry(null); setForm({ ...blankForm, sleep: isFirstEntryToday ? 7 : null }); setShowForm(true); };
  const openEdit = (entry) => { setEditingEntry(entry); setForm({ ...entry }); setShowForm(true); };

  const handleSubmit = () => {
    if (editingEntry) {
      saveEntries(entries.map(e => e.id === editingEntry.id ? { ...form, id: editingEntry.id, timestamp: editingEntry.timestamp } : e));
    } else {
      saveEntries([{ ...form, id: Date.now(), timestamp: new Date().toISOString() }, ...entries]);
    }
    setShowForm(false); setEditingEntry(null); setForm(blankForm);
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  const handleDelete = (id) => saveEntries(entries.filter(e => e.id !== id));

  const uniqueDaysLogged = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;

  const handleInsights = async () => {
    if (uniqueDaysLogged < 3) return;
    setLoadingInsights(true); setInsights(null);
    try {
      const summary = entries.slice(0, 20).map(e => `[${new Date(e.timestamp).toLocaleDateString()}] Severity: ${e.severity}/10 | Symptoms: ${e.symptoms || "none"} | Food: ${e.food || "none"} | Meds: ${e.medications || "none"} | Activity: ${e.activity || "none"} | Sleep: ${e.sleep != null ? e.sleep + "/10" : "not logged"} | Stress: ${e.stress}/10 | Weather: ${e.weather || "none"} | Notes: ${e.notes || "none"}`).join("\n");
      const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-opus-4-6", max_tokens: 1500, messages: [{ role: "user", content: `You are Care Compass. Analyze these symptom tracker entries and identify patterns, triggers, and insights to discuss with a doctor.\n\nENTRIES:\n${summary}\n\nProvide:\n## Patterns We Notice\n## Potential Triggers to Explore\n## What's Improving vs Worsening\n## Questions to Bring to Your Doctor\n\nBe warm, specific, and never diagnose.` }] }) });
      const data = await response.json();
      setInsights(data.content[0].text); setView("insights");
    } catch { setInsights("Something went wrong. Please try again."); }
    finally { setLoadingInsights(false); }
  };

  const handlePrint = () => { const style = document.createElement("style"); style.innerHTML = `@media print { .no-print { display: none !important; } @page { margin: 1.5cm; } }`; document.head.appendChild(style); window.print(); setTimeout(() => document.head.removeChild(style), 1000); };

  const avgSeverity = entries.length ? (entries.reduce((sum, e) => sum + e.severity, 0) / entries.length).toFixed(1) : "—";
  const todayCount = entries.filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString()).length;
  const filteredEntries = dateFilter === "all" ? entries : entries.filter(e => {
    const entryDate = new Date(e.timestamp);
    const now = new Date();
    if (dateFilter === "today") return entryDate.toDateString() === now.toDateString();
    if (dateFilter === "week") return entryDate >= new Date(now - 7 * 86400000);
    if (dateFilter === "month") return entryDate >= new Date(now - 30 * 86400000);
    return true;
  });

  const CHART_OPTIONS = [{ field: "severity", label: "Overall severity", color: SAGE }, { field: "stress", label: "Stress level", color: "#e8a838" }, { field: "sleep", label: "Sleep quality", color: TEAL }];
  const tabs = [{ id: "log", label: "Log" }, { id: "history", label: "History" }, { id: "trends", label: "Trends" }, { id: "insights", label: "AI Insights" }, { id: "report", label: "Doctor Report" }];

  if (!hasSeenOnboarding) {
    return (
      <div style={s.root}>
        <nav style={s.nav}>
          <a href="/" style={s.navLogo}><BotanicalMark size={30}/><span style={s.navLogoText}>Care Compass</span></a>
          <div style={s.navLinks}><a href="/compass" style={s.navLink}>Assessment</a><span style={s.navActive}>Tracker</span></div>
        </nav>
        <main style={{ ...s.main, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={s.onboardingWrap}>
            <BotanicalMark size={56}/>
            <h1 style={s.onboardingTitle}>Welcome to your symptom tracker</h1>
            <p style={s.onboardingDesc}>
              Your tracker is a private health journal — just for you. Log your symptoms, food, sleep,
              stress, and activity as often as you like throughout the day.
            </p>
            <div style={s.onboardingSteps}>
              <div style={s.onboardingStep}>
                <span style={s.onboardingStepNum}>1</span>
                <div>
                  <p style={s.onboardingStepTitle}>Log entries throughout the day</p>
                  <p style={s.onboardingStepDesc}>You can log once or many times — whenever you notice something worth recording.</p>
                </div>
              </div>
              <div style={s.onboardingStep}>
                <span style={s.onboardingStepNum}>2</span>
                <div>
                  <p style={s.onboardingStepTitle}>Track variables alongside symptoms</p>
                  <p style={s.onboardingStepDesc}>Food, medications, activity, sleep, and stress help Care Compass find connections.</p>
                </div>
              </div>
              <div style={s.onboardingStep}>
                <span style={s.onboardingStepNum}>3</span>
                <div>
                  <p style={s.onboardingStepTitle}>Uncover patterns over time</p>
                  <p style={s.onboardingStepDesc}>After a few entries, use AI Insights and Trends to surface what your data is telling you.</p>
                </div>
              </div>
              <div style={s.onboardingStep}>
                <span style={s.onboardingStepNum}>4</span>
                <div>
                  <p style={s.onboardingStepTitle}>Bring reports to your doctor</p>
                  <p style={s.onboardingStepDesc}>Generate a formatted Doctor Report to share hard data at your next appointment.</p>
                </div>
              </div>
            </div>
            <div style={s.onboardingPrivacy}>
              <span>🔒</span>
              <p style={s.onboardingPrivacyText}>
                Your data is stored privately on this device only. It is never uploaded, sold, or shared.
              </p>
            </div>
            <div style={s.onboardingActions}>
              <button onClick={dismissOnboarding} style={s.onboardingBtn}>Start Tracking →</button>
              <a href="/compass" style={s.onboardingSecondary}>Take the assessment first instead</a>
            </div>
          </div>
        </main>
        <footer style={s.footer}>
          <p style={s.footerText}>© {new Date().getFullYear()} Care Compass · <a href="mailto:hello@joincarecompass.com" style={s.footerLink}>hello@joincarecompass.com</a></p>
          <p style={s.footerDisclaimer}>Care Compass is not a medical service and does not provide medical advice, diagnosis, or treatment.</p>
        </footer>
      </div>
    );
  }

  return (
    <div style={s.root}>
      <nav style={s.nav}>
        <a href="/" style={s.navLogo}><BotanicalMark size={30}/><span style={s.navLogoText}>Care Compass</span></a>
        <div style={s.navLinks} className="no-print"><a href="/compass" style={s.navLink}>Assessment</a><span style={s.navActive}>Tracker</span></div>
      </nav>
      <main style={s.main}>
        <div style={s.container}>
          <div style={s.header} className="no-print">
            <p style={s.eyebrow}>Symptom Tracker</p>
            <h1 style={s.title}>Your daily health log</h1>
            <p style={s.subtitle}>Track symptoms and variables over time to uncover patterns worth sharing with your doctor.</p>
          </div>
          <div style={s.addBtnWrap} className="no-print"><button onClick={openNew} style={s.addBtn}>+ Log Entry</button></div>
          {entries.length > 0 && (
            <div style={s.statsRow} className="no-print">
              {[{ label: "Total entries", val: entries.length }, { label: "Today's entries", val: todayCount }, { label: "Avg severity", val: avgSeverity }, { label: "Days tracked", val: new Set(entries.map(e => new Date(e.timestamp).toDateString())).size }].map(({ label, val }) => (
                <div key={label} style={s.statCard}><p style={s.statLabel}>{label}</p><p style={s.statValue}>{val}</p></div>
              ))}
            </div>
          )}
          <div style={s.tabs} className="no-print">
            {tabs.map(tab => <button key={tab.id} onClick={() => setView(tab.id)} style={{ ...s.tab, borderBottom: view === tab.id ? `2px solid ${SAGE_DARK}` : "2px solid transparent", color: view === tab.id ? SAGE_DARK : WARM_GRAY, fontWeight: view === tab.id ? 600 : 400 }}>{tab.label}</button>)}
          </div>

          {view === "log" && (
            <div style={s.tabContent}>
              {saved && <div style={s.savedBanner}>🌿 {editingEntry ? "Entry updated!" : "Entry saved!"}</div>}
              {entries.length === 0 ? (
                <>
                  <div style={s.assessmentPrompt}>
                    <div style={s.assessmentPromptLeft}>
                      <p style={s.assessmentPromptTitle}>Start with a full assessment</p>
                      <p style={s.assessmentPromptDesc}>Not sure where to begin? Take the Care Compass assessment first — it maps your symptoms across all body systems and surfaces patterns to discuss with your doctor.</p>
                    </div>
                    <a href="/compass" style={s.assessmentPromptBtn}>Take the Assessment →</a>
                  </div>
                  <div style={s.emptyState}><BotanicalMark size={48}/><h2 style={s.emptyTitle}>Start tracking today</h2><p style={s.emptyDesc}>Log your first entry to begin building your health picture.</p></div>
                </>
              ) : (
                <>
                  <div style={s.chartCard}>
                    <div style={s.chartHeader}>
                      <p style={s.chartTitle}>Trend view</p>
                      <div style={s.chartSelector}>
                        {CHART_OPTIONS.map(opt => <button key={opt.field} onClick={() => setChartField(opt.field)} style={{ ...s.chartOptBtn, background: chartField === opt.field ? opt.color : "transparent", color: chartField === opt.field ? "#fff" : WARM_GRAY, borderColor: chartField === opt.field ? opt.color : "rgba(0,0,0,0.1)" }}>{opt.label}</button>)}
                      </div>
                    </div>
                    <LineChart entries={filteredEntries} field={chartField} color={CHART_OPTIONS.find(o => o.field === chartField)?.color}/>
                  </div>
                  <div style={s.recentEntries}>
                    <div style={s.recentHeader}>
                      <p style={s.sectionLabel}>Recent entries</p>
                      <div style={s.dateFilterWrap}>
                        {[{val:"all",label:"All"},{val:"today",label:"Today"},{val:"week",label:"7 days"},{val:"month",label:"30 days"}].map(opt => (
                          <button key={opt.val} onClick={() => setDateFilter(opt.val)} style={{ ...s.dateFilterBtn, background: dateFilter === opt.val ? SAGE_DARK : "transparent", color: dateFilter === opt.val ? "#fff" : WARM_GRAY, borderColor: dateFilter === opt.val ? SAGE_DARK : "rgba(0,0,0,0.12)" }}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                    {filteredEntries.length === 0 ? (
                      <p style={s.noEntriesMsg}>No entries for this period.</p>
                    ) : (
                      <>
                        {filteredEntries.slice(0, 5).map(e => <EntryCard key={e.id} entry={e} onDelete={handleDelete} onEdit={openEdit}/>)}
                        {filteredEntries.length > 5 && <button onClick={() => setView("history")} style={s.viewAllBtn}>View all {filteredEntries.length} entries →</button>}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {view === "history" && (
            <div style={s.tabContent}>
              {entries.length === 0 ? <div style={s.emptyState}><p style={s.emptyDesc}>No entries yet.</p></div> : (
                <div style={s.recentEntries}>
                  <div style={s.recentHeader}>
                    <p style={s.sectionLabel}>All entries — {filteredEntries.length} of {entries.length}</p>
                    <div style={s.dateFilterWrap}>
                      {[{val:"all",label:"All"},{val:"today",label:"Today"},{val:"week",label:"7 days"},{val:"month",label:"30 days"}].map(opt => (
                        <button key={opt.val} onClick={() => setDateFilter(opt.val)} style={{ ...s.dateFilterBtn, background: dateFilter === opt.val ? SAGE_DARK : "transparent", color: dateFilter === opt.val ? "#fff" : WARM_GRAY, borderColor: dateFilter === opt.val ? SAGE_DARK : "rgba(0,0,0,0.12)" }}>{opt.label}</button>
                      ))}
                    </div>
                  </div>
                  {filteredEntries.length === 0
                    ? <p style={s.noEntriesMsg}>No entries for this period.</p>
                    : filteredEntries.map(e => <EntryCard key={e.id} entry={e} onDelete={handleDelete} onEdit={openEdit}/>)
                  }
                </div>
              )}
            </div>
          )}

          {view === "trends" && (
            <div style={s.tabContent}>
              <div style={s.recentHeader}>
                <p style={s.sectionLabel}>Filter period</p>
                <div style={s.dateFilterWrap}>
                  {[{val:"all",label:"All"},{val:"today",label:"Today"},{val:"week",label:"7 days"},{val:"month",label:"30 days"}].map(opt => (
                    <button key={opt.val} onClick={() => setDateFilter(opt.val)} style={{ ...s.dateFilterBtn, background: dateFilter === opt.val ? SAGE_DARK : "transparent", color: dateFilter === opt.val ? "#fff" : WARM_GRAY, borderColor: dateFilter === opt.val ? SAGE_DARK : "rgba(0,0,0,0.12)" }}>{opt.label}</button>
                  ))}
                </div>
              </div>
              <TrendsTab entries={filteredEntries} dateFilter={dateFilter}/>
            </div>
          )}

          {view === "insights" && (
            <div style={s.tabContent}>
              {uniqueDaysLogged < 3 ? <div style={s.emptyState}><p style={s.emptyDesc}>Log entries across at least 3 different days before running AI pattern analysis. You've logged on {uniqueDaysLogged} {uniqueDaysLogged === 1 ? "day" : "days"} so far.</p><a href="/compass" style={{ ...s.assessmentPromptBtn, marginTop: "0.5rem" }}>Or take the full assessment →</a></div>
              : !insights ? (
                <div style={s.emptyState}><BotanicalMark size={48}/><h2 style={s.emptyTitle}>Ready to find your patterns?</h2><p style={s.emptyDesc}>Care Compass will analyze your {entries.length} entries across {uniqueDaysLogged} days and surface connections between your symptoms, food, activity, sleep, and stress.</p><button onClick={handleInsights} disabled={loadingInsights} style={s.addBtn}>{loadingInsights ? "Analyzing… 🌿" : "Analyze My Patterns →"}</button></div>
              ) : (
                <div style={s.insightsWrap}>
                  <div style={s.insightsHeader}><h2 style={s.insightsTitle}>Your Pattern Insights</h2><p style={s.insightsMeta}>Based on {entries.length} entries · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div>
                  <div style={s.disclaimer}><strong>Important:</strong> These are patterns to explore with your doctor — not medical advice or diagnosis.</div>
                  <div style={s.insightsContent}>
                    {insights.split("\n").filter(l => l.trim()).map((line, i) => {
                      if (line.startsWith("##")) return <h3 key={i} style={s.insightSection}>{line.replace(/^##\s*/, "")}</h3>;
                      if (line.startsWith("- ")) return <div key={i} style={s.insightBullet}><span style={s.bulletDot}>•</span><span>{line.replace(/^- /, "").replace(/\*\*(.*?)\*\*/g, "$1")}</span></div>;
                      return <p key={i} style={s.insightPara}>{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
                    })}
                  </div>
                  <button onClick={handleInsights} style={s.rerunBtn}>Re-run Analysis →</button>
                </div>
              )}
            </div>
          )}

          {view === "report" && (
            <div style={s.tabContent}>
              {entries.length === 0 ? <div style={s.emptyState}><p style={s.emptyDesc}>No entries yet.</p></div> : (
                <div style={s.reportWrap}>
                  <div style={s.reportTopBar} className="no-print"><p style={s.reportTopNote}>Formatted for your doctor. Print or save as PDF.</p><button onClick={handlePrint} style={s.printBtn}>↓ Save as PDF</button></div>
                  <div style={s.reportCard}>
                    <div style={s.reportHead}><BotanicalMark size={44}/><div><p style={s.reportEyebrow}>Care Compass Health Report</p><h2 style={s.reportTitle}>Symptom Tracking Summary</h2><p style={s.reportMeta}>Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {entries.length} entries over {new Set(entries.map(e => new Date(e.timestamp).toDateString())).size} days</p></div></div>
                    <div style={s.reportSection}><h3 style={s.reportSectionTitle}>Severity Over Time</h3><LineChart entries={entries} field="severity" color={SAGE}/></div>
                    <div style={s.reportSection}>
                      <h3 style={s.reportSectionTitle}>Detailed Entry Log</h3>
                      <table style={s.reportTable}>
                        <thead><tr>{["Date & Time","Severity","Symptoms","Food","Medications","Activity","Sleep","Stress","Notes"].map(h => <th key={h} style={s.reportTh}>{h}</th>)}</tr></thead>
                        <tbody>{[...entries].reverse().map((e, i) => (
                          <tr key={e.id} style={{ background: i % 2 === 0 ? "#fff" : OFF_WHITE }}>
                            <td style={s.reportTd}>{new Date(e.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}<br/><span style={{ fontSize: "0.72rem", color: "#aaa" }}>{new Date(e.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span></td>
                            <td style={{ ...s.reportTd, textAlign: "center" }}><span style={{ ...s.severityBadge, background: severityColor(e.severity), fontSize: "0.72rem" }}>{e.severity}/10</span></td>
                            <td style={s.reportTd}>{e.symptoms || "—"}</td>
                            <td style={s.reportTd}>{e.food || "—"}</td>
                            <td style={s.reportTd}>{e.medications || "—"}</td>
                            <td style={s.reportTd}>{e.activity || "—"}</td>
                            <td style={s.reportTd}>{e.sleep != null ? `${e.sleep}/10` : "—"}</td>
                            <td style={s.reportTd}>{e.stress}/10</td>
                            <td style={s.reportTd}>{e.notes || "—"}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                    <div style={s.reportFooter}><p style={s.reportFooterText}>Generated by Care Compass · joincarecompass.com · Not medical advice.</p></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div style={s.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}><h2 style={s.modalTitle}>{editingEntry ? "Edit entry" : "Log an entry"}</h2><button onClick={() => setShowForm(false)} style={s.modalClose}>✕</button></div>
            <div style={s.modalBody}>
              <div style={s.formGroup}><label style={s.label}>What symptoms are you experiencing?</label><textarea value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} placeholder="Describe what you're feeling right now…" style={s.textarea} rows={3}/></div>
              <div style={s.formGroup}><label style={s.label}>Symptom severity right now</label><SeveritySlider value={form.severity} onChange={v => setForm(f => ({ ...f, severity: v }))}/></div>
              <div style={s.formRow}>
                <div style={s.formGroup}><label style={s.label}>Food & Drink</label><textarea value={form.food} onChange={e => setForm(f => ({ ...f, food: e.target.value }))} placeholder="Have you eaten or had anything to drink?" style={s.textarea} rows={2}/></div>
                <div style={s.formGroup}>
                  <label style={s.label}>Medications taken</label>
                  <textarea value={form.medications} onChange={e => setForm(f => ({ ...f, medications: e.target.value }))} placeholder="Any medications or supplements?" style={s.textarea} rows={2}/>
                  <label style={s.uploadLabel}>
                    <span style={s.uploadBtn}>📎 Upload medication list</span>
                    <input type="file" accept=".txt,.pdf,.csv" style={{ display: "none" }} onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = evt => setForm(f => ({ ...f, medications: f.medications ? f.medications + "\n" + evt.target.result.slice(0, 500) : evt.target.result.slice(0, 500) }));
                      reader.readAsText(file);
                    }}/>
                  </label>
                </div>
              </div>
              <div style={s.formRow}>
                <div style={s.formGroup}><label style={s.label}>Activity</label><input value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))} placeholder="e.g. 30 min walk, rest day…" style={s.input}/></div>
                <div style={s.formGroup}><label style={s.label}>Weather / environment</label><input value={form.weather} onChange={e => setForm(f => ({ ...f, weather: e.target.value }))} placeholder="e.g. hot, humid, cold, indoors…" style={s.input}/></div>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Stress level <span style={s.sevValue}>{form.stress}/10</span></label>
                <input type="range" min="1" max="10" step="1" value={form.stress} onChange={e => setForm(f => ({ ...f, stress: Number(e.target.value) }))} style={{ width: "100%", accentColor: SAGE_DARK }}/>
                <div style={s.sevLabels}><span style={s.sevLabel}>Low</span><span style={s.sevLabel}>High</span></div>
              </div>
              {form.sleep != null && (
                <div style={s.formGroup}>
                  <label style={s.label}>Sleep quality last night <span style={s.sevValue}>{form.sleep}/10</span></label>
                  <input type="range" min="1" max="10" step="1" value={form.sleep} onChange={e => setForm(f => ({ ...f, sleep: Number(e.target.value) }))} style={{ width: "100%", accentColor: TEAL }}/>
                  <div style={s.sevLabels}><span style={s.sevLabel}>Poor</span><span style={s.sevLabel}>Excellent</span></div>
                </div>
              )}
              <div style={s.formGroup}><label style={s.label}>Additional notes <span style={s.optional}>(optional)</span></label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Anything else worth noting…" style={s.textarea} rows={2}/></div>
            </div>
            <div style={s.modalFooter}><button onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancel</button><button onClick={handleSubmit} style={s.saveBtn}>{editingEntry ? "Update Entry →" : "Save Entry →"}</button></div>
          </div>
        </div>
      )}

      <footer style={s.footer} className="no-print">
        <p style={s.footerText}>© {new Date().getFullYear()} Care Compass · <a href="mailto:hello@joincarecompass.com" style={s.footerLink}>hello@joincarecompass.com</a></p>
        <p style={s.footerDisclaimer}>Care Compass is not a medical service and does not provide medical advice, diagnosis, or treatment.</p>
      </footer>
    </div>
  );
}

const s = {
  root: { fontFamily: "'DM Sans', Helvetica, sans-serif", color: INK, background: OFF_WHITE, minHeight: "100vh", display: "flex", flexDirection: "column" },
  nav: { padding: "1rem 2rem", borderBottom: `1px solid rgba(0,0,0,0.07)`, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 },
  navLogo: { display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" },
  navLogoText: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: SAGE_DARK },
  navLinks: { display: "flex", alignItems: "center", gap: "1.5rem" },
  navLink: { fontSize: "0.875rem", color: WARM_GRAY, textDecoration: "none" },
  navActive: { fontSize: "0.875rem", color: SAGE_DARK, fontWeight: 600 },
  main: { flex: 1, padding: "2.5rem 1.5rem" },
  container: { maxWidth: 860, margin: "0 auto" },
  header: { marginBottom: "0.5rem" },
  eyebrow: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.35rem" },
  title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: INK, margin: "0 0 0.5rem", letterSpacing: "-0.02em" },
  subtitle: { fontSize: "0.95rem", color: WARM_GRAY, lineHeight: 1.7, margin: 0 },
  addBtnWrap: { display: "flex", justifyContent: "center", margin: "1.25rem 0 1.5rem" },
  addBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.85rem 2.25rem", borderRadius: "100px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" },
  statCard: { background: "#fff", borderRadius: "0.75rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1rem", textAlign: "center" },
  statLabel: { fontSize: "0.75rem", color: WARM_GRAY, margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" },
  statValue: { fontSize: "1.75rem", fontWeight: 700, color: SAGE_DARK, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" },
  tabs: { display: "flex", borderBottom: `1px solid rgba(0,0,0,0.08)`, marginBottom: "1.5rem", gap: "0.1rem", overflowX: "auto" },
  tab: { padding: "0.75rem 1rem", background: "transparent", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", fontSize: "0.875rem", fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap" },
  tabContent: { minHeight: 300 },
  savedBanner: { background: SAGE_LIGHT, color: SAGE_DARK, padding: "0.75rem 1.25rem", borderRadius: "0.75rem", fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", textAlign: "center" },
  chartCard: { background: "#fff", borderRadius: "1rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1.5rem", marginBottom: "1.5rem" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" },
  chartTitle: { fontSize: "0.85rem", fontWeight: 600, color: WARM_GRAY, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" },
  chartSelector: { display: "flex", gap: "0.4rem", flexWrap: "wrap" },
  chartOptBtn: { padding: "0.35rem 0.85rem", borderRadius: "100px", border: "1px solid", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },
  chartEmpty: { fontSize: "0.9rem", color: "#aaa", textAlign: "center", padding: "2rem" },
  recentEntries: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  recentHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.25rem" },
  dateFilterWrap: { display: "flex", gap: "0.3rem" },
  dateFilterBtn: { padding: "0.3rem 0.75rem", borderRadius: "100px", border: "1px solid", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },
  noEntriesMsg: { fontSize: "0.9rem", color: "#aaa", textAlign: "center", padding: "2rem 0", margin: 0 },
  sectionLabel: { fontSize: "0.8rem", fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.75rem" },
  entryCard: { background: "#fff", borderRadius: "0.75rem", border: `1px solid rgba(0,0,0,0.07)`, overflow: "hidden" },
  entryCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "1rem 1.25rem", cursor: "pointer", gap: "0.5rem" },
  entryCardLeft: { display: "flex", alignItems: "flex-start", gap: "0.75rem", flex: 1, minWidth: 0 },
  entryCardRight: { display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 },
  severityBadge: { color: "#fff", fontSize: "0.8rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: "100px", whiteSpace: "nowrap", flexShrink: 0 },
  entryDate: { fontSize: "0.78rem", color: WARM_GRAY, margin: "0 0 0.2rem" },
  entryPreview: { fontSize: "0.9rem", color: INK, margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  expandChevron: { fontSize: "0.7rem", color: "#aaa" },
  editEntryBtn: { background: "transparent", border: `1px solid ${SAGE}`, color: SAGE_DARK, fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "100px", cursor: "pointer", fontFamily: "inherit" },
  deleteBtn: { background: "transparent", border: "none", color: "#ccc", cursor: "pointer", fontSize: "0.8rem", padding: "0.25rem 0.5rem" },
  entryDetail: { padding: "0.75rem 1.25rem 1rem", borderTop: `1px solid rgba(0,0,0,0.05)`, display: "flex", flexDirection: "column", gap: "0.5rem" },
  detailRow: { display: "flex", gap: "1rem", alignItems: "flex-start" },
  detailLabel: { fontSize: "0.78rem", fontWeight: 600, color: WARM_GRAY, minWidth: 110, flexShrink: 0 },
  detailValue: { fontSize: "0.875rem", color: INK, lineHeight: 1.6 },
  viewAllBtn: { background: "transparent", border: `1px solid ${SAGE}`, color: SAGE_DARK, padding: "0.6rem 1.25rem", borderRadius: "100px", fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit", alignSelf: "flex-start", marginTop: "0.5rem" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "4rem 2rem", textAlign: "center" },
  emptyTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: 0 },
  emptyDesc: { fontSize: "0.95rem", color: WARM_GRAY, lineHeight: 1.75, maxWidth: 420, margin: 0 },
  trendsWrap: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  trendsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" },
  trendsSummary: { display: "flex", gap: "1.5rem", background: "#fff", borderRadius: "1rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1.25rem 1.5rem" },
  trendsStat: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  trendsStatVal: { fontSize: "1.5rem", fontWeight: 700, color: SAGE_DARK, fontFamily: "'Playfair Display', Georgia, serif" },
  trendsStatLabel: { fontSize: "0.75rem", color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.05em" },
  periodToggle: { display: "flex", gap: "0.25rem", background: SAGE_LIGHT, borderRadius: "100px", padding: "0.2rem" },
  periodBtn: { padding: "0.35rem 1rem", borderRadius: "100px", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },
  trendsCards: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  trendCard: { background: "#fff", borderRadius: "0.75rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" },
  trendCardLeft: { display: "flex", flexDirection: "column", gap: "0.2rem", minWidth: 140 },
  trendKeyword: { fontSize: "0.95rem", fontWeight: 600, color: INK },
  trendSubtext: { fontSize: "0.75rem", color: WARM_GRAY },
  trendBarWrap: { display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 120 },
  trendBar: { height: 8, borderRadius: 4, transition: "width 0.4s ease", minWidth: 4 },
  trendDayCount: { fontSize: "0.82rem", fontWeight: 600, color: WARM_GRAY, whiteSpace: "nowrap" },
  insightsWrap: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  insightsHeader: { paddingBottom: "1rem", borderBottom: `1px solid ${SAGE_LIGHT}` },
  insightsTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: "0 0 0.25rem" },
  insightsMeta: { fontSize: "0.8rem", color: "#aaa", margin: 0 },
  disclaimer: { background: "#fff8e8", border: `1px solid #f0d080`, borderRadius: "0.75rem", padding: "0.875rem 1.1rem", fontSize: "0.82rem", color: "#7a6020", lineHeight: 1.7 },
  insightsContent: { background: "#fff", borderRadius: "1rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" },
  insightSection: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: SAGE_DARK, margin: "0.75rem 0 0.25rem", borderBottom: `1px solid ${SAGE_LIGHT}`, paddingBottom: "0.4rem" },
  insightBullet: { display: "flex", gap: "0.75rem", fontSize: "0.92rem", color: INK_LIGHT, lineHeight: 1.7 },
  bulletDot: { color: SAGE, fontWeight: 700, flexShrink: 0 },
  insightPara: { fontSize: "0.92rem", color: INK_LIGHT, lineHeight: 1.75, margin: 0 },
  rerunBtn: { background: "transparent", border: `1.5px solid ${SAGE_DARK}`, color: SAGE_DARK, padding: "0.7rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", alignSelf: "flex-start" },
  reportWrap: { display: "flex", flexDirection: "column", gap: "1rem" },
  reportTopBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" },
  reportTopNote: { fontSize: "0.875rem", color: WARM_GRAY, margin: 0 },
  printBtn: { background: TEAL, color: "#fff", border: "none", padding: "0.7rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  reportCard: { background: "#fff", borderRadius: "1.25rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "2rem", display: "flex", flexDirection: "column", gap: "1.75rem" },
  reportHead: { display: "flex", gap: "1.25rem", alignItems: "flex-start", paddingBottom: "1.5rem", borderBottom: `1px solid ${SAGE_LIGHT}` },
  reportEyebrow: { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.35rem" },
  reportTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: INK, margin: "0 0 0.35rem" },
  reportMeta: { fontSize: "0.78rem", color: "#aaa", margin: 0 },
  reportSection: { display: "flex", flexDirection: "column", gap: "1rem" },
  reportSectionTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: SAGE_DARK, margin: 0, paddingBottom: "0.5rem", borderBottom: `1px solid ${SAGE_LIGHT}` },
  reportTable: { width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" },
  reportTh: { background: SAGE_LIGHT, color: SAGE_DARK, padding: "0.6rem 0.75rem", textAlign: "left", fontWeight: 600, fontSize: "0.76rem" },
  reportTd: { padding: "0.6rem 0.75rem", borderBottom: `1px solid rgba(0,0,0,0.05)`, verticalAlign: "top", color: INK_LIGHT, lineHeight: 1.5 },
  reportFooter: { borderTop: `1px solid ${SAGE_LIGHT}`, paddingTop: "1rem", textAlign: "center" },
  reportFooterText: { fontSize: "0.75rem", color: "#aaa", margin: 0 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" },
  modal: { background: "#fff", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 680, height: "92vh", display: "flex", flexDirection: "column", overflow: "hidden", boxSizing: "border-box" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: `1px solid rgba(0,0,0,0.07)` },
  modalTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: INK, margin: 0 },
  modalClose: { background: "transparent", border: "none", color: WARM_GRAY, fontSize: "1rem", cursor: "pointer" },
  modalBody: { flex: 1, overflowY: "auto", overflowX: "hidden", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem", boxSizing: "border-box", width: "100%" },
  modalFooter: { padding: "1rem 1.5rem", borderTop: `1px solid rgba(0,0,0,0.07)`, display: "flex", justifyContent: "flex-end", gap: "0.75rem" },
  formGroup: { display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 },
  formRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" },
  label: { fontSize: "0.85rem", fontWeight: 600, color: INK_LIGHT },
  optional: { fontWeight: 400, color: "#aaa", fontSize: "0.8rem" },
  input: { padding: "0.75rem 1rem", borderRadius: "0.65rem", border: `1.5px solid rgba(0,0,0,0.12)`, fontSize: "0.92rem", color: INK, background: OFF_WHITE, outline: "none", fontFamily: "inherit" },
  textarea: { padding: "0.75rem 1rem", borderRadius: "0.65rem", border: `1.5px solid rgba(0,0,0,0.12)`, fontSize: "0.92rem", color: INK, background: OFF_WHITE, outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 },
  sevSliderWrap: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  sevSliderRow: { display: "flex", alignItems: "center", gap: "1rem" },
  sevDisplay: { width: 48, height: 48, borderRadius: "50%", border: "2px solid", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700, flexShrink: 0, fontFamily: "inherit" },
  sevLabels: { display: "flex", justifyContent: "space-between" },
  sevLabel: { fontSize: "0.72rem", color: "#aaa" },
  sevValue: { fontWeight: 400, color: SAGE_DARK, marginLeft: "0.5rem" },
  uploadLabel: { cursor: "pointer", display: "inline-block", marginTop: "0.25rem" },
  uploadBtn: { fontSize: "0.78rem", color: SAGE_DARK, fontWeight: 600, textDecoration: "underline", textDecorationColor: "rgba(74,112,88,0.3)" },
  cancelBtn: { background: "transparent", border: `1.5px solid rgba(0,0,0,0.15)`, color: WARM_GRAY, padding: "0.7rem 1.5rem", borderRadius: "100px", fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit" },
  saveBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.7rem 1.75rem", borderRadius: "100px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  footer: { padding: "1.5rem 2rem", borderTop: `1px solid rgba(0,0,0,0.07)`, textAlign: "center" },
  footerText: { fontSize: "0.85rem", color: WARM_GRAY, margin: "0 0 0.25rem" },
  footerLink: { color: SAGE_DARK, textDecoration: "none" },
  footerDisclaimer: { fontSize: "0.75rem", color: "#aaa", margin: 0 },
  onboardingWrap: { maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", textAlign: "center", padding: "2rem 1rem" },
  onboardingTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: INK, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 },
  onboardingDesc: { fontSize: "1rem", color: WARM_GRAY, lineHeight: 1.75, margin: 0, maxWidth: 480 },
  onboardingSteps: { display: "flex", flexDirection: "column", gap: "1rem", width: "100%", textAlign: "left" },
  onboardingStep: { display: "flex", gap: "1rem", alignItems: "flex-start", background: "#fff", borderRadius: "0.875rem", padding: "1rem 1.25rem", border: "1px solid rgba(0,0,0,0.07)" },
  onboardingStepNum: { width: 28, height: 28, borderRadius: "50%", background: SAGE_DARK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0, marginTop: "0.1rem" },
  onboardingStepTitle: { fontSize: "0.9rem", fontWeight: 600, color: INK, margin: "0 0 0.2rem" },
  onboardingStepDesc: { fontSize: "0.82rem", color: WARM_GRAY, lineHeight: 1.6, margin: 0 },
  onboardingPrivacy: { display: "flex", alignItems: "center", gap: "0.5rem", background: SAGE_LIGHT, borderRadius: "0.75rem", padding: "0.875rem 1.25rem", width: "100%" },
  onboardingPrivacyText: { fontSize: "0.82rem", color: SAGE_DARK, lineHeight: 1.6, margin: 0, textAlign: "left" },
  onboardingActions: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", width: "100%" },
  onboardingBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.95rem 2.5rem", borderRadius: "100px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: "100%" },
  onboardingSecondary: { fontSize: "0.875rem", color: WARM_GRAY, textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.2)" },
  assessmentPrompt: { background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1.5rem" },
  assessmentPromptLeft: { display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1 },
  assessmentPromptTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: INK, margin: 0 },
  assessmentPromptDesc: { fontSize: "0.875rem", color: WARM_GRAY, lineHeight: 1.6, margin: 0 },
  assessmentPromptBtn: { background: SAGE_DARK, color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" },
};
