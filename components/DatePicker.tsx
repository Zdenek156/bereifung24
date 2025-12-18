'use client'

import { useState } from 'react'

interface DatePickerProps {
  selectedDate: string
  onChange: (date: string) => void
  minDate?: string
  label?: string
  required?: boolean
}

export default function DatePicker({ selectedDate, onChange, minDate, label, required }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ]
  
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  
  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // Get day of week (0 = Sunday, adjust to Monday = 0)
    let firstDayOfWeek = firstDay.getDay() - 1
    if (firstDayOfWeek === -1) firstDayOfWeek = 6
    
    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }
  
  const handleDateClick = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    
    onChange(dateString)
  }
  
  const isDateDisabled = (date: Date | null) => {
    if (!date) return true
    if (!minDate) return false
    
    const minDateTime = new Date(minDate).getTime()
    const dateTime = date.getTime()
    
    return dateTime < minDateTime
  }
  
  const isDateSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    
    return dateString === selectedDate
  }
  
  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  
  const renderMonth = (monthOffset: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1)
    const days = getDaysInMonth(date)
    
    return (
      <div className="flex-1 min-w-0">
        <div className="text-center mb-1.5">
          <h3 className="text-sm font-bold text-gray-900">
            {monthNames[date.getMonth()]} {date.getFullYear()}
          </h3>
        </div>
        
        {/* Day names */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-600 py-0.5">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="w-7 h-7" />
            }
            
            const disabled = isDateDisabled(date)
            const selected = isDateSelected(date)
            const today = isToday(date)
            
            return (
              <button
                key={index}
                type="button"
                onClick={() => !disabled && handleDateClick(date)}
                disabled={disabled}
                className={`
                  w-7 h-7 flex items-center justify-center rounded text-xs font-medium transition-colors
                  ${disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-primary-50'}
                  ${selected ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}
                  ${today && !selected ? 'ring-1.5 ring-primary-400 text-primary-600' : ''}
                  ${!selected && !disabled && !today ? 'text-gray-900' : ''}
                `}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
  
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && '*'}
        </label>
      )}
      
      <div className="bg-white border-2 border-gray-300 rounded-lg p-2">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-sm text-gray-600">
            {selectedDate ? (
              <span className="font-medium text-primary-600">
                Gewählt: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            ) : (
              'Bitte Datum wählen'
            )}
          </div>
          
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Two months side by side */}
        <div className="flex gap-3">
          {renderMonth(0)}
          <div className="hidden md:block w-px bg-gray-200" />
          <div className="hidden md:block flex-1 min-w-0">
            {renderMonth(1)}
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 text-center">
          💡 Tipp: Wählen Sie ein Datum durch Klicken aus
        </div>
      </div>
    </div>
  )
}
