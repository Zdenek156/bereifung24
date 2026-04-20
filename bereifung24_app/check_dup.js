const fs = require('fs');
const c = fs.readFileSync('lib/l10n/app_de.arb', 'utf8');
const lines = c.split('\n');
const seen = {};
lines.forEach((line, i) => {
  const m = line.match(/^\s*"([^@][^"]+)"\s*:/);
  if (m) {
    if (seen[m[1]] !== undefined) console.log('DUP:', m[1], 'lines', seen[m[1]]+1, 'and', i+1);
    else seen[m[1]] = i;
  }
});
console.log('Done');
