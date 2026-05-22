"use client"

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface MonthlyPoint {
  month: string
  count: number
}

interface StatusPoint {
  status: string
  count: number
}

interface OpdPoint {
  name: string
  count: number
}

interface Props {
  monthlyData: MonthlyPoint[]
  byStatus: StatusPoint[]
  byOpd: OpdPoint[]
}

export function LaporanCharts({ monthlyData, byStatus, byOpd }: Props) {
  return (
    <div className="space-y-4">
      {/* Monthly Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-base font-bold text-foreground mb-4">Tren Pengajuan 12 Bulan Terakhir</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(v) => [v, "Pengajuan"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorCount)"
              dot={{ r: 3, fill: "#3b82f6" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Distribusi Status</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byStatus} layout="vertical" margin={{ top: 0, right: 24, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="status" width={110} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, "Jumlah"]} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top OPD */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Pengajuan per OPD</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byOpd} layout="vertical" margin={{ top: 0, right: 24, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v}
              />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, "Jumlah"]} />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
