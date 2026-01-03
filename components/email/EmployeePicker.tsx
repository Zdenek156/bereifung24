'use client'

import { useState, useEffect, useRef } from 'react'

export interface Employee {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  displayName: string
}

interface EmployeePickerProps {
  onSelect: (employees: Employee[]) => void
  multiple?: boolean
  selectedEmployees?: Employee[]
  placeholder?: string
}

export default function EmployeePicker({
  onSelect,
  multiple = true,
  selectedEmployees = [],
  placeholder = 'Mitarbeiter auswählen...',
}: EmployeePickerProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchEmployees()
    loadFavorites()
  }, [])

  useEffect(() => {
    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/email/employees')
      if (res.ok) {
        const data = await res.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = () => {
    const stored = localStorage.getItem('email-favorites')
    if (stored) {
      setFavorites(JSON.parse(stored))
    }
  }

  const saveFavorites = (ids: string[]) => {
    localStorage.setItem('email-favorites', JSON.stringify(ids))
    setFavorites(ids)
  }

  const toggleFavorite = (employeeId: string) => {
    const newFavorites = favorites.includes(employeeId)
      ? favorites.filter((id) => id !== employeeId)
      : [...favorites, employeeId]
    saveFavorites(newFavorites)
  }

  const handleSelect = (employee: Employee) => {
    if (multiple) {
      const isSelected = selectedEmployees.some((e) => e.id === employee.id)
      const newSelection = isSelected
        ? selectedEmployees.filter((e) => e.id !== employee.id)
        : [...selectedEmployees, employee]
      onSelect(newSelection)
    } else {
      onSelect([employee])
      setIsOpen(false)
    }
  }

  const removeEmployee = (employeeId: string) => {
    onSelect(selectedEmployees.filter((e) => e.id !== employeeId))
  }

  const filteredEmployees = employees.filter((emp) => {
    const searchLower = search.toLowerCase()
    return (
      emp.name.toLowerCase().includes(searchLower) ||
      emp.email.toLowerCase().includes(searchLower)
    )
  })

  const favoriteEmployees = filteredEmployees.filter((emp) =>
    favorites.includes(emp.id)
  )
  const otherEmployees = filteredEmployees.filter(
    (emp) => !favorites.includes(emp.id)
  )

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Employees Display */}
      <div className="mb-2">
        <div
          className="w-full px-3 py-2 border rounded-lg bg-white cursor-text min-h-[42px] flex flex-wrap gap-2 items-center"
          onClick={() => setIsOpen(true)}
        >
          {selectedEmployees.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            selectedEmployees.map((emp) => (
              <span
                key={emp.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
              >
                {emp.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeEmployee(emp.id)
                  }}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name oder E-Mail suchen..."
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Employee List */}
          <div className="overflow-y-auto max-h-80">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Lade Mitarbeiter...</div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Keine Mitarbeiter gefunden
              </div>
            ) : (
              <>
                {/* Favorites */}
                {favoriteEmployees.length > 0 && (
                  <div>
                    <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                      ⭐ Favoriten
                    </div>
                    {favoriteEmployees.map((emp) => (
                      <EmployeeItem
                        key={emp.id}
                        employee={emp}
                        isSelected={selectedEmployees.some((e) => e.id === emp.id)}
                        isFavorite={true}
                        onSelect={() => handleSelect(emp)}
                        onToggleFavorite={() => toggleFavorite(emp.id)}
                        multiple={multiple}
                      />
                    ))}
                  </div>
                )}

                {/* Other Employees */}
                {otherEmployees.length > 0 && (
                  <div>
                    {favoriteEmployees.length > 0 && (
                      <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                        Alle Mitarbeiter
                      </div>
                    )}
                    {otherEmployees.map((emp) => (
                      <EmployeeItem
                        key={emp.id}
                        employee={emp}
                        isSelected={selectedEmployees.some((e) => e.id === emp.id)}
                        isFavorite={false}
                        onSelect={() => handleSelect(emp)}
                        onToggleFavorite={() => toggleFavorite(emp.id)}
                        multiple={multiple}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface EmployeeItemProps {
  employee: Employee
  isSelected: boolean
  isFavorite: boolean
  onSelect: () => void
  onToggleFavorite: () => void
  multiple: boolean
}

function EmployeeItem({
  employee,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
  multiple,
}: EmployeeItemProps) {
  return (
    <div
      className={`flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer ${
        isSelected ? 'bg-blue-50' : ''
      }`}
      onClick={onSelect}
    >
      {multiple && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="h-4 w-4 text-blue-600 rounded mr-3"
        />
      )}
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{employee.name}</div>
        <div className="text-sm text-gray-500 truncate">{employee.email}</div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite()
        }}
        className="ml-2 text-gray-400 hover:text-yellow-500"
      >
        {isFavorite ? '⭐' : '☆'}
      </button>
    </div>
  )
}
