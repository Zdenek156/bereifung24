import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email und Passwort erforderlich')
        }

        console.log('[AUTH] Login attempt for:', credentials.email)

        // First, try to find regular user
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            customer: true,
            workshop: true,
          }
        })

        if (user) {
          if (!user.isActive) {
            throw new Error('Account ist deaktiviert')
          }

          // Prüfe ob E-Mail bestätigt wurde (nur für Kunden)
          if (user.role === 'CUSTOMER' && !user.emailVerified) {
            throw new Error('Bitte bestätige zuerst deine E-Mail-Adresse. Wir haben dir einen Bestätigungslink gesendet.')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error('Ungültiges Passwort')
          }

          // For ADMIN users, check if they also have a B24Employee profile
          let b24EmployeeId: string | undefined
          if (user.role === 'ADMIN') {
            const employee = await prisma.b24Employee.findUnique({
              where: { email: user.email }
            })
            if (employee) {
              b24EmployeeId = employee.id
            }
          }

          console.log('[AUTH] User found, returning:', {
            id: user.id,
            email: user.email,
            role: user.role,
            customerId: user.customer?.id,
            workshopId: user.workshop?.id
          })

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            customerId: user.customer?.id,
            workshopId: user.workshop?.id,
            b24EmployeeId,
          }
        }

        // If not found, try B24 employee
        const employee = await prisma.b24Employee.findUnique({
          where: { email: credentials.email }
        })

        if (employee) {
          if (!employee.isActive) {
            throw new Error('Account ist deaktiviert')
          }

          if (!employee.emailVerified || !employee.password) {
            throw new Error('Bitte setzen Sie zuerst Ihr Passwort über den Link in der Setup-Email.')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            employee.password
          )

          if (!isPasswordValid) {
            throw new Error('Ungültiges Passwort')
          }

          // Update last login
          await prisma.b24Employee.update({
            where: { id: employee.id },
            data: { lastLoginAt: new Date() }
          })

          return {
            id: employee.id,
            email: employee.email,
            name: `${employee.firstName} ${employee.lastName}`,
            role: 'B24_EMPLOYEE', // B24 employees get their own role
            isB24Employee: true,
            b24EmployeeId: employee.id,
          }
        }

        throw new Error('Benutzer nicht gefunden')
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Nur Google OAuth für Kunden erlauben
      if (account?.provider === 'google-customer') {
        if (!user.email) {
          return false
        }

        // Prüfe ob User bereits existiert
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { customer: true, workshop: true }
        })

        if (existingUser) {
          // User existiert bereits
          // Verhindere Google-Login für Werkstätten
          if (existingUser.role === 'WORKSHOP') {
            return '/login?error=WorkshopNoGoogle'
          }
          
          // Wenn User noch kein Google-Account verknüpft hat, verknüpfe jetzt
          if (!existingUser.googleId && account.providerAccountId) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                googleId: account.providerAccountId,
                emailVerified: new Date() // Google-Accounts sind automatisch verifiziert
              }
            })
          }
          
          return true
        }

        // Neuer User via Google - erstelle automatisch als CUSTOMER
        try {
          const [firstName, ...lastNameParts] = (user.name || user.email.split('@')[0]).split(' ')
          const lastName = lastNameParts.join(' ') || firstName

          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              firstName: firstName,
              lastName: lastName,
              password: await bcrypt.hash(Math.random().toString(36), 10), // Zufallspasswort
              role: 'CUSTOMER',
              isActive: true,
              emailVerified: new Date(),
              googleId: account.providerAccountId,
              // Initialize address fields with empty strings to prevent auto-fill issues
              phone: '',
              street: '',
              zipCode: '',
              city: '',
              customer: {
                create: {}
              }
            }
          })

          // Welcome E-Mail senden
          try {
            const { sendEmail, welcomeCustomerEmailTemplate } = await import('@/lib/email')
            await sendEmail({
              to: newUser.email,
              subject: 'Willkommen bei Bereifung24!',
              html: welcomeCustomerEmailTemplate({
                firstName: newUser.firstName,
                email: newUser.email
              })
            })
          } catch (emailError) {
            console.error('Welcome email failed:', emailError)
          }

          return true
        } catch (error) {
          console.error('Error creating Google user:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      console.log('[AUTH JWT] Called with:', {
        hasUser: !!user,
        userRole: user?.role,
        tokenRole: token.role
      })
      
      if (user) {
        // Initial sign in - user comes from authorize()
        token.role = user.role
        token.id = user.id
        token.customerId = user.customerId
        token.workshopId = user.workshopId
        token.isB24Employee = user.isB24Employee
        token.b24EmployeeId = user.b24EmployeeId
        
        console.log('[AUTH JWT] Token updated with user data:', {
          role: token.role,
          id: token.id
        })
      }
      return token
    },
    async session({ session, token }) {
      console.log('[AUTH SESSION] Token to session:', {
        tokenRole: token.role,
        tokenId: token.id
      })
      
      // Ensure session.user exists
      if (!session.user) {
        session.user = {
          email: token.email as string || '',
          name: token.name as string || ''
        }
      }
      
      // Add user data from token
      session.user.role = token.role as string
      session.user.id = token.id as string
      session.user.customerId = token.customerId as string | undefined
      session.user.workshopId = token.workshopId as string | undefined
      session.user.b24EmployeeId = token.b24EmployeeId as string | undefined
      
      console.log('[AUTH SESSION] Session updated:', {
        email: session.user.email,
        role: session.user.role,
        id: session.user.id
      })

      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}
