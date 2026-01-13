/**
 * Employee Route Utilities
 * 
 * Converts admin routes to employee routes based on user role.
 * Ensures that employees see /mitarbeiter/* URLs while admins see /admin/*
 */

/**
 * Get the appropriate URL based on user role
 * For B24_EMPLOYEE: /admin/* becomes /mitarbeiter/*
 * For ADMIN: keeps /admin/*
 * 
 * @param adminPath - The admin path (e.g., "/admin/customers")
 * @param role - User role from session
 * @returns The appropriate path for the user's role
 */
export function getEmployeeUrl(adminPath: string, role?: string): string {
  if (role === 'B24_EMPLOYEE' && adminPath.startsWith('/admin/')) {
    return adminPath.replace('/admin/', '/mitarbeiter/')
  }
  return adminPath
}

/**
 * React hook to get URL converter function based on current session
 * Usage in client component:
 * 
 * const getUrl = useEmployeeUrl()
 * <Link href={getUrl('/admin/customers')}>Customers</Link>
 */
export function useEmployeeUrlHook(role?: string) {
  return (adminPath: string) => getEmployeeUrl(adminPath, role)
}
