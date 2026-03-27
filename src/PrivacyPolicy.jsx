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
