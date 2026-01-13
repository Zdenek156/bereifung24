/**
 * Utility function to generate role-based URLs
 * For B24_EMPLOYEE: Replaces /admin/* with /mitarbeiter/*
 * For ADMIN: Keeps /admin/* as is
 */

export function getRoleBasedUrl(url: string, role: string | undefined): string {
  if (role === 'B24_EMPLOYEE' && url.startsWith('/admin/')) {
    return url.replace('/admin/', '/mitarbeiter/')
  }
  return url
}

/**
 * Hook to get role-based URL generator
 * Usage: const getUrl = useRoleBasedUrl()
 *        <Link href={getUrl('/admin/buchhaltung/journal')}>
 */
import { useSession } from 'next-auth/react'

export function useRoleBasedUrl() {
  const { data: session } = useSession()
  
  return (url: string) => getRoleBasedUrl(url, session?.user?.role)
}
