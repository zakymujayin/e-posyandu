"use client"

import { Heart, LogOut, User } from "lucide-react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { UserRole } from "@/types/next-auth"
import { MESSAGES } from "@/lib/messages"
import { NotificationBell } from "@/components/shared/notification-bell"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  user: { name: string; role: UserRole }
  logoUrl?: string | null
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 z-30 flex items-center justify-between px-4 md:px-6 h-16 md:h-[72px] bg-white/80 dark:bg-card/80 backdrop-blur-sm border-b border-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.03),inset_0_-1px_0_rgba(255,255,255,1)]">
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        <div className="md:hidden flex items-center gap-2">
          <div className="size-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
            <Heart className="size-3.5 fill-white stroke-none drop-shadow-sm" />
          </div>
          <h1 className="text-[17px] font-black tracking-tight text-slate-800">e-Posyandu</h1>
        </div>
        <div className="hidden md:contents">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell userRole={user.role} />

        <div className="h-5 w-px bg-border hidden md:block" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 hover:opacity-75 transition-opacity cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[14px] font-bold shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[14px] font-bold text-slate-800 leading-none">{user.name}</p>
              <span className="text-[12px] font-bold text-blue-600 uppercase tracking-wider block mt-1.5 leading-none">
                {MESSAGES.roles[user.role]}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuItem onClick={() => router.push("/profil")}>
              <User className="mr-2 size-4" /> Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 size-4" /> Keluar Layanan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}