const fs = require('fs');
const path = '/var/www/bereifung24/prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf8');

// Fix the corrupted @@map line
content = content.replace('@@map(" legal_texts\\)', '@@map("legal_texts")');

fs.writeFileSync(path, content);
console.log('Schema fixed');

// verify
const fixed = fs.readFileSync(path, 'utf8');
const match = fixed.match(/@@map\("legal_texts"\)/);
console.log('Fix verified:', !!match);
