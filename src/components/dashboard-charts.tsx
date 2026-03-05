'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface SpecialtyBarChartProps {
  data: { name: string; accuracy: number; fill: string }[]
}

interface WeeklyLineChartProps {
  data: { week: string; accuracy: number; total: number }[]
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: { total?: number } }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const point = payload[0]

  return (
    <div className="rounded-2xl border border-white/70 bg-white/92 px-4 py-3 shadow-[0_22px_55px_-30px_rgba(15,23,42,0.5)] backdrop-blur-md dark:border-border dark:bg-card/95">
      {label && <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>}
      <p className="mt-1 text-base font-semibold">{point.value}% de acuracia</p>
      {typeof point.payload?.total === 'number' && (
        <p className="mt-1 text-sm text-muted-foreground">{point.payload.total} questoes respondidas</p>
      )}
    </div>
  )
}

export function SpecialtyBarChart({ data }: SpecialtyBarChartProps) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">Responda questoes para liberar esse painel.</p>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 4 }} barCategoryGap={14}>
        <CartesianGrid horizontal stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: '#64748B' }}
          unit="%"
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: '#0F172A' }}
        />
        <Tooltip cursor={{ fill: 'rgba(236, 72, 153, 0.08)' }} content={<ChartTooltip />} />
        <Bar dataKey="accuracy" radius={[0, 14, 14, 0]} maxBarSize={26}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} fillOpacity={0.92} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function WeeklyLineChart({ data }: WeeklyLineChartProps) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">Responda questoes ao longo das semanas para ver a curva.</p>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
        <defs>
          <linearGradient id="weeklyTrendStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#DB2777" />
            <stop offset="100%" stopColor="#F9A8D4" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
        <XAxis
          dataKey="week"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: '#64748B' }}
        />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: '#64748B' }}
          unit="%"
        />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="accuracy"
          stroke="url(#weeklyTrendStroke)"
          strokeWidth={3}
          dot={{ r: 4, fill: '#DB2777', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#F472B6', stroke: '#ffffff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
