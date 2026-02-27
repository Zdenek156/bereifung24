'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Vacation {
  id: string
  startDate: string
  endDate: string
  reason?: string
}

interface Employee {
  id: string
  name: string
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

function isBetween(day: string, start: string, end: string) {
  return day >= start && day <= end
}

function addMonths(year: number, month: number, n: number): { year: number; month: number } {
  const d = new Date(year, month + n, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

function buildMonthGrid(year: number, month: number): { dateStr: string; currentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const days: { dateStr: string; currentMonth: boolean }[] = []
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({ dateStr: toDateStr(d), currentMonth: false })
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ dateStr: toDateStr(new Date(year, month, d)), currentMonth: true })
  }
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({ dateStr: toDateStr(d), currentMonth: false })
  }
  return days
}

interface MonthGridProps {
  year: number
  month: number
  today: string
  selStart: string | null
  selEnd: string | null
  effectiveEnd: string | null
  accentLight: string
  accentTextC: string
  accentBg: string
  getVacationForDay: (d: string) => Vacation | undefined
  onDayClick: (d: string) => void
  onDayHover: (d: string | null) => void
  selEndSet: boolean
}

function MonthGrid({ year, month, today, selStart, selEnd, effectiveEnd, accentLight, accentTextC, accentBg, getVacationForDay, onDayClick, onDayHover, selEndSet }: MonthGridProps) {
  const days = buildMonthGrid(year, month)

  const isSelected = (dateStr: string) => {
    if (!selStart) return false
    const end = effectiveEnd ?? selStart
    return isBetween(dateStr, selStart, end)
  }
  const isEdge = (dateStr: string) =>
    dateStr === selStart || dateStr === (effectiveEnd ?? selStart)

  return (
    <div className="flex-1 min-w-0">
      <div className="text-center text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {MONTHS[month]} {year}
      </div>
      <div className="grid grid-cols-7">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
        {days.map(({ dateStr, currentMonth }) => {
          const vacation = getVacationForDay(dateStr)
          const selected = isSelected(dateStr) && currentMonth
          const edge = isEdge(dateStr) && selected
          const isToday = dateStr === today

          let cellBg = 'bg-white dark:bg-gray-800'
          let textClass = currentMonth ? 'text-gray-800 dark:text-gray-200' : 'text-gray-200 dark:text-gray-700'

          if (selected) {
            cellBg = accentLight
            textClass = `${accentTextC} font-semibold`
          } else if (vacation && currentMonth) {
            cellBg = 'bg-red-50 dark:bg-red-900/20'
            textClass = 'text-red-600 dark:text-red-400 font-semibold'
          }

          return (
            <div
              key={dateStr}
              onClick={() => currentMonth && onDayClick(dateStr)}
              onMouseEnter={() => !selEndSet && currentMonth && onDayHover(dateStr)}
              onMouseLeave={() => !selEndSet && onDayHover(null)}
              className={`${cellBg} relative h-6 flex items-center justify-center ${currentMonth ? 'cursor-pointer hover:opacity-75' : ''} transition-colors`}
            >
              {edge && (
                <div className={`absolute inset-0.5 rounded-full ${accentBg} opacity-25`} />
              )}
              {isToday && !selected && (
                <div className="absolute inset-0.5 rounded-full border border-gray-400 dark:border-gray-500" />
              )}
              {vacation && !selected && currentMonth && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-red-400" />
              )}
              <span className={`relative z-10 text-[11px] leading-none select-none ${textClass}`}>
                {new Date(dateStr + 'T12:00:00').getDate()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface VacationCalendarProps {
  vacations: Vacation[]
  onAdd: (start: string, end: string, reason: string) => Promise<void>
  onDelete: (id: string) => void
  submitting: boolean
  accentColor?: 'blue' | 'purple'
}

function VacationCalendar({ vacations, onAdd, onDelete, submitting, accentColor = 'blue' }: VacationCalendarProps) {
  const today = toDateStr(new Date())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selStart, setSelStart] = useState<string | null>(null)
  const [selEnd, setSelEnd] = useState<string | null>(null)
  const [hoverDay, setHoverDay] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const next = addMonths(calYear, calMonth, 1)

  const prevPair = () => {
    const p = addMonths(calYear, calMonth, -1)
    setCalYear(p.year); setCalMonth(p.month)
  }
  const nextPair = () => {
    const p = addMonths(calYear, calMonth, 1)
    setCalYear(p.year); setCalMonth(p.month)
  }

  const getVacationForDay = (dateStr: string) =>
    vacations.find(v => isBetween(dateStr, toDateStr(new Date(v.startDate)), toDateStr(new Date(v.endDate))))

  const effectiveEnd = selEnd ?? (selStart && hoverDay && hoverDay >= selStart ? hoverDay : null)

  const handleDayClick = (dateStr: string) => {
    if (!selStart) { setSelStart(dateStr); setSelEnd(null); return }
    if (selEnd !== null) { setSelStart(dateStr); setSelEnd(null); return }
    if (dateStr < selStart) { setSelStart(dateStr); setSelEnd(null); return }
    setSelEnd(dateStr)
  }

  const handleAdd = async () => {
    if (!selStart) return
    const end = selEnd ?? selStart
    await onAdd(selStart, end, reason)
    setSelStart(null); setSelEnd(null); setReason('')
  }

  const accentBg    = accentColor === 'blue' ? 'bg-blue-500'  : 'bg-purple-500'
  const accentLight = accentColor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40'  : 'bg-purple-100 dark:bg-purple-900/40'
  const accentBorderC = accentColor === 'blue' ? 'border-blue-400' : 'border-purple-400'
  const accentTextC = accentColor === 'blue' ? 'text-blue-700 dark:text-blue-300' : 'text-purple-700 dark:text-purple-300'

  const gridProps = {
    today, selStart, selEnd, effectiveEnd,
    accentLight, accentTextC, accentBg,
    getVacationForDay,
    onDayClick: handleDayClick,
    onDayHover: setHoverDay,
    selEndSet: selEnd !== null,
  }

  return (
    <div>
      {/* Month nav + two-month grid */}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={prevPair} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex gap-3 flex-1 min-w-0">
          <MonthGrid year={calYear} month={calMonth} {...gridProps} />
          <MonthGrid year={next.year} month={next.month} {...gridProps} />
        </div>
        <button onClick={nextPair} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded bg-red-100 border border-red-300 dark:bg-red-900/30 dark:border-red-700" />
          Geschlossen
        </span>
        <span className="flex items-center gap-1">
          <span className={`inline-block w-2.5 h-2.5 rounded ${accentLight} border ${accentBorderC}`} />
          Auswahl
        </span>
      </div>

      {/* Selection hint */}
      {selStart && selEnd === null && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center bg-gray-50 dark:bg-gray-700 rounded py-1.5 px-2">
          <strong>{new Date(selStart + 'T12:00:00').toLocaleDateString('de-DE', { weekday:'short', day:'2-digit', month:'2-digit'})}</strong>  zweiten Tag für Zeitraum wählen, oder gleichen Tag nochmal für 1 Tag
        </p>
      )}

      {/* Add form */}
      {selStart && selEnd !== null && (
        <div className="mt-2 p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {selEnd === selStart
              ? `1 Tag: ${new Date(selStart + 'T12:00:00').toLocaleDateString('de-DE', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}`
              : `${new Date(selStart + 'T12:00:00').toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' })}  ${new Date(selEnd + 'T12:00:00').toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' })}`
            }
          </p>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Grund (optional)"
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={submitting}
              className="flex-1 py-1.5 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50">
              {submitting ? 'Speichere...' : 'Hinzufügen'}
            </button>
            <button onClick={() => { setSelStart(null); setSelEnd(null); setReason('') }}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {!selStart && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
          Tag anklicken (Einzeltag oder 2 für Zeitraum)
        </p>
      )}

      {/* Vacation list */}
      <div className="mt-3 space-y-1.5">
        {vacations.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-1">Noch keine Auszeiten eingetragen</p>
        ) : (
          <>
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Eingetragen</h4>
            {vacations.map(v => {
              const s = new Date(v.startDate)
              const e = new Date(v.endDate)
              const isSingle = toDateStr(s) === toDateStr(e)
              return (
                <div key={v.id} className="flex items-center justify-between px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div>
                    <p className="text-xs font-medium text-red-800 dark:text-red-300">
                      {isSingle
                        ? s.toLocaleDateString('de-DE', { weekday:'short', day:'2-digit', month:'2-digit', year:'numeric' })
                        : `${s.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' })}  ${e.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' })}`
                      }
                    </p>
                    {v.reason && <p className="text-[11px] text-red-500 dark:text-red-400">{v.reason}</p>}
                  </div>
                  <button onClick={() => onDelete(v.id)} className="p-1 text-red-300 hover:text-red-600 dark:hover:text-red-300 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

export default function VacationManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [workshopVacations, setWorkshopVacations] = useState<Vacation[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [employeeVacations, setEmployeeVacations] = useState<Vacation[]>([])
  const [hasCalendar, setHasCalendar] = useState(false)
  const [hasEmployeeCalendar, setHasEmployeeCalendar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'WORKSHOP') { router.push('/login'); return }
    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [vacRes, empRes] = await Promise.all([
        fetch('/api/workshop/vacations'),
        fetch('/api/workshop/employees')
      ])
      if (vacRes.ok) {
        const d = await vacRes.json()
        setWorkshopVacations(d.vacations || [])
        setHasCalendar(d.hasCalendar || false)
        setHasEmployeeCalendar(d.hasEmployeeCalendar || false)
      }
      if (empRes.ok) {
        const d = await empRes.json()
        setEmployees(d.employees || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchEmployeeVacations = async (id: string) => {
    const res = await fetch(`/api/workshop/employees/${id}/vacations`)
    if (res.ok) { const d = await res.json(); setEmployeeVacations(d.vacations || []) }
  }

  const handleAddWorkshopVacation = async (start: string, end: string, reason: string) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/workshop/vacations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: start, endDate: end, reason })
      })
      if (res.ok) { fetchData() }
      else { const d = await res.json(); alert(d.error || 'Fehler beim Speichern') }
    } finally { setSubmitting(false) }
  }

  const handleDeleteWorkshopVacation = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return
    const res = await fetch(`/api/workshop/vacations?id=${id}`, { method: 'DELETE' })
    if (res.ok) fetchData()
  }

  const handleAddEmployeeVacation = async (start: string, end: string, reason: string) => {
    if (!selectedEmployee) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/workshop/employees/${selectedEmployee}/vacations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: start, endDate: end, reason })
      })
      if (res.ok) { fetchEmployeeVacations(selectedEmployee) }
      else { const d = await res.json(); alert(d.error || 'Fehler beim Speichern') }
    } finally { setSubmitting(false) }
  }

  const handleDeleteEmployeeVacation = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return
    const res = await fetch(`/api/workshop/employees/${selectedEmployee}/vacations?vacationId=${id}`, { method: 'DELETE' })
    if (res.ok) fetchEmployeeVacations(selectedEmployee)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Urlaubsplanung</h1>
          <p className="text-gray-600 dark:text-gray-400">Klicken Sie Tage im Kalender an. Einzeltage und Zeiträume werden unterstützt.</p>
        </div>

        {/* Calendar status banner */}
        <div className={`mb-6 p-4 rounded-lg border-2 flex items-start gap-3 ${hasCalendar ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'}`}>
          {hasCalendar ? (
            <>
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-green-900 dark:text-green-300">Google Kalender verbunden</p>
                <p className="text-sm text-green-700 dark:text-green-400">Urlaubszeiten werden automatisch bei der Terminvergabe berücksichtigt</p>
              </div>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-yellow-900 dark:text-yellow-300">Kein Kalender verbunden</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Verbinden Sie Ihren Google Kalender in den{' '}
                  <a href="/dashboard/workshop/settings" className="underline">Einstellungen</a>
                </p>
              </div>
            </>
          )}
        </div>

        <div className={`grid grid-cols-1 gap-8 ${hasEmployeeCalendar ? 'lg:grid-cols-2' : 'max-w-2xl'}`}>
          {/* Workshop Calendar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Betriebsurlaub
            </h2>
            <VacationCalendar
              vacations={workshopVacations}
              onAdd={handleAddWorkshopVacation}
              onDelete={handleDeleteWorkshopVacation}
              submitting={submitting}
              accentColor="blue"
            />
          </div>

          {/* Employee Calendar — only shown when an employee calendar is connected */}
          {hasEmployeeCalendar && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Mitarbeiter-Urlaub
              </h2>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mitarbeiter auswählen</label>
                <select
                  value={selectedEmployee}
                  onChange={e => {
                    setSelectedEmployee(e.target.value)
                    if (e.target.value) fetchEmployeeVacations(e.target.value)
                    else setEmployeeVacations([])
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-- Mitarbeiter wählen --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              {selectedEmployee ? (
                <VacationCalendar
                  vacations={employeeVacations}
                  onAdd={handleAddEmployeeVacation}
                  onDelete={handleDeleteEmployeeVacation}
                  submitting={submitting}
                  accentColor="purple"
                />
              ) : (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  {employees.length === 0 ? (
                    <>
                      <p className="text-sm mb-1">Keine Mitarbeiter vorhanden</p>
                      <a href="/dashboard/workshop/settings" className="text-sm text-primary-600 hover:text-primary-700 underline">Mitarbeiter hinzufügen</a>
                    </>
                  ) : (
                    <p className="text-sm">Wählen Sie einen Mitarbeiter aus</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
