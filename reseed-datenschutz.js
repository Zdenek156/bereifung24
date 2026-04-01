const fs = require('fs');

async function main() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const html = fs.readFileSync('/tmp/ds.html', 'utf-8');
  
  // Find the content div: <div class="space-y-8 text-gray-700">...</div>
  const startMarker = '<div class="space-y-8 text-gray-700">';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) {
    console.error('ERROR: Could not find content start marker');
    process.exit(1);
  }
  
  // Extract from after the opening div tag
  const contentStart = startIdx + startMarker.length;
  
  // Find the matching closing div by counting nesting
  let depth = 1;
  let pos = contentStart;
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
        var content = html.substring(contentStart, nextClose).trim();
      }
      pos = nextClose + 6;
    }
  }

  if (!content || content.length < 100) {
    console.error('ERROR: Could not extract content, length:', content ? content.length : 0);
    process.exit(1);
  }

  console.log('Extracted content length:', content.length);

  await prisma.$executeRawUnsafe(
    "UPDATE legal_texts SET content = $1, updated_at = NOW() WHERE key = 'datenschutz'",
    content
  );

  console.log('SUCCESS: datenschutz updated in legal_texts');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
