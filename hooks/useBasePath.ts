'use client'

import { usePathname } from 'next/navigation'

/**
 * Hook to get the correct base path for admin/mitarbeiter routes
 * Returns '/admin' or '/mitarbeiter' based on current URL
 */
export function useBasePath() {
  const pathname = usePathname()
  
  if (pathname?.startsWith('/mitarbeiter')) {
    return '/mitarbeiter'
  }
  
  return '/admin'
}

/**
 * Helper to build admin/mitarbeiter aware paths
 * Usage: buildPath('/blog/artikel') => '/admin/blog/artikel' or '/mitarbeiter/blog/artikel'
 */
export function useBuildPath() {
  const basePath = useBasePath()
  
  return (path: string) => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path
    return `${basePath}/${cleanPath}`
  }
}
