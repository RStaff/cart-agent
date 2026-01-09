import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.env.HOME + '/projects/cart-agent';
const PUB  = path.join(ROOT, 'web', 'src', 'public');

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p, s); console.log('Wrote', p.replace(PUB+'/','')); };
const exists = (p) => fs.existsSync(p);

// 1) Update /demo/index.html button text + link
{
  const fp = path.join(PUB, 'demo', 'index.html');
  if (exists(fp)) {
    let html = read(fp);
    html = html
      .replace(/See\s+light\s+demo/gi, 'See image demo')
      .replace(/href="\/demo\/light\/?"/g, 'href="/demo/preview/"')
      .replace(/<h2[^>]*>Dark demo<\/h2>/i, '<h2>Image demo</h2>');
    write(fp, html);
  }
}

// 2) Create /demo/preview/index.html from the old light demo, with wording fixed
{
  const src = path.join(PUB, 'demo', 'light', 'index.html');
  const dst = path.join(PUB, 'demo', 'preview', 'index.html');

  let html;
  if (exists(src)) html = read(src);
  else {
    // fallback: try using demo page as base
    const base = path.join(PUB, 'demo', 'index.html');
    html = exists(base) ? read(base) : '<!doctype html><title>Image demo</title>';
  }

  html = html
    // titles and headings
    .replace(/Light\s+demo/gi, 'Image demo')
    .replace(/<title>[^<]*<\/title>/i, '<title>Abando – Image demo</title>')
    // copy updates
    .replace(/See how our AI cart co[\s\S]*?light UI\./i, 'Quick, static preview of the chat experience (not interactive).')
    // buttons
    .replace(/Back to dark demo/gi, 'Back to demo')
    // ensure no “light” label remains
    .replace(/light\s+demo/gi, 'image demo');

  // Make sure container exists and write
  write(dst, html);
}

// 3) Optional redirect: keep /demo/light/ working (301-ish via HTML)
{
  const old = path.join(PUB, 'demo', 'light', 'index.html');
  if (!exists(old)) {
    const redirect = `<!doctype html><meta http-equiv="refresh" content="0; url=/demo/preview/"><link rel="canonical" href="/demo/preview/">`;
    write(old, redirect);
  }
}

// 4) Playground: ensure button/copy uses “Playground”
{
  const fp = path.join(PUB, 'demo', 'index.html');
  if (exists(fp)) {
    let html = read(fp);
    // If you want a Playground button near the pricing button:
    if (!/\/demo\/playground/.test(html)) {
      html = html.replace(
        /(<div class="buttons">[\s\S]*?<\/div>)/,
        `$1\n<p class="note">Want to try an interactive version? Visit the <a href="/demo/playground/">Playground</a>.</p>`
      );
    }
    write(fp, html);
  }
}

console.log('✓ Renamed to "Image demo" and set /demo/preview/. Playground unchanged.');
