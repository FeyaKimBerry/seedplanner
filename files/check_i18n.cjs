const fs = require('fs');
const s = fs.readFileSync('src/App.jsx', 'utf8');
const start = s.indexOf('const STR = {');
const objStart = s.indexOf('{', start);
let depth = 0, i = objStart, end = -1;
for (; i < s.length; i++) { const c = s[i]; if (c === '{') depth++; else if (c === '}') { depth--; if (depth === 0) { end = i; break; } } }
const STR = eval('(' + s.slice(objStart, end + 1) + ')');
const ref = Object.keys(STR.en); let ok = true;
for (const l of Object.keys(STR)) {
  const keys = new Set(Object.keys(STR[l]));
  const missing = ref.filter(k => !keys.has(k));
  const extra = Object.keys(STR[l]).filter(k => !ref.includes(k));
  const empty = Object.entries(STR[l]).filter(([k, v]) => !v).map(([k]) => k);
  if (missing.length || extra.length || empty.length) { ok = false; console.log(l, 'missing', missing, 'extra', extra, 'empty', empty); }
}
console.log(ok ? 'PARITY OK (' + ref.length + ' keys)' : 'MISMATCH');
