// Extract legal text content from page files and generate SQL
const fs = require('fs');
const path = require('path');

const files = [
  { key: 'agb', file: 'app/agb/page.tsx', varName: 'agbContent' },
  { key: 'datenschutz', file: 'app/datenschutz/page.tsx', varName: 'datenschutzContent' },
  { key: 'impressum', file: 'app/impressum/page.tsx', varName: 'impressumContent' },
];

const titles = {
  agb: 'Allgemeine Geschäftsbedingungen',
  datenschutz: 'Datenschutzerklärung',
  impressum: 'Impressum',
};

let sql = '';

for (const { key, file, varName } of files) {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
  // Match double-quoted string
  const regex = new RegExp(`const ${varName} = "([\\s\\S]*?)";`);
  const match = content.match(regex);
  if (!match) {
    console.error(`Could not find ${varName} in ${file}`);
    continue;
  }
  const html = match[1].replace(/'/g, "''"); // Escape single quotes for SQL
  const title = titles[key].replace(/'/g, "''");
  
  // Update both app and web targets
  sql += `UPDATE legal_texts SET title = '${title}', content = '${html}', version = 1, updated_at = NOW() WHERE key = '${key}' AND target = 'app';\n`;
  sql += `UPDATE legal_texts SET title = '${title}', content = '${html}', version = 1, updated_at = NOW() WHERE key = '${key}' AND target = 'web';\n`;
  console.log(`OK: ${key} - ${html.length} chars`);
}

fs.writeFileSync(path.join(__dirname, 'update_legal_texts.sql'), sql);
console.log(`Generated update_legal_texts.sql (${sql.length} chars)`);
