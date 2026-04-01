const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

function fetchPage(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function extractContent(html) {
  // Try multiple patterns: "prose" class first, then "space-y-" with "text-gray-700"
  let markers = ['class="prose', 'class="space-y-8 text-gray-700', 'class="space-y-6 text-gray-700'];
  let proseStart = -1;
  
  for (const marker of markers) {
    proseStart = html.indexOf(marker);
    if (proseStart !== -1) break;
  }
  
  if (proseStart === -1) return null;
  
  const tagEnd = html.indexOf('>', proseStart);
  if (tagEnd === -1) return null;
  
  let depth = 1;
  let pos = tagEnd + 1;
  while (depth > 0 && pos < html.length) {
    const nextOpen = html.indexOf('<div', pos);
    const nextClose = html.indexOf('</div>', pos);
    
    if (nextClose === -1) break;
    
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) {
        return html.substring(tagEnd + 1, nextClose);
      }
      pos = nextClose + 6;
    }
  }
  return null;
}

async function main() {
  try {
    console.log('Fetching AGB page...');
    const agbHtml = await fetchPage('/agb');
    const agbContent = extractContent(agbHtml);
    
    console.log('Fetching Datenschutz page...');
    const dsHtml = await fetchPage('/datenschutz');
    const dsContent = extractContent(dsHtml);
    
    console.log('Fetching Impressum page...');
    const impHtml = await fetchPage('/impressum');
    const impContent = extractContent(impHtml);
    
    if (!agbContent) { console.error('Could not extract AGB content'); process.exit(1); }
    if (!dsContent) { console.error('Could not extract Datenschutz content'); process.exit(1); }
    if (!impContent) { console.error('Could not extract Impressum content'); process.exit(1); }
    
    console.log('AGB content length:', agbContent.length);
    console.log('Datenschutz content length:', dsContent.length);
    console.log('Impressum content length:', impContent.length);
    
    // Use raw SQL since Prisma client may not reflect new model yet
    const texts = [
      { key: 'agb', title: 'Allgemeine Geschäftsbedingungen (AGB)', content: agbContent },
      { key: 'datenschutz', title: 'Datenschutzerklärung', content: dsContent },
      { key: 'impressum', title: 'Impressum', content: impContent },
    ];

    for (const t of texts) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO legal_texts (id, key, title, content, version, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, 1, NOW(), NOW())
         ON CONFLICT (key) DO UPDATE SET title = $2, content = $3, updated_at = NOW()`,
        t.key, t.title, t.content
      );
      console.log(t.key + ' inserted');
    }
    
    console.log('Done! All legal texts seeded.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
