const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTables() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE 'blog%'
      ORDER BY tablename
    `
    console.log('Blog tables:', tables)
    
    // Try to count blog posts
    const postCount = await prisma.blogPost.count().catch(e => {
      console.error('Error counting blog posts:', e.message)
      return null
    })
    console.log('Blog post count:', postCount)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()
