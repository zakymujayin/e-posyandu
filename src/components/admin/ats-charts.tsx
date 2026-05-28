"use client"

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/typography"

const STATUS_COLORS = ["#ef4444", "#f59e0b", "#3b82f6"]
const BAR_COLOR = "#6366f1"

interface ChartData { name: string; value: number }

interface ATSChartsProps {
  statusData: ChartData[]
  alasanData: ChartData[]
  programData: ChartData[]
}

export function ATSCharts({ statusData, alasanData, programData }: ATSChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2 px-5 pt-4">
          <CardTitle className="text-sm">Distribusi Status Sekolah</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 px-5 pt-4">
          <CardTitle className="text-sm">Top 5 Alasan Tidak Sekolah</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={alasanData} margin={{ left: 0, right: 10 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 px-5 pt-4">
          <CardTitle className="text-sm">Program yang Dibutuhkan</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={programData} layout="vertical" margin={{ left: 60, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={60} />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
