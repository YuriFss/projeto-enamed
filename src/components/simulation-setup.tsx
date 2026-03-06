'use client'

import { useEffect, useState } from 'react'
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

const DEFAULT_NUM_QUESTIONS = 10
const MAX_NUM_QUESTIONS = 100
const DEFAULT_TIME_LIMIT = '0'
const MAX_TIME_LIMIT = 300

function sanitizeNumericInput(value: string) {
  return value.replace(/\D/g, '')
}

function parseIntegerInput(value: string) {
  if (!value) {
    return null
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function getFilteredExamIds(exams: Exam[], examType: string, year: string) {
  return exams
    .filter((exam) => {
      if (examType && exam.type !== examType) {
        return false
      }

      if (year && exam.year !== Number(year)) {
        return false
      }

      return true
    })
    .map((exam) => exam.id)
}

export function SimulationSetup({ exams, specialties, activeSessionId }: SimulationSetupProps) {
  const [mode, setMode] = useState<'prova' | 'estudo'>('estudo')
  const [examType, setExamType] = useState('')
  const [year, setYear] = useState('')
  const [specialtyId, setSpecialtyId] = useState('')
  const [numQuestionsInput, setNumQuestionsInput] = useState(String(DEFAULT_NUM_QUESTIONS))
  const [timeLimitInput, setTimeLimitInput] = useState(DEFAULT_TIME_LIMIT)
  const [availableQuestions, setAvailableQuestions] = useState<number | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(true)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [numQuestionsError, setNumQuestionsError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const years = [...new Set(exams.map((e) => e.year))].sort((a, b) => b - a)
  const parsedNumQuestions = parseIntegerInput(numQuestionsInput)
  const parsedTimeLimit = parseIntegerInput(timeLimitInput)
  const maxSelectableQuestions =
    availableQuestions === null ? MAX_NUM_QUESTIONS : Math.min(availableQuestions, MAX_NUM_QUESTIONS)
  const isNumQuestionsInvalid =
    parsedNumQuestions === null ||
    parsedNumQuestions < 1 ||
    parsedNumQuestions > MAX_NUM_QUESTIONS ||
    (availableQuestions !== null && parsedNumQuestions > availableQuestions)
  const isTimeLimitInvalid = parsedTimeLimit !== null && parsedTimeLimit > MAX_TIME_LIMIT

  useEffect(() => {
    let isActive = true

    async function loadAvailableQuestions() {
      setCheckingAvailability(true)
      setAvailabilityError(null)

      const examIds = getFilteredExamIds(exams, examType, year)

      if ((examType || year) && examIds.length === 0) {
        if (!isActive) {
          return
        }

        setAvailableQuestions(0)
        setCheckingAvailability(false)
        return
      }

      const supabase = createClient()
      let query = supabase.from('questions').select('id', { count: 'exact', head: true })

      if (examIds.length > 0) {
        query = query.in('exam_id', examIds)
      }

      if (specialtyId) {
        query = query.eq('specialty_id', specialtyId)
      }

      const { count, error } = await query

      if (!isActive) {
        return
      }

      if (error) {
        console.error(error)
        setAvailableQuestions(null)
        setAvailabilityError('Nao foi possivel validar o total de questoes agora.')
        setCheckingAvailability(false)
        return
      }

      setAvailableQuestions(count ?? 0)
      setCheckingAvailability(false)
    }

    void loadAvailableQuestions()

    return () => {
      isActive = false
    }
  }, [examType, year, specialtyId, exams])

  function handleNumQuestionsBlur() {
    const parsedValue = parseIntegerInput(numQuestionsInput)

    if (parsedValue === null || availableQuestions === 0) {
      return
    }

    const normalizedValue = Math.max(1, Math.min(parsedValue, maxSelectableQuestions))
    setNumQuestionsInput(String(normalizedValue))
  }

  function handleTimeLimitBlur() {
    const parsedValue = parseIntegerInput(timeLimitInput)

    if (parsedValue === null) {
      return
    }

    const normalizedValue = Math.min(parsedValue, MAX_TIME_LIMIT)
    setTimeLimitInput(String(normalizedValue))
  }

  async function handleStart() {
    const requestedQuestions = parseIntegerInput(numQuestionsInput)

    if (requestedQuestions === null) {
      setNumQuestionsError('Informe quantas questoes voce quer no simulado.')
      return
    }

    if (requestedQuestions < 1) {
      setNumQuestionsError('O simulado precisa ter pelo menos 1 questao.')
      return
    }

    if (requestedQuestions > MAX_NUM_QUESTIONS) {
      setNumQuestionsError(`Escolha ate ${MAX_NUM_QUESTIONS} questoes por simulado.`)
      return
    }

    if (availableQuestions !== null && requestedQuestions > availableQuestions) {
      setNumQuestionsError(`Esse recorte tem ${availableQuestions} questoes disponiveis.`)
      return
    }

    setNumQuestionsError(null)
    setLoading(true)

    const supabase = createClient()

    // Build filters for question selection
    const filters: Record<string, string> = {}
    if (examType) filters.type = examType
    if (year) filters.year = year
    if (specialtyId) filters.specialty_id = specialtyId

    const examIds = getFilteredExamIds(exams, examType, year)

    if ((examType || year) && examIds.length === 0) {
      setNumQuestionsError('Nenhuma questao encontrada com esses filtros.')
      setLoading(false)
      return
    }

    // Fetch questions matching filters
    let query = supabase.from('questions').select('id')

    if (examIds.length > 0) {
      query = query.in('exam_id', examIds)
    }
    if (specialtyId) {
      query = query.eq('specialty_id', specialtyId)
    }

    const { data: allQuestions, error: questionsError } = await query

    if (questionsError) {
      console.error(questionsError)
      setNumQuestionsError('Nao foi possivel carregar as questoes desse recorte.')
      setLoading(false)
      return
    }

    if (!allQuestions || allQuestions.length === 0) {
      setNumQuestionsError('Nenhuma questao encontrada com esses filtros.')
      setLoading(false)
      return
    }

    if (requestedQuestions > allQuestions.length) {
      setNumQuestionsError(`Esse recorte tem ${allQuestions.length} questoes disponiveis.`)
      setLoading(false)
      return
    }

    // Shuffle and pick
    const shuffled = allQuestions.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, requestedQuestions)

    // Get user
    const { data: { user } } = await supabase.auth.getUser()

    const timeLimit = Math.min(parsedTimeLimit ?? 0, MAX_TIME_LIMIT)

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
                type="button"
                variant={mode === 'estudo' ? 'default' : 'outline'}
                onClick={() => setMode('estudo')}
                className="flex-1"
              >
                Estudo
              </Button>
              <Button
                type="button"
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
            <div className="mb-2 flex items-center justify-between gap-3">
              <Label>Quantidade de questoes</Label>
              <span className="text-xs text-muted-foreground">
                {checkingAvailability
                  ? 'Consultando banco...'
                  : availableQuestions === null
                    ? 'Total indisponivel'
                    : `${availableQuestions} disponiveis`}
              </span>
            </div>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={maxSelectableQuestions > 0 ? maxSelectableQuestions : MAX_NUM_QUESTIONS}
              value={numQuestionsInput}
              onChange={(e) => {
                setNumQuestionsInput(sanitizeNumericInput(e.target.value))
                setNumQuestionsError(null)
              }}
              onBlur={handleNumQuestionsBlur}
              aria-invalid={numQuestionsError ? 'true' : 'false'}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {availabilityError
                ? availabilityError
                : availableQuestions === 0
                  ? 'Nao existem questoes para esse recorte. Ajuste os filtros para continuar.'
                  : 'Apague o valor e digite outro numero livremente.'}
            </p>
            {numQuestionsError && (
              <p className="mt-2 text-sm text-destructive">{numQuestionsError}</p>
            )}
          </div>

          <div>
            <Label className="mb-2 block">Tempo limite (minutos, 0 = sem limite)</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_TIME_LIMIT}
              value={timeLimitInput}
              onChange={(e) => setTimeLimitInput(sanitizeNumericInput(e.target.value))}
              onBlur={handleTimeLimitBlur}
              aria-invalid={isTimeLimitInvalid ? 'true' : 'false'}
            />
            {isTimeLimitInvalid && (
              <p className="mt-2 text-sm text-destructive">
                Escolha ate {MAX_TIME_LIMIT} minutos.
              </p>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleStart}
            disabled={
              loading ||
              checkingAvailability ||
              availableQuestions === 0 ||
              isNumQuestionsInvalid ||
              isTimeLimitInvalid
            }
          >
            {loading ? 'Criando...' : 'Iniciar Simulado'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
