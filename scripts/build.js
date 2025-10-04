const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    ensureDir(dest);
    fs.readdirSync(src).forEach(entry => {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    });
    return;
  }

  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function cleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  ensureDir(distDir);
}

function writeMetaFile() {
  const metadata = {
    generatedAt: new Date().toISOString(),
    source: 'build.js',
    note: 'Static export for Netlify/Cloudflare hosting'
  };
  fs.writeFileSync(path.join(distDir, 'build-meta.json'), JSON.stringify(metadata, null, 2));
}

function main() {
  cleanDist();

  const assetsToCopy = [
    'index.html',
    '_redirects',
    'app',
    'pwa',
    'icons',
    'ai',
    'data'
  ];

  assetsToCopy.forEach(item => {
    const srcPath = path.join(rootDir, item);
    if (!fs.existsSync(srcPath)) {
      return;
    }
    const destPath = path.join(distDir, item);
    copyRecursive(srcPath, destPath);
  });

  writeMetaFile();
  console.log(`\nBuild complete. Output directory: ${distDir}`);
}

main();
