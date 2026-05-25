"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Bell, X, CheckCheck, Trash2, BellOff } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  pengajuanId?: string | null
}

const ROLE_LINK_MAP: Record<string, string> = {
  POSYANDU: "/posyandu/riwayat",
  PETUGAS_DESA: "/petugas-desa/verifikasi",
  PETUGAS_OPD: "/opd/tindak-lanjut",
  PETUGAS_KECAMATAN: "/kecamatan",
  ADMIN_DPMD: "/admin/pengajuan",
}

function roleLink(pengajuanId: string | null | undefined, userRole: string): string | null {
  if (!pengajuanId) return null
  const base = ROLE_LINK_MAP[userRole]
  return base ? `${base}/${pengajuanId}` : null
}

interface Props {
  userRole: string
}

export function NotificationBell({ userRole }: Props) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => { setMounted(true) }, []) // eslint-disable-line react-hooks/set-state-in-effect

  const fetchNotifications = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchNotifications() // eslint-disable-line react-hooks/set-state-in-effect
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
        setConfirmClear(false)
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [])

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" })
    setUnread(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  async function markOneRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
    setUnread((prev) => Math.max(0, prev - 1))
  }

  async function clearAll() {
    await fetch("/api/notifications", { method: "DELETE" })
    setNotifications([])
    setUnread(0)
    setConfirmClear(false)
  }

  async function handleNotifClick(n: Notification) {
    if (!n.isRead) await markOneRead(n.id)
    const link = roleLink(n.pengajuanId, userRole)
    if (link) {
      setOpen(false)
      router.push(link)
    }
  }

  function handleClose() {
    setOpen(false)
    setConfirmClear(false)
  }

  return (
    <>
      {/* Bell trigger — stays inside header DOM */}
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Portal: escape the header's backdrop-filter stacking context */}
      {mounted && createPortal(
        <>
          {/* Backdrop overlay with blur */}
          <div
            className={`fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
              open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Slide-in drawer panel */}
          <div
            className={`fixed right-0 top-0 h-screen w-[320px] bg-white dark:bg-card border-l border-border shadow-2xl z-[201] flex flex-col transition-transform duration-300 ease-in-out ${
              open ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Notifikasi</h2>
                {unread > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
                    {unread}
                  </span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                aria-label="Tutup panel notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action bar */}
            {notifications.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 shrink-0">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Tandai semua dibaca
                  </button>
                )}
                <div className="flex-1" />
                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-destructive font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus semua
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Yakin?</span>
                    <button onClick={clearAll} className="text-[11px] text-destructive font-bold hover:underline">
                      Ya
                    </button>
                    <button onClick={() => setConfirmClear(false)} className="text-[11px] text-muted-foreground font-semibold hover:underline">
                      Batal
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/50">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
                  <BellOff className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground font-medium">Tidak ada notifikasi</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const link = roleLink(n.pengajuanId, userRole)
                  const isClickable = !!link
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`px-4 py-3.5 transition-colors ${
                        isClickable ? "cursor-pointer hover:bg-muted/50" : "cursor-default"
                      } ${!n.isRead ? "bg-blue-50/60 dark:bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start gap-2.5">
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        )}
                        <div className={!n.isRead ? "" : "ml-4"}>
                          <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-3">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground/50 mt-1 font-medium">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: localeId })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
