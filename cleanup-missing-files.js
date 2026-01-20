const { PrismaClient } = require('@prisma/client')
const { existsSync } = require('fs')
const { join } = require('path')

const prisma = new PrismaClient()

async function cleanupMissingFiles() {
  try {
    const UPLOAD_DIR = join(process.cwd(), 'uploads', 'files')
    
    // Get all files from database
    const files = await prisma.fileUpload.findMany({
      select: {
        id: true,
        name: true,
        storagePath: true
      }
    })

    console.log(`Checking ${files.length} files...`)
    
    const missingFiles = []
    for (const file of files) {
      const filePath = join(UPLOAD_DIR, file.storagePath)
      if (!existsSync(filePath)) {
        missingFiles.push(file)
      }
    }

    console.log(`\nFound ${missingFiles.length} missing files`)
    
    if (missingFiles.length > 0) {
      console.log('\nDeleting database entries for missing files...')
      
      for (const file of missingFiles) {
        await prisma.fileUpload.delete({
          where: { id: file.id }
        })
        console.log(`  ✅ Deleted: ${file.name}`)
      }
      
      console.log(`\n✅ Cleanup complete! Removed ${missingFiles.length} broken file references.`)
    } else {
      console.log('\n✅ All files are present on disk!')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupMissingFiles()
