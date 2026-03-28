import { useState, useEffect, useRef } from "react";

/* ─── Brand tokens ───────────────────────────────────────────────────────── */
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

const STORAGE_KEY = "care-compass-tracker-v1";

/* ─── Botanical mark ─────────────────────────────────────────────────────── */
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

/* ─── Severity picker ────────────────────────────────────────────────────── */
function SeverityPicker({ value, onChange }) {
  return (
    <div style={s.severityRow}>
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button key={n} onClick={() => onChange(n)} style={{
          ...s.sevBtn,
          background: value === n ? severityColor(n) : SAGE_LIGHT,
          color: value === n ? "#fff" : SAGE_DARK,
          borderColor: value === n ? severityColor(n) : "transparent",
        }}>{n}</button>
      ))}
    </div>
  );
}

const severityColor = (n) => {
  if (n <= 3) return "#7a9e87";
  if (n <= 6) return "#e8a838";
  return "#c0392b";
};

/* ─── Mini chart ─────────────────────────────────────────────────────────── */
function SeverityChart({ entries }) {
  if (entries.length < 2) return (
    <div style={s.chartEmpty}>Add at least 2 entries to see your symptom trend</div>
  );

  const last14 = entries.slice(-14);
  const max = 10;
  const W = 580, H = 120, PAD = 20;
  const xStep = (W - PAD * 2) / (last14.length - 1);

  const points = last14.map((e, i) => ({
    x: PAD + i * xStep,
    y: H - PAD - ((e.severity / max) * (H - PAD * 2)),
    entry: e,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length-1].x} ${H-PAD} L ${points[0].x} ${H-PAD} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SAGE} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={SAGE} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[2,4,6,8,10].map(v => {
        const y = H - PAD - ((v / max) * (H - PAD * 2));
        return (
          <g key={v}>
            <line x1={PAD} y1={y} x2={W-PAD} y2={y} stroke="#e0dbd5" strokeWidth="0.5" strokeDasharray="4 4"/>
            <text x={PAD - 6} y={y + 4} fontSize="10" fill="#aaa" textAnchor="end">{v}</text>
          </g>
        );
      })}
      <path d={areaD} fill="url(#chartGrad)"/>
      <path d={pathD} fill="none" stroke={SAGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={severityColor(last14[i].severity)} stroke="#fff" strokeWidth="1.5"/>
      ))}
      {last14.map((e, i) => (
        <text key={i} x={points[i].x} y={H - 4} fontSize="9" fill="#aaa" textAnchor="middle">
          {new Date(e.timestamp).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
        </text>
      ))}
    </svg>
  );
}

/* ─── Entry card ─────────────────────────────────────────────────────────── */
function EntryCard({ entry, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(entry.timestamp);
  return (
    <div style={s.entryCard}>
      <div style={s.entryCardHeader} onClick={() => setExpanded(e => !e)}>
        <div style={s.entryCardLeft}>
          <div style={{ ...s.severityBadge, background: severityColor(entry.severity) }}>
            {entry.severity}/10
          </div>
          <div>
            <p style={s.entryDate}>{date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
            <p style={s.entryPreview}>{entry.symptoms || "No symptoms noted"}</p>
          </div>
        </div>
        <div style={s.entryCardRight}>
          <span style={s.expandChevron}>{expanded ? "▲" : "▼"}</span>
          <button onClick={e => { e.stopPropagation(); onDelete(entry.id); }} style={s.deleteBtn}>✕</button>
        </div>
      </div>
      {expanded && (
        <div style={s.entryDetail}>
          {entry.symptoms && <DetailRow label="Symptoms" value={entry.symptoms}/>}
          {entry.food && <DetailRow label="Food & drink" value={entry.food}/>}
          {entry.medications && <DetailRow label="Medications" value={entry.medications}/>}
          {entry.activity && <DetailRow label="Activity" value={entry.activity}/>}
          {entry.sleep && <DetailRow label="Sleep" value={`${entry.sleep}/10`}/>}
          {entry.stress && <DetailRow label="Stress" value={`${entry.stress}/10`}/>}
          {entry.weather && <DetailRow label="Weather/environment" value={entry.weather}/>}
          {entry.notes && <DetailRow label="Notes" value={entry.notes}/>}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={s.detailRow}>
      <span style={s.detailLabel}>{label}</span>
      <span style={s.detailValue}>{value}</span>
    </div>
  );
}

/* ─── Main tracker ───────────────────────────────────────────────────────── */
export default function CareCompassTracker() {
  const [entries, setEntries]     = useState([]);
  const [view, setView]           = useState("log"); // log | history | insights | report
  const [showForm, setShowForm]   = useState(false);
  const [insights, setInsights]   = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [saved, setSaved]         = useState(false);

  const [form, setForm] = useState({
    symptoms: "", severity: 5, food: "", medications: "",
    activity: "", sleep: 7, stress: 5, weather: "", notes: "",
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setEntries(JSON.parse(stored));
    } catch {}
  }, []);

  const saveEntries = (updated) => {
    setEntries(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  };

  const handleSubmit = () => {
    const entry = { ...form, id: Date.now(), timestamp: new Date().toISOString() };
    saveEntries([entry, ...entries]);
    setForm({ symptoms: "", severity: 5, food: "", medications: "", activity: "", sleep: 7, stress: 5, weather: "", notes: "" });
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDelete = (id) => {
    saveEntries(entries.filter(e => e.id !== id));
  };

  const handleInsights = async () => {
    if (entries.length < 3) return;
    setLoadingInsights(true);
    setInsights(null);
    try {
      const summary = entries.slice(0, 20).map(e =>
        `[${new Date(e.timestamp).toLocaleDateString()}] Severity: ${e.severity}/10 | Symptoms: ${e.symptoms || "none"} | Food: ${e.food || "none"} | Meds: ${e.medications || "none"} | Activity: ${e.activity || "none"} | Sleep: ${e.sleep}/10 | Stress: ${e.stress}/10 | Weather: ${e.weather || "none"} | Notes: ${e.notes || "none"}`
      ).join("\n");

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
          max_tokens: 1500,
          messages: [{
            role: "user",
            content: `You are Care Compass, a compassionate health navigation assistant. Analyze the following symptom tracker entries and identify patterns, potential triggers, and insights the user should discuss with their doctor.

TRACKER ENTRIES (most recent first):
${summary}

Please provide:
## Patterns We Notice
## Potential Triggers to Explore
## What's Improving vs Worsening
## Questions to Bring to Your Doctor

Use warm, supportive language. Never diagnose. Focus on patterns and connections across entries. Be specific about which dates or combinations seem significant.`
          }],
        }),
      });
      const data = await response.json();
      setInsights(data.content[0].text);
      setView("insights");
    } catch {
      setInsights("Something went wrong. Please try again.");
    } finally {
      setLoadingInsights(false);
    }
  };

  const handlePrint = () => {
    const style = document.createElement("style");
    style.innerHTML = `@media print { .no-print { display: none !important; } @page { margin: 1.5cm; } }`;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  const avgSeverity = entries.length
    ? (entries.reduce((sum, e) => sum + e.severity, 0) / entries.length).toFixed(1)
    : "—";

  const today = entries.filter(e =>
    new Date(e.timestamp).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div style={s.root}>
      {/* Nav */}
      <nav style={s.nav}>
        <a href="/" style={s.navLogo}>
          <BotanicalMark size={30}/>
          <span style={s.navLogoText}>Care Compass</span>
        </a>
        <div style={s.navLinks} className="no-print">
          <a href="/compass" style={s.navLink}>Assessment</a>
          <span style={s.navActive}>Tracker</span>
        </div>
      </nav>

      <main style={s.main}>
        <div style={s.container}>

          {/* Header */}
          <div style={s.header} className="no-print">
            <div>
              <p style={s.eyebrow}>Symptom Tracker</p>
              <h1 style={s.title}>Your daily health log</h1>
              <p style={s.subtitle}>Track symptoms and variables over time to uncover patterns worth sharing with your doctor.</p>
            </div>
            <button onClick={() => setShowForm(true)} style={s.addBtn}>+ Log Entry</button>
          </div>

          {/* Stats row */}
          {entries.length > 0 && (
            <div style={s.statsRow} className="no-print">
              <div style={s.statCard}>
                <p style={s.statLabel}>Total entries</p>
                <p style={s.statValue}>{entries.length}</p>
              </div>
              <div style={s.statCard}>
                <p style={s.statLabel}>Today's entries</p>
                <p style={s.statValue}>{today}</p>
              </div>
              <div style={s.statCard}>
                <p style={s.statLabel}>Avg severity</p>
                <p style={s.statValue}>{avgSeverity}</p>
              </div>
              <div style={s.statCard}>
                <p style={s.statLabel}>Days tracked</p>
                <p style={s.statValue}>{new Set(entries.map(e => new Date(e.timestamp).toDateString())).size}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={s.tabs} className="no-print">
            {[
              { id: "log", label: "Log" },
              { id: "history", label: "History" },
              { id: "insights", label: "AI Insights" },
              { id: "report", label: "Doctor Report" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setView(tab.id)} style={{
                ...s.tab,
                borderBottom: view === tab.id ? `2px solid ${SAGE_DARK}` : "2px solid transparent",
                color: view === tab.id ? SAGE_DARK : WARM_GRAY,
                fontWeight: view === tab.id ? 600 : 400,
              }}>{tab.label}</button>
            ))}
          </div>

          {/* ── Log tab ── */}
          {view === "log" && (
            <div style={s.tabContent}>
              {saved && (
                <div style={s.savedBanner}>🌿 Entry saved successfully!</div>
              )}
              {entries.length === 0 ? (
                <div style={s.emptyState}>
                  <BotanicalMark size={48}/>
                  <h2 style={s.emptyTitle}>Start tracking today</h2>
                  <p style={s.emptyDesc}>Log your first entry to begin building your health picture. The more you track, the more patterns Care Compass can surface.</p>
                  <button onClick={() => setShowForm(true)} style={s.addBtn}>+ Log Your First Entry</button>
                </div>
              ) : (
                <>
                  <div style={s.chartCard}>
                    <p style={s.chartTitle}>Symptom severity trend</p>
                    <SeverityChart entries={[...entries].reverse()}/>
                  </div>
                  <div style={s.recentEntries}>
                    <p style={s.sectionLabel}>Recent entries</p>
                    {entries.slice(0, 5).map(e => (
                      <EntryCard key={e.id} entry={e} onDelete={handleDelete}/>
                    ))}
                    {entries.length > 5 && (
                      <button onClick={() => setView("history")} style={s.viewAllBtn}>
                        View all {entries.length} entries →
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── History tab ── */}
          {view === "history" && (
            <div style={s.tabContent}>
              {entries.length === 0 ? (
                <div style={s.emptyState}>
                  <p style={s.emptyDesc}>No entries yet. Log your first entry to get started.</p>
                </div>
              ) : (
                <div style={s.recentEntries}>
                  <p style={s.sectionLabel}>All entries — {entries.length} total</p>
                  {entries.map(e => (
                    <EntryCard key={e.id} entry={e} onDelete={handleDelete}/>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Insights tab ── */}
          {view === "insights" && (
            <div style={s.tabContent}>
              {entries.length < 3 ? (
                <div style={s.emptyState}>
                  <p style={s.emptyDesc}>Log at least 3 entries before running AI pattern analysis. The more entries you have, the more meaningful the insights.</p>
                </div>
              ) : !insights ? (
                <div style={s.emptyState}>
                  <BotanicalMark size={48}/>
                  <h2 style={s.emptyTitle}>Ready to find your patterns?</h2>
                  <p style={s.emptyDesc}>Care Compass will analyze your {entries.length} entries and surface connections between your symptoms, food, activity, sleep, and stress.</p>
                  <button onClick={handleInsights} disabled={loadingInsights} style={s.addBtn}>
                    {loadingInsights ? "Analyzing your entries… 🌿" : "Analyze My Patterns →"}
                  </button>
                </div>
              ) : (
                <div style={s.insightsWrap}>
                  <div style={s.insightsHeader}>
                    <h2 style={s.insightsTitle}>Your Pattern Insights</h2>
                    <p style={s.insightsMeta}>Based on {entries.length} entries · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                  </div>
                  <div style={s.disclaimer}>
                    <strong>Important:</strong> These are patterns to explore with your doctor — not medical advice or diagnosis.
                  </div>
                  <div style={s.insightsContent}>
                    {insights.split("\n").filter(l => l.trim()).map((line, i) => {
                      if (line.startsWith("##")) return <h3 key={i} style={s.insightSection}>{line.replace(/^##\s*/, "")}</h3>;
                      if (line.startsWith("- ")) return (
                        <div key={i} style={s.insightBullet}>
                          <span style={s.bulletDot}>•</span>
                          <span>{line.replace(/^- /, "").replace(/\*\*(.*?)\*\*/g, "$1")}</span>
                        </div>
                      );
                      return <p key={i} style={s.insightPara}>{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
                    })}
                  </div>
                  <button onClick={handleInsights} style={s.rerunBtn}>Re-run Analysis →</button>
                </div>
              )}
            </div>
          )}

          {/* ── Doctor Report tab ── */}
          {view === "report" && (
            <div style={s.tabContent}>
              {entries.length === 0 ? (
                <div style={s.emptyState}>
                  <p style={s.emptyDesc}>No entries yet. Start logging to generate a doctor report.</p>
                </div>
              ) : (
                <div style={s.reportWrap}>
                  <div style={s.reportTopBar} className="no-print">
                    <p style={s.reportTopNote}>This report is formatted for your doctor. Print or save as PDF to bring to your next appointment.</p>
                    <button onClick={handlePrint} style={s.printBtn}>↓ Save as PDF</button>
                  </div>

                  {/* Report content */}
                  <div style={s.reportCard}>
                    <div style={s.reportHead}>
                      <BotanicalMark size={44}/>
                      <div>
                        <p style={s.reportEyebrow}>Care Compass Health Report</p>
                        <h2 style={s.reportTitle}>Symptom Tracking Summary</h2>
                        <p style={s.reportMeta}>Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {entries.length} entries over {new Set(entries.map(e => new Date(e.timestamp).toDateString())).size} days</p>
                      </div>
                    </div>

                    <div style={s.reportSection}>
                      <h3 style={s.reportSectionTitle}>Overview</h3>
                      <div style={s.reportStatsRow}>
                        <div style={s.reportStat}><span style={s.reportStatVal}>{entries.length}</span><span style={s.reportStatLabel}>Total entries</span></div>
                        <div style={s.reportStat}><span style={s.reportStatVal}>{avgSeverity}</span><span style={s.reportStatLabel}>Avg severity</span></div>
                        <div style={s.reportStat}><span style={s.reportStatVal}>{new Set(entries.map(e => new Date(e.timestamp).toDateString())).size}</span><span style={s.reportStatLabel}>Days tracked</span></div>
                        <div style={s.reportStat}><span style={s.reportStatVal}>{Math.max(...entries.map(e => e.severity))}/10</span><span style={s.reportStatLabel}>Peak severity</span></div>
                      </div>
                    </div>

                    <div style={s.reportSection}>
                      <h3 style={s.reportSectionTitle}>Severity Over Time</h3>
                      <SeverityChart entries={[...entries].reverse()}/>
                    </div>

                    <div style={s.reportSection}>
                      <h3 style={s.reportSectionTitle}>Detailed Entry Log</h3>
                      <table style={s.reportTable}>
                        <thead>
                          <tr>
                            {["Date & Time", "Severity", "Symptoms", "Food", "Medications", "Activity", "Notes"].map(h => (
                              <th key={h} style={s.reportTh}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...entries].reverse().map((e, i) => (
                            <tr key={e.id} style={{ background: i % 2 === 0 ? "#fff" : OFF_WHITE }}>
                              <td style={s.reportTd}>{new Date(e.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}<br/><span style={{ fontSize: "0.75rem", color: "#aaa" }}>{new Date(e.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span></td>
                              <td style={{ ...s.reportTd, textAlign: "center" }}><span style={{ ...s.severityBadge, background: severityColor(e.severity), fontSize: "0.75rem" }}>{e.severity}/10</span></td>
                              <td style={s.reportTd}>{e.symptoms || "—"}</td>
                              <td style={s.reportTd}>{e.food || "—"}</td>
                              <td style={s.reportTd}>{e.medications || "—"}</td>
                              <td style={s.reportTd}>{e.activity || "—"}</td>
                              <td style={s.reportTd}>{e.notes || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={s.reportFooter}>
                      <p style={s.reportFooterText}>Generated by Care Compass · joincarecompass.com · This report is not medical advice.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Entry form modal ── */}
      {showForm && (
        <div style={s.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Log an entry</h2>
              <button onClick={() => setShowForm(false)} style={s.modalClose}>✕</button>
            </div>
            <div style={s.modalBody}>

              <div style={s.formGroup}>
                <label style={s.label}>What symptoms are you experiencing?</label>
                <textarea
                  value={form.symptoms}
                  onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
                  placeholder="Describe what you're feeling right now…"
                  style={s.textarea} rows={3}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Symptom severity right now</label>
                <SeverityPicker value={form.severity} onChange={v => setForm(f => ({ ...f, severity: v }))}/>
                <div style={s.sevLabels}><span style={s.sevLabel}>Manageable</span><span style={s.sevLabel}>Severe</span></div>
              </div>

              <div style={s.formRow}>
                <div style={s.formGroup}>
                  <label style={s.label}>Food & drink today</label>
                  <textarea value={form.food} onChange={e => setForm(f => ({ ...f, food: e.target.value }))} placeholder="What have you eaten or drunk?" style={s.textarea} rows={2}/>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Medications taken</label>
                  <textarea value={form.medications} onChange={e => setForm(f => ({ ...f, medications: e.target.value }))} placeholder="Any medications or supplements?" style={s.textarea} rows={2}/>
                </div>
              </div>

              <div style={s.formRow}>
                <div style={s.formGroup}>
                  <label style={s.label}>Activity today</label>
                  <input value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))} placeholder="e.g. 30 min walk, rest day…" style={s.input}/>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Weather / environment</label>
                  <input value={form.weather} onChange={e => setForm(f => ({ ...f, weather: e.target.value }))} placeholder="e.g. hot, humid, cold, indoors…" style={s.input}/>
                </div>
              </div>

              <div style={s.formRow}>
                <div style={s.formGroup}>
                  <label style={s.label}>Sleep quality last night <span style={s.sevValue}>{form.sleep}/10</span></label>
                  <input type="range" min="1" max="10" value={form.sleep} onChange={e => setForm(f => ({ ...f, sleep: Number(e.target.value) }))} style={{ width: "100%" }}/>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Stress level today <span style={s.sevValue}>{form.stress}/10</span></label>
                  <input type="range" min="1" max="10" value={form.stress} onChange={e => setForm(f => ({ ...f, stress: Number(e.target.value) }))} style={{ width: "100%" }}/>
                </div>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Additional notes <span style={s.optional}>(optional)</span></label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Anything else worth noting…" style={s.textarea} rows={2}/>
              </div>

            </div>
            <div style={s.modalFooter}>
              <button onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleSubmit} style={s.saveBtn}>Save Entry →</button>
            </div>
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

/* ─── Styles ─────────────────────────────────────────────────────────────── */
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" },
  eyebrow: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.35rem" },
  title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: INK, margin: "0 0 0.5rem", letterSpacing: "-0.02em" },
  subtitle: { fontSize: "0.95rem", color: WARM_GRAY, lineHeight: 1.7, margin: 0 },
  addBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.8rem 1.75rem", borderRadius: "100px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" },
  statCard: { background: "#fff", borderRadius: "0.75rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1rem", textAlign: "center" },
  statLabel: { fontSize: "0.75rem", color: WARM_GRAY, margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" },
  statValue: { fontSize: "1.75rem", fontWeight: 700, color: SAGE_DARK, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" },
  tabs: { display: "flex", borderBottom: `1px solid rgba(0,0,0,0.08)`, marginBottom: "1.5rem", gap: "0.25rem" },
  tab: { padding: "0.75rem 1.25rem", background: "transparent", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", fontSize: "0.9rem", fontFamily: "inherit", transition: "all 0.2s" },
  tabContent: { minHeight: 300 },
  chartCard: { background: "#fff", borderRadius: "1rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1.5rem", marginBottom: "1.5rem" },
  chartTitle: { fontSize: "0.85rem", fontWeight: 600, color: WARM_GRAY, margin: "0 0 1rem", textTransform: "uppercase", letterSpacing: "0.05em" },
  chartEmpty: { fontSize: "0.9rem", color: "#aaa", textAlign: "center", padding: "2rem" },
  recentEntries: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  sectionLabel: { fontSize: "0.8rem", fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.75rem" },
  entryCard: { background: "#fff", borderRadius: "0.75rem", border: `1px solid rgba(0,0,0,0.07)`, overflow: "hidden" },
  entryCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", cursor: "pointer" },
  entryCardLeft: { display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 },
  entryCardRight: { display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 },
  severityBadge: { color: "#fff", fontSize: "0.8rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: "100px", whiteSpace: "nowrap", flexShrink: 0 },
  entryDate: { fontSize: "0.78rem", color: WARM_GRAY, margin: "0 0 0.2rem" },
  entryPreview: { fontSize: "0.9rem", color: INK, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 400 },
  expandChevron: { fontSize: "0.7rem", color: "#aaa" },
  deleteBtn: { background: "transparent", border: "none", color: "#ccc", cursor: "pointer", fontSize: "0.8rem", padding: "0.25rem 0.5rem" },
  entryDetail: { padding: "0 1.25rem 1rem", borderTop: `1px solid rgba(0,0,0,0.05)`, display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "0.75rem" },
  detailRow: { display: "flex", gap: "1rem", alignItems: "flex-start" },
  detailLabel: { fontSize: "0.78rem", fontWeight: 600, color: WARM_GRAY, minWidth: 120, flexShrink: 0 },
  detailValue: { fontSize: "0.875rem", color: INK, lineHeight: 1.6 },
  viewAllBtn: { background: "transparent", border: `1px solid ${SAGE}`, color: SAGE_DARK, padding: "0.6rem 1.25rem", borderRadius: "100px", fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit", alignSelf: "flex-start", marginTop: "0.5rem" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "4rem 2rem", textAlign: "center" },
  emptyTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: 0 },
  emptyDesc: { fontSize: "0.95rem", color: WARM_GRAY, lineHeight: 1.75, maxWidth: 420, margin: 0 },
  savedBanner: { background: SAGE_LIGHT, color: SAGE_DARK, padding: "0.75rem 1.25rem", borderRadius: "0.75rem", fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", textAlign: "center" },
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
  reportStatsRow: { display: "flex", gap: "1.5rem", flexWrap: "wrap" },
  reportStat: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", minWidth: 80 },
  reportStatVal: { fontSize: "2rem", fontWeight: 700, color: SAGE_DARK, fontFamily: "'Playfair Display', Georgia, serif" },
  reportStatLabel: { fontSize: "0.75rem", color: WARM_GRAY, textAlign: "center" },
  reportTable: { width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" },
  reportTh: { background: SAGE_LIGHT, color: SAGE_DARK, padding: "0.6rem 0.75rem", textAlign: "left", fontWeight: 600, fontSize: "0.78rem" },
  reportTd: { padding: "0.6rem 0.75rem", borderBottom: `1px solid rgba(0,0,0,0.05)`, verticalAlign: "top", color: INK_LIGHT, lineHeight: 1.5 },
  reportFooter: { borderTop: `1px solid ${SAGE_LIGHT}`, paddingTop: "1rem", textAlign: "center" },
  reportFooterText: { fontSize: "0.75rem", color: "#aaa", margin: 0 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" },
  modal: { background: "#fff", borderRadius: "1.25rem", width: "100%", maxWidth: 680, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: `1px solid rgba(0,0,0,0.07)` },
  modalTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: INK, margin: 0 },
  modalClose: { background: "transparent", border: "none", color: WARM_GRAY, fontSize: "1rem", cursor: "pointer" },
  modalBody: { flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
  modalFooter: { padding: "1rem 1.5rem", borderTop: `1px solid rgba(0,0,0,0.07)`, display: "flex", justifyContent: "flex-end", gap: "0.75rem" },
  formGroup: { display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  label: { fontSize: "0.85rem", fontWeight: 600, color: INK_LIGHT },
  optional: { fontWeight: 400, color: "#aaa", fontSize: "0.8rem" },
  input: { padding: "0.75rem 1rem", borderRadius: "0.65rem", border: `1.5px solid rgba(0,0,0,0.12)`, fontSize: "0.92rem", color: INK, background: OFF_WHITE, outline: "none", fontFamily: "inherit" },
  textarea: { padding: "0.75rem 1rem", borderRadius: "0.65rem", border: `1.5px solid rgba(0,0,0,0.12)`, fontSize: "0.92rem", color: INK, background: OFF_WHITE, outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 },
  severityRow: { display: "flex", gap: "0.35rem", flexWrap: "wrap" },
  sevBtn: { width: 38, height: 38, borderRadius: "50%", border: "2px solid transparent", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s" },
  sevLabels: { display: "flex", justifyContent: "space-between" },
  sevLabel: { fontSize: "0.72rem", color: "#aaa" },
  sevValue: { fontWeight: 400, color: SAGE_DARK, marginLeft: "0.5rem" },
  cancelBtn: { background: "transparent", border: `1.5px solid rgba(0,0,0,0.15)`, color: WARM_GRAY, padding: "0.7rem 1.5rem", borderRadius: "100px", fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit" },
  saveBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.7rem 1.75rem", borderRadius: "100px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  footer: { padding: "1.5rem 2rem", borderTop: `1px solid rgba(0,0,0,0.07)`, textAlign: "center" },
  footerText: { fontSize: "0.85rem", color: WARM_GRAY, margin: "0 0 0.25rem" },
  footerLink: { color: SAGE_DARK, textDecoration: "none" },
  footerDisclaimer: { fontSize: "0.75rem", color: "#aaa", margin: 0 },
};
