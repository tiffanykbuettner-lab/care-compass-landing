/**
 * SageIcons.jsx
 * Shared sage-green icon library for Care Compass.
 * All icons use currentColor — set color on the parent element.
 * Default size 16x16. Pass size prop to override.
 */

const iconPaths = {
  close:      ({ s }) => <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>,
  trash:      ({ s }) => <><path d="M2 4h12M5 4V2h6v2M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 7v5M10 7v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>,
  edit:       ({ s }) => <path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>,
  check:      ({ s }) => <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>,
  back:       ({ s }) => <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>,
  forward:    ({ s }) => <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>,
  upload:     ({ s }) => <><path d="M8 10V3M5 6l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>,
  attachment: ({ s }) => <path d="M13 7.5l-5.5 5.5a4 4 0 01-5.7-5.6L7 2.3a2.5 2.5 0 013.5 3.5L5.3 11a1 1 0 01-1.4-1.4l4.8-4.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>,
  camera:     ({ s }) => <><rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 4l1-2h4l1 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></>,
  lock:       ({ s }) => <><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="10.5" r="1" fill="currentColor"/></>,
  info:       ({ s }) => <><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 7v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="5.5" r="0.7" fill="currentColor"/></>,
  warning:    ({ s }) => <><path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 7v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="12" r="0.7" fill="currentColor"/></>,
  tip:        ({ s }) => <><path d="M8 2a4 4 0 00-1.5 7.7V11h3V9.7A4 4 0 008 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6.5 11v1.5a1.5 1.5 0 003 0V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>,
  heart:      ({ s }) => <path d="M8 13s-6-3.5-6-7.5A3.5 3.5 0 018 3a3.5 3.5 0 016 2.5C14 9.5 8 13 8 13z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>,
  pill:       ({ s }) => <><rect x="2" y="6" width="12" height="4" rx="2" stroke="currentColor" strokeWidth="1.4"/><line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" strokeWidth="1.4"/></>,
  dna:        ({ s }) => <><path d="M5 2c0 3 6 3 6 6s-6 3-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M11 2c0 3-6 3-6 6s6 3 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="5" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="5" y1="10" x2="11" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>,
  pulse:      ({ s }) => <path d="M1 8h3l2-5 2 10 2-6 1 3h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>,
  calendar:   ({ s }) => <><rect x="1.5" y="3" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1.5 7h13M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>,
  pin:        ({ s }) => <><path d="M8 1a4 4 0 014 4c0 3-4 9-4 9S4 8 4 5a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="8" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2"/></>,
  compass:    ({ s }) => <><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 4l2 4-4 4 2-4z" fill="currentColor" opacity="0.7"/><path d="M8 12L6 8l4-4-2 4z" fill="currentColor" opacity="0.3"/></>,
  clipboard:  ({ s }) => <><rect x="3" y="3" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M6 3V2h4v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M5.5 8h5M5.5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></>,
  leaf:       ({ s }) => <><path d="M3 13c1-4 2-8 9-10-3 5-4 8-9 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M3 13c2-3 4-5 6-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>,
  bell:       ({ s }) => <><path d="M8 2a5 5 0 00-5 5v3l-1.5 2h13L13 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4"/></>,
  alarm:      ({ s }) => <><circle cx="8" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 6.5V9l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 3.5L1.5 2M13 3.5L14.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>,
};

export function Icon({ name, size = 16, color = "currentColor", style = {} }) {
  const Paths = iconPaths[name];
  if (!Paths) return null;
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, color, ...style }}
    >
      <Paths s={size} />
    </svg>
  );
}

// Morning sun — sage light
export function MorningSunIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
      <line x1="3" y1="26" x2="33" y2="26" stroke="#7a9e87" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M 9 26 A 9 9 0 0 1 27 26" fill="#7a9e87"/>
      <line x1="18" y1="4"  x2="18" y2="11" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
      <line x1="28" y1="9"  x2="24" y2="13" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8"  y1="9"  x2="12" y2="13" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
      <line x1="32" y1="20" x2="27" y2="21" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4"  y1="20" x2="9"  y2="21" stroke="#7a9e87" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// Evening crescent moon + stars — sage dark
export function EveningMoonIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
      <line x1="0" y1="78" x2="80" y2="78" stroke="#4a7058" strokeWidth="3" strokeLinecap="round"/>
      <path d="M 58.5 21 A 28 28 0 1 0 58.5 63 A 22 22 0 1 1 58.5 21 Z" fill="#4a7058"/>
      <circle cx="68" cy="6"  r="3"   fill="#4a7058"/>
      <circle cx="8"  cy="18" r="2.2" fill="#4a7058"/>
      <circle cx="52" cy="2"  r="1.8" fill="#4a7058"/>
      <circle cx="22" cy="8"  r="1.8" fill="#4a7058"/>
    </svg>
  );
}

export default Icon;
