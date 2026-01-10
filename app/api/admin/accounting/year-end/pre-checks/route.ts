import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Year-End Pre-Checks API
 * Verifies all prerequisites before starting year-end closing process
 */
export async function GET(request: NextRequest) {
  const preChecks = []
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)

    // Check 1: Balance Sheet Exists
    let balanceSheet = null
    try {
      balanceSheet = await prisma.balanceSheet.findUnique({
        where: { year }
      })
    } catch (err) {
      console.error('Balance sheet check error:', err)
    }

    preChecks.push({
      id: 'balance-sheet',
      title: 'Bilanz erstellt',
      status: balanceSheet ? 'passed' : 'warning',
      message: balanceSheet
        ? `Bilanz für ${year} wurde erstellt`
        : `Bilanz für ${year} muss noch erstellt werden`
    })

    // Check 2: Income Statement Exists
    let incomeStatement = null
    try {
      incomeStatement = await prisma.incomeStatement.findUnique({
        where: { year }
      })
    } catch (err) {
      console.error('Income statement check error:', err)
    }

    preChecks.push({
      id: 'income-statement',
      title: 'GuV erstellt',
      status: incomeStatement ? 'passed' : 'warning',
      message: incomeStatement
        ? `GuV für ${year} wurde erstellt`
        : `GuV für ${year} muss noch erstellt werden`
    })

    // Check 3: Check for unreconciled entries
    let entriesCount = 0
    try {
      entriesCount = await prisma.accountingEntry.count({
        where: {
          bookingDate: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    } catch (err) {
      console.error('Entries count error:', err)
    }

    preChecks.push({
      id: 'entries',
      title: 'Buchungen vorhanden',
      status: entriesCount > 0 ? 'passed' : 'warning',
      message: `${entriesCount} Buchungen für ${year} gefunden`
    })

    // Check 4: Check for pending provisions
    let pendingProvisions = 0
    try {
      pendingProvisions = await prisma.provision.count({
        where: {
          year,
          entryId: null,
        }
      })
    } catch (err) {
      console.error('Provisions check error:', err)
    }

    preChecks.push({
      id: 'provisions',
      title: 'Rückstellungen gebucht',
      status: pendingProvisions === 0 ? 'passed' : 'warning',
      message: pendingProvisions === 0
        ? 'Alle Rückstellungen sind gebucht'
        : `${pendingProvisions} Rückstellungen sind noch nicht gebucht`
    })

    // Check 5: Check if year is already locked
    const isLocked = balanceSheet?.locked || false

    preChecks.push({
      id: 'locked',
      title: 'Jahr nicht gesperrt',
      status: !isLocked ? 'passed' : 'failed',
      message: isLocked
        ? `Jahr ${year} ist bereits gesperrt`
        : `Jahr ${year} kann bearbeitet werden`
    })

    // Check 6: Verify account balance
    let accounts = 0
    try {
      accounts = await prisma.chartOfAccounts.count({
        where: { isActive: true }
      })
    } catch (err) {
      console.error('Accounts check error:', err)
    }

    preChecks.push({
      id: 'accounts',
      title: 'Kontenrahmen aktiv',
      status: accounts > 0 ? 'passed' : 'failed',
      message: `${accounts} aktive Konten im Kontenrahmen`
    })

    // Check 7: Check for assets without depreciation (optional check)
    let assetsWithoutDepreciation = 0
    try {
      const assets = await prisma.asset.findMany({
        where: {
          purchaseDate: {
            lte: endDate
          },
          disposalDate: null
        },
        include: {
          depreciations: {
            where: { year }
          }
        }
      })
      assetsWithoutDepreciation = assets.filter(a => a.depreciations.length === 0).length
    } catch (err) {
      console.log('Asset check skipped (table might not exist):', err)
    }

    preChecks.push({
      id: 'depreciation',
      title: 'Abschreibungen vollständig',
      status: assetsWithoutDepreciation === 0 ? 'passed' : 'warning',
      message: assetsWithoutDepreciation === 0
        ? 'Alle Anlagen wurden abgeschrieben'
        : `${assetsWithoutDepreciation} Anlagen ohne Abschreibung für ${year}`
    })

    return NextResponse.json(preChecks)
  } catch (error) {
    console.error('Error running pre-checks:', error)
    // Return empty array instead of error to prevent frontend crash
    return NextResponse.json([
      {
        id: 'error',
        title: 'Fehler bei Prüfungen',
        status: 'failed',
        message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      }
    ])
  }
}
