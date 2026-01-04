import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Schema Extension for Employee Portal
// Run with: npx prisma db push

/*

-- Add to schema.prisma:

model EmployeeProfile {
  id        String   @id @default(cuid())
  employeeId String  @unique
  employee   B24Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  
  // Personal Information
  birthDate      DateTime?
  birthPlace     String?
  nationality    String?
  address        String?
  city           String?
  postalCode     String?
  country        String?   @default("Deutschland")
  
  // Tax & Social Security (Encrypted)
  taxId              String? // Steuer-ID
  socialSecurityId   String? // Sozialversicherungsnummer
  taxClass           String? // Steuerklasse (I, II, III, IV, V, VI)
  
  // Banking (Encrypted)
  bankAccount    String? // IBAN
  bankName       String?
  bic            String?
  
  // Emergency Contact
  emergencyContactName  String?
  emergencyContactPhone String?
  emergencyContactRelation String?
  
  // Profile
  profileImageUrl String?
  bio             String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("employee_profiles")
}

model EmployeeDocument {
  id         String   @id @default(cuid())
  employeeId String
  employee   B24Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  
  type       String   // contract, payslip, certificate, tax, social_security, other
  title      String
  description String?
  fileName   String
  fileSize   Int
  mimeType   String
  fileUrl    String   // Encrypted path
  
  uploadedById String
  uploadedBy   B24Employee @relation("DocumentUploader", fields: [uploadedById], references: [id])
  uploadedAt   DateTime @default(now())
  
  // Access Control
  accessLog    Json[]   // [{userId, accessedAt, ip}]
  
  // Metadata
  category     String?
  tags         String[]
  validFrom    DateTime?
  validUntil   DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("employee_documents")
}

model LeaveBalance {
  id         String   @id @default(cuid())
  employeeId String   @unique
  employee   B24Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  
  year           Int
  totalDays      Float    @default(30) // Gesetzlicher Anspruch
  usedDays       Float    @default(0)
  pendingDays    Float    @default(0)
  remainingDays  Float    @default(30)
  
  // Übertrag aus Vorjahr
  carryOverDays  Float    @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([employeeId, year])
  @@map("leave_balances")
}

model LeaveRequest {
  id         String   @id @default(cuid())
  employeeId String
  employee   B24Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  
  type       String   // vacation, sick, special, unpaid
  startDate  DateTime
  endDate    DateTime
  days       Float    // Arbeitstage
  
  reason     String?
  notes      String?
  
  status     String   @default("pending") // pending, approved, rejected, cancelled
  
  approvedById String?
  approvedBy   B24Employee? @relation("LeaveApprover", fields: [approvedById], references: [id])
  approvedAt   DateTime?
  rejectionReason String?
  
  // Vertretung
  substituteId String?
  substitute   B24Employee? @relation("LeaveSubstitute", fields: [substituteId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("leave_requests")
}

model SickLeave {
  id         String   @id @default(cuid())
  employeeId String
  employee   B24Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  
  startDate  DateTime
  endDate    DateTime?
  expectedReturnDate DateTime?
  actualReturnDate   DateTime?
  
  certificateRequired Boolean @default(true)
  certificateUrl      String?  // AU-Bescheinigung
  certificateUploadedAt DateTime?
  
  notes      String?
  
  notifiedAt DateTime @default(now())
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("sick_leaves")
}

*/

async function main() {
  console.log('Schema extension ready. Please add models to schema.prisma and run: npx prisma db push')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
