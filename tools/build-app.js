/* ============================================================
   Build the standalone single-file copy of the whole app.
   Everything inlined, no service worker, no relative assets, so
   it can be published as an Artifact, dropped on any static host,
   or opened straight off a phone with no server at all.

   Run:  node tools/build-app.js
   Out:  build/life-organizer.html          (body-content, for Artifacts)
         build/life-organizer-standalone.html   (full document)
   ============================================================ */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const css = ['assets/css/core.css', 'assets/css/app.css', 'assets/css/companion.css'].map(read).join('\n\n');

const js = [
  'assets/js/store.js',
  'assets/js/level.js',
  'assets/js/library.js',
  'assets/js/ui.js',
  'assets/js/quotes.js',
  'assets/js/actions.js',
  'assets/js/classify.js',
  'assets/js/aims.js',
  'assets/js/insight.js',
  'assets/js/advice.js',
  'assets/js/sync.js',
  'assets/js/notifications.js',
  'assets/js/shell.js',
  'assets/js/adaptive.js',
  'assets/js/companion.js',
  'assets/js/surfaces/do.js',
  'assets/js/surfaces/write.js',
  'assets/js/surfaces/advice.js',
  'assets/js/surfaces/me.js'
].map(read).join('\n\n');

const markup = read('index.html')
  .replace(/^[\s\S]*?<body>/, '')
  .replace(/<\/body>[\s\S]*$/, '')
  .replace(/\s*<script src="[^"]*"><\/script>/g, '')
  .replace(/\s*<script>[\s\S]*?<\/script>/g, '')
  .trim();

const head = `<title>Life Organizer</title>\n<style>\n${css}\n</style>`;
const scripts = `<script>window.LO_STANDALONE = true;</script>
<script>
${js}
</script>
<script>LO.machine.boot();</script>`;

const inlineAssets = text => text.replace(/assets\/icons\/lumen-ball-(192|512)\.png/g, file => 'data:image/png;base64,' + fs.readFileSync(path.join(root, file)).toString('base64'));
const inner = inlineAssets(`${head}\n\n${markup}\n\n${scripts}\n`);

const standalone = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#080d0a">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Organizer">
${head}
</head>
<body style="margin:0">
${markup}

${scripts}
</body>
</html>
`;

fs.mkdirSync(path.join(root, 'build'), { recursive: true });
fs.writeFileSync(path.join(root, 'build/life-organizer.html'), inner);
fs.writeFileSync(path.join(root, 'build/life-organizer-standalone.html'), inlineAssets(standalone));
console.log('build/life-organizer.html', (inner.length / 1024).toFixed(1) + 'kb');
console.log('build/life-organizer-standalone.html', (inlineAssets(standalone).length / 1024).toFixed(1) + 'kb');
