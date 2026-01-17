'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BackButtonProps {
  href?: string
  label?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'
  showIcon?: boolean
  className?: string
}

export default function BackButton({
  href,
  label = 'Zurück',
  variant = 'outline',
  showIcon = true,
  className = ''
}: BackButtonProps) {
  const router = useRouter()
  const pathname = usePathname()

  const getBackHref = () => {
    if (href) return href

    // Remove trailing slash
    const cleanPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
    
    // Split path and go one level up
    const segments = cleanPath.split('/').filter(Boolean)
    
    if (segments.length <= 1) {
      // Already at root level (/admin or /mitarbeiter)
      return '/'
    }
    
    // Remove last segment to go one level up
    segments.pop()
    return '/' + segments.join('/')
  }

  const handleBack = () => {
    router.push(getBackHref())
  }

  return (
    <Button
      variant={variant}
      onClick={handleBack}
      className={className}
    >
      {showIcon && <ArrowLeft className="h-4 w-4 mr-2" />}
      {label}
    </Button>
  )
}
