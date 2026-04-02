import { useState, useEffect, useRef } from "react";

const SAGE       = "#7a9e87";
const SAGE_LIGHT = "#e8f0eb";
const SAGE_DARK  = "#4a7058";
const TEAL       = "#4a9fa5";
const WARM_GRAY  = "#6b6560";
const OFF_WHITE  = "#fafaf8";
const CREAM      = "#f4f1ec";
const INK        = "#2d2926";
const INK_LIGHT  = "#4a4540";

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

function FadeIn({ children, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

const BotanicalMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
    <circle cx="36" cy="36" r="34" fill="#e8f0eb" stroke="#7a9e87" strokeWidth="1"/>
    <ellipse cx="36" cy="17" rx="7" ry="17" fill="#4a7058"/>
    <ellipse cx="36" cy="55" rx="5.5" ry="13" fill="#7a9e87" opacity="0.55"/>
    <ellipse cx="55" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.8"/>
    <ellipse cx="17" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.45"/>
    <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.4" transform="rotate(42 36 36) translate(0 -14)"/>
    <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.4" transform="rotate(-42 36 36) translate(0 -14)"/>
    <circle cx="36" cy="36" r="7" fill="#4a7058"/>
    <circle cx="36" cy="36" r="3" fill="#e8f0eb"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="9" fill={SAGE_LIGHT}/>
    <path d="M5 9.5L7.5 12L13 6.5" stroke={SAGE_DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FEATURES = [
  { label: "Full symptom assessment", desc: "Map symptoms across every body system with AI-powered pattern recognition" },
  { label: "Unlimited assessments", desc: "Run as many assessments as you need — no monthly limits" },
  { label: "Daily symptom tracker", desc: "Log entries multiple times a day with unlimited history" },
  { label: "AI pattern insights", desc: "Time-based correlation analysis across symptoms, food, medications, and activity" },
  { label: "Trends & frequency reports", desc: "See which symptoms appear most often and when" },
  { label: "Photo logging", desc: "Attach photos to entries to document rashes, swelling, or other visual symptoms" },
  { label: "Doctor-ready PDF reports", desc: "Generate formatted reports to bring to your next appointment" },
  { label: "Secure account with 2FA", desc: "Two-factor authentication and encrypted data storage" },
  { label: "Data export", desc: "Your data is always yours — export everything at any time" },
];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes — you can cancel your subscription at any time from your account settings. You'll keep access until the end of your current billing period.",
  },
  {
    q: "Is my health data private?",
    a: "Absolutely. Your health data is encrypted, never sold, and never shared with third parties. We take privacy seriously — it's built into the foundation of Care Compass.",
  },
  {
    q: "What if I'm already an early tester?",
    a: "If you've been part of our early testing community, we'll be reaching out with complimentary access as a thank-you for helping shape Care Compass.",
  },
  {
    q: "Is Care Compass a medical service?",
    a: "No. Care Compass provides pattern insights and conversation starters — not medical advice, diagnosis, or treatment. Always discuss findings with a qualified healthcare provider.",
  },
  {
    q: "What devices can I use Care Compass on?",
    a: "Care Compass works on any device with a modern web browser — phone, tablet, or desktop. Your account and data sync across all your devices.",
  },
  {
    q: "Will there be more features in the future?",
    a: "Yes — we're actively building. Coming soon: lab result interpretation, AI photo symptom analysis, and specialist directory matching. Subscribers get access to new features as they launch.",
  },
];

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={s.faqItem} onClick={() => setOpen(o => !o)}>
      <div style={s.faqHeader}>
        <p style={s.faqQ}>{q}</p>
        <span style={{ ...s.faqChevron, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </div>
      {open && <p style={s.faqA}>{a}</p>}
    </div>
  );
}

export default function CareCompassPricing() {
  const [billing, setBilling] = useState("annual");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const monthly = 12.99;
  const annual = 140.30;
  const annualMonthly = (annual / 12).toFixed(2);
  const savings = ((monthly * 12 - annual)).toFixed(2);

  return (
    <div style={s.root}>

      {/* Nav */}
      <nav style={{ ...s.nav, ...(scrolled ? s.navScrolled : {}) }}>
        <div style={s.navInner}>
          <a href="/" style={s.navLogo}>
            <BotanicalMark size={30}/>
            <span style={s.navLogoText}>Care Compass</span>
          </a>
          <div style={s.navLinks}>
            <a href="/compass" style={s.navLink}>Assessment</a>
            <a href="/tracker" style={s.navLink}>Tracker</a>
            <a href="/#waitlist" style={s.navCta}>Join Waitlist</a>
          </div>
        </div>
      </nav>

      <main>

        {/* Hero */}
        <section style={s.hero}>
          <div style={s.heroBg} aria-hidden="true">
            <div style={s.heroBlobA}/>
            <div style={s.heroBlobB}/>
          </div>
          <div style={s.heroInner}>
            <FadeIn>
              <div style={s.heroBadge}>Simple, transparent pricing</div>
              <h1 style={s.heroTitle}>
                Everything you need to<br/>
                <em style={s.heroEm}>advocate for your health.</em>
              </h1>
              <p style={s.heroSub}>
                One plan. Every feature. Built for people navigating complex, chronic illness.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Pricing card */}
        <section style={s.pricingSection}>
          <div style={s.container}>
            <FadeIn>

              {/* Billing toggle */}
              <div style={s.toggleWrap}>
                <button
                  onClick={() => setBilling("monthly")}
                  style={{ ...s.toggleBtn, background: billing === "monthly" ? "#fff" : "transparent", color: billing === "monthly" ? INK : WARM_GRAY, boxShadow: billing === "monthly" ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling("annual")}
                  style={{ ...s.toggleBtn, background: billing === "annual" ? "#fff" : "transparent", color: billing === "annual" ? INK : WARM_GRAY, boxShadow: billing === "annual" ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}
                >
                  Annual
                  <span style={s.savingsBadge}>Save 10%</span>
                </button>
              </div>

              {/* Main card */}
              <div style={s.planCard}>
                <div style={s.planCardLeft}>
                  <div style={s.planHeader}>
                    <BotanicalMark size={40}/>
                    <div>
                      <p style={s.planEyebrow}>Care Compass</p>
                      <h2 style={s.planName}>Full Access</h2>
                    </div>
                  </div>

                  <div style={s.priceWrap}>
                    <span style={s.priceCurrency}>$</span>
                    <span style={s.priceAmount}>
                      {billing === "monthly" ? monthly.toFixed(2) : annualMonthly}
                    </span>
                    <span style={s.pricePer}>/ month</span>
                  </div>

                  {billing === "annual" && (
                    <p style={s.annualNote}>
                      Billed annually at $140.30 · Save 10%
                    </p>
                  )}
                  {billing === "monthly" && (
                    <p style={s.annualNote}>
                      Switch to annual and save 10%
                    </p>
                  )}

                  <a
                    href="/#waitlist"
                    style={s.subscribeBtn}
                  >
                    Get Started →
                  </a>
                  <p style={s.subscribeNote}>Cancel anytime · No hidden fees · Secure checkout</p>

                  <div style={s.trustRow}>
                    <span style={s.trustItem}><svg width="16" height="16" viewBox="0 0 72 72" fill="none" style={{marginRight:"0.35rem",verticalAlign:"middle"}}><circle cx="36" cy="36" r="34" fill="#e8f0eb" stroke="#7a9e87" strokeWidth="1"/><ellipse cx="36" cy="17" rx="7" ry="17" fill="#4a7058"/><ellipse cx="55" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.8"/><ellipse cx="17" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.45"/><circle cx="36" cy="36" r="7" fill="#4a7058"/><circle cx="36" cy="36" r="3" fill="#e8f0eb"/></svg>Encrypted & private</span>
                    <span style={s.trustItem}><svg width="16" height="16" viewBox="0 0 72 72" fill="none" style={{marginRight:"0.35rem",verticalAlign:"middle"}}><circle cx="36" cy="36" r="34" fill="#e8f0eb" stroke="#7a9e87" strokeWidth="1"/><ellipse cx="36" cy="17" rx="7" ry="17" fill="#4a7058"/><ellipse cx="55" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.8"/><ellipse cx="17" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.45"/><circle cx="36" cy="36" r="7" fill="#4a7058"/><circle cx="36" cy="36" r="3" fill="#e8f0eb"/></svg>Not medical advice</span>
                    <span style={s.trustItem}><svg width="16" height="16" viewBox="0 0 72 72" fill="none" style={{marginRight:"0.35rem",verticalAlign:"middle"}}><circle cx="36" cy="36" r="34" fill="#e8f0eb" stroke="#7a9e87" strokeWidth="1"/><ellipse cx="36" cy="17" rx="7" ry="17" fill="#4a7058"/><ellipse cx="55" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.8"/><ellipse cx="17" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.45"/><circle cx="36" cy="36" r="7" fill="#4a7058"/><circle cx="36" cy="36" r="3" fill="#e8f0eb"/></svg>Cancel anytime</span>
                  </div>
                </div>

                <div style={s.planCardRight}>
                  <p style={s.featuresLabel}>Everything included</p>
                  <div style={s.featuresList}>
                    {FEATURES.map(({ label, desc }) => (
                      <div key={label} style={s.featureItem}>
                        <CheckIcon/>
                        <div>
                          <p style={s.featureLabel}>{label}</p>
                          <p style={s.featureDesc}>{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </FadeIn>
          </div>
        </section>

        {/* Coming soon */}
        <section style={s.comingSoonSection}>
          <div style={{ ...s.container, maxWidth: 760 }}>
            <FadeIn>
              <p style={s.sectionEyebrow}>On the roadmap</p>
              <h2 style={s.sectionTitle}>More coming for subscribers</h2>
              <p style={s.comingSoonSub}>As Care Compass grows, subscribers get access to new features as they launch — at no extra cost until premium tiers are introduced.</p>
              <div style={s.comingSoonGrid}>
                {[
                  { icon: "🔬", title: "Lab result interpretation", desc: "Upload lab results and get plain-language explanations of what they mean and what to ask your doctor." },
                  { icon: "📸", title: "AI photo symptom analysis", desc: "Share a photo of a rash, swelling, or skin change and get contextual insight on what it might indicate." },
                  { icon: "🩺", title: "Specialist directory", desc: "Find specialists near you who understand complex chronic conditions — not just generalists." },
                  { icon: "💬", title: "Private consult", desc: "Connect directly with a Care Compass health navigator for personalized guidance." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} style={s.comingSoonCard}>
                    <span style={s.comingSoonIcon}>{icon}</span>
                    <h3 style={s.comingSoonTitle}>{title}</h3>
                    <p style={s.comingSoonDesc}>{desc}</p>
                    <span style={s.comingSoonTag}>Coming soon</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* FAQ */}
        <section style={s.faqSection}>
          <div style={{ ...s.container, maxWidth: 680 }}>
            <FadeIn>
              <p style={s.sectionEyebrow}>Questions</p>
              <h2 style={s.sectionTitle}>Everything you need to know</h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div style={s.faqList}>
                {FAQS.map(faq => <FAQ key={faq.q} {...faq}/>)}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={s.ctaSection}>
          <div style={{ ...s.container, maxWidth: 600, textAlign: "center" }}>
            <FadeIn>
              <BotanicalMark size={52}/>
              <h2 style={s.ctaTitle}>You deserve clarity about your health.</h2>
              <p style={s.ctaSub}>Join Care Compass and start building the picture your doctors need to help you.</p>
              <a href="/#waitlist" style={s.ctaBtn}>Get Started →</a>
              <p style={s.ctaNote}>Questions? <a href="mailto:hello@joincarecompass.com" style={s.ctaLink}>hello@joincarecompass.com</a></p>
            </FadeIn>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerLogo}>
            <BotanicalMark size={24}/>
            <span style={s.footerLogoText}>Care Compass</span>
          </div>
          <div style={s.footerLinks}>
            <a href="/privacy" style={s.footerLink}>Privacy Policy</a>
            <a href="mailto:hello@joincarecompass.com" style={s.footerLink}>Contact</a>
            <span style={s.footerCopy}>© {new Date().getFullYear()} Care Compass</span>
          </div>
        </div>
        <p style={s.footerDisclaimer}>Care Compass is not a medical service and does not provide medical advice, diagnosis, or treatment.</p>
      </footer>

    </div>
  );
}

const s = {
  root: { fontFamily: "'DM Sans', Helvetica, sans-serif", color: INK, background: OFF_WHITE, minHeight: "100vh" },

  nav: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "1.1rem 2rem", transition: "background 0.3s, box-shadow 0.3s" },
  navScrolled: { background: "rgba(250,250,248,0.94)", backdropFilter: "blur(12px)", boxShadow: "0 1px 0 rgba(0,0,0,0.07)" },
  navInner: { maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" },
  navLogo: { display: "flex", alignItems: "center", gap: "0.55rem", textDecoration: "none" },
  navLogoText: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: SAGE_DARK },
  navLinks: { display: "flex", alignItems: "center", gap: "1.5rem" },
  navLink: { fontSize: "0.875rem", color: WARM_GRAY, textDecoration: "none" },
  navCta: { background: SAGE_DARK, color: "#fff", padding: "0.55rem 1.3rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" },

  hero: { minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "10rem 2rem 5rem", position: "relative", overflow: "hidden" },
  heroBg: { position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" },
  heroBlobA: { position: "absolute", top: "-10%", left: "10%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${SAGE_LIGHT} 0%, transparent 70%)`, opacity: 0.6 },
  heroBlobB: { position: "absolute", bottom: "-10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, #e0f2f4 0%, transparent 70%)`, opacity: 0.5 },
  heroInner: { position: "relative", zIndex: 1, maxWidth: 680 },
  heroBadge: { display: "inline-block", background: SAGE_LIGHT, color: SAGE_DARK, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.4rem 1rem", borderRadius: "100px", marginBottom: "1.25rem" },
  heroTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, color: INK, margin: "0 0 1rem", letterSpacing: "-0.02em", lineHeight: 1.2 },
  heroEm: { fontStyle: "italic", color: SAGE_DARK },
  heroSub: { fontSize: "1.05rem", color: WARM_GRAY, lineHeight: 1.75, margin: 0 },

  pricingSection: { padding: "4rem 1.5rem 6rem" },
  container: { maxWidth: 1000, margin: "0 auto" },

  toggleWrap: { display: "flex", background: SAGE_LIGHT, borderRadius: "100px", padding: "0.25rem", width: "fit-content", margin: "0 auto 2.5rem", gap: "0.15rem" },
  toggleBtn: { padding: "0.6rem 1.5rem", borderRadius: "100px", border: "none", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "0.5rem" },
  savingsBadge: { background: TEAL, color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "100px" },

  planCard: { background: "#fff", borderRadius: "1.75rem", border: `1px solid rgba(0,0,0,0.07)`, boxShadow: "0 8px 48px rgba(0,0,0,0.08)", display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" },
  planCardLeft: { padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", borderRight: `1px solid rgba(0,0,0,0.06)` },
  planCardRight: { padding: "2.5rem", background: OFF_WHITE },
  planHeader: { display: "flex", alignItems: "center", gap: "1rem" },
  planEyebrow: { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.2rem" },
  planName: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: INK, margin: 0 },
  priceWrap: { display: "flex", alignItems: "flex-end", gap: "0.25rem" },
  priceCurrency: { fontSize: "1.5rem", fontWeight: 700, color: SAGE_DARK, lineHeight: 1, paddingBottom: "0.3rem" },
  priceAmount: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "3.5rem", fontWeight: 700, color: INK, lineHeight: 1 },
  pricePer: { fontSize: "1rem", color: WARM_GRAY, paddingBottom: "0.5rem" },
  annualNote: { fontSize: "0.82rem", color: WARM_GRAY, margin: 0, lineHeight: 1.6 },
  subscribeBtn: { display: "block", background: SAGE_DARK, color: "#fff", padding: "1rem 2rem", borderRadius: "100px", fontSize: "1rem", fontWeight: 600, textDecoration: "none", textAlign: "center", transition: "background 0.2s" },
  subscribeNote: { fontSize: "0.75rem", color: "#aaa", textAlign: "center", margin: 0 },
  trustRow: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  trustItem: { fontSize: "0.8rem", color: WARM_GRAY },

  featuresLabel: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: WARM_GRAY, margin: "0 0 1.25rem" },
  featuresList: { display: "flex", flexDirection: "column", gap: "1rem" },
  featureItem: { display: "flex", gap: "0.75rem", alignItems: "flex-start", textAlign: "left" },
  featureLabel: { fontSize: "0.9rem", fontWeight: 600, color: INK, margin: "0 0 0.15rem" },
  featureDesc: { fontSize: "0.78rem", color: WARM_GRAY, lineHeight: 1.6, margin: 0 },

  comingSoonSection: { padding: "6rem 1.5rem", background: CREAM },
  sectionEyebrow: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.5rem" },
  sectionTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: INK, margin: "0 0 1rem", letterSpacing: "-0.02em" },
  comingSoonSub: { fontSize: "0.95rem", color: WARM_GRAY, lineHeight: 1.75, marginBottom: "2.5rem", marginTop: "-0.5rem" },
  comingSoonGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" },
  comingSoonCard: { background: "#fff", borderRadius: "1.25rem", border: `1px solid rgba(0,0,0,0.06)`, padding: "1.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" },
  comingSoonIcon: { fontSize: "1.75rem" },
  comingSoonTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 700, color: INK, margin: 0 },
  comingSoonDesc: { fontSize: "0.85rem", color: WARM_GRAY, lineHeight: 1.7, margin: 0, flex: 1 },
  comingSoonTag: { display: "inline-block", background: SAGE_LIGHT, color: SAGE_DARK, fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: "100px", letterSpacing: "0.05em", alignSelf: "flex-start" },

  faqSection: { padding: "6rem 1.5rem", background: "#fff" },
  faqList: { display: "flex", flexDirection: "column", gap: "0", marginTop: "2rem" },
  faqItem: { padding: "1.25rem 0", borderBottom: `1px solid rgba(0,0,0,0.07)`, cursor: "pointer" },
  faqHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" },
  faqQ: { fontSize: "0.95rem", fontWeight: 600, color: INK, margin: 0 },
  faqChevron: { color: WARM_GRAY, fontSize: "1.1rem", flexShrink: 0, transition: "transform 0.2s" },
  faqA: { fontSize: "0.9rem", color: WARM_GRAY, lineHeight: 1.75, margin: "0.75rem 0 0" },

  ctaSection: { padding: "7rem 1.5rem", background: SAGE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" },
  ctaTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: INK, margin: "1rem 0 0.75rem", letterSpacing: "-0.02em" },
  ctaSub: { fontSize: "1rem", color: WARM_GRAY, lineHeight: 1.75, marginBottom: "2rem" },
  ctaBtn: { display: "inline-block", background: SAGE_DARK, color: "#fff", padding: "1rem 2.5rem", borderRadius: "100px", fontSize: "1rem", fontWeight: 600, textDecoration: "none", marginBottom: "1.25rem" },
  ctaNote: { fontSize: "0.85rem", color: WARM_GRAY, margin: 0 },
  ctaLink: { color: SAGE_DARK, fontWeight: 600, textDecoration: "none" },

  footer: { padding: "2rem 2rem 1.5rem", borderTop: `1px solid rgba(0,0,0,0.07)`, background: OFF_WHITE },
  footerInner: { maxWidth: 1000, margin: "0 auto 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" },
  footerLogo: { display: "flex", alignItems: "center", gap: "0.5rem" },
  footerLogoText: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.95rem", fontWeight: 700, color: SAGE_DARK },
  footerLinks: { display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" },
  footerLink: { fontSize: "0.85rem", color: WARM_GRAY, textDecoration: "none" },
  footerCopy: { fontSize: "0.8rem", color: "#aaa" },
  footerDisclaimer: { fontSize: "0.75rem", color: "#aaa", textAlign: "center", maxWidth: 600, margin: "0 auto" },
};
