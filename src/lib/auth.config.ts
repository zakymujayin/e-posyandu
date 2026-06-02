import type { NextAuthConfig } from "next-auth"
import type { UserRole } from "@/types/next-auth"

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role as UserRole
        token.posyanduId = user.posyanduId
        token.desaId = user.desaId
        token.kecamatanId = user.kecamatanId
        token.opdId = user.opdId
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.posyanduId = token.posyanduId as string | null | undefined
        session.user.desaId = token.desaId as string | null | undefined
        session.user.kecamatanId = token.kecamatanId as string | null | undefined
        session.user.opdId = token.opdId as string | null | undefined
      }
      return session
    },
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig
