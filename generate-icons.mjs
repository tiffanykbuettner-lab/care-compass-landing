#!/usr/bin/env node
/**
 * generate-icons.mjs
 * 
 * Generates all required PWA icon sizes from the CareCompass SVG mark.
 * 
 * Usage:
 *   node generate-icons.mjs
 * 
 * Prerequisites:
 *   npm install sharp
 * 
 * Output: /public/icons/icon-{size}x{size}.png for all required sizes
 *         /public/icons/icon-maskable-{size}x{size}.png for maskable variants
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUTPUT_DIR = './public/icons';
mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Standard icon SVG (botanical mark on #e8f0eb background) ─────────────────
const iconSVG = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Rounded square background -->
  <rect width="512" height="512" rx="112" fill="#e8f0eb"/>
  <defs>
    <!-- Clip everything to the inner circle so leaves don't escape the ring -->
    <clipPath id="ring-clip">
      <circle cx="256" cy="256" r="208"/>
    </clipPath>
  </defs>
  <!-- Outer ring (drawn first, behind clipped content) -->
  <circle cx="256" cy="256" r="210" fill="#e8f0eb" stroke="#7a9e87" stroke-width="5"/>
  <!-- All leaves clipped to the circle -->
  <g clip-path="url(#ring-clip)">
    <!-- North leaf -->
    <ellipse cx="256" cy="136" rx="49" ry="119" fill="#4a7058"/>
    <!-- South leaf -->
    <ellipse cx="256" cy="376" rx="38.5" ry="91" fill="#7a9e87" opacity="0.55"/>
    <!-- East leaf -->
    <ellipse cx="376" cy="256" rx="119" ry="49" fill="#4a9fa5" opacity="0.8"/>
    <!-- West leaf -->
    <ellipse cx="136" cy="256" rx="119" ry="49" fill="#4a9fa5" opacity="0.45"/>
    <!-- NE diagonal -->
    <ellipse cx="256" cy="256" rx="31.5" ry="77" fill="#4a7058" opacity="0.4" transform="rotate(42 256 256) translate(0 -98)"/>
    <!-- NW diagonal -->
    <ellipse cx="256" cy="256" rx="31.5" ry="77" fill="#4a7058" opacity="0.4" transform="rotate(-42 256 256) translate(0 -98)"/>
    <!-- SE diagonal -->
    <ellipse cx="256" cy="256" rx="24.5" ry="63" fill="#4a9fa5" opacity="0.6" transform="rotate(135 256 256) translate(0 -98)"/>
    <!-- SW diagonal -->
    <ellipse cx="256" cy="256" rx="24.5" ry="63" fill="#4a9fa5" opacity="0.6" transform="rotate(-135 256 256) translate(0 -98)"/>
  </g>
  <!-- Ring stroke on top of leaves -->
  <circle cx="256" cy="256" r="210" fill="none" stroke="#7a9e87" stroke-width="5"/>
  <!-- Center dot (above clip) -->
  <circle cx="256" cy="256" r="49" fill="#4a7058"/>
  <circle cx="256" cy="256" r="21" fill="#e8f0eb"/>
  <!-- Stem lines -->
  <line x1="256" y1="207" x2="256" y2="136" stroke="#e8f0eb" stroke-width="5.6" opacity="0.6"/>
  <line x1="256" y1="305" x2="256" y2="371" stroke="#e8f0eb" stroke-width="5.6" opacity="0.4"/>
  <line x1="305" y1="256" x2="371" y2="256" stroke="#e8f0eb" stroke-width="5.6" opacity="0.5"/>
  <line x1="207" y1="256" x2="141" y2="256" stroke="#e8f0eb" stroke-width="5.6" opacity="0.35"/>
</svg>`;

// ── Maskable icon SVG (mark centered in safe zone with solid background) ──────
// Maskable icons need the logo within the inner 80% "safe zone"
const maskableSVG = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Full bleed background -->
  <rect width="512" height="512" fill="#e8f0eb"/>
  <!-- Mark scaled to ~60% to stay well within maskable safe zone -->
  <g transform="translate(102, 102) scale(0.6)">
    <circle cx="256" cy="256" r="210" fill="#e8f0eb" stroke="#7a9e87" stroke-width="6"/>
    <ellipse cx="256" cy="136" rx="49" ry="119" fill="#4a7058"/>
    <ellipse cx="256" cy="376" rx="38.5" ry="91" fill="#7a9e87" opacity="0.55"/>
    <ellipse cx="376" cy="256" rx="119" ry="49" fill="#4a9fa5" opacity="0.8"/>
    <ellipse cx="136" cy="256" rx="119" ry="49" fill="#4a9fa5" opacity="0.45"/>
    <ellipse cx="256" cy="256" rx="31.5" ry="77" fill="#4a7058" opacity="0.4" transform="rotate(42 256 256) translate(0 -98)"/>
    <ellipse cx="256" cy="256" rx="31.5" ry="77" fill="#4a7058" opacity="0.4" transform="rotate(-42 256 256) translate(0 -98)"/>
    <circle cx="256" cy="256" r="49" fill="#4a7058"/>
    <circle cx="256" cy="256" r="21" fill="#e8f0eb"/>
    <line x1="256" y1="207" x2="256" y2="136" stroke="#e8f0eb" stroke-width="5.6" opacity="0.6"/>
    <line x1="305" y1="256" x2="371" y2="256" stroke="#e8f0eb" stroke-width="5.6" opacity="0.5"/>
  </g>
</svg>`;

// ── Standard icon sizes ────────────────────────────────────────────────────────
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// ── Apple touch icon sizes ─────────────────────────────────────────────────────
const APPLE_SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 167, 180];

async function generateIcons() {
  const svgBuffer = Buffer.from(iconSVG);
  const maskableBuffer = Buffer.from(maskableSVG);

  console.log('🌿 Generating CareCompass PWA icons...\n');

  // Standard icons
  for (const size of SIZES) {
    const filename = `icon-${size}x${size}.png`;
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(OUTPUT_DIR, filename));
    console.log(`  ✓ ${filename}`);
  }

  // Maskable icons (192 and 512 only — what browsers use)
  for (const size of [192, 512]) {
    const filename = `icon-maskable-${size}x${size}.png`;
    await sharp(maskableBuffer)
      .resize(size, size)
      .png()
      .toFile(join(OUTPUT_DIR, filename));
    console.log(`  ✓ ${filename} (maskable)`);
  }

  // Apple touch icons
  for (const size of APPLE_SIZES) {
    const filename = `apple-touch-icon-${size}x${size}.png`;
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(OUTPUT_DIR, filename));
    console.log(`  ✓ ${filename} (Apple)`);
  }

  // Canonical Apple touch icon (180x180 — used when no size specified)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(OUTPUT_DIR, 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png (canonical)');

  // Save SVG source for reference
  writeFileSync(join(OUTPUT_DIR, 'icon.svg'), iconSVG);
  writeFileSync(join(OUTPUT_DIR, 'icon-maskable.svg'), maskableSVG);
  console.log('  ✓ icon.svg + icon-maskable.svg (source)');

  console.log(`\n✅ All icons generated → ${OUTPUT_DIR}`);
}

generateIcons().catch(console.error);
