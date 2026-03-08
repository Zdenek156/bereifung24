const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const ws = await p.workshopService.findFirst({
    where: { workshopId: 'cml3g7rxd000ckeyn9ypqgg65', serviceType: 'MOTORCYCLE_TIRE' },
    include: { servicePackages: true }
  })
  console.log('Luxus24 MOTORCYCLE_TIRE:', JSON.stringify(ws, null, 2))
  process.exit(0)
}
main()
