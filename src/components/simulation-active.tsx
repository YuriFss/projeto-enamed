'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SimulationSession, SessionQuestion } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Clock, Flag, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'

interface SimulationActiveProps {
  session: SimulationSession
  sessionQuestions: SessionQuestion[]
  userId: string
}

const alternatives = ['A', 'B', 'C', 'D', 'E'] as const

export function SimulationActive({ session, sessionQuestions: initialSQ, userId }: SimulationActiveProps) {
  const [questions, setQuestions] = useState(initialSQ)
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnanswered = initialSQ.findIndex((sq) => !sq.selected_answer)
    return firstUnanswered >= 0 ? firstUnanswered : 0
  })
  const [elapsedSeconds, setElapsedSeconds] = useState(session.time_spent_seconds)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [finishing, setFinishing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const current = questions[currentIndex]
  const question = current?.question

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Check time limit
  useEffect(() => {
    if (session.time_limit_minutes && elapsedSeconds >= session.time_limit_minutes * 60) {
      finishSimulation()
    }
  }, [elapsedSeconds, session.time_limit_minutes])

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const timeLeft = session.time_limit_minutes
    ? Math.max(0, session.time_limit_minutes * 60 - elapsedSeconds)
    : null

  async function handleAnswer(alt: 'A' | 'B' | 'C' | 'D' | 'E') {
    if (current.selected_answer && session.mode === 'prova') return
    if (current.selected_answer && session.mode === 'estudo') return

    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    const isCorrect = alt === question!.correct_answer

    const updatedQuestions = [...questions]
    updatedQuestions[currentIndex] = {
      ...current,
      selected_answer: alt,
      is_correct: isCorrect,
      time_spent_seconds: timeSpent,
    }
    setQuestions(updatedQuestions)

    // Update in DB
    await supabase
      .from('session_questions')
      .update({ selected_answer: alt, is_correct: isCorrect, time_spent_seconds: timeSpent })
      .eq('id', current.id)

    // Record attempt
    await supabase.from('question_attempts').insert({
      user_id: userId,
      question_id: current.question_id,
      session_id: session.id,
      selected_answer: alt,
      is_correct: isCorrect,
      time_spent_seconds: timeSpent,
    })
  }

  function goTo(index: number) {
    setCurrentIndex(index)
    setQuestionStartTime(Date.now())
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

  async function finishSimulation() {
    setFinishing(true)
    const correctCount = questions.filter((q) => q.is_correct).length

    await supabase
      .from('simulation_sessions')
      .update({
        status: 'completed',
        correct_answers: correctCount,
        time_spent_seconds: elapsedSeconds,
        finished_at: new Date().toISOString(),
      })
      .eq('id', session.id)

    router.push(`/simulado/resultado/${session.id}`)
  }

  if (!question) return null

  const alternativeTexts: Record<string, string> = {
    A: question.alternative_a,
    B: question.alternative_b,
    C: question.alternative_c,
    D: question.alternative_d,
    E: question.alternative_e,
  }

  const isAnswered = !!current.selected_answer
  const showFeedback = session.mode === 'estudo' && isAnswered

  function getAlternativeStyle(alt: string) {
    if (!showFeedback) {
      return current.selected_answer === alt ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
    }
    if (alt === question!.correct_answer) {
      return 'border-green-500 bg-green-50'
    }
    if (alt === current.selected_answer && alt !== question!.correct_answer) {
      return 'border-red-500 bg-red-50'
    }
    return 'border-gray-200 opacity-60'
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
          <span className="text-sm text-gray-500">
            {answeredCount}/{questions.length} respondidas
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm font-mono">
            <Clock className="h-4 w-4" />
            {timeLeft !== null ? formatTime(timeLeft) : formatTime(elapsedSeconds)}
          </div>
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
              sq.selected_answer && session.mode === 'estudo' && sq.is_correct && 'bg-green-100 border-green-400',
              sq.selected_answer && session.mode === 'estudo' && !sq.is_correct && 'bg-red-100 border-red-400',
              sq.selected_answer && session.mode === 'prova' && 'bg-indigo-100 border-indigo-400',
              !sq.selected_answer && 'bg-white border-gray-300',
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
              <span className="text-sm font-medium text-gray-500">
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
            {alternatives.map((alt) => (
              <button
                key={alt}
                onClick={() => handleAnswer(alt)}
                disabled={isAnswered}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                  getAlternativeStyle(alt),
                  !isAnswered && 'cursor-pointer'
                )}
              >
                <span className="font-medium mr-3">({alt})</span>
                {alternativeTexts[alt]}
              </button>
            ))}
          </div>

          {showFeedback && question.explanation && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-1">Explicacao:</p>
              <p className="text-sm text-blue-700">{question.explanation}</p>
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
