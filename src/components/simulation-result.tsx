'use client'

import Link from 'next/link'
import { SimulationSession, SessionQuestion } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, Target, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SimulationResultProps {
  session: SimulationSession
  sessionQuestions: SessionQuestion[]
}

export function SimulationResult({ session, sessionQuestions }: SimulationResultProps) {
  const correctCount = sessionQuestions.filter((sq) => sq.is_correct).length
  const totalCount = sessionQuestions.length
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}min`
    return `${m}min ${s}s`
  }

  // Stats by specialty
  const specialtyMap = new Map<string, { name: string; color: string; total: number; correct: number }>()
  sessionQuestions.forEach((sq) => {
    const spec = sq.question?.specialty
    if (!spec) return
    const entry = specialtyMap.get(spec.id) || { name: spec.name, color: spec.color, total: 0, correct: 0 }
    entry.total++
    if (sq.is_correct) entry.correct++
    specialtyMap.set(spec.id, entry)
  })

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/simulado" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Novo simulado
      </Link>

      <h1 className="text-2xl font-bold mb-6">Resultado do Simulado</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-indigo-600" />
            <p className="text-2xl font-bold">{accuracy}%</p>
            <p className="text-xs text-muted-foreground">Acuracia</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">{correctCount}/{totalCount}</p>
            <p className="text-xs text-muted-foreground">Acertos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">{formatTime(session.time_spent_seconds)}</p>
            <p className="text-xs text-muted-foreground">Tempo total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Badge className="mx-auto mb-1">{session.mode}</Badge>
            <p className="text-xs text-muted-foreground mt-2">Modo</p>
          </CardContent>
        </Card>
      </div>

      {/* Specialty breakdown */}
      {specialtyMap.size > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Por Especialidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(specialtyMap.values()).map((spec) => {
                const pct = Math.round((spec.correct / spec.total) * 100)
                return (
                  <div key={spec.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: spec.color }} className="font-medium">{spec.name}</span>
                      <span>{spec.correct}/{spec.total} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: spec.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Questoes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessionQuestions.map((sq) => (
              <Link
                key={sq.id}
                href={`/questoes/${sq.question_id}`}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                {sq.is_correct ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{sq.question?.statement}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      Sua: ({sq.selected_answer})
                    </span>
                    {!sq.is_correct && (
                      <span className="text-xs text-green-600">
                        Correta: ({sq.question?.correct_answer})
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
