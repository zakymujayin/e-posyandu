"use client"

import { useSession } from "next-auth/react"
import type { UserRole } from "@/types/next-auth"

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user ?? null,
    role: (session?.user?.role ?? null) as UserRole | null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  }
}