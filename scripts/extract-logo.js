const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const pdfPath = 'C:/Users/Victus/.gemini/antigravity/brain/295955b8-a728-4fd8-86c8-d30748ec275c/.user_uploaded/media_1795067538004_9a67d810.pdf';
const buf = fs.readFileSync(pdfPath);
const streamStart = buf.indexOf('stream\r\n') !== -1 ? buf.indexOf('stream\r\n') + 8 : buf.indexOf('stream\n') + 7;
const streamEnd = buf.indexOf('endstream');
const deflated = buf.slice(streamStart, streamEnd);
const text = zlib.inflateSync(deflated).toString('latin1');

const H = 517.8529;
const tokens = text.trim().split(/\s+/);
let curFill = '#000000';
let pathD = '';
const paths = [];

let i = 0;
while (i < tokens.length) {
  const tok = tokens[i];
  if (tok === 'rg') {
    const r = Math.round(parseFloat(tokens[i - 3]) * 255);
    const g = Math.round(parseFloat(tokens[i - 2]) * 255);
    const b = Math.round(parseFloat(tokens[i - 1]) * 255);
    curFill = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    i++;
  } else if (tok === 'k') {
    const c = parseFloat(tokens[i - 4]);
    const m = parseFloat(tokens[i - 3]);
    const y = parseFloat(tokens[i - 2]);
    const k = parseFloat(tokens[i - 1]);
    const r = Math.round(255 * (1 - c) * (1 - k));
    const g = Math.round(255 * (1 - m) * (1 - k));
    const b = Math.round(255 * (1 - y) * (1 - k));
    curFill = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    i++;
  } else if (tok === 'm') {
    const x = parseFloat(tokens[i - 2]);
    const y = H - parseFloat(tokens[i - 1]);
    pathD += 'M ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' ';
    i++;
  } else if (tok === 'l') {
    const x = parseFloat(tokens[i - 2]);
    const y = H - parseFloat(tokens[i - 1]);
    pathD += 'L ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' ';
    i++;
  } else if (tok === 'c') {
    const x1 = parseFloat(tokens[i - 6]);
    const y1 = H - parseFloat(tokens[i - 5]);
    const x2 = parseFloat(tokens[i - 4]);
    const y2 = H - parseFloat(tokens[i - 3]);
    const x3 = parseFloat(tokens[i - 2]);
    const y3 = H - parseFloat(tokens[i - 1]);
    pathD += 'C ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ', ' + x2.toFixed(2) + ' ' + y2.toFixed(2) + ', ' + x3.toFixed(2) + ' ' + y3.toFixed(2) + ' ';
    i++;
  } else if (tok === 'h') {
    pathD += 'Z ';
    i++;
  } else if (tok === 'f*' || tok === 'f') {
    if (pathD.trim()) {
      paths.push({ d: pathD.trim(), fill: curFill, rule: tok === 'f*' ? 'evenodd' : 'nonzero' });
      pathD = '';
    }
    i++;
  } else if (tok === 'n') {
    pathD = '';
    i++;
  } else {
    i++;
  }
}

// Logo elements are paths 1 through 16 (Path 0 is canvas background)
// Paths 1-8, 13: Red elements (tachometer & banner)
// Paths 9-12: Car outline (black in original)
// Paths 14-15: RS & ENTERPRISES lettering (white)
// Path 16: Underline (light gray #e5e5e5)

const outDir = path.resolve('d:/Next Projects/rs-enterprises/public/images');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// 1. Transparent Standard SVG (Original colors: Red, Black car, White text)
const standardPaths = paths.slice(1);
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="15 10 680 500" width="100%" height="100%" fill="none">
  <!-- RS Enterprises Official Logo (Transparent Background) -->
  <!-- Tachometer Arc & Red Banner -->
  <g fill="#F90001" fill-rule="evenodd">
${standardPaths.filter(p => p.fill === '#f90001').map(p => `    <path d="${p.d}" />`).join('\n')}
  </g>
  <!-- Sleek Sports Car Profile -->
  <g fill="#000000" fill-rule="evenodd">
${standardPaths.filter(p => p.fill === '#000000').map(p => `    <path d="${p.d}" />`).join('\n')}
  </g>
  <!-- Accent Underline -->
  <g fill="#E5E5E5" fill-rule="evenodd">
${standardPaths.filter(p => p.fill === '#e5e5e5').map(p => `    <path d="${p.d}" />`).join('\n')}
  </g>
  <!-- RS ENTERPRISES Typography -->
  <g fill="#FFFFFF" fill-rule="evenodd">
${standardPaths.filter(p => p.fill === '#ffffff').map(p => `    <path d="${p.d}" />`).join('\n')}
  </g>
</svg>`;
fs.writeFileSync(path.join(outDir, 'logo.svg'), standardSvg);

// 2. Dark-Mode Optimized SVG (Car profile is crisp brilliant white so it gleams on dark showroom background)
const darkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="15 10 680 500" width="100%" height="100%" fill="none">
  <!-- RS Enterprises Official Logo (Dark Background Variant) -->
  <!-- Tachometer Arc & Red Banner -->
  <g fill="#F90001" fill-rule="evenodd">
${standardPaths.filter(p => p.fill === '#f90001').map(p => `    <path d="${p.d}" />`).join('\n')}
  </g>
  <!-- Sleek Sports Car Profile (Brilliant Diamond White on Obsidian) -->
  <g fill="#FFFFFF" fill-rule="evenodd">
${standardPaths.filter(p => p.fill === '#000000').map(p => `    <path d="${p.d}" />`).join('\n')}
  </g>
  <!-- Accent Underline -->
  <g fill="#E5E5E5" fill-rule="evenodd">
${standardPaths.filter(p => p.fill === '#e5e5e5').map(p => `    <path d="${p.d}" />`).join('\n')}
  </g>
  <!-- RS ENTERPRISES Typography -->
  <g fill="#FFFFFF" fill-rule="evenodd">
${standardPaths.filter(p => p.fill === '#ffffff').map(p => `    <path d="${p.d}" />`).join('\n')}
  </g>
</svg>`;
fs.writeFileSync(path.join(outDir, 'logo-dark.svg'), darkSvg);

// 3. Adaptive SVG (Uses CSS class .logo-car for dynamic theme switching in HTML)
const adaptiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="15 10 680 500" width="100%" height="100%" fill="none" class="rs-logo-svg">
  <style>
    .rs-logo-red { fill: #F90001; }
    .rs-logo-car { fill: #000000; }
    .rs-logo-text { fill: #FFFFFF; }
    .rs-logo-accent { fill: #E5E5E5; }
    :root[data-theme="dark"] .rs-logo-car,
    .dark .rs-logo-car { fill: #FFFFFF; }
  </style>
  <g class="rs-logo-red" fill-rule="evenodd">
${standardPaths.filter(p => p.fill === '#f90001').map(p => `    <path d="${p.d}" />`).join('\n')}
  </g>
  <g class="rs-logo-car" fill-rule="evenodd">
${standardPaths.filter(p => p.fill === '#000000').map(p => `    <path d="${p.d}" />`).join('\n')}
  </g>
  <g class="rs-logo-accent" fill-rule="evenodd">
${standardPaths.filter(p => p.fill === '#e5e5e5').map(p => `    <path d="${p.d}" />`).join('\n')}
  </g>
  <g class="rs-logo-text" fill-rule="evenodd">
${standardPaths.filter(p => p.fill === '#ffffff').map(p => `    <path d="${p.d}" />`).join('\n')}
  </g>
</svg>`;
fs.writeFileSync(path.join(outDir, 'logo-adaptive.svg'), adaptiveSvg);

console.log('Successfully generated:');
console.log('1. logo.svg (standard)');
console.log('2. logo-dark.svg (for dark backgrounds)');
console.log('3. logo-adaptive.svg (with CSS theme variable awareness)');
