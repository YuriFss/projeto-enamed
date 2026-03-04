'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SpecialtyStats, WeeklyAccuracy } from '@/lib/types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import { BookOpen, Target, Clock, Flame, AlertTriangle } from 'lucide-react'

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
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-indigo-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total_answered}</p>
                <p className="text-xs text-gray-500">Questoes respondidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.accuracy}%</p>
                <p className="text-xs text-gray-500">Acuracia geral</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{formatStudyTime(stats.total_time_seconds)}</p>
                <p className="text-xs text-gray-500">Tempo de estudo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.study_streak}</p>
                <p className="text-xs text-gray-500">Dias seguidos</p>
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
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-12">Responda questoes para ver estatisticas</p>
            )}
          </CardContent>
        </Card>

        {/* Weekly evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolucao Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-12">Responda questoes para ver evolucao</p>
            )}
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
