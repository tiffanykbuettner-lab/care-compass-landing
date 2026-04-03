import { useInstallPrompt } from './useInstallPrompt';

/* ─── Botanical compass mark (inline SVG, matches app branding) ─────────────── */
const CompassMark = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="36" cy="36" r="34" fill="#e8f0eb" stroke="#7a9e87" strokeWidth="1"/>
    <ellipse cx="36" cy="17" rx="7" ry="17" fill="#4a7058"/>
    <ellipse cx="36" cy="55" rx="5.5" ry="13" fill="#7a9e87" opacity="0.55"/>
    <ellipse cx="55" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.8"/>
    <ellipse cx="17" cy="36" rx="17" ry="7" fill="#4a9fa5" opacity="0.45"/>
    <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.4" transform="rotate(42 36 36) translate(0 -14)"/>
    <ellipse cx="36" cy="36" rx="4.5" ry="11" fill="#4a7058" opacity="0.4" transform="rotate(-42 36 36) translate(0 -14)"/>
    <circle cx="36" cy="36" r="7" fill="#4a7058"/>
    <circle cx="36" cy="36" r="3" fill="#e8f0eb"/>
    <line x1="36" y1="29" x2="36" y2="17" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.6"/>
    <line x1="43" y1="36" x2="55" y2="36" stroke="#e8f0eb" strokeWidth="0.8" opacity="0.5"/>
  </svg>
);

/* ─── Share icon for iOS instructions ───────────────────────────────────────── */
const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

/* ─── Close icon ─────────────────────────────────────────────────────────────── */
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ─── Styles (inline — no build dependency) ─────────────────────────────────── */
const styles = {
  banner: {
    position: 'fixed',
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 2rem)',
    maxWidth: '420px',
    background: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 8px 40px rgba(74, 112, 88, 0.18), 0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #d4e4d8',
    padding: '1.25rem 1.25rem 1.25rem 1.25rem',
    zIndex: 9999,
    animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    fontFamily: "'Georgia', serif",
  },
  inner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.875rem',
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#2d4a35',
    marginBottom: '0.2rem',
  },
  subtitle: {
    fontSize: '0.8rem',
    color: '#7a9e87',
    lineHeight: 1.5,
    marginBottom: '1rem',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
  },
  installBtn: {
    flex: 1,
    background: '#4a7058',
    color: '#e8f0eb',
    border: 'none',
    borderRadius: '10px',
    padding: '0.65rem 1rem',
    fontSize: '0.85rem',
    fontFamily: "'Georgia', serif",
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  notNowBtn: {
    background: 'transparent',
    color: '#7a9e87',
    border: '1px solid #d4e4d8',
    borderRadius: '10px',
    padding: '0.65rem 0.875rem',
    fontSize: '0.8rem',
    fontFamily: "'Georgia', serif",
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#7a9e87',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  iosStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem',
    color: '#5a7a62',
    marginBottom: '0.4rem',
  },
  iosStepNum: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#e8f0eb',
    color: '#4a7058',
    fontSize: '0.7rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};

const keyframes = `
  @keyframes slideUp {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;

/* ─── Component ──────────────────────────────────────────────────────────────── */
export default function InstallBanner() {
  const { canInstall, isIOS, promptInstall, dismissInstall, showBanner } = useInstallPrompt();

  if (!showBanner) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.banner} role="dialog" aria-label="Install CareCompass">
        <div style={styles.inner}>
          <CompassMark size={44} />

          <div style={styles.text}>
            <div style={styles.title}>Add CareCompass to your home screen</div>

            {isIOS ? (
              <>
                <div style={{ ...styles.subtitle, marginBottom: '0.75rem' }}>
                  Get quick access to your symptom tracker — no app store needed.
                </div>
                <div style={styles.iosStep}>
                  <span style={styles.iosStepNum}>1</span>
                  Tap <ShareIcon /> <strong style={{ color: '#4a7058' }}>Share</strong> in your browser
                </div>
                <div style={styles.iosStep}>
                  <span style={styles.iosStepNum}>2</span>
                  Tap <strong style={{ color: '#4a7058' }}>"Add to Home Screen"</strong>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <button style={styles.notNowBtn} onClick={dismissInstall}>
                    Got it
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={styles.subtitle}>
                  Track symptoms faster — works offline too.
                </div>
                <div style={styles.actions}>
                  <button
                    style={styles.installBtn}
                    onClick={promptInstall}
                    onMouseOver={e => e.target.style.background = '#3d5e48'}
                    onMouseOut={e => e.target.style.background = '#4a7058'}
                  >
                    Install app
                  </button>
                  <button
                    style={styles.notNowBtn}
                    onClick={dismissInstall}
                    onMouseOver={e => e.target.style.background = '#f5f9f6'}
                    onMouseOut={e => e.target.style.background = 'transparent'}
                  >
                    Not now
                  </button>
                </div>
              </>
            )}
          </div>

          <button style={styles.closeBtn} onClick={dismissInstall} aria-label="Dismiss">
            <CloseIcon />
          </button>
        </div>
      </div>
    </>
  );
}
