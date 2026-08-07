import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const PUBLIC_DIR = 'public';
const OUT_DIR = 'dist';

if (existsSync(OUT_DIR)) {
  await import('fs/promises').then(fs => fs.rm(OUT_DIR, { recursive: true }));
}
mkdirSync(OUT_DIR, { recursive: true });

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}
copyDir(PUBLIC_DIR, join(OUT_DIR, 'public'));

// Embeber index.html como módulo JS
const htmlContent = readFileSync(join(PUBLIC_DIR, 'index.html'), 'utf-8');
const htmlModule = `export default ${JSON.stringify(htmlContent)};`;
await import('fs/promises').then(fs => fs.writeFile(join('src', '_html.js'), htmlModule));

await esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  outfile: join(OUT_DIR, 'index.js'),
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info'
});

console.log('Build completo en ./dist/');
