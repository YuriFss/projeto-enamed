'use client'

import { useEffect, useRef, useState } from 'react'
import { Question, QuestionAttempt } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Bookmark, BookmarkCheck, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface QuestionViewProps {
  question: Question
  isBookmarked: boolean
  lastAttempt: QuestionAttempt | null
  userId: string
  onAnswer?: (answer: string, isCorrect: boolean) => void
  showNavigation?: boolean
  backHref?: string
  nextQuestionHref?: string | null
}

const alternatives = ['A', 'B', 'C', 'D', 'E'] as const

const difficultyColors: Record<string, string> = {
  facil: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  medio: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  dificil: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
}

export function QuestionView({
  question,
  isBookmarked: initialBookmarked,
  lastAttempt,
  userId,
  onAnswer,
  showNavigation = true,
  backHref = '/questoes',
  nextQuestionHref = null,
}: QuestionViewProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const supabase = createClient()
  const startTimeRef = useRef(0)

  useEffect(() => {
    startTimeRef.current = window.performance.now()
  }, [])

  const alternativeTexts: Record<string, string> = {
    A: question.alternative_a,
    B: question.alternative_b,
    C: question.alternative_c,
    D: question.alternative_d,
    E: question.alternative_e,
  }

  async function handleSelect(alt: string, timeStamp: number) {
    if (answered) return
    setSelected(alt)
    setAnswered(true)
    const isCorrect = alt === question.correct_answer
    const timeSpent = Math.max(0, Math.round((timeStamp - startTimeRef.current) / 1000))

    // Save attempt
    await supabase.from('question_attempts').insert({
      user_id: userId,
      question_id: question.id,
      selected_answer: alt,
      is_correct: isCorrect,
      time_spent_seconds: timeSpent,
    })

    if (onAnswer) {
      onAnswer(alt, isCorrect)
    }
  }

  async function toggleBookmark() {
    if (bookmarked) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('question_id', question.id)
        .eq('user_id', userId)
    } else {
      await supabase.from('bookmarks').insert({
        user_id: userId,
        question_id: question.id,
      })
    }
    setBookmarked(!bookmarked)
  }

  function getAlternativeStyle(alt: string) {
    if (!answered) {
      return selected === alt ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-border hover:border-border/80'
    }
    if (alt === question.correct_answer) {
      return 'border-green-500 bg-green-50 dark:bg-green-950'
    }
    if (alt === selected && alt !== question.correct_answer) {
      return 'border-red-500 bg-red-50 dark:bg-red-950'
    }
    return 'border-border opacity-60'
  }

  return (
    <div className="max-w-3xl mx-auto">
      {showNavigation && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao banco
          </Link>

          {nextQuestionHref && (
            <Button asChild variant="outline" size="sm">
              <Link href={nextQuestionHref}>
                Proxima nao respondida
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">
                {question.exam?.name} — Q{question.number}
              </span>
              <Badge variant="outline" style={{ borderColor: question.specialty?.color, color: question.specialty?.color }}>
                {question.specialty?.name}
              </Badge>
              <Badge className={difficultyColors[question.difficulty]}>
                {question.difficulty}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleBookmark}>
              {bookmarked ? (
                <BookmarkCheck className="h-5 w-5 text-indigo-600" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
          </div>

          <p className="text-base leading-relaxed mb-6 whitespace-pre-line">
            {question.statement}
          </p>

          <div className="space-y-3">
            {alternatives.map((alt) => (
              <button
                key={alt}
                onClick={(event) => handleSelect(alt, event.timeStamp)}
                disabled={answered}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                  getAlternativeStyle(alt),
                  !answered && 'cursor-pointer'
                )}
              >
                <span className="font-medium mr-3">({alt})</span>
                {alternativeTexts[alt]}
              </button>
            ))}
          </div>

          {answered && question.explanation && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Explicacao:</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">{question.explanation}</p>
            </div>
          )}

          {lastAttempt && !answered && (
            <div className="mt-4 p-3 bg-muted/50 border rounded-lg">
              <p className="text-sm text-muted-foreground">
                Ultima tentativa: respondeu <span className={lastAttempt.is_correct ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>({lastAttempt.selected_answer})</span>
                {lastAttempt.is_correct ? ' — Acertou!' : ` — Errou. Correta: (${question.correct_answer})`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
