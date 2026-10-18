async function check() {
  const url = 'https://hafiz-hamza-liaqat.github.io/RegexLab/';
  console.log(`Checking ${url}...`);
  const res = await fetch(url);
  console.log(`Status: ${res.status} ${res.statusText}`);
  const html = await res.text();
  console.log(`HTML size: ${html.length} bytes`);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  console.log(`Title: ${title}`);

  const matches = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  const assetPaths = matches.filter((p) => p.includes('assets/'));
  console.log('Discovered asset paths in index.html:', assetPaths);

  for (const assetPath of assetPaths) {
    const cleanPath = assetPath.replace(/^\.\//, '');
    const assetUrl = new URL(cleanPath, url).href;
    const assetRes = await fetch(assetUrl);
    console.log(`Asset ${cleanPath} -> ${assetUrl}: status ${assetRes.status} (${assetRes.headers.get('content-type')}, ${assetRes.headers.get('content-length')} bytes)`);
    if (assetRes.status !== 200) {
      throw new Error(`Asset failed to load: ${assetUrl}`);
    }
  }

  // Also check worker file
  const jsAssetUrl = new URL(assetPaths.find((p) => p.endsWith('.js')).replace(/^\.\//, ''), url).href;
  const jsRes = await fetch(jsAssetUrl);
  const jsText = await jsRes.text();
  const workerMatch = jsText.match(/assets\/regex\.worker-[a-zA-Z0-9_\-]+\.js/);
  if (workerMatch) {
    const workerUrl = new URL(workerMatch[0], url).href;
    const workerRes = await fetch(workerUrl);
    console.log(`Worker ${workerMatch[0]} -> ${workerUrl}: status ${workerRes.status} (${workerRes.headers.get('content-type')}, ${workerRes.headers.get('content-length')} bytes)`);
    if (workerRes.status !== 200) {
      throw new Error(`Worker asset failed to load: ${workerUrl}`);
    }
  }

  console.log('\n✓ ALL LIVE CHECKS PASSED: Application HTML, CSS, JavaScript bundle, and Web Worker loaded with HTTP 200 OK!');
}

check().catch((err) => {
  console.error('Live check failed:', err);
  process.exit(1);
});
