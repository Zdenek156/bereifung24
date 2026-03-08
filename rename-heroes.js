const { PrismaClient } = require('@prisma/client');
const { rename, existsSync } = require('fs');
const { join } = require('path');
const { promisify } = require('util');
const renameAsync = promisify(rename);

const prisma = new PrismaClient();

async function main() {
  const lps = await prisma.workshopLandingPage.findMany({
    where: { heroImage: { not: null } },
    select: {
      id: true,
      heroImage: true,
      workshop: { select: { companyName: true, user: { select: { city: true } } } }
    }
  });

  for (const lp of lps) {
    const workshop = lp.workshop;
    const oldPath = lp.heroImage;
    const extension = oldPath.split('.').pop();
    const timestamp = Date.now();

    const slugName = (workshop.companyName || 'werkstatt')
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slugCity = (workshop.user?.city || '')
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const newFilename = `werkstatt-${slugName}${slugCity ? `-${slugCity}` : ''}-hero-${timestamp}.${extension}`;
    const newPath = `/uploads/landing-pages/${newFilename}`;

    const oldFullPath = join(process.cwd(), 'public', oldPath);
    const newFullPath = join(process.cwd(), 'public', newPath);

    console.log(`\n${workshop.companyName} (${workshop.city}):`);
    console.log(`  Old: ${oldPath}`);
    console.log(`  New: ${newPath}`);

    if (existsSync(oldFullPath)) {
      await renameAsync(oldFullPath, newFullPath);
      await prisma.workshopLandingPage.update({
        where: { id: lp.id },
        data: { heroImage: newPath }
      });
      console.log('  ✅ Renamed & DB updated');
    } else {
      console.log('  ❌ File not found on disk!');
    }

    // Small delay so timestamps differ
    await new Promise(r => setTimeout(r, 100));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
