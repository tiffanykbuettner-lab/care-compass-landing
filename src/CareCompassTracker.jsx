import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const INSIGHTS_LOADING_STYLES = `
@keyframes insightProgress {
  0% { width: 0%; }
  10% { width: 12%; }
  30% { width: 35%; }
  60% { width: 62%; }
  80% { width: 78%; }
  95% { width: 90%; }
  100% { width: 94%; }
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
const STORAGE_KEY = "care-compass-tracker-v1";
const BP_STORAGE_KEY = "care-compass-bp-v1";
const BP_REMINDERS_KEY = "care-compass-bp-reminders-v1";
const MED_STORAGE_KEY = "care-compass-medications-v1";

const BotanicalMark = ({ size = 32 }) => (
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


const bpCategory = (systolic, diastolic) => {
  if (systolic < 120 && diastolic < 80) return { label: "Normal", color: "#4a7058", bg: "#e8f0eb" };
  if (systolic < 130 && diastolic < 80) return { label: "Elevated", color: "#8a5a00", bg: "#fef3da" };
  if (systolic < 140 || diastolic < 90) return { label: "High Stage 1", color: "#c0392b", bg: "#fdeaea" };
  if (systolic >= 140 || diastolic >= 90) return { label: "High Stage 2", color: "#922b21", bg: "#f5b7b1" };
  return { label: "Unknown", color: "#aaa", bg: "#f5f5f5" };
};

const formatBPTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

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
          <button onClick={e => { e.stopPropagation(); onDelete(entry.id); }} style={{ ...s.deleteBtn, color: "#ddd" }} title="Delete entry">✕</button>
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
          {entry.photos && entry.photos.length > 0 && (
            <div style={s.entryPhotos}>
              <span style={s.detailLabel}>Photos</span>
              <div style={s.entryPhotoRow}>
                {entry.photos.map((photo, idx) => (
                  <img key={idx} src={photo.data} alt={photo.name} style={s.entryPhotoThumb}
                    onClick={() => window.open(photo.data, "_blank")}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const DR = ({ label, value }) => (
  <div style={s.detailRow}><span style={s.detailLabel}>{label}</span><span style={s.detailValue}>{value}</span></div>
);



function BPTimePicker({ value, onChange, style = {} }) {
  const parse = (val) => {
    const [hh, mm] = (val || "08:00").split(":").map(Number);
    return { h: hh % 12 || 12, m: mm, period: hh >= 12 ? "PM" : "AM" };
  };
  const toValue = (h, m, period) => {
    let h24 = h % 12;
    if (period === "PM") h24 += 12;
    return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  const { h, m, period } = parse(value);
  const hours = [12,1,2,3,4,5,6,7,8,9,10,11];
  const minutes = [0,5,10,15,20,25,30,35,40,45,50,55];
  const sel = {
    border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "0.5rem",
    padding: "0.55rem 0.5rem", fontSize: "0.9rem", color: INK,
    background: "#fff", outline: "none", cursor: "pointer",
    fontFamily: "inherit", appearance: "none", WebkitAppearance: "none",
    textAlign: "center", ...style,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <select value={h} onChange={e => onChange(toValue(Number(e.target.value), m, period))} style={{ ...sel, width: 52 }}>
        {hours.map(hr => <option key={hr} value={hr}>{hr}</option>)}
      </select>
      <span style={{ fontSize: "1.1rem", color: WARM_GRAY, fontWeight: 500 }}>:</span>
      <select value={m} onChange={e => onChange(toValue(h, Number(e.target.value), period))} style={{ ...sel, width: 52 }}>
        {minutes.map(min => <option key={min} value={min}>{String(min).padStart(2, "0")}</option>)}
      </select>
      <select value={period} onChange={e => onChange(toValue(h, m, e.target.value))} style={{ ...sel, width: 56 }}>
        <option>AM</option>
        <option>PM</option>
      </select>
    </div>
  );
}

function BPChart({ readings }) {
  if (readings.length < 2) return <div style={s.chartEmpty}>Add at least 2 readings to see your trend</div>;
  const last30 = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(-30);
  const W = 580, H = 140, PAD = 24;
  const maxSys = Math.max(...last30.map(r => r.systolic), 160);
  const minSys = Math.min(...last30.map(r => r.systolic), 90);
  const range = maxSys - minSys || 40;
  const xStep = (W - PAD * 2) / Math.max(last30.length - 1, 1);
  const toY = (v) => H - PAD - ((v - minSys) / range) * (H - PAD * 2);
  const sysPoints = last30.map((r, i) => ({ x: PAD + i * xStep, y: toY(r.systolic) }));
  const diaPoints = last30.map((r, i) => ({ x: PAD + i * xStep, y: toY(r.diastolic) }));
  const sysPath = sysPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const diaPath = diaPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  // Normal range band (systolic 90-120)
  const normalTop = toY(120);
  const normalBot = toY(Math.max(minSys, 90));
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        {/* Normal range band */}
        {normalBot > normalTop && (
          <rect x={PAD} y={normalTop} width={W - PAD * 2} height={normalBot - normalTop} fill="#e8f0eb" opacity="0.5" rx="2"/>
        )}
        {/* Grid lines */}
        {[100, 120, 140, 160].filter(v => v >= minSys && v <= maxSys + 10).map(v => {
          const y = toY(v);
          return <g key={v}><line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#e0dbd5" strokeWidth="0.5" strokeDasharray="4 4"/><text x={PAD - 6} y={y + 4} fontSize="9" fill="#aaa" textAnchor="end">{v}</text></g>;
        })}
        {/* Diastolic line */}
        <path d={diaPath} fill="none" stroke={TEAL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3"/>
        {diaPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={TEAL} stroke="#fff" strokeWidth="1.5"/>)}
        {/* Systolic line */}
        <path d={sysPath} fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {sysPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={bpCategory(last30[i].systolic, last30[i].diastolic).color} stroke="#fff" strokeWidth="1.5"/>)}
        {/* Date labels */}
        {last30.map((r, i) => i % Math.ceil(last30.length / 7) === 0 && (
          <text key={i} x={sysPoints[i].x} y={H - 4} fontSize="9" fill="#aaa" textAnchor="middle">
            {new Date(r.timestamp).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
          </text>
        ))}
      </svg>
      <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem", fontSize: "0.78rem", color: WARM_GRAY }}>
        <span><span style={{ display: "inline-block", width: 16, height: 3, background: "#c0392b", borderRadius: 2, verticalAlign: "middle", marginRight: 4 }}/>Systolic</span>
        <span><span style={{ display: "inline-block", width: 16, height: 2, background: TEAL, borderRadius: 2, verticalAlign: "middle", marginRight: 4, borderTop: "2px dashed " + TEAL }}/>Diastolic</span>
        <span><span style={{ display: "inline-block", width: 16, height: 8, background: "#e8f0eb", borderRadius: 2, verticalAlign: "middle", marginRight: 4 }}/>Normal range</span>
      </div>
    </div>
  );
}

function BPReadingCard({ reading, onDelete }) {
  const cat = bpCategory(reading.systolic, reading.diastolic);
  return (
    <div style={{ background: "#fff", borderRadius: "0.875rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ textAlign: "center", minWidth: 72 }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: cat.color, lineHeight: 1 }}>
            {reading.systolic}<span style={{ fontSize: "0.9rem", fontWeight: 400, color: WARM_GRAY }}>/</span>{reading.diastolic}
          </div>
          <div style={{ fontSize: "0.7rem", color: WARM_GRAY, marginTop: 2 }}>mmHg</div>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
            <span style={{ background: cat.bg, color: cat.color, fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "100px" }}>{cat.label}</span>
            {reading.pulse && <span style={{ fontSize: "0.75rem", color: WARM_GRAY }}>♥ {reading.pulse} bpm</span>}
            {reading.arm && <span style={{ fontSize: "0.72rem", color: "#aaa" }}>{reading.arm} arm</span>}
          </div>
          <div style={{ fontSize: "0.78rem", color: WARM_GRAY }}>{formatBPTime(reading.timestamp)}</div>
          {reading.notes && <div style={{ fontSize: "0.78rem", color: INK_LIGHT, marginTop: "0.25rem", fontStyle: "italic" }}>{reading.notes}</div>}
          {reading.position && <div style={{ fontSize: "0.72rem", color: "#aaa" }}>{reading.position}</div>}
        </div>
      </div>
      <button onClick={() => onDelete(reading.id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: "1rem", padding: "0.25rem", flexShrink: 0 }}>✕</button>
    </div>
  );
}


/* ─── Med picker in log modal ───────────────────────────────────────────── */
function MedPicker({ medications, selectedIds, onToggle, onAddAll, manualText, onManualChange, onSaveUnlisted }) {
  const [showList, setShowList] = React.useState(false);
  const selectedMeds = medications.filter(m => selectedIds.includes(m.id));
  const hasSelected = selectedMeds.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>

      {/* ── Pill tag row for selected meds ── */}
      {hasSelected && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {selectedMeds.map(med => (
            <span
              key={med.id}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: SAGE_LIGHT, color: SAGE_DARK, borderRadius: "100px", padding: "0.25rem 0.75rem", fontSize: "0.78rem", fontWeight: 600 }}
            >
              {med.name}{med.dose ? ` ${med.dose}` : ""}
              <button
                onClick={() => onToggle(med.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: SAGE_DARK, fontSize: "0.85rem", padding: 0, lineHeight: 1, display: "flex", alignItems: "center" }}
              >×</button>
            </span>
          ))}
        </div>
      )}

      {/* ── Expandable medication list ── */}
      {medications.length > 0 && (
        <div style={{ border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: "0.75rem", overflow: "hidden" }}>
          {/* Header / toggle */}
          <button
            onClick={() => setShowList(s => !s)}
            style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.9rem", background: showList ? SAGE_LIGHT : "#fafaf8", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: SAGE_DARK }}>
              {hasSelected ? `${selectedMeds.length} selected` : "Select from your medications"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {!hasSelected && medications.length > 0 && (
                <span
                  onClick={e => { e.stopPropagation(); onAddAll(); }}
                  style={{ fontSize: "0.72rem", fontWeight: 600, color: SAGE_DARK, background: "rgba(74,112,88,0.1)", borderRadius: "100px", padding: "0.15rem 0.6rem", cursor: "pointer" }}
                >Add all</span>
              )}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: showList ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: SAGE_DARK }}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>

          {/* Checkbox list */}
          {showList && (
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "0.5rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.1rem", maxHeight: "200px", overflowY: "auto" }}>
              {medications.map(med => (
                <label key={med.id} style={{ display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer", padding: "0.4rem 0.25rem", borderRadius: "0.4rem" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(med.id)}
                    onChange={() => onToggle(med.id)}
                    style={{ accentColor: SAGE_DARK, width: 15, height: 15, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: "0.875rem", color: INK, flex: 1 }}>
                    {med.name}
                    {med.dose && <span style={{ color: WARM_GRAY, marginLeft: "0.35rem", fontSize: "0.82rem" }}>{med.dose}</span>}
                    {med.frequency && <span style={{ color: "#bbb", marginLeft: "0.35rem", fontSize: "0.75rem" }}>· {med.frequency}</span>}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Other / unlisted ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4a4540" }}>
          {medications.length > 0 ? "Other / unlisted medications" : "Medications taken"}
        </span>
        <textarea
          value={manualText}
          onChange={e => onManualChange(e.target.value)}
          placeholder={medications.length > 0 ? "Any other medications not in your list..." : "Any medications or supplements?"}
          rows={2}
          style={{ padding: "0.65rem 0.9rem", borderRadius: "0.65rem", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "0.875rem", color: INK, background: "#fafaf8", outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", width: "100%" }}
        />
        {/* Save unlisted to list option */}
        {manualText.trim() && (
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.75rem", color: SAGE_DARK }}>
            <input
              type="checkbox"
              checked={onSaveUnlisted?.enabled || false}
              onChange={() => onSaveUnlisted?.toggle()}
              style={{ accentColor: SAGE_DARK, width: 13, height: 13 }}
            />
            Save to my medication list in Account Settings
          </label>
        )}
      </div>
    </div>
  );
}

/* ─── Frequency options ──────────────────────────────────────────────────── */
const FREQUENCIES = [
  "Once daily", "Twice daily", "Three times daily", "Every 4 hours",
  "Every 6 hours", "Every 8 hours", "Weekly", "As needed (PRN)",
  "With meals", "At bedtime", "Other",
];


/* ─── Report: Severity bar chart (daily avg) ─────────────────────────────── */
function SeverityBarChart({ entries }) {
  const last30 = (() => {
    const byDay = {};
    entries.forEach(e => {
      const day = new Date(e.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!byDay[day]) byDay[day] = { total: 0, count: 0, date: new Date(e.timestamp) };
      byDay[day].total += e.severity;
      byDay[day].count += 1;
    });
    return Object.entries(byDay)
      .sort((a, b) => a[1].date - b[1].date)
      .slice(-30)
      .map(([day, d]) => ({ day, avg: d.total / d.count }));
  })();
  if (last30.length < 2) return null;
  const W = 560, H = 120, PAD = 20, barW = Math.min(18, (W - PAD * 2) / last30.length - 2);
  const xStep = (W - PAD * 2) / last30.length;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 24}`} style={{ overflow: "visible" }}>
      {[2,4,6,8,10].map(v => {
        const y = H - PAD - ((v / 10) * (H - PAD * 2));
        return <g key={v}>
          <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#e8e4e0" strokeWidth="0.5" strokeDasharray="3 3"/>
          <text x={PAD - 4} y={y + 4} fontSize="9" fill="#bbb" textAnchor="end">{v}</text>
        </g>;
      })}
      {last30.map((d, i) => {
        const barH = Math.max(2, (d.avg / 10) * (H - PAD * 2));
        const x = PAD + i * xStep + xStep / 2 - barW / 2;
        const y = H - PAD - barH;
        const col = d.avg <= 3 ? "#7a9e87" : d.avg <= 6 ? "#e8a838" : "#c0392b";
        return <g key={i}>
          <rect x={x} y={y} width={barW} height={barH} fill={col} rx="2" opacity="0.85"/>
          {last30.length <= 14 && <text x={x + barW/2} y={H + 14} fontSize="8" fill="#aaa" textAnchor="middle">{d.day}</text>}
        </g>;
      })}
      {last30.length > 14 && (
        <>
          <text x={PAD} y={H + 14} fontSize="8" fill="#aaa" textAnchor="start">{last30[0].day}</text>
          <text x={W - PAD} y={H + 14} fontSize="8" fill="#aaa" textAnchor="end">{last30[last30.length - 1].day}</text>
        </>
      )}
    </svg>
  );
}

/* ─── Report: Symptom frequency horizontal bars ──────────────────────────── */
function SymptomFrequencyChart({ entries }) {
  const KEYWORDS = ["headache","migraine","fatigue","pain","dizziness","nausea","brain fog",
    "palpitation","anxiety","insomnia","bloating","reflux","rash","swelling","stiffness",
    "cramp","shortness of breath","numbness","tingling","joint","muscle","depression",
    "diarrhea","constipation","fever","cough","chest pain","tachycardia","syncope"];
  const days = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size || 1;
  const counts = {};
  entries.forEach(e => {
    if (!e.symptoms) return;
    const text = e.symptoms.toLowerCase();
    KEYWORDS.forEach(kw => { if (text.includes(kw)) counts[kw] = (counts[kw] || 0) + 1; });
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (!top.length) return <p style={{ fontSize: "0.8rem", color: "#aaa", fontStyle: "italic" }}>No recognizable symptom keywords found.</p>;
  const max = top[0][1];
  const W = 560, rowH = 22, PAD = 140;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${top.length * rowH + 8}`} style={{ overflow: "visible" }}>
      {top.map(([kw, count], i) => {
        const barW = Math.max(4, ((count / max) * (W - PAD - 60)));
        const pct = Math.round((count / days) * 100);
        const col = pct >= 60 ? "#c0392b" : pct >= 30 ? "#e8a838" : "#7a9e87";
        return <g key={kw} transform={`translate(0, ${i * rowH + 4})`}>
          <text x={PAD - 8} y={14} fontSize="11" fill="#4a4540" textAnchor="end" style={{ textTransform: "capitalize" }}>
            {kw.charAt(0).toUpperCase() + kw.slice(1)}
          </text>
          <rect x={PAD} y={4} width={barW} height={14} fill={col} rx="2" opacity="0.75"/>
          <text x={PAD + barW + 6} y={14} fontSize="10" fill="#888">{count}x · {pct}% of days</text>
        </g>;
      })}
    </svg>
  );
}

/* ─── Report: Sleep & stress trend lines ─────────────────────────────────── */
function SleepStressChart({ entries }) {
  const sleepEntries = [...entries].reverse().filter(e => e.sleep != null).slice(-30);
  const stressEntries = [...entries].reverse().filter(e => e.stress != null).slice(-30);
  if (sleepEntries.length < 2 && stressEntries.length < 2) return null;
  const W = 560, H = 100, PAD = 20;
  const makePath = (data, field) => {
    if (data.length < 2) return null;
    const xStep = (W - PAD * 2) / (data.length - 1);
    return data.map((e, i) => `${i === 0 ? "M" : "L"} ${PAD + i * xStep} ${H - PAD - ((e[field] / 10) * (H - PAD * 2))}`).join(" ");
  };
  const sleepPath = makePath(sleepEntries, "sleep");
  const stressPath = makePath(stressEntries, "stress");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: "visible" }}>
      {[2,4,6,8,10].map(v => {
        const y = H - PAD - ((v / 10) * (H - PAD * 2));
        return <g key={v}>
          <line x1={PAD} y1={y} x2={W-PAD} y2={y} stroke="#e8e4e0" strokeWidth="0.5" strokeDasharray="3 3"/>
          <text x={PAD-4} y={y+4} fontSize="9" fill="#bbb" textAnchor="end">{v}</text>
        </g>;
      })}
      {sleepPath && <path d={sleepPath} fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>}
      {stressPath && <path d={stressPath} fill="none" stroke="#e8a838" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" strokeDasharray="5 3"/>}
      <g transform={`translate(${PAD}, ${H + 14})`}>
        <rect width="10" height="3" fill={TEAL} y="-1" rx="1"/>
        <text x="13" y="3" fontSize="9" fill="#888">Sleep quality</text>
        <rect x="90" width="10" height="3" fill="#e8a838" y="-1" rx="1"/>
        <text x="103" y="3" fontSize="9" fill="#888">Stress level</text>
      </g>
    </svg>
  );
}

/* ─── Report: Summary stat boxes ─────────────────────────────────────────── */
function ReportStatBox({ label, value, sub, color = "#4a4540" }) {
  return (
    <div style={{ flex: 1, minWidth: 100, background: "#fafaf8", borderRadius: "0.75rem", border: "1px solid #ece8e3", padding: "0.875rem 1rem", textAlign: "center" }}>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.6rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "0.7rem", color: "#888", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      {sub && <div style={{ fontSize: "0.7rem", color, marginTop: "0.2rem", fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

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
  const { signOut } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => { try { return localStorage.getItem('cc-tracker-onboarded') === 'true'; } catch { return false; } });
  const [entries, setEntries]           = useState([]);
  const [view, setView]                 = useState("log");
  const [showForm, setShowForm]         = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [insights, setInsights]         = useState(null);
  const [apptContext, setApptContext]    = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [saved, setSaved]               = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // id of entry pending delete confirmation
  const [saveError, setSaveError]         = useState("");
  const [chartField, setChartField]     = useState("severity");
  const [dateFilter, setDateFilter]     = useState("all");

  // ── Blood pressure state ──────────────────────────────────────────────────
  const [bpReadings, setBpReadings]       = useState([]);
  const [bpReminders, setBpReminders]     = useState([]);
  const [showBpForm, setShowBpForm]       = useState(false);
  const [bpView, setBpView]               = useState("log"); // log | history | report
  const [bpSaved, setBpSaved]             = useState(false);
  const blankBpForm = { systolic: "", diastolic: "", pulse: "", arm: "left", position: "sitting", notes: "" };
  const [bpForm, setBpForm]               = useState(blankBpForm);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderTime, setReminderTime]   = useState("08:00");
  const [reminderLabel, setReminderLabel] = useState("Morning reading");
  const [editingReminderId, setEditingReminderId] = useState(null);
  const [editTime, setEditTime]           = useState("08:00");
  const [editLabel, setEditLabel]         = useState("");

  const blankForm = { symptoms: "", severity: 5, food: "", medications: "", selectedMedIds: [], saveUnlistedMed: false, activity: "", sleep: null, stress: 5, weather: "", notes: "", photos: [] };
  const [form, setForm] = useState(blankForm);

  useEffect(() => { try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) setEntries(JSON.parse(stored)); } catch {} }, []);

  // Read appointment context from URL and auto-trigger insights
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("insight") === "1") {
      // Skip onboarding if coming from appointment flow
      try { localStorage.setItem("cc-tracker-onboarded", "true"); } catch {}
      setHasSeenOnboarding(true);
      setView("insights");
      const specialty = params.get("specialty") || "";
      const doctor = params.get("doctor") || "";
      const reason = params.get("reason") || "";
      const date = params.get("date") || "";
      if (specialty) {
        setApptContext({ specialty, doctor, reason, date });
      }
      // Clean URL without reload
      window.history.replaceState({}, "", "/tracker");
    }
  }, []);
  useEffect(() => { try { const stored = localStorage.getItem(BP_STORAGE_KEY); if (stored) setBpReadings(JSON.parse(stored)); } catch {} }, []);
  useEffect(() => { try { const stored = localStorage.getItem(BP_REMINDERS_KEY); if (stored) setBpReminders(JSON.parse(stored)); } catch {} }, []);

  const saveEntries = (updated) => {
    setEntries(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSaveError("");
    } catch (e) {
      if (e.name === "QuotaExceededError" || e.code === 22) {
        // Storage full — likely caused by photos. Try saving without photos as fallback.
        try {
          const stripped = updated.map(entry => ({ ...entry, photos: [] }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
          setSaveError("⚠️ Storage limit reached — photos were not saved to keep your entries. Consider reducing photo size or clearing old entries.");
        } catch {
          setSaveError("⚠️ Could not save your entry — device storage is full. Please free up space and try again.");
        }
      }
    }
  };
  const saveBpReadings = (updated) => { setBpReadings(updated); try { localStorage.setItem(BP_STORAGE_KEY, JSON.stringify(updated)); } catch {} };
  const saveBpReminders = (updated) => { setBpReminders(updated); try { localStorage.setItem(BP_REMINDERS_KEY, JSON.stringify(updated)); } catch {} };

  const handleBpSubmit = () => {
    if (!bpForm.systolic || !bpForm.diastolic) return;
    const reading = { ...bpForm, id: Date.now(), timestamp: new Date().toISOString(),
      systolic: Number(bpForm.systolic), diastolic: Number(bpForm.diastolic),
      pulse: bpForm.pulse ? Number(bpForm.pulse) : null };
    saveBpReadings([reading, ...bpReadings]);
    setBpForm(blankBpForm); setShowBpForm(false);
    setBpSaved(true); setTimeout(() => setBpSaved(false), 3000);
  };

  const handleBpDelete = (id) => saveBpReadings(bpReadings.filter(r => r.id !== id));

  const handleAddReminder = async () => {
    if (!reminderTime) return;
    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    const reminder = { id: Date.now(), time: reminderTime, label: reminderLabel, enabled: true };
    saveBpReminders([...bpReminders, reminder]);
    setShowReminderForm(false); setReminderTime("08:00"); setReminderLabel("Morning reading");
  };

  const toggleReminder = (id) => {
    saveBpReminders(bpReminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteReminder = (id) => saveBpReminders(bpReminders.filter(r => r.id !== id));
  const startEditReminder = (r) => { setEditingReminderId(r.id); setEditTime(r.time); setEditLabel(r.label || ""); };
  const saveEditReminder = () => {
    saveBpReminders(bpReminders.map(r => r.id === editingReminderId ? { ...r, time: editTime, label: editLabel } : r));
    setEditingReminderId(null);
  };

  const handleBpPrint = () => {
    const style = document.createElement("style");
    style.innerHTML = `@media print { .no-print { display: none !important; } @page { margin: 1.5cm; } }`;
    document.head.appendChild(style); window.print(); setTimeout(() => document.head.removeChild(style), 1000);
  };

  const bpAvgRecent = () => {
    const recent = bpReadings.slice(0, 10);
    if (!recent.length) return null;
    return {
      systolic: Math.round(recent.reduce((s, r) => s + r.systolic, 0) / recent.length),
      diastolic: Math.round(recent.reduce((s, r) => s + r.diastolic, 0) / recent.length),
    };
  };

  const dismissOnboarding = () => {
    try { localStorage.setItem("cc-tracker-onboarded", "true"); } catch {}
    setHasSeenOnboarding(true);
  };

  const isFirstEntryToday = !entries.some(e => new Date(e.timestamp).toDateString() === new Date().toDateString());

  const openNew = () => { setEditingEntry(null); setForm({ ...blankForm, sleep: isFirstEntryToday ? 7 : null }); setShowForm(true); };
  const openEdit = (entry) => { setEditingEntry(entry); setForm({ ...entry, photos: entry.photos || [] }); setShowForm(true); };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) { alert("Please choose a photo under 2MB."); return; }
      const reader = new FileReader();
      reader.onload = evt => {
        setForm(f => ({
          ...f,
          photos: [...(f.photos || []), { data: evt.target.result, name: file.name, type: file.type }].slice(0, 3)
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (idx) => setForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));

  const handleSubmit = () => {
    // Merge selected med ids into medications string
    const selectedMedsStr = buildMedString(form.selectedMedIds || []);
    const finalMeds = [selectedMedsStr, form.medications].filter(Boolean).join(", ");
    const finalForm = { ...form, medications: finalMeds };

    // Save unlisted med to settings list if opted in
    if (form.saveUnlistedMed && form.medications.trim()) {
      try {
        const existing = JSON.parse(localStorage.getItem(MED_STORAGE_KEY) || "[]");
        // Split on comma in case multiple unlisted were entered
        const newNames = form.medications.split(",").map(n => n.trim()).filter(Boolean);
        newNames.forEach(name => {
          const alreadyExists = existing.some(m => m.name.toLowerCase() === name.toLowerCase());
          if (!alreadyExists) {
            existing.push({ id: Date.now() + Math.random(), name, dose: "", frequency: "", duration: "", notes: "", reminder: false, reminderTime: "08:00" });
          }
        });
        localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(existing));
        setMedications(existing);
      } catch {}
    }

    if (editingEntry) {
      saveEntries(entries.map(e => e.id === editingEntry.id ? { ...finalForm, id: editingEntry.id, timestamp: editingEntry.timestamp } : e));
    } else {
      saveEntries([{ ...finalForm, id: Date.now(), timestamp: new Date().toISOString() }, ...entries]);
    }
    setShowForm(false); setEditingEntry(null); setForm(blankForm);
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  const handleDelete = (id) => setConfirmDeleteId(id);
  const confirmDelete = () => { saveEntries(entries.filter(e => e.id !== confirmDeleteId)); setConfirmDeleteId(null); };

  const uniqueDaysLogged = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;

  const handleInsights = async () => {
    if (uniqueDaysLogged < 3) return;
    setLoadingInsights(true); setInsights(null);
    try {
      // Group entries by day to show full daily picture, preserving time-of-day context
      const entriesByDay = entries.slice(0, 60).reduce((acc, e) => {
        const day = new Date(e.timestamp).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        if (!acc[day]) acc[day] = [];
        acc[day].push(e);
        return acc;
      }, {});

      const summary = Object.entries(entriesByDay).slice(0, 14).map(([day, dayEntries]) => {
        const sorted = [...dayEntries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const allMeds = [...new Set(sorted.flatMap(e => e.medications ? [e.medications] : []))].join(", ");
        const allFood = [...new Set(sorted.flatMap(e => e.food ? [e.food] : []))].join(", ");
        const allActivity = [...new Set(sorted.flatMap(e => e.activity ? [e.activity] : []))].join(", ");
        const sleep = sorted.find(e => e.sleep != null);
        const timeEntries = sorted.map(e =>
          `  ${new Date(e.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}: Severity ${e.severity}/10${e.symptoms ? ` — ${e.symptoms}` : ""}${e.stress ? ` | Stress: ${e.stress}/10` : ""}${e.notes ? ` | Notes: ${e.notes}` : ""}`
        ).join("\n");
        return `${day}:${sleep ? ` Sleep: ${sleep.sleep}/10` : ""}${allMeds ? ` | Medications: ${allMeds}` : ""}${allFood ? ` | Food: ${allFood}` : ""}${allActivity ? ` | Activity: ${allActivity}` : ""}\n${timeEntries}`;
      }).join("\n\n");

      const styleEl = document.createElement("style");
      styleEl.id = "insights-loading-styles";
      styleEl.innerHTML = INSIGHTS_LOADING_STYLES;
      document.head.appendChild(styleEl);

      const apptPromptContext = apptContext ? `

APPOINTMENT CONTEXT: This report is being generated to prepare for an upcoming ${apptContext.specialty} appointment${apptContext.doctor ? ` with ${apptContext.doctor}` : ""}${apptContext.date ? ` on ${new Date(apptContext.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}${apptContext.reason ? `. Reason for visit: ${apptContext.reason}` : ""}.

Please tailor your analysis specifically for a ${apptContext.specialty} visit. Focus on symptoms, patterns, and findings most relevant to ${apptContext.specialty} conditions. Prioritize insights the ${apptContext.specialty} would find most actionable. Add a ## Questions to Raise with Your ${apptContext.specialty} section at the end with specific, targeted questions based on the data.` : "";

      const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-opus-4-6", max_tokens: 4000, messages: [{ role: "user", content: `You are Care Compass, a compassionate health navigation assistant. Analyze these symptom tracker entries and identify patterns, triggers, and insights to discuss with a doctor.

${careTeamStr ? `CARE TEAM: ${careTeamStr}\n\n` : ""}${familyHistoryStr ? `FAMILY HISTORY (use this to add genetic/hereditary context to pattern analysis — flag if logged symptoms may have familial patterns):\n${familyHistoryStr}\n\n` : ""}${(() => {
        const medsWithDuration = medications.filter(m => m.name && m.duration);
        if (!medsWithDuration.length) return "";
        const DURATION_LABELS = {
          less_than_1_month: "< 1 month", "1_3_months": "1–3 months", "3_6_months": "3–6 months",
          "6_12_months": "6–12 months", "1_2_years": "1–2 years", "2_5_years": "2–5 years",
          "5_10_years": "5–10 years", "10_plus_years": "10+ years", "lifelong": "lifelong/since childhood"
        };
        return "MEDICATION DURATION CONTEXT (IMPORTANT for pattern analysis — a long-standing medication is less likely to be causing a NEW symptom than a recently started one):\n" +
          medsWithDuration.map(m => `- ${m.name}${m.dose ? " " + m.dose : ""}: taking for ${DURATION_LABELS[m.duration] || m.duration}`).join("\n") + "\n\n";
      })()}IMPORTANT CONTEXT: Users log entries MULTIPLE TIMES per day. Each day shows all entries chronologically with timestamps. Medications, food, and activity listed for a day represent the COMBINED picture across all that day's entries — not that each item was logged at every entry. Do NOT interpret partial fields in individual entries as missed doses or incomplete information. Look for TIME-BASED CORRELATIONS within days — e.g. a medication logged in the morning followed by symptom changes hours later, or food logged before a symptom spike.

ENTRIES (grouped by day, chronological within each day):
${summary}

Please provide a warm, specific analysis:
## Patterns We Notice
## Time-Based Correlations Worth Exploring
## Potential Triggers
## What's Improving vs Worsening
## Questions to Bring to Your Doctor

Never diagnose. Focus on patterns across days AND within-day timing. Be specific about which days or time patterns seem significant.` + apptPromptContext + (bpReadings.length > 0 ? `

BLOOD PRESSURE READINGS (most recent first):
` + bpReadings.slice(0, 20).map(r => formatBPTime(r.timestamp) + ": " + r.systolic + "/" + r.diastolic + " mmHg" + (r.pulse ? " | Pulse: " + r.pulse + " bpm" : "") + (r.notes ? " | Notes: " + r.notes : "") + " — " + bpCategory(r.systolic, r.diastolic).label).join("\n") + `

Please also include a ## Blood Pressure Patterns section if you notice correlations between BP readings and symptoms (e.g. high BP days correlating with headaches, stress, poor sleep, or specific activities).` : "") }] }) });
      const data = await response.json();
      setInsights(data.content[0].text); setView("insights");
    } catch { setInsights("Something went wrong. Please try again."); }
    finally {
      setLoadingInsights(false);
      const styleEl = document.getElementById("insights-loading-styles");
      if (styleEl) styleEl.remove();
    }
  };

  const handlePrint = () => { const style = document.createElement("style"); style.innerHTML = `@media print { .no-print { display: none !important; } @page { margin: 1.5cm; } }`; document.head.appendChild(style); window.print(); setTimeout(() => document.head.removeChild(style), 1000); };

  // ── Medication list state ────────────────────────────────────────────────
  const [medications, setMedications]     = useState([]);
  const [showMedForm, setShowMedForm]     = useState(false);
  const [editingMed, setEditingMed]       = useState(null);
  const [medSaved, setMedSaved]           = useState(false);
  const blankMed = { name: "", dose: "", frequency: "", notes: "", reminder: false, reminderTime: "08:00" };
  const [medForm, setMedForm]             = useState(blankMed);
  const [medEditId, setMedEditId]         = useState(null);
  const [bulkText, setBulkText]           = useState("");
  const [showBulk, setShowBulk]           = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem(MED_STORAGE_KEY); if (s) setMedications(JSON.parse(s)); } catch {}
  }, []);

  // Read care team from settings
  const careTeam = (() => {
    try { const s = localStorage.getItem("cc-care-team"); return s ? JSON.parse(s) : []; } catch { return []; }
  })();
  const careTeamStr = careTeam.filter(p => p.name).map(p => `${p.name}${p.specialty ? " (" + p.specialty + ")" : ""}`).join(", ");

  // Read family history from settings
  const familyHistory = (() => {
    try { const s = localStorage.getItem("cc-family-history"); return s ? JSON.parse(s) : []; } catch { return []; }
  })();
  const familyHistoryStr = familyHistory.filter(e => e.member && e.conditions.length > 0).map(e => {
    const MEMBERS = { mother:"Mother", father:"Father", maternal_grandmother:"Maternal grandmother", maternal_grandfather:"Maternal grandfather", paternal_grandmother:"Paternal grandmother", paternal_grandfather:"Paternal grandfather", sister:"Sister", brother:"Brother", maternal_aunt:"Maternal aunt", maternal_uncle:"Maternal uncle", paternal_aunt:"Paternal aunt", paternal_uncle:"Paternal uncle", daughter:"Daughter", son:"Son" };
    return `${MEMBERS[e.member] || e.member}: ${e.conditions.join(", ")}${e.notes ? " (" + e.notes + ")" : ""}`;
  }).join("\n");

  const saveMedications = (updated) => {
    setMedications(updated);
    try { localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(updated)); } catch {}
  };

  const handleSaveMed = () => {
    if (!medForm.name.trim()) return;
    if (medEditId) {
      saveMedications(medications.map(m => m.id === medEditId ? { ...medForm, id: medEditId } : m));
      setMedEditId(null);
    } else {
      saveMedications([...medications, { ...medForm, id: Date.now() }]);
    }
    setMedForm(blankMed); setShowMedForm(false);
    setMedSaved(true); setTimeout(() => setMedSaved(false), 2500);
  };

  const handleDeleteMed = (id) => saveMedications(medications.filter(m => m.id !== id));

  const handleEditMed = (med) => {
    setMedForm({ ...med }); setMedEditId(med.id); setShowMedForm(true);
  };

  const handleBulkImport = () => {
    const lines = bulkText.replace(/,|;/g, "\n").split("\n").map(l => l.trim()).filter(Boolean);
    const newMeds = lines.map(line => {
      const parts = line.split(" ");
      const name = parts[0] || line;
      const dose = parts.length > 1 ? parts.slice(1, 3).join(" ") : "";
      return { name, dose, frequency: "", notes: "", reminder: false, reminderTime: "08:00", id: Date.now() + Math.random() };
    });
    saveMedications([...medications, ...newMeds]);
    setBulkText(""); setShowBulk(false);
    setMedSaved(true); setTimeout(() => setMedSaved(false), 2500);
  };

  // Build med string for log entry from selected med ids
  const buildMedString = (selectedIds) => {
    return medications
      .filter(m => selectedIds.includes(m.id))
      .map(m => `${m.name}${m.dose ? " " + m.dose : ""}${m.frequency ? " (" + m.frequency + ")" : ""}`)
      .join(", ");
  };

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
  const tabs = [{ id: "log", label: "Log" }, { id: "history", label: "History" }, { id: "trends", label: "Trends" }, { id: "insights", label: "AI Insights" }, { id: "report", label: "Doctor Report" }, { id: "bp", label: "Blood Pressure" }];

  if (!hasSeenOnboarding) {
    return (
      <div style={s.root}>
        <nav style={s.nav}>
          <a href="/" style={s.navLogo}><BotanicalMark size={30}/><span style={s.navLogoText}>Care Compass</span></a>
          <div style={s.navLinks}><a href="/compass" style={s.navLink}>Assessment</a><span style={s.navActive}>Tracker</span><button onClick={signOut} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", color: WARM_GRAY, fontFamily: "inherit", padding: "0.25rem 0.5rem" }}>Sign out</button></div>
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
              {/* Loading overlay */}
              {loadingInsights && (
                <div style={s.insightsLoadingOverlay}>
                  <div style={s.insightsLoadingCard}>
                    <BotanicalMark size={48}/>
                    <h2 style={s.insightsLoadingTitle}>Analyzing your patterns</h2>
                    <p style={s.insightsLoadingDesc}>Care Compass is reviewing your entries day by day — looking for symptom patterns, timing correlations, and potential triggers across your full health picture.</p>
                    <div style={s.insightsLoadingBarWrap}>
                      <div style={s.insightsLoadingBar}/>
                    </div>
                    <p style={s.insightsLoadingNote}>This usually takes 15–25 seconds. Please don't close this page.</p>
                  </div>
                </div>
              )}
              {uniqueDaysLogged < 3 ? (
                <div style={s.emptyState}>
                  <p style={s.emptyDesc}>Log entries across at least 3 different days before running AI pattern analysis. You've logged on {uniqueDaysLogged} {uniqueDaysLogged === 1 ? "day" : "days"} so far.</p>
                  <a href="/compass" style={{ ...s.assessmentPromptBtn, marginTop: "0.5rem" }}>Or take the full assessment →</a>
                </div>
              ) : !insights ? (
                <div style={s.emptyState}>
                  {apptContext && (
                    <div style={{ background: `linear-gradient(135deg, ${SAGE_LIGHT}, ${TEAL_LIGHT})`, borderRadius: "1rem", padding: "1rem 1.25rem", marginBottom: "1rem", width: "100%", boxSizing: "border-box", textAlign: "left" }}>
                      <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: SAGE_DARK, margin: "0 0 0.35rem" }}>Preparing for your appointment</p>
                      <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: "0 0 0.15rem" }}>
                        {apptContext.specialty}{apptContext.doctor ? ` · ${apptContext.doctor}` : ""}
                      </p>
                      {apptContext.date && <p style={{ fontSize: "0.78rem", color: TEAL, margin: 0 }}>{new Date(apptContext.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>}
                      {apptContext.reason && <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: "0.25rem 0 0", fontStyle: "italic" }}>{apptContext.reason}</p>}
                    </div>
                  )}
                  <BotanicalMark size={48}/>
                  <h2 style={s.emptyTitle}>{apptContext ? `Prepare your ${apptContext.specialty} report` : "Ready to find your patterns?"}</h2>
                  <p style={s.emptyDesc}>
                    {apptContext
                      ? `Care Compass will analyze your ${entries.length} entries and tailor the insights specifically for your upcoming ${apptContext.specialty} appointment — highlighting what matters most for that visit.`
                      : `Care Compass will analyze your ${entries.length} entries across ${uniqueDaysLogged} days — including time-of-day correlations between medications, food, activity, and symptoms.`
                    }
                  </p>
                  <button onClick={handleInsights} disabled={loadingInsights} style={s.addBtn}>
                    {apptContext ? `Generate ${apptContext.specialty} Report →` : "Analyze My Patterns →"}
                  </button>
                </div>
              ) : (
                <div style={s.insightsWrap}>
                  {/* Polished report header */}
                  <div style={s.insightsReportHeader}>
                    <div style={s.insightsReportHeaderTop}>
                      <BotanicalMark size={44}/>
                      <div>
                        <p style={s.insightsReportEyebrow}>Care Compass Pattern Report</p>
                        <h2 style={s.insightsTitle}>Your Health Pattern Insights</h2>
                        <p style={s.insightsMeta}>Based on {entries.length} entries across {uniqueDaysLogged} days · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </div>
                    <div style={s.insightsReportActions} className="no-print">
                      <button onClick={() => {
                        const style = document.createElement("style");
                        style.innerHTML = `@media print { .no-print { display: none !important; } @page { margin: 1.5cm; } }`;
                        document.head.appendChild(style);
                        window.print();
                        setTimeout(() => document.head.removeChild(style), 1000);
                      }} style={s.insightsExportBtn}>↓ Save as PDF</button>
                      <button onClick={handleInsights} style={s.rerunBtn}>Re-run Analysis →</button>
                    </div>
                  </div>
                  <div style={s.disclaimer}><strong>Important:</strong> These are patterns to explore with your doctor — not medical advice or diagnosis.</div>

                  {/* ── Visual summary — shown when generating appointment report ── */}
                  {apptContext && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                      {/* Stats row */}
                      <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 1rem" }}>At a Glance</p>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                          {(() => {
                            const totalDays = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;
                            const avgSev = (entries.reduce((s, e) => s + e.severity, 0) / entries.length).toFixed(1);
                            const highDays = new Set(entries.filter(e => e.severity >= 7).map(e => new Date(e.timestamp).toDateString())).size;
                            const sleepEntries = entries.filter(e => e.sleep != null);
                            const avgSleep = sleepEntries.length ? (sleepEntries.reduce((s, e) => s + e.sleep, 0) / sleepEntries.length).toFixed(1) : null;
                            const stressEntries = entries.filter(e => e.stress != null);
                            const avgStress = stressEntries.length ? (stressEntries.reduce((s, e) => s + e.stress, 0) / stressEntries.length).toFixed(1) : null;
                            const sevColor = avgSev <= 3 ? SAGE_DARK : avgSev <= 6 ? "#e8a838" : "#c0392b";
                            return <>
                              <ReportStatBox label="Days tracked" value={totalDays} sub={`${entries.length} total entries`}/>
                              <ReportStatBox label="Avg severity" value={`${avgSev}/10`} color={sevColor} sub={avgSev <= 3 ? "Manageable" : avgSev <= 6 ? "Moderate" : "High"}/>
                              <ReportStatBox label="High severity days" value={highDays} color={highDays > 0 ? "#c0392b" : SAGE_DARK} sub="≥7/10"/>
                              {avgSleep && <ReportStatBox label="Avg sleep quality" value={`${avgSleep}/10`} color={TEAL}/>}
                              {avgStress && <ReportStatBox label="Avg stress level" value={`${avgStress}/10`} color="#e8a838"/>}
                            </>;
                          })()}
                        </div>
                      </div>

                      {/* Daily severity bar chart */}
                      <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.5rem" }}>Daily Severity — Last 30 Days</p>
                        <p style={{ fontSize: "0.72rem", color: "#aaa", margin: "0 0 0.75rem", fontStyle: "italic" }}>
                          <span style={{ color: SAGE_DARK }}>■</span> Low (1–3) &nbsp;
                          <span style={{ color: "#e8a838" }}>■</span> Moderate (4–6) &nbsp;
                          <span style={{ color: "#c0392b" }}>■</span> High (7–10)
                        </p>
                        <SeverityBarChart entries={entries}/>
                      </div>

                      {/* Symptom frequency */}
                      <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.5rem" }}>Most Frequent Symptoms</p>
                        <p style={{ fontSize: "0.72rem", color: "#aaa", margin: "0 0 0.75rem", fontStyle: "italic" }}>Frequency as % of days tracked</p>
                        <SymptomFrequencyChart entries={entries}/>
                      </div>

                      {/* Sleep & stress */}
                      {entries.some(e => e.sleep != null) && (
                        <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem" }}>
                          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.75rem" }}>Sleep Quality & Stress Levels</p>
                          <SleepStressChart entries={entries}/>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={s.insightsContent}>
                    {insights.split("\n").map((line, i) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;
                      // Single # = main title (skip — we already show a header)
                      if (/^# [^#]/.test(trimmed)) return null;
                      // ## = section heading
                      if (trimmed.startsWith("##")) return <h3 key={i} style={s.insightSection}>{trimmed.replace(/^##\s*/, "")}</h3>;
                      // --- = divider
                      if (trimmed === "---" || trimmed === "—--" || trimmed === "- --") return <hr key={i} style={s.insightDivider}/>;
                      // Bullet points
                      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                        const text = trimmed.replace(/^[-*]\s/, "").replace(/\*\*(.*?)\*\*/g, "$1");
                        return <div key={i} style={s.insightBullet}><span style={s.bulletDot}>•</span><span>{text}</span></div>;
                      }
                      // Bold inline text handling
                      const parts = trimmed.split(/\*\*(.*?)\*\*/g);
                      const rendered = parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ fontWeight: 700, color: INK }}>{part}</strong> : part);
                      return <p key={i} style={s.insightPara}>{rendered}</p>;
                    })}
                  </div>
                  <div style={s.insightsFooter} className="no-print">
                    <p style={s.insightsFooterNote}>🌿 Bring this report to your next appointment and ask your provider to help you explore these patterns.</p>
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                      <button onClick={() => {
                        const style = document.createElement("style");
                        style.innerHTML = `@media print { .no-print { display: none !important; } @page { margin: 1.5cm; } }`;
                        document.head.appendChild(style);
                        window.print();
                        setTimeout(() => document.head.removeChild(style), 1000);
                      }} style={s.insightsExportBtn}>↓ Save as PDF</button>
                      <button onClick={handleInsights} style={s.rerunBtn}>Re-run Analysis →</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === "report" && (
            <div style={s.tabContent}>
              {entries.length === 0 ? <div style={s.emptyState}><p style={s.emptyDesc}>No entries yet.</p></div> : (
                <div style={s.reportWrap}>
                  <div style={s.reportTopBar} className="no-print">
                    <p style={s.reportTopNote}>Formatted for your doctor. Print or save as PDF.</p>
                    <button onClick={handlePrint} style={s.printBtn}>↓ Save as PDF</button>
                  </div>
                  <div style={s.reportCard}>

                    {/* ── Header ── */}
                    <div style={s.reportHead}>
                      <BotanicalMark size={44}/>
                      <div style={{ flex: 1 }}>
                        <p style={s.reportEyebrow}>Care Compass Health Report</p>
                        <h2 style={s.reportTitle}>Symptom Tracking Summary</h2>
                        <p style={s.reportMeta}>
                          Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {entries.length} entries over {new Set(entries.map(e => new Date(e.timestamp).toDateString())).size} days
                        </p>
                        {careTeam.length > 0 && (
                          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                            <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 0.4rem" }}>Care team</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                              {careTeam.filter(p => p.name).map((p, i) => (
                                <span key={i} style={{ background: SAGE_LIGHT, color: SAGE_DARK, fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.7rem", borderRadius: "100px" }}>
                                  {p.name}{p.specialty ? ` · ${p.specialty}` : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Summary stats ── */}
                    <div style={s.reportSection}>
                      <h3 style={s.reportSectionTitle}>At a Glance</h3>
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        {(() => {
                          const totalDays = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;
                          const avgSev = (entries.reduce((s, e) => s + e.severity, 0) / entries.length).toFixed(1);
                          const highDays = new Set(entries.filter(e => e.severity >= 7).map(e => new Date(e.timestamp).toDateString())).size;
                          const sleepEntries = entries.filter(e => e.sleep != null);
                          const avgSleep = sleepEntries.length ? (sleepEntries.reduce((s, e) => s + e.sleep, 0) / sleepEntries.length).toFixed(1) : null;
                          const stressEntries = entries.filter(e => e.stress != null);
                          const avgStress = stressEntries.length ? (stressEntries.reduce((s, e) => s + e.stress, 0) / stressEntries.length).toFixed(1) : null;
                          const sevColor = avgSev <= 3 ? SAGE_DARK : avgSev <= 6 ? "#e8a838" : "#c0392b";
                          return <>
                            <ReportStatBox label="Days tracked" value={totalDays} sub={`${entries.length} total entries`}/>
                            <ReportStatBox label="Avg severity" value={`${avgSev}/10`} color={sevColor} sub={avgSev <= 3 ? "Manageable" : avgSev <= 6 ? "Moderate" : "High"}/>
                            <ReportStatBox label="High severity days" value={highDays} color={highDays > 0 ? "#c0392b" : SAGE_DARK} sub="≥7/10"/>
                            {avgSleep && <ReportStatBox label="Avg sleep quality" value={`${avgSleep}/10`} color={TEAL}/>}
                            {avgStress && <ReportStatBox label="Avg stress level" value={`${avgStress}/10`} color="#e8a838"/>}
                          </>;
                        })()}
                      </div>
                    </div>

                    {/* ── Severity bar chart ── */}
                    <div style={s.reportSection}>
                      <h3 style={s.reportSectionTitle}>Daily Severity — Last 30 Days</h3>
                      <p style={{ fontSize: "0.75rem", color: "#aaa", margin: "0 0 0.75rem", fontStyle: "italic" }}>
                        Average severity per day · <span style={{ color: SAGE_DARK }}>■</span> Low (1–3) &nbsp;
                        <span style={{ color: "#e8a838" }}>■</span> Moderate (4–6) &nbsp;
                        <span style={{ color: "#c0392b" }}>■</span> High (7–10)
                      </p>
                      <SeverityBarChart entries={entries}/>
                    </div>

                    {/* ── Severity line chart ── */}
                    <div style={s.reportSection}>
                      <h3 style={s.reportSectionTitle}>Severity Trend</h3>
                      <LineChart entries={entries} field="severity" color={SAGE}/>
                    </div>

                    {/* ── Symptom frequency ── */}
                    <div style={s.reportSection}>
                      <h3 style={s.reportSectionTitle}>Most Frequent Symptoms</h3>
                      <p style={{ fontSize: "0.75rem", color: "#aaa", margin: "0 0 0.75rem", fontStyle: "italic" }}>
                        Frequency shown as number of entries and % of days tracked
                      </p>
                      <SymptomFrequencyChart entries={entries}/>
                    </div>

                    {/* ── Sleep & stress ── */}
                    {entries.some(e => e.sleep != null) && (
                      <div style={s.reportSection}>
                        <h3 style={s.reportSectionTitle}>Sleep Quality & Stress Levels</h3>
                        <SleepStressChart entries={entries}/>
                      </div>
                    )}

                    {/* ── Medications summary ── */}
                    {(() => {
                      const medSet = new Set();
                      entries.forEach(e => { if (e.medications) e.medications.replace(/\n/g, ",").split(",").forEach(m => { const t = m.trim(); if (t) medSet.add(t); }); });
                      const meds = [...medSet].slice(0, 20);
                      if (!meds.length) return null;
                      return (
                        <div style={s.reportSection}>
                          <h3 style={s.reportSectionTitle}>Medications Logged</h3>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                            {meds.map(m => (
                              <span key={m} style={{ background: SAGE_LIGHT, color: SAGE_DARK, fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.7rem", borderRadius: "100px" }}>{m}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Detailed log table ── */}
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

                    <div style={s.reportFooter}>
                      <p style={s.reportFooterText}>Generated by Care Compass · joincarecompass.com · This is not a medical record or medical advice. Please review with your healthcare provider.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === "bp" && (
            <div style={s.tabContent}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <p style={s.eyebrow}>Blood Pressure</p>
                  <h2 style={{ ...s.title, fontSize: "1.4rem", marginBottom: "0.25rem" }}>BP Log</h2>
                  <p style={{ fontSize: "0.85rem", color: WARM_GRAY, margin: 0 }}>Track readings separately from your symptom log. Your cardiologist report is always one tap away.</p>
                </div>
                <button onClick={() => setShowBpForm(true)} style={s.addBtn}>+ Log Reading</button>
              </div>

              {bpSaved && <div style={s.savedBanner}>🫀 Reading saved!</div>}

              {/* Sub-tabs */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(0,0,0,0.07)", paddingBottom: "0" }} className="no-print">
                {[{ id: "log", label: "Overview" }, { id: "history", label: "History" }, { id: "report", label: "Doctor Report" }].map(t => (
                  <button key={t.id} onClick={() => setBpView(t.id)} style={{ ...s.tab, borderBottom: bpView === t.id ? `2px solid #c0392b` : "2px solid transparent", color: bpView === t.id ? "#c0392b" : WARM_GRAY, fontWeight: bpView === t.id ? 600 : 400 }}>{t.label}</button>
                ))}
              </div>

              {/* ── Overview ── */}
              {bpView === "log" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {bpReadings.length === 0 ? (
                    <div style={s.emptyState}>
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🫀</div>
                      <h2 style={s.emptyTitle}>Start your BP log</h2>
                      <p style={s.emptyDesc}>Log your first reading. Your cardiologist wants a record — this will build it automatically.</p>
                      <button onClick={() => setShowBpForm(true)} style={s.addBtn}>+ Log First Reading</button>
                    </div>
                  ) : (
                    <>
                      {/* Stats row */}
                      {(() => {
                        const avg = bpAvgRecent();
                        const cat = avg ? bpCategory(avg.systolic, avg.diastolic) : null;
                        const last = bpReadings[0];
                        const lastCat = last ? bpCategory(last.systolic, last.diastolic) : null;
                        return (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
                            <div style={s.statCard}>
                              <p style={s.statLabel}>Last reading</p>
                              <p style={{ ...s.statValue, color: lastCat?.color, fontFamily: "'Playfair Display', Georgia, serif" }}>{last ? `${last.systolic}/${last.diastolic}` : "—"}</p>
                              {lastCat && <p style={{ fontSize: "0.75rem", color: lastCat.color, fontWeight: 600, margin: 0 }}>{lastCat.label}</p>}
                            </div>
                            <div style={s.statCard}>
                              <p style={s.statLabel}>10-reading avg</p>
                              <p style={{ ...s.statValue, color: cat?.color, fontFamily: "'Playfair Display', Georgia, serif" }}>{avg ? `${avg.systolic}/${avg.diastolic}` : "—"}</p>
                              {cat && <p style={{ fontSize: "0.75rem", color: cat.color, fontWeight: 600, margin: 0 }}>{cat.label}</p>}
                            </div>
                            <div style={s.statCard}>
                              <p style={s.statLabel}>Total readings</p>
                              <p style={s.statValue}>{bpReadings.length}</p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Chart */}
                      <div style={s.chartCard}>
                        <p style={s.chartTitle}>Trend — last 30 readings</p>
                        <BPChart readings={bpReadings}/>
                      </div>

                      {/* Recent readings */}
                      <div>
                        <p style={s.sectionLabel}>Recent readings</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {bpReadings.slice(0, 5).map(r => <BPReadingCard key={r.id} reading={r} onDelete={handleBpDelete}/>)}
                          {bpReadings.length > 5 && <button onClick={() => setBpView("history")} style={s.viewAllBtn}>View all {bpReadings.length} readings →</button>}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Reminders */}
                  <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.5rem" }} className="no-print">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <div>
                        <p style={{ ...s.sectionLabel, marginBottom: "0.15rem" }}>Daily reminders</p>
                        <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0 }}>Get notified to take your BP at consistent times each day.</p>
                      </div>
                      <button onClick={() => setShowReminderForm(r => !r)} style={{ ...s.chartOptBtn, background: SAGE_DARK, color: "#fff", borderColor: SAGE_DARK, fontSize: "0.8rem" }}>+ Add time</button>
                    </div>

                    {showReminderForm && (
                      <div style={{ background: SAGE_LIGHT, borderRadius: "0.875rem", padding: "1rem", marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <label style={s.label}>Time</label>
                          <BPTimePicker value={reminderTime} onChange={setReminderTime}/>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1, minWidth: 160 }}>
                          <label style={s.label}>Label <span style={s.optional}>(optional)</span></label>
                          <input type="text" value={reminderLabel} onChange={e => setReminderLabel(e.target.value)} placeholder="e.g. Morning reading" style={s.input}/>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button onClick={handleAddReminder} style={s.saveBtn}>Save</button>
                          <button onClick={() => setShowReminderForm(false)} style={s.cancelBtn}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {bpReminders.length === 0 ? (
                      <p style={{ fontSize: "0.82rem", color: "#aaa", fontStyle: "italic" }}>No reminders set yet.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {bpReminders.map(r => (
                          <div key={r.id} style={{ borderRadius: "0.75rem", overflow: "hidden", background: r.enabled ? SAGE_LIGHT : "#f5f5f5" }}>
                            {/* View row */}
                            {editingReminderId !== r.id && (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                  <span style={{ fontSize: "1rem" }}>⏰</span>
                                  <div>
                                    <p style={{ fontSize: "0.9rem", fontWeight: 600, color: INK, margin: 0 }}>
                                      {(() => {
                                        const [hh, mm] = r.time.split(":").map(Number);
                                        const p = hh >= 12 ? "PM" : "AM";
                                        const h12 = hh % 12 || 12;
                                        return `${h12}:${String(mm).padStart(2,"0")} ${p}`;
                                      })()}
                                    </p>
                                    {r.label && <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: 0 }}>{r.label}</p>}
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <button onClick={() => startEditReminder(r)} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.2rem 0.65rem", fontSize: "0.72rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                                  <button onClick={() => toggleReminder(r.id)} style={{ background: r.enabled ? SAGE_DARK : "#ccc", color: "#fff", border: "none", borderRadius: "100px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                    {r.enabled ? "On" : "Off"}
                                  </button>
                                  <button onClick={() => deleteReminder(r.id)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>✕</button>
                                </div>
                              </div>
                            )}
                            {/* Inline edit row */}
                            {editingReminderId === r.id && (
                              <div style={{ padding: "0.875rem 1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: INK_LIGHT }}>Time</span>
                                  <BPTimePicker value={editTime} onChange={setEditTime}/>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: 140 }}>
                                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: INK_LIGHT }}>Label <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span></span>
                                  <input value={editLabel} onChange={e => setEditLabel(e.target.value)} style={{ ...s.input }} placeholder="e.g. Morning reading"/>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                  <button onClick={saveEditReminder} style={s.saveBtn}>Save</button>
                                  <button onClick={() => setEditingReminderId(null)} style={s.cancelBtn}>Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <p style={{ fontSize: "0.72rem", color: "#aaa", marginTop: "0.5rem", fontStyle: "italic" }}>
                          Note: Reminders require push notifications to be enabled in your browser. Full push support coming when backend is ready.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── History ── */}
              {bpView === "history" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <p style={s.sectionLabel}>{bpReadings.length} readings total</p>
                  {bpReadings.length === 0
                    ? <p style={{ fontSize: "0.85rem", color: WARM_GRAY }}>No readings yet.</p>
                    : bpReadings.map(r => <BPReadingCard key={r.id} reading={r} onDelete={handleBpDelete}/>)
                  }
                </div>
              )}

              {/* ── Doctor Report ── */}
              {bpView === "report" && (
                <div style={s.reportWrap}>
                  <div style={s.reportTopBar} className="no-print">
                    <p style={s.reportTopNote}>Formatted for your cardiologist. Print or save as PDF.</p>
                    <button onClick={handleBpPrint} style={s.printBtn}>↓ Save as PDF</button>
                  </div>
                  <div style={s.reportCard}>
                    <div style={s.reportHead}>
                      <BotanicalMark size={44}/>
                      <div>
                        <p style={s.reportEyebrow}>Care Compass · Blood Pressure Report</p>
                        <h2 style={s.reportTitle}>BP Tracking Summary</h2>
                        <p style={s.reportMeta}>
                          Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {bpReadings.length} readings
                          {bpReadings.length > 0 && ` · ${new Date(bpReadings[bpReadings.length - 1].timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(bpReadings[0].timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                        </p>
                      </div>
                    </div>

                    {/* Summary stats */}
                    {bpReadings.length > 0 && (() => {
                      const avg = bpAvgRecent();
                      const cat = avg ? bpCategory(avg.systolic, avg.diastolic) : null;
                      const highs = bpReadings.filter(r => r.systolic >= 140 || r.diastolic >= 90);
                      return (
                        <div style={s.reportSection}>
                          <h3 style={s.reportSectionTitle}>Summary</h3>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                            <div style={s.statCard}><p style={s.statLabel}>10-reading average</p><p style={{ ...s.statValue, color: cat?.color }}>{avg ? `${avg.systolic}/${avg.diastolic}` : "—"} <span style={s.statUnit}>mmHg</span></p></div>
                            <div style={s.statCard}><p style={s.statLabel}>Total readings</p><p style={s.statValue}>{bpReadings.length}</p></div>
                            <div style={s.statCard}><p style={s.statLabel}>High readings (≥140/90)</p><p style={{ ...s.statValue, color: highs.length > 0 ? "#c0392b" : SAGE_DARK }}>{highs.length}</p></div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Chart */}
                    {bpReadings.length >= 2 && (
                      <div style={s.reportSection}>
                        <h3 style={s.reportSectionTitle}>Trend Chart</h3>
                        <BPChart readings={bpReadings}/>
                      </div>
                    )}

                    {/* Full table */}
                    <div style={s.reportSection}>
                      <h3 style={s.reportSectionTitle}>Complete Reading Log</h3>
                      <table style={s.reportTable}>
                        <thead>
                          <tr>{["Date & Time", "Systolic", "Diastolic", "Pulse (bpm)", "Category", "Arm", "Position", "Notes"].map(h => <th key={h} style={s.reportTh}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {[...bpReadings].reverse().map((r, i) => {
                            const cat = bpCategory(r.systolic, r.diastolic);
                            return (
                              <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : OFF_WHITE }}>
                                <td style={s.reportTd}>{new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}<br/><span style={{ fontSize: "0.72rem", color: "#aaa" }}>{new Date(r.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span></td>
                                <td style={{ ...s.reportTd, textAlign: "center", fontWeight: 700, color: "#c0392b" }}>{r.systolic}</td>
                                <td style={{ ...s.reportTd, textAlign: "center", fontWeight: 700, color: TEAL }}>{r.diastolic}</td>
                                <td style={{ ...s.reportTd, textAlign: "center" }}>{r.pulse || "—"}</td>
                                <td style={s.reportTd}><span style={{ background: cat.bg, color: cat.color, fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "100px" }}>{cat.label}</span></td>
                                <td style={s.reportTd}>{r.arm || "—"}</td>
                                <td style={s.reportTd}>{r.position || "—"}</td>
                                <td style={s.reportTd}>{r.notes || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={s.reportFooter}>
                      <p style={s.reportFooterText}>Generated by Care Compass · joincarecompass.com · This is not a medical record. Please review with your healthcare provider.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Log Reading Modal ── */}
              {showBpForm && (
                <div style={s.modalOverlay} onClick={() => setShowBpForm(false)}>
                  <div style={s.modal} onClick={e => e.stopPropagation()}>
                    <div style={s.modalHeader}>
                      <h2 style={s.modalTitle}>Log Blood Pressure Reading</h2>
                      <button onClick={() => setShowBpForm(false)} style={s.modalClose}>✕</button>
                    </div>
                    <div style={s.modalBody}>
                      {/* Systolic / Diastolic */}
                      <div style={{ background: SAGE_LIGHT, borderRadius: "1rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <p style={{ ...s.label, margin: 0, fontSize: "0.8rem", color: WARM_GRAY }}>Enter your reading from your BP monitor</p>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                          <div style={s.formGroup}>
                            <label style={s.label}>Systolic <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#aaa" }}>(top number)</span></label>
                            <input type="number" min="60" max="250" value={bpForm.systolic} onChange={e => setBpForm(f => ({ ...f, systolic: e.target.value }))} placeholder="e.g. 128" style={{ ...s.input, fontSize: "1.5rem", fontWeight: 700, textAlign: "center", color: "#c0392b" }} autoFocus/>
                          </div>
                          <div style={{ fontSize: "2rem", color: WARM_GRAY, paddingBottom: "0.6rem", fontWeight: 300 }}>/</div>
                          <div style={s.formGroup}>
                            <label style={s.label}>Diastolic <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#aaa" }}>(bottom number)</span></label>
                            <input type="number" min="40" max="150" value={bpForm.diastolic} onChange={e => setBpForm(f => ({ ...f, diastolic: e.target.value }))} placeholder="e.g. 82" style={{ ...s.input, fontSize: "1.5rem", fontWeight: 700, textAlign: "center", color: TEAL }}/>
                          </div>
                          <div style={{ fontSize: "0.85rem", color: WARM_GRAY, paddingBottom: "0.85rem" }}>mmHg</div>
                        </div>
                        {bpForm.systolic && bpForm.diastolic && (() => {
                          const cat = bpCategory(Number(bpForm.systolic), Number(bpForm.diastolic));
                          return <div style={{ background: cat.bg, color: cat.color, borderRadius: "0.65rem", padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: 700, textAlign: "center" }}>{cat.label}</div>;
                        })()}
                      </div>

                      {/* Pulse */}
                      <div style={s.formGroup}>
                        <label style={s.label}>Pulse <span style={s.optional}>(optional)</span></label>
                        <input type="number" min="30" max="200" value={bpForm.pulse} onChange={e => setBpForm(f => ({ ...f, pulse: e.target.value }))} placeholder="bpm" style={{ ...s.input, maxWidth: 140 }}/>
                      </div>

                      {/* Arm + Position */}
                      <div style={s.formRow}>
                        <div style={s.formGroup}>
                          <label style={s.label}>Arm used</label>
                          <select value={bpForm.arm} onChange={e => setBpForm(f => ({ ...f, arm: e.target.value }))} style={s.input}>
                            <option value="left">Left arm</option>
                            <option value="right">Right arm</option>
                          </select>
                        </div>
                        <div style={s.formGroup}>
                          <label style={s.label}>Position</label>
                          <select value={bpForm.position} onChange={e => setBpForm(f => ({ ...f, position: e.target.value }))} style={s.input}>
                            <option value="sitting">Sitting</option>
                            <option value="standing">Standing</option>
                            <option value="lying down">Lying down</option>
                          </select>
                        </div>
                      </div>

                      {/* Notes */}
                      <div style={s.formGroup}>
                        <label style={s.label}>Notes <span style={s.optional}>(optional)</span></label>
                        <textarea value={bpForm.notes} onChange={e => setBpForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. After exercise, felt stressed, took medication this morning..." rows={3} style={s.textarea}/>
                      </div>
                    </div>
                    <div style={s.modalFooter}>
                      <button onClick={() => setShowBpForm(false)} style={s.cancelBtn}>Cancel</button>
                      <button onClick={handleBpSubmit} disabled={!bpForm.systolic || !bpForm.diastolic} style={{ ...s.saveBtn, opacity: (!bpForm.systolic || !bpForm.diastolic) ? 0.5 : 1 }}>Save Reading</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === "meds" && (
            <div style={s.tabContent}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <p style={s.eyebrow}>Medications</p>
                  <h2 style={{ ...s.title, fontSize: "1.4rem", marginBottom: "0.25rem" }}>Your medication list</h2>
                  <p style={{ fontSize: "0.85rem", color: WARM_GRAY, margin: 0 }}>Saved meds appear as quick-select options when logging entries.</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button onClick={() => setShowBulk(b => !b)} style={{ ...s.cancelBtn, fontSize: "0.82rem" }}>↑ Bulk import</button>
                  <button onClick={() => { setMedForm({ name: "", dose: "", frequency: "", notes: "", reminder: false, reminderTime: "08:00" }); setMedEditId(null); setShowMedForm(true); }} style={s.addBtn}>+ Add medication</button>
                </div>
              </div>

              {medSaved && <div style={s.savedBanner}>💊 Saved!</div>}

              {/* Bulk import */}
              {showBulk && (
                <div style={{ background: SAGE_LIGHT, borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <p style={{ ...s.sectionLabel, margin: 0 }}>Bulk import</p>
                  <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0 }}>Paste or type your medications — one per line, or separated by commas. Format: <em>Medication Name Dose</em> (e.g. "Metoprolol 25mg")</p>
                  <textarea
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    placeholder={"Metoprolol 25mg\nLevothyroxine 50mcg\nCetirizine 10mg\nOmeprazole 20mg"}
                    rows={5}
                    style={s.textarea}
                  />
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={handleBulkImport} disabled={!bulkText.trim()} style={{ ...s.saveBtn, opacity: bulkText.trim() ? 1 : 0.5 }}>Import</button>
                    <button onClick={() => { setShowBulk(false); setBulkText(""); }} style={s.cancelBtn}>Cancel</button>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "0.75rem" }}>
                    <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: "0 0 0.4rem", fontWeight: 600 }}>Or upload a file</p>
                    <label style={{ cursor: "pointer", display: "inline-block" }}>
                      <span style={{ ...s.uploadBtn, fontSize: "0.82rem" }}>📎 Upload .txt or .csv file</span>
                      <input type="file" accept=".txt,.csv" style={{ display: "none" }} onChange={e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = evt => setBulkText(evt.target.result.slice(0, 5000));
                        reader.readAsText(file);
                        e.target.value = "";
                      }}/>
                    </label>
                  </div>
                </div>
              )}

              {/* Add / Edit form */}
              {showMedForm && (
                <div style={{ background: OFF_WHITE, borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <p style={{ ...s.sectionLabel, marginBottom: "1rem" }}>{medEditId ? "Edit medication" : "New medication"}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {/* Name + Dose */}
                    <div style={s.formRow}>
                      <div style={s.formGroup}>
                        <label style={s.label}>Medication name <span style={{ color: "#c0392b" }}>*</span></label>
                        <input value={medForm.name} onChange={e => setMedForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Metoprolol" style={s.input}/>
                      </div>
                      <div style={s.formGroup}>
                        <label style={s.label}>Dose <span style={s.optional}>(optional)</span></label>
                        <input value={medForm.dose} onChange={e => setMedForm(f => ({ ...f, dose: e.target.value }))} placeholder="e.g. 25mg, 1 tablet" style={s.input}/>
                      </div>
                    </div>

                    {/* Frequency */}
                    <div style={s.formGroup}>
                      <label style={s.label}>How often <span style={s.optional}>(optional)</span></label>
                      <select value={medForm.frequency} onChange={e => setMedForm(f => ({ ...f, frequency: e.target.value }))} style={{ ...s.input, WebkitAppearance: "none" }}>
                        <option value="">Select frequency...</option>
                        {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>

                    {/* Notes */}
                    <div style={s.formGroup}>
                      <label style={s.label}>Notes <span style={s.optional}>(optional)</span></label>
                      <input value={medForm.notes} onChange={e => setMedForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Take on empty stomach, avoid grapefruit..." style={s.input}/>
                    </div>

                    {/* Reminder toggle */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
                        <input type="checkbox" checked={medForm.reminder} onChange={() => setMedForm(f => ({ ...f, reminder: !f.reminder }))} style={{ accentColor: SAGE_DARK, width: 16, height: 16 }}/>
                        <span style={{ fontSize: "0.875rem", color: INK }}>Set daily reminder</span>
                      </label>
                      {medForm.reminder && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingLeft: "1.5rem" }}>
                          <span style={{ fontSize: "0.8rem", color: WARM_GRAY }}>Remind me daily at</span>
                          <BPTimePicker value={medForm.reminderTime} onChange={val => setMedForm(f => ({ ...f, reminderTime: val }))}/>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                      <button onClick={() => { setShowMedForm(false); setMedEditId(null); setMedForm(blankMed); }} style={s.cancelBtn}>Cancel</button>
                      <button onClick={handleSaveMed} disabled={!medForm.name.trim()} style={{ ...s.saveBtn, opacity: medForm.name.trim() ? 1 : 0.5 }}>
                        {medEditId ? "Save changes" : "Add medication"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Medication list */}
              {medications.length === 0 && !showMedForm && !showBulk ? (
                <div style={s.emptyState}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💊</div>
                  <h2 style={s.emptyTitle}>No medications yet</h2>
                  <p style={s.emptyDesc}>Add your medications once — then select them with one tap when logging daily entries.</p>
                  <button onClick={() => setShowMedForm(true)} style={s.addBtn}>+ Add first medication</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {medications.map(med => (
                    <div key={med.id} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK }}>{med.name}</span>
                          {med.dose && <span style={{ fontSize: "0.82rem", color: SAGE_DARK, fontWeight: 600 }}>{med.dose}</span>}
                          {med.frequency && <span style={{ fontSize: "0.75rem", color: WARM_GRAY, background: CREAM, borderRadius: "100px", padding: "0.15rem 0.6rem" }}>{med.frequency}</span>}
                        </div>
                        {med.notes && <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: "0 0 0.3rem", fontStyle: "italic" }}>{med.notes}</p>}
                        {med.reminder && (
                          <span style={{ fontSize: "0.7rem", background: SAGE_LIGHT, color: SAGE_DARK, borderRadius: "100px", padding: "0.15rem 0.6rem", fontWeight: 500 }}>
                            ⏰ {(() => {
                              const [hh, mm] = med.reminderTime.split(":").map(Number);
                              const p = hh >= 12 ? "PM" : "AM";
                              return `Daily ${hh % 12 || 12}:${String(mm).padStart(2,"0")} ${p}`;
                            })()}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                        <button onClick={() => handleEditMed(med)} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "6px", padding: "0.25rem 0.65rem", fontSize: "0.72rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                        <button onClick={() => handleDeleteMed(med.id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: "0.72rem", color: "#aaa", textAlign: "center", marginTop: "0.5rem", fontStyle: "italic" }}>
                    {medications.length} medication{medications.length !== 1 ? "s" : ""} saved · These appear as quick-select options when logging entries
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Delete confirmation ── */}
      {confirmDeleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setConfirmDeleteId(null)}>
          <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "2rem", maxWidth: 360, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "2rem", textAlign: "center", marginBottom: "0.75rem" }}>🗑️</div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.15rem", fontWeight: 700, color: INK, margin: "0 0 0.5rem", textAlign: "center" }}>Delete this entry?</h3>
            <p style={{ fontSize: "0.85rem", color: WARM_GRAY, textAlign: "center", margin: "0 0 1.5rem", lineHeight: 1.6 }}>This entry will be permanently removed from your tracker. This cannot be undone.</p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{ flex: 1, background: "transparent", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.7rem", fontSize: "0.875rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
              >Keep entry</button>
              <button
                onClick={confirmDelete}
                style={{ flex: 1, background: "#c0392b", color: "#fff", border: "none", borderRadius: "100px", padding: "0.7rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >Yes, delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={s.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}><h2 style={s.modalTitle}>{editingEntry ? "Edit entry" : "Log an entry"}</h2><button onClick={() => setShowForm(false)} style={s.modalClose}>✕</button></div>
            <div style={s.modalBody}>
              <div style={s.formGroup}><label style={s.label}>What symptoms are you experiencing?</label><textarea value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} placeholder="Describe what you're feeling right now…" style={s.textarea} rows={3}/></div>
              <div style={s.formGroup}><label style={s.label}>Symptom severity right now</label><SeveritySlider value={form.severity} onChange={v => setForm(f => ({ ...f, severity: v }))}/></div>
              <div style={s.formGroup}><label style={s.label}>Food & Drink</label><textarea value={form.food} onChange={e => setForm(f => ({ ...f, food: e.target.value }))} placeholder="Have you eaten or had anything to drink?" style={s.textarea} rows={2}/></div>

              <div style={s.formGroup}>
                <label style={s.label}>Medications taken</label>
                <MedPicker
                  medications={medications}
                  selectedIds={form.selectedMedIds || []}
                  onToggle={id => setForm(f => ({
                    ...f,
                    selectedMedIds: f.selectedMedIds.includes(id)
                      ? f.selectedMedIds.filter(i => i !== id)
                      : [...f.selectedMedIds, id]
                  }))}
                  onAddAll={() => setForm(f => ({ ...f, selectedMedIds: medications.map(m => m.id) }))}
                  manualText={form.medications}
                  onManualChange={val => setForm(f => ({ ...f, medications: val }))}
                  onSaveUnlisted={{
                    enabled: form.saveUnlistedMed,
                    toggle: () => setForm(f => ({ ...f, saveUnlistedMed: !f.saveUnlistedMed }))
                  }}
                />
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

              <div style={s.formGroup}>
                <label style={s.label}>Photos <span style={s.optional}>(optional — up to 3, max 2MB each)</span></label>
                <label style={s.photoUploadArea}>
                  <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoUpload}/>
                  <span style={s.photoUploadIcon}>📷</span>
                  <span style={s.photoUploadText}>Tap to add photos</span>
                  <span style={s.photoUploadSub}>Rashes, swelling, bruising — anything worth documenting</span>
                </label>
                {(form.photos || []).length > 0 && (
                  <div style={s.photoPreviewRow}>
                    {(form.photos || []).map((photo, idx) => (
                      <div key={idx} style={s.photoPreviewWrap}>
                        <img src={photo.data} alt={photo.name} style={s.photoPreview}/>
                        <button onClick={() => removePhoto(idx)} style={s.photoRemoveBtn}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
  insightDivider: { border: "none", borderTop: `1px solid ${SAGE_LIGHT}`, margin: "0.5rem 0" },
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
  photoUploadArea: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", padding: "1.25rem", borderRadius: "0.75rem", border: `2px dashed rgba(74,112,88,0.3)`, background: SAGE_LIGHT, cursor: "pointer", textAlign: "center" },
  photoUploadIcon: { fontSize: "1.5rem" },
  photoUploadText: { fontSize: "0.9rem", fontWeight: 600, color: SAGE_DARK },
  photoUploadSub: { fontSize: "0.75rem", color: WARM_GRAY },
  photoPreviewRow: { display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" },
  photoPreviewWrap: { position: "relative", display: "inline-block" },
  photoPreview: { width: 80, height: 80, objectFit: "cover", borderRadius: "0.6rem", border: `1px solid rgba(0,0,0,0.1)` },
  photoRemoveBtn: { position: "absolute", top: -6, right: -6, background: "#c0392b", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: "0.6rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 },
  entryPhotos: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  entryPhotoRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  entryPhotoThumb: { width: 72, height: 72, objectFit: "cover", borderRadius: "0.5rem", border: `1px solid rgba(0,0,0,0.1)`, cursor: "pointer" },
  cancelBtn: { background: "transparent", border: `1.5px solid rgba(0,0,0,0.15)`, color: WARM_GRAY, padding: "0.7rem 1.5rem", borderRadius: "100px", fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit" },
  saveBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.7rem 1.75rem", borderRadius: "100px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  footer: { padding: "1.5rem 2rem", borderTop: `1px solid rgba(0,0,0,0.07)`, textAlign: "center" },
  footerText: { fontSize: "0.85rem", color: WARM_GRAY, margin: "0 0 0.25rem" },
  footerLink: { color: SAGE_DARK, textDecoration: "none" },
  footerDisclaimer: { fontSize: "0.75rem", color: "#aaa", margin: 0 },
  insightsLoadingOverlay: { position: "fixed", inset: 0, background: "rgba(250,250,248,0.96)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", backdropFilter: "blur(4px)" },
  insightsLoadingCard: { background: "#fff", borderRadius: "1.5rem", border: "1px solid rgba(0,0,0,0.07)", padding: "2.5rem 2rem", maxWidth: 480, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem", boxShadow: "0 8px 40px rgba(0,0,0,0.08)" },
  insightsLoadingTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: 0 },
  insightsLoadingDesc: { fontSize: "0.9rem", color: WARM_GRAY, lineHeight: 1.75, margin: 0, maxWidth: 380 },
  insightsLoadingBarWrap: { width: "100%", height: 6, background: SAGE_LIGHT, borderRadius: 100, overflow: "hidden" },
  insightsLoadingBar: { height: "100%", borderRadius: 100, background: SAGE_DARK, animation: "insightProgress 22s ease-in-out forwards" },
  insightsLoadingNote: { fontSize: "0.78rem", color: "#aaa", margin: 0, fontStyle: "italic" },
  insightsReportHeader: { background: "#fff", borderRadius: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" },
  insightsReportHeaderTop: { display: "flex", gap: "1.25rem", alignItems: "flex-start" },
  insightsReportEyebrow: { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.35rem" },
  insightsReportActions: { display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" },
  insightsExportBtn: { background: TEAL, color: "#fff", border: "none", padding: "0.65rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  insightsFooter: { background: SAGE_LIGHT, borderRadius: "1rem", padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", textAlign: "center" },
  insightsFooterNote: { fontSize: "0.92rem", color: SAGE_DARK, lineHeight: 1.7, margin: 0, fontStyle: "italic" },
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
