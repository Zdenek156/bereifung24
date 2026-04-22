// Ersetzt 'werkstatt-werden' und 'werkstatt-anmelden' → 'werkstatt' in allen Outreach-Emails
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

function fix(s) {
  if (!s) return s
  return s
    .replace(/bereifung24\.de\/werkstatt-anmelden/g, 'bereifung24.de/werkstatt')
    .replace(/bereifung24\.de\/werkstatt-werden/g, 'bereifung24.de/werkstatt')
}

async function main() {
  const found = await p.prospectOutreachEmail.findMany({
    where: {
      OR: [
        { body: { contains: 'werkstatt-werden' } },
        { subject: { contains: 'werkstatt-werden' } },
        { bodyHtml: { contains: 'werkstatt-werden' } },
        { body: { contains: 'werkstatt-anmelden' } },
        { subject: { contains: 'werkstatt-anmelden' } },
        { bodyHtml: { contains: 'werkstatt-anmelden' } },
      ],
    },
    select: { id: true, status: true, subject: true, body: true, bodyHtml: true },
  })
  console.log(`Gefunden: ${found.length} Emails`)

  let updated = 0
  for (const email of found) {
    await p.prospectOutreachEmail.update({
      where: { id: email.id },
      data: {
        subject: fix(email.subject),
        body: fix(email.body),
        bodyHtml: fix(email.bodyHtml),
      },
    })
    updated++
    console.log(`  ✓ ${email.status} - ${email.subject?.substring(0, 60)}`)
  }
  console.log(`\nFertig! ${updated} aktualisiert.`)
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
