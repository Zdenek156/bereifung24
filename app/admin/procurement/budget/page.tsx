'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CostCenterBudget {
  costCenter: string
  allocatedBudget: number
  spent?: number
}

interface BudgetData {
  year: number
  totalBudget: number
  costCenterBudgets: CostCenterBudget[]
}

const costCenters = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'IT', label: 'IT' },
  { value: 'BUCHHALTUNG', label: 'Buchhaltung' },
  { value: 'PERSONAL', label: 'Personal' }
]

export default function BudgetPage() {
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const [budget, setBudget] = useState<BudgetData>({
    year: currentYear,
    totalBudget: 50000,
    costCenterBudgets: costCenters.map(cc => ({
      costCenter: cc.value,
      allocatedBudget: 10000
    }))
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBudget()
  }, [])

  const fetchBudget = async () => {
    try {
      const response = await fetch(`/api/admin/procurement/budget?year=${currentYear}`)
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setBudget(data)
        }
      }
    } catch (error) {
      console.error('Error fetching budget:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/procurement/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budget)
      })

      if (response.ok) {
        alert('Budget erfolgreich gespeichert!')
        router.push('/admin/procurement')
      } else {
        const data = await response.json()
        alert('Fehler beim Speichern: ' + (data.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error saving budget:', error)
      alert('Fehler beim Speichern des Budgets')
    } finally {
      setSaving(false)
    }
  }

  const updateCostCenterBudget = (costCenter: string, amount: number) => {
    setBudget(prev => ({
      ...prev,
      costCenterBudgets: prev.costCenterBudgets.map(cc =>
        cc.costCenter === costCenter ? { ...cc, allocatedBudget: amount } : cc
      )
    }))
  }

  const totalAllocated = budget.costCenterBudgets.reduce((sum, cc) => sum + cc.allocatedBudget, 0)
  const remainingBudget = budget.totalBudget - totalAllocated

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/procurement" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
            ← Zurück zum Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Budget {currentYear}</h1>
          <p className="text-gray-600 mt-2">Gesamtbudget und Kostenstellen-Zuteilung verwalten</p>
        </div>

        {/* Gesamtbudget */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Gesamtbudget</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jährliches Gesamtbudget (€)
            </label>
            <input
              type="number"
              value={budget.totalBudget}
              onChange={(e) => setBudget({ ...budget, totalBudget: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              step="1000"
              min="0"
            />
          </div>

          {/* Budget-Übersicht */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Gesamtbudget</p>
              <p className="text-2xl font-bold text-blue-600">{budget.totalBudget.toLocaleString('de-DE')} €</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Zugewiesen</p>
              <p className="text-2xl font-bold text-green-600">{totalAllocated.toLocaleString('de-DE')} €</p>
            </div>
            <div className={`p-4 rounded-lg ${remainingBudget < 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className="text-sm text-gray-600">Verbleibend</p>
              <p className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {remainingBudget.toLocaleString('de-DE')} €
              </p>
            </div>
          </div>

          {remainingBudget < 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                ⚠️ Warnung: Die Summe der Kostenstellen-Budgets übersteigt das Gesamtbudget um {Math.abs(remainingBudget).toLocaleString('de-DE')} €
              </p>
            </div>
          )}
        </div>

        {/* Kostenstellen-Budgets */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Kostenstellen-Budgets</h2>
          <div className="space-y-4">
            {costCenters.map(cc => {
              const ccBudget = budget.costCenterBudgets.find(b => b.costCenter === cc.value)
              const allocated = ccBudget?.allocatedBudget || 0
              const spent = ccBudget?.spent || 0
              const percentage = budget.totalBudget > 0 ? (allocated / budget.totalBudget * 100) : 0

              return (
                <div key={cc.value} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {cc.label}
                      </label>
                      <p className="text-xs text-gray-500">
                        {percentage.toFixed(1)}% des Gesamtbudgets
                      </p>
                    </div>
                    <div className="text-right">
                      <input
                        type="number"
                        value={allocated}
                        onChange={(e) => updateCostCenterBudget(cc.value, Number(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-right"
                        step="1000"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">€</p>
                    </div>
                  </div>
                  
                  {/* Fortschrittsbalken */}
                  {spent > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Ausgegeben: {spent.toLocaleString('de-DE')} €</span>
                        <span>{allocated > 0 ? ((spent / allocated) * 100).toFixed(1) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${spent > allocated ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min((spent / allocated) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Schnellzuteilung */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Schnellzuteilung</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const perCC = Math.floor(budget.totalBudget / costCenters.length)
                  setBudget(prev => ({
                    ...prev,
                    costCenterBudgets: costCenters.map(cc => ({
                      costCenter: cc.value,
                      allocatedBudget: perCC
                    }))
                  }))
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Gleichmäßig verteilen
              </button>
              <button
                onClick={() => {
                  setBudget(prev => ({
                    ...prev,
                    costCenterBudgets: costCenters.map(cc => ({
                      costCenter: cc.value,
                      allocatedBudget: 0
                    }))
                  }))
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Alle zurücksetzen
              </button>
            </div>
          </div>
        </div>

        {/* Aktionen */}
        <div className="mt-8 flex justify-end gap-4">
          <Link
            href="/admin/procurement"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || remainingBudget < 0}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Speichert...' : 'Budget speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
