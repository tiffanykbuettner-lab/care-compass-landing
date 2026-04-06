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
const CHECKIN_KEY = "care-compass-checkins-v1";
const LABS_KEY    = "care-compass-labs-v1";

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
          <button onClick={e => { e.stopPropagation(); onDelete(entry.id); }} style={{ ...s.deleteBtn, color: "#bbb" }} title="Delete entry"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
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
            {reading.pulse && <span style={{ fontSize: "0.75rem", color: WARM_GRAY, display:"inline-flex", alignItems:"center", gap:"0.25rem" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M1 8h3l2-5 2 10 2-6 1 3h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> {reading.pulse} bpm</span>}
            {reading.arm && <span style={{ fontSize: "0.72rem", color: "#aaa" }}>{reading.arm} arm</span>}
          </div>
          <div style={{ fontSize: "0.78rem", color: WARM_GRAY }}>{formatBPTime(reading.timestamp)}</div>
          {reading.notes && <div style={{ fontSize: "0.78rem", color: INK_LIGHT, marginTop: "0.25rem", fontStyle: "italic" }}>{reading.notes}</div>}
          {reading.position && <div style={{ fontSize: "0.72rem", color: "#aaa" }}>{reading.position}</div>}
        </div>
      </div>
      <button onClick={() => onDelete(reading.id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: "1rem", padding: "0.25rem", flexShrink: 0 }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
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
  "As needed (PRN)", "At bedtime", "Every 4 hours", "Every 6 hours",
  "Every 8 hours", "Once daily", "Three times daily", "Twice daily",
  "Weekly", "With meals", "Other",
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


/* ─── SearchableSelect — type-to-search dropdown ─────────────────────────── */
function SearchableSelect({ value, onChange, options, placeholder = "Select...", style: extraStyle = {} }) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen]   = React.useState(false);
  const ref = React.useRef(null);
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(""); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const selectedLabel = options.find(o => (o.value !== undefined ? o.value : o) === value)?.label ?? value ?? "";
  const filtered = options.filter(o => { const l = o.label ?? o; return !query || l.toLowerCase().includes(query.toLowerCase()); });
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50); }}
        style={{ padding: "0.75rem 1rem", borderRadius: "0.65rem", border: `1.5px solid ${open ? SAGE_DARK : "rgba(0,0,0,0.12)"}`, fontSize: "0.92rem", color: INK, background: "#fafaf8", outline: "none", fontFamily: "inherit", cursor: "pointer", width: "100%", boxSizing: "border-box", ...extraStyle }}>
        {open ? (
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder={selectedLabel || placeholder}
            style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "0.92rem", color: INK, fontFamily: "inherit" }} autoComplete="off"/>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: selectedLabel ? INK : "#aaa" }}>{selectedLabel || placeholder}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}><path d="M2 4l4 4 4-4" stroke={WARM_GRAY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        )}
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999, background: "#fff", borderRadius: "0.75rem", border: "1.5px solid rgba(0,0,0,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", maxHeight: 240, overflowY: "auto" }}>
          {filtered.length === 0 ? <div style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#aaa" }}>No matches</div>
          : filtered.map((o, i) => {
            const val = o.value !== undefined ? o.value : o;
            const label = o.label ?? o;
            const isSel = val === value;
            return <div key={String(val)+i} onMouseDown={() => { onChange(val); setOpen(false); setQuery(""); }}
              style={{ padding: "0.65rem 1rem", fontSize: "0.875rem", cursor: "pointer", color: isSel ? SAGE_DARK : INK, background: isSel ? SAGE_LIGHT : "transparent", fontWeight: isSel ? 600 : 400, fontFamily: "inherit", borderBottom: i < filtered.length-1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
              onMouseEnter={e => { if(!isSel) e.currentTarget.style.background="#f5f9f6"; }}
              onMouseLeave={e => { if(!isSel) e.currentTarget.style.background="transparent"; }}>
              {query ? (() => { const idx=label.toLowerCase().indexOf(query.toLowerCase()); if(idx<0) return label; return <>{label.slice(0,idx)}<strong style={{color:SAGE_DARK}}>{label.slice(idx,idx+query.length)}</strong>{label.slice(idx+query.length)}</>; })() : label}
            </div>;
          })}
        </div>
      )}
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


/* ─────────────────────────────────────────────────────────────────────────── */
/* ─── Lab Results Tab                                                      ── */
/* ─────────────────────────────────────────────────────────────────────────── */


function LabResultsTab({ entries }) {
  const LABS_STORAGE = "care-compass-labs-v1";
  const [savedLabs, setSavedLabs] = React.useState(() => {
    try { const s = localStorage.getItem(LABS_STORAGE); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [analyzing, setAnalyzing]     = React.useState(false);
  const [selectedLab, setSelectedLab] = React.useState(null);
  const [view, setView]               = React.useState("list");
  const [dragOver, setDragOver]       = React.useState(false);
  const [uploadError, setUploadError] = React.useState("");
  const fileInputRef = React.useRef(null);

  const saveLabs = (updated) => {
    setSavedLabs(updated);
    try { localStorage.setItem(LABS_STORAGE, JSON.stringify(updated)); } catch {}
  };

  const deleteLab = (id) => {
    if (window.confirm("Delete this result?")) saveLabs(savedLabs.filter(l => l.id !== id));
  };

  const getUserContext = () => {
    const displayName = localStorage.getItem("cc-display-name") || "";
    const profile = (() => { try { return JSON.parse(localStorage.getItem("cc-profile") || "{}"); } catch { return {}; } })();
    const meds = (() => { try { return JSON.parse(localStorage.getItem("care-compass-medications-v1") || "[]"); } catch { return []; } })();
    const family = (() => { try { return JSON.parse(localStorage.getItem("cc-family-history") || "[]"); } catch { return []; } })();
    const recentEntries = (entries || []).slice(0, 14);
    const medsStr = meds.filter(m => m.name).map(m => m.name + (m.dose ? " " + m.dose : "") + (m.frequency ? " (" + m.frequency + ")" : "")).join(", ");
    const conditionsStr = (profile.conditions || []).join(", ");
    const familyStr = family.filter(e => e.member && e.conditions && e.conditions.length).map(e => e.member + ": " + e.conditions.join(", ")).join("; ");
    const symptomSummary = recentEntries.length
      ? "Recent symptoms (last " + recentEntries.length + " log entries): " + recentEntries.slice(0, 5).map(e => "[Sev " + e.severity + "/10] " + (e.symptoms || "no symptoms noted")).join(" | ")
      : "";
    return { displayName, medsStr, conditionsStr, familyStr, symptomSummary };
  };

  const analyzeLabResult = async (file) => {
    setAnalyzing(true);
    setUploadError("");
    const ctx = getUserContext();
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const isImage = file.type.startsWith("image/");

      const systemPrompt = "You are a compassionate health navigation assistant for Care Compass. Your role is to help people with chronic and complex illness understand their lab results in plain language and know how to advocate for themselves. CRITICAL: Normal range does not always mean optimal for this individual. Flag values that are technically within range but at the edges, or that are commonly suboptimal for people with certain conditions. Be an advocate, not just a translator. Never diagnose. Be warm, clear, and empowering.";

      const userPrompt = "Please analyze the attached lab result for this patient.\n\nPATIENT CONTEXT (use this to give personalised insights):\n" +
        (ctx.conditionsStr ? "Existing conditions: " + ctx.conditionsStr + "\n" : "No formal diagnoses listed\n") +
        (ctx.medsStr ? "Current medications: " + ctx.medsStr + "\n" : "") +
        (ctx.familyStr ? "Family history: " + ctx.familyStr + "\n" : "") +
        (ctx.symptomSummary ? ctx.symptomSummary + "\n" : "") +
        "\nPlease provide your analysis in these sections:\n\n" +
        "## What These Results Show\n" +
        "Go through each test result. For each: test name, value, reference range, plain-language explanation of what it measures and what this result means.\n\n" +
        "## Results to Pay Attention To\n" +
        "Flag any results that are out of range, borderline (within 15% of the limit), or technically normal but potentially significant given this patient's symptoms. Explain WHY each flagged result may be significant in their context. This is the most important section.\n\n" +
        "## What Normal Does Not Always Mean\n" +
        "If any results were likely dismissed as normal, explain what the result actually indicates and why it might still be relevant to explore further given their reported symptoms.\n\n" +
        "## Questions to Ask Your Doctor\n" +
        "Give 5-8 specific, assertive questions this patient can bring to their next appointment. Make them concrete and ready to use verbatim.\n\n" +
        "## Further Tests Worth Requesting\n" +
        "Based on these results AND the patient's symptom context, suggest specific additional tests that may be valuable. Explain why each is relevant.\n\n" +
        "## Specialists Who May Help\n" +
        "Based on these results and the patient's symptom picture, suggest specialists who might offer useful perspective. Explain the connection.\n\n" +
        "## Advocating for Yourself\n" +
        "Close with a brief, warm paragraph empowering the patient to advocate for follow-up if their concerns are not being addressed.";

      const messageContent = isImage
        ? [{ type: "image", source: { type: "base64", media_type: file.type, data: base64 } }, { type: "text", text: userPrompt }]
        : [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }, { type: "text", text: userPrompt }];

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
          max_tokens: 3000,
          system: systemPrompt,
          messages: [{ role: "user", content: messageContent }],
        }),
      });

      if (!response.ok) throw new Error("API error " + response.status);
      const data = await response.json();
      const analysis = data.content?.[0]?.text || "";

      const newLab = {
        id: Date.now(),
        name: file.name.replace(/\.[^.]+$/, ""),
        fileName: file.name,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        analysis,
        contextSnapshot: { conditions: ctx.conditionsStr, medications: ctx.medsStr },
      };

      const updated = [newLab, ...savedLabs];
      saveLabs(updated);
      setSelectedLab(newLab);
      setView("detail");
    } catch (err) {
      console.error(err);
      setUploadError("We had trouble analyzing this result. Please try again or check your file format.");
    }
    setAnalyzing(false);
  };

  const handleFile = (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    if (!allowed.includes(file.type) && !file.type.startsWith("image/")) {
      setUploadError("Please upload a JPG, PNG, HEIC, or PDF file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("File is too large. Please use a file under 20MB.");
      return;
    }
    setUploadError("");
    analyzeLabResult(file);
  };

  const renderAnalysis = (text) => {
    if (!text) return null;
    const sections = text.split(/\n(?=## )/);
    return sections.map((section, i) => {
      const newlineIdx = section.indexOf("\n");
      const heading = newlineIdx > 0 ? section.slice(0, newlineIdx).replace(/^## /, "").trim() : section.replace(/^## /, "").trim();
      const body = newlineIdx > 0 ? section.slice(newlineIdx + 1).trim() : "";
      if (!heading) return null;

      const highlights = {
        "Results to Pay Attention To":   { bg: "#fff8e8", border: "#f0d58a", head: "#9a6f00" },
        "What Normal Does Not Always Mean": { bg: "#fff0f0", border: "#f5c0c0", head: "#9b2c2c" },
        "Questions to Ask Your Doctor":  { bg: "#f0f4ff", border: "#c0caf5", head: "#2c3d9b" },
        "Advocating for Yourself":       { bg: SAGE_LIGHT, border: SAGE, head: SAGE_DARK },
      };
      const col = highlights[heading] || { bg: "#fff", border: "rgba(0,0,0,0.08)", head: SAGE_DARK };

      const bodyLines = body.split("\n");
      const renderedLines = bodyLines.map((line, j) => {
        if (!line.trim()) return null;
        const isBullet = line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ");
        const isBold = /^\*\*(.+)\*\*/.test(line.trim());
        if (isBullet) {
          return (
            <div key={j} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.375rem" }}>
              <span style={{ color: col.head, flexShrink: 0, marginTop: "0.1rem", fontSize: "0.75rem" }}>&#9670;</span>
              <span style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.7 }}>{line.replace(/^[-*•]\s*/, "").replace(/\*\*/g, "")}</span>
            </div>
          );
        }
        if (isBold) {
          return <p key={j} style={{ fontSize: "0.875rem", fontWeight: 700, color: INK, margin: "0.5rem 0 0.1rem" }}>{line.replace(/\*\*/g, "")}</p>;
        }
        return <p key={j} style={{ fontSize: "0.875rem", color: INK, lineHeight: 1.75, margin: "0.2rem 0" }}>{line}</p>;
      });

      return (
        <div key={i} style={{ background: col.bg, border: "1px solid " + col.border, borderRadius: "0.875rem", padding: "1rem 1.25rem", marginBottom: "0.875rem" }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: col.head, margin: "0 0 0.625rem" }}>{heading}</h3>
          <div>{renderedLines}</div>
        </div>
      );
    });
  };

  const LOCK_ICON = <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="10.5" r="1" fill="currentColor"/></svg>;
  const CLIP_ICON = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}><rect x="3" y="3" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M6 3V2h4v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M5.5 8h5M5.5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
  const ATTACH_ICON = <svg width="22" height="22" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle" }}><path d="M13 7.5l-5.5 5.5a4 4 0 01-5.7-5.6L7 2.3a2.5 2.5 0 013.5 3.5L5.3 11a1 1 0 01-1.4-1.4l4.8-4.9" stroke={SAGE_DARK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  const TIP_ICON = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}><path d="M8 2a4 4 0 00-1.5 7.7V11h3V9.7A4 4 0 008 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6.5 11v1.5a1.5 1.5 0 003 0V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
  const WARN_ICON = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}><path d="M8 2L1 14h14L8 2z" stroke="#9b2c2c" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 7v3" stroke="#9b2c2c" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="12" r="0.7" fill="#9b2c2c"/></svg>;
  const BACK_ICON = <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle" }}><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  const TRASH_ICON = <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle" }}><path d="M2 4h12M5 4V2h6v2M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 7v5M10 7v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;

  if (view === "detail" && selectedLab) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <button onClick={() => setView("list")} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "8px", padding: "0.4rem 0.75rem", fontSize: "0.8rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            {BACK_ICON} All results
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: INK, margin: 0 }}>{selectedLab.name}</h2>
            <p style={{ fontSize: "0.72rem", color: WARM_GRAY, margin: 0 }}>
              {"Uploaded " + new Date(selectedLab.uploadedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              {selectedLab.contextSnapshot && selectedLab.contextSnapshot.conditions ? " · " + selectedLab.contextSnapshot.conditions : ""}
            </p>
          </div>
          <button onClick={() => window.print()} style={{ background: SAGE_DARK, color: "#fff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            Save as PDF
          </button>
        </div>

        {selectedLab.contextSnapshot && (selectedLab.contextSnapshot.conditions || selectedLab.contextSnapshot.medications) && (
          <div style={{ background: SAGE_LIGHT, borderRadius: "0.75rem", padding: "0.625rem 1rem", fontSize: "0.75rem", color: SAGE_DARK, lineHeight: 1.6 }}>
            <strong>Analyzed in context of: </strong>
            {[selectedLab.contextSnapshot.conditions, selectedLab.contextSnapshot.medications].filter(Boolean).join(" · ")}
          </div>
        )}

        <div>{renderAnalysis(selectedLab.analysis)}</div>

        <div style={{ background: "#fafaf8", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.75rem", padding: "0.875rem 1rem", fontSize: "0.75rem", color: WARM_GRAY, lineHeight: 1.65 }}>
          <strong style={{ color: INK }}>Important: </strong>
          This analysis is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always discuss your results with a qualified healthcare provider.
        </div>

        <button onClick={() => setView("list")} style={{ background: SAGE_DARK, color: "#fff", border: "none", borderRadius: "100px", padding: "0.875rem", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Upload another result
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: INK, margin: "0 0 0.3rem" }}>Lab Results</h2>
          <p style={{ fontSize: "0.82rem", color: WARM_GRAY, margin: 0, lineHeight: 1.6 }}>
            Upload lab results, imaging reports, or test results for a plain-language breakdown and next-step guidance — cross-referenced with your symptoms and health profile.
          </p>
        </div>
        <div style={{ padding: "0.875rem 1.5rem", background: SAGE_LIGHT, display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <span style={{ color: SAGE_DARK, marginTop: "0.1rem" }}>{TIP_ICON}</span>
          <div>
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: SAGE_DARK, margin: "0 0 0.15rem" }}>Your results, in full context</p>
            <p style={{ fontSize: "0.78rem", color: SAGE_DARK, lineHeight: 1.65, margin: 0 }}>
              Normal on a lab report does not always mean normal for you. Care Compass reads your results alongside your symptom patterns, medications, and health history — and helps you know what questions to ask next.
            </p>
          </div>
        </div>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => !analyzing && fileInputRef.current && fileInputRef.current.click()}
        style={{ border: "2px dashed " + (dragOver ? SAGE_DARK : analyzing ? SAGE : "rgba(0,0,0,0.12)"), borderRadius: "1rem", padding: "2.5rem 1.5rem", textAlign: "center", cursor: analyzing ? "default" : "pointer", background: dragOver ? SAGE_LIGHT : "#fff", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}
      >
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display:"none" }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = ""; }}/>

        {analyzing ? (
          <>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid " + SAGE, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }}/>
            <p style={{ fontSize: "0.95rem", fontWeight: 600, color: SAGE_DARK, margin: 0 }}>Analyzing your results...</p>
            <p style={{ fontSize: "0.8rem", color: WARM_GRAY, margin: 0 }}>Reading your results in the context of your health profile. This takes about 20-30 seconds.</p>
          </>
        ) : (
          <>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: SAGE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", color: SAGE_DARK }}>
              {ATTACH_ICON}
            </div>
            <div>
              <p style={{ fontSize: "0.95rem", fontWeight: 600, color: INK, margin: "0 0 0.25rem" }}>Upload a lab result or report</p>
              <p style={{ fontSize: "0.8rem", color: WARM_GRAY, margin: 0 }}>Photo, scan, or PDF · JPG, PNG, HEIC, PDF · up to 20MB</p>
            </div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center" }}>
              {["Blood work", "Thyroid panel", "Metabolic panel", "CBC", "Imaging report", "Hormone panel", "Urinalysis", "Genetic test"].map(type => (
                <span key={type} style={{ fontSize: "0.72rem", background: CREAM, color: WARM_GRAY, borderRadius: "100px", padding: "0.2rem 0.7rem" }}>{type}</span>
              ))}
            </div>
          </>
        )}
      </div>

      {uploadError && (
        <div style={{ background: "#fff0f0", border: "1px solid #f5c0c0", borderRadius: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#9b2c2c", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
          {WARN_ICON} <span style={{ marginLeft: "0.25rem" }}>{uploadError}</span>
        </div>
      )}

      {savedLabs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: 0 }}>Previous results</h3>
          {savedLabs.map(lab => (
            <div key={lab.id} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.08)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", cursor: "pointer" }}
              onClick={() => { setSelectedLab(lab); setView("detail"); }}>
              <div style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start", flex: 1 }}>
                <div style={{ width: 36, height: 36, borderRadius: "0.5rem", background: SAGE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: SAGE_DARK }}>
                  {CLIP_ICON}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.95rem", fontWeight: 700, color: INK, margin: "0 0 0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lab.name}</p>
                  <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: 0 }}>
                    {"Uploaded " + new Date(lab.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " · " + lab.fileName}
                  </p>
                  {lab.contextSnapshot && lab.contextSnapshot.conditions && (
                    <p style={{ fontSize: "0.72rem", color: SAGE_DARK, margin: "0.2rem 0 0", fontStyle: "italic" }}>{"Analyzed with: " + lab.contextSnapshot.conditions}</p>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                <button onClick={e => { e.stopPropagation(); setSelectedLab(lab); setView("detail"); }}
                  style={{ background: SAGE_LIGHT, border: "none", borderRadius: "6px", padding: "0.3rem 0.8rem", fontSize: "0.72rem", color: SAGE_DARK, cursor: "pointer", fontWeight: 600 }}>
                  View
                </button>
                <button onClick={e => { e.stopPropagation(); deleteLab(lab.id); }}
                  style={{ background: "none", border: "1px solid #f5c0c0", borderRadius: "6px", padding: "0.3rem 0.5rem", cursor: "pointer", color: "#c0392b", display: "flex", alignItems: "center" }}>
                  {TRASH_ICON}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {savedLabs.length === 0 && !analyzing && (
        <p style={{ textAlign: "center", fontSize: "0.82rem", color: WARM_GRAY, fontStyle: "italic", margin: 0 }}>
          No results uploaded yet. Upload your first lab result above to get started.
        </p>
      )}

      <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", padding: "0.875rem 1rem", background: "#fafaf8", borderRadius: "0.75rem", border: "1px solid rgba(0,0,0,0.08)" }}>
        <span style={{ color: SAGE_DARK, marginTop: "0.15rem" }}>{LOCK_ICON}</span>
        <p style={{ fontSize: "0.75rem", color: WARM_GRAY, lineHeight: 1.65, margin: 0 }}>
          <strong style={{ color: INK }}>Privacy: </strong>
          Your lab results are sent to the Anthropic AI to generate your analysis, then saved privately on this device only. They are never stored on our servers, sold, or shared.
        </p>
      </div>
    </div>
  );
}



/* ─── End Lab Results Tab ────────────────────────────────────────────────── */

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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showMorningCheckin, setShowMorningCheckin] = useState(false);
  const [showEveningCheckin, setShowEveningCheckin] = useState(false);
  const [morningForm, setMorningForm] = useState({ sleep: 7, severity: 5, symptoms: "", energy: 5, notes: "" });
  const [eveningForm, setEveningForm] = useState({ severity: 5, symptoms: "", food: "", medications: "", selectedMedIds: [], activity: "", stress: 5, notes: "" });
  const [checkinSaved, setCheckinSaved] = useState(""); // id of entry pending delete confirmation
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
          setSaveError("Storage limit reached — photos were not saved to keep your entries. Consider reducing photo size or clearing old entries.");
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
        return `${day}:${sleep ? ` Sleep: ${sleep.sleep}/10` : ""}${allMeds ? ` | Medications: ${allMeds}` : ""}${allFood ? ` | Food: ${allFood}` : ""}${allActivity ? ` | Activity/Function: ${allActivity}` : ""}\n${timeEntries}`;
      }).join("\n\n");

      const styleEl = document.createElement("style");
      styleEl.id = "insights-loading-styles";
      styleEl.innerHTML = INSIGHTS_LOADING_STYLES;
      document.head.appendChild(styleEl);

      const apptPromptContext = apptContext ? `

APPOINTMENT CONTEXT: This report is being generated to prepare for an upcoming ${apptContext.specialty} appointment${apptContext.doctor ? ` with ${apptContext.doctor}` : ""}${apptContext.date ? ` on ${new Date(apptContext.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}${apptContext.reason ? `. Reason for visit: ${apptContext.reason}` : ""}.

Please tailor your analysis specifically for a ${apptContext.specialty} visit. Focus on symptoms, patterns, and findings most relevant to ${apptContext.specialty} conditions. Prioritize insights the ${apptContext.specialty} would find most actionable. Add a ## Questions to Raise with Your ${apptContext.specialty} section at the end with specific, targeted questions based on the data.` : "";

      const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-opus-4-6", max_tokens: 4000, messages: [{ role: "user", content: `You are Care Compass, a compassionate health navigation assistant. Analyze these symptom tracker entries and identify patterns, triggers, and insights to discuss with a doctor.

CORE PHILOSOPHY — WEIGHT SYMPTOMS OVER LABELS:
Your analysis must be grounded primarily in what the user actually logs — their symptoms, timing, triggers, and patterns across days. Existing diagnoses and family history are context, not conclusions. Complex conditions are frequently misdiagnosed or incompletely diagnosed. A symptom pattern that doesn't fully align with a listed diagnosis is a signal worth noting, not ignoring. Let the data speak first, then layer in context.

WEIGHTING HIERARCHY:
1. HIGHEST — Logged symptoms and how they pattern across time, time-of-day, and days of the week
2. HIGH — Correlations with food, medications, activity, sleep, stress
3. MODERATE — Family history (genetic context)
4. LOWER — Existing diagnoses (treat as one possible explanation; flag if symptoms suggest something additional or misaligned)
5. LOWEST — Long-standing medications (unlikely to cause new symptoms unless recently changed)

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

FUNCTIONAL IMPACT INSTRUCTIONS — CRITICAL:
Scan every entry's activity field and symptom descriptions for mentions of activities that were difficult, modified, avoided, or impossible due to symptoms. These include (but are not limited to): driving, cooking, showering, getting dressed, blow-drying hair, laundry, grocery shopping, walking, climbing stairs, lifting, writing, typing, phone use, working, attending appointments, caring for children/pets, exercise, socialising, sleeping in a bed vs couch, and any other daily task. 

When you find these, compile them into a dedicated ## Daily Life Impact section. This section is one of the most important things a doctor can see — it translates abstract severity scores into real-world consequences. Be specific: quote or closely paraphrase what the user wrote. Group by activity type if multiple entries mention the same task.

Please provide a warm, specific analysis:
## Patterns We Notice
## Daily Life Impact
## Time-Based Correlations Worth Exploring
## Potential Triggers
## What's Improving vs Worsening
## Questions to Bring to Your Doctor

Never diagnose. Focus on patterns across days AND within-day timing. Be specific about which days or time patterns seem significant. If logged symptoms don't fully align with any existing diagnosis the user may have mentioned, gently note what the pattern does suggest and encourage them to explore it with their doctor. Many chronic illness patients carry incomplete or incorrect diagnoses — validating their lived experience is as important as pattern recognition.` + apptPromptContext + (bpReadings.length > 0 ? `

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

    // ── Check-in time detection ────────────────────────────────────────────────
  const getCheckinPrefs = () => {
    try {
      const s = localStorage.getItem("cc-notif-checkins");
      return s ? JSON.parse(s) : { morningTime: "04:00", eveningTime: "18:00" };
    } catch { return { morningTime: "04:00", eveningTime: "18:00" }; }
  };

  const hasDoneCheckinToday = (type) => {
    try {
      const s = localStorage.getItem(CHECKIN_KEY);
      if (!s) return false;
      const checkins = JSON.parse(s);
      const today = new Date().toDateString();
      return checkins.some(c => c.type === type && new Date(c.timestamp).toDateString() === today);
    } catch { return false; }
  };

  const saveCheckin = (type, data) => {
    try {
      const s = localStorage.getItem(CHECKIN_KEY);
      const existing = s ? JSON.parse(s) : [];
      const entry = { ...data, type, id: Date.now(), timestamp: new Date().toISOString(), tag: type === "morning" ? "Morning check-in" : "Evening check-in" };
      // Also save as a regular tracker entry
      saveEntries([entry, ...entries]);
      // Record checkin done
      existing.push({ type, timestamp: entry.timestamp });
      localStorage.setItem(CHECKIN_KEY, JSON.stringify(existing.slice(-60)));
    } catch {}
  };

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const prefs = getCheckinPrefs();
  const parseMins = (t) => { const [h, m] = (t || "00:00").split(":").map(Number); return h * 60 + m; };
  const morningStartMins = parseMins(prefs.morningTime);
  const eveningStartMins = parseMins(prefs.eveningTime);
  const isMorningTime = nowMins >= morningStartMins && nowMins < eveningStartMins;
  const isEveningTime = nowMins >= eveningStartMins;
  const shouldShowMorning = isMorningTime && !hasDoneCheckinToday("morning") && view === "log" && prefs.morningOn !== false;
  const shouldShowEvening = isEveningTime && !hasDoneCheckinToday("evening") && view === "log" && prefs.eveningOn !== false;

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
  const tabs = [{ id: "log", label: "Log" }, { id: "history", label: "History" }, { id: "trends", label: "Trends" }, { id: "insights", label: "AI Insights" }, { id: "report", label: "Doctor Report" }, { id: "bp", label: "Blood Pressure" }, { id: "labs", label: "Lab Results" }];

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
              <span style={{ color:"#7a9e87" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="10.5" r="1" fill="currentColor"/></svg></span>
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
              {saved && <div style={s.savedBanner}><span style={{ color:"#7a9e87", marginRight:"0.4rem" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 13c1-4 2-8 9-10-3 5-4 8-9 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M3 13c2-3 4-5 6-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg></span>{editingEntry ? "Entry updated!" : "Entry saved!"}</div>}
              {checkinSaved && <div style={{ ...s.savedBanner, background: TEAL_LIGHT, color: TEAL }}>{checkinSaved}</div>}

              {/* ── Logging philosophy tip — shown until dismissed ── */}
              {!localStorage.getItem("cc-log-tip-dismissed") && (
                <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "0.875rem", padding: "0.875rem 1rem 0.875rem 1.25rem", marginBottom: "0.75rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <span style={{ color:"#7a9e87", display:"flex", alignItems:"center" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M8 2a4 4 0 00-1.5 7.7V11h3V9.7A4 4 0 008 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6.5 11v1.5a1.5 1.5 0 003 0V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg></span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: INK, margin: "0 0 0.2rem" }}>Two ways to track — both work</p>
                    <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0, lineHeight: 1.6 }}>
                      <strong>Log as it happens</strong> for the most accurate patterns — tap "+ Log Entry" whenever you notice something. Or use <strong>morning & evening check-ins</strong> for a daily rhythm. If you logged throughout the day, your evening check-in is just a quick reflection — no need to re-enter what you already noted.
                    </p>
                  </div>
                  <button
                    onClick={() => { localStorage.setItem("cc-log-tip-dismissed", "1"); }}
                    style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: "1rem", padding: "0 0.25rem", flexShrink: 0, lineHeight: 1 }}
                  >×</button>
                </div>
              )}

              {/* ── Morning check-in banner ── */}
              {shouldShowMorning && !showMorningCheckin && (
                <div style={{ background: `linear-gradient(135deg, #fff8e8, #fff3d4)`, borderRadius: "1rem", border: "1px solid #f0d58a", padding: "1rem 1.25rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9a7a00", margin: "0 0 0.2rem" }}><span style={{ display:"flex", alignItems:"center", gap: "0.3rem" }}><svg width="18" height="18" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:"inline-block", verticalAlign:"middle", marginRight:"0.4rem" }}>
  <line x1="5" y1="26" x2="31" y2="26" stroke="#7a9e87" strokeWidth="2.2" strokeLinecap="round"/>
  <path d="M 9 26 A 9 9 0 0 1 27 26" fill="#7a9e87"/>
  <line x1="18" y1="4" x2="18" y2="11" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
  <line x1="28" y1="9" x2="24" y2="13" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
  <line x1="8" y1="9" x2="12" y2="13" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
  <line x1="32" y1="20" x2="27" y2="21" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
  <line x1="4" y1="20" x2="9" y2="21" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
</svg><span>Morning check-in</span></span></p>
                    <p style={{ fontSize: "0.88rem", fontWeight: 600, color: INK, margin: "0 0 0.15rem" }}>Good morning! How did you sleep?</p>
                    <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0 }}>A quick check-in takes under a minute.</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button onClick={() => setShowMorningCheckin(true)} style={{ background: "#e8a838", color: "#fff", border: "none", borderRadius: "100px", padding: "0.55rem 1.1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Check in →</button>
                    <button onClick={() => { saveCheckin("morning_skip", {}); }} style={{ background: "none", border: "none", fontSize: "0.75rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>Skip</button>
                  </div>
                </div>
              )}

              {/* ── Evening check-in banner ── */}
              {shouldShowEvening && !showEveningCheckin && (
                <div style={{ background: `linear-gradient(135deg, #f0ebff, #e8e0ff)`, borderRadius: "1rem", border: "1px solid #c4aff5", padding: "1rem 1.25rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5c3d9e", margin: "0 0 0.2rem" }}><span style={{ display:"flex", alignItems:"center", gap: "0.3rem" }}><svg width="18" height="18" viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:"inline-block", verticalAlign:"middle", marginRight:"0.4rem" }}>
  <line x1="0" y1="78" x2="80" y2="78" stroke="#4a7058" strokeWidth="3" strokeLinecap="round"/>
  <path d="M 58.5 21 A 28 28 0 1 0 58.5 63 A 22 22 0 1 1 58.5 21 Z" fill="#4a7058"/>
  <circle cx="68" cy="6"  r="3"   fill="#4a7058"/>
  <circle cx="8"  cy="18" r="2.2" fill="#4a7058"/>
  <circle cx="52" cy="2"  r="1.8" fill="#4a7058"/>
  <circle cx="22" cy="8"  r="1.8" fill="#4a7058"/>
</svg><span>Evening check-in</span></span></p>
                    <p style={{ fontSize: "0.88rem", fontWeight: 600, color: INK, margin: "0 0 0.15rem" }}>How was your day?</p>
                    <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: 0 }}>Reflect on today or summarise your symptoms.</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button onClick={() => setShowEveningCheckin(true)} style={{ background: "#7c5cbf", color: "#fff", border: "none", borderRadius: "100px", padding: "0.55rem 1.1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Check in →</button>
                    <button onClick={() => { saveCheckin("evening_skip", {}); }} style={{ background: "none", border: "none", fontSize: "0.75rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>Skip</button>
                  </div>
                </div>
              )}
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
                    <p style={{...s.insightsFooterNote, display:"flex", alignItems:"center", gap:"0.4rem"}}><span style={{ color:"#7a9e87" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 13c1-4 2-8 9-10-3 5-4 8-9 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M3 13c2-3 4-5 6-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg></span> Bring this report to your next appointment and ask your provider to help you explore these patterns.</p>
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

                    {/* ── Functional impact section ── */}
                    {(() => {
                      const ACTIVITY_KEYWORDS = [
                        "driv", "cook", "shower", "bath", "dress", "undress", "hair", "brush",
                        "laundry", "wash", "clean", "vacuum", "groceri", "shop", "lift", "carry",
                        "walk", "stairs", "climb", "stand", "sit", "bed", "sleep", "couch",
                        "work", "type", "write", "phone", "computer", "screen",
                        "exercise", "gym", "yoga", "stretch", "run", "swim",
                        "child", "kid", "pet", "dog", "cat", "feed",
                        "eat", "chew", "swallow", "drink",
                        "social", "friend", "family", "visit", "event", "cancel",
                        "appointment", "class", "school", "errands",
                        "couldn't", "unable", "difficult", "hard to", "struggle", "help",
                        "had to stop", "had to sit", "had to rest", "had to cancel",
                        "too tired", "too painful", "too dizzy", "too weak",
                        "limited", "impacted", "affected", "prevented", "missed",
                      ];
                      const impactEntries = entries.filter(e => {
                        const text = ((e.activity || "") + " " + (e.symptoms || "") + " " + (e.notes || "")).toLowerCase();
                        return ACTIVITY_KEYWORDS.some(kw => text.includes(kw));
                      });
                      if (!impactEntries.length) return null;
                      return (
                        <div style={{ ...s.reportSection, pageBreakInside: "avoid" }}>
                          <h3 style={s.reportSectionTitle}>Daily Life Impact</h3>
                          <p style={{ fontSize: "0.78rem", color: WARM_GRAY, margin: "0 0 0.875rem", fontStyle: "italic", lineHeight: 1.6 }}>
                            Activities and daily tasks affected by symptoms — shown to illustrate real-world severity.
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {impactEntries.slice(0, 20).map((e, i) => {
                              const date = new Date(e.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                              const time = new Date(e.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                              const impactText = [e.activity, e.symptoms, e.notes].filter(Boolean).join(" · ");
                              return (
                                <div key={e.id} style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start", padding: "0.65rem 0.875rem", background: i % 2 === 0 ? "#fff" : OFF_WHITE, borderRadius: "0.5rem", borderLeft: `3px solid ${severityColor(e.severity)}` }}>
                                  <div style={{ flexShrink: 0, textAlign: "center", minWidth: 52 }}>
                                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: INK }}>{date}</div>
                                    <div style={{ fontSize: "0.65rem", color: "#aaa" }}>{time}</div>
                                    <span style={{ ...s.severityBadge, background: severityColor(e.severity), fontSize: "0.65rem", marginTop: "0.2rem", display: "inline-block" }}>{e.severity}/10</span>
                                  </div>
                                  <div style={{ flex: 1, fontSize: "0.82rem", color: INK, lineHeight: 1.6 }}>
                                    {impactText}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {impactEntries.length > 20 && (
                            <p style={{ fontSize: "0.72rem", color: "#aaa", marginTop: "0.5rem", fontStyle: "italic" }}>
                              Showing 20 of {impactEntries.length} entries with functional impact
                            </p>
                          )}
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

              {bpSaved && <div style={s.savedBanner}>Reading saved!</div>}

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
                      <div style={{ color:"#7a9e87", display:"flex", justifyContent:"center", marginBottom:"0.5rem" }}><svg width="32" height="32" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M1 8h3l2-5 2 10 2-6 1 3h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
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
                                  <span style={{ color:"#7a9e87", display:"flex", alignItems:"center" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><circle cx="8" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 6.5V9l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 3.5L1.5 2M13 3.5L14.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg></span>
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
                                  <button onClick={() => deleteReminder(r.id)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
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
                      <button onClick={() => setShowBpForm(false)} style={s.modalClose}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
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

              {medSaved && <div style={s.savedBanner}>Saved!</div>}

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
                      <span style={{ ...s.uploadBtn, fontSize: "0.82rem" }}><span style={{ display:"inline-flex", alignItems:"center", gap:"0.35rem" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M13 7.5l-5.5 5.5a4 4 0 01-5.7-5.6L7 2.3a2.5 2.5 0 013.5 3.5L5.3 11a1 1 0 01-1.4-1.4l4.8-4.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> Upload .txt or .csv file</span></span>
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
                      <SearchableSelect
                        value={medForm.frequency}
                        onChange={val => setMedForm(f => ({ ...f, frequency: val }))}
                        options={["", ...FREQUENCIES].map(f => ({ value: f, label: f || "Select frequency..." }))}
                        placeholder="Select frequency..."
                      />
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
                  <div style={{ color:"#7a9e87", display:"flex", justifyContent:"center", marginBottom:"0.5rem" }}><svg width="32" height="32" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><rect x="2" y="6" width="12" height="4" rx="2" stroke="currentColor" strokeWidth="1.4"/><line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" strokeWidth="1.4"/></svg></div>
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
                        <button onClick={() => handleDeleteMed(med.id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: "1rem" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
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

          {view === "labs" && (
            <div style={s.tabContent}>
              <LabResultsTab entries={entries} />
            </div>
          )}
      </main>

      {/* ── Morning check-in modal ── */}
      {showMorningCheckin && (
        <div style={s.modalOverlay} onClick={() => setShowMorningCheckin(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={{ ...s.modalTitle, display:"flex", alignItems:"center" }}><svg width="18" height="18" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:"inline-block", verticalAlign:"middle", marginRight:"0.4rem" }}>
  <line x1="5" y1="26" x2="31" y2="26" stroke="#7a9e87" strokeWidth="2.2" strokeLinecap="round"/>
  <path d="M 9 26 A 9 9 0 0 1 27 26" fill="#7a9e87"/>
  <line x1="18" y1="4" x2="18" y2="11" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
  <line x1="28" y1="9" x2="24" y2="13" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
  <line x1="8" y1="9" x2="12" y2="13" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
  <line x1="32" y1="20" x2="27" y2="21" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
  <line x1="4" y1="20" x2="9" y2="21" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
</svg>Morning check-in</h2>
              <button onClick={() => setShowMorningCheckin(false)} style={s.modalClose}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
            </div>
            <div style={s.modalBody}>
              {/* Sleep quality */}
              <div style={s.formGroup}>
                <label style={s.label}>Sleep quality last night <span style={s.sevValue}>{morningForm.sleep}/10</span></label>
                <input type="range" min="1" max="10" step="1" value={morningForm.sleep}
                  onChange={e => setMorningForm(f => ({ ...f, sleep: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: TEAL }}/>
                <div style={s.sevLabels}><span style={s.sevLabel}>Poor</span><span style={s.sevLabel}>Excellent</span></div>
              </div>
              {/* Morning severity */}
              <div style={s.formGroup}>
                <label style={s.label}>How are you feeling this morning? <span style={s.sevValue}>{morningForm.severity}/10</span></label>
                <SeveritySlider value={morningForm.severity} onChange={v => setMorningForm(f => ({ ...f, severity: v }))}/>
              </div>
              {/* Energy level */}
              <div style={s.formGroup}>
                <label style={s.label}>Energy level <span style={s.sevValue}>{morningForm.energy}/10</span></label>
                <input type="range" min="1" max="10" step="1" value={morningForm.energy}
                  onChange={e => setMorningForm(f => ({ ...f, energy: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: "#e8a838" }}/>
                <div style={s.sevLabels}><span style={s.sevLabel}>Exhausted</span><span style={s.sevLabel}>Energised</span></div>
              </div>
              {/* Symptoms on waking */}
              <div style={s.formGroup}>
                <label style={s.label}>Any symptoms on waking? <span style={s.optional}>(optional)</span></label>
                <textarea value={morningForm.symptoms}
                  onChange={e => setMorningForm(f => ({ ...f, symptoms: e.target.value }))}
                  placeholder="e.g. stiff joints on waking (hands and knees), throbbing headache behind right eye — louder with movement, heart racing when I stood up from bed..."
                  style={s.textarea} rows={2}/>
              </div>
              {/* Notes */}
              <div style={s.formGroup}>
                <label style={s.label}>Anything else to note? <span style={s.optional}>(optional)</span></label>
                <textarea value={morningForm.notes}
                  onChange={e => setMorningForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. slept 6 hours, woke at 3am, vivid dreams..."
                  style={s.textarea} rows={2}/>
              </div>
            </div>
            <div style={s.modalFooter}>
              <button onClick={() => setShowMorningCheckin(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={() => {
                saveCheckin("morning", { sleep: morningForm.sleep, severity: morningForm.severity, stress: morningForm.energy, symptoms: morningForm.symptoms, notes: morningForm.notes });
                setShowMorningCheckin(false);
                setCheckinSaved("Morning check-in saved!");
                setTimeout(() => setCheckinSaved(""), 3000);
                setMorningForm({ sleep: 7, severity: 5, symptoms: "", energy: 5, notes: "" });
              }} style={s.saveBtn}>Save check-in →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Evening check-in modal — smart: adapts based on today's logged entries ── */}
      {showEveningCheckin && (() => {
        const todayEntries = entries.filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString() && e.tag !== "Evening check-in");
        const hasLoggedToday = todayEntries.length > 0;
        const todaySymptoms = [...new Set(todayEntries.map(e => e.symptoms).filter(Boolean))].join("; ");
        const todayActivity = [...new Set(todayEntries.map(e => e.activity).filter(Boolean))].join("; ");
        const todayFood = [...new Set(todayEntries.map(e => e.food).filter(Boolean))].join("; ");
        const avgSeverity = hasLoggedToday ? Math.round(todayEntries.reduce((s, e) => s + e.severity, 0) / todayEntries.length) : 5;
        return (
          <div style={s.modalOverlay} onClick={() => setShowEveningCheckin(false)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
              <div style={s.modalHeader}>
                <h2 style={{ ...s.modalTitle, display:"flex", alignItems:"center" }}><svg width="18" height="18" viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:"inline-block", verticalAlign:"middle", marginRight:"0.4rem" }}>
  <line x1="0" y1="78" x2="80" y2="78" stroke="#4a7058" strokeWidth="3" strokeLinecap="round"/>
  <path d="M 58.5 21 A 28 28 0 1 0 58.5 63 A 22 22 0 1 1 58.5 21 Z" fill="#4a7058"/>
  <circle cx="68" cy="6"  r="3"   fill="#4a7058"/>
  <circle cx="8"  cy="18" r="2.2" fill="#4a7058"/>
  <circle cx="52" cy="2"  r="1.8" fill="#4a7058"/>
  <circle cx="22" cy="8"  r="1.8" fill="#4a7058"/>
</svg>Evening check-in</h2>
                <button onClick={() => setShowEveningCheckin(false)} style={s.modalClose}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
              </div>
              <div style={s.modalBody}>

                {/* Context banner — adapts to whether user logged today */}
                {hasLoggedToday ? (
                  <div style={{ background: SAGE_LIGHT, borderRadius: "0.75rem", padding: "0.75rem 1rem", marginBottom: "0.25rem" }}>
                    <p style={{ fontSize: "0.78rem", fontWeight: 600, color: SAGE_DARK, margin: "0 0 0.2rem" }}>
                      You logged {todayEntries.length} {todayEntries.length === 1 ? "entry" : "entries"} today
                    </p>
                    <p style={{ fontSize: "0.75rem", color: SAGE_DARK, margin: 0, lineHeight: 1.6 }}>
                      This is just a reflection — no need to repeat what you already noted. Add anything you missed or want to capture overall.
                    </p>
                  </div>
                ) : (
                  <div style={{ background: "#fff8e8", borderRadius: "0.75rem", padding: "0.75rem 1rem", marginBottom: "0.25rem", border: "1px solid #f0d58a" }}>
                    <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#9a7a00", margin: "0 0 0.2rem" }}>No entries logged today yet</p>
                    <p style={{ fontSize: "0.75rem", color: "#9a7a00", margin: 0, lineHeight: 1.6 }}>
                      This is a great opportunity to capture your full day in one go.
                    </p>
                  </div>
                )}

                {/* Day severity */}
                <div style={s.formGroup}>
                  <label style={s.label}>How was your day overall? <span style={s.sevValue}>{eveningForm.severity}/10</span></label>
                  <SeveritySlider value={hasLoggedToday && eveningForm.severity === 5 ? avgSeverity : eveningForm.severity} onChange={v => setEveningForm(f => ({ ...f, severity: v }))}/>
                  {hasLoggedToday && <p style={{ fontSize: "0.72rem", color: "#aaa", margin: "0.3rem 0 0", fontStyle: "italic" }}>Pre-set from your logged entries — adjust if your overall day felt different</p>}
                </div>

                {/* Symptoms — guided prompt for depth */}
                <div style={s.formGroup}>
                  <label style={s.label}>
                    {hasLoggedToday ? "Anything to add about your symptoms?" : "How did you feel today?"}
                    <span style={s.optional}> (optional)</span>
                  </label>
                  {hasLoggedToday && todaySymptoms && (
                    <div style={{ background: OFF_WHITE, borderRadius: "0.5rem", padding: "0.5rem 0.75rem", marginBottom: "0.5rem", fontSize: "0.75rem", color: WARM_GRAY, fontStyle: "italic", lineHeight: 1.5 }}>
                      Already noted: {todaySymptoms.length > 120 ? todaySymptoms.slice(0, 120) + "..." : todaySymptoms}
                    </div>
                  )}
                  <textarea value={eveningForm.symptoms}
                    onChange={e => setEveningForm(f => ({ ...f, symptoms: e.target.value }))}
                    placeholder={hasLoggedToday ? "Anything that changed as the day went on, or symptoms you didn't capture earlier?" : "Describe each symptom with as much detail as you can — where in your body, what it felt like (throbbing, stabbing, dull), what triggered or worsened it, what helped..."}
                    style={s.textarea} rows={hasLoggedToday ? 2 : 3}/>
                </div>

                {/* Functional impact — always shown, key for doctor reports */}
                <div style={s.formGroup}>
                  <label style={s.label}>What did your symptoms stop or limit you from doing? <span style={s.optional}>(optional)</span></label>
                  <textarea value={eveningForm.activity}
                    onChange={e => setEveningForm(f => ({ ...f, activity: e.target.value }))}
                    placeholder="e.g. couldn't drive due to dizziness, had to sit while cooking, skipped the gym, needed help getting dressed, light sensitivity made screen use painful..."
                    style={s.textarea} rows={2}/>
                  {hasLoggedToday && todayActivity && (
                    <p style={{ fontSize: "0.72rem", color: "#aaa", margin: "0.3rem 0 0", fontStyle: "italic" }}>Already noted: {todayActivity.length > 80 ? todayActivity.slice(0,80)+"..." : todayActivity}</p>
                  )}
                </div>

                {/* Only show food/meds if they haven't logged today */}
                {!hasLoggedToday && (
                  <>
                    <div style={s.formGroup}>
                      <label style={s.label}>Medications today</label>
                      <MedPicker
                        medications={medications}
                        selectedIds={eveningForm.selectedMedIds || []}
                        onToggle={id => setEveningForm(f => ({ ...f, selectedMedIds: f.selectedMedIds.includes(id) ? f.selectedMedIds.filter(i => i !== id) : [...f.selectedMedIds, id] }))}
                        onAddAll={() => setEveningForm(f => ({ ...f, selectedMedIds: medications.map(m => m.id) }))}
                        manualText={eveningForm.medications}
                        onManualChange={val => setEveningForm(f => ({ ...f, medications: val }))}
                      />
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>Food & drink today <span style={s.optional}>(optional)</span></label>
                      <textarea value={eveningForm.food}
                        onChange={e => setEveningForm(f => ({ ...f, food: e.target.value }))}
                        placeholder="Anything notable about what you ate or drank today?"
                        style={s.textarea} rows={2}/>
                    </div>
                  </>
                )}

                {/* Stress */}
                <div style={s.formGroup}>
                  <label style={s.label}>Stress level today <span style={s.sevValue}>{eveningForm.stress}/10</span></label>
                  <input type="range" min="1" max="10" step="1" value={eveningForm.stress}
                    onChange={e => setEveningForm(f => ({ ...f, stress: Number(e.target.value) }))}
                    style={{ width: "100%", accentColor: SAGE_DARK }}/>
                  <div style={s.sevLabels}><span style={s.sevLabel}>Low</span><span style={s.sevLabel}>High</span></div>
                </div>

                {/* Reflections */}
                <div style={s.formGroup}>
                  <label style={s.label}>
                    {hasLoggedToday ? "Anything else to reflect on?" : "Reflections"}
                    <span style={s.optional}> (optional)</span>
                  </label>
                  <textarea value={eveningForm.notes}
                    onChange={e => setEveningForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder={hasLoggedToday ? "Overall thoughts on today — any patterns you noticed, how the day compared to others, anything worth remembering..." : "Anything you want to remember or reflect on from today..."}
                    style={s.textarea} rows={2}/>
                </div>
              </div>
              <div style={s.modalFooter}>
                <button onClick={() => setShowEveningCheckin(false)} style={s.cancelBtn}>Cancel</button>
                <button onClick={() => {
                  const selectedMedsStr = buildMedString(eveningForm.selectedMedIds || []);
                  const finalMeds = [selectedMedsStr, eveningForm.medications].filter(Boolean).join(", ");
                  saveCheckin("evening", { ...eveningForm, medications: finalMeds });
                  setShowEveningCheckin(false);
                  setCheckinSaved("Evening check-in saved!");
                  setTimeout(() => setCheckinSaved(""), 3000);
                  setEveningForm({ severity: 5, symptoms: "", food: "", medications: "", selectedMedIds: [], activity: "", stress: 5, notes: "" });
                }} style={s.saveBtn}>Save check-in →</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Delete confirmation ── */}
      {confirmDeleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setConfirmDeleteId(null)}>
          <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "2rem", maxWidth: 360, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"0.75rem", color:"#c0392b" }}><svg width="32" height="32" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M2 4h12M5 4V2h6v2M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 7v5M10 7v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg></div>
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
            <div style={s.modalHeader}><h2 style={s.modalTitle}>{editingEntry ? "Edit entry" : "Log an entry"}</h2><button onClick={() => setShowForm(false)} style={s.modalClose}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button></div>
            <div style={s.modalBody}>
              <div style={s.formGroup}>
                <label style={s.label}>What symptoms are you experiencing?</label>
                <textarea
                  value={form.symptoms}
                  onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
                  placeholder="The more detail the better — where exactly (e.g. behind right eye, left hip), what it feels like (throbbing, stabbing, dull ache), what triggered or worsened it. e.g. throbbing headache behind right eye, worse with light, started after standing for 20 min"
                  style={s.textarea}
                  rows={4}
                />
                <p style={{ fontSize: "0.72rem", color: "#aaa", margin: "0.3rem 0 0", fontStyle: "italic" }}>
                  Tip: specific details help the AI find patterns and help your doctor understand severity
                </p>
              </div>
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
                <div style={s.formGroup}>
                  <label style={s.label}>Activity & what symptoms limited</label>
                  <input
                    value={form.activity}
                    onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
                    placeholder="e.g. couldn't drive due to dizziness, sat while cooking, short walk then rested…"
                    style={s.input}
                  />
                </div>
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
                  <span style={{ ...s.photoUploadIcon, color:"#7a9e87", display:"flex", alignItems:"center" }}><svg width="20" height="20" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 4l1-2h4l1 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                  <span style={s.photoUploadText}>Tap to add photos</span>
                  <span style={s.photoUploadSub}>Rashes, swelling, bruising — anything worth documenting</span>
                </label>
                {(form.photos || []).length > 0 && (
                  <div style={s.photoPreviewRow}>
                    {(form.photos || []).map((photo, idx) => (
                      <div key={idx} style={s.photoPreviewWrap}>
                        <img src={photo.data} alt={photo.name} style={s.photoPreview}/>
                        <button onClick={() => removePhoto(idx)} style={s.photoRemoveBtn}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
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
