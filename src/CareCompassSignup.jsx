import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

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

const StrengthBar = ({ password }) => {
  const score = !password ? 0
    : [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const colors = ["#e0dbd5", "#c0392b", "#e8a838", "#7a9e87", "#4a7058"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <div style={{ display: "flex", gap: "0.3rem" }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? colors[score] : "#e0dbd5", transition: "background 0.3s" }}/>
        ))}
      </div>
      {score > 0 && <p style={{ fontSize: "0.72rem", color: colors[score], margin: 0, fontWeight: 600 }}>{labels[score]}</p>}
    </div>
  );
};

export default function CareCompassSignup() {
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "auth-responsive";
    style.innerHTML = `
      @media (max-width: 640px) {
        .auth-left-panel { display: none !important; }
        .auth-mobile-logo { display: flex !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { const el = document.getElementById("auth-responsive"); if (el) el.remove(); };
  }, []);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]         = useState("signup"); // signup | verify | 2fa-setup | 2fa-verify
  const [form, setForm]         = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw]     = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [twoFaCode, setTwoFaCode]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const handleSignup = (e) => {
    e.preventDefault();
    setLoading(true);
    // Clerk integration point:
    // 1. Run soft duplicate check against existing users
    // 2. SignUp.create({ firstName, emailAddress, password })
    // 3. SignUp.prepareEmailAddressVerification({ strategy: "email_code" })
    setTimeout(() => { setLoading(false); setStep("verify"); }, 800);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setLoading(true);
    // Clerk integration point: SignUp.attemptEmailAddressVerification({ code: verifyCode })
    setTimeout(() => { setLoading(false); setStep("2fa-setup"); }, 800);
  };

  const handle2FASetup = () => {
    setLoading(true);
    // Clerk integration point: user.createTOTP()
    setTimeout(() => { setLoading(false); setStep("2fa-verify"); }, 800);
  };

  const handle2FAVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Clerk integration point: user.verifyTOTP({ code: twoFaCode })
      await signUp({ email: form.email, password: form.password, firstName: form.name });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const progressSteps = ["Account", "Verify email", "Secure account"];
  const progressIndex = step === "signup" ? 0 : step === "verify" ? 1 : 2;

  return (
    <div style={s.root}>
      {/* Left panel */}
      <div style={s.leftPanel} className="auth-left-panel">
        <div style={s.leftInner}>
          <a href="/" style={s.logoWrap}>
            <BotanicalMark size={48}/>
            <span style={s.logoText}>Care Compass</span>
          </a>
          <div style={s.leftContent}>
            <h2 style={s.leftHeadline}>Take back control<br/>of your health story.</h2>
            <p style={s.leftSub}>Join thousands of people navigating chronic illness with more clarity, confidence, and data.</p>
            <div style={s.trustList}>
              {[
  		"Your data is encrypted and never sold",
  		"Built by someone with lived experience",
  		"Doctor-ready reports at your fingertips",
  		"Cancel anytime, no questions asked",
	      ].map(text => (
  		<div key={text} style={s.trustItem}>
    		  <BotanicalMark size={20}/>
    		  <span style={s.trustText}>{text}</span>
  		</div>
	      ))}
            </div>
          </div>
          <p style={s.leftFooter}>© {new Date().getFullYear()} Care Compass · <a href="/privacy" style={s.leftFooterLink}>Privacy Policy</a></p>
        </div>
      </div>

      {/* Right panel */}
      <div style={s.rightPanel}>
        <div style={s.formWrap}>

          {/* Mobile logo */}
          <a href="/" style={s.mobileLogo} className="auth-mobile-logo">
            <BotanicalMark size={32}/>
            <span style={s.mobileLogoText}>Care Compass</span>
          </a>

          {/* Progress indicator */}
          <div style={s.progress}>
            {progressSteps.map((label, i) => (
              <div key={label} style={s.progressItem}>
                <div style={{ ...s.progressDot, background: i <= progressIndex ? SAGE_DARK : "#e0dbd5", border: i === progressIndex ? `2px solid ${SAGE_DARK}` : "2px solid transparent" }}>
                  {i < progressIndex && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ ...s.progressLabel, color: i <= progressIndex ? SAGE_DARK : "#bbb", fontWeight: i === progressIndex ? 600 : 400 }}>{label}</span>
                {i < progressSteps.length - 1 && <div style={{ ...s.progressLine, background: i < progressIndex ? SAGE_DARK : "#e0dbd5" }}/>}
              </div>
            ))}
          </div>

          {/* ── Step 1: Create account ── */}
          {step === "signup" && (
            <>
              <h1 style={s.formTitle}>Create your account</h1>
              <p style={s.formSub}>Start your Care Compass subscription</p>

              <div style={s.socialBtns}>
                <button style={s.socialBtn}><GoogleIcon/> Continue with Google</button>
                <button style={s.socialBtn}><AppleIcon/> Continue with Apple</button>
              </div>

              <div style={s.divider}><span style={s.dividerText}>or create with email</span></div>

              {duplicateWarning && (
                <div style={s.warningBox}>
                  <p style={s.warningText}>⚠️ We found an existing account with this email. <a href="/login" style={s.warningLink}>Sign in instead →</a></p>
                </div>
              )}

              <form onSubmit={handleSignup} style={s.form}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Your name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="First name" style={s.input} required/>
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Email address</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" style={s.input} required/>
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Password</label>
                  <div style={s.passwordWrap}>
                    <input type={showPw ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="At least 8 characters" style={{ ...s.input, paddingRight: "3rem" }} required minLength={8}/>
                    <button type="button" onClick={() => setShowPw(v => !v)} style={s.eyeBtn}><EyeIcon open={showPw}/></button>
                  </div>
                  <StrengthBar password={form.password}/>
                </div>
                <button type="submit" disabled={loading} style={s.submitBtn}>
                  {loading ? "Creating account…" : "Create Account →"}
                </button>
              </form>

              <p style={s.termsText}>
                By creating an account you agree to our{" "}
                <a href="/privacy" style={s.termsLink}>Privacy Policy</a>
                {" "}and{" "}
                <a href="/terms" style={s.termsLink}>Terms of Service</a>.
                Care Compass is for users 18 and over.
              </p>

              <p style={s.switchText}>
                Already have an account?{" "}
                <a href="/login" style={s.switchLink}>Sign in →</a>
              </p>
            </>
          )}

          {/* ── Step 2: Verify email ── */}
          {step === "verify" && (
            <>
              <div style={s.verifyIcon}>📬</div>
              <h1 style={s.formTitle}>Check your email</h1>
              <p style={s.formSub}>We sent a 6-digit verification code to <strong>{form.email}</strong></p>
              <form onSubmit={handleVerify} style={s.form}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Verification code</label>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    style={{ ...s.input, letterSpacing: "0.35em", fontSize: "1.4rem", textAlign: "center" }}
                    required autoFocus
                  />
                </div>
                <button type="submit" disabled={loading || verifyCode.length < 6} style={{ ...s.submitBtn, opacity: verifyCode.length < 6 ? 0.6 : 1 }}>
                  {loading ? "Verifying…" : "Verify Email →"}
                </button>
              </form>
              <p style={s.resendText}>
                Didn't get it?{" "}
                <button onClick={() => {}} style={s.resendBtn}>Resend code</button>
                {" "}· Check your spam folder
              </p>
            </>
          )}

          {/* ── Step 3a: 2FA setup ── */}
          {step === "2fa-setup" && (
            <>
              <div style={s.twoFaSetupIcon}><BotanicalMark size={48}/></div>
              <h1 style={s.formTitle}>Secure your account</h1>
              <p style={s.formSub}>Two-factor authentication keeps your health data safe. We'll walk you through setting it up — it takes less than 2 minutes.</p>
              <div style={s.twoFaOptions}>
                <div style={s.twoFaOption}>
                  <div style={s.twoFaOptionIcon}>📱</div>
                  <div>
                    <p style={s.twoFaOptionTitle}>Authenticator app <span style={s.recommendedBadge}>Recommended</span></p>
                    <p style={s.twoFaOptionDesc}>Use Google Authenticator, Authy, or any TOTP app. Scan a QR code to connect.</p>
                  </div>
                </div>
              </div>
              <button onClick={handle2FASetup} disabled={loading} style={s.submitBtn}>
                {loading ? "Setting up…" : "Set Up Authenticator →"}
              </button>
              <button onClick={async () => { await signUp({ email: form.email, password: form.password, firstName: form.name }); navigate("/dashboard", { replace: true }); }} style={s.skipBtn}>
                Skip for now — I'll set this up later
              </button>
              <p style={s.twoFaNote}>We strongly recommend enabling 2FA. Your account contains sensitive health information.</p>
            </>
          )}

          {/* ── Step 3b: 2FA verify ── */}
          {step === "2fa-verify" && (
            <>
              <h1 style={s.formTitle}>Scan & verify</h1>
              <p style={s.formSub}>Open your authenticator app and scan the QR code below, then enter the 6-digit code to confirm.</p>
              {/* QR code placeholder — Clerk generates this */}
              <div style={s.qrPlaceholder}>
                <div style={s.qrInner}>
                  <BotanicalMark size={40}/>
                  <p style={s.qrNote}>QR code appears here</p>
                  <p style={s.qrSubNote}>(Generated by Clerk at integration)</p>
                </div>
              </div>
              <form onSubmit={handle2FAVerify} style={s.form}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Enter the 6-digit code from your app</label>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    value={twoFaCode} onChange={e => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    style={{ ...s.input, letterSpacing: "0.35em", fontSize: "1.4rem", textAlign: "center" }}
                    required autoFocus
                  />
                </div>
                <button type="submit" disabled={loading || twoFaCode.length < 6} style={{ ...s.submitBtn, opacity: twoFaCode.length < 6 ? 0.6 : 1 }}>
                  {loading ? "Confirming…" : "Confirm & Continue →"}
                </button>
              </form>
              <div style={s.recoveryNote}>
                <p style={s.recoveryNoteText}>💡 Save your recovery codes — you'll need them if you lose access to your authenticator app. Clerk will show these after verification.</p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

const s = {
  root: { display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', Helvetica, sans-serif", color: INK, overflowX: "hidden", width: "100%" },

  leftPanel: { width: "42%", background: SAGE_DARK, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" },
  leftInner: { padding: "3rem", display: "flex", flexDirection: "column", flex: 1, position: "relative", zIndex: 1 },
  logoWrap: { display: "flex", alignItems: "center", gap: "0.65rem", textDecoration: "none", marginBottom: "auto" },
  logoText: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.15rem", fontWeight: 600, color: "#fff" },
  leftContent: { display: "flex", flexDirection: "column", gap: "1.5rem", margin: "auto 0", paddingBottom: "3rem" },
  leftHeadline: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", fontWeight: 700, color: "#fff", lineHeight: 1.25, margin: 0 },
  leftSub: { fontSize: "1rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.75, margin: 0 },
  trustList: { display: "flex", flexDirection: "column", gap: "0.875rem" },
  trustItem: { display: "flex", alignItems: "flex-start", gap: "0.75rem" },
  trustText: { fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 },
  leftFooter: { fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "auto", paddingTop: "1rem" },
  leftFooterLink: { color: "rgba(255,255,255,0.5)", textDecoration: "none" },

  rightPanel: { flex: 1, background: OFF_WHITE, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem", minWidth: 0 },
  formWrap: { width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: "1.5rem" },

  mobileLogo: { display: "flex", alignItems: "center", gap: "0.55rem", textDecoration: "none" },
  mobileLogoText: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 600, color: SAGE_DARK },

  progress: { display: "flex", alignItems: "center", gap: 0 },
  progressItem: { display: "flex", alignItems: "center", flex: 1 },
  progressDot: { width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s" },
  progressLabel: { fontSize: "0.72rem", marginLeft: "0.4rem", whiteSpace: "nowrap", transition: "color 0.3s" },
  progressLine: { flex: 1, height: 2, margin: "0 0.5rem", borderRadius: 1, transition: "background 0.3s" },

  formTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.85rem", fontWeight: 700, color: INK, margin: 0, letterSpacing: "-0.02em" },
  formSub: { fontSize: "0.95rem", color: WARM_GRAY, lineHeight: 1.6, margin: "-0.75rem 0 0" },

  socialBtns: { display: "flex", flexDirection: "column", gap: "0.65rem" },
  socialBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: "0.65rem", padding: "0.8rem 1.25rem", borderRadius: "0.75rem", border: "1.5px solid rgba(0,0,0,0.12)", background: "#fff", fontSize: "0.9rem", fontWeight: 500, color: INK, cursor: "pointer", fontFamily: "inherit" },

  divider: { position: "relative", textAlign: "center" },
  dividerText: { background: OFF_WHITE, padding: "0 0.75rem", fontSize: "0.78rem", color: "#bbb", position: "relative", zIndex: 1 },

  warningBox: { background: "#fff8e8", border: "1px solid #f0d080", borderRadius: "0.75rem", padding: "0.875rem 1.1rem" },
  warningText: { fontSize: "0.85rem", color: "#8a6000", margin: 0, lineHeight: 1.6 },
  warningLink: { color: SAGE_DARK, fontWeight: 600 },

  form: { display: "flex", flexDirection: "column", gap: "1.1rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: { fontSize: "0.85rem", fontWeight: 600, color: INK_LIGHT },
  input: { padding: "0.85rem 1rem", borderRadius: "0.75rem", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "0.97rem", color: INK, background: "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box", width: "100%", transition: "border-color 0.2s" },
  passwordWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: "0.9rem", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center" },
  submitBtn: { background: SAGE_DARK, color: "#fff", border: "none", padding: "0.95rem", borderRadius: "0.75rem", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background 0.2s, opacity 0.2s" },
  skipBtn: { background: "transparent", border: "none", color: WARM_GRAY, fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit", textAlign: "center", textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.2)" },

  termsText: { fontSize: "0.78rem", color: "#aaa", textAlign: "center", lineHeight: 1.6, margin: 0 },
  termsLink: { color: SAGE_DARK, textDecoration: "none", fontWeight: 500 },
  switchText: { fontSize: "0.875rem", color: WARM_GRAY, textAlign: "center", margin: 0 },
  switchLink: { color: SAGE_DARK, fontWeight: 600, textDecoration: "none" },

  verifyIcon: { fontSize: "2.5rem", textAlign: "center" },
  resendText: { fontSize: "0.82rem", color: WARM_GRAY, textAlign: "center", margin: 0 },
  resendBtn: { background: "transparent", border: "none", color: SAGE_DARK, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", padding: 0 },

  twoFaSetupIcon: { display: "flex", justifyContent: "center" },
  twoFaOptions: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  twoFaOption: { display: "flex", gap: "1rem", alignItems: "flex-start", background: "#fff", borderRadius: "1rem", padding: "1.25rem", border: `1.5px solid ${SAGE}` },
  twoFaOptionIcon: { fontSize: "1.5rem", flexShrink: 0 },
  twoFaOptionTitle: { fontSize: "0.92rem", fontWeight: 600, color: INK, margin: "0 0 0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" },
  twoFaOptionDesc: { fontSize: "0.82rem", color: WARM_GRAY, lineHeight: 1.6, margin: 0 },
  recommendedBadge: { background: SAGE_LIGHT, color: SAGE_DARK, fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "100px" },
  twoFaNote: { fontSize: "0.78rem", color: "#aaa", textAlign: "center", margin: 0, fontStyle: "italic" },

  qrPlaceholder: { background: "#fff", borderRadius: "1rem", border: "2px dashed rgba(0,0,0,0.1)", padding: "2rem", display: "flex", alignItems: "center", justifyContent: "center" },
  qrInner: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", textAlign: "center" },
  qrNote: { fontSize: "0.85rem", color: WARM_GRAY, margin: 0, fontWeight: 500 },
  qrSubNote: { fontSize: "0.72rem", color: "#aaa", margin: 0, fontStyle: "italic" },

  recoveryNote: { background: SAGE_LIGHT, borderRadius: "0.75rem", padding: "1rem 1.1rem" },
  recoveryNoteText: { fontSize: "0.82rem", color: SAGE_DARK, lineHeight: 1.7, margin: 0 },
};
