'use client'

import { Info } from 'lucide-react'
import { useState } from 'react'

interface InfoTooltipProps {
  content: string
}

export default function InfoTooltip({ content }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="ml-1 text-gray-400 hover:text-primary-600 transition-colors"
        aria-label="Mehr Information"
      >
        <Info className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute left-0 top-6 z-[9999] w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-xl text-sm text-gray-700">
          <div className="absolute -top-2 left-2 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
          {content}
        </div>
      )}
    </div>
  )
}
