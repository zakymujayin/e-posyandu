import { auth } from "@/auth"
import { NextResponse } from "next/server"

const PUBLIC_PATHS = ["/login", "/api/auth", "/tracking", "/api/tracking"]

const ROLE_REDIRECTS: Record<string, string> = {
  KADER: "/kader",
  PETUGAS_DESA: "/petugas-desa",
  PETUGAS_KECAMATAN: "/kecamatan",
  PETUGAS_OPD: "/opd",
  ADMIN_DPMD: "/admin",
}

const ROLE_ROUTES: Record<string, string[]> = {
  "/kader": ["KADER"],
  "/petugas-desa": ["PETUGAS_DESA"],
  "/kecamatan": ["PETUGAS_KECAMATAN"],
  "/opd": ["PETUGAS_OPD"],
  "/admin": ["ADMIN_DPMD"],
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Allow public paths without auth
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const session = req.auth
  const user = session?.user

  // Redirect "/" to role-appropriate dashboard, or show landing page for guests
  if (pathname === "/") {
    if (user) {
      const dashboard = ROLE_REDIRECTS[user.role]
      if (dashboard) {
        return NextResponse.redirect(new URL(dashboard, req.url))
      }
    }
    return NextResponse.next()
  }

  // Redirect unauthenticated users to /login
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // For role-protected routes, check if user role is allowed
  for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(user.role)) {
        const userDashboard = ROLE_REDIRECTS[user.role] || "/login"
        return NextResponse.redirect(new URL(userDashboard, req.url))
      }
      break
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|svg|css|js)$).*)"],
}