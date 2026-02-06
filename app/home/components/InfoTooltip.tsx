'use client'

import { Info } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface InfoTooltipProps {
  content: string
}

export default function InfoTooltip({ content }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      })
    }
  }

  const handleMouseEnter = () => {
    updatePosition()
    setIsOpen(true)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    updatePosition()
    setIsOpen(!isOpen)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsOpen(false)}
        className="ml-1 text-gray-400 hover:text-primary-600 transition-colors relative z-10"
        aria-label="Mehr Information"
      >
        <Info className="w-4 h-4" />
      </button>
      
      {mounted && isOpen && createPortal(
        <div 
          className="fixed z-[99999] w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-xl text-sm text-gray-700"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="absolute -top-2 left-2 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
          {content}
        </div>,
        document.body
      )}
    </>
  )
}
