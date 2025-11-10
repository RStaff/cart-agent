const fs = require('fs');
const p = 'src/components/Navbar.tsx';
let s = fs.readFileSync(p, 'utf8');

// normalize brand anchor to home only if it's the brand link line
s = s.replace(/(<(?:a|Link)\b[^>]*className=["'][^"']*brand[^"']*["'][^>]*\bhref=)["'][^"']*["']/i, '$1"/"');

// normalize any logo src (img or Image) to /abando-logo.png
s = s.replace(/(<(?:img|Image)\b[^>]*\bsrc=)["'][^"']*["']/ig, '$1"/abando-logo.png"');

// ensure alt text says "Abando logo"
if (/alt=/.test(s)) {
  s = s.replace(/alt=\s*["'][^"']*["']/ig, 'alt="Abando logo"');
} else {
  s = s.replace(/(<(?:img|Image)\b[^>]*)(>)/i, '$1 alt="Abando logo"$2');
}

fs.writeFileSync(p, s, 'utf8');
console.log('✅ Navbar.tsx patched: src=/abando-logo.png, alt=Abando logo');
