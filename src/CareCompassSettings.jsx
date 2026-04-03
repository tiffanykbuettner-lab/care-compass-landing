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
    <circle cx="36" cy="36" r="7" fill="#4a7058"/>
    <circle cx="36" cy="36" r="3" fill="#e8f0eb"/>
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
  fontFamily: "sans-serif", width: "100%",
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
];

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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="First name">
              <StyledInput type="text" value={form.firstName} onChange={set("firstName")} />
            </Field>
            <Field label="Last name">
              <StyledInput type="text" value={form.lastName} onChange={set("lastName")} />
            </Field>
          </div>

          {/* Email */}
          <Field label="Email address">
            <div style={{ position: "relative" }}>
              <StyledInput type="email" value={form.email} onChange={set("email")} style={{ paddingRight: 88 }} />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontFamily: "sans-serif", fontWeight: 500, background: "#eafaf1", color: "#1e7e45" }}>
                ✓ Verified
              </span>
            </div>
          </Field>

          {/* DOB + sex */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Date of birth" optional hint="Used to personalize health insights">
              <StyledInput type="date" value={form.dob} onChange={set("dob")} />
            </Field>
            <Field label="Biological sex" optional hint="Affects some medical reference ranges">
              <StyledSelect value={form.sex} onChange={set("sex")}>
                <option>Female</option>
                <option>Male</option>
                <option>Prefer not to say</option>
              </StyledSelect>
            </Field>
          </div>

          {/* Pronouns */}
          <Field label="Pronouns" optional>
            <StyledSelect value={form.pronouns} onChange={set("pronouns")}>
              <option>She / Her</option>
              <option>He / Him</option>
              <option>They / Them</option>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Primary condition">
              <StyledSelect value={form.condition} onChange={set("condition")}>
                <option>POTS / Dysautonomia</option>
                <option>Long COVID</option>
                <option>ME/CFS</option>
                <option>Fibromyalgia</option>
                <option>EDS / HSD</option>
                <option>MCAS</option>
                <option>Other / Undiagnosed</option>
              </StyledSelect>
            </Field>
            <Field label="Diagnosis status">
              <StyledSelect value={form.diagnosisStatus} onChange={set("diagnosisStatus")}>
                <option>Formally diagnosed</option>
                <option>Suspected / investigating</option>
                <option>Self-identified</option>
              </StyledSelect>
            </Field>
          </div>

          <Field label="Care team" hint="Shows in generated reports to help your doctors coordinate">
            <StyledInput
              type="text"
              value={form.careTeam}
              onChange={set("careTeam")}
              placeholder="e.g. Dr. Patel – Cardiologist, Houston Methodist"
            />
          </Field>

        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Panel: Notifications ───────────────────────────────────────────────── */
function NotificationsPanel({ prefs, setPrefs, markDirty }) {
  const toggle = (key) => { setPrefs(p => ({ ...p, [key]: !p[key] })); markDirty(); };

  return (
    <SectionCard>
      <SectionHeader
        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a5 5 0 00-5 5v3l-1.5 2h13L13 10V7a5 5 0 00-5-5z" stroke={SAGE_DARK} strokeWidth="1.5" strokeLinejoin="round"/><path d="M6.5 13a1.5 1.5 0 003 0" stroke={SAGE_DARK} strokeWidth="1.5"/></svg>}
        title="Reminders & alerts"
        desc="How and when Care Compass reaches you"
      />
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column" }}>
        {[
          { key: "dailyReminder",  label: "Daily tracking reminder",   sub: "Nudge to log your symptoms each day" },
          { key: "weeklyDigest",   label: "Weekly insights digest",    sub: "Summary of patterns from your past 7 days" },
          { key: "medReminders",   label: "Medication reminders",      sub: "Alerts for medications you've logged" },
          { key: "appointmentPrep",label: "Appointment prep",          sub: "Prompt to generate a report before scheduled appointments" },
          { key: "productUpdates", label: "Product updates & tips",    sub: "New features and how-to guides from Care Compass" },
        ].map(({ key, label, sub }, i, arr) => (
          <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}>
            <div>
              <div style={{ fontSize: 14, color: INK, fontFamily: "sans-serif" }}>{label}</div>
              <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 2, fontFamily: "sans-serif" }}>{sub}</div>
            </div>
            <Toggle checked={prefs[key]} onChange={() => toggle(key)} />
          </div>
        ))}

        <div style={{ marginTop: 18 }}>
          <Field label="Reminder time" hint="All reminders will be sent around this time (your local time)">
            <StyledInput type="time" value={prefs.reminderTime} onChange={e => { setPrefs(p => ({ ...p, reminderTime: e.target.value })); markDirty(); }} style={{ maxWidth: 160 }} />
          </Field>
        </div>
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
    { label: "Active sessions",            sub: "2 devices currently signed in",             status: null,  action: "View sessions" },
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
function PrivacyPanel({ prefs, setPrefs, markDirty }) {
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
          {[
            { key: "improveData",    label: "Improve Care Compass with my data",  sub: "Anonymized patterns help train better insights for everyone" },
            { key: "crashAnalytics", label: "Crash & usage analytics",            sub: "Help us identify bugs and performance issues" },
          ].map(({ key, label, sub }, i, arr) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div>
                <div style={{ fontSize: 14, color: INK, fontFamily: "sans-serif" }}>{label}</div>
                <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 2, fontFamily: "sans-serif" }}>{sub}</div>
              </div>
              <Toggle checked={prefs[key]} onChange={() => toggle(key)} />
            </div>
          ))}
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
          {[
            { label: "Export all data",             sub: "Download a full copy of your tracker, assessments, and reports as JSON", action: "Export" },
            { label: "Migrate from localStorage",   sub: "Move locally-stored data to your secure cloud account",                  action: "Migrate →", href: "/migrate" },
          ].map(({ label, sub, action, href }, i, arr) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div>
                <div style={{ fontSize: 14, color: INK, fontFamily: "sans-serif" }}>{label}</div>
                <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 2, fontFamily: "sans-serif" }}>{sub}</div>
              </div>
              <OutlineBtn hoverColor={TEAL} hoverBorder={TEAL} onClick={href ? () => window.location.href = href : undefined}>
                {action}
              </OutlineBtn>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Danger zone */}
      <SectionCard danger>
        <SectionHeader
          danger
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 6v4M8 12h.01" stroke={DANGER} strokeWidth="1.5" strokeLinecap="round"/><path d="M7.1 2.5L1.5 12.5a1 1 0 00.9 1.5h11.2a1 1 0 00.9-1.5L8.9 2.5a1 1 0 00-1.8 0z" stroke={DANGER} strokeWidth="1.5" strokeLinejoin="round"/></svg>}
          title="Danger zone"
          desc="Irreversible actions — proceed carefully"
        />
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column" }}>
          {[
            { label: "Delete all tracking data", sub: "Permanently removes all symptom logs, notes, and photos" },
            { label: "Close account",            sub: "Deletes your account and all associated data permanently" },
          ].map(({ label, sub }, i, arr) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid rgba(192,57,43,0.08)` : "none" }}>
              <div>
                <div style={{ fontSize: 14, color: INK, fontFamily: "sans-serif" }}>{label}</div>
                <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 2, fontFamily: "sans-serif" }}>{sub}</div>
              </div>
              <DangerBtn>{label === "Close account" ? "Close account" : "Delete data"}</DangerBtn>
            </div>
          ))}
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
  "AI pattern insights",
  "Trends & frequency reports",
  "Photo logging",
  "Doctor-ready PDF reports",
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
                ${billing === "annual" ? 79 : 9}
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
                {billing === "annual" ? "Annual — you're saving $29 vs monthly" : "Monthly — switch to annual and save $29/yr"}
              </div>
            </div>
            <div style={{ display: "flex", background: "white", borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
              {[["monthly", "Monthly · $9"], ["annual", "Annual · $79"]].map(([opt, label]) => (
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
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
        <div style={{ padding: "0 24px 20px" }}>
          {[
            { date: "May 3, 2025",  amount: "$79.00", desc: "Annual subscription" },
            { date: "Apr 3, 2025",  amount: "$9.00",  desc: "Monthly subscription" },
            { date: "Mar 3, 2025",  amount: "$9.00",  desc: "Monthly subscription" },
          ].map(({ date, amount, desc }, i, arr) => (
            <div key={date} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 13.5, color: INK, fontFamily: "sans-serif" }}>{desc}</div>
                <div style={{ fontSize: 12, color: WARM_GRAY, marginTop: 2, fontFamily: "sans-serif" }}>{date}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: INK, fontFamily: "sans-serif" }}>{amount}</span>
                <span style={{ fontSize: 11, background: "#eafaf1", color: "#1e7e45", borderRadius: 20, padding: "2px 8px", fontFamily: "sans-serif", fontWeight: 500 }}>Paid</span>
                <OutlineBtn hoverColor={TEAL} hoverBorder={TEAL}>Receipt</OutlineBtn>
              </div>
            </div>
          ))}
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
                You have full access until <strong style={{ color: INK }}>{nextDate}</strong>. We've emailed you a confirmation. We're sorry to see you go 🌿
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

/* ─── Main component ─────────────────────────────────────────────────────── */
const SAVEABLE_PANELS = new Set(["profile", "notifications", "privacy"]);

export default function CareCompassSettings() {
  const [activePanel, setActivePanel] = useState("profile");
  const [dirty, setDirty] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: "Maya", lastName: "Rodriguez", email: "maya@example.com",
    dob: "1988-04-14", sex: "Female", pronouns: "She / Her",
    timezone: "America/Chicago (CDT, UTC−5)",
    condition: "POTS / Dysautonomia", diagnosisStatus: "Formally diagnosed", careTeam: "",
  });

  // Notification prefs state
  const [notifPrefs, setNotifPrefs] = useState({
    dailyReminder: true, weeklyDigest: true, medReminders: false,
    appointmentPrep: true, productUpdates: false, reminderTime: "20:00",
  });

  // Privacy prefs state
  const [privacyPrefs, setPrivacyPrefs] = useState({
    improveData: false, crashAnalytics: true,
  });

  const markDirty = () => setDirty(true);

  const handleSave = () => {
    setDirty(false);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
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
            <span style={{ opacity: 0.75, flexShrink: 0, display: "flex" }}>{icon}</span>
            {label}
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
              style={{
                background: dirty ? SAGE_DARK : "#bbb", color: "white", border: "none",
                borderRadius: 8, padding: "9px 20px", fontSize: 13.5, cursor: dirty ? "pointer" : "default",
                fontWeight: 500, transition: "background 0.15s", letterSpacing: "0.01em",
              }}
            >
              Save changes
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "32px 36px", maxWidth: 740 }}>
          {activePanel === "profile"       && <ProfilePanel       form={profileForm}   setForm={setProfileForm}   markDirty={markDirty} />}
          {activePanel === "notifications" && <NotificationsPanel prefs={notifPrefs}   setPrefs={setNotifPrefs}   markDirty={markDirty} />}
          {activePanel === "security"      && <SecurityPanel />}
          {activePanel === "privacy"       && <PrivacyPanel       prefs={privacyPrefs} setPrefs={setPrivacyPrefs} markDirty={markDirty} />}
          {activePanel === "connected"     && <ConnectedAppsPanel />}
          {activePanel === "subscription"  && <SubscriptionPanel />}
        </div>
      </div>

      <Toast visible={toastVisible} />
    </div>
  );
}
