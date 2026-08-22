import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

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

const FIREFLY_KEYFRAMES = `
  @keyframes ffDrift {
    0%,100% { transform: translate(0,0); }
    33%      { transform: translate(0.6px,-0.8px); }
    66%      { transform: translate(-0.5px,0.6px); }
  }
  @keyframes ffWingL {
    0%,100% { transform-origin:50% 50%; transform: rotate(0deg) scaleY(1); opacity:0.55; }
    50%      { transform-origin:50% 50%; transform: rotate(-18deg) scaleY(0.82); opacity:0.8; }
  }
  @keyframes ffWingR {
    0%,100% { transform-origin:50% 50%; transform: rotate(0deg) scaleY(1); opacity:0.55; }
    50%      { transform-origin:50% 50%; transform: rotate(18deg) scaleY(0.82); opacity:0.8; }
  }
  @keyframes ffLeaf {
    0%,100% { transform-origin:36px 36px; transform:scale(1); }
    50%      { transform-origin:36px 36px; transform:scale(1.03); }
  }
  @keyframes ffAntL {
    0%,100% { transform: rotate(0deg); }
    50%      { transform: rotate(-5deg); }
  }
  @keyframes ffAntR {
    0%,100% { transform: rotate(0deg); }
    50%      { transform: rotate(5deg); }
  }
  @keyframes sageIn {
    from { opacity: 0; transform: translateY(12px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

const FireflyMark = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ animation: "ffDrift 4s ease-in-out infinite", display: "block" }}>
    <circle cx="36" cy="36" r="34" fill="#e8f0eb" stroke="#7a9e87" strokeWidth="1"/>
    <g style={{ animation: "ffLeaf 3.5s ease-in-out infinite" }}>
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
    <ellipse cx="28" cy="34" rx="8" ry="3.5" fill="#a8d4b0" opacity="0.55"
      style={{ animation: "ffWingL 0.6s ease-in-out infinite" }}/>
    <ellipse cx="44" cy="34" rx="8" ry="3.5" fill="#a8d4b0" opacity="0.55"
      style={{ animation: "ffWingR 0.6s ease-in-out infinite", animationDelay: "0.05s" }}/>
    <g style={{ transformOrigin: "34.5px 30px", animation: "ffAntL 2.8s ease-in-out infinite" }}>
      <line x1="34.5" y1="30" x2="31" y2="25" stroke="#4a7058" strokeWidth="0.9" strokeLinecap="round"/>
      <circle cx="31" cy="24.5" fill="#a8ffb0">
        <animate attributeName="r" values="1;1.6;1" dur="2.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.4s" repeatCount="indefinite"/>
      </circle>
    </g>
    <g style={{ transformOrigin: "37.5px 30px", animation: "ffAntR 2.8s ease-in-out infinite", animationDelay: "0.4s" }}>
      <line x1="37.5" y1="30" x2="41" y2="25" stroke="#4a7058" strokeWidth="0.9" strokeLinecap="round"/>
      <circle cx="41" cy="24.5" fill="#a8ffb0">
        <animate attributeName="r" values="1;1.6;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.4s" begin="0.5s" repeatCount="indefinite"/>
      </circle>
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

const LOGIN_SYSTEM_PROMPT = `You are Sage, the friendly Care Compass guide. The user is on the login page. Help them with questions about signing in, account access, passwords, or what Care Compass is. If they're having trouble logging in, reassure them and guide them to the right option (forgot password, support email). Keep responses warm, concise — 2-3 sentences max. No bullet points or markdown.`;

const LOGIN_SUGGESTIONS = [
  "I forgot my password",
  "What is Care Compass?",
  "How do I create an account?",
  "Is my data private?",
  "I'm having trouble signing in",
];

function SageChatbot() {
  const [open, setOpen] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setGreeting(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open && messagesEndRef.current)
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessageWith = async (text) => {
    if (!text || loading) return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: LOGIN_SYSTEM_PROMPT,
          messages: newMessages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I'm having trouble connecting. Please try again in a moment.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "I'm having trouble connecting. Please try again in a moment." }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    await sendMessageWith(text);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <style>{FIREFLY_KEYFRAMES}</style>
      {greeting && !open && (
        <div style={ss.greeting}>
          <p style={ss.greetingText}>Hi, I'm Sage! Having trouble signing in, or just have questions?</p>
          <p style={ss.greetingAttrib}>— <strong>Your Care Compass guide</strong></p>
          <button style={ss.greetingClose} onClick={() => setGreeting(false)} aria-label="Dismiss">✕</button>
        </div>
      )}
      {open && (
        <div style={ss.drawer}>
          <div style={ss.drawerHeader}>
            <div style={ss.drawerHeaderLeft}>
              <FireflyMark size={44} />
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
                <div style={ss.emptyState}>Need help signing in, or curious about Care Compass?</div>
                <div style={ss.suggestedWrap}>
                  {LOGIN_SUGGESTIONS.map(q => (
                    <button key={q} style={ss.suggestedPill} onClick={() => sendMessageWith(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={m.role === "user" ? ss.userBubble : ss.sageBubble}>{m.content}</div>
            ))}
            {loading && <div style={ss.sageBubble}><span style={ss.typing}>●&nbsp;●&nbsp;●</span></div>}
            <div ref={messagesEndRef} />
          </div>
          <div style={ss.inputRow}>
            <input style={ss.chatInput} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey} placeholder="Ask Sage a question…" disabled={loading} />
            <button style={ss.sendBtn} onClick={sendMessage} disabled={loading || !input.trim()} aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
      {!open && (
        <button style={ss.fab} onClick={() => { setOpen(true); setGreeting(false); }} aria-label="Chat with Sage">
          <FireflyMark size={48} />
        </button>
      )}
    </>
  );
}

const ss = {
  fab: { position: "fixed", bottom: "1.5rem", right: "1.5rem", width: 68, height: 68, borderRadius: "50%", background: "#e8f0eb", border: "2px solid #c2d9c8", boxShadow: "0 4px 24px rgba(74,112,88,0.18)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000, padding: 0 },
  greeting: { position: "fixed", bottom: "5.75rem", right: "1.5rem", background: "#fff", borderRadius: "1rem", boxShadow: "0 4px 32px rgba(0,0,0,0.10)", padding: "1rem 1.25rem 0.85rem", maxWidth: 260, zIndex: 9000, animation: "sageIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" },
  greetingText: { margin: "0 0 0.3rem", fontSize: "0.92rem", color: "#2d2926", lineHeight: 1.55, paddingRight: "1rem" },
  greetingAttrib: { margin: 0, fontSize: "0.78rem", color: "#7a9e87" },
  greetingClose: { position: "absolute", top: "0.5rem", right: "0.6rem", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "0.75rem", padding: "2px 4px", lineHeight: 1 },
  drawer: { position: "fixed", bottom: "1.5rem", right: "1.5rem", width: 340, maxWidth: "calc(100vw - 2rem)", maxHeight: "70vh", background: "#fff", borderRadius: "1.25rem", boxShadow: "0 8px 48px rgba(0,0,0,0.14)", border: "1px solid rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", zIndex: 9000, overflow: "hidden", animation: "sageIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" },
  drawerHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.1rem", borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#fafaf8" },
  drawerHeaderLeft: { display: "flex", alignItems: "center", gap: "0.75rem" },
  drawerName: { fontWeight: 700, fontSize: "0.95rem", color: "#2d2926", lineHeight: 1.2 },
  drawerSub: { fontSize: "0.75rem", color: "#7a9e87" },
  drawerClose: { background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "1rem", padding: "4px", lineHeight: 1 },
  messages: { flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" },
  emptyState: { fontSize: "0.875rem", color: "#aaa", textAlign: "center", lineHeight: 1.6, padding: "1rem 0.5rem 0.75rem", fontStyle: "italic" },
  suggestedWrap: { display: "flex", flexWrap: "wrap", gap: "0.45rem", justifyContent: "center", padding: "0 0.25rem 0.5rem" },
  suggestedPill: { background: "#f0f7f2", border: "1px solid #c2d9c8", borderRadius: "100px", padding: "0.4rem 0.85rem", fontSize: "0.78rem", color: "#4a7058", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", lineHeight: 1.4 },
  userBubble: { alignSelf: "flex-end", background: "#4a7058", color: "#fff", borderRadius: "1rem 1rem 0.25rem 1rem", padding: "0.65rem 0.9rem", fontSize: "0.88rem", lineHeight: 1.5, maxWidth: "82%" },
  sageBubble: { alignSelf: "flex-start", background: "#e8f0eb", color: "#2d2926", borderRadius: "1rem 1rem 1rem 0.25rem", padding: "0.65rem 0.9rem", fontSize: "0.88rem", lineHeight: 1.5, maxWidth: "82%" },
  typing: { color: "#7a9e87", letterSpacing: "0.1em", fontSize: "0.75rem" },
  inputRow: { display: "flex", gap: "0.5rem", padding: "0.75rem", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#fafaf8" },
  chatInput: { flex: 1, padding: "0.65rem 0.9rem", borderRadius: "0.75rem", border: "1.5px solid rgba(0,0,0,0.1)", fontSize: "0.88rem", fontFamily: "inherit", color: "#2d2926", background: "#fff", outline: "none" },
  sendBtn: { width: 40, height: 40, borderRadius: "0.75rem", background: "#4a7058", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
};

export default function CareCompassLogin() {
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

  const handle2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Clerk integration point: SignIn.attemptSecondFactor({ strategy: "totp", code: twoFaCode })
      await signIn({ email: form.email, password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
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
      <div style={s.leftPanel} className="auth-left-panel">
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
          <a href="/" style={s.mobileLogo} className="auth-mobile-logo">
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
      <SageChatbot />
    </div>
  );
}

const s = {
  root: { display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', Helvetica, sans-serif", color: INK, overflowX: "hidden", width: "100%" },

  // Left brand panel
  leftPanel: { width: "42%", background: SAGE_DARK, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", flexShrink: 0 },
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
  rightPanel: { flex: 1, background: OFF_WHITE, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem", minWidth: 0 },
  formWrap: { width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: "1.5rem" },

  // Mobile logo (hidden on desktop via width logic — shown when left panel not visible)
  mobileLogo: { display: "flex", alignItems: "center", gap: "0.55rem", textDecoration: "none", marginBottom: "0.5rem" },
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
