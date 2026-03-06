'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SimulationSession, SessionQuestion } from '@/lib/types'
import { getQuestionAlternatives } from '@/lib/question-alternatives'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SimulationTimer } from '@/components/simulation-timer'
import { cn } from '@/lib/utils'
import { Flag, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'

interface SimulationActiveProps {
  session: SimulationSession
  sessionQuestions: SessionQuestion[]
  userId: string
}

export function SimulationActive({ session, sessionQuestions: initialSQ, userId }: SimulationActiveProps) {
  const [questions, setQuestions] = useState(initialSQ)
  const [pendingAnswers, setPendingAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>>({})
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnanswered = initialSQ.findIndex((sq) => !sq.selected_answer)
    return firstUnanswered >= 0 ? firstUnanswered : 0
  })
  const elapsedRef = useRef(session.time_spent_seconds)
  const questionStartRef = useRef(0)
  const [finishing, setFinishing] = useState(false)
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const current = questions[currentIndex]
  const question = current?.question

  const handleTick = useCallback((seconds: number) => {
    elapsedRef.current = seconds
  }, [])

  useEffect(() => {
    questionStartRef.current = window.performance.now()
  }, [currentIndex])

  const finishSimulation = useCallback(async () => {
    setFinishing(true)
    const correctCount = questions.filter((q) => q.is_correct).length

    await supabase
      .from('simulation_sessions')
      .update({
        status: 'completed',
        correct_answers: correctCount,
        time_spent_seconds: elapsedRef.current,
        finished_at: new Date().toISOString(),
      })
      .eq('id', session.id)

    router.push(`/simulado/resultado/${session.id}`)
  }, [questions, router, session.id, supabase])

  const handleTimeUp = useCallback(() => {
    void finishSimulation()
  }, [finishSimulation])

  function handleSelectAnswer(alt: 'A' | 'B' | 'C' | 'D' | 'E') {
    if (!current || !question) return
    if (current.selected_answer && session.mode === 'prova') return
    if (current.selected_answer && session.mode === 'estudo') return

    setPendingAnswers((previous) => ({ ...previous, [current.id]: alt }))
  }

  async function handleConfirmAnswer() {
    if (!current || !question || submittingAnswer) return
    if (current.selected_answer && session.mode === 'prova') return
    if (current.selected_answer && session.mode === 'estudo') return

    const pendingAnswer = pendingAnswers[current.id]

    if (!pendingAnswer) return

    setSubmittingAnswer(true)

    try {
      const timeSpent = Math.max(0, Math.round((window.performance.now() - questionStartRef.current) / 1000))
      const isCorrect = pendingAnswer === question.correct_answer

      const updatedQuestions = [...questions]
      updatedQuestions[currentIndex] = {
        ...current,
        selected_answer: pendingAnswer,
        is_correct: isCorrect,
        time_spent_seconds: timeSpent,
      }
      setQuestions(updatedQuestions)
      setPendingAnswers((previous) => {
        const next = { ...previous }
        delete next[current.id]
        return next
      })

      // Update in DB
      await supabase
        .from('session_questions')
        .update({ selected_answer: pendingAnswer, is_correct: isCorrect, time_spent_seconds: timeSpent })
        .eq('id', current.id)

      // Record attempt
      await supabase.from('question_attempts').insert({
        user_id: userId,
        question_id: current.question_id,
        session_id: session.id,
        selected_answer: pendingAnswer,
        is_correct: isCorrect,
        time_spent_seconds: timeSpent,
      })
    } finally {
      setSubmittingAnswer(false)
    }
  }

  function goTo(index: number) {
    setCurrentIndex(index)
  }

  async function toggleFlag() {
    const updatedQuestions = [...questions]
    updatedQuestions[currentIndex] = { ...current, flagged: !current.flagged }
    setQuestions(updatedQuestions)

    await supabase
      .from('session_questions')
      .update({ flagged: !current.flagged })
      .eq('id', current.id)
  }

  if (!question) return null

  const alternatives = getQuestionAlternatives(question)

  const isAnswered = !!current.selected_answer
  const showFeedback = session.mode === 'estudo' && isAnswered
  const pendingAnswer = current ? pendingAnswers[current.id] : undefined

  function getAlternativeStyle(alt: string) {
    if (!showFeedback) {
      return pendingAnswer === alt || current.selected_answer === alt
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
        : 'border-border hover:border-border/80'
    }
    if (alt === question!.correct_answer) {
      return 'border-green-500 bg-green-50 dark:bg-green-950'
    }
    if (alt === current.selected_answer && alt !== question!.correct_answer) {
      return 'border-red-500 bg-red-50 dark:bg-red-950'
    }
    return 'border-border opacity-60'
  }

  const answeredCount = questions.filter((q) => q.selected_answer).length

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Badge variant="outline">
            {session.mode === 'estudo' ? 'Modo Estudo' : 'Modo Prova'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {answeredCount}/{questions.length} respondidas
          </span>
        </div>
        <div className="flex items-center gap-3">
          <SimulationTimer
            initialSeconds={session.time_spent_seconds}
            timeLimitMinutes={session.time_limit_minutes}
            onTick={handleTick}
            onTimeUp={handleTimeUp}
          />
          <Button variant="destructive" size="sm" onClick={finishSimulation} disabled={finishing}>
            Finalizar
          </Button>
        </div>
      </div>

      {/* Question navigator grid */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {questions.map((sq, i) => (
          <button
            key={sq.id}
            onClick={() => goTo(i)}
            className={cn(
              'w-8 h-8 rounded text-xs font-medium border transition-colors',
              i === currentIndex && 'ring-2 ring-indigo-500',
              sq.selected_answer && session.mode === 'estudo' && sq.is_correct && 'bg-green-100 dark:bg-green-900 border-green-400',
              sq.selected_answer && session.mode === 'estudo' && !sq.is_correct && 'bg-red-100 dark:bg-red-900 border-red-400',
              sq.selected_answer && session.mode === 'prova' && 'bg-indigo-100 dark:bg-indigo-900 border-indigo-400',
              !sq.selected_answer && 'bg-background border-border',
              sq.flagged && 'ring-2 ring-yellow-400'
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Questao {currentIndex + 1} de {questions.length}
              </span>
              {question.specialty && (
                <Badge variant="outline" style={{ borderColor: question.specialty.color, color: question.specialty.color }}>
                  {question.specialty.name}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFlag}
              className={current.flagged ? 'text-yellow-500' : ''}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-base leading-relaxed mb-6 whitespace-pre-line">
            {question.statement}
          </p>

          <div className="space-y-3">
            {alternatives.map((alternative) => (
              <button
                key={alternative.key}
                onClick={() => handleSelectAnswer(alternative.key)}
                disabled={isAnswered || submittingAnswer}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                  getAlternativeStyle(alternative.key),
                  !isAnswered && 'cursor-pointer'
                )}
              >
                <span className="font-medium mr-3">({alternative.key})</span>
                {alternative.text}
              </button>
            ))}
          </div>

          {!isAnswered && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <div>
                <p className="text-sm font-medium">
                  {pendingAnswer ? `Alternativa ${pendingAnswer} selecionada` : 'Escolha uma alternativa'}
                </p>
                <p className="text-sm text-muted-foreground">
                  O simulado so contabiliza a resposta depois da confirmacao.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {pendingAnswer && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setPendingAnswers((previous) => {
                        const next = { ...previous }
                        delete next[current.id]
                        return next
                      })
                    }
                    disabled={submittingAnswer}
                  >
                    Limpar
                  </Button>
                )}
                <Button onClick={handleConfirmAnswer} disabled={!pendingAnswer || submittingAnswer}>
                  {submittingAnswer ? 'Confirmando...' : 'Confirmar resposta'}
                </Button>
              </div>
            </div>
          )}

          {showFeedback && question.explanation && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Explicacao:</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">{question.explanation}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            {currentIndex < questions.length - 1 ? (
              <Button onClick={() => goTo(currentIndex + 1)}>
                Proxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={finishSimulation} disabled={finishing}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Finalizar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
