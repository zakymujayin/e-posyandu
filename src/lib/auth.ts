import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@/types/next-auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username dan password wajib diisi")
        }

        const username = credentials.username as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({ where: { username } })

        if (!user) {
          throw new Error("Username atau kata sandi salah")
        }

        // Check lockout
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
          const minutesLeft = Math.ceil(
            (user.lockoutUntil.getTime() - Date.now()) / 60000
          )
          throw new Error(
            `Terlalu banyak percobaan, coba lagi dalam ${minutesLeft} menit`
          )
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
          const attempts = user.failedLoginAttempts + 1
          if (attempts >= 5) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: attempts,
                lockoutUntil: new Date(Date.now() + 15 * 60 * 1000),
              },
            })
            throw new Error("Terlalu banyak percobaan, coba lagi dalam 15 menit")
          }
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: attempts },
          })
          throw new Error("Username atau kata sandi salah")
        }

        // Reset lockout state
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockoutUntil: null,
            lastLoginAt: new Date(),
          },
        })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: UserRole }).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
})
