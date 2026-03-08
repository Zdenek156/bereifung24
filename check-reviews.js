const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const ws = await p.workshop.findMany({
    where: { isVerified: true },
    select: { companyName: true, id: true }
  })
  for (const w of ws) {
    const c = await p.review.count({ where: { workshopId: w.id } })
    const a = await p.review.aggregate({ where: { workshopId: w.id }, _avg: { rating: true } })
    console.log(`${w.companyName}: ${c} reviews, avg: ${a._avg.rating || 0}`)
  }
  const total = await p.review.count()
  console.log(`\nTotal reviews in DB: ${total}`)
  await p.$disconnect()
}
main()
