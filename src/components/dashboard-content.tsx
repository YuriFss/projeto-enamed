'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SpecialtyStats, WeeklyAccuracy } from '@/lib/types'
import { BookOpen, Target, Clock, Flame, AlertTriangle } from 'lucide-react'

const SpecialtyBarChart = dynamic(
  () => import('@/components/dashboard-charts').then((m) => m.SpecialtyBarChart),
  { loading: () => <div className="h-[200px] sm:h-[300px] bg-gray-100 animate-pulse rounded" /> }
)

const WeeklyLineChart = dynamic(
  () => import('@/components/dashboard-charts').then((m) => m.WeeklyLineChart),
  { loading: () => <div className="h-[200px] sm:h-[300px] bg-gray-100 animate-pulse rounded" /> }
)

interface DashboardContentProps {
  stats: {
    total_answered: number
    total_correct: number
    accuracy: number
    total_time_seconds: number
    study_streak: number
    total_sessions: number
  }
  specialtyStats: SpecialtyStats[]
  weeklyAccuracy: WeeklyAccuracy[]
}

function formatStudyTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes}min`
}

export function DashboardContent({ stats, specialtyStats, weeklyAccuracy }: DashboardContentProps) {
  const weakPoints = [...specialtyStats]
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)

  const barData = specialtyStats.map((s) => ({
    name: s.specialty_name.length > 12 ? s.specialty_name.slice(0, 12) + '...' : s.specialty_name,
    accuracy: Number(s.accuracy),
    fill: s.specialty_color,
  }))

  const lineData = weeklyAccuracy.map((w) => ({
    week: w.week,
    accuracy: Number(w.accuracy),
    total: Number(w.total),
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.total_answered}</p>
                <p className="text-xs text-gray-500 truncate">Questoes respondidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.accuracy}%</p>
                <p className="text-xs text-gray-500 truncate">Acuracia geral</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{formatStudyTime(stats.total_time_seconds)}</p>
                <p className="text-xs text-gray-500 truncate">Tempo de estudo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.study_streak}</p>
                <p className="text-xs text-gray-500 truncate">Dias seguidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Accuracy by specialty */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acuracia por Especialidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] sm:h-[300px]">
              <SpecialtyBarChart data={barData} />
            </div>
          </CardContent>
        </Card>

        {/* Weekly evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolucao Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] sm:h-[300px]">
              <WeeklyLineChart data={lineData} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weak points */}
      {weakPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Pontos Fracos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weakPoints.map((sp) => (
                <div key={sp.specialty_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sp.specialty_color }} />
                    <span className="text-sm font-medium">{sp.specialty_name}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{sp.accuracy}%</span>
                    <span className="text-gray-400 ml-2">({sp.correct_attempts}/{sp.total_attempts})</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.total_answered === 0 && (
        <Card className="mt-6">
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-medium text-gray-700 mb-2">Comece a estudar!</h2>
            <p className="text-gray-500 mb-4">Responda questoes ou faca simulados para ver suas estatisticas aqui.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
