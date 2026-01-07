'use client'

interface JournalFiltersProps {
  filter: string
  setFilter: (v: string) => void
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
  accountFrom: string
  setAccountFrom: (v: string) => void
  accountTo: string
  setAccountTo: (v: string) => void
  minAmount: string
  setMinAmount: (v: string) => void
  maxAmount: string
  setMaxAmount: (v: string) => void
  sourceType: string
  setSourceType: (v: string) => void
  showStorno: 'ALL' | 'ONLY' | 'EXCLUDE'
  setShowStorno: (v: 'ALL' | 'ONLY' | 'EXCLUDE') => void
  showFilters: boolean
  setShowFilters: (v: boolean) => void
  onSearch: () => void
}

export default function JournalFilters(props: JournalFiltersProps) {
  const {
    filter, setFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    accountFrom, setAccountFrom,
    accountTo, setAccountTo,
    minAmount, setMinAmount,
    maxAmount, setMaxAmount,
    sourceType, setSourceType,
    showStorno, setShowStorno,
    showFilters, setShowFilters,
    onSearch
  } = props

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          {showFilters ? 'Weniger Filter' : 'Mehr Filter'}
        </button>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Suche
          </label>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Belegnr., Beschreibung, Konto..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Von Datum
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bis Datum
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={onSearch}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Suchen
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konto von
              </label>
              <input
                type="text"
                value={accountFrom}
                onChange={(e) => setAccountFrom(e.target.value)}
                placeholder="z.B. 1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konto bis
              </label>
              <input
                type="text"
                value={accountTo}
                onChange={(e) => setAccountTo(e.target.value)}
                placeholder="z.B. 1999"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min. Betrag
              </label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max. Betrag
              </label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="99999.99"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quelle
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="ALL">Alle</option>
                <option value="MANUAL">Manuell</option>
                <option value="COMMISSION">Provision</option>
                <option value="EXPENSE">Spesen</option>
                <option value="TRAVEL_EXPENSE">Reisekosten</option>
                <option value="PAYROLL">Gehalt</option>
                <option value="PROCUREMENT">Beschaffung</option>
                <option value="INFLUENCER">Influencer</option>
                <option value="VEHICLE">Fahrzeug</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stornos
              </label>
              <select
                value={showStorno}
                onChange={(e) => setShowStorno(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="ALL">Alle anzeigen</option>
                <option value="EXCLUDE">Stornos ausblenden</option>
                <option value="ONLY">Nur Stornos</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
