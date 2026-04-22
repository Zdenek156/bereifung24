// Bereinigt fehlerhafte Prospect-Emails (z.B. "71665name@gmail.cominfos" → "name@gmail.com")
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

const KNOWN_TLDS = ['com', 'net', 'org', 'info', 'shop', 'biz', 'eu', 'de', 'at', 'ch', 'co', 'io', 'app', 'dev']

function cleanEmail(raw) {
  if (!raw) return raw
  let e = String(raw).toLowerCase().trim().replace(/^[._%+\-]+/, '').replace(/[._%+\-]+$/, '')
  const at = e.indexOf('@')
  if (at < 1 || at === e.length - 1) return raw
  let local = e.slice(0, at)
  let domain = e.slice(at + 1)
  local = local.replace(/^\d{5}(?=[a-z])/, '')
  const labels = domain.split('.')
  if (labels.length < 2) return raw
  const tld = labels[labels.length - 1]
  if (tld.length > 4) {
    const known = KNOWN_TLDS.find((k) => tld.startsWith(k))
    if (known) labels[labels.length - 1] = known
  }
  domain = labels.join('.')
  return `${local}@${domain}`
}

async function main() {
  const prospects = await p.prospectWorkshop.findMany({
    where: { email: { not: null } },
    select: { id: true, name: true, email: true },
  })

  let updated = 0
  for (const pr of prospects) {
    const cleaned = cleanEmail(pr.email)
    if (cleaned && cleaned !== pr.email) {
      console.log(`  ${pr.name}:`)
      console.log(`    alt: ${pr.email}`)
      console.log(`    neu: ${cleaned}`)
      await p.prospectWorkshop.update({ where: { id: pr.id }, data: { email: cleaned } })
      updated++
    }
  }
  console.log(`\nFertig! ${updated}/${prospects.length} Emails bereinigt.`)
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
