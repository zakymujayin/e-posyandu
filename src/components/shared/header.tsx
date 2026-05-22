"use client"

import { Menu } from "lucide-react"
import type { UserRole } from "@/types/next-auth"
import { MESSAGES } from "@/lib/messages"
import { NotificationBell } from "@/components/shared/notification-bell"

interface HeaderProps {
  user: {
    name: string
    role: UserRole
  }
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 h-16 bg-white border-b border-gray-200">
      <button className="md:hidden p-2 text-gray-600">
        <Menu className="w-5 h-5" />
      </button>
      <div className="md:hidden text-sm font-medium text-gray-700">
        {MESSAGES.roles[user.role]}
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="hidden md:flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{MESSAGES.roles[user.role]}</p>
          </div>
        </div>
      </div>
    </header>
  )
}