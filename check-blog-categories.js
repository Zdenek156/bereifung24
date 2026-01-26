const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function check() {
  const categories = await prisma.blogCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      slug: true,
      name: true,
      icon: true,
      color: true,
      sortOrder: true,
      _count: {
        select: { posts: true }
      }
    }
  })

  console.log('\n📊 Blog Kategorien in der Datenbank:\n')
  console.log('┌─────┬────────────────────────┬──────┬─────────┬─────────┐')
  console.log('│ Nr. │ Name                   │ Icon │ Color   │ Posts   │')
  console.log('├─────┼────────────────────────┼──────┼─────────┼─────────┤')
  
  categories.forEach((cat, idx) => {
    const nr = String(idx + 1).padEnd(3)
    const name = cat.name.padEnd(22)
    const icon = cat.icon.padEnd(4)
    const color = cat.color.padEnd(7)
    const posts = String(cat._count.posts).padEnd(7)
    console.log(`│ ${nr} │ ${name} │ ${icon} │ ${color} │ ${posts} │`)
  })
  
  console.log('└─────┴────────────────────────┴──────┴─────────┴─────────┘')
  console.log(`\n✅ Total: ${categories.length} Kategorien`)
  
  await prisma.$disconnect()
}

check()
