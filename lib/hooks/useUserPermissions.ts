/**
 * Hook für Permission-Based Access Control
 * Gibt die zugewiesenen Anwendungen des aktuellen Benutzers zurück
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Application {
  id: string
  key: string
  name: string
  description?: string
  icon: string
  adminRoute: string
  color: string
  category: string
  sortOrder: number
}

export function useUserPermissions() {
  const { data: session } = useSession()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      setLoading(false)
      return
    }

    fetchApplications()
  }, [session])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/employee/applications')
      if (response.ok) {
        const result = await response.json()
        setApplications(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Check if user has access to a specific application
   * @param applicationKey - The application key (e.g., 'buchhaltung', 'hr')
   */
  const hasAccess = (applicationKey: string): boolean => {
    // ADMIN has access to everything
    if (session?.user?.role === 'ADMIN') return true

    // Check if employee has this application assigned
    return applications.some(app => app.key === applicationKey)
  }

  /**
   * Check if user has access to any of the given applications
   * @param applicationKeys - Array of application keys
   */
  const hasAnyAccess = (applicationKeys: string[]): boolean => {
    if (session?.user?.role === 'ADMIN') return true
    return applicationKeys.some(key => hasAccess(key))
  }

  /**
   * Get all application keys the user has access to
   */
  const getPermissions = (): string[] => {
    if (session?.user?.role === 'ADMIN') {
      // Return all possible keys for admin
      return ['*']
    }
    return applications.map(app => app.key)
  }

  return {
    hasAccess,
    hasAnyAccess,
    getPermissions,
    applications,
    loading,
    isAdmin: session?.user?.role === 'ADMIN',
    isEmployee: session?.user?.role === 'B24_EMPLOYEE'
  }
}
