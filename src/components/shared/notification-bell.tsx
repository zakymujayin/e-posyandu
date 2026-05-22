"use client"

import { useState, useEffect, useRef } from "react"
import { Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { id as localeId } from "date-fns/locale"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  pengajuanId?: string | null
}

function roleLink(pengajuanId: string | null | undefined, type: string): string | null {
  if (!pengajuanId) return null
  // Return null — the bell is used in a shared header; link to /admin/pengajuan/:id is safe for admin
  // Actual role-routing can be done server-side if needed; for now return the generic admin path as fallback
  return null
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications")
      const json = await res.json()
      if (json.success) {
        setNotifications(json.data.notifications)
        setUnread(json.data.unreadCount)
      }
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" })
    setUnread(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleOpen() {
    setOpen((prev) => {
      if (!prev) markAllRead()
      return !prev
    })
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-[-12px] sm:right-0 top-full mt-2 w-80 max-w-[calc(100vw-24px)] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Notifikasi</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Tidak ada notifikasi</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-blue-50" : ""}`}
                >
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: localeId })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
