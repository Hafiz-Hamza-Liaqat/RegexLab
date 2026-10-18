async function check() {
  for (const basePath of ['/regexlab/', '/RegexLab/']) {
    const url = `https://hafiz-hamza-liaqat.github.io${basePath}`;
    console.log(`\n========================================`);
    console.log(`Checking ${url}...`);
    const res = await fetch(url);
    console.log(`Status: ${res.status} ${res.statusText}`);
    const html = await res.text();
    console.log(`HTML size: ${html.length} bytes`);
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    console.log(`Title: ${title}`);
    const assets = html.match(new RegExp(`${basePath}assets/[^"'\\s>]+`, 'gi')) || [];
    console.log(`Found ${assets.length} assets referenced matching ${basePath}assets:`, assets);

    const anyAssets = html.match(/\/[Rr]egex[Ll]ab\/assets\/[^"'\\s>]+/g) || [];
    console.log(`All referenced assets in HTML:`, anyAssets);

    for (const asset of anyAssets) {
      const assetUrl = `https://hafiz-hamza-liaqat.github.io${asset}`;
      const assetRes = await fetch(assetUrl);
      console.log(`Asset ${asset}: status ${assetRes.status} (${assetRes.headers.get('content-type')}, ${assetRes.headers.get('content-length')} bytes)`);
    }
  }
}

check();
