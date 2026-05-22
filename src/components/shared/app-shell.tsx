"use client"

import { Sidebar } from "@/components/shared/sidebar"
import { Header } from "@/components/shared/header"
import { MobileBottomNav } from "@/components/shared/mobile-bottom-nav"
import type { UserRole } from "@/types/next-auth"

interface AppShellProps {
  user: {
    name: string
    email: string
    role: UserRole
  }
  children: React.ReactNode
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background transition-all duration-300">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen relative w-full max-w-full min-w-0">
        {/* Decorative Blurred Blobs for Visual Depth (isolated clip container to allow sticky header) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-blue-500/4 blur-3xl" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[25rem] h-[25rem] rounded-full bg-emerald-500/3 blur-3xl" />
        </div>

        {/* Top Header */}
        <Header user={user} />

        {/* Content Body with extra padding bottom on mobile to clear bottom navigation */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto py-6 lg:py-8 px-0 pb-24 md:pb-8 animate-fade-in relative z-10">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <MobileBottomNav role={user.role} />
    </div>
  )
}
