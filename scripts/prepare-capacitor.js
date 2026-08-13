import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const clientDir = path.resolve('dist/client');
const assetsDir = path.join(distDir, 'assets');

if (!fs.existsSync(assetsDir)) {
  console.error('Assets directory not found at', assetsDir);
  process.exit(1);
}

const files = fs.readdirSync(assetsDir);
const mainJs = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
const mainCss = files.find(f => f.startsWith('styles-') && f.endsWith('.css'));

if (!mainJs) {
  console.error('Could not find main JS file (index-*.js) in assets');
  process.exit(1);
}

// Ensure logo is in dist
if (fs.existsSync('src/assets/phonezip-logo.png')) {
  fs.copyFileSync(
    'src/assets/phonezip-logo.png',
    path.join(distDir, 'phonezip-logo.png')
  );
}

if (fs.existsSync('public/favicon.png')) {
  fs.copyFileSync(
    'public/favicon.png',
    path.join(distDir, 'favicon.png')
  );
}

const cssLink = mainCss
  ? `<link rel="stylesheet" href="/assets/${mainCss}" />`
  : '';

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
    <title>PhoneZip — Zip. Transfer. Done.</title>
    <meta name="description" content="PhoneZip compresses your phone files into ZIPs and transfers them to your PC over your local Wi-Fi network." />
    <meta name="theme-color" content="#0a63f5" />
    <script>
      if (typeof window !== 'undefined' && (window.location.pathname === '/index.html' || window.location.pathname.endsWith('/index.html') || window.location.pathname === '/index.html/')) {
        window.history.replaceState(null, '', '/');
      }
    </script>
    ${cssLink}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" />
    <link rel="icon" type="image/png" href="/favicon.png" />
  </head>
  <body class="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/assets/${mainJs}"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml, 'utf8');

console.log('Successfully generated index.html in dist');

// Prepare clean Capacitor web directory
fs.rmSync(clientDir, { recursive: true, force: true });
fs.mkdirSync(clientDir, { recursive: true });

// Copy dist contents into dist/client, excluding client itself
for (const entry of fs.readdirSync(distDir)) {
  if (entry === 'client') continue;

  const src = path.join(distDir, entry);
  const dest = path.join(clientDir, entry);

  fs.cpSync(src, dest, { recursive: true });
}

console.log('Successfully prepared dist/client for Capacitor');
