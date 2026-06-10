import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/cache"
import { authConfig } from "./auth.config"
import type { UserRole } from "@/types/next-auth"

class LockoutError extends CredentialsSignin {
  constructor(minutesLeft: number) {
    super()
    this.code = `lockout:${minutesLeft}`
  }
}

const nextAuth = NextAuth({
  ...authConfig,
  logger: {
    error(error) {
      if (error.name === "JWTSessionError") return
      console.error("[auth]", error)
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new CredentialsSignin()
        }

        const username = (credentials.username as string).trim().toLowerCase()
        const password = credentials.password as string

        const allowed = await rateLimit(`rl:login:${username}`, 5, 60)
        if (!allowed) {
          throw new CredentialsSignin()
        }

        const user = await prisma.user.findUnique({ where: { username, isActive: true } })

        if (!user) {
          throw new CredentialsSignin()
        }

        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
          const minutesLeft = Math.ceil(
            (user.lockoutUntil.getTime() - Date.now()) / 60000
          )
          throw new LockoutError(minutesLeft)
        }

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
            throw new LockoutError(15)
          }
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: attempts },
          })
          throw new CredentialsSignin()
        }

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
          posyanduId: user.posyanduId,
          desaId: user.desaId,
          kecamatanId: user.kecamatanId,
          opdId: user.opdId,
        }
      },
    }),
  ],
})

export const { handlers, signIn, signOut } = nextAuth

const _rawAuth = nextAuth.auth

async function safeAuth() {
  try {
    return await _rawAuth()
  } catch {
    return null
  }
}

export { safeAuth as auth }
