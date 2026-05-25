"use client"

import { useEffect, useState } from "react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Loader2 } from "lucide-react"

interface StatData {
  summary: { totalBalita: number; ditimbangBulanIni: number; belumDitimbang: number; persentaseDitimbang: number }
  statusGizi: Array<{ status: string; count: number }>
  monthlyTrend: Array<{ bulan: string; count: number }>
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"]

export function LaporanBalitaCharts() {
  const [data, setData] = useState<StatData | null>(null)

  useEffect(() => {
    fetch("/api/admin/laporan/balita/statistik")
      .then((r) => r.json())
      .then((d) => { if (d.data) setData(d.data) })
      .catch(console.error)
  }, [])

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-base font-bold text-foreground mb-4">Tren Penimbangan 12 Bulan</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.monthlyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, "Balita"]} />
            <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#colorBalita)" dot={{ r: 3, fill: "#10b981" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Distribusi Status Gizi</h2>
          {data.statusGizi.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.statusGizi} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {data.statusGizi.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Penimbangan per Bulan</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthlyTrend} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, "Balita"]} />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
