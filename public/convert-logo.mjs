import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('./public/care-compass-logo.svg');
await sharp(svg)
  .resize(112, 112)
  .png()
  .toFile('./public/care-compass-logo.png');

console.log('Done! Logo saved as care-compass-logo.png');