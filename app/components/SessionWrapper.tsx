'use client'

import { SessionProvider } from 'next-auth/react'

export default function SessionWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider 
      basePath="/api/auth"
      refetchInterval={0} // Don't refetch automatically
      refetchOnWindowFocus={false} // Don't refetch on focus
    >
      {children}
    </SessionProvider>
  )
}
