import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      customerId?: string
      workshopId?: string
    }
  }

  interface User {
    role: string
    customerId?: string
    workshopId?: string
    isB24Employee?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    id: string
    customerId?: string
    workshopId?: string
    isB24Employee?: boolean
  }
}
