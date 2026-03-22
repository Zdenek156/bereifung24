// seed_legal_texts.js - Converts existing JSX legal pages to HTML and seeds the database
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

function jsxToHtml(jsxContent) {
  // Extract only the content inside the prose div (the actual legal text)
  // Find the prose div content
  let match = jsxContent.match(/className="prose[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\s*\}/);
  if (!match) {
    // fallback: try to capture everything after prose
    match = jsxContent.match(/className="prose[^"]*"[^>]*>([\s\S]*?)(?:\s*<\/div>){3,}/);
  }
  
  let html = match ? match[1] : jsxContent;
  
  // Remove JSX comments {/* ... */}
  html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  
  // Replace className with class
  html = html.replace(/className=/g, 'class=');
  
  // Replace JSX expressions like {`text`} with text
  html = html.replace(/\{`([^`]*)`\}/g, '$1');
  
  // Replace &quot; with "
  html = html.replace(/&quot;/g, '"');
  
  // Remove <Link> components, replace with <a>
  html = html.replace(/<Link\s+href="([^"]*)"[^>]*>/g, '<a href="$1">');
  html = html.replace(/<\/Link>/g, '</a>');
  
  // Remove SVG icons (they're decorative)
  html = html.replace(/<svg[\s\S]*?<\/svg>/g, '');
  
  // Remove JSX self-closing tag attributes like strokeLinecap etc
  html = html.replace(/strokeLinecap/g, 'stroke-linecap');
  html = html.replace(/strokeLinejoin/g, 'stroke-linejoin');
  html = html.replace(/strokeWidth/g, 'stroke-width');
  html = html.replace(/viewBox/g, 'viewBox');
  
  // Replace JSX curlies for attributes: strokeWidth={2} -> stroke-width="2"
  html = html.replace(/=\{(\d+)\}/g, '="$1"');
  html = html.replace(/=\{["']([^"']*?)["']\}/g, '="$1"');
  html = html.replace(/=\{true\}/g, '');
  html = html.replace(/=\{false\}/g, '');
  
  // Remove remaining {expression} JSX expressions (e.g. {' '})  
  html = html.replace(/\{' '\}/g, ' ');
  html = html.replace(/\{" "\}/g, ' ');
  html = html.replace(/\{'\s*'\}/g, ' ');
  
  // Clean up double spaces
  html = html.replace(/  +/g, ' ');
  
  // Remove empty lines
  html = html.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Remove Tailwind classes that won't work in plain HTML rendering  
  // Keep class attributes but simplify them for the prose renderer
  
  return html.trim();
}

async function main() {
  const files = [
    {
      key: 'agb',
      title: 'Allgemeine Geschäftsbedingungen (AGB)',
      path: '/var/www/bereifung24/app/agb/page.tsx'
    },
    {
      key: 'impressum',
      title: 'Impressum',
      path: '/var/www/bereifung24/app/impressum/page.tsx'
    },
    {
      key: 'datenschutz',
      title: 'Datenschutzerklärung',
      path: '/var/www/bereifung24/app/datenschutz/page.tsx'
    }
  ];

  for (const file of files) {
    try {
      const jsx = fs.readFileSync(file.path, 'utf8');
      const html = jsxToHtml(jsx);
      
      const existing = await prisma.legalText.findUnique({ where: { key: file.key } });
      
      if (existing) {
        console.log(`${file.key}: Already exists (version ${existing.version}), skipping`);
        continue;
      }
      
      await prisma.legalText.create({
        data: {
          id: file.key + '_initial',
          key: file.key,
          title: file.title,
          content: html,
          version: 1,
          lastUpdatedBy: 'system-seed',
        }
      });
      
      console.log(`${file.key}: Seeded successfully (${html.length} chars)`);
    } catch (err) {
      console.error(`${file.key}: Error - ${err.message}`);
    }
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
