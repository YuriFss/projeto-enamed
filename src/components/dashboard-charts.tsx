'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'

interface SpecialtyBarChartProps {
  data: { name: string; accuracy: number; fill: string }[]
}

export function SpecialtyBarChart({ data }: SpecialtyBarChartProps) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-center py-12">Responda questoes para ver estatisticas</p>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} unit="%" />
        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => `${value}%`} />
        <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface WeeklyLineChartProps {
  data: { week: string; accuracy: number; total: number }[]
}

export function WeeklyLineChart({ data }: WeeklyLineChartProps) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-center py-12">Responda questoes para ver evolucao</p>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} unit="%" />
        <Tooltip formatter={(value) => `${value}%`} />
        <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
