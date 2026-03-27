import { useState, useEffect, useRef } from "react";

/* ─── Google Sheets config ───────────────────────────────────────────────────
   Replace APPS_SCRIPT_URL with your deployed Google Apps Script Web App URL.
   Instructions in README below.
──────────────────────────────────────────────────────────────────────────── */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwi4Y-6is2iSAMA8FCy7BxKtSSto1tZIiAGzG4d-oOGYME9tf9BM2uHdhmIy8S4-SNfeQ/exec";

/* ─── Animations hook ────────────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
}

/* ─── Fade-in wrapper ────────────────────────────────────────────────────── */
function FadeIn({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const IconCompass = () => (
  <svg width="36" height="36" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer ring */}
    <circle cx="36" cy="36" r="34" fill="#e8f0eb" stroke="#7a9e87" strokeWidth="1"/>
    {/* North leaf — tallest, darkest */}
    <ellipse cx="36" cy="17" rx="7" ry="17" fill="#4a7058"/>
    {/* South leaf */}
    <ellipse cx="36" cy="55" rx="5.5" ry="13" fill="#7a9e87" opacity="0.55"/>
    {/* East leaf */}
    <ellipse cx="55" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.8"/>
    {/* West leaf */}
    <ellipse cx="17" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.45"/>
    {/* NE diagonal */}
    <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.4" transform="rotate(42 36 36) translate(0 -14)"/>
    {/* NW diagonal */}
    <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.4" transform="rotate(-42 36 36) translate(0 -14)"/>
    {/* SE diagonal */}
    <ellipse cx="36" cy="36" rx="3.5" ry="9" fill="#7a9e87" opacity="0.3" transform="rotate(135 36 36) translate(0 -14)"/>
    {/* SW diagonal */}
    <ellipse cx="36" cy="36" rx="3.5" ry="9" fill="#7a9e87" opacity="0.3" transform="rotate(-135 36 36) translate(0 -14)"/>
    {/* Center dot */}
    <circle cx="36" cy="36" r="7" fill="#4a7058"/>
    <circle cx="36" cy="36" r="3" fill="#e8f0eb"/>
    {/* Stem lines */}
    <line x1="36" y1="29" x2="36" y2="17" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.6"/>
    <line x1="36" y1="43" x2="36" y2="53" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.4"/>
    <line x1="43" y1="36" x2="55" y2="36" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.5"/>
    <line x1="29" y1="36" x2="17" y2="36" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.35"/>
  </svg>
);

const IconPath = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <path d="M6 28 C10 20, 16 24, 18 16 C20 8, 26 10, 30 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="6" cy="28" r="2.5" fill="currentColor" opacity="0.5"/>
    <circle cx="30" cy="6" r="2.5" fill="currentColor"/>
  </svg>
);

const IconSpecialist = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <circle cx="18" cy="13" r="6" stroke="currentColor" strokeWidth="2"/>
    <path d="M6 30 C6 23, 12 19, 18 19 C24 19, 30 23, 30 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M24 10 L28 10 M26 8 L26 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconPrep = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect x="8" y="6" width="20" height="26" rx="3" stroke="currentColor" strokeWidth="2"/>
    <line x1="13" y1="14" x2="23" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="13" y1="19" x2="23" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="13" y1="24" x2="19" y2="24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="26" cy="27" r="4" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M24.5 27 L25.8 28.3 L27.8 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ─── Waitlist Form ───────────────────────────────────────────────────────── */
function WaitlistForm() {
  const [form, setForm] = useState({ name: "", email: "", condition: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setStatus("loading");
    try {
      const params = new URLSearchParams({
        name: form.name,
        email: form.email,
        condition: form.condition,
      });
      await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
        method: "GET",
        mode: "no-cors",
      });
      setStatus("success");
      setForm({ name: "", email: "", condition: "" });
    } catch {
      setStatus("error");
    }
  };
  if (status === "success") {
    return (
      <div style={styles.successBox}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🌿</div>
        <p style={{ ...styles.successTitle }}>You're on the list!</p>
        <p style={styles.successSub}>We'll reach out as soon as Care Compass is ready. Thank you for being here.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.formRow}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Your name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="First name"
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email address</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            style={styles.input}
          />
        </div>
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>
          What condition(s) are you navigating? <span style={styles.optional}>(optional)</span>
        </label>
        <input
          name="condition"
          value={form.condition}
          onChange={handleChange}
          placeholder="e.g. fibromyalgia, lupus, POTS..."
          style={styles.input}
        />
      </div>
      {status === "error" && (
        <p style={styles.errorMsg}>Something went wrong. Please try again or email us at hello@joincarecompass.com</p>
      )}
      <button type="submit" disabled={status === "loading"} style={styles.ctaButton}>
        {status === "loading" ? "Submitting…" : "Notify Me at Launch →"}
      </button>
      <p style={styles.privacyNote}>
        🔒 Your information is private and will never be shared or sold.
      </p>
    </form>
  );
}

/* ─── Main Landing Page ───────────────────────────────────────────────────── */
export default function CareCompassLanding() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={styles.root}>

      {/* ── Nav ── */}
      <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }}>
        <div style={styles.navInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}><IconCompass /></span>
            <span style={styles.logoText}>Care Compass</span>
          </div>
          <a href="#waitlist" style={styles.navCta}>Join the Waitlist</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={styles.hero}>
        <div style={styles.heroBg} aria-hidden="true">
          <div style={styles.heroBlobA} />
          <div style={styles.heroBlobB} />
          <div style={styles.heroGrain} />
        </div>
        <div style={styles.heroInner}>
          <FadeIn delay={0.1}>
            <div style={styles.heroBadge}>Built for chronic illness patients</div>
          </FadeIn>
          <FadeIn delay={0.25}>
            <h1 style={styles.heroHeadline}>
              Clarity, guidance, and support<br />
              <em style={styles.heroEm}>for people living with chronic illness.</em>
            </h1>
          </FadeIn>
          <FadeIn delay={0.4}>
            <p style={styles.heroSub}>
              Care Compass helps you understand what's happening, what to do next,
              and who can help — so you never have to navigate your health alone.
            </p>
          </FadeIn>
          <FadeIn delay={0.55}>
            <a href="#waitlist" style={styles.ctaButton}>Join the Waitlist →</a>
          </FadeIn>
        </div>
        <div style={styles.heroScroll} aria-hidden="true">
          <div style={styles.scrollLine} />
        </div>
      </section>

      {/* ── Value Points ── */}
      <section style={styles.valueSection}>
        <div style={styles.container}>
          <FadeIn>
            <p style={styles.sectionEyebrow}>What Care Compass does</p>
            <h2 style={styles.sectionTitle}>Everything you need to advocate for yourself</h2>
          </FadeIn>
          <div style={styles.valueGrid}>
            {[
              {
                icon: <IconPath />,
                title: "Personalized next-step guidance",
                desc: "Based on your symptoms and history, Care Compass gives you clear, actionable next steps — no more sifting through contradictory search results at midnight.",
                delay: 0.1,
              },
              {
                icon: <IconSpecialist />,
                title: "Specialist matching",
                desc: "Know exactly which type of specialist to seek out and why. Walk into every referral conversation with confidence and context.",
                delay: 0.2,
              },
              {
                icon: <IconPrep />,
                title: "Appointment prep & whole-person support",
                desc: "Arrive prepared with the right questions, a clear summary of your history, and the validation that your experience deserves to be heard.",
                delay: 0.3,
              },
            ].map(({ icon, title, desc, delay }) => (
              <FadeIn key={title} delay={delay}>
                <div style={styles.valueCard}>
                  <div style={styles.valueIcon}>{icon}</div>
                  <h3 style={styles.valueCardTitle}>{title}</h3>
                  <p style={styles.valueCardDesc}>{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Emotional Message ── */}
      <section style={styles.emotionSection}>
        <div style={styles.emotionBg} aria-hidden="true">
          <div style={styles.emotionBlob} />
        </div>
        <div style={styles.container}>
          <FadeIn>
            <blockquote style={styles.emotionQuote}>
              Living with chronic illness shouldn't feel like guesswork.
            </blockquote>
            <p style={styles.emotionSub}>
              You deserve clarity, validation, and a path forward —{" "}
              <strong style={{ fontWeight: 600 }}>every step of the way.</strong>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Waitlist Form ── */}
      <section id="waitlist" style={styles.waitlistSection}>
        <div style={{ ...styles.container, maxWidth: 680 }}>
          <FadeIn>
            <p style={styles.sectionEyebrow}>Early access</p>
            <h2 style={styles.sectionTitle}>Be the first to know when we launch</h2>
            <p style={styles.waitlistSub}>
              We're building Care Compass in close conversation with the chronic illness community.
              Join the waitlist and you'll be among the first to access it — and to shape it.
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <WaitlistForm />
          </FadeIn>
        </div>
      </section>

      {/* ── Founder Note ── */}
      <section style={styles.founderSection}>
        <div style={{ ...styles.container, maxWidth: 680 }}>
          <FadeIn>
            <div style={styles.founderCard}>
              <div style={styles.founderAvatar} aria-hidden="true">T</div>
              <div>
                <p style={styles.founderQuote}>
                  "I built Care Compass because I've lived the confusion, dismissal, and exhaustion
                  that so many chronic-illness patients face. No one should have to piece together
                  their care alone."
                </p>
                <p style={styles.founderName}>Tiffany, Founder of Care Compass</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}><IconCompass /></span>
            <span style={styles.logoText}>Care Compass</span>
          </div>
          <div style={styles.footerRight}>
            <a href="mailto:hello@joincarecompass.com" style={styles.footerLink}>
              hello@joincarecompass.com
            </a>
            <span style={styles.footerCopy}>© {new Date().getFullYear()} Care Compass</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const SAGE = "#7a9e87";
const SAGE_LIGHT = "#e8f0eb";
const SAGE_DARK = "#4a7058";
const TEAL = "#4a9fa5";
const TEAL_LIGHT = "#e0f2f4";
const WARM_GRAY = "#6b6560";
const OFF_WHITE = "#fafaf8";
const CREAM = "#f4f1ec";
const INK = "#2d2926";
const INK_LIGHT = "#4a4540";

const styles = {
  root: {
    fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
    color: INK,
    background: OFF_WHITE,
    overflowX: "hidden",
  },

  /* Nav */
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: "1.1rem 2rem",
    transition: "background 0.35s ease, box-shadow 0.35s ease",
  },
  navScrolled: {
    background: "rgba(250,250,248,0.92)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 1px 0 rgba(0,0,0,0.07)",
  },
  navInner: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.55rem",
    color: SAGE_DARK,
    textDecoration: "none",
  },
  logoIcon: { display: "flex", alignItems: "center", color: SAGE_DARK },
  logoText: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.15rem",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    color: SAGE_DARK,
  },
  navCta: {
    background: SAGE_DARK,
    color: "#fff",
    padding: "0.55rem 1.3rem",
    borderRadius: "100px",
    fontSize: "0.875rem",
    fontWeight: 500,
    textDecoration: "none",
    letterSpacing: "0.01em",
    transition: "background 0.2s",
  },

  /* Hero */
  hero: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: "8rem 2rem 5rem",
    position: "relative",
    overflow: "hidden",
  },
  heroBg: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
  },
  heroBlobA: {
    position: "absolute",
    top: "-10%",
    left: "-5%",
    width: "55%",
    paddingBottom: "55%",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(122,158,135,0.18) 0%, transparent 70%)",
  },
  heroBlobB: {
    position: "absolute",
    bottom: "5%",
    right: "-8%",
    width: "45%",
    paddingBottom: "45%",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(74,159,165,0.14) 0%, transparent 70%)",
  },
  heroGrain: {
    position: "absolute",
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
    backgroundSize: "200px 200px",
    opacity: 0.5,
  },
  heroInner: {
    position: "relative",
    zIndex: 1,
    maxWidth: 760,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.5rem",
  },
  heroBadge: {
    display: "inline-block",
    background: SAGE_LIGHT,
    color: SAGE_DARK,
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "0.4rem 1rem",
    borderRadius: "100px",
    border: `1px solid rgba(74,112,88,0.2)`,
  },
  heroHeadline: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
    fontWeight: 700,
    lineHeight: 1.18,
    letterSpacing: "-0.02em",
    color: INK,
    margin: 0,
  },
  heroEm: {
    fontStyle: "italic",
    color: SAGE_DARK,
  },
  heroSub: {
    fontSize: "clamp(1rem, 2vw, 1.2rem)",
    color: WARM_GRAY,
    lineHeight: 1.7,
    maxWidth: 600,
    margin: 0,
  },
  heroScroll: {
    position: "absolute",
    bottom: "2.5rem",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1,
  },
  scrollLine: {
    width: 1,
    height: 48,
    margin: "0 auto",
    background: `linear-gradient(to bottom, transparent, ${SAGE})`,
    animation: "scrollPulse 2s ease-in-out infinite",
  },

  /* Shared */
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 2rem",
  },
  sectionEyebrow: {
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: TEAL,
    marginBottom: "0.75rem",
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
    fontWeight: 700,
    lineHeight: 1.22,
    letterSpacing: "-0.02em",
    color: INK,
    marginBottom: "3rem",
    marginTop: 0,
  },

  /* Value */
  valueSection: {
    padding: "7rem 0",
    background: "#fff",
  },
  valueGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "2rem",
  },
  valueCard: {
    padding: "2.25rem 2rem",
    background: OFF_WHITE,
    borderRadius: "1.25rem",
    border: `1px solid rgba(0,0,0,0.06)`,
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
  },
  valueIcon: {
    color: SAGE_DARK,
    marginBottom: "1.25rem",
    display: "flex",
  },
  valueCardTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.2rem",
    fontWeight: 700,
    color: INK,
    marginBottom: "0.75rem",
    lineHeight: 1.3,
  },
  valueCardDesc: {
    fontSize: "0.965rem",
    color: WARM_GRAY,
    lineHeight: 1.75,
    margin: 0,
  },

  /* Emotion */
  emotionSection: {
    padding: "8rem 2rem",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
    background: CREAM,
  },
  emotionBg: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
  },
  emotionBlob: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "70%",
    paddingBottom: "40%",
    borderRadius: "50%",
    background: "radial-gradient(ellipse, rgba(122,158,135,0.14) 0%, transparent 70%)",
  },
  emotionQuote: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
    fontWeight: 700,
    fontStyle: "italic",
    color: SAGE_DARK,
    lineHeight: 1.3,
    maxWidth: 760,
    margin: "0 auto 1.5rem",
    position: "relative",
    zIndex: 1,
  },
  emotionSub: {
    fontSize: "1.1rem",
    color: WARM_GRAY,
    lineHeight: 1.7,
    position: "relative",
    zIndex: 1,
    margin: 0,
  },

  /* Waitlist */
  waitlistSection: {
    padding: "7rem 2rem",
    background: "#fff",
  },
  waitlistSub: {
    fontSize: "1rem",
    color: WARM_GRAY,
    lineHeight: 1.75,
    marginBottom: "2.5rem",
    marginTop: "-1.5rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.1rem",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: INK_LIGHT,
    letterSpacing: "0.01em",
  },
  optional: {
    fontWeight: 400,
    color: "#aaa",
    fontSize: "0.8rem",
  },
  input: {
    padding: "0.85rem 1.1rem",
    borderRadius: "0.75rem",
    border: `1.5px solid rgba(0,0,0,0.12)`,
    fontSize: "0.97rem",
    color: INK,
    background: OFF_WHITE,
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
  },
  ctaButton: {
    display: "inline-block",
    background: SAGE_DARK,
    color: "#fff",
    padding: "0.95rem 2.25rem",
    borderRadius: "100px",
    fontSize: "1rem",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    letterSpacing: "0.01em",
    textDecoration: "none",
    transition: "background 0.2s, transform 0.15s",
    alignSelf: "center",
    fontFamily: "inherit",
  },
  successBox: {
    textAlign: "center",
    padding: "3rem 2rem",
    background: SAGE_LIGHT,
    borderRadius: "1.25rem",
    border: `1px solid rgba(74,112,88,0.2)`,
  },
  successTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: SAGE_DARK,
    marginBottom: "0.5rem",
  },
  successSub: {
    color: WARM_GRAY,
    fontSize: "0.97rem",
    lineHeight: 1.7,
    margin: 0,
  },
  errorMsg: {
    color: "#c0392b",
    fontSize: "0.875rem",
    margin: 0,
  },

  /* Founder */
  founderSection: {
    padding: "5rem 2rem",
    background: CREAM,
  },
  founderCard: {
    display: "flex",
    gap: "1.75rem",
    alignItems: "flex-start",
    background: "#fff",
    borderRadius: "1.25rem",
    padding: "2.5rem",
    border: `1px solid rgba(0,0,0,0.06)`,
    boxShadow: "0 4px 32px rgba(0,0,0,0.05)",
  },
  founderAvatar: {
    flexShrink: 0,
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${SAGE}, ${TEAL})`,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.5rem",
    fontWeight: 700,
  },
  founderQuote: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.1rem",
    fontStyle: "italic",
    lineHeight: 1.7,
    color: INK,
    marginBottom: "0.85rem",
    marginTop: 0,
  },
  founderName: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: SAGE_DARK,
    margin: 0,
    letterSpacing: "0.02em",
  },

  /* Footer */
  footer: {
    padding: "2rem",
    borderTop: `1px solid rgba(0,0,0,0.08)`,
    background: OFF_WHITE,
  },
  footerInner: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  footerRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "0.25rem",
  },
  footerLink: {
    fontSize: "0.875rem",
    color: WARM_GRAY,
    textDecoration: "none",
  },
  footerCopy: {
    fontSize: "0.8rem",
    color: "#aaa",
  },
  errorMsg: {
    color: "#c0392b",
    fontSize: "0.875rem",
    margin: 0,
  },
  privacyNote: {
    fontSize: "0.78rem",
    color: "#aaa",
    margin: "0.25rem 0 0",
    textAlign: "center",
  },
};
