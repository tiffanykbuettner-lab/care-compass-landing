import React, { useState, useEffect, useRef } from "react";

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
const BORDER     = "rgba(45,41,38,0.1)";
const DANGER     = "#c0392b";
const DANGER_LIGHT = "#fdecea";

/* ─── Shared atoms ───────────────────────────────────────────────────────── */

const BotanicalMark = ({ size = 28 }) => (
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
    <line x1="43" y1="36" x2="55" y2="36" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.5"/>
  </svg>
);

function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: 20, flexShrink: 0, cursor: "pointer",
        background: checked ? SAGE : "#d0ccc8",
        position: "relative", transition: "background 0.2s",
      }}
    >
      <div style={{
        position: "absolute", width: 16, height: 16, borderRadius: "50%",
        background: "white", top: 3, left: checked ? 21 : 3,
        transition: "left 0.2s",
      }}/>
    </div>
  );
}

function SectionCard({ children, danger = false }) {
  return (
    <div style={{
      background: "white",
      border: `1px solid ${danger ? "rgba(192,57,43,0.2)" : BORDER}`,
      borderRadius: 12, overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, desc, danger = false }) {
  return (
    <div style={{
      padding: "18px 24px 14px",
      borderBottom: `1px solid ${danger ? "rgba(192,57,43,0.12)" : BORDER}`,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: danger ? DANGER_LIGHT : SAGE_LIGHT,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: danger ? DANGER : INK, fontFamily: "sans-serif" }}>{title}</div>
        <div style={{ fontSize: 12.5, color: WARM_GRAY, marginTop: 1, fontFamily: "sans-serif" }}>{desc}</div>
      </div>
    </div>
  );
}

function Field({ label, optional, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: WARM_GRAY, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "sans-serif" }}>
        {label}
        {optional && (
          <span style={{ fontSize: 10, fontWeight: 400, textTransform: "none", letterSpacing: "0.02em", color: "#a09890", background: "#f0ede8", borderRadius: 4, padding: "1px 6px", lineHeight: 1.6 }}>
            optional
          </span>
        )}
      </label>
      {children}
      {hint && <span style={{ fontSize: 11.5, color: WARM_GRAY, fontFamily: "sans-serif", marginTop: 2 }}>{hint}</span>}
    </div>
  );
}

const inputStyle = {
  border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px",
  fontSize: 14, color: INK, background: OFF_WHITE, outline: "none",
  fontFamily: "sans-serif", width: "100%", boxSizing: "border-box",
};

function StyledInput(props) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{ ...inputStyle, ...(focused ? { borderColor: SAGE, background: "white" } : {}), ...props.style }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function StyledSelect({ children, onChange, value, style }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...inputStyle, WebkitAppearance: "none", ...(focused ? { borderColor: SAGE, background: "white" } : {}), ...style }}
    >
      {children}
    </select>
  );
}

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${BORDER}` }}>
      <div>
        <div style={{ fontSize: 14, color: INK, fontFamily: "sans-serif" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 2, fontFamily: "sans-serif" }}>{sub}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function ActionRow({ label, sub, children, borderColor = BORDER }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${borderColor}` }}>
      <div>
        <div style={{ fontSize: 14, color: INK, fontFamily: "sans-serif" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 2, fontFamily: "sans-serif" }}>{sub}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function StatusDot({ on }) {
  return <div style={{ width: 6, height: 6, borderRadius: "50%", background: on ? "#2ecc71" : "#ccc", flexShrink: 0 }}/>;
}

function OutlineBtn({ children, onClick, color = INK_LIGHT, hoverColor = SAGE_DARK, hoverBorder = SAGE, style: extraStyle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none", border: `1px solid ${hovered ? hoverBorder : BORDER}`,
        borderRadius: 6, padding: "5px 12px", fontSize: 12.5, cursor: "pointer",
        color: hovered ? hoverColor : color, fontFamily: "sans-serif",
        transition: "all 0.15s", whiteSpace: "nowrap", ...extraStyle,
      }}
    >
      {children}
    </button>
  );
}

function DangerBtn({ children, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? DANGER_LIGHT : "none",
        border: `1px solid ${hovered ? DANGER : "rgba(192,57,43,0.3)"}`,
        borderRadius: 6, padding: "5px 12px", fontSize: 12.5,
        color: DANGER, cursor: "pointer", fontFamily: "sans-serif",
        transition: "all 0.15s", whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

/* ─── Nav icons ──────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    id: "profile", label: "Profile",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    id: "notifications", label: "Notifications",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a5 5 0 00-5 5v3l-1.5 2h13L13 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4"/></svg>,
  },
  {
    id: "security", label: "Security",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L3 4v4c0 3 2.3 5.3 5 6 2.7-.7 5-3 5-6V4L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  },
  {
    id: "privacy", label: "Privacy & Data",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="7" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    id: "connected", label: "Connected Apps",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M6 7l4-2M6 9l4 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    id: "subscription", label: "Subscription",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.4"/><path d="M4 10h2M7 10h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    id: "family", label: "Family History",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="13" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M4 7v2c0 1 1 2 4 2s4-1 4-2V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    id: "symptoms", label: "My Symptoms",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.4"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M8 4v4M6 6h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    id: "medications", label: "Medications",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="6" y="1" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="6" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.4"/></svg>,
  },
];


/* ─── Multi-condition tag input ─────────────────────────────────────────── */
const SUGGESTED_CONDITIONS = [
  "POTS", "hEDS", "MCAS", "Fibromyalgia", "ME/CFS", "Long COVID",
  "Psoriatic Arthritis", "Lupus", "SIBO", "IBS", "Dysautonomia",
  "Raynaud's", "Hashimoto's", "Endometriosis", "ADHD", "Anxiety",
];

function ConditionTagInput({ conditions, onChange }) {
  const [inputVal, setInputVal] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = React.useRef(null);

  const addCondition = (val) => {
    const trimmed = val.trim().replace(/,+$/, "");
    if (!trimmed || conditions.includes(trimmed)) return;
    onChange([...conditions, trimmed]);
    setInputVal("");
  };

  const removeCondition = (idx) => onChange(conditions.filter((_, i) => i !== idx));

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCondition(inputVal);
    } else if (e.key === "Backspace" && !inputVal && conditions.length) {
      removeCondition(conditions.length - 1);
    }
  };

  const suggestions = SUGGESTED_CONDITIONS.filter(s =>
    inputVal.length > 0 &&
    s.toLowerCase().includes(inputVal.toLowerCase()) &&
    !conditions.includes(s)
  ).slice(0, 5);

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          ...inputStyle,
          minHeight: 42,
          height: "auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
          cursor: "text",
          padding: "6px 10px",
          ...(focused ? { borderColor: SAGE, background: "white" } : {}),
        }}
      >
        {conditions.map((c, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: SAGE_LIGHT, color: SAGE_DARK,
            borderRadius: 100, padding: "3px 10px 3px 10px",
            fontSize: 12.5, fontWeight: 500, fontFamily: "sans-serif",
            whiteSpace: "nowrap",
          }}>
            {c}
            <button
              onClick={(e) => { e.stopPropagation(); removeCondition(i); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: SAGE_DARK, padding: 0, lineHeight: 1, fontSize: 13, display: "flex", alignItems: "center" }}
            ><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); if (inputVal.trim()) addCondition(inputVal); }}
          placeholder={conditions.length === 0 ? "e.g. hEDS, POTS, MCAS..." : "Add another..."}
          style={{
            border: "none", outline: "none", background: "transparent",
            fontSize: 13.5, fontFamily: "sans-serif", color: INK,
            minWidth: 140, flex: 1,
          }}
        />
      </div>
      {/* Suggestions dropdown */}
      {suggestions.length > 0 && focused && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
          background: "white", border: `1px solid ${BORDER}`, borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)", marginTop: 4, overflow: "hidden",
        }}>
          {suggestions.map(s => (
            <div
              key={s}
              onMouseDown={(e) => { e.preventDefault(); addCondition(s); }}
              style={{
                padding: "9px 14px", fontSize: 13.5, color: INK, cursor: "pointer",
                fontFamily: "sans-serif",
              }}
              onMouseEnter={e => e.currentTarget.style.background = SAGE_LIGHT}
              onMouseLeave={e => e.currentTarget.style.background = "white"}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



/* ─── Medications ────────────────────────────────────────────────────────── */
const MED_STORAGE_KEY = "care-compass-medications-v1";

const FREQUENCIES = [
  "As needed (PRN)", "At bedtime", "Every 4 hours", "Every 6 hours",
  "Every 8 hours", "Once daily", "Three times daily", "Twice daily",
  "Weekly", "With meals", "Other",
];

const DURATION_OPTIONS = [
  { value: "", label: "Select duration..." },
  { value: "less_than_1_month", label: "Less than 1 month" },
  { value: "1_3_months", label: "1–3 months" },
  { value: "3_6_months", label: "3–6 months" },
  { value: "6_12_months", label: "6–12 months" },
  { value: "1_2_years", label: "1–2 years" },
  { value: "2_5_years", label: "2–5 years" },
  { value: "5_10_years", label: "5–10 years" },
  { value: "10_plus_years", label: "10+ years" },
  { value: "lifelong", label: "Lifelong / since childhood" },
];

const blankMed = () => ({ id: Date.now() + Math.random(), name: "", dose: "", frequency: "", duration: "", notes: "", reminder: false, reminderTime: "08:00" });


/* ─── SearchableSelect — type-to-search dropdown ─────────────────────────── */
function SearchableSelect({ value, onChange, options, placeholder = "Select...", style: extraStyle = {} }) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen]   = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const ref = React.useRef(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(""); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel = options.find(o => (o.value !== undefined ? o.value : o) === value)?.label ?? value ?? "";
  const filtered = options.filter(o => {
    const label = o.label ?? o;
    return !query || label.toLowerCase().includes(query.toLowerCase());
  });

  const baseStyle = {
    width: "100%", boxSizing: "border-box",
    padding: "0.65rem 0.9rem", borderRadius: "0.65rem",
    border: `1.5px solid ${open || focused ? SAGE : "rgba(0,0,0,0.12)"}`,
    fontSize: "0.9rem", color: INK, background: OFF_WHITE,
    outline: "none", fontFamily: "inherit", cursor: "pointer",
    ...extraStyle,
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div style={baseStyle} onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50); }}>
        {open ? (
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={selectedLabel || placeholder}
            style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "0.9rem", color: INK, fontFamily: "inherit", cursor: "text" }}
            autoComplete="off"
          />
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: selectedLabel ? INK : "#aaa" }}>{selectedLabel || placeholder}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: 8, color: WARM_GRAY }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999, background: "#fff", borderRadius: "0.75rem", border: "1.5px solid rgba(0,0,0,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", maxHeight: 240, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#aaa", fontFamily: "inherit" }}>No matches</div>
          ) : filtered.map((o, i) => {
            const val = o.value !== undefined ? o.value : o;
            const label = o.label ?? o;
            const isSelected = val === value;
            return (
              <div key={String(val) + i} onMouseDown={() => { onChange(val); setOpen(false); setQuery(""); }}
                style={{ padding: "0.65rem 1rem", fontSize: "0.875rem", cursor: "pointer", color: isSelected ? SAGE_DARK : INK, background: isSelected ? SAGE_LIGHT : "transparent", fontWeight: isSelected ? 600 : 400, fontFamily: "inherit", borderBottom: i < filtered.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f5f9f6"; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? SAGE_LIGHT : "transparent"; }}
              >
                {query ? (() => { const idx = label.toLowerCase().indexOf(query.toLowerCase()); if (idx < 0) return label; return <>{label.slice(0,idx)}<strong style={{ color: SAGE_DARK }}>{label.slice(idx, idx+query.length)}</strong>{label.slice(idx+query.length)}</>; })() : label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Care team structured input ────────────────────────────────────────── */
const CARE_SPECIALTIES = [
  "Cardiologist", "Dermatologist", "ENT", "Endocrinologist",
  "Gastroenterologist", "Geneticist", "Gynecologist", "Hematologist",
  "Immunologist / Allergist", "Nephrologist", "Neurologist", "Oncologist",
  "Ophthalmologist", "Orthopedist", "Pain Management", "Physical Therapist",
  "Primary Care", "Psychiatrist / Psychologist", "Pulmonologist",
  "Rheumatologist", "Urologist", "Other",
];

const CAREGIVER_ROLES = [
  "Family Caregiver",
  "Spouse / Partner",
  "Parent",
  "Sibling",
  "Child / Adult Child",
  "Home Health Aide",
  "Personal Care Assistant",
  "Case Manager",
  "Social Worker",
  "Patient Advocate",
  "Hospice / Palliative Care Worker",
  "Other",
];

const blankProvider  = () => ({ id: Date.now() + Math.random(), name: "", type: "provider", specialty: "", careRole: "" });
const blankCaregiver = () => ({ id: Date.now() + Math.random(), name: "", type: "caregiver", specialty: "", careRole: "" });

function CareTeamInput({ providers, onChange }) {
  const addProvider  = () => onChange([...providers, blankProvider()]);
  const addCaregiver = () => onChange([...providers, blankCaregiver()]);
  const removeMember = (id) => onChange(providers.filter(p => p.id !== id));
  const updateMember = (id, field, value) =>
    onChange(providers.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      // Keep specialty in sync with careRole so tracker's careTeamStr stays compatible
      if (field === "careRole") updated.specialty = value;
      if (field === "type") {
        updated.specialty = "";
        updated.careRole  = "";
      }
      return updated;
    }));

  const providerMembers  = providers.filter(p => p.type !== "caregiver");
  const caregiverMembers = providers.filter(p => p.type === "caregiver");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Providers ── */}
      {providerMembers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, fontFamily: "sans-serif" }}>Medical Providers</p>
          {providerMembers.map((provider, idx) => (
            <div key={provider.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ flex: 1.2 }}>
                {idx === 0 && <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: WARM_GRAY, marginBottom: 4, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.04em" }}>Name</label>}
                <StyledInput
                  type="text"
                  value={provider.name}
                  onChange={e => updateMember(provider.id, "name", e.target.value)}
                  placeholder="e.g. Dr. Patel"
                />
              </div>
              <div style={{ flex: 1 }}>
                {idx === 0 && <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: WARM_GRAY, marginBottom: 4, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.04em" }}>Specialty</label>}
                <SearchableSelect
                  value={provider.specialty}
                  onChange={val => updateMember(provider.id, "specialty", val)}
                  options={["", ...CARE_SPECIALTIES].map(s => ({ value: s, label: s || "Select..." }))}
                  placeholder="Select specialty..."
                />
              </div>
              <div style={{ paddingTop: idx === 0 ? 24 : 0, flexShrink: 0 }}>
                <button onClick={() => removeMember(provider.id)}
                  style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 16, padding: "8px 4px", lineHeight: 1 }}
                  title="Remove">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Caregivers ── */}
      {caregiverMembers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, fontFamily: "sans-serif" }}>Caregivers & Support People</p>
          {caregiverMembers.map((cg, idx) => (
            <div key={cg.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ flex: 1.2 }}>
                {idx === 0 && <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: WARM_GRAY, marginBottom: 4, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.04em" }}>Name</label>}
                <StyledInput
                  type="text"
                  value={cg.name}
                  onChange={e => updateMember(cg.id, "name", e.target.value)}
                  placeholder="e.g. Mom, Sarah"
                />
              </div>
              <div style={{ flex: 1 }}>
                {idx === 0 && <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: WARM_GRAY, marginBottom: 4, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.04em" }}>Role</label>}
                <StyledSelect value={cg.careRole} onChange={e => updateMember(cg.id, "careRole", e.target.value)}>
                  <option value="">Select role...</option>
                  {CAREGIVER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </StyledSelect>
              </div>
              <div style={{ paddingTop: idx === 0 ? 24 : 0, flexShrink: 0 }}>
                <button onClick={() => removeMember(cg.id)}
                  style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 16, padding: "8px 4px", lineHeight: 1 }}
                  title="Remove">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add buttons ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={addProvider}
          style={{ background: "none", border: `1px dashed ${BORDER}`, borderRadius: 8, padding: "7px 14px", fontSize: 12.5, color: SAGE_DARK, cursor: "pointer", fontFamily: "sans-serif", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = SAGE_LIGHT; e.currentTarget.style.borderColor = SAGE; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = BORDER; }}>
          + Add provider
        </button>
        <button onClick={addCaregiver}
          style={{ background: "none", border: `1px dashed ${BORDER}`, borderRadius: 8, padding: "7px 14px", fontSize: 12.5, color: TEAL, cursor: "pointer", fontFamily: "sans-serif", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = TEAL_LIGHT; e.currentTarget.style.borderColor = TEAL; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = BORDER; }}>
          + Add caregiver / support person
        </button>
      </div>
    </div>
  );
}


/* ─── Family history ─────────────────────────────────────────────────────── */
const FAMILY_STORAGE_KEY = "cc-family-history";

const FAMILY_MEMBERS = [
  { value: "mother",              label: "Mother",           side: "maternal" },
  { value: "father",              label: "Father",           side: "paternal" },
  { value: "maternal_grandmother",label: "Maternal grandmother", side: "maternal" },
  { value: "maternal_grandfather",label: "Maternal grandfather", side: "maternal" },
  { value: "paternal_grandmother",label: "Paternal grandmother", side: "paternal" },
  { value: "paternal_grandfather",label: "Paternal grandfather", side: "paternal" },
  { value: "sister",              label: "Sister",           side: "both" },
  { value: "brother",             label: "Brother",          side: "both" },
  { value: "maternal_aunt",       label: "Maternal aunt",    side: "maternal" },
  { value: "maternal_uncle",      label: "Maternal uncle",   side: "maternal" },
  { value: "paternal_aunt",       label: "Paternal aunt",    side: "paternal" },
  { value: "paternal_uncle",      label: "Paternal uncle",   side: "paternal" },
  { value: "daughter",            label: "Daughter",         side: "both" },
  { value: "son",                 label: "Son",              side: "both" },
];

const FAMILY_CONDITIONS = [
  "ADHD", "Alzheimer's / Dementia", "Anxiety", "Asthma", "Autism",
  "Bipolar disorder", "Breast cancer", "Cancer", "Celiac disease", "COPD",
  "Colon cancer", "Depression", "Diabetes (Type 1)", "Diabetes (Type 2)",
  "Dysautonomia", "Endometriosis", "Epilepsy", "Fibromyalgia",
  "Graves' disease", "hEDS / EDS", "Hashimoto's", "Heart disease",
  "Hypermobility", "Hypertension", "IBD / Crohn's", "Kidney disease",
  "Liver disease", "Lupus", "MCAS", "ME/CFS", "Mental health condition",
  "Migraines", "Multiple sclerosis", "Osteoporosis", "PCOS", "POTS",
  "Parkinson's", "Psoriatic arthritis", "Raynaud's", "Rheumatoid arthritis",
  "Schizophrenia", "Stroke", "Thyroid disease", "Ulcerative colitis",
];

const blankFamilyMember = () => ({
  id: Date.now() + Math.random(),
  member: "",
  conditions: [],
  notes: "",
});

function FamilyHistoryPanel({ onComplete }) {
  const [entries, setEntries] = useState(() => {
    try { const s = localStorage.getItem(FAMILY_STORAGE_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [saved, setSaved] = useState(false);

  const [familyDirty, setFamilyDirty] = useState(false);

  const saveEntries = (updated) => {
    setEntries(updated);
    try { localStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(updated)); } catch {}
    setSaved(true); setFamilyDirty(false); setTimeout(() => setSaved(false), 2500);
    if (onComplete) onComplete();
  };

  const markFamilyDirty = (updated) => {
    setEntries(updated);
    setFamilyDirty(true);
  };

  const addMember = () => markFamilyDirty([...entries, blankFamilyMember()]);
  const removeMember = (id) => markFamilyDirty(entries.filter(e => e.id !== id));
  const updateMember = (id, field, value) =>
    markFamilyDirty(entries.map(e => e.id === id ? { ...e, [field]: value } : e));

  // Group by side for display
  const maternal = entries.filter(e => {
    const m = FAMILY_MEMBERS.find(f => f.value === e.member);
    return m?.side === "maternal";
  });
  const paternal = entries.filter(e => {
    const m = FAMILY_MEMBERS.find(f => f.value === e.member);
    return m?.side === "paternal";
  });
  const both = entries.filter(e => {
    const m = FAMILY_MEMBERS.find(f => f.value === e.member);
    return m?.side === "both" || !m;
  });

  const lbl = { fontSize: 11, fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "sans-serif", display: "block", marginBottom: 4 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionCard>
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="5" r="2" stroke={SAGE_DARK} strokeWidth="1.3"/><circle cx="12" cy="5" r="2" stroke={SAGE_DARK} strokeWidth="1.3"/><circle cx="8" cy="13" r="2" stroke={SAGE_DARK} strokeWidth="1.3"/><path d="M4 7v2c0 1 1 2 4 2s4-1 4-2V7" stroke={SAGE_DARK} strokeWidth="1.3" strokeLinecap="round"/></svg>}
          title="Family history"
          desc="Biological family medical history — used to add context to your pattern analysis and AI insights"
        />
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {saved && <div style={{ background: SAGE_LIGHT, color: SAGE_DARK, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontFamily: "sans-serif", fontWeight: 500 }}>✓ Saved!</div>}

          <div style={{ fontSize: 12.5, color: WARM_GRAY, fontFamily: "sans-serif", lineHeight: 1.6, background: "#fafaf8", borderRadius: 8, padding: "10px 14px", border: `1px solid ${BORDER}` }}>
            <strong style={{ color: INK }}>Why this matters:</strong> Conditions like hEDS, POTS, autoimmune disease, and connective tissue disorders run in families. Your family history helps Care Compass identify patterns that might otherwise go unrecognised.
          </div>

          {entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: WARM_GRAY, fontFamily: "sans-serif" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:8, color:"#7a9e87" }}><svg width="28" height="28" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M5 2c0 3 6 3 6 6s-6 3-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M11 2c0 3-6 3-6 6s6 3 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="5" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="5" y1="10" x2="11" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg></div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: INK, marginBottom: 4 }}>No family history added yet</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>Add a family member to begin. Only include what you know — incomplete information is fine.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {entries.map((entry, idx) => (
                <div key={entry.id} style={{ background: "#fff", borderRadius: 10, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#fafaf8", borderBottom: entry.conditions.length || entry.notes ? `1px solid ${BORDER}` : "none" }}>
                    <div style={{ flex: 1 }}>
                      <StyledSelect
                        value={entry.member}
                        onChange={e => updateMember(entry.id, "member", e.target.value)}
                      >
                        <option value="">Select family member...</option>
                        <optgroup label="Maternal side">
                          {FAMILY_MEMBERS.filter(m => m.side === "maternal").map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </optgroup>
                        <optgroup label="Paternal side">
                          {FAMILY_MEMBERS.filter(m => m.side === "paternal").map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </optgroup>
                        <optgroup label="Siblings / Children">
                          {FAMILY_MEMBERS.filter(m => m.side === "both").map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </optgroup>
                      </StyledSelect>
                    </div>
                    {/* Side badge */}
                    {entry.member && (() => {
                      const m = FAMILY_MEMBERS.find(f => f.value === entry.member);
                      const sideColor = m?.side === "maternal" ? { bg: "#fce8f3", color: "#9b2c6e" } : m?.side === "paternal" ? { bg: "#e8f0fc", color: "#2c4e9b" } : { bg: SAGE_LIGHT, color: SAGE_DARK };
                      return m?.side !== "both" ? (
                        <span style={{ fontSize: 11, fontWeight: 600, background: sideColor.bg, color: sideColor.color, borderRadius: 100, padding: "2px 10px", whiteSpace: "nowrap", fontFamily: "sans-serif" }}>
                          {m?.side === "maternal" ? "Maternal" : "Paternal"}
                        </span>
                      ) : null;
                    })()}
                    <button onClick={() => removeMember(entry.id)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 18, padding: "0 4px", lineHeight: 1, flexShrink: 0 }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
                  </div>

                  {/* Conditions + notes */}
                  <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <label style={lbl}>Medical conditions</label>
                      <FamilyConditionInput
                        conditions={entry.conditions}
                        onChange={vals => updateMember(entry.id, "conditions", vals)}
                      />
                    </div>
                    <div>
                      <label style={lbl}>Notes <span style={{ textTransform: "none", fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
                      <StyledInput
                        value={entry.notes}
                        onChange={e => updateMember(entry.id, "notes", e.target.value)}
                        placeholder="e.g. diagnosed at 40, mild case, suspected but undiagnosed..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addMember}
            style={{
              background: "none", border: `1px dashed ${BORDER}`,
              borderRadius: 8, padding: "8px 16px", fontSize: 13,
              color: SAGE_DARK, cursor: "pointer", fontFamily: "sans-serif",
              textAlign: "left", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.target.style.background = SAGE_LIGHT; }}
            onMouseLeave={e => { e.target.style.background = "none"; }}
          >
            + Add family member
          </button>

          {familyDirty && (
            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
              <button
                onClick={() => saveEntries(entries)}
                style={{ background: SAGE_DARK, color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}
              >
                Save changes
              </button>
            </div>
          )}

          <p style={{ fontSize: 11.5, color: "#aaa", fontFamily: "sans-serif", margin: 0, fontStyle: "italic" }}>
            Only include information you know and are comfortable sharing. This is stored privately on your device.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Family condition tag input (extended suggestions) ─────────────────── */
function FamilyConditionInput({ conditions, onChange }) {
  const [inputVal, setInputVal] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = React.useRef(null);

  const addCondition = (val) => {
    const trimmed = val.trim().replace(/,+$/, "");
    if (!trimmed || conditions.includes(trimmed)) return;
    onChange([...conditions, trimmed]);
    setInputVal("");
  };

  const removeCondition = (idx) => onChange(conditions.filter((_, i) => i !== idx));

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addCondition(inputVal); }
    else if (e.key === "Backspace" && !inputVal && conditions.length) removeCondition(conditions.length - 1);
  };

  const suggestions = FAMILY_CONDITIONS.filter(s =>
    inputVal.length > 0 && s.toLowerCase().includes(inputVal.toLowerCase()) && !conditions.includes(s)
  ).slice(0, 6);

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{ ...inputStyle, minHeight: 42, height: "auto", display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center", cursor: "text", padding: "6px 10px", ...(focused ? { borderColor: SAGE, background: "white" } : {}) }}
      >
        {conditions.map((c, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#e8f0fc", color: "#2c4e9b", borderRadius: 100, padding: "3px 10px", fontSize: 12.5, fontFamily: "sans-serif", fontWeight: 500 }}>
            {c}
            <button onClick={() => removeCondition(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2c4e9b", padding: 0, fontSize: 14, lineHeight: 1, display: "flex" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => { setTimeout(() => setFocused(false), 150); addCondition(inputVal); }}
          placeholder={conditions.length === 0 ? "Type a condition, press Enter..." : "Add another..."}
          style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, fontFamily: "sans-serif", color: INK, flex: 1, minWidth: 120 }}
        />
      </div>
      {suggestions.length > 0 && focused && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          {suggestions.map(s => (
            <div key={s} onMouseDown={() => addCondition(s)} style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", color: INK, fontFamily: "sans-serif" }}
              onMouseEnter={e => e.target.style.background = SAGE_LIGHT}
              onMouseLeave={e => e.target.style.background = "#fff"}
            >{s}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Panel: Profile ─────────────────────────────────────────────────────── */
function ProfilePanel({ form, setForm, markDirty }) {
  const set = (key) => (e) => { setForm(f => ({ ...f, [key]: e.target.value })); markDirty(); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Profile info */}
      <SectionCard>
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke={SAGE_DARK} strokeWidth="1.5"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={SAGE_DARK} strokeWidth="1.5" strokeLinecap="round"/></svg>}
          title="Profile information"
          desc="Your name, photo, and contact details"
        />
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: SAGE_LIGHT, border: `2px solid ${SAGE}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
              <span style={{ fontSize: 22, fontWeight: 600, color: SAGE_DARK, fontFamily: "sans-serif" }}>
                {(form.firstName[0] || "") + (form.lastName[0] || "")}
              </span>
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, background: SAGE_DARK, borderRadius: "50%", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="9" r="3.5" stroke="white" strokeWidth="1.5"/><path d="M5.5 4h5l1 2H4.5l1-2z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 13.5, color: WARM_GRAY, fontFamily: "sans-serif" }}>{form.firstName} {form.lastName}</p>
              <p style={{ fontSize: 12, color: WARM_GRAY, marginTop: 2, fontFamily: "sans-serif" }}>JPG or PNG · Max 2MB</p>
              <OutlineBtn style={{ marginTop: 6 }}>Upload photo</OutlineBtn>
            </div>
          </div>

          {/* Name row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, boxSizing: "border-box" }}>
            <Field label="First name">
              <StyledInput type="text" value={form.firstName} onChange={set("firstName")} placeholder="e.g. Jamie" />
            </Field>
            <Field label="Last name">
              <StyledInput type="text" value={form.lastName} onChange={set("lastName")} placeholder="e.g. Smith" />
            </Field>
          </div>

          {/* Preferred name */}
          <Field
            label="Preferred name"
            optional
            hint={'Used in greetings and notifications — e.g. "Jay" instead of "Jamie"'}
          >
            <StyledInput
              type="text"
              value={form.preferredName || ""}
              onChange={set("preferredName")}
              placeholder={form.firstName || "e.g. Jay, Alex..."}
            />
          </Field>

          {/* Email */}
          <Field label="Email address">
            <div style={{ position: "relative" }}>
              <StyledInput type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" style={{ paddingRight: 88 }} />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontFamily: "sans-serif", fontWeight: 500, background: "#eafaf1", color: "#1e7e45" }}>
                ✓ Verified
              </span>
            </div>
          </Field>

          {/* DOB + sex */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, boxSizing: "border-box" }}>
            <Field label="Date of birth" hint="Required — helps personalize health insights for your age and life stage">
              <StyledInput type="date" value={form.dob} onChange={set("dob")} max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]} />
            </Field>
            <Field label="Biological sex" optional hint="Affects some medical reference ranges">
              <StyledSelect value={form.sex} onChange={set("sex")}>
                <option value="">Select an option…</option>
                <option>Female</option>
                <option>Male</option>
                <option>Intersex</option>
                <option>Prefer not to say</option>
              </StyledSelect>
            </Field>
          </div>

          {/* Pronouns */}
          <Field label="Pronouns" optional>
            <StyledSelect value={form.pronouns} onChange={set("pronouns")}>
              <option value="">Select an option…</option>
              <option>She / Her</option>
              <option>He / Him</option>
              <option>They / Them</option>
              <option>She / They</option>
              <option>He / They</option>
              <option>Prefer not to say</option>
            </StyledSelect>
          </Field>

          {/* Timezone */}
          <Field label="Time zone">
            <StyledSelect value={form.timezone} onChange={set("timezone")}>
              <option>America/Chicago (CDT, UTC−5)</option>
              <option>America/New_York (EDT, UTC−4)</option>
              <option>America/Los_Angeles (PDT, UTC−7)</option>
              <option>Europe/London (BST, UTC+1)</option>
            </StyledSelect>
          </Field>

        </div>
      </SectionCard>

      {/* Health context */}
      <SectionCard>
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2.5C6.5 1 3.5 1.5 2.5 4c-1 2.5.5 5 5.5 8.5C13 9 14.5 6.5 13.5 4 12.5 1.5 9.5 1 8 2.5z" stroke={SAGE_DARK} strokeWidth="1.5" strokeLinejoin="round"/></svg>}
          title="Health context"
          desc="Helps Care Compass give you more relevant insights"
        />
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Section-level optional note */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#a09890", fontFamily: "sans-serif", fontStyle: "italic", marginBottom: -4 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#b0a89e" strokeWidth="1.3"/><path d="M8 7v4" stroke="#b0a89e" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="5.5" r="0.7" fill="#b0a89e"/></svg>
            All fields in this section are optional
          </div>

          {/* Conditions — multi-tag free text */}
          <Field label="Conditions" hint="Add all your diagnoses — press Enter or comma to add each one">
            <ConditionTagInput
              conditions={form.conditions || (form.condition ? [form.condition] : [])}
              onChange={(conditions) => { setForm(f => ({ ...f, conditions })); markDirty(); }}
            />
          </Field>

          <Field label="Diagnosis status">
            <StyledSelect value={form.diagnosisStatus} onChange={set("diagnosisStatus")}>
              <option>Formally diagnosed</option>
              <option>Suspected / investigating</option>
              <option>Self-identified</option>
              <option>Mixed (some diagnosed, some suspected)</option>
            </StyledSelect>
          </Field>

          <Field label="Care team" hint="Providers and caregivers appear in your reports and are suggested when scheduling appointments">
            <CareTeamInput
              providers={form.careProviders || [{ id: 1, name: "", type: "provider", specialty: "", careRole: "" }, { id: 2, name: "", type: "provider", specialty: "", careRole: "" }]}
              onChange={providers => { setForm(f => ({ ...f, careProviders: providers })); markDirty(); }}
            />
          </Field>

        </div>
      </SectionCard>
    </div>
  );
}


/* ─── Panel: Medications ─────────────────────────────────────────────────── */
function MedicationsPanel({ onComplete }) {
  const [medications, setMedications] = useState(() => {
    try { const s = localStorage.getItem(MED_STORAGE_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(blankMed());
  const [bulkText, setBulkText]   = useState("");
  const [showBulk, setShowBulk]   = useState(false);
  const [saved, setSaved]         = useState(false);
  const [scanning, setScanning]   = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanPreview, setScanPreview] = useState(null);
  const scanInputRef = React.useRef(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null); // {name} if duplicate detected

  const saveMeds = (updated) => {
    setMedications(updated);
    try { localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(updated)); } catch {}
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const handleSave = (forceAdd = false) => {
    if (!form.name.trim()) return;
    if (editingId) {
      saveMeds(medications.map(m => m.id === editingId ? { ...form, id: editingId } : m));
      setForm(blankMed()); setShowForm(false); setEditingId(null);
      return;
    }
    // Check for duplicate (case-insensitive name match)
    const duplicate = !forceAdd && medications.find(
      m => m.name.trim().toLowerCase() === form.name.trim().toLowerCase()
    );
    if (duplicate) {
      setDuplicateWarning(duplicate.name);
      return;
    }
    saveMeds([...medications, { ...form, id: Date.now() }]);
    setForm(blankMed()); setShowForm(false); setEditingId(null);
    setDuplicateWarning(null);
  };

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    // Show preview
    const reader = new FileReader();
    reader.onload = evt => setScanPreview(evt.target.result);
    reader.readAsDataURL(file);

    setScanning(true);
    setScanError("");

    try {
      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result.split(",")[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });

      const mediaType = file.type || "image/jpeg";

      const response = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              {
                type: "text",
                text: `This is a photo of a prescription or supplement bottle label. Please extract the medication information and respond ONLY with a JSON object (no markdown, no explanation) in this exact format:
{
  "name": "medication name only, no brand/generic distinction",
  "dose": "strength and unit e.g. 25mg, 500mg, 10mcg",
  "frequency": "dosing instructions simplified e.g. Once daily, Twice daily, As needed",
  "notes": "any important instructions like take with food, avoid alcohol, etc — leave empty if none"
}
If you cannot read the label clearly, return: {"name":"","dose":"","frequency":"","notes":""}`,
              },
            ],
          }],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      if (parsed.name) {
        setForm(f => ({
          ...blankMed(),
          name: parsed.name || "",
          dose: parsed.dose || "",
          frequency: FREQUENCIES.includes(parsed.frequency) ? parsed.frequency : "",
          notes: parsed.notes || "",
        }));
        setEditingId(null);
        setShowForm(true);
        setScanPreview(null);
      } else {
        setScanError("Couldn't read the label clearly. Please try a clearer photo or enter manually.");
      }
    } catch (err) {
      console.error("Scan error:", err);
      setScanError("Something went wrong. Please try again or enter manually.");
    }
    setScanning(false);
  };

  const handleEdit = (med) => { setForm({ ...med }); setEditingId(med.id); setShowForm(true); };
  const handleDelete = (id) => saveMeds(medications.filter(m => m.id !== id));

  const handleBulkImport = () => {
    const lines = bulkText.replace(/,|;/g, "\n").split("\n").map(l => l.trim()).filter(Boolean);
    const newMeds = lines.map(line => {
      const parts = line.split(" ");
      return { ...blankMed(), name: parts[0] || line, dose: parts.slice(1, 3).join(" ") };
    });
    saveMeds([...medications, ...newMeds]);
    setBulkText(""); setShowBulk(false);
  };

  const inp = { ...inputStyle };
  const lbl = { fontSize: 12, fontWeight: 500, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "sans-serif", display: "block", marginBottom: 4 };

  const durationLabel = (val) => DURATION_OPTIONS.find(o => o.value === val)?.label || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <SectionCard>
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="6" y="1" width="4" height="14" rx="1" stroke={SAGE_DARK} strokeWidth="1.4"/><rect x="1" y="6" width="14" height="4" rx="1" stroke={SAGE_DARK} strokeWidth="1.4"/></svg>}
          title="Medication list"
          desc="Your saved medications — used in tracker logs and AI insights"
        />
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {saved && <div style={{ background: SAGE_LIGHT, color: SAGE_DARK, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontFamily: "sans-serif", fontWeight: 500 }}>Saved!</div>}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} className="no-print">
            <OutlineBtn onClick={() => setShowBulk(b => !b)}><span style={{ display:"inline-flex", alignItems:"center", gap:"0.35rem" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M8 10V3M5 6l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> Bulk import</span></OutlineBtn>
            {/* Scan button */}
            <label style={{ cursor: "pointer" }}>
              <input
                ref={scanInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handleScan}
              />
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "none", border: `1px solid ${BORDER}`,
                borderRadius: 6, padding: "5px 12px", fontSize: 12.5,
                color: scanning ? WARM_GRAY : SAGE_DARK, cursor: "pointer",
                fontFamily: "sans-serif", transition: "all 0.15s",
                opacity: scanning ? 0.7 : 1,
              }}>
                {scanning ? (
                  "Scanning..."
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Scan bottle
                  </>
                )}
              </span>
            </label>
            <button
              onClick={() => { setForm(blankMed()); setEditingId(null); setShowForm(true); }}
              style={{ background: SAGE_DARK, color: "#fff", border: "none", borderRadius: 8, padding: "6px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}
            >+ Add medication</button>
          </div>

          {/* Scan preview */}
          {scanPreview && scanning && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: SAGE_LIGHT, borderRadius: 8, padding: "10px 14px" }}>
              <img src={scanPreview} alt="Scanning" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: `1px solid ${BORDER}` }}/>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: SAGE_DARK, fontFamily: "sans-serif" }}>Reading label...</div>
                <div style={{ fontSize: 12, color: WARM_GRAY, fontFamily: "sans-serif" }}>Claude is extracting medication info from your photo</div>
              </div>
            </div>
          )}

          {/* Scan error */}
          {scanError && (
            <div style={{ background: "#fdecea", borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "#c0392b", fontFamily: "sans-serif", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{scanError}</span>
              <button onClick={() => setScanError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#c0392b", fontSize: 16 }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
            </div>
          )}

          {/* Bulk import */}
          {showBulk && (
            <div style={{ background: SAGE_LIGHT, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 12.5, color: WARM_GRAY, fontFamily: "sans-serif" }}>One per line — format: <em>Medication Dose</em> e.g. "Metoprolol 25mg"</div>
              <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"Metoprolol 25mg\nLevothyroxine 50mcg\nCetirizine 10mg"} rows={4} style={{ ...inp, resize: "vertical", lineHeight: 1.5 }}/>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleBulkImport} disabled={!bulkText.trim()} style={{ background: SAGE_DARK, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif", opacity: bulkText.trim() ? 1 : 0.5 }}>Import</button>
                <OutlineBtn onClick={() => { setShowBulk(false); setBulkText(""); }}>Cancel</OutlineBtn>
              </div>
              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 10 }}>
                <label style={{ cursor: "pointer" }}>
                  <span style={{ fontSize:12, color:WARM_GRAY, fontFamily:"sans-serif", display:"inline-flex", alignItems:"center", gap:"0.3rem" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M13 7.5l-5.5 5.5a4 4 0 01-5.7-5.6L7 2.3a2.5 2.5 0 013.5 3.5L5.3 11a1 1 0 01-1.4-1.4l4.8-4.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> Or upload .txt / .csv — </span>
                  <input type="file" accept=".txt,.csv" style={{ display: "none" }} onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = evt => setBulkText(evt.target.result.slice(0, 5000));
                    reader.readAsText(file);
                    e.target.value = "";
                  }}/>
                  <span style={{ fontSize: 12, color: SAGE_DARK, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}>Browse</span>
                </label>
              </div>
            </div>
          )}

          {/* Add / Edit form */}
          {showForm && (
            <div style={{ background: CREAM, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: INK, fontFamily: "sans-serif" }}>{editingId ? "Edit medication" : "New medication"}</div>

              {/* Name + Dose */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                <div>
                  <label style={lbl}>Medication name *</label>
                  <StyledInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Metoprolol"/>
                </div>
                <div>
                  <label style={lbl}>Dose <span style={{ textTransform: "none", fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
                  <StyledInput value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} placeholder="e.g. 25mg, 1 tablet"/>
                </div>
              </div>

              {/* Frequency + Duration */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                <div>
                  <label style={lbl}>How often <span style={{ textTransform: "none", fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
                  <SearchableSelect
                    value={form.frequency}
                    onChange={val => setForm(f => ({ ...f, frequency: val }))}
                    options={["", ...FREQUENCIES].map(f => ({ value: f, label: f || "Select frequency..." }))}
                    placeholder="Select frequency..."
                  />
                </div>
                <div>
                  <label style={lbl}>How long taking it <span style={{ textTransform: "none", fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
                  <StyledSelect value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}>
                    {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </StyledSelect>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={lbl}>Notes <span style={{ textTransform: "none", fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
                <StyledInput value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Take on empty stomach, avoid grapefruit..."/>
              </div>

              {/* Reminder */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "sans-serif", fontSize: 13.5, color: INK }}>
                  <input type="checkbox" checked={form.reminder} onChange={() => setForm(f => ({ ...f, reminder: !f.reminder }))} style={{ accentColor: SAGE_DARK, width: 15, height: 15 }}/>
                  Set daily reminder
                </label>
                {form.reminder && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 24 }}>
                    <span style={{ fontSize: 12.5, color: WARM_GRAY, fontFamily: "sans-serif" }}>Remind me daily at</span>
                    <input
                      type="time"
                      value={form.reminderTime}
                      onChange={e => setForm(f => ({ ...f, reminderTime: e.target.value }))}
                      style={{ ...inp, maxWidth: 130 }}
                    />
                  </div>
                )}
              </div>

              {/* Duplicate warning */}
              {duplicateWarning && (
                <div style={{ background: "#fef3da", border: "1px solid #e8a838", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color:"#e8a838", display:"flex", alignItems:"center" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 7v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="12" r="0.7" fill="currentColor"/></svg></span>
                    <div style={{ fontSize: 13, color: "#8a5a00", fontFamily: "sans-serif", lineHeight: 1.5 }}>
                      <strong>{duplicateWarning}</strong> is already in your medication list. Would you like to add it again anyway?
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, paddingLeft: 24 }}>
                    <button
                      onClick={() => { setDuplicateWarning(null); handleSave(true); }}
                      style={{ background: "#e8a838", color: "#fff", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}
                    >Add anyway</button>
                    <OutlineBtn onClick={() => setDuplicateWarning(null)}>Cancel</OutlineBtn>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <OutlineBtn onClick={() => { setShowForm(false); setEditingId(null); setForm(blankMed()); setDuplicateWarning(null); }}>Cancel</OutlineBtn>
                <button
                  onClick={() => handleSave()}
                  disabled={!form.name.trim()}
                  style={{ background: form.name.trim() ? SAGE_DARK : "#bbb", color: "#fff", border: "none", borderRadius: 8, padding: "6px 16px", fontSize: 13, fontWeight: 600, cursor: form.name.trim() ? "pointer" : "default", fontFamily: "sans-serif" }}
                >
                  {editingId ? "Save changes" : "Add medication"}
                </button>
                {!editingId && (
                  <label style={{ cursor: "pointer" }}>
                    <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={async (e) => { await handleSave(); handleScan(e); }}/>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "5px 10px", fontSize: 12, color: SAGE_DARK, cursor: "pointer", fontFamily: "sans-serif" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      Save & scan another
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Medication list */}
          {medications.length === 0 && !showForm && !showBulk ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: WARM_GRAY, fontFamily: "sans-serif" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:8, color:"#7a9e87" }}><svg width="32" height="32" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><rect x="2" y="6" width="12" height="4" rx="2" stroke="currentColor" strokeWidth="1.4"/><line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" strokeWidth="1.4"/></svg></div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: INK, marginBottom: 4 }}>No medications saved yet</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>Add your medications once — they appear as quick-select options when logging daily tracker entries.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {medications.map(med => (
                <div key={med.id} style={{ background: "#fff", borderRadius: 10, border: `1px solid ${BORDER}`, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: INK, fontFamily: "sans-serif" }}>{med.name}</span>
                      {med.dose && <span style={{ fontSize: 12.5, color: SAGE_DARK, fontWeight: 600, fontFamily: "sans-serif" }}>{med.dose}</span>}
                      {med.frequency && <span style={{ fontSize: 11.5, color: WARM_GRAY, background: CREAM, borderRadius: 100, padding: "2px 8px", fontFamily: "sans-serif" }}>{med.frequency}</span>}
                      {med.duration && <span style={{ fontSize: 11.5, color: TEAL, background: "#e0f2f4", borderRadius: 100, padding: "2px 8px", fontFamily: "sans-serif" }}><span style={{ display:"inline-flex", alignItems:"center", gap:"0.3rem" }}></span>{durationLabel(med.duration)}</span>}
                    </div>
                    {med.notes && <div style={{ fontSize: 12, color: WARM_GRAY, fontStyle: "italic", fontFamily: "sans-serif" }}>{med.notes}</div>}
                    {med.reminder && <div style={{ fontSize: 11.5, color: SAGE_DARK, background: SAGE_LIGHT, display: "inline-block", borderRadius: 100, padding: "2px 8px", marginTop: 4, fontFamily: "sans-serif" }}><span style={{ display:"inline-flex", alignItems:"center", gap:"0.3rem" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><circle cx="8" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 6.5V9l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 3.5L1.5 2M13 3.5L14.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> Daily {med.reminderTime}</span></div>}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <OutlineBtn onClick={() => handleEdit(med)}>Edit</OutlineBtn>
                    <DangerBtn onClick={() => handleDelete(med.id)}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, color:"currentColor" }}><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></DangerBtn>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: "#aaa", textAlign: "center", fontFamily: "sans-serif", fontStyle: "italic", paddingTop: 4 }}>
                {medications.length} medication{medications.length !== 1 ? "s" : ""} saved · Available as quick-select in your daily tracker
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Done button — marks medications complete and triggers next step */}
      {onComplete && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            onClick={onComplete}
            style={{ background: SAGE_DARK, color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}
          >
            {medications.length > 0 ? "Done →" : "Skip for now →"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Panel: Notifications ───────────────────────────────────────────────── */

/* ─── Custom time picker ─────────────────────────────────────────────────── */
function TimePicker({ value, onChange }) {
  const [h, m, period] = (() => {
    const [hh, mm] = (value || "08:00").split(":").map(Number);
    const p = hh >= 12 ? "PM" : "AM";
    const h12 = hh % 12 || 12;
    return [h12, mm, p];
  })();

  const toValue = (hour, minute, per) => {
    let h24 = hour % 12;
    if (per === "PM") h24 += 12;
    return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  };

  const hours = [12,1,2,3,4,5,6,7,8,9,10,11];
  const minutes = [0,5,10,15,20,25,30,35,40,45,50,55];

  const selectStyle = {
    border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 8px",
    fontSize: 14, color: INK, background: "white", outline: "none",
    fontFamily: "sans-serif", cursor: "pointer", appearance: "none",
    WebkitAppearance: "none", textAlign: "center",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {/* Hour */}
      <select
        value={h}
        onChange={e => onChange(toValue(Number(e.target.value), m, period))}
        style={{ ...selectStyle, width: 54 }}
      >
        {hours.map(hr => <option key={hr} value={hr}>{hr}</option>)}
      </select>
      <span style={{ fontSize: 16, color: WARM_GRAY, fontWeight: 500, marginBottom: 1 }}>:</span>
      {/* Minute */}
      <select
        value={m}
        onChange={e => onChange(toValue(h, Number(e.target.value), period))}
        style={{ ...selectStyle, width: 54 }}
      >
        {minutes.map(min => <option key={min} value={min}>{String(min).padStart(2, "0")}</option>)}
      </select>
      {/* AM/PM */}
      <select
        value={period}
        onChange={e => onChange(toValue(h, m, e.target.value))}
        style={{ ...selectStyle, width: 58 }}
      >
        <option>AM</option>
        <option>PM</option>
      </select>
    </div>
  );
}

function NotificationsPanel({ prefs, setPrefs, markDirty }) {
  const toggle = (key) => {
    setPrefs(p => ({ ...p, [key]: { ...p[key], on: !p[key].on } }));
    markDirty();
  };
  const setTime = (key, time) => {
    setPrefs(p => ({ ...p, [key]: { ...p[key], time } }));
    markDirty();
  };

  const ALERTS = [
    {
      key: "dailyReminder",
      label: "Daily tracking reminder",
      sub: "A nudge to log your symptoms each day",
      showTime: true,
      cadenceLabel: "Daily at",
    },
    {
      key: "weeklyDigest",
      label: "Weekly insights digest",
      sub: "A weekly in-app summary of patterns, trends, and highlights from your past 7 days — delivered every week so you can review your progress at a glance",
      showTime: true,
      showDay: true,
      cadenceLabel: "Every",
    },
    {
      key: "morningCheckin",
      label: "Morning check-in",
      sub: "A prompt to log your sleep quality and how you feel on waking",
      showTime: true,
      cadenceLabel: "Show after",
      timeHint: "Shows on tracker after this time each morning",
    },
    {
      key: "eveningCheckin",
      label: "Evening check-in",
      sub: "A prompt to reflect on your day and log any remaining symptoms",
      showTime: true,
      cadenceLabel: "Show after",
      timeHint: "Shows on tracker after this time each evening",
    },
    {
      key: "productUpdates",
      label: "Product updates & tips",
      sub: "Occasional emails from the Care Compass team about new features and tips",
      showTime: false,
      cadenceLabel: null,
    },
  ];

  return (
    <SectionCard>
      <SectionHeader
        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a5 5 0 00-5 5v3l-1.5 2h13L13 10V7a5 5 0 00-5-5z" stroke={SAGE_DARK} strokeWidth="1.5" strokeLinejoin="round"/><path d="M6.5 13a1.5 1.5 0 003 0" stroke={SAGE_DARK} strokeWidth="1.5"/></svg>}
        title="Reminders & alerts"
        desc="How and when Care Compass reaches you"
      />
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 0 }}>
        {ALERTS.map(({ key, label, sub, cadenceLabel, showTime, showDay }, i) => {
          const pref = prefs[key];
          const isLast = i === ALERTS.length - 1;
          return (
            <div
              key={key}
              style={{
                borderBottom: isLast ? "none" : `1px solid ${BORDER}`,
                padding: "14px 0",
              }}
            >
              {/* Toggle row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: INK, fontFamily: "sans-serif", fontWeight: 500 }}>{label}</div>
                  <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 2, fontFamily: "sans-serif" }}>{sub}</div>
                </div>
                <Toggle checked={pref.on} onChange={() => toggle(key)} />
              </div>

              {/* Schedule — only shown when enabled and relevant */}
              {pref.on && showTime && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: WARM_GRAY, fontFamily: "sans-serif", whiteSpace: "nowrap", minWidth: 48 }}>
                    {cadenceLabel}
                  </span>
                  {showDay && (
                    <select
                      value={pref.day || "Sunday"}
                      onChange={e => { setPrefs(p => ({ ...p, [key]: { ...p[key], day: e.target.value } })); markDirty(); }}
                      style={{ ...inputStyle, maxWidth: 120, fontSize: 13, padding: "5px 10px" }}
                    >
                      {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  )}
                  <TimePicker
                    value={pref.time}
                    onChange={val => setTime(key, val)}
                  />
                  <span style={{ fontSize: 11, color: "#b0a89e", fontFamily: "sans-serif" }}>your local time</span>
                </div>
              )}
              {/* Email opt-in — no schedule needed */}
              {pref.on && !showTime && (
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: SAGE_DARK, background: SAGE_LIGHT, borderRadius: 6, padding: "3px 10px", fontFamily: "sans-serif", fontWeight: 500 }}>
                    ✓ Opted in
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ─── Panel: Security ────────────────────────────────────────────────────── */
function SecurityPanel() {
  const rows = [
    { label: "Password",                   sub: "Last changed 3 months ago",                 status: null,  action: "Change password" },
    { label: "Two-factor authentication",  sub: "Authenticator app (TOTP) enabled",          status: true,  action: "Manage" },
    { label: "Passkey",                    sub: "Sign in with Face ID or fingerprint",        status: false, action: "Add passkey" },
    { label: "Signed-in devices",            sub: "The browsers and devices where you're currently logged in — review and remove any you don't recognize",             status: null,  action: "View devices" },
    { label: "Recovery codes",             sub: "Backup codes for account recovery",         status: null,  action: "View codes" },
  ];

  return (
    <SectionCard>
      <SectionHeader
        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L3 4v4c0 3 2.3 5.3 5 6 2.7-.7 5-3 5-6V4L8 2z" stroke={SAGE_DARK} strokeWidth="1.5" strokeLinejoin="round"/></svg>}
        title="Security"
        desc="Protect your account and health data"
      />
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column" }}>
        {rows.map(({ label, sub, status, action }, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : "none" }}>
            <div>
              <div style={{ fontSize: 14, color: INK, fontFamily: "sans-serif" }}>{label}</div>
              <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 2, fontFamily: "sans-serif" }}>{sub}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {status !== null && (
                <>
                  <StatusDot on={status} />
                  <span style={{ fontSize: 12, color: WARM_GRAY, fontFamily: "sans-serif" }}>{status ? "Active" : "Not set up"}</span>
                </>
              )}
              <OutlineBtn>{action}</OutlineBtn>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ─── Panel: Privacy & Data ──────────────────────────────────────────────── */

/* ─── Info popover ───────────────────────────────────────────────────────── */
function InfoPopover({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: "2px 4px",
          display: "flex", alignItems: "center", color: WARM_GRAY, lineHeight: 1,
        }}
        aria-label="More information"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="#b0a89e" strokeWidth="1.3"/>
          <path d="M8 7v4" stroke="#b0a89e" strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="8" cy="5.5" r="0.7" fill="#b0a89e"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: "fixed", left: "auto", zIndex: 200,
          background: "white", border: `1px solid ${BORDER}`,
          borderRadius: 10, padding: "14px 16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.14)",
          width: 280, fontFamily: "sans-serif",
          maxHeight: "80vh", overflowY: "auto",
        }}>
          {children}
          <div style={{
            position: "absolute", top: -5, left: 10,
            width: 10, height: 10, background: "white",
            border: `1px solid ${BORDER}`, borderRight: "none", borderBottom: "none",
            transform: "rotate(45deg)",
          }}/>
        </div>
      )}
    </div>
  );
}

function PrivacyPanel({ prefs, setPrefs, markDirty }) {
  function detectLocalData() {
    const keys = [
      "care-compass-medications-v1",
      "cc-family-history",
      "cc-care-team",
      "cc-full-name",
      "cc-display-name",
      "cc-completed-panels",
      "cc-assessment-done",
      "cc-setup-complete",
      "cc-tracker-entries",
      "cc-appointments",
      "cc-symptoms",
      "cc-sleep",
      "cc-stress",
      "cc-cycle",
    ];
    return keys.some(k => {
      try {
        const val = localStorage.getItem(k);
        if (!val) return false;
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.length > 0;
        if (typeof parsed === "object" && parsed !== null) return Object.keys(parsed).length > 0;
        return Boolean(parsed);
      } catch { return Boolean(localStorage.getItem(k)); }
    });
  }
  const [hasLocalData] = React.useState(() => detectLocalData());
  const toggle = (key) => { setPrefs(p => ({ ...p, [key]: !p[key] })); markDirty(); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Privacy controls */}
      <SectionCard>
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="7" width="12" height="8" rx="1.5" stroke={SAGE_DARK} strokeWidth="1.5"/><path d="M5 7V5a3 3 0 016 0v2" stroke={SAGE_DARK} strokeWidth="1.5" strokeLinecap="round"/></svg>}
          title="Privacy controls"
          desc="How your health data is used and shared"
        />
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column" }}>
          {/* Improve data row — with info popover */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 14, color: INK, fontFamily: "sans-serif" }}>Improve Care Compass with my data</span>
                <InfoPopover>
                  <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8 }}>What this means</div>
                  <div style={{ fontSize: 12.5, color: INK_LIGHT, lineHeight: 1.65, marginBottom: 10 }}>
                    When enabled, anonymized symptom patterns — with all personal details removed — may help us improve the AI insights Care Compass generates for everyone.
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: SAGE_DARK, marginBottom: 4 }}>What we never do</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {[
                      "Share or sell your data to third parties",
                      "Use your name, email, or any identifying details",
                      "Store anything that could be traced back to you",
                    ].map(item => (
                      <div key={item} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                        <span style={{ color: SAGE_DARK, fontSize: 11, marginTop: 1, flexShrink: 0 }}>✕</span>
                        <span style={{ fontSize: 12, color: WARM_GRAY, lineHeight: 1.5, fontFamily: "sans-serif" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}`, fontSize: 11.5, color: WARM_GRAY, fontStyle: "italic", fontFamily: "sans-serif" }}>
                    This is entirely optional. You can turn this off at any time.
                  </div>
                </InfoPopover>
                <span style={{ fontSize: 11, color: SAGE_DARK, fontStyle: "italic", fontFamily: "sans-serif", opacity: 0.8 }}>recommended</span>
              </div>
              <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 2, fontFamily: "sans-serif" }}>Anonymized patterns help train better insights for everyone</div>
            </div>
            <Toggle checked={prefs.improveData} onChange={() => toggle("improveData")} />
          </div>

          {/* Crash analytics row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
            <div>
              <div style={{ fontSize: 14, color: INK, fontFamily: "sans-serif" }}>Crash & usage analytics</div>
              <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 2, fontFamily: "sans-serif" }}>Help us identify bugs and performance issues</div>
            </div>
            <Toggle checked={prefs.crashAnalytics} onChange={() => toggle("crashAnalytics")} />
          </div>
        </div>
      </SectionCard>

      {/* Your data */}
      <SectionCard>
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M4 4l1 9h6l1-9" stroke={SAGE_DARK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          title="Your data"
          desc="Export, migrate, or delete your health records"
        />
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column" }}>
          {/* Export row — always visible */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: hasLocalData ? `1px solid ${BORDER}` : "none" }}>
            <div>
              <div style={{ fontSize: 14, color: INK, fontFamily: "sans-serif" }}>Export all data</div>
              <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 2, fontFamily: "sans-serif" }}>Download a full copy of your tracker, assessments, and reports as JSON</div>
            </div>
            <OutlineBtn hoverColor={TEAL} hoverBorder={TEAL}>Export</OutlineBtn>
          </div>

          {/* Migrate row — only shown when browser data exists */}
          {hasLocalData && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px", marginTop: 8, borderRadius: 10,
              background: TEAL_LIGHT, border: `1px solid rgba(74,159,165,0.25)`,
            }}>
              <div style={{ flex: 1, paddingRight: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, color: INK, fontFamily: "sans-serif", fontWeight: 500 }}>Save your existing health data</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                    color: "white", background: TEAL, borderRadius: 4,
                    padding: "2px 6px", textTransform: "uppercase", fontFamily: "sans-serif",
                  }}>Action needed</span>
                </div>
                <div style={{ fontSize: 12, color: WARM_GRAY, fontFamily: "sans-serif", lineHeight: 1.5 }}>
                  You have health data stored in this browser. Move it to your account so it's safe, synced, and never lost if you clear your browser.
                </div>
              </div>
              <OutlineBtn hoverColor={TEAL} hoverBorder={TEAL} onClick={() => window.location.href = "/migrate"}>
                Move data →
              </OutlineBtn>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Account actions */}
      <SectionCard>
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 5v4M8 5h.01" stroke={SAGE_DARK} strokeWidth="1.5" strokeLinecap="round"/></svg>}
          title="Account actions"
          desc="Need to make changes to your data or account?"
        />
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: INK, fontFamily: "sans-serif", margin: 0, lineHeight: 1.7 }}>
            If you'd like to permanently delete your personal symptom history, appointments, and health records — or close your Care Compass account entirely — just send us an email and we'll take care of it for you.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { label: "Delete my health records", sub: "Permanently removes your symptoms, appointments, and all tracked data. Your account remains open." },
              { label: "Close my account", sub: "Removes your account and all associated data. This cannot be undone." },
            ].map(({ label, sub }) => (
              <div key={label} style={{ display: "flex", gap: 10, padding: "10px 14px", background: CREAM, borderRadius: 8, border: `1px solid ${BORDER}` }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="8" cy="8" r="6.5" stroke={WARM_GRAY} strokeWidth="1.3"/>
                  <path d="M8 5v4M8 10.5h.01" stroke={WARM_GRAY} strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: INK, fontFamily: "sans-serif" }}>{label}</div>
                  <div style={{ fontSize: 12, color: WARM_GRAY, fontFamily: "sans-serif", marginTop: 2, lineHeight: 1.5 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: WARM_GRAY, fontFamily: "sans-serif", margin: 0, lineHeight: 1.6, padding: "10px 14px", background: SAGE_LIGHT, borderRadius: 8, border: `1px solid rgba(74,112,88,0.15)` }}>
            <strong style={{ color: SAGE_DARK, fontWeight: 600 }}>Note:</strong> These requests are separate from the "Improve Care Compass with my data" setting above. That toggle only affects whether anonymized patterns are shared — it does not store or delete your personal health records.
          </p>
          <a
            href="mailto:hello@joincarecompass.com?subject=Account request"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              fontSize: 13.5, fontWeight: 500, color: SAGE_DARK,
              fontFamily: "sans-serif", textDecoration: "none",
              background: SAGE_LIGHT, borderRadius: 8,
              padding: "9px 16px", alignSelf: "flex-start",
              border: `1px solid rgba(74,112,88,0.2)`,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke={SAGE_DARK} strokeWidth="1.4"/>
              <path d="M1.5 5.5l6.5 4.5 6.5-4.5" stroke={SAGE_DARK} strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            hello@joincarecompass.com
          </a>
          <p style={{ fontSize: 12, color: WARM_GRAY, fontFamily: "sans-serif", margin: 0, fontStyle: "italic" }}>
            Please allow 24–48 hours for a response.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Panel: Connected Apps ──────────────────────────────────────────────── */
const CONNECTED_APPS = [
  {
    id: "apple",
    label: "Apple Health",
    sub: "Heart rate, HRV, steps",
    connected: true,
    iconBg: "#fff0f0",
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a7 7 0 100 14A7 7 0 009 2z" stroke="#e74c3c" strokeWidth="1.4"/><path d="M9 6v3l2 2" stroke="#e74c3c" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    id: "oura",
    label: "Oura Ring",
    sub: "Sleep, readiness, temperature",
    connected: false,
    iconBg: "#eafaf1",
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#27ae60" strokeWidth="1.4"/><path d="M6 9l2 2 4-4" stroke="#27ae60" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    id: "googlefit",
    label: "Google Fit",
    sub: "Activity, workouts",
    connected: false,
    iconBg: "#f0f4ff",
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="3" width="12" height="12" rx="2" stroke="#3498db" strokeWidth="1.4"/><path d="M9 7v4M7 9h4" stroke="#3498db" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
];

function ConnectedAppsPanel() {
  const [apps, setApps] = useState(CONNECTED_APPS);
  const toggle = (id) => setApps(prev => prev.map(a => a.id === id ? { ...a, connected: !a.connected } : a));

  return (
    <SectionCard>
      <SectionHeader
        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="8" r="2" stroke={SAGE_DARK} strokeWidth="1.5"/><circle cx="12" cy="4" r="2" stroke={SAGE_DARK} strokeWidth="1.5"/><circle cx="12" cy="12" r="2" stroke={SAGE_DARK} strokeWidth="1.5"/><path d="M6 7l4-2M6 9l4 2" stroke={SAGE_DARK} strokeWidth="1.5" strokeLinecap="round"/></svg>}
        title="Connected apps"
        desc="Services you've authorized to sync with Care Compass"
      />
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column" }}>
        {apps.map(({ id, label, sub, connected, iconBg, icon }, i) => (
          <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < apps.length - 1 ? `1px solid ${BORDER}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: 14, color: INK, fontFamily: "sans-serif" }}>{label}</div>
                <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 2, fontFamily: "sans-serif" }}>
                  {sub} · {connected ? "Syncing" : "Not connected"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {connected && <><StatusDot on /><span style={{ fontSize: 12, color: WARM_GRAY, fontFamily: "sans-serif" }}>Connected</span></>}
              <OutlineBtn
                hoverColor={connected ? DANGER : SAGE_DARK}
                hoverBorder={connected ? DANGER : SAGE}
                onClick={() => toggle(id)}
              >
                {connected ? "Disconnect" : "Connect"}
              </OutlineBtn>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ─── Panel: Subscription ────────────────────────────────────────────────── */
const PLAN_FEATURES = [
  "Full symptom assessment",
  "Unlimited assessments",
  "Daily symptom tracker",
  "Blood pressure tracker",
  "Medication list & reminders",
  "Appointment calendar",
  "AI pattern insights",
  "Trends & frequency reports",
  "Photo logging",
  "Doctor-ready PDF reports",
  "BP & appointment reports",
  "Secure account with 2FA",
  "Data export",
];

function SubscriptionPanel() {
  const [billing, setBilling] = useState("annual");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelStep, setCancelStep] = useState(0);
  const [cancelReason, setCancelReason] = useState("");

  const nextDate = "May 3, 2026";

  const CheckMark = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="8" cy="8" r="7" fill={SAGE_LIGHT}/>
      <path d="M5 8l2 2 4-4" stroke={SAGE_DARK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Current plan */}
      <SectionCard>
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke={SAGE_DARK} strokeWidth="1.5"/><path d="M1.5 6.5h13" stroke={SAGE_DARK} strokeWidth="1.5"/><path d="M4 10h2M7 10h1" stroke={SAGE_DARK} strokeWidth="1.5" strokeLinecap="round"/></svg>}
          title="Current plan"
          desc="Your active subscription details"
        />
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Plan + price row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <BotanicalMark size={44} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: INK, fontFamily: "sans-serif" }}>Care Compass</span>
                  <span style={{ fontSize: 11, fontWeight: 600, background: SAGE_LIGHT, color: SAGE_DARK, borderRadius: 20, padding: "2px 8px", fontFamily: "sans-serif" }}>Active</span>
                </div>
                <div style={{ fontSize: 13, color: WARM_GRAY, fontFamily: "sans-serif" }}>Member since March 2026</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: INK, fontFamily: "sans-serif", lineHeight: 1 }}>
                {billing === "annual" ? "$140.30" : "$12.59"}
                <span style={{ fontSize: 13, fontWeight: 400, color: WARM_GRAY }}>{billing === "annual" ? " / year" : " / month"}</span>
              </div>
              <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 4, fontFamily: "sans-serif" }}>Next billing {nextDate}</div>
            </div>
          </div>

          {/* Billing cycle switcher */}
          <div style={{ background: CREAM, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: INK, fontFamily: "sans-serif", marginBottom: 2 }}>Billing cycle</div>
              <div style={{ fontSize: 12, color: WARM_GRAY, fontFamily: "sans-serif" }}>
                {billing === "annual" ? "Annual — you're saving $10.78 vs monthly" : "Monthly — switch to annual and save $10.78"}
              </div>
            </div>
            <div style={{ display: "flex", background: "white", borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
              {[["monthly", "Monthly · $12.59"], ["annual", "Annual · $140.30"]].map(([opt, label]) => (
                <button key={opt} onClick={() => setBilling(opt)} style={{
                  padding: "6px 14px", border: "none", cursor: "pointer", fontSize: 12.5,
                  fontFamily: "sans-serif", fontWeight: billing === opt ? 600 : 400,
                  background: billing === opt ? SAGE_DARK : "transparent",
                  color: billing === opt ? "white" : WARM_GRAY, transition: "all 0.15s",
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "sans-serif", marginBottom: 6 }}>Payment method</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 24, borderRadius: 4, background: "#1a1f71", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "white", letterSpacing: "0.05em", fontFamily: "sans-serif" }}>VISA</span>
                </div>
                <span style={{ fontSize: 14, color: INK, fontFamily: "sans-serif" }}>•••• •••• •••• 4242</span>
              </div>
            </div>
            <OutlineBtn>Update card</OutlineBtn>
          </div>

        </div>
      </SectionCard>

      {/* What's included */}
      <SectionCard>
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke={SAGE_DARK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          title="What's included"
          desc="Everything in your Care Compass subscription"
        />
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px 16px" }}>
            {PLAN_FEATURES.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <CheckMark />
                <span style={{ fontSize: 13.5, color: INK_LIGHT, fontFamily: "sans-serif", lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 14px", background: "#e0f2f4", borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="8" cy="8" r="7" stroke={TEAL} strokeWidth="1.3"/><path d="M8 7v4" stroke={TEAL} strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="5.5" r="0.7" fill={TEAL}/></svg>
            <span style={{ fontSize: 12.5, color: "#2a7a80", fontFamily: "sans-serif", lineHeight: 1.55 }}>New features — lab results, AI photo analysis, specialist matching — are included as they launch.</span>
          </div>
        </div>
      </SectionCard>

      {/* Billing history */}
      <SectionCard>
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={SAGE_DARK} strokeWidth="1.5"/><path d="M5 6h6M5 9h4" stroke={SAGE_DARK} strokeWidth="1.4" strokeLinecap="round"/></svg>}
          title="Billing history"
          desc="Your past invoices"
        />
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 0", textAlign: "center" }}>
            <svg width="28" height="28" viewBox="0 0 16 16" fill="none"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={SAGE} strokeWidth="1.3"/><path d="M5 6h6M5 9h4" stroke={SAGE} strokeWidth="1.3" strokeLinecap="round"/></svg>
            <div style={{ fontSize: 13.5, color: INK, fontFamily: "sans-serif", fontWeight: 500 }}>Billing history coming soon</div>
            <div style={{ fontSize: 12.5, color: WARM_GRAY, fontFamily: "sans-serif", lineHeight: 1.6, maxWidth: 320 }}>
              Once Stripe is connected, your invoices and receipts will appear here. In the meantime, reach out to <a href="mailto:hello@joincarecompass.com" style={{ color: SAGE_DARK }}>hello@joincarecompass.com</a> for any billing questions.
            </div>
          </div>

        </div>
      </SectionCard>

      {/* Cancel zone */}
      <SectionCard danger>
        <SectionHeader
          danger
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 6v4M8 12h.01" stroke={DANGER} strokeWidth="1.5" strokeLinecap="round"/><path d="M7.1 2.5L1.5 12.5a1 1 0 00.9 1.5h11.2a1 1 0 00.9-1.5L8.9 2.5a1 1 0 00-1.8 0z" stroke={DANGER} strokeWidth="1.5" strokeLinejoin="round"/></svg>}
          title="Cancel subscription"
          desc="You'll keep access until the end of your billing period"
        />
        <div style={{ padding: "20px 24px" }}>

          {!showCancel && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontSize: 13.5, color: WARM_GRAY, fontFamily: "sans-serif", maxWidth: 420, lineHeight: 1.6 }}>
                If you cancel, your subscription stays active until <strong style={{ color: INK }}>{nextDate}</strong>. Your data is preserved and you can resubscribe any time.
              </div>
              <DangerBtn onClick={() => { setShowCancel(true); setCancelStep(0); }}>Cancel subscription</DangerBtn>
            </div>
          )}

          {showCancel && cancelStep === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: INK, fontFamily: "sans-serif" }}>Before you go — are you sure?</div>
              <div style={{ fontSize: 13.5, color: WARM_GRAY, fontFamily: "sans-serif", lineHeight: 1.6 }}>
                You'll lose access to AI pattern insights, PDF reports, and unlimited tracking on <strong style={{ color: INK }}>{nextDate}</strong>.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <DangerBtn onClick={() => setCancelStep(1)}>Yes, continue cancelling</DangerBtn>
                <OutlineBtn onClick={() => setShowCancel(false)}>Keep my subscription</OutlineBtn>
              </div>
            </div>
          )}

          {showCancel && cancelStep === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: INK, fontFamily: "sans-serif" }}>Help us improve — why are you cancelling?</div>
              {["Too expensive", "Not using it enough", "Missing a feature I need", "Switching to another tool", "Taking a break", "Other"].map(reason => (
                <label key={reason} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="radio" name="cancel-reason" value={reason} onChange={() => setCancelReason(reason)} style={{ accentColor: SAGE_DARK, width: 15, height: 15 }} />
                  <span style={{ fontSize: 13.5, color: INK_LIGHT, fontFamily: "sans-serif" }}>{reason}</span>
                </label>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                <DangerBtn onClick={() => setCancelStep(2)}>Confirm cancellation</DangerBtn>
                <OutlineBtn onClick={() => setShowCancel(false)}>Never mind</OutlineBtn>
              </div>
            </div>
          )}

          {showCancel && cancelStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: INK, fontFamily: "sans-serif" }}>Subscription cancelled.</div>
              <div style={{ fontSize: 13.5, color: WARM_GRAY, fontFamily: "sans-serif", lineHeight: 1.6 }}>
                You have full access until <strong style={{ color: INK }}>{nextDate}</strong>. We've emailed you a confirmation. We're sorry to see you go.
              </div>
              <OutlineBtn hoverColor={SAGE_DARK} hoverBorder={SAGE} style={{ alignSelf: "flex-start" }} onClick={() => { setShowCancel(false); setCancelStep(0); }}>
                Resubscribe
              </OutlineBtn>
            </div>
          )}

        </div>
      </SectionCard>

    </div>
  );
}

/* ─── Sage Chatbot ───────────────────────────────────────────────────────── */
const SAGE_KEYFRAMES = `
  @keyframes ffDrift { 0%,100%{transform:translate(0,0)} 33%{transform:translate(0.6px,-0.8px)} 66%{transform:translate(-0.5px,0.6px)} }
  @keyframes ffWingL { 0%,100%{transform-origin:50% 50%;transform:rotate(0deg) scaleY(1);opacity:0.55} 50%{transform-origin:50% 50%;transform:rotate(-18deg) scaleY(0.82);opacity:0.8} }
  @keyframes ffWingR { 0%,100%{transform-origin:50% 50%;transform:rotate(0deg) scaleY(1);opacity:0.55} 50%{transform-origin:50% 50%;transform:rotate(18deg) scaleY(0.82);opacity:0.8} }
  @keyframes ffLeaf  { 0%,100%{transform-origin:36px 36px;transform:scale(1)} 50%{transform-origin:36px 36px;transform:scale(1.03)} }
  @keyframes ffAntL  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-5deg)} }
  @keyframes ffAntR  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(5deg)} }
  @keyframes sageIn  { from{opacity:0;transform:translateY(12px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes sageGreetOut { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(6px) scale(0.97)} }
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
      <circle cx="31" cy="24.5" fill="#a8ffb0"><animate attributeName="r" values="1;1.6;1" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.4s" repeatCount="indefinite"/></circle>
    </g>
    <g style={{ transformOrigin:"37.5px 30px", animation:"ffAntR 2.8s ease-in-out infinite", animationDelay:"0.4s" }}>
      <line x1="37.5" y1="30" x2="41" y2="25" stroke="#4a7058" strokeWidth="0.9" strokeLinecap="round"/>
      <circle cx="41" cy="24.5" fill="#a8ffb0"><animate attributeName="r" values="1;1.6;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle>
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

const SETTINGS_SYSTEM_PROMPT = `You are Sage, the friendly Care Compass guide embedded in Account Settings. Care Compass is an AI-powered health navigation app for people with chronic illness.

Help users understand and navigate their account settings. The settings panels are: Profile (name, age, conditions, care team), Notifications (reminders, check-ins, weekly digest), Security (password, 2FA, passkeys), Privacy & Data (data sharing preferences, export, deletion), Connected Apps, Subscription (billing, plan, cancellation), Family History (maternal/paternal conditions), and Medications (medication list, bottle scanning).

Answer questions about what each setting does, why it matters, and how to use it. Be warm, helpful, and concise — 2-3 sentences max. No bullet points or markdown.`;

const SETTINGS_SUGGESTIONS_BY_PANEL = {
  profile:       ["What should I put in my care team?", "Why does my diagnosis matter?", "What is this information used for?"],
  notifications: ["What's the daily reminder for?", "What's the difference between check-ins?", "Can I change the reminder time?"],
  security:      ["Should I enable 2FA?", "What is a passkey?", "How do I change my password?"],
  privacy:       ["Who can see my health data?", "How do I export my data?", "How do I delete my account?"],
  connected:     ["What apps can I connect?", "Is my data safe with connected apps?"],
  subscription:  ["Can I cancel anytime?", "What's included in my plan?", "How do I update my payment method?"],
  family:        ["Why does family history matter?", "What conditions should I include?", "How is this used in my assessment?"],
  medications:   ["How does bottle scanning work?", "Why should I log my medications?", "How are medications used in my assessment?"],
};

const DEFAULT_SUGGESTIONS = [
  "What does this settings page do?",
  "How is my data kept private?",
  "How do I get the most out of Care Compass?",
];

function SageChatbot({ activePanel }) {
  const [open, setOpen]             = useState(false);
  const [greetPhase, setGreetPhase] = useState("hidden"); // "hidden" | "showing" | "fading" | "gone"
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const messagesEndRef              = useRef(null);

  // Auto-fade: appears at 5s, fades at 8.5s, gone at 9.2s — no dismiss needed
  useEffect(() => {
    const t1 = setTimeout(() => setGreetPhase("showing"), 5000);
    const t2 = setTimeout(() => setGreetPhase("fading"),  8500);
    const t3 = setTimeout(() => setGreetPhase("gone"),    9200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (open && messagesEndRef.current)
      messagesEndRef.current.scrollIntoView({ behavior:"smooth" });
  }, [messages, open]);

  const suggestions = SETTINGS_SUGGESTIONS_BY_PANEL[activePanel] || DEFAULT_SUGGESTIONS;

  const sendMessageWith = async (text) => {
    if (!text || loading) return;
    const panelContext = `The user is currently on the "${activePanel}" settings panel.`;
    const newMessages = [...messages, { role:"user", content:text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/claude", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`${SETTINGS_SYSTEM_PROMPT} ${panelContext}`,
          messages:newMessages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I'm having trouble connecting. Please try again in a moment.";
      setMessages([...newMessages, { role:"assistant", content:reply }]);
    } catch {
      setMessages([...newMessages, { role:"assistant", content:"I'm having trouble connecting. Please try again in a moment." }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => { const t = input.trim(); if (t) await sendMessageWith(t); };
  const handleKey   = (e) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const openChat    = () => { setOpen(true); setGreetPhase("gone"); };

  return (
    <>
      <style>{SAGE_KEYFRAMES}</style>

      {/* Auto-fading greeting — no dismiss button needed */}
      {(greetPhase === "showing" || greetPhase === "fading") && !open && (
        <div style={{
          ...ss.greeting,
          animation: greetPhase === "showing"
            ? "sageIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards"
            : "sageGreetOut 0.65s ease forwards",
          pointerEvents: greetPhase === "fading" ? "none" : "auto",
        }}>
          <p style={ss.greetingText}>Hi, I'm Sage! Need help with your settings? 🌿</p>
          <p style={ss.greetingAttrib}>— <strong>Your Care Compass guide</strong></p>
        </div>
      )}

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
                <div style={ss.emptyState}>Questions about this section? I can help.</div>
                <div style={ss.suggestedWrap}>
                  {suggestions.map(q => (
                    <button key={q} style={ss.suggestedPill} onClick={() => sendMessageWith(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={m.role==="user" ? ss.userBubble : ss.sageBubble}>{m.content}</div>
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
        <button style={ss.fab} onClick={openChat} aria-label="Chat with Sage">
          <FireflyMark size={48}/>
        </button>
      )}
    </>
  );
}

const ss = {
  fab:{ position:"fixed", bottom:"1.5rem", right:"1.5rem", width:68, height:68, borderRadius:"50%", background:"#e8f0eb", border:"2px solid #c2d9c8", boxShadow:"0 4px 24px rgba(74,112,88,0.18)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9000, padding:0 },
  greeting:{ position:"fixed", bottom:"5.75rem", right:"1.5rem", background:"#fff", borderRadius:"1rem", boxShadow:"0 4px 32px rgba(0,0,0,0.10)", padding:"1rem 1.25rem 0.85rem", maxWidth:260, zIndex:9000, animation:"sageIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" },
  greetingText:{ margin:"0 0 0.3rem", fontSize:"0.92rem", color:"#2d2926", lineHeight:1.55, paddingRight:"1rem" },
  greetingAttrib:{ margin:0, fontSize:"0.78rem", color:"#7a9e87" },
  greetingClose:{ position:"absolute", top:"0.5rem", right:"0.6rem", background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:"0.75rem", padding:"2px 4px", lineHeight:1 },
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

/* ─── Saved toast ────────────────────────────────────────────────────────── */
function Toast({ visible }) {
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%",
      transform: `translateX(-50%) translateY(${visible ? 0 : 80}px)`,
      background: INK, color: "white", borderRadius: 8, padding: "10px 20px",
      fontSize: 13.5, fontFamily: "sans-serif", fontWeight: 500,
      transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)", zIndex: 100,
      display: "flex", alignItems: "center", gap: 8, pointerEvents: "none",
    }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      Changes saved
    </div>
  );
}

/* ─── Symptoms Panel ─────────────────────────────────────────────────────── */
const TRACKED_SYM_KEY = "care-compass-tracked-symptoms-v1";

const DEFAULT_TRACKED_SYMPTOMS = [
  { id: "fatigue",       label: "Fatigue",                    category: "Systemic" },
  { id: "brain-fog",     label: "Brain fog",                  category: "Systemic" },
  { id: "malaise",       label: "Malaise",                    category: "Systemic" },
  { id: "pain-head",     label: "Head pain",                  category: "Pain" },
  { id: "pain-neck",     label: "Neck pain",                  category: "Pain" },
  { id: "pain-shoulder", label: "Shoulder pain",              category: "Pain" },
  { id: "pain-back",     label: "Back pain",                  category: "Pain" },
  { id: "pain-joint",    label: "Joint pain",                 category: "Pain" },
  { id: "pain-chest",    label: "Chest pain",                 category: "Pain" },
  { id: "dizziness",     label: "Dizziness",                  category: "Neurological" },
  { id: "numbness",      label: "Numbness / tingling",        category: "Neurological" },
  { id: "light-sound",   label: "Light / sound sensitivity",  category: "Neurological" },
  { id: "vision",        label: "Vision changes",             category: "Neurological" },
  { id: "palpitations",  label: "Heart palpitations",         category: "Autonomic" },
  { id: "sob",           label: "Shortness of breath",        category: "Autonomic" },
  { id: "temp-dysreg",   label: "Temperature dysregulation",  category: "Autonomic" },
  { id: "nausea",        label: "Nausea",                     category: "GI" },
  { id: "bloating",      label: "Bloating",                   category: "GI" },
  { id: "abdominal",     label: "Abdominal pain",             category: "GI" },
  { id: "anxiety",       label: "Anxiety",                    category: "Mood" },
  { id: "low-mood",      label: "Low mood",                   category: "Mood" },
];

const SYMPTOM_SUGGESTIONS = [
  { id: "insomnia",      label: "Insomnia",                   category: "Systemic" },
  { id: "fatigue-pem",   label: "Post-exertional malaise",    category: "Systemic" },
  { id: "pain-muscle",   label: "Muscle pain",                category: "Pain" },
  { id: "pain-nerve",    label: "Nerve pain",                 category: "Pain" },
  { id: "tinnitus",      label: "Tinnitus",                   category: "Neurological" },
  { id: "migraine",      label: "Migraine",                   category: "Neurological" },
  { id: "syncope",       label: "Fainting / syncope",         category: "Autonomic" },
  { id: "hr-elevation",  label: "Elevated heart rate",        category: "Autonomic" },
  { id: "nausea-vom",    label: "Nausea / vomiting",          category: "GI" },
  { id: "reflux",        label: "Acid reflux",                category: "GI" },
  { id: "ibs",           label: "IBS flare",                  category: "GI" },
  { id: "rash",          label: "Rash / hives",               category: "Skin" },
  { id: "flushing",      label: "Flushing",                   category: "Skin" },
  { id: "swelling",      label: "Swelling / edema",           category: "Skin" },
  { id: "depression",    label: "Depression",                 category: "Mood" },
  { id: "irritability",  label: "Irritability",               category: "Mood" },
  { id: "urinary",       label: "Urinary urgency",            category: "Other" },
  { id: "breathless",    label: "Exertional breathlessness",  category: "Other" },
];

const CATEGORY_ORDER = ["Systemic","Pain","Neurological","Autonomic","GI","Skin","Mood","Other","Custom"];

function SymptomsPanel({ markDirty }) {
  const [tracked, setTracked] = React.useState(() => {
    try {
      const stored = localStorage.getItem(TRACKED_SYM_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_TRACKED_SYMPTOMS;
    } catch { return DEFAULT_TRACKED_SYMPTOMS; }
  });
  const [customLabel, setCustomLabel] = React.useState("");
  const [customCategory, setCustomCategory] = React.useState("Custom");
  const [showCustomForm, setShowCustomForm] = React.useState(false);
  const [dragId, setDragId] = React.useState(null);
  const [dragOverId, setDragOverId] = React.useState(null);
  const [savedFlash, setSavedFlash] = React.useState(false);

  const saveTracked = (updated) => {
    setTracked(updated);
    try { localStorage.setItem(TRACKED_SYM_KEY, JSON.stringify(updated)); } catch {}
    markDirty && markDirty();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const removeSymptom = (id) => saveTracked(tracked.filter(s => s.id !== id));

  const addSuggestion = (sym) => {
    if (tracked.find(s => s.id === sym.id)) return;
    saveTracked([...tracked, sym]);
  };

  const addCustom = () => {
    const label = customLabel.trim();
    if (!label) return;
    const id = "custom-" + label.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    saveTracked([...tracked, { id, label, category: customCategory }]);
    setCustomLabel("");
    setShowCustomForm(false);
  };

  const resetToDefaults = () => {
    if (!window.confirm("Reset to the default symptom list? Your customizations will be removed.")) return;
    saveTracked(DEFAULT_TRACKED_SYMPTOMS);
  };

  // Drag-to-reorder handlers
  const onDragStart = (id) => setDragId(id);
  const onDragOver = (e, id) => { e.preventDefault(); setDragOverId(id); };
  const onDrop = (targetId) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const from = tracked.findIndex(s => s.id === dragId);
    const to   = tracked.findIndex(s => s.id === targetId);
    if (from === -1 || to === -1) { setDragId(null); setDragOverId(null); return; }
    const next = [...tracked];
    next.splice(to, 0, next.splice(from, 1)[0]);
    saveTracked(next);
    setDragId(null); setDragOverId(null);
  };
  const onDragEnd = () => { setDragId(null); setDragOverId(null); };

  // Group tracked symptoms by category
  const byCategory = {};
  tracked.forEach(s => {
    const cat = s.category || "Other";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(s);
  });
  const categories = CATEGORY_ORDER.filter(c => byCategory[c]);

  // Suggestions not yet in tracked list
  const available = SYMPTOM_SUGGESTIONS.filter(s => !tracked.find(t => t.id === s.id));
  const availableByCategory = {};
  available.forEach(s => {
    const cat = s.category || "Other";
    if (!availableByCategory[cat]) availableByCategory[cat] = [];
    availableByCategory[cat].push(s);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header card */}
      <SectionCard>
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3.5" stroke={SAGE_DARK} strokeWidth="1.4"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke={SAGE_DARK} strokeWidth="1.4" strokeLinecap="round"/><path d="M8 4v4M6 6h4" stroke={SAGE_DARK} strokeWidth="1.3" strokeLinecap="round"/></svg>}
          title="My tracked symptoms"
          desc="Choose which symptoms appear in your daily log quick-select and Trends tab. Drag to reorder."
        />
        <div style={{ padding: "8px 24px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: WARM_GRAY, fontFamily: "sans-serif" }}>
            {tracked.length} symptom{tracked.length !== 1 ? "s" : ""} tracked
          </span>
          {savedFlash && (
            <span style={{ fontSize: 12, color: SAGE_DARK, fontWeight: 600, fontFamily: "sans-serif" }}>✓ Saved</span>
          )}
          <button
            onClick={resetToDefaults}
            style={{ marginLeft: "auto", fontSize: 12, color: WARM_GRAY, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "sans-serif" }}
          >Reset to defaults</button>
        </div>
      </SectionCard>

      {/* Current tracked list grouped by category */}
      <SectionCard>
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M3 8h7M3 11h5" stroke={SAGE_DARK} strokeWidth="1.4" strokeLinecap="round"/></svg>}
          title="Your symptom list"
          desc="Drag rows to reorder. Tap × to remove."
        />
        <div style={{ padding: "8px 0 16px" }}>
          {categories.map(cat => (
            <div key={cat}>
              <div style={{ padding: "6px 24px 4px", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: WARM_GRAY, fontFamily: "sans-serif" }}>{cat}</div>
              {byCategory[cat].map((sym, i) => (
                <div
                  key={sym.id}
                  draggable
                  onDragStart={() => onDragStart(sym.id)}
                  onDragOver={(e) => onDragOver(e, sym.id)}
                  onDrop={() => onDrop(sym.id)}
                  onDragEnd={onDragEnd}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 24px",
                    background: dragOverId === sym.id ? SAGE_LIGHT : dragId === sym.id ? "#f8f8f6" : "transparent",
                    borderTop: dragOverId === sym.id ? `2px solid ${SAGE}` : "2px solid transparent",
                    cursor: "grab", transition: "background 0.12s",
                    userSelect: "none",
                  }}
                >
                  {/* Drag handle */}
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
                    <circle cx="4" cy="3" r="1.2" fill={INK}/><circle cx="8" cy="3" r="1.2" fill={INK}/>
                    <circle cx="4" cy="7" r="1.2" fill={INK}/><circle cx="8" cy="7" r="1.2" fill={INK}/>
                    <circle cx="4" cy="11" r="1.2" fill={INK}/><circle cx="8" cy="11" r="1.2" fill={INK}/>
                  </svg>
                  <span style={{ flex: 1, fontSize: 14, color: INK, fontFamily: "sans-serif" }}>{sym.label}</span>
                  <button
                    onClick={() => removeSymptom(sym.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#c0bab4", fontSize: 16, lineHeight: 1, padding: "0 2px", fontFamily: "sans-serif" }}
                    title="Remove"
                  >×</button>
                </div>
              ))}
            </div>
          ))}
          {tracked.length === 0 && (
            <div style={{ padding: "24px", textAlign: "center", color: WARM_GRAY, fontSize: 13, fontFamily: "sans-serif" }}>
              No symptoms tracked yet — add some below.
            </div>
          )}
        </div>
      </SectionCard>

      {/* Add from suggestions */}
      {available.length > 0 && (
        <SectionCard>
          <SectionHeader
            icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={SAGE_DARK} strokeWidth="1.4"/><path d="M8 5v6M5 8h6" stroke={SAGE_DARK} strokeWidth="1.4" strokeLinecap="round"/></svg>}
            title="Add more symptoms"
            desc="Common chronic illness symptoms — tap to add to your list."
          />
          <div style={{ padding: "8px 24px 16px" }}>
            {CATEGORY_ORDER.filter(c => availableByCategory[c]).map(cat => (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: WARM_GRAY, marginBottom: 6, fontFamily: "sans-serif" }}>{cat}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {availableByCategory[cat].map(sym => (
                    <button
                      key={sym.id}
                      onClick={() => addSuggestion(sym)}
                      style={{
                        fontSize: 13, padding: "5px 12px", borderRadius: 999,
                        border: `1.5px solid ${SAGE}`, background: "transparent",
                        color: SAGE_DARK, cursor: "pointer", fontFamily: "sans-serif",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={e => { e.target.style.background = SAGE_LIGHT; }}
                      onMouseLeave={e => { e.target.style.background = "transparent"; }}
                    >+ {sym.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Custom symptom form */}
      <SectionCard>
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 14l2-5L12 1l3 3L7 12l-5 2z" stroke={SAGE_DARK} strokeWidth="1.3" strokeLinejoin="round"/><path d="M10 3l3 3" stroke={SAGE_DARK} strokeWidth="1.3"/></svg>}
          title="Add a custom symptom"
          desc="Not on the list? Enter your own."
        />
        <div style={{ padding: "8px 24px 16px" }}>
          {!showCustomForm ? (
            <button
              onClick={() => setShowCustomForm(true)}
              style={{ fontSize: 13, padding: "7px 16px", borderRadius: 8, border: `1.5px solid ${SAGE}`, background: "transparent", color: SAGE_DARK, cursor: "pointer", fontFamily: "sans-serif" }}
            >+ Add custom symptom</button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                value={customLabel}
                onChange={e => setCustomLabel(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCustom()}
                placeholder="Symptom name (e.g. jaw pain, dysautonomia flare)"
                autoFocus
                style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${SAGE}`, fontSize: 14, color: INK, fontFamily: "sans-serif", outline: "none", background: OFF_WHITE }}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: WARM_GRAY, fontFamily: "sans-serif" }}>Category:</span>
                <select
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  style={{ padding: "5px 10px", borderRadius: 8, border: `1.5px solid ${BORDER}`, fontSize: 13, color: INK, fontFamily: "sans-serif", background: OFF_WHITE, outline: "none" }}
                >
                  {CATEGORY_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <OutlineBtn hoverColor={SAGE_DARK} hoverBorder={SAGE_DARK} onClick={addCustom}>Add symptom</OutlineBtn>
                <button onClick={() => { setShowCustomForm(false); setCustomLabel(""); }} style={{ fontSize: 13, color: WARM_GRAY, background: "none", border: "none", cursor: "pointer", fontFamily: "sans-serif" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
const SAVEABLE_PANELS = new Set(["profile", "notifications", "privacy", "symptoms"]);
// All panels that should show the sticky next bar (saveable + next-only)
const ALL_NAV_PANELS = new Set(["profile", "notifications", "security", "privacy", "connected", "subscription", "family", "medications", "symptoms"]);

export default function CareCompassSettings() {
  // Setup mode — triggered from /account?setup=true (new user flow)
  const isSetupMode = new URLSearchParams(window.location.search).get("setup") === "true";
  const [activePanel, setActivePanel] = useState("profile");
  const [dirty, setDirty] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [showAssessmentPrompt, setShowAssessmentPrompt] = useState(false);
  const [completedPanels, setCompletedPanels] = useState(() => {
    try { const s = localStorage.getItem("cc-completed-panels"); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: "", lastName: "", preferredName: "", email: "",
    dob: "", sex: "", pronouns: "",
    timezone: "",
    condition: "", conditions: [], diagnosisStatus: "Formally diagnosed", careTeam: "", careProviders: [{ id: 1, name: "", type: "provider", specialty: "", careRole: "" }, { id: 2, name: "", type: "provider", specialty: "", careRole: "" }],
  });

  // Notification prefs state
  const [notifPrefs, setNotifPrefs] = useState({
    dailyReminder:  { on: true,  time: "20:00" },
    morningCheckin: { on: true,  time: "04:00" },
    eveningCheckin: { on: true,  time: "18:00" },
    weeklyDigest:   { on: true,  time: "08:00", day: "Sunday" },
    productUpdates: { on: false },
  });

  // Privacy prefs state
  const [privacyPrefs, setPrivacyPrefs] = useState({
    improveData: true, crashAnalytics: true,
  });

  const markDirty = () => setDirty(true);

  const handleSave = () => {
    setDirty(false);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
    // Mark this panel as complete
    const newCompleted = new Set(completedPanels);
    newCompleted.add(activePanel);
    setCompletedPanels(newCompleted);
    try { localStorage.setItem("cc-completed-panels", JSON.stringify([...newCompleted])); } catch {}

    // Show welcome prompt only after Family History (last panel) is saved
    if (activePanel === "medications") {
      setTimeout(() => setShowAssessmentPrompt(true), 600);
    }
    // Persist display name for dashboard greeting
    try {
      const displayName = profileForm.preferredName?.trim() || profileForm.firstName?.trim() || "";
      localStorage.setItem("cc-display-name", displayName);
      // Persist check-in times for tracker
      localStorage.setItem("cc-notif-checkins", JSON.stringify({
        morningTime: notifPrefs.morningCheckin?.time || "04:00",
        eveningTime: notifPrefs.eveningCheckin?.time || "18:00",
        morningOn: notifPrefs.morningCheckin?.on !== false,
        eveningOn: notifPrefs.eveningCheckin?.on !== false,
      }));
      localStorage.setItem("cc-full-name", `${profileForm.firstName} ${profileForm.lastName}`.trim());
      // Persist care team for use in tracker reports and appointment suggestions
      const activeProviders = (profileForm.careProviders || []).filter(p => p.name.trim());
      localStorage.setItem("cc-care-team", JSON.stringify(activeProviders));
    } catch {}
  };

  const switchPanel = (id) => {
    setActivePanel(id);
    setMobileNavOpen(false);
    setDirty(false);
  };

  // Inject responsive CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "settings-responsive";
    style.innerHTML = `
      @media (max-width: 640px) {
        .settings-sidebar { display: none !important; }
        .settings-sidebar.open { display: flex !important; position: fixed; inset: 0; z-index: 50; background: ${CREAM}; padding-top: 60px; }
        .settings-mobile-toggle { display: flex !important; }
      }
      @media (min-width: 641px) {
        .settings-mobile-toggle { display: none !important; }
      }
      .settings-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      @media (max-width: 480px) {
        .settings-field-row { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { const el = document.getElementById("settings-responsive"); if (el) el.remove(); };
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: OFF_WHITE, fontFamily: "sans-serif" }}>

      {/* Sidebar */}
      <div
        className={`settings-sidebar${mobileNavOpen ? " open" : ""}`}
        style={{ width: 220, flexShrink: 0, background: CREAM, borderRight: `1px solid ${BORDER}`, padding: "28px 0", display: "flex", flexDirection: "column", gap: 2 }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px 24px", borderBottom: `1px solid ${BORDER}`, marginBottom: 8 }}>
          <BotanicalMark size={28} />
          <span style={{ fontSize: 14, fontWeight: 600, color: SAGE_DARK, letterSpacing: "0.02em" }}>Care Compass</span>
        </div>

        <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: WARM_GRAY, padding: "12px 20px 4px" }}>Settings</div>

        {NAV_ITEMS.map(({ id, label, icon }) => (
          <div
            key={id}
            onClick={() => switchPanel(id)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 20px",
              fontSize: 13.5, cursor: "pointer",
              color: activePanel === id ? SAGE_DARK : INK_LIGHT,
              background: activePanel === id ? SAGE_LIGHT : "transparent",
              borderLeft: `2px solid ${activePanel === id ? SAGE : "transparent"}`,
              fontWeight: activePanel === id ? 500 : 400,
              transition: "all 0.15s",
            }}
          >
            {isSetupMode ? (
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: completedPanels.has(id) ? SAGE : activePanel === id ? SAGE_DARK : BORDER, color: completedPanels.has(id) || activePanel === id ? "#fff" : WARM_GRAY, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                {completedPanels.has(id) ? "✓" : NAV_ITEMS.findIndex(n => n.id === id) + 1}
              </span>
            ) : (
              <span style={{ opacity: 0.75, flexShrink: 0, display: "flex" }}>{icon}</span>
            )}
            <span style={{ flex: 1 }}>{label}</span>

          </div>
        ))}

        <div style={{ flex: 1 }} />

        {/* Sign out */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", fontSize: 13.5, color: DANGER, cursor: "pointer" }}
          onClick={() => window.location.href = "/login"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 1 }}>
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke={DANGER} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Topbar */}
        <div style={{ background: OFF_WHITE, borderBottom: `1px solid ${BORDER}`, padding: "18px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Mobile menu toggle */}
            <button
              className="settings-mobile-toggle"
              onClick={() => setMobileNavOpen(o => !o)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "none" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke={INK} strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: INK }}>Account Settings</div>
              <div style={{ fontSize: 13, color: WARM_GRAY, marginTop: 1 }}>Manage your profile, security and preferences</div>
            </div>
          </div>
          {SAVEABLE_PANELS.has(activePanel) && (
            <button
              onClick={handleSave}
              disabled={!dirty}
              className="desktop-save-btn"
              style={{
                background: dirty ? SAGE_DARK : "#bbb", color: "white", border: "none",
                borderRadius: 8, padding: "9px 20px", fontSize: 13.5, cursor: dirty ? "pointer" : "default",
                fontWeight: 500, transition: "background 0.15s", letterSpacing: "0.01em",
              }}
            >
              Save changes
            </button>
          )}
          <style>{`@media (max-width: 600px) { .desktop-save-btn { display: none !important; } }`}</style>
        </div>

        {/* Content */}
        <div style={{ padding: "32px 36px", maxWidth: 740, paddingBottom: ALL_NAV_PANELS.has(activePanel) ? "100px" : "32px" }}>
          {/* Setup mode banner */}
          {isSetupMode && (
            <div style={{ background: `linear-gradient(135deg, ${SAGE_LIGHT}, ${TEAL_LIGHT})`, borderRadius: "0.875rem", padding: "0.875rem 1.25rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: SAGE_DARK, margin: "0 0 0.2rem", fontFamily: "sans-serif" }}>Account setup</p>
                <p style={{ fontSize: "0.82rem", color: INK, margin: 0, fontFamily: "sans-serif" }}>Fill in what you can — use <strong>Save & Next</strong> to move through each section</p>
              </div>
              <a href="/welcome" style={{ fontSize: "0.78rem", color: SAGE_DARK, textDecoration: "underline", fontFamily: "sans-serif" }}>Back to overview</a>
            </div>
          )}
          {activePanel === "profile"       && <ProfilePanel       form={profileForm}   setForm={setProfileForm}   markDirty={markDirty} />}
          {activePanel === "notifications" && <NotificationsPanel prefs={notifPrefs}   setPrefs={setNotifPrefs}   markDirty={markDirty} />}
          {activePanel === "security"      && <SecurityPanel />}
          {activePanel === "privacy"       && <PrivacyPanel       prefs={privacyPrefs} setPrefs={setPrivacyPrefs} markDirty={markDirty} />}
          {activePanel === "connected"     && <ConnectedAppsPanel />}
          {activePanel === "subscription"  && <SubscriptionPanel />}
          {activePanel === "medications"  && <MedicationsPanel onComplete={() => { const nc = new Set(completedPanels); nc.add("medications"); setCompletedPanels(nc); try { localStorage.setItem("cc-completed-panels", JSON.stringify([...nc])); } catch {}; setTimeout(() => setShowAssessmentPrompt(true), 400); }}/>}
          {activePanel === "family"       && <FamilyHistoryPanel onComplete={() => { const nc = new Set(completedPanels); nc.add("family"); setCompletedPanels(nc); try { localStorage.setItem("cc-completed-panels", JSON.stringify([...nc])); } catch {}; }}/>}
          {activePanel === "symptoms"     && <SymptomsPanel markDirty={markDirty} />}
        </div>

        {/* ── Sticky save bar — travels with user on mobile ── */}
        {ALL_NAV_PANELS.has(activePanel) && (() => {
          const panelIds = NAV_ITEMS.map(n => n.id);
          const currentIdx = panelIds.indexOf(activePanel);
          const nextPanel = panelIds.find((id, i) => i > currentIdx);
          const isLast = activePanel === "medications";
          const isSaveable = SAVEABLE_PANELS.has(activePanel);
          // Family and medications have their own save buttons inside the panel
          // Security, connected, subscription have no user-editable dirty state
          const hasOwnSave = activePanel === "family";
          return (
            <div style={{
              position: "sticky", bottom: 0,
              background: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(8px)",
              borderTop: `1px solid ${BORDER}`,
              padding: "12px 24px",
              display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 12,
              zIndex: 50, flexWrap: "wrap",
            }}>
              <span style={{ fontSize: 12.5, fontFamily: "sans-serif", fontStyle: "italic",
                color: isSaveable && dirty ? SAGE_DARK : WARM_GRAY }}>
                {isSaveable && dirty ? "You have unsaved changes"
                  : isLast ? "All done! Your account is set up."
                  : isSaveable ? "All changes saved"
                  : ""}
              </span>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {/* Save button — only for saveable panels, not panels with own save */}
                {isSaveable && !hasOwnSave && (
                  <button
                    onClick={handleSave}
                    disabled={!dirty}
                    style={{
                      background: isLast ? (dirty ? SAGE_DARK : "#bbb") : "transparent",
                      color: isLast ? "white" : (dirty ? SAGE_DARK : WARM_GRAY),
                      border: isLast ? "none" : `1.5px solid ${dirty ? SAGE : BORDER}`,
                      borderRadius: 8, padding: "9px 18px", fontSize: 13,
                      cursor: dirty ? "pointer" : "default", fontWeight: 600,
                      transition: "all 0.15s", fontFamily: "sans-serif",
                    }}
                  >
                    {dirty ? "Save" : "Saved ✓"}
                  </button>
                )}
                {/* Next button — shown on all panels except last */}
                {!isLast && nextPanel && (
                  <button
                    onClick={() => {
                      if (isSaveable && dirty && !hasOwnSave) handleSave();
                      // Mark current panel as complete when navigating forward
                      const nc = new Set(completedPanels);
                      nc.add(activePanel);
                      setCompletedPanels(nc);
                      try { localStorage.setItem("cc-completed-panels", JSON.stringify([...nc])); } catch {}
                      switchPanel(nextPanel);
                      window.scrollTo(0, 0);
                    }}
                    style={{
                      background: SAGE_DARK, color: "white", border: "none",
                      borderRadius: 8, padding: "9px 18px", fontSize: 13,
                      cursor: "pointer", fontWeight: 600,
                      transition: "all 0.15s", fontFamily: "sans-serif",
                    }}
                  >
                    {isSaveable && dirty && !hasOwnSave ? "Save & Next →" : "Next →"}
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      <Toast visible={toastVisible} />

      <SageChatbot activePanel={activePanel} />

      {/* Assessment prompt — shown after first save if no assessment yet */}
      {showAssessmentPrompt && (() => {
        const displayName = localStorage.getItem("cc-display-name") || "";
        return (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem"
          }}>
            <div style={{
              background: "#fff", borderRadius: "1.5rem", padding: "2.5rem 2rem",
              maxWidth: 380, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
              textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem"
            }}>
              {/* Botanical mark */}
              <BotanicalMark size={56}/>

              {/* Welcome greeting */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.6rem", fontWeight: 700, color: INK, margin: 0, lineHeight: 1.2 }}>
                  {displayName ? `Welcome, ${displayName}!` : "You're all set!"}
                </h2>
                <p style={{ fontSize: "0.875rem", color: WARM_GRAY, lineHeight: 1.65, margin: 0 }}>
                  Your account is set up and ready. Head to your dashboard to take your assessment and start tracking.
                </p>
              </div>

              {/* CTA */}
              <a
                href={isSetupMode ? "/welcome?step=2" : "/dashboard"}
                onClick={() => {
                  try {
                    localStorage.setItem("cc-setup-complete", "true");
                    // Remove skipped-setup flag if they've now completed it
                    localStorage.removeItem("cc-skipped-setup");
                  } catch {}
                }}
                style={{
                  background: SAGE_DARK, color: "#fff", textDecoration: "none",
                  padding: "0.95rem", borderRadius: "100px", fontSize: "1rem",
                  fontWeight: 600, width: "100%", boxSizing: "border-box",
                  display: "block",
                }}
              >
                {isSetupMode ? "Continue to assessment →" : "Let's get started →"}
              </a>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
