/* ============================================================
   Stamp a fresh version onto the assets and the service worker
   cache, so a phone that already has the app never serves you
   yesterday's code. Run it before every deploy.

   Run:  node tools/stamp.js
   ============================================================ */
const fs = require('fs');

const v = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12); // YYYYMMDDHHmm

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/\?v=[\w.]+/g, '?v=' + v);
fs.writeFileSync('index.html', html);

let sw = fs.readFileSync('sw.js', 'utf8');
sw = sw.replace(/const CACHE = '[^']*';/, "const CACHE = 'life-organizer-" + v + "';");
fs.writeFileSync('sw.js', sw);

console.log('stamped ' + v);
