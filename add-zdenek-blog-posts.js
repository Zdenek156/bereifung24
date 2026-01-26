const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get first active employee
    const employee = await prisma.b24Employee.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    if (!employee) {
      throw new Error('No active employee found');
    }

    console.log(`Found employee: ${employee.firstName} ${employee.lastName} (${employee.email})`);

    // Get categories
    const categoryReifenwissen = await prisma.blogCategory.findUnique({ where: { slug: 'reifenwissen' } });
    const categoryWerkstaetten = await prisma.blogCategory.findUnique({ where: { slug: 'werkstatten' } });
    const categoryRegional = await prisma.blogCategory.findUnique({ where: { slug: 'regional' } });

    console.log('Categories:', {
      reifenwissen: categoryReifenwissen?.id,
      werkstaetten: categoryWerkstaetten?.id,
      regional: categoryRegional?.id
    });

    // Get tags
    const tagStuttgart = await prisma.blogTag.findUnique({ where: { slug: 'stuttgart' } });
    const tagSicherheit = await prisma.blogTag.findUnique({ where: { slug: 'sicherheit' } });
    const tagWerkstatt = await prisma.blogTag.findUnique({ where: { slug: 'werkstatt-tipps' } });
    const tagRatgeber = await prisma.blogTag.findUnique({ where: { slug: 'ratgeber' } });
    const tagGesetzgebung = await prisma.blogTag.findUnique({ where: { slug: 'gesetzgebung' } });

    console.log('Tags:', {
      stuttgart: tagStuttgart?.id,
      sicherheit: tagSicherheit?.id,
      werkstatt: tagWerkstatt?.id,
      ratgeber: tagRatgeber?.id,
      gesetzgebung: tagGesetzgebung?.id
    });

    const posts = [
      {
        title: 'Sommerreifen-Wechsel in Stuttgart: Der ultimative Guide für 2026',
        slug: 'sommerreifen-wechsel-stuttgart-guide-2026',
        excerpt: 'Wann ist der richtige Zeitpunkt für den Wechsel auf Sommerreifen in Stuttgart? Alle wichtigen Infos zu Zeitpunkt, Kosten und den besten Werkstätten in der Region.',
        content: '<p>Placeholder content - wird manuell ergänzt</p>',
        categoryId: categoryRegional.id,
        status: 'DRAFT',
        targetAudience: 'CUSTOMER',
        metaTitle: 'Sommerreifen-Wechsel Stuttgart 2026: Zeitpunkt, Kosten & beste Werkstätten',
        metaDescription: 'Wann sollten Sie in Stuttgart auf Sommerreifen wechseln? Alle Infos zu optimalen Zeitpunkt, Kosten, rechtlichen Grundlagen und den besten Werkstätten in Stuttgart.',
        keywords: ['Sommerreifen', 'Stuttgart', 'Reifenwechsel', 'Werkstatt Stuttgart', 'O bis O Regel', 'Kosten Reifenwechsel'],
        readTime: 8,
        tags: [tagStuttgart.id, tagRatgeber.id, tagSicherheit.id]
      },
      {
        title: 'RDKS-Pflicht 2026: Alles über das Reifendruckkontrollsystem',
        slug: 'rdks-reifendruckkontrollsystem-pflicht-2026',
        excerpt: 'Was Sie über das Reifendruckkontrollsystem (RDKS) wissen müssen: Gesetzliche Pflicht, Funktion, Kosten und häufige Fehler beim Reifenwechsel.',
        content: '<p>Placeholder content - wird manuell ergänzt</p>',
        categoryId: categoryReifenwissen.id,
        status: 'DRAFT',
        targetAudience: 'BOTH',
        metaTitle: 'RDKS-Pflicht 2026: Alles über Reifendruckkontrollsystem | Funktion, Kosten, Wartung',
        metaDescription: 'RDKS (Reifendruckkontrollsystem) Pflicht 2026: Erfahren Sie alles über direktes & indirektes TPMS, Kosten, Reifenwechsel, TÜV-Anforderungen und häufige Fehler.',
        keywords: ['RDKS', 'Reifendruckkontrollsystem', 'TPMS', 'Reifendruck', 'TÜV', 'Reifenwechsel', 'Sensoren'],
        readTime: 7,
        tags: [tagRatgeber.id, tagSicherheit.id, tagGesetzgebung.id]
      },
      {
        title: 'Lokales SEO für Werkstätten in Stuttgart: Mehr Kunden gewinnen',
        slug: 'lokales-seo-werkstaetten-stuttgart-kunden-gewinnen',
        excerpt: 'Wie Werkstätten in Stuttgart mit lokalem SEO und Online-Marketing mehr Kunden gewinnen. Praktische Tipps für Google My Business, Bewertungen und lokale Sichtbarkeit.',
        content: '<p>Placeholder content - wird manuell ergänzt</p>',
        categoryId: categoryWerkstaetten.id,
        status: 'DRAFT',
        targetAudience: 'WORKSHOP',
        metaTitle: 'Lokales SEO für Werkstätten Stuttgart: Mehr Kunden durch Google My Business',
        metaDescription: 'Lokales SEO für Werkstätten in Stuttgart: Optimieren Sie Google My Business, sammeln Sie Bewertungen und erhöhen Sie Ihre Sichtbarkeit für lokale Kunden. Praktischer Guide.',
        keywords: ['Lokales SEO', 'Werkstatt Marketing', 'Google My Business', 'Stuttgart', 'Online Marketing', 'Bewertungen'],
        readTime: 10,
        tags: [tagWerkstatt.id, tagStuttgart.id, tagRatgeber.id]
      },
      {
        title: 'Reifenalterung erkennen: Wann müssen Reifen entsorgt werden?',
        slug: 'reifenalterung-erkennen-wann-reifen-entsorgen',
        excerpt: 'Wie alt dürfen Autoreifen sein? Lernen Sie die Warnzeichen von Reifenalterung zu erkennen und vermeiden Sie gefährliche Situationen durch alte oder beschädigte Reifen.',
        content: '<p>Placeholder content - wird manuell ergänzt</p>',
        categoryId: categoryReifenwissen.id,
        status: 'DRAFT',
        targetAudience: 'CUSTOMER',
        metaTitle: 'Reifenalterung erkennen: DOT-Nummer lesen & Schäden identifizieren',
        metaDescription: 'Wie alt dürfen Reifen sein? Lernen Sie die DOT-Nummer zu lesen, Reifenschäden zu erkennen und wann Autoreifen ausgetauscht werden müssen. Mit Checkliste.',
        keywords: ['Reifenalterung', 'DOT-Nummer', 'Reifenschäden', 'Reifen prüfen', 'Reifenwechsel', 'Sicherheit'],
        readTime: 9,
        tags: [tagRatgeber.id, tagSicherheit.id, tagGesetzgebung.id]
      },
      {
        title: 'E-Auto-Reifen: Was ist anders bei Elektrofahrzeugen?',
        slug: 'e-auto-reifen-elektrofahrzeuge-besonderheiten',
        excerpt: 'Brauchen Elektroautos spezielle Reifen? Erfahren Sie alles über die Besonderheiten bei E-Auto-Reifen, höheren Verschleiß und die besten Reifenmodelle für Elektrofahrzeuge.',
        content: '<p>Placeholder content - wird manuell ergänzt</p>',
        categoryId: categoryReifenwissen.id,
        status: 'DRAFT',
        targetAudience: 'CUSTOMER',
        metaTitle: 'E-Auto-Reifen: Spezielle Anforderungen für Elektrofahrzeuge 2026',
        metaDescription: 'Brauchen E-Autos spezielle Reifen? Alles über E-Auto-Reifen: XL/EV-Kennzeichnung, Verschleiß, Reichweite optimieren, beste Modelle 2026 und Kostenvergleich.',
        keywords: ['E-Auto Reifen', 'Elektroauto', 'EV-Reifen', 'Reichweite', 'XL-Reifen', 'Tesla Reifen'],
        readTime: 11,
        tags: [tagRatgeber.id, tagSicherheit.id]
      }
    ];

    console.log(`\nCreating ${posts.length} blog posts...\n`);

    for (const postData of posts) {
      const { tags, ...data } = postData;
      
      const post = await prisma.blogPost.create({
        data: {
          ...data,
          authorId: employee.id,
          tags: {
            connect: tags.map(id => ({ id }))
          }
        },
        include: {
          category: true,
          tags: true
        }
      });

      console.log(`✅ Created: "${post.title}"`);
      console.log(`   Category: ${post.category.name}`);
      console.log(`   Tags: ${post.tags.map(t => t.name).join(', ')}`);
      console.log(`   Status: ${post.status}\n`);
    }

    console.log('✨ All 5 blog posts created successfully!');
    console.log(`Author: ${employee.firstName} ${employee.lastName}`);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
