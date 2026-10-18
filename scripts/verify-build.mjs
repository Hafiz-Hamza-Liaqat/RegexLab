import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error(`Error: ${indexPath} does not exist. Run "npm run build" first.`);
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');

// Match asset links: relative (./assets/), /regexlab/assets/, or /RegexLab/assets/
const assetRegex = /(?:src|href)="((?:\.\/|\/regexlab\/|\/RegexLab\/)?assets\/[^"]+)"/g;
const matches = [...html.matchAll(assetRegex)].map((m) => m[1]);

if (matches.length === 0) {
  console.error('Error: No assets under assets/ were found in index.html.');
  process.exit(1);
}

console.log(`Found ${matches.length} asset reference(s) in index.html:`);

let hasJs = false;
let hasCss = false;

for (const assetPath of matches) {
  console.log(`  - ${assetPath}`);
  if (assetPath.endsWith('.js')) {
    hasJs = true;
  }
  if (assetPath.endsWith('.css')) {
    hasCss = true;
  }

  // Strip prefix and resolve path inside dist
  const relativePath = assetPath.replace(/^(?:\.\/|\/regexlab\/|\/RegexLab\/)?/, '');
  const filePath = path.join(distDir, relativePath);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: Referenced asset does not exist on disk: ${filePath}`);
    process.exit(1);
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    console.error(`Error: Referenced asset file is empty: ${filePath}`);
    process.exit(1);
  }
}

if (!hasJs) {
  console.error('Error: No JavaScript bundle was found.');
  process.exit(1);
}

if (!hasCss) {
  console.error('Error: No stylesheet bundle was found.');
  process.exit(1);
}

console.log('✓ Build verification passed: all assets referenced in index.html exist with non-zero size on disk.');
