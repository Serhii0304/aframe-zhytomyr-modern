import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base = process.env.BASE_PATH || '';
assert.ok(
  !base || /^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(base),
  'Invalid public base path',
);
const clientOutput = path.resolve('dist/client');
// Vinext exports both HTML and assets beneath basePath. Pages adds that prefix
// itself, so its artifact must begin at this nested directory, not one level up.
const output = base ? path.join(clientOutput, base.slice(1)) : clientOutput;
if (base && fs.existsSync(path.join(clientOutput, '404.html'))) {
  fs.copyFileSync(
    path.join(clientOutput, '404.html'),
    path.join(output, '404.html'),
  );
}
const origin = (
  process.env.SITE_URL ||
  'https://aframe-zhytomyr-modern.serhii0304.chatgpt.site'
).replace(/\/$/, '');
const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
assert.ok(
  html.includes('Будуємо дім.'),
  'The landing content must be rendered in HTML',
);
assert.ok(
  html.includes('lang="uk"'),
  'The document language must be Ukrainian',
);
assert.ok(
  html.includes('type="checkbox"'),
  'Native consent must exist for progressive enhancement',
);
assert.ok(
  html.includes('tel:+380970864989'),
  'Mobile operator calling must be available',
);
assert.ok(
  html.includes('https://t.me/+380970864989'),
  'Telegram universal link must be available',
);
assert.ok(
  html.includes('viber://chat?number='),
  'Viber fallback link must be available without JS',
);
assert.ok(
  html.includes('og:image'),
  'The messenger preview must have an image',
);
assert.ok(
  fs.existsSync(path.join(output, '404.html')),
  'The custom 404 page must exist',
);
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  let uri = match[1].replaceAll('&amp;', '&');
  if (!uri.startsWith('/') || uri.startsWith('//') || uri === '/') continue;
  if (base && !uri.startsWith(`${base}/`))
    throw new Error(`Asset lost deployment prefix: ${uri}`);
  if (base) uri = uri.slice(base.length);
  const file = path.join(output, decodeURIComponent(uri.split('?')[0]));
  if (/\.(?:js|css|webp|woff2|svg)$/.test(file))
    assert.ok(fs.existsSync(file), `Missing exported asset: ${uri}`);
}
const xmlOrigin = origin
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');
fs.writeFileSync(
  path.join(output, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
);
fs.writeFileSync(
  path.join(output, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${xmlOrigin}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url></urlset>\n`,
);
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log(
  'Static HTML, contact links, asset paths, 404 and SEO files verified.',
);
