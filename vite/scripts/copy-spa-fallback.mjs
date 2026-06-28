import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = resolve('dist');
copyFileSync(resolve(distDir, 'index.html'), resolve(distDir, '404.html'));
console.log('Copied index.html to 404.html for GitHub Pages SPA routing');
