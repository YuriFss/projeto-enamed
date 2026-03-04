'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Exam, Specialty } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface SimulationSetupProps {
  exams: Exam[]
  specialties: Specialty[]
  activeSessionId?: string
}

export function SimulationSetup({ exams, specialties, activeSessionId }: SimulationSetupProps) {
  const [mode, setMode] = useState<'prova' | 'estudo'>('estudo')
  const [examType, setExamType] = useState('')
  const [year, setYear] = useState('')
  const [specialtyId, setSpecialtyId] = useState('')
  const [numQuestions, setNumQuestions] = useState(10)
  const [timeLimit, setTimeLimit] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const years = [...new Set(exams.map((e) => e.year))].sort((a, b) => b - a)

  async function handleStart() {
    setLoading(true)

    // Build filters for question selection
    const filters: Record<string, string> = {}
    if (examType) filters.type = examType
    if (year) filters.year = year
    if (specialtyId) filters.specialty_id = specialtyId

    // Fetch questions matching filters
    let query = supabase.from('questions').select('id, exam:exams!inner(type, year)')

    if (examType) {
      query = query.eq('exam.type', examType)
    }
    if (year) {
      query = query.eq('exam.year', parseInt(year))
    }
    if (specialtyId) {
      query = query.eq('specialty_id', specialtyId)
    }

    const { data: allQuestions } = await query

    if (!allQuestions || allQuestions.length === 0) {
      alert('Nenhuma questao encontrada com esses filtros.')
      setLoading(false)
      return
    }

    // Shuffle and pick
    const shuffled = allQuestions.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(numQuestions, allQuestions.length))

    // Get user
    const { data: { user } } = await supabase.auth.getUser()

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('simulation_sessions')
      .insert({
        user_id: user!.id,
        mode,
        total_questions: selected.length,
        time_limit_minutes: timeLimit || null,
        filters,
      })
      .select()
      .single()

    if (sessionError) {
      console.error(sessionError)
      setLoading(false)
      return
    }

    // Insert session questions
    const sessionQuestions = selected.map((q, i) => ({
      session_id: session.id,
      question_id: q.id,
      position: i + 1,
    }))

    await supabase.from('session_questions').insert(sessionQuestions)

    router.push(`/simulado/${session.id}`)
  }

  return (
    <div className="max-w-lg mx-auto">
      {activeSessionId && (
        <Card className="mb-6 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm text-indigo-700 dark:text-indigo-300">Voce tem um simulado em andamento.</p>
            <Link href={`/simulado/${activeSessionId}`}>
              <Button size="sm">Continuar</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Novo Simulado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="mb-2 block">Modo</Label>
            <div className="flex gap-3">
              <Button
                variant={mode === 'estudo' ? 'default' : 'outline'}
                onClick={() => setMode('estudo')}
                className="flex-1"
              >
                Estudo
              </Button>
              <Button
                variant={mode === 'prova' ? 'default' : 'outline'}
                onClick={() => setMode('prova')}
                className="flex-1"
              >
                Prova
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === 'estudo' ? 'Feedback imediato apos cada resposta' : 'Sem feedback ate o final'}
            </p>
          </div>

          <div>
            <Label className="mb-2 block">Prova</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="ENARE">ENARE</option>
              <option value="ENAMED">ENAMED</option>
            </select>
          </div>

          <div>
            <Label className="mb-2 block">Ano</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">Todos</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="mb-2 block">Especialidade</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
            >
              <option value="">Todas</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="mb-2 block">Numero de questoes</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value) || 10)}
            />
          </div>

          <div>
            <Label className="mb-2 block">Tempo limite (minutos, 0 = sem limite)</Label>
            <Input
              type="number"
              min={0}
              max={300}
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
            />
          </div>

          <Button className="w-full" onClick={handleStart} disabled={loading}>
            {loading ? 'Criando...' : 'Iniciar Simulado'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
