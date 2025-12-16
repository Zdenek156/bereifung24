const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const booking = await prisma.booking.findFirst({
    where: {
      tireRequestId: 'cmj7n3iyf0001xzzlsck9ymlv'
    },
    include: {
      employee: {
        select: {
          name: true,
          googleCalendarId: true
        }
      }
    }
  })
  console.log('Booking:', JSON.stringify(booking, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
