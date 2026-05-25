"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/config/navigation"
import type { UserRole } from "@/types/next-auth"
import {
  LogOut,
  Heart,
} from "lucide-react"

interface SidebarProps {
  user: {
    name: string
    email: string
    role: UserRole
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const items = NAV_ITEMS[user.role] ?? []

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white/60 dark:bg-card/60 border-r border-sidebar-border/60 flex-col z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] backdrop-blur-2xl transition-all duration-500">
      {/* Branding Header */}
      <div className="h-[72px] px-6 border-b border-sidebar-border/50 flex flex-col justify-center bg-transparent">
        <div className="flex items-center gap-3 relative group cursor-default">
          <div className="absolute -left-2 -top-2 size-14 bg-blue-500/20 dark:bg-blue-500/10 blur-xl rounded-full z-0 pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-70" />
          <div className="relative z-10 size-10 rounded-2xl shrink-0 overflow-hidden transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
            <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-[0_4px_10px_rgba(37,99,235,0.3),inset_0_1px_rgba(255,255,255,0.4)]">
              <Heart className="size-5 fill-white stroke-none drop-shadow-sm" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[16px] font-black tracking-tight text-foreground leading-none">
                e-Posyandu
              </h1>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>
            <p className="text-[12px] font-extrabold text-muted-foreground/75 uppercase tracking-widest leading-none mt-1">
              KABUPATEN LEBAK
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto bg-transparent">
        {items.map((item) => {
          const Icon = item.icon
          const isHomePath =
            item.href === "/admin" ||
            item.href === "/posyandu" ||
            item.href === "/petugas-desa" ||
            item.href === "/opd" ||
            item.href === "/"

          const isActive = isHomePath
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-300 ease-out select-none group/item relative overflow-hidden",
                isActive
                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 font-extrabold shadow-[inset_0_1px_rgba(255,255,255,0.5),0_2px_8px_rgba(37,99,235,0.08)]"
                  : "text-muted-foreground/80 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-blue-600 dark:hover:text-blue-400 hover:translate-x-1 hover:shadow-[inset_0_1px_rgba(255,255,255,0.5),0_4px_10px_rgba(0,0,0,0.02)]"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-blue-600 rounded-r-full shadow-[0_0_8px_rgba(37,99,235,0.5)] animate-in slide-in-from-left-2 duration-300" />
              )}
              <Icon
                className={cn(
                  "size-4.5 transition-transform duration-300 group-hover/item:scale-110",
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400"
                )}
              />
              <span className="truncate relative z-10">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Profile Footer */}
      <div className="p-4 border-t border-sidebar-border/50 bg-transparent">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[14px] font-semibold text-muted-foreground/80 hover:text-destructive hover:bg-destructive/5 border border-transparent hover:border-destructive/10 rounded-xl transition-all duration-300 hover:translate-x-1 hover:shadow-[0_4px_12px_rgba(244,63,94,0.08)] select-none"
        >
          <LogOut className="size-4.5 shrink-0" />
          Keluar Layanan
        </button>
      </div>
    </aside>
  )
}