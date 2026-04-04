import React, { useState, useEffect } from "react";

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
const APPT_KEY = "care-compass-appointments-v1";

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
  </svg>
);


const APPT_SPECIALTIES = [
  "Primary Care", "Cardiologist", "Rheumatologist", "Neurologist",
  "Gastroenterologist", "Immunologist / Allergist", "Endocrinologist",
  "Dermatologist", "Physical Therapist", "Pain Management",
  "Psychiatrist / Psychologist", "Gynecologist", "Orthopedist",
  "Pulmonologist", "Nephrologist", "Other",
];


/* ─── Appointment time picker ────────────────────────────────────────────── */
function ApptTimePicker({ value, onChange, style: extraStyle = {} }) {
  const parse = (val) => {
    if (!val) return { h: 9, m: 0, period: "AM" };
    const [hh, mm] = val.split(":").map(Number);
    return { h: hh % 12 || 12, m: mm, period: hh >= 12 ? "PM" : "AM" };
  };
  const toValue = (h, m, period) => {
    let h24 = h % 12;
    if (period === "PM") h24 += 12;
    return `${String(h24).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  };
  const { h, m, period } = parse(value);
  const hours = [12,1,2,3,4,5,6,7,8,9,10,11];
  const minutes = [0,5,10,15,20,25,30,35,40,45,50,55];
  const sel = (w) => ({
    border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "0.65rem",
    padding: "0.65rem 0.3rem", fontSize: "0.85rem", color: INK,
    background: OFF_WHITE, outline: "none", cursor: "pointer",
    fontFamily: "inherit", appearance: "none", WebkitAppearance: "none",
    textAlign: "center", width: w, boxSizing: "border-box", ...extraStyle,
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <select value={h} onChange={e => onChange(toValue(Number(e.target.value), m, period))} style={sel("54px")}>
        {hours.map(hr => <option key={hr} value={hr}>{hr}</option>)}
      </select>
      <span style={{ color: WARM_GRAY, fontWeight: 600, fontSize: "1rem" }}>:</span>
      <select value={m} onChange={e => onChange(toValue(h, Number(e.target.value), period))} style={sel("54px")}>
        {minutes.map(min => <option key={min} value={min}>{String(min).padStart(2,"0")}</option>)}
      </select>
      <select value={period} onChange={e => onChange(toValue(h, m, e.target.value))} style={sel("58px")}>
        <option>AM</option>
        <option>PM</option>
      </select>
    </div>
  );
}

/* ─── Google Places location autocomplete ────────────────────────────────── */
function LocationInput({ value, onChange, style: inp }) {
  const inputRef = React.useRef(null);
  const autocompleteRef = React.useRef(null);

  React.useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_PLACES_KEY;
    if (!key) return;

    const initAutocomplete = () => {
      if (!window.google?.maps?.places || !inputRef.current) return;
      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ["establishment", "geocode"],
          fields: ["formatted_address", "name"],
        });
        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();
          if (place.name && place.formatted_address) {
            onChange(`${place.name}, ${place.formatted_address}`);
          } else if (place.formatted_address) {
            onChange(place.formatted_address);
          }
        });
      } catch (e) {
        console.warn("Places autocomplete error:", e);
      }
    };

    window.gm_authFailure = () => console.warn("Google Maps auth failed");

    if (window.google?.maps?.places) {
      initAutocomplete();
    } else if (!document.getElementById("google-maps-script")) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(interval);
          initAutocomplete();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="e.g. Houston Methodist, 6565 Fannin St"
      style={inp}
      autoComplete="off"
    />
  );
}


const REMINDER_OPTIONS = [
  { value: "2880", label: "2 days before" },
  { value: "1440", label: "1 day before" },
  { value: "240",  label: "4 hours before" },
  { value: "120",  label: "2 hours before" },
  { value: "60",   label: "1 hour before" },
  { value: "30",   label: "30 minutes before" },
];

function daysUntil(dateStr) {
  // Parse date as local date (YYYY-MM-DD) to avoid timezone shifts
  const [y, m, d] = dateStr.split("-").map(Number);
  const appt = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  appt.setHours(0, 0, 0, 0);
  return Math.floor((appt - now) / 86400000);
}

function formatApptDate(dateStr, timeStr) {
  const d = new Date(`${dateStr}T${timeStr || "00:00"}`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" }) +
    (timeStr ? " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "");
}

function urgencyColor(days) {
  if (days < 0) return "#aaa";
  if (days <= 3) return "#c0392b";
  if (days <= 7) return "#e8a838";
  return SAGE_DARK;
}

function AppointmentCard({ appt, onEdit, onDelete }) {
  const days = daysUntil(appt.date);
  const color = urgencyColor(days);
  const isPast = days < 0;
  return (
    <div style={{
      background: "#fff", borderRadius: "1rem",
      border: `1px solid rgba(0,0,0,0.07)`,
      borderLeft: `4px solid ${color}`,
      padding: "1rem 1.25rem",
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      gap: "1rem", opacity: isPast ? 0.6 : 1,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.95rem", fontWeight: 700, color: INK }}>
            {appt.specialty}
          </span>
          {appt.doctor && <span style={{ fontSize: "0.8rem", color: WARM_GRAY }}>· {appt.doctor}</span>}
          <span style={{
            fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.6rem",
            borderRadius: "100px", background: isPast ? "#f0ede8" : color + "18",
            color: isPast ? WARM_GRAY : color, marginLeft: "auto", whiteSpace: "nowrap",
          }}>
            {isPast ? "Past" : days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `${days} days`}
          </span>
        </div>
        <p style={{ fontSize: "0.78rem", color: TEAL, margin: "0 0 0.3rem", fontWeight: 500 }}>
          {formatApptDate(appt.date, appt.time)}
        </p>
        {appt.location && <p style={{ fontSize: "0.75rem", color: WARM_GRAY, margin: "0 0 0.2rem" }}>📍 {appt.location}</p>}
        {appt.reason && <p style={{ fontSize: "0.78rem", color: INK_LIGHT, margin: 0, fontStyle: "italic" }}>"{appt.reason}"</p>}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          {appt.reminder && (
            <span style={{ fontSize: "0.7rem", background: SAGE_LIGHT, color: SAGE_DARK, borderRadius: "100px", padding: "0.2rem 0.65rem", fontWeight: 500 }}>
              {appt.reminder ? `⏰ ${(REMINDER_OPTIONS.find(o => o.value === appt.reminderAdvance) || REMINDER_OPTIONS[1]).label}` : ''}
            </span>
          )}
          {appt.prepReport && (
            <span style={{ fontSize: "0.7rem", background: TEAL_LIGHT, color: TEAL, borderRadius: "100px", padding: "0.2rem 0.65rem", fontWeight: 500 }}>
              📋 Report requested
            </span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flexShrink: 0 }}>
        <button onClick={() => onEdit(appt)} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "6px", padding: "0.25rem 0.65rem", fontSize: "0.72rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
        <button onClick={() => onDelete(appt.id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: "0.9rem", textAlign: "center" }}>✕</button>
      </div>
    </div>
  );
}

function AppointmentForm({ initial, onSave, onCancel }) {
  const blank = { specialty: "", doctor: "", date: "", time: "", location: "", reason: "", reminder: true, reminderAdvance: "1440", prepReport: true };
  const careTeamProviders = (() => {
    try { const s = localStorage.getItem("cc-care-team"); return s ? JSON.parse(s) : []; } catch { return []; }
  })();
  const [form, setForm] = useState(initial || blank);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggle = (k) => setForm(f => ({ ...f, [k]: !f[k] }));
  const valid = form.specialty && form.date;

  const inp = {
    padding: "0.65rem 0.9rem", borderRadius: "0.65rem",
    border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "0.9rem",
    color: INK, background: OFF_WHITE, outline: "none",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  };
  const lbl = { fontSize: "0.78rem", fontWeight: 600, color: INK_LIGHT, marginBottom: "0.3rem", display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Specialty + Doctor */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.875rem" }}>
        <div>
          <label style={lbl}>Specialty <span style={{ color: "#c0392b" }}>*</span></label>
          <select value={form.specialty} onChange={set("specialty")} style={{ ...inp, WebkitAppearance: "none" }}>
            <option value="">Select specialty...</option>
            {APPT_SPECIALTIES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ position: "relative" }}>
          <label style={lbl}>Doctor <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
          <input
            type="text"
            value={form.doctor}
            onChange={e => {
              setForm(f => ({ ...f, doctor: e.target.value }));
              // Auto-fill specialty if a care team provider is selected
              const match = careTeamProviders.find(p => p.name === e.target.value);
              if (match?.specialty) setForm(f => ({ ...f, doctor: e.target.value, specialty: match.specialty }));
            }}
            placeholder="e.g. Dr. Patel"
            style={inp}
            list="care-team-list"
          />
          {/* Suggest from saved care team */}
          <datalist id="care-team-list">
            {careTeamProviders.filter(p => p.name).map((p, i) => (
              <option key={i} value={p.name}>{p.specialty ? `${p.name} — ${p.specialty}` : p.name}</option>
            ))}
          </datalist>
        </div>
      </div>

      {/* Date + Time */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.875rem" }}>
        <div>
          <label style={lbl}>Date <span style={{ color: "#c0392b" }}>*</span></label>
          <input type="date" value={form.date} onChange={set("date")} style={inp}/>
        </div>
        <div>
          <label style={lbl}>Time <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
          <ApptTimePicker value={form.time} onChange={val => setForm(f => ({ ...f, time: val }))}/>
        </div>
      </div>

      {/* Location */}
      <div>
        <label style={lbl}>Location <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
        <LocationInput value={form.location} onChange={val => setForm(f => ({ ...f, location: val }))} style={inp}/>
      </div>

      {/* Reason */}
      <div>
        <label style={lbl}>Reason for appointment <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
        <textarea value={form.reason} onChange={set("reason")} placeholder="e.g. Follow-up on dysautonomia symptoms, medication review..." rows={2} style={{ ...inp, resize: "vertical", lineHeight: 1.5 }}/>
      </div>

      {/* Reminder + Report toggles */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", userSelect: "none" }}>
            <input type="checkbox" checked={form.reminder} onChange={() => toggle("reminder")} style={{ accentColor: SAGE_DARK, width: 16, height: 16 }}/>
            <span style={{ fontSize: "0.85rem", color: INK }}>Set reminder</span>
          </label>
          {form.reminder && (
            <select
              value={form.reminderAdvance}
              onChange={e => setForm(f => ({ ...f, reminderAdvance: e.target.value }))}
              style={{ border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "0.5rem", padding: "0.35rem 0.65rem", fontSize: "0.82rem", color: INK, background: OFF_WHITE, outline: "none", fontFamily: "inherit", cursor: "pointer", WebkitAppearance: "none" }}
            >
              {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", userSelect: "none" }}>
          <input type="checkbox" checked={form.prepReport} onChange={() => toggle("prepReport")} style={{ accentColor: TEAL, width: 16, height: 16 }}/>
          <span style={{ fontSize: "0.85rem", color: INK }}>Request report prep</span>
        </label>
      </div>

      {form.prepReport && (
        <div style={{ background: TEAL_LIGHT, borderRadius: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.78rem", color: TEAL, lineHeight: 1.6 }}>
          📋 We'll remind you to generate a symptom report 48 hours before your appointment so you can walk in prepared.
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.25rem" }}>
        <button onClick={onCancel} style={{ background: "transparent", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: "100px", padding: "0.6rem 1.25rem", fontSize: "0.875rem", color: WARM_GRAY, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
        <button onClick={() => valid && onSave(form)} disabled={!valid} style={{ background: valid ? SAGE_DARK : "#ccc", color: "#fff", border: "none", borderRadius: "100px", padding: "0.6rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: valid ? "pointer" : "default", fontFamily: "inherit" }}>
          {initial ? "Save changes" : "Add appointment"}
        </button>
      </div>
    </div>
  );
}

const severityColor = (n) => {
  if (!n) return SAGE;
  if (n <= 3) return "#7a9e87";
  if (n <= 6) return "#e8a838";
  return "#c0392b";
};

/* ─── Mini spark line ────────────────────────────────────────────────────── */
function SparkLine({ data, color = SAGE }) {
  if (!data || data.length < 2) return null;
  const W = 120, H = 40, PAD = 4;
  const max = Math.max(...data, 1);
  const xStep = (W - PAD * 2) / (data.length - 1);
  const points = data.map((v, i) => ({
    x: PAD + i * xStep,
    y: H - PAD - ((v / max) * (H - PAD * 2)),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} opacity="0.8"/>)}
    </svg>
  );
}

/* ─── Onboarding flow ────────────────────────────────────────────────────── */
const ONBOARDING_STEPS = [
  {
    icon: "🧭",
    title: "Start with your full assessment",
    desc: "The Care Compass assessment maps your symptoms across every body system and uses AI to surface patterns, specialist recommendations, and questions to bring to your doctor.",
    cta: "Take the Assessment →",
    href: "/compass",
    secondary: "I'll do this later",
  },
  {
    icon: "📋",
    title: "Track your symptoms every day",
    desc: "Log how you're feeling as it happens — including food, medications, sleep, activity, and photos. The more you track, the sharper your insights become.",
    cta: "Open the Tracker →",
    href: "/tracker",
    secondary: "I'll do this later",
  },
  {
    icon: "🩺",
    title: "Bring it to your doctor",
    desc: "Care Compass generates doctor-ready PDF reports from your tracker data and assessment results. You show up with data — that changes the conversation.",
    cta: "See an Example Report",
    href: "/tracker",
    secondary: "Got it — let's go",
  },
];

function OnboardingFlow({ userName, onComplete }) {
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  return (
    <div style={s.onboardingOverlay}>
      <div style={s.onboardingCard}>
        {/* Progress dots */}
        <div style={s.onboardingDots}>
          {ONBOARDING_STEPS.map((_, i) => (
            <div key={i} style={{ ...s.onboardingDot, background: i === step ? SAGE_DARK : i < step ? SAGE : "#e0dbd5", width: i === step ? 24 : 8 }}/>
          ))}
        </div>

        <div style={s.onboardingIcon}>{current.icon}</div>

        {step === 0 && (
          <p style={s.onboardingWelcome}>Welcome{userName ? `, ${userName}` : ""}! 🌿</p>
        )}

        <h2 style={s.onboardingTitle}>{current.title}</h2>
        <p style={s.onboardingDesc}>{current.desc}</p>

        <div style={s.onboardingActions}>
          <a href={current.href} style={s.onboardingCta}>{current.cta}</a>
          <button
            onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            style={s.onboardingSkip}
          >
            {current.secondary}
          </button>
        </div>

        <p style={s.onboardingStep}>{step + 1} of {ONBOARDING_STEPS.length}</p>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export default function CareCompassDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "dashboard-responsive";
    style.innerHTML = `
      @media (max-width: 600px) {
        .dash-nav-links { display: none !important; }
        .dash-hamburger { display: flex !important; }
        .dash-demo-bar { flex-wrap: wrap; }
      }
      @media (min-width: 601px) {
        .dash-hamburger { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { const el = document.getElementById("dashboard-responsive"); if (el) el.remove(); };
  }, []);
  // UI demo states — in production these come from Supabase + Clerk
  const [showOnboarding, setShowOnboarding] = useState(false);

  // ── Appointments state ────────────────────────────────────────────────────
  const [appointments, setAppointments] = useState([]);
  const [showApptForm, setShowApptForm] = useState(false);
  const [editingAppt, setEditingAppt]   = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(APPT_KEY);
      if (stored) setAppointments(JSON.parse(stored));
    } catch {}
  }, []);

  const saveAppointments = (updated) => {
    setAppointments(updated);
    try { localStorage.setItem(APPT_KEY, JSON.stringify(updated)); } catch {}
  };

  const handleSaveAppt = (form) => {
    if (editingAppt) {
      saveAppointments(appointments.map(a => a.id === editingAppt.id ? { ...form, id: editingAppt.id } : a));
    } else {
      saveAppointments([...appointments, { ...form, id: Date.now() }]);
    }
    setShowApptForm(false);
    setEditingAppt(null);
  };

  const handleEditAppt = (appt) => { setEditingAppt(appt); setShowApptForm(true); };
  const handleDeleteAppt = (id) => saveAppointments(appointments.filter(a => a.id !== id));

  // Sort: upcoming first, then past
  const upcomingAppts = appointments
    .filter(a => daysUntil(a.date) >= 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const pastAppts = appointments
    .filter(a => daysUntil(a.date) < 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const nextAppt = upcomingAppts[0] || null;
  const [demoState, setDemoState] = useState("returning"); // new | empty | returning

  // Mock user data — replace with Clerk user object
  // preferredName reads from localStorage (set in Account Settings)
  const storedDisplayName = (() => { try { return localStorage.getItem("cc-display-name"); } catch { return null; } })();
  const user = {
    name: storedDisplayName || "Tiffany",
    fullName: (() => { try { return localStorage.getItem("cc-full-name"); } catch { return null; } })() || "Tiffany",
    subscriptionTier: "pro",
    memberSince: "March 2026",
  };

  // Mock assessment data — replace with Supabase query
  const assessment = demoState === "new" || demoState === "empty" ? null : {
    date: "March 28, 2026",
    topPatterns: [
      "Joint instability, dizziness on standing, and heart palpitations may be connected",
      "Food sensitivities and bloating appear alongside neurological symptoms",
      "Sleep quality correlates with next-day severity",
    ],
    specialists: ["Rheumatologist", "Cardiologist (dysautonomia)", "Allergist/Immunologist"],
    insightCount: 5,
  };

  // Mock tracker data — replace with Supabase query
  const tracker = demoState === "new" ? null : demoState === "empty" ? { entries: 0, streak: 0, avgSeverityWeek: null, sparkData: [], lastEntry: null } : {
    entries: 47,
    streak: 12,
    avgSeverityWeek: 5.2,
    sparkData: [6, 5, 7, 4, 5, 6, 5],
    lastEntry: "Today, 2:14 PM",
    recentSymptoms: "Right shoulder pain, fatigue",
  };

  const hasAssessment = !!assessment;
  const hasTrackerData = tracker && tracker.entries > 0;
  const isNew = demoState === "new";

  return (
    <div style={s.root}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <a href="/" style={s.navLogo}>
            <BotanicalMark size={28}/>
            <span style={s.navLogoText}>Care Compass</span>
          </a>
          {/* Desktop links */}
          <div style={s.navLinks} className="dash-nav-links">
            <a href="/compass" style={s.navLink}>Assessment</a>
            <a href="/tracker" style={s.navLink}>Tracker</a>
            <a href="/pricing" style={s.navLink}>Pricing</a>
            <a href="/account" style={s.navAvatar}>{(user.fullName || user.name)[0]}</a>
          </div>
          {/* Hamburger — mobile only */}
          <button className="dash-hamburger" onClick={() => setMenuOpen(o => !o)} style={s.hamburgerBtn} aria-label="Toggle menu">
            {menuOpen
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SAGE_DARK} strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SAGE_DARK} strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={s.mobileMenu}>
            <a href="/compass" style={s.mobileMenuLink} onClick={() => setMenuOpen(false)}>Assessment</a>
            <a href="/tracker" style={s.mobileMenuLink} onClick={() => setMenuOpen(false)}>Tracker</a>
            <a href="/pricing" style={s.mobileMenuLink} onClick={() => setMenuOpen(false)}>Pricing</a>
            <div style={s.mobileMenuDivider}/>
            <a href="/account" style={s.mobileMenuLink} onClick={() => setMenuOpen(false)}>
              <span style={s.mobileMenuAvatar}>{user.name[0]}</span>
              Account settings
            </a>
          </div>
        )}
      </nav>

      <main style={s.main}>
        <div style={s.container}>

          {/* ── Demo state switcher (remove in production) ── */}
          <div style={s.demoBar} className="dash-demo-bar">
            <span style={s.demoLabel}>Preview state:</span>
            {["new", "empty", "returning"].map(state => (
              <button key={state} onClick={() => { setDemoState(state); if (state === "new") setShowOnboarding(true); }} style={{ ...s.demoBtn, background: demoState === state ? SAGE_DARK : "transparent", color: demoState === state ? "#fff" : WARM_GRAY }}>
                {state === "new" ? "New user" : state === "empty" ? "No tracker data" : "Returning user"}
              </button>
            ))}
          </div>

          {/* ── Header ── */}
          <div style={s.header}>
            <div>
              <p style={s.eyebrow}>Dashboard</p>
              <h1 style={s.title}>
                {isNew ? `Welcome, ${user.name} 🌿` : `Good ${getTimeOfDay()}, ${user.name}`}
              </h1>
              {isNew && <p style={s.subtitle}>Let's get you set up. It only takes a few minutes.</p>}
            </div>
            <button onClick={() => window.location.href = "/tracker"} style={s.logEntryBtn}>
              + Log Entry
            </button>
          </div>

          {/* ── New user empty state ── */}
          {isNew && (
            <div style={s.newUserGrid}>
              {ONBOARDING_STEPS.map((step, i) => (
                <div key={i} style={s.newUserCard}>
                  <div style={s.newUserCardNum}>{i + 1}</div>
                  <span style={s.newUserCardIcon}>{step.icon}</span>
                  <h3 style={s.newUserCardTitle}>{step.title}</h3>
                  <p style={s.newUserCardDesc}>{step.desc}</p>
                  <a href={step.href} style={s.newUserCardBtn}>{step.cta}</a>
                </div>
              ))}
            </div>
          )}

          {/* ── Stats row ── */}
          {!isNew && (
            <div style={s.statsRow}>
              {/* Streak */}
              <div style={s.statCard}>
                <div style={s.statCardInner}>
                  <div>
                    <p style={s.statLabel}>Tracking streak</p>
                    <p style={s.statValue}>{tracker?.streak ?? 0}<span style={s.statUnit}> days</span></p>
                    <p style={s.statSub}>{tracker?.streak >= 7 ? "🔥 Keep it up!" : tracker?.streak > 0 ? "Keep going!" : "Start tracking today"}</p>
                  </div>
                  <div style={s.streakBar}>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} style={{ ...s.streakDay, background: i < Math.min(tracker?.streak ?? 0, 7) ? SAGE_DARK : "#e0dbd5" }}/>
                    ))}
                  </div>
                </div>
              </div>

              {/* Avg severity */}
              <div style={s.statCard}>
                <div style={s.statCardInner}>
                  <div>
                    <p style={s.statLabel}>Avg severity this week</p>
                    <p style={{ ...s.statValue, color: tracker?.avgSeverityWeek ? severityColor(tracker.avgSeverityWeek) : "#ccc" }}>
                      {tracker?.avgSeverityWeek ?? "—"}<span style={s.statUnit}>{tracker?.avgSeverityWeek ? "/10" : ""}</span>
                    </p>
                    <p style={s.statSub}>{tracker?.avgSeverityWeek ? severityLabel(tracker.avgSeverityWeek) : "No entries yet this week"}</p>
                  </div>
                  {tracker?.sparkData?.length > 1 && (
                    <SparkLine data={tracker.sparkData} color={severityColor(tracker.avgSeverityWeek)}/>
                  )}
                </div>
              </div>

              {/* Last entry */}
              <div style={s.statCard}>
                <div style={s.statCardInner}>
                  <div>
                    <p style={s.statLabel}>Last entry</p>
                    <p style={s.statValue} >{tracker?.lastEntry ?? "—"}</p>
                    {tracker?.recentSymptoms && <p style={s.statSub}>{tracker.recentSymptoms}</p>}
                  </div>
                  <a href="/tracker" style={s.statAction}>View →</a>
                </div>
              </div>
            </div>
          )}

          {/* ── Main content grid ── */}
          {!isNew && (
            <div style={s.contentGrid}>

              {/* Assessment card */}
              <div style={s.sectionCard}>
                <div style={s.sectionCardHeader}>
                  <div>
                    <p style={s.sectionEyebrow}>Assessment</p>
                    <h2 style={s.sectionTitle}>Your pattern insights</h2>
                  </div>
                  <a href="/compass" style={s.sectionAction}>
                    {hasAssessment ? "Re-run →" : "Take now →"}
                  </a>
                </div>

                {hasAssessment ? (
                  <div style={s.assessmentContent}>
                    <p style={s.assessmentDate}>Last run: {assessment.date}</p>
                    <div style={s.patternList}>
                      {assessment.topPatterns.map((p, i) => (
                        <div key={i} style={s.patternItem}>
                          <BotanicalMark size={16}/>
                          <p style={s.patternText}>{p}</p>
                        </div>
                      ))}
                    </div>
                    <div style={s.specialistRow}>
                      <p style={s.specialistLabel}>Suggested specialists:</p>
                      <div style={s.specialistTags}>
                        {assessment.specialists.map(sp => (
                          <span key={sp} style={s.specialistTag}>{sp}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={s.emptyCard}>
                    <BotanicalMark size={40}/>
                    <p style={s.emptyTitle}>No assessment yet</p>
                    <p style={s.emptyDesc}>Take the full assessment to map your symptoms and get AI-powered pattern insights.</p>
                    <a href="/compass" style={s.emptyBtn}>Take the Assessment →</a>
                  </div>
                )}
              </div>

              {/* Tracker card */}
              <div style={s.sectionCard}>
                <div style={s.sectionCardHeader}>
                  <div>
                    <p style={s.sectionEyebrow}>Tracker</p>
                    <h2 style={s.sectionTitle}>Recent activity</h2>
                  </div>
                  <a href="/tracker" style={s.sectionAction}>Open →</a>
                </div>

                {hasTrackerData ? (
                  <div style={s.trackerContent}>
                    <div style={s.trackerStats}>
                      <div style={s.trackerStat}>
                        <span style={s.trackerStatVal}>{tracker.entries}</span>
                        <span style={s.trackerStatLabel}>Total entries</span>
                      </div>
                      <div style={s.trackerStat}>
                        <span style={s.trackerStatVal}>{tracker.streak}</span>
                        <span style={s.trackerStatLabel}>Day streak</span>
                      </div>
                    </div>
                    <div style={s.trackerActions}>
                      <a href="/tracker" style={s.trackerActionBtn}>View Trends</a>
                      <a href="/tracker" style={s.trackerActionBtnSecondary}>AI Insights</a>
                      <a href="/tracker" style={s.trackerActionBtnSecondary}>Doctor Report</a>
                    </div>
                  </div>
                ) : (
                  <div style={s.emptyCard}>
                    <BotanicalMark size={40}/>
                    <p style={s.emptyTitle}>No entries yet</p>
                    <p style={s.emptyDesc}>Start logging your symptoms to build your health picture over time.</p>
                    <a href="/tracker" style={s.emptyBtn}>Start Tracking →</a>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ── Appointments ── */}
          {!isNew && (
            <div style={s.sectionCard}>
              <div style={{ ...s.sectionCardHeader, marginBottom: "1rem" }}>
                <div>
                  <p style={s.sectionEyebrow}>Appointments</p>
                  <h2 style={s.sectionTitle}>Upcoming visits</h2>
                </div>
                <button
                  onClick={() => { setEditingAppt(null); setShowApptForm(true); }}
                  style={{ background: SAGE_DARK, color: "#fff", border: "none", borderRadius: "100px", padding: "0.55rem 1.25rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                >
                  + Add appointment
                </button>
              </div>

              {/* Inline form */}
              {showApptForm && (
                <div style={{ background: OFF_WHITE, borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1.25rem", marginBottom: "1.25rem" }}>
                  <p style={{ ...s.sectionEyebrow, marginBottom: "1rem" }}>{editingAppt ? "Edit appointment" : "New appointment"}</p>
                  <AppointmentForm
                    initial={editingAppt}
                    onSave={handleSaveAppt}
                    onCancel={() => { setShowApptForm(false); setEditingAppt(null); }}
                  />
                </div>
              )}

              {/* Next appointment highlight */}
              {nextAppt && !showApptForm && (
                <div style={{ background: `linear-gradient(135deg, ${SAGE_LIGHT}, ${TEAL_LIGHT})`, borderRadius: "1rem", padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: SAGE_DARK, margin: "0 0 0.25rem" }}>Next appointment</p>
                    <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: INK, margin: "0 0 0.15rem" }}>
                      {nextAppt.specialty}{nextAppt.doctor ? ` · ${nextAppt.doctor}` : ""}
                    </p>
                    <p style={{ fontSize: "0.8rem", color: TEAL, margin: 0, fontWeight: 500 }}>
                      {formatApptDate(nextAppt.date, nextAppt.time)}
                      {daysUntil(nextAppt.date) === 0 ? " · Today!" : daysUntil(nextAppt.date) === 1 ? " · Tomorrow" : ` · ${daysUntil(nextAppt.date)} days away`}
                    </p>
                  </div>
                  {nextAppt.prepReport && (
                    <a
                      href={`/tracker?insight=1&specialty=${encodeURIComponent(nextAppt.specialty)}${nextAppt.doctor ? `&doctor=${encodeURIComponent(nextAppt.doctor)}` : ""}${nextAppt.reason ? `&reason=${encodeURIComponent(nextAppt.reason)}` : ""}&date=${encodeURIComponent(nextAppt.date)}`}
                      style={{ background: TEAL, color: "#fff", borderRadius: "100px", padding: "0.55rem 1.1rem", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
                    >
                      Generate report →
                    </a>
                  )}
                </div>
              )}

              {/* Appointment list */}
              {appointments.length === 0 && !showApptForm ? (
                <div style={s.emptyCard}>
                  <span style={{ fontSize: "2rem" }}>🗓️</span>
                  <p style={s.emptyTitle}>No appointments yet</p>
                  <p style={s.emptyDesc}>Add upcoming doctor visits to get reminders and auto-prepare reports before you go.</p>
                  <button onClick={() => setShowApptForm(true)} style={{ ...s.emptyBtn, border: "none", cursor: "pointer", fontFamily: "inherit" }}>Add your first appointment →</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {upcomingAppts.length > 0 && (
                    <>
                      {upcomingAppts.map(a => (
                        <AppointmentCard key={a.id} appt={a} onEdit={handleEditAppt} onDelete={handleDeleteAppt}/>
                      ))}
                    </>
                  )}
                  {pastAppts.length > 0 && (
                    <details style={{ marginTop: "0.5rem" }}>
                      <summary style={{ fontSize: "0.78rem", color: WARM_GRAY, cursor: "pointer", fontWeight: 600, padding: "0.5rem 0", listStyle: "none", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span>▸</span> Past appointments ({pastAppts.length})
                      </summary>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                        {pastAppts.map(a => (
                          <AppointmentCard key={a.id} appt={a} onEdit={handleEditAppt} onDelete={handleDeleteAppt}/>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Quick actions ── */}
          {!isNew && (
            <div style={s.quickActions}>
              <p style={s.quickActionsLabel}>Quick actions</p>
              <div style={s.quickActionsGrid}>
                {[
                  { label: "Log a new entry", desc: "Record how you're feeling right now", href: "/tracker", color: SAGE_DARK },
                  { label: "Run the assessment", desc: "Map symptoms and get pattern insights", href: "/compass", color: TEAL },
                  { label: "Generate a report", desc: "Create a PDF to bring to your doctor", href: "/tracker", color: WARM_GRAY },
                  { label: "Add appointment", desc: "Schedule a visit and prep your report", href: null, color: "#7a6fa0" },
                  { label: "Account settings", desc: "Manage your profile and subscription", href: "/account", color: INK_LIGHT },
                ].map(({ label, desc, href, color }) => href ? (
                  <a key={label} href={href} style={{ ...s.quickActionCard, borderTop: `3px solid ${color}` }}>
                    <p style={{ ...s.quickActionLabel, color }}>{label}</p>
                    <p style={s.quickActionDesc}>{desc}</p>
                  </a>
                ) : (
                  <div key={label} onClick={() => { setShowApptForm(true); setEditingAppt(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ ...s.quickActionCard, borderTop: `3px solid ${color}`, cursor: "pointer" }}>
                    <p style={{ ...s.quickActionLabel, color }}>{label}</p>
                    <p style={s.quickActionDesc}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <footer style={s.footer}>
        <p style={s.footerText}>© {new Date().getFullYear()} Care Compass · <a href="mailto:hello@joincarecompass.com" style={s.footerLink}>hello@joincarecompass.com</a></p>
        <p style={s.footerDisclaimer}>Care Compass is not a medical service and does not provide medical advice, diagnosis, or treatment.</p>
      </footer>

      {showOnboarding && <OnboardingFlow userName={user.name} onComplete={() => setShowOnboarding(false)}/>}
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function severityLabel(n) {
  if (n <= 3) return "Manageable week";
  if (n <= 6) return "Moderate week";
  return "Difficult week";
}

const s = {
  root: { fontFamily: "'DM Sans', Helvetica, sans-serif", color: INK, background: OFF_WHITE, minHeight: "100vh", display: "flex", flexDirection: "column", overflowX: "hidden", width: "100%" },

  nav: { padding: "1rem 1.25rem", borderBottom: `1px solid rgba(0,0,0,0.07)`, background: "#fff", position: "sticky", top: 0, zIndex: 100, boxSizing: "border-box", width: "100%" },
  navInner: { maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" },
  navLogo: { display: "flex", alignItems: "center", gap: "0.55rem", textDecoration: "none" },
  navLogoText: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 600, color: SAGE_DARK, whiteSpace: "nowrap" },
  navLinks: { display: "flex", alignItems: "center", gap: "0.85rem", flexShrink: 0 },
  navLink: { fontSize: "0.8rem", color: WARM_GRAY, textDecoration: "none", whiteSpace: "nowrap" },
  navAvatar: { width: 34, height: 34, borderRadius: "50%", background: SAGE_DARK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem", textDecoration: "none", fontFamily: "'Playfair Display', Georgia, serif" },
  hamburgerBtn: { display: "none", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", padding: "0.35rem", borderRadius: "8px", flexShrink: 0 },
  mobileMenu: { borderTop: "1px solid rgba(0,0,0,0.07)", padding: "0.75rem 1.25rem 1rem", display: "flex", flexDirection: "column", gap: "0.15rem", background: "#fff" },
  mobileMenuLink: { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0.5rem", fontSize: "0.95rem", color: INK, textDecoration: "none", borderRadius: "0.5rem", fontWeight: 500 },
  mobileMenuDivider: { height: 1, background: "rgba(0,0,0,0.07)", margin: "0.35rem 0" },
  mobileMenuAvatar: { width: 28, height: 28, borderRadius: "50%", background: SAGE_DARK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", fontFamily: "'Playfair Display', Georgia, serif", flexShrink: 0 },

  main: { flex: 1, padding: "2rem 1.25rem", boxSizing: "border-box", width: "100%" },
  container: { maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" },

  demoBar: { display: "flex", alignItems: "center", gap: "0.5rem", background: CREAM, borderRadius: "0.75rem", padding: "0.6rem 1rem", flexWrap: "wrap" },
  demoLabel: { fontSize: "0.75rem", fontWeight: 600, color: WARM_GRAY, marginRight: "0.25rem" },
  demoBtn: { padding: "0.3rem 0.85rem", borderRadius: "100px", border: `1px solid rgba(0,0,0,0.1)`, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" },
  eyebrow: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.3rem" },
  title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: INK, margin: "0 0 0.4rem", letterSpacing: "-0.02em" },
  subtitle: { fontSize: "0.95rem", color: WARM_GRAY, margin: 0, lineHeight: 1.6 },
  logEntryBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.8rem 1.75rem", borderRadius: "100px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },

  newUserGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" },
  newUserCard: { background: "#fff", borderRadius: "1.25rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "2rem", display: "flex", flexDirection: "column", gap: "0.75rem", position: "relative" },
  newUserCardNum: { position: "absolute", top: "1.25rem", right: "1.25rem", width: 28, height: 28, borderRadius: "50%", background: SAGE_LIGHT, color: SAGE_DARK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700 },
  newUserCardIcon: { fontSize: "1.75rem" },
  newUserCardTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: INK, margin: 0 },
  newUserCardDesc: { fontSize: "0.875rem", color: WARM_GRAY, lineHeight: 1.7, margin: 0 },
  newUserCardBtn: { background: SAGE_DARK, color: "#fff", padding: "0.7rem 1.25rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", display: "inline-block", marginTop: "0.5rem", alignSelf: "flex-start" },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" },
  statCard: { background: "#fff", borderRadius: "1rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1.25rem 1.5rem" },
  statCardInner: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" },
  statLabel: { fontSize: "0.75rem", fontWeight: 600, color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.35rem" },
  statValue: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: SAGE_DARK, margin: "0 0 0.25rem", lineHeight: 1 },
  statUnit: { fontSize: "0.9rem", fontWeight: 400, color: WARM_GRAY },
  statSub: { fontSize: "0.78rem", color: WARM_GRAY, margin: 0 },
  statAction: { fontSize: "0.8rem", color: SAGE_DARK, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", marginTop: "0.25rem" },
  streakBar: { display: "flex", gap: "0.25rem", alignItems: "flex-end" },
  streakDay: { width: 8, height: 28, borderRadius: 4, transition: "background 0.3s" },

  contentGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" },
  sectionCard: { background: "#fff", borderRadius: "1.25rem", border: `1px solid rgba(0,0,0,0.07)`, padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
  sectionCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  sectionEyebrow: { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.3rem" },
  sectionTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: INK, margin: 0 },
  sectionAction: { fontSize: "0.82rem", color: SAGE_DARK, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", marginTop: "0.25rem" },

  assessmentContent: { display: "flex", flexDirection: "column", gap: "1rem" },
  assessmentDate: { fontSize: "0.75rem", color: "#aaa", margin: 0, fontStyle: "italic" },
  patternList: { display: "flex", flexDirection: "column", gap: "0.65rem" },
  patternItem: { display: "flex", alignItems: "flex-start", gap: "0.65rem" },
  patternText: { fontSize: "0.875rem", color: INK_LIGHT, lineHeight: 1.65, margin: 0 },
  specialistRow: { display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "0.75rem", borderTop: `1px solid ${SAGE_LIGHT}` },
  specialistLabel: { fontSize: "0.75rem", fontWeight: 600, color: WARM_GRAY, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" },
  specialistTags: { display: "flex", flexWrap: "wrap", gap: "0.4rem" },
  specialistTag: { background: TEAL_LIGHT, color: TEAL, fontSize: "0.78rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: "100px" },

  trackerContent: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  trackerStats: { display: "flex", gap: "1.5rem" },
  trackerStat: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  trackerStatVal: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: SAGE_DARK },
  trackerStatLabel: { fontSize: "0.72rem", color: WARM_GRAY, textTransform: "uppercase", letterSpacing: "0.05em" },
  trackerActions: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  trackerActionBtn: { background: SAGE_DARK, color: "#fff", padding: "0.55rem 1rem", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" },
  trackerActionBtnSecondary: { background: "transparent", color: SAGE_DARK, border: `1px solid ${SAGE}`, padding: "0.55rem 1rem", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" },

  emptyCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "2rem 1rem", textAlign: "center" },
  emptyTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: 0 },
  emptyDesc: { fontSize: "0.875rem", color: WARM_GRAY, lineHeight: 1.7, margin: 0, maxWidth: 300 },
  emptyBtn: { background: SAGE_DARK, color: "#fff", padding: "0.65rem 1.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", marginTop: "0.25rem" },

  quickActions: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  quickActionsLabel: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARM_GRAY, margin: 0 },
  quickActionsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" },
  quickActionCard: { background: "#fff", borderRadius: "0.875rem", padding: "1.1rem 1.25rem", textDecoration: "none", border: `1px solid rgba(0,0,0,0.06)`, display: "flex", flexDirection: "column", gap: "0.3rem", transition: "box-shadow 0.2s" },
  quickActionLabel: { fontSize: "0.875rem", fontWeight: 600, margin: 0 },
  quickActionDesc: { fontSize: "0.78rem", color: WARM_GRAY, margin: 0, lineHeight: 1.5 },

  footer: { padding: "1.5rem 2rem", borderTop: `1px solid rgba(0,0,0,0.07)`, textAlign: "center" },
  apptCard: { background: "#fff", borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.07)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" },
  footerText: { fontSize: "0.85rem", color: WARM_GRAY, margin: "0 0 0.25rem" },
  footerLink: { color: SAGE_DARK, textDecoration: "none" },
  footerDisclaimer: { fontSize: "0.75rem", color: "#aaa", margin: 0 },

  // Onboarding overlay
  onboardingOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" },
  onboardingCard: { background: "#fff", borderRadius: "1.5rem", padding: "2.5rem", maxWidth: 480, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1.1rem" },
  onboardingDots: { display: "flex", gap: "0.4rem", alignItems: "center" },
  onboardingDot: { height: 8, borderRadius: 100, transition: "all 0.3s ease" },
  onboardingIcon: { fontSize: "2.5rem" },
  onboardingWelcome: { fontSize: "0.9rem", fontWeight: 600, color: SAGE_DARK, background: SAGE_LIGHT, padding: "0.35rem 1rem", borderRadius: "100px", margin: 0 },
  onboardingTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: 0, lineHeight: 1.3 },
  onboardingDesc: { fontSize: "0.95rem", color: WARM_GRAY, lineHeight: 1.75, margin: 0 },
  onboardingActions: { display: "flex", flexDirection: "column", gap: "0.65rem", width: "100%" },
  onboardingCta: { background: SAGE_DARK, color: "#fff", padding: "0.95rem", borderRadius: "0.75rem", fontSize: "0.95rem", fontWeight: 600, textDecoration: "none", display: "block" },
  onboardingSkip: { background: "transparent", border: "none", color: WARM_GRAY, fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.2)" },
  onboardingStep: { fontSize: "0.72rem", color: "#bbb", margin: 0 },
};
