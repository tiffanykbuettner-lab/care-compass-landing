import { useState } from "react";

const SAGE       = "#7a9e87";
const SAGE_LIGHT = "#e8f0eb";
const SAGE_DARK  = "#4a7058";
const TEAL       = "#4a9fa5";
const WARM_GRAY  = "#6b6560";
const OFF_WHITE  = "#fafaf8";
const CREAM      = "#f4f1ec";
const INK        = "#2d2926";
const INK_LIGHT  = "#4a4540";

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
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
    <path d="M13.173 9.558c-.02-2.137 1.745-3.168 1.824-3.217-1-1.46-2.548-1.66-3.093-1.678-1.317-.134-2.574.777-3.242.777-.668 0-1.694-.758-2.787-.737-1.432.021-2.757.835-3.49 2.118C.584 9.17 1.7 13.525 3.43 15.904c.857 1.225 1.876 2.601 3.209 2.551 1.288-.05 1.77-.826 3.325-.826 1.555 0 1.992.826 3.352.8 1.39-.023 2.266-1.253 3.107-2.484.988-1.42 1.393-2.812 1.413-2.882-.031-.013-2.696-1.034-2.663-4.505z" fill={INK}/>
    <path d="M10.894 2.9c.697-.853 1.17-2.03 1.04-3.21-.999.042-2.24.672-2.962 1.506-.638.742-1.208 1.96-1.056 3.108 1.12.085 2.267-.565 2.978-1.404z" fill={INK}/>
  </svg>
);

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    {open ? <>
      <path d="M1 9s3-5.5 8-5.5S17 9 17 9s-3 5.5-8 5.5S1 9 1 9z" stroke={WARM_GRAY} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="9" r="2.5" stroke={WARM_GRAY} strokeWidth="1.5"/>
    </> : <>
      <path d="M1 1l16 16M7.5 7.6A2.5 2.5 0 0011.4 11M5.2 5.3C2.9 6.7 1 9 1 9s3 5.5 8 5.5c1.6 0 3-.5 4.2-1.2M9 3.5c5 0 8 5.5 8 5.5s-.8 1.4-2.2 2.7" stroke={WARM_GRAY} strokeWidth="1.5" strokeLinecap="round"/>
    </>}
  </svg>
);

export default function CareCompassLogin() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [step, setStep]         = useState("login"); // login | 2fa | forgot
  const [twoFaCode, setTwoFaCode] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent]   = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // Clerk integration point: SignIn.create({ identifier: email, password })
    setTimeout(() => { setLoading(false); setStep("2fa"); }, 800);
  };

  const handle2FA = (e) => {
    e.preventDefault();
    setLoading(true);
    // Clerk integration point: SignIn.attemptSecondFactor({ strategy: "totp", code: twoFaCode })
    setTimeout(() => { setLoading(false); window.location.href = "/dashboard"; }, 800);
  };

  const handleForgot = (e) => {
    e.preventDefault();
    setLoading(true);
    // Clerk integration point: SignIn.create({ strategy: "reset_password_email_code", identifier: forgotEmail })
    setTimeout(() => { setLoading(false); setForgotSent(true); }, 800);
  };

  return (
    <div style={s.root}>
      {/* Left panel — brand */}
      <div style={s.leftPanel}>
        <div style={s.leftInner}>
          <a href="/" style={s.logoWrap}>
            <BotanicalMark size={48}/>
            <span style={s.logoText}>Care Compass</span>
          </a>
          <div style={s.leftContent}>
            <h2 style={s.leftHeadline}>Your health story,<br/>all in one place.</h2>
            <p style={s.leftSub}>Track symptoms, uncover patterns, and walk into every appointment prepared.</p>
            <div style={s.leftFeatures}>
              {["AI-powered symptom pattern recognition", "Daily tracker with time-based insights", "Doctor-ready reports you can actually use", "Secure, private, and always yours"].map(f => (
                <div key={f} style={s.leftFeature}>
                  <div style={s.leftFeatureDot}/>
                  <span style={s.leftFeatureText}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <p style={s.leftFooter}>© {new Date().getFullYear()} Care Compass · <a href="/privacy" style={s.leftFooterLink}>Privacy Policy</a></p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div style={s.rightPanel}>
        <div style={s.formWrap}>

          {/* Mobile logo */}
          <a href="/" style={s.mobileLogo}>
            <BotanicalMark size={32}/>
            <span style={s.mobileLogoText}>Care Compass</span>
          </a>

          {/* ── Login form ── */}
          {step === "login" && (
            <>
              <h1 style={s.formTitle}>Welcome back</h1>
              <p style={s.formSub}>Sign in to your Care Compass account</p>

              {/* Social login */}
              <div style={s.socialBtns}>
                <button style={s.socialBtn}>
                  <GoogleIcon/> Continue with Google
                </button>
                <button style={s.socialBtn}>
                  <AppleIcon/> Continue with Apple
                </button>
              </div>

              <div style={s.divider}><span style={s.dividerText}>or sign in with email</span></div>

              <form onSubmit={handleLogin} style={s.form}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={s.input} required/>
                </div>
                <div style={s.fieldGroup}>
                  <div style={s.labelRow}>
                    <label style={s.label}>Password</label>
                    <button type="button" onClick={() => setStep("forgot")} style={s.forgotLink}>Forgot password?</button>
                  </div>
                  <div style={s.passwordWrap}>
                    <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" style={{ ...s.input, paddingRight: "3rem" }} required/>
                    <button type="button" onClick={() => setShowPw(v => !v)} style={s.eyeBtn}><EyeIcon open={showPw}/></button>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={s.submitBtn}>
                  {loading ? "Signing in…" : "Sign In →"}
                </button>
              </form>

              <p style={s.switchText}>
                Don't have an account?{" "}
                <a href="/signup" style={s.switchLink}>Create one →</a>
              </p>
            </>
          )}

          {/* ── 2FA form ── */}
          {step === "2fa" && (
            <>
              <div style={s.twoFaIcon}><BotanicalMark size={40}/></div>
              <h1 style={s.formTitle}>Two-step verification</h1>
              <p style={s.formSub}>Enter the 6-digit code from your authenticator app to continue.</p>
              <form onSubmit={handle2FA} style={s.form}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Verification code</label>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    value={twoFaCode} onChange={e => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000" style={{ ...s.input, letterSpacing: "0.35em", fontSize: "1.4rem", textAlign: "center" }}
                    required autoFocus
                  />
                </div>
                <button type="submit" disabled={loading || twoFaCode.length < 6} style={{ ...s.submitBtn, opacity: twoFaCode.length < 6 ? 0.6 : 1 }}>
                  {loading ? "Verifying…" : "Verify & Sign In →"}
                </button>
              </form>
              <p style={s.twoFaHelp}>
                Lost access to your authenticator?{" "}
                <a href="/recover" style={s.switchLink}>Use a recovery code</a>
              </p>
              <button onClick={() => setStep("login")} style={s.backBtn}>← Back to login</button>
            </>
          )}

          {/* ── Forgot password ── */}
          {step === "forgot" && (
            <>
              <h1 style={s.formTitle}>Reset your password</h1>
              <p style={s.formSub}>Enter your email and we'll send you a secure reset link.</p>
              {forgotSent ? (
                <div style={s.successBox}>
                  <span style={s.successIcon}>🌿</span>
                  <p style={s.successTitle}>Check your inbox</p>
                  <p style={s.successDesc}>We've sent a password reset link to <strong>{forgotEmail}</strong>. It expires in 1 hour.</p>
                  <p style={s.successNote}>Didn't get it? Check your spam folder or <button onClick={() => setForgotSent(false)} style={s.resendBtn}>try again</button>.</p>
                </div>
              ) : (
                <form onSubmit={handleForgot} style={s.form}>
                  <div style={s.fieldGroup}>
                    <label style={s.label}>Email address</label>
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="you@example.com" style={s.input} required autoFocus/>
                  </div>
                  <button type="submit" disabled={loading} style={s.submitBtn}>
                    {loading ? "Sending…" : "Send Reset Link →"}
                  </button>
                </form>
              )}
              <button onClick={() => { setStep("login"); setForgotSent(false); }} style={s.backBtn}>← Back to login</button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

const s = {
  root: { display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', Helvetica, sans-serif", color: INK },

  // Left brand panel
  leftPanel: { width: "42%", background: SAGE_DARK, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" },
  leftInner: { padding: "3rem", display: "flex", flexDirection: "column", flex: 1, position: "relative", zIndex: 1 },
  logoWrap: { display: "flex", alignItems: "center", gap: "0.65rem", textDecoration: "none", marginBottom: "auto" },
  logoText: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.15rem", fontWeight: 600, color: "#fff" },
  leftContent: { display: "flex", flexDirection: "column", gap: "1.5rem", margin: "auto 0", paddingBottom: "3rem" },
  leftHeadline: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", fontWeight: 700, color: "#fff", lineHeight: 1.25, margin: 0 },
  leftSub: { fontSize: "1rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.75, margin: 0 },
  leftFeatures: { display: "flex", flexDirection: "column", gap: "0.875rem" },
  leftFeature: { display: "flex", alignItems: "flex-start", gap: "0.75rem" },
  leftFeatureDot: { width: 6, height: 6, borderRadius: "50%", background: TEAL, flexShrink: 0, marginTop: "0.45rem" },
  leftFeatureText: { fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 },
  leftFooter: { fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "auto", paddingTop: "1rem" },
  leftFooterLink: { color: "rgba(255,255,255,0.5)", textDecoration: "none" },

  // Right form panel
  rightPanel: { flex: 1, background: OFF_WHITE, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem" },
  formWrap: { width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: "1.5rem" },

  // Mobile logo (hidden on desktop via width logic — shown when left panel not visible)
  mobileLogo: { display: "none", alignItems: "center", gap: "0.55rem", textDecoration: "none", marginBottom: "0.5rem" },
  mobileLogoText: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 600, color: SAGE_DARK },

  formTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.85rem", fontWeight: 700, color: INK, margin: 0, letterSpacing: "-0.02em" },
  formSub: { fontSize: "0.95rem", color: WARM_GRAY, lineHeight: 1.6, margin: "-0.75rem 0 0" },

  socialBtns: { display: "flex", flexDirection: "column", gap: "0.65rem" },
  socialBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: "0.65rem", padding: "0.8rem 1.25rem", borderRadius: "0.75rem", border: "1.5px solid rgba(0,0,0,0.12)", background: "#fff", fontSize: "0.9rem", fontWeight: 500, color: INK, cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.2s, background 0.2s" },

  divider: { position: "relative", textAlign: "center" },
  dividerText: { background: OFF_WHITE, padding: "0 0.75rem", fontSize: "0.78rem", color: "#bbb", position: "relative", zIndex: 1 },

  form: { display: "flex", flexDirection: "column", gap: "1.1rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: "0.85rem", fontWeight: 600, color: INK_LIGHT },
  input: { padding: "0.85rem 1rem", borderRadius: "0.75rem", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "0.97rem", color: INK, background: "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box", width: "100%", transition: "border-color 0.2s" },
  passwordWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: "0.9rem", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center" },
  forgotLink: { fontSize: "0.8rem", color: SAGE_DARK, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, padding: 0 },
  submitBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.95rem", borderRadius: "0.75rem", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background 0.2s" },

  switchText: { fontSize: "0.875rem", color: WARM_GRAY, textAlign: "center", margin: 0 },
  switchLink: { color: SAGE_DARK, fontWeight: 600, textDecoration: "none" },

  twoFaIcon: { display: "flex", justifyContent: "center", marginBottom: "-0.5rem" },
  twoFaHelp: { fontSize: "0.85rem", color: WARM_GRAY, textAlign: "center", margin: 0 },
  backBtn: { background: "transparent", border: "none", color: WARM_GRAY, fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit", textAlign: "center", padding: "0.25rem" },

  successBox: { background: SAGE_LIGHT, borderRadius: "1rem", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", textAlign: "center" },
  successIcon: { fontSize: "1.75rem" },
  successTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: SAGE_DARK, margin: 0 },
  successDesc: { fontSize: "0.9rem", color: INK_LIGHT, lineHeight: 1.7, margin: 0 },
  successNote: { fontSize: "0.8rem", color: WARM_GRAY, margin: 0 },
  resendBtn: { background: "transparent", border: "none", color: SAGE_DARK, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", padding: 0, textDecoration: "underline" },
};
