const { PrismaClient } = require('@prisma/client')
const { existsSync } = require('fs')
const { join } = require('path')

const prisma = new PrismaClient()

async function checkFiles() {
  try {
    const files = await prisma.fileUpload.findMany({
      select: {
        id: true,
        name: true,
        storagePath: true,
        size: true,
        uploadedBy: {
          select: {
            email: true
          }
        },
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    console.log(`\n=== Found ${files.length} files in database ===\n`)

    const UPLOAD_DIR = join(process.cwd(), 'uploads', 'files')
    console.log(`Expected upload directory: ${UPLOAD_DIR}\n`)

    for (const file of files) {
      const filePath = join(UPLOAD_DIR, file.storagePath)
      const exists = existsSync(filePath)
      
      console.log(`File: ${file.name}`)
      console.log(`  ID: ${file.id}`)
      console.log(`  Storage Path: ${file.storagePath}`)
      console.log(`  Full Path: ${filePath}`)
      console.log(`  Size: ${(file.size / 1024).toFixed(2)} KB`)
      console.log(`  Uploaded by: ${file.uploadedBy?.email || 'Unknown'}`)
      console.log(`  Created: ${file.createdAt}`)
      console.log(`  Exists on disk: ${exists ? '✅' : '❌'}`)
      console.log('')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkFiles()
