// Test script to check job postings
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function test() {
  try {
    console.log('Connecting to database...')
    
    const count = await prisma.jobPosting.count()
    console.log('JobPosting count:', count)
    
    const jobPostings = await prisma.jobPosting.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('Found', jobPostings.length, 'job postings')
    console.log('First posting:', jobPostings[0] || 'None')
    
  } catch (error) {
    console.error('ERROR:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

test()
