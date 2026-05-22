import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { UserRole } from "@/types/next-auth"

export type ApiResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string }

export function ok<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({ success: true, data, message } satisfies ApiResponse<T>)
}

export function err(message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: message } satisfies ApiResponse, { status })
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const session = await auth()
  if (!session?.user) return { user: null, response: err("Tidak terautentikasi", 401) }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { user: null, response: err("Akses ditolak", 403) }
  }

  return { user: session.user, response: null }
}
