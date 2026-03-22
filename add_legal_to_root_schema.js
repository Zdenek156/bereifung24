const fs = require('fs');
const path = '/var/www/bereifung24/schema.prisma';
let content = fs.readFileSync(path, 'utf8');

if (content.includes('model LegalText')) {
  console.log('LegalText model already exists in root schema');
  process.exit(0);
}

const model = `

// ============================================
// LEGAL TEXTS MANAGEMENT
// ============================================
model LegalText {
  id        String   @id @default(cuid())
  key       String   @unique // 'agb', 'impressum', 'datenschutz'
  title     String
  content   String   @db.Text
  version   Int      @default(1)
  isActive  Boolean  @default(true)
  lastUpdatedBy String?
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  @@map("legal_texts")
}
`;

content += model;
fs.writeFileSync(path, content);
console.log('LegalText model added to root schema.prisma');
