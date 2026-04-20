const fs = require('fs');

['app_de.arb'].forEach(file => {
  const path = `lib/l10n/${file}`;
  const c = fs.readFileSync(path, 'utf8');
  const lines = c.split('\n');
  const seen = new Set();
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^\s*"([^"]+)"\s*:/);
    if (m) {
      const key = m[1];
      // Skip @-prefixed metadata keys from dedup (they follow their parent)
      if (key.startsWith('@')) {
        // Check if the parent key was kept
        const parentKey = key.substring(1);
        if (seen.has(parentKey)) {
          // Only keep first @metadata
          const metaKey = key;
          if (seen.has(metaKey)) {
            continue; // skip duplicate metadata
          }
          seen.add(metaKey);
          result.push(line);
        }
        continue;
      }
      if (seen.has(key)) {
        // Skip duplicate - also skip its @metadata on next line
        if (i + 1 < lines.length && lines[i+1].match(new RegExp(`^\\s*"@${key}"`))) {
          i++; // skip metadata line too
        }
        continue;
      }
      seen.add(key);
    }
    result.push(line);
  }
  
  fs.writeFileSync(path, result.join('\n'));
  console.log(`Fixed ${file}: ${lines.length} -> ${result.length} lines`);
});
