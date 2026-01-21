const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSepaCommissions() {
  try {
    // Finde Werkstatt mit SEPA Mandat
    const workshop = await prisma.workshop.findFirst({
      where: {
        gocardlessMandateId: { not: null }
      },
      select: {
        id: true,
        companyName: true,
        customerNumber: true,
        gocardlessMandateId: true,
        gocardlessMandateStatus: true,
        gocardlessMandateRef: true
      }
    });

    if (!workshop) {
      console.log('❌ Keine Werkstatt mit SEPA Mandat gefunden');
      return;
    }

    // Hole ALLE Provisionen für diese Werkstatt
    const allCommissions = await prisma.commission.findMany({
      where: {
        workshopId: workshop.id
      },
      include: {
        booking: {
          include: {
            offer: true,
            tireRequest: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filtere nach Status
    const pendingCommissions = allCommissions.filter(c => c.status === 'PENDING');
    const paidCommissions = allCommissions.filter(c => c.status === 'PAID');
    const failedCommissions = allCommissions.filter(c => c.status === 'FAILED');

    console.log('\n🏪 WERKSTATT MIT SEPA MANDAT:');
    console.log('═'.repeat(60));
    console.log('Firma:', workshop.companyName);
    console.log('Kundennummer:', workshop.customerNumber);
    console.log('Mandate ID:', workshop.gocardlessMandateId);
    console.log('Mandate Status:', workshop.gocardlessMandateStatus);
    console.log('Mandate Ref:', workshop.gocardlessMandateRef);
    console.log('═'.repeat(60));
    
    // Berechne Summen
    const totalPending = pendingCommissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const totalPaid = paidCommissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const totalFailed = failedCommissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    
    const commissionGross = totalPending;
    const commissionNet = commissionGross / 1.19;
    const commissionTax = commissionGross - commissionNet;
    
    console.log('\n💰 PROVISIONEN ÜBERSICHT:');
    console.log('═'.repeat(60));
    console.log('Gesamt Provisionen:', allCommissions.length);
    console.log('  - Ausstehend (PENDING):', pendingCommissions.length, '→', totalPending.toFixed(2), '€');
    console.log('  - Eingezogen (PAID):', paidCommissions.length, '→', totalPaid.toFixed(2), '€');
    console.log('  - Fehlgeschlagen (FAILED):', failedCommissions.length, '→', totalFailed.toFixed(2), '€');
    console.log('═'.repeat(60));
    
    console.log('\n📋 AUSSTEHENDE PROVISIONEN (PENDING):');
    console.log('═'.repeat(60));
    if (pendingCommissions.length > 0) {
      pendingCommissions.forEach(comm => {
        console.log(`  - Auftrag: ${comm.booking?.tireRequest?.id || 'N/A'}`);
        console.log(`    Betrag: ${Number(comm.orderValue).toFixed(2)} € → Provision: ${Number(comm.commissionAmount).toFixed(2)} € (${comm.commissionRate}%)`);
        console.log(`    Status: ${comm.status} | Erstellt: ${comm.createdAt.toLocaleDateString('de-DE')}`);
        console.log('');
      });
    } else {
      console.log('  Keine ausstehenden Provisionen');
    }
    
    console.log('\n💶 SUMME AUSSTEHEND (für SEPA-Abbuchung):');
    console.log('═'.repeat(60));
    console.log('Provision (Brutto):', commissionGross.toFixed(2), '€');
    console.log('  - Netto:', commissionNet.toFixed(2), '€');
    console.log('  - MwSt (19%):', commissionTax.toFixed(2), '€');
    console.log('═'.repeat(60));
    
    console.log('\n✅ MANUELLE ABBUCHUNG JETZT MÖGLICH:');
    console.log('═'.repeat(60));
    console.log('Status "' + workshop.gocardlessMandateStatus + '" ist gültig für Payment-Erstellung.');
    console.log('Nach GoCardless Support-Antwort vom 12. Jan 2026:');
    console.log('- pending_submission ist VALID ✓');
    console.log('- Mandate wird nach erster Zahlung "active"');
    console.log('- Payment wird in 3 Tagen verarbeitet');
    console.log('═'.repeat(60));
    
    console.log('\n📝 NÄCHSTE SCHRITTE:');
    console.log('1. Manuelle Abbuchung: POST /api/admin/commissions/bill-month');
    console.log('2. Oder: Warten bis 1. Februar 2026 (automatischer Cron)');
    console.log('3. Payment wird für ' + commissionGross.toFixed(2) + ' € erstellt');
    console.log('4. GoCardless verarbeitet in 3 Tagen');
    console.log('5. Mandate-Status wechselt zu "active"');
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSepaCommissions();
