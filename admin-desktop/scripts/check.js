// Syntax-checks every app source file (portable: runs the same on Windows).
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = ['src/main.js', 'src/preload.js',
  ...fs.readdirSync('src/renderer').filter((f) => f.endsWith('.js')).map((f) => path.join('src/renderer', f))];
for (const f of files) execFileSync(process.execPath, ['--check', f], { stdio: 'inherit' });
console.log(`${files.length} fichiers vérifiés`);
