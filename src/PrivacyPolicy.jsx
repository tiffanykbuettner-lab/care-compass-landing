import { useState, useEffect, useRef } from "react";

/* ─── Sage Chatbot ───────────────────────────────────────────────────────── */
const SAGE_KEYFRAMES = `
  @keyframes ffDrift { 0%,100%{transform:translate(0,0)} 33%{transform:translate(0.6px,-0.8px)} 66%{transform:translate(-0.5px,0.6px)} }
  @keyframes ffWingL { 0%,100%{transform-origin:50% 50%;transform:rotate(0deg) scaleY(1);opacity:0.55} 50%{transform-origin:50% 50%;transform:rotate(-18deg) scaleY(0.82);opacity:0.8} }
  @keyframes ffWingR { 0%,100%{transform-origin:50% 50%;transform:rotate(0deg) scaleY(1);opacity:0.55} 50%{transform-origin:50% 50%;transform:rotate(18deg) scaleY(0.82);opacity:0.8} }
  @keyframes ffLeaf  { 0%,100%{transform-origin:36px 36px;transform:scale(1)} 50%{transform-origin:36px 36px;transform:scale(1.03)} }
  @keyframes ffAntL  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-5deg)} }
  @keyframes ffAntR  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(5deg)} }
  @keyframes sageIn  { from{opacity:0;transform:translateY(12px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
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

const PRIVACY_SYSTEM_PROMPT = `You are Sage, the friendly Care Compass guide on the Privacy Policy page. Care Compass is an AI-powered health navigation app for people with chronic illness.

Help users understand Care Compass's privacy practices in plain language. Key facts: waitlist data is stored in Google Sheets accessible only to the Care Compass team; symptom assessment data is processed via the Anthropic API and never stored permanently; data is never sold or shared with third parties; users can request deletion at any time by emailing hello@joincarecompass.com.

Be warm, clear, and reassuring — 2-3 sentences max. No bullet points or markdown.`;

const PRIVACY_SUGGESTIONS = [
  "Is my health data stored?",
  "Who can see my information?",
  "How do I delete my data?",
  "Is my data sold to anyone?",
  "What does Anthropic do with my data?",
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
      messagesEndRef.current.scrollIntoView({ behavior:"smooth" });
  }, [messages, open]);

  const sendMessageWith = async (text) => {
    if (!text || loading) return;
    const newMessages = [...messages, { role:"user", content:text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:PRIVACY_SYSTEM_PROMPT, messages:newMessages }),
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
  const handleKey = (e) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <>
      <style>{SAGE_KEYFRAMES}</style>
      {greeting && !open && (
        <div style={ss.greeting}>
          <p style={ss.greetingText}>Hi, I'm Sage! Have questions about how Care Compass handles your data?</p>
          <p style={ss.greetingAttrib}>— <strong>Your Care Compass guide</strong></p>
          <button style={ss.greetingClose} onClick={() => setGreeting(false)} aria-label="Dismiss">✕</button>
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
                <div style={ss.emptyState}>Privacy questions? I can explain our practices in plain language.</div>
                <div style={ss.suggestedWrap}>
                  {PRIVACY_SUGGESTIONS.map(q => (
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
        <button style={ss.fab} onClick={() => { setOpen(true); setGreeting(false); }} aria-label="Chat with Sage">
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

export default function PrivacyPolicy() {
  return (
    <div style={styles.root}>

      {/* Nav */}
      <nav style={styles.nav}>
        <a href="/" style={styles.logo}>← Care Compass</a>
      </nav>

      {/* Content */}
      <main style={styles.main}>
        <div style={styles.container}>
          <p style={styles.eyebrow}>Legal</p>
          <h1 style={styles.title}>Privacy Policy</h1>
          <p style={styles.meta}>Effective date: March 26, 2026</p>

          <p style={styles.intro}>
            Care Compass is committed to protecting your privacy. This policy explains what
            information we collect, how we use it, and what rights you have over your data.
            We will always be transparent with you — because trust is at the heart of everything we do.
          </p>

          <Section title="1. Who we are">
            Care Compass is a health navigation service built to support people living with chronic
            illness. We are based in the United States. If you have any questions about this policy,
            you can reach us at{" "}
            <a href="mailto:hello@joincarecompass.com" style={styles.link}>
              hello@joincarecompass.com
            </a>.
          </Section>

          <Section title="2. What information we collect">
            When you join our waitlist, we collect:
            <ul style={styles.list}>
              <li>Your first name</li>
              <li>Your email address</li>
              <li>Optionally, the condition(s) you are navigating — this is entirely voluntary</li>
            </ul>
            We do not collect sensitive health records, insurance information, or any other
            personal health information at this stage. We do not use cookies or tracking
            technologies on our landing page.
          </Section>

          <Section title="3. How we use your information">
            We use your information solely to:
            <ul style={styles.list}>
              <li>Notify you when Care Compass launches</li>
              <li>Occasionally share updates about our progress (you can opt out at any time)</li>
              <li>Better understand the needs of our community so we can build the right product</li>
            </ul>
            We will never sell your data. We will never share your data with advertisers or
            third parties for marketing purposes.
          </Section>

          <Section title="4. Where your data is stored">
  	   Waitlist information is stored securely in Google Sheets, accessible only to the
  	   Care Compass team. When you use the Care Compass symptom assessment tool, your
  	   health information is processed securely via the Anthropic API to generate your
  	   personalized insights. This data is never stored permanently by Care Compass or
  	   Anthropic, is never used to train AI models, and is automatically deleted within
  	   7 days per Anthropic's API data policy. We never sell or share your health
  	   information with third parties. You can read more about Anthropic's data practices at{" "}
  	   <a href="https://privacy.anthropic.com" style={styles.link} target="_blank" rel="noreferrer">
    	   privacy.anthropic.com
  	  </a>.
	</Section>

          <Section title="5. How long we keep your data">
            We retain your information for as long as you remain on our waitlist or as a Care
            Compass user. If you ask us to delete your data at any time, we will do so promptly
            — usually within 7 days.
          </Section>

          <Section title="6. Your rights">
            You have the right to:
            <ul style={styles.list}>
              <li>Access the information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information at any time</li>
              <li>Opt out of communications at any time</li>
            </ul>
            To exercise any of these rights, email us at{" "}
            <a href="mailto:hello@joincarecompass.com" style={styles.link}>
              hello@joincarecompass.com
            </a>{" "}
            and we will respond within 7 business days.
          </Section>

          <Section title="7. Children's privacy">
            Care Compass is not intended for use by anyone under the age of 18. We do not
            knowingly collect information from minors. If you believe a minor has submitted
            information to us, please contact us and we will delete it immediately.
          </Section>

          <Section title="8. Changes to this policy">
            If we make meaningful changes to this privacy policy, we will notify waitlist
            members by email before the changes take effect. The effective date at the top
            of this page will always reflect the most recent version.
          </Section>

          <Section title="9. Contact us">
            Questions, concerns, or requests? We'd love to hear from you.{" "}
            <a href="mailto:hello@joincarecompass.com" style={styles.link}>
              hello@joincarecompass.com
            </a>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>© {new Date().getFullYear()} Care Compass · <a href="mailto:hello@joincarecompass.com" style={styles.link}>hello@joincarecompass.com</a></p>
      </footer>

      <SageChatbot />

    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <p style={styles.body}>{children}</p>
    </section>
  );
}

const styles = {
  root: {
    fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
    color: "#2d2926",
    background: "#fafaf8",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  nav: {
    padding: "1.25rem 2rem",
    borderBottom: "1px solid rgba(0,0,0,0.07)",
    background: "#fff",
  },
  logo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#4a7058",
    textDecoration: "none",
  },
  main: {
    flex: 1,
    padding: "4rem 2rem",
  },
  container: {
    maxWidth: 720,
    margin: "0 auto",
  },
  eyebrow: {
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#4a9fa5",
    marginBottom: "0.5rem",
  },
  title: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(2rem, 4vw, 2.75rem)",
    fontWeight: 700,
    color: "#2d2926",
    marginBottom: "0.5rem",
    marginTop: 0,
    letterSpacing: "-0.02em",
  },
  meta: {
    fontSize: "0.875rem",
    color: "#aaa",
    marginBottom: "2.5rem",
  },
  intro: {
    fontSize: "1.05rem",
    lineHeight: 1.8,
    color: "#4a4540",
    marginBottom: "2.5rem",
    padding: "1.5rem 2rem",
    background: "#e8f0eb",
    borderRadius: "1rem",
    borderLeft: "4px solid #4a7058",
  },
  section: {
    marginBottom: "2.5rem",
    paddingBottom: "2.5rem",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#2d2926",
    marginBottom: "0.75rem",
    marginTop: 0,
  },
  body: {
    fontSize: "0.97rem",
    lineHeight: 1.8,
    color: "#6b6560",
    margin: 0,
    textAlign: "left",
  },
  list: {
    marginTop: "0.75rem",
    marginBottom: "0.75rem",
    paddingLeft: "1.25rem",
    lineHeight: 2,
    listStylePosition: "inside",
    textAlign: "left",
  },
  link: {
    color: "#4a7058",
    textDecoration: "underline",
  },
  footer: {
    padding: "1.5rem 2rem",
    borderTop: "1px solid rgba(0,0,0,0.07)",
    textAlign: "center",
  },
  footerText: {
    fontSize: "0.85rem",
    color: "#aaa",
    margin: 0,
  },
};
