import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const clientDir = path.resolve('dist/client');

if (!fs.existsSync(distDir)) {
  console.error('dist directory not found');
  process.exit(1);
}

fs.rmSync(clientDir, { recursive: true, force: true });
fs.mkdirSync(clientDir, { recursive: true });

for (const entry of fs.readdirSync(distDir)) {
  if (entry === 'client') continue;

  fs.cpSync(
    path.join(distDir, entry),
    path.join(clientDir, entry),
    { recursive: true }
  );
}

console.log('Capacitor web directory prepared successfully');
