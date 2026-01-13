const fs = require('fs');
const path = require('path');

// All admin pages that contain /admin/ links
const files = [
  'app/admin/buchhaltung/auswertungen/page.tsx',
  'app/admin/buchhaltung/auswertungen/bwa/page.tsx',
  'app/admin/buchhaltung/auswertungen/euer/page.tsx',
  'app/admin/buchhaltung/auswertungen/summen-salden/page.tsx',
  'app/admin/buchhaltung/auswertungen/ustva/page.tsx',
  'app/admin/buchhaltung/belege/page.tsx',
  'app/admin/buchhaltung/einstellungen/page.tsx',
  'app/admin/buchhaltung/journal/page.tsx',
  'app/admin/buchhaltung/kontenplan/page.tsx',
  'app/admin/buchhaltung/manuelle-buchung/page.tsx',
  'app/admin/buchhaltung/rueckstellungen/page.tsx',
  'app/admin/procurement/page.tsx',
  'app/admin/procurement/assets/page.tsx',
  'app/admin/procurement/budget/page.tsx',
  'app/admin/procurement/orders/page.tsx',
  'app/admin/procurement/requests/page.tsx',
  'app/admin/procurement/requests/new/page.tsx',
  'app/admin/procurement/requests/[id]/page.tsx',
  'app/admin/procurement/suppliers/page.tsx',
  'app/admin/sales/page.tsx',
  'app/admin/settings/page.tsx',
  'app/admin/email-templates/page.tsx',
  'app/admin/email-templates/[id]/page.tsx',
  'app/admin/notifications/page.tsx',
  'app/admin/workshops/page.tsx',
  'app/admin/customers/page.tsx'
];

let totalFixed = 0;

files.forEach(file => {
  const filePath = path.join('C:\\Bereifung24\\Bereifung24 Workspace', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Skip if already uses useRoleBasedUrl
  if (content.includes('useRoleBasedUrl')) {
    console.log(`✅ Already using useRoleBasedUrl: ${file}`);
    return;
  }
  
  // Add import if not present
  if (!content.includes("from '@/lib/utils/roleBasedUrl'")) {
    // Find the last import statement
    const importRegex = /^import .+ from .+$/gm;
    const imports = content.match(importRegex);
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      content = content.replace(lastImport, lastImport + "\nimport { useRoleBasedUrl } from '@/lib/utils/roleBasedUrl'");
      console.log(`  + Added import to ${file}`);
    }
  }
  
  // Add hook declaration after function start
  if (!content.includes('const getUrl = useRoleBasedUrl()')) {
    // Find function declaration
    const functionMatch = content.match(/export default function \w+\([^)]*\) {[\s\S]*?(?=\n  const |  use|  \[)/);
    if (functionMatch) {
      const functionDecl = functionMatch[0];
      content = content.replace(functionDecl, functionDecl + '\n  const getUrl = useRoleBasedUrl()');
      console.log(`  + Added useRoleBasedUrl hook to ${file}`);
    }
  }
  
  // Replace all href="/admin/ with href={getUrl("/admin/
  const hrefRegex = /href="(\/admin\/[^"]+)"/g;
  const matches = content.match(hrefRegex);
  
  if (matches && matches.length > 0) {
    content = content.replace(hrefRegex, 'href={getUrl("$1")}');
    console.log(`  ✓ Fixed ${matches.length} hrefs in ${file}`);
    totalFixed += matches.length;
  }
  
  // Only save if content changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  💾 Saved ${file}`);
  } else {
    console.log(`  ⏭️  No changes needed for ${file}`);
  }
});

console.log(`\n✅ Done! Fixed ${totalFixed} total href attributes across ${files.length} files`);
