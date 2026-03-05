'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FastForward,
  Layers3,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatAttemptDate, formatAverageQuestionTime } from '@/lib/question-progress'
import { createClient } from '@/lib/supabase/client'
import { Question, QuestionAttempt, QuestionHistorySummary } from '@/lib/types'
import { cn } from '@/lib/utils'

interface QuestionViewProps {
  question: Question
  isBookmarked: boolean
  lastAttempt: QuestionAttempt | null
  historySummary?: QuestionHistorySummary | null
  userId: string
  onAnswer?: (answer: string, isCorrect: boolean) => void
  showNavigation?: boolean
  backHref?: string
  previousQuestionHref?: string | null
  nextQuestionHref?: string | null
  skipQuestionHref?: string | null
  hidePreviousAttempt?: boolean
  sequenceContext?: {
    currentPosition: number
    totalCount: number
    answeredCount: number
    unansweredCount: number
  } | null
  contextTitle?: string
  contextDescription?: string
  backLabel?: string
  nextLabel?: string
}

const alternatives = ['A', 'B', 'C', 'D', 'E'] as const

const difficultyClasses: Record<string, string> = {
  facil: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  medio: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  dificil: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

export function QuestionView({
  question,
  isBookmarked: initialBookmarked,
  lastAttempt,
  historySummary,
  userId,
  onAnswer,
  showNavigation = true,
  backHref = '/questoes',
  previousQuestionHref = null,
  nextQuestionHref = null,
  skipQuestionHref = null,
  hidePreviousAttempt = false,
  sequenceContext = null,
  contextTitle = 'Responder questao',
  contextDescription = 'Leia com calma, escolha a alternativa e use a explicacao para consolidar o raciocinio.',
  backLabel = 'Voltar',
  nextLabel = 'Proxima',
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
  const visibleHistory = historySummary || question.history || null
  const progressValue = sequenceContext
    ? Math.round((sequenceContext.currentPosition / sequenceContext.totalCount) * 100)
    : 0

  async function handleSelect(alt: string, timeStamp: number) {
    if (answered) return

    setSelected(alt)
    setAnswered(true)

    const isCorrect = alt === question.correct_answer
    const timeSpent = Math.max(0, Math.round((timeStamp - startTimeRef.current) / 1000))

    await supabase.from('question_attempts').insert({
      user_id: userId,
      question_id: question.id,
      selected_answer: alt,
      is_correct: isCorrect,
      time_spent_seconds: timeSpent,
    })

    onAnswer?.(alt, isCorrect)
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
      return selected === alt
        ? 'border-[#db2777]/40 bg-[#db2777]/8'
        : 'border-border/80 bg-background/70 hover:border-[#db2777]/20 hover:bg-[#db2777]/5'
    }

    if (alt === question.correct_answer) {
      return 'border-emerald-500/35 bg-emerald-500/10'
    }

    if (alt === selected && alt !== question.correct_answer) {
      return 'border-rose-500/35 bg-rose-500/10'
    }

    return 'border-border/70 bg-background/60 opacity-70'
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {showNavigation && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="rounded-xl">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {previousQuestionHref && (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href={previousQuestionHref}>
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Link>
              </Button>
            )}

            {skipQuestionHref && skipQuestionHref !== nextQuestionHref && (
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link href={skipQuestionHref}>
                  <FastForward className="h-4 w-4" />
                  Pular
                </Link>
              </Button>
            )}

            {nextQuestionHref && (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href={nextQuestionHref}>
                  {nextLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-white/65 bg-[linear-gradient(145deg,rgba(131,24,67,0.98),rgba(236,72,153,0.88))] text-white shadow-[0_35px_90px_-50px_rgba(219,39,119,0.5)]">
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_24%)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/80">
                  {question.exam?.type} {question.exam?.year}
                </span>
                <span className="rounded-full border border-white/16 bg-black/12 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/80">
                  Questao {question.number}
                </span>
                <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                  {question.specialty?.name}
                </Badge>
                <Badge className={difficultyClasses[question.difficulty]}>{question.difficulty}</Badge>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {contextTitle}
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/78 sm:text-base">
                {contextDescription}
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/16 hover:text-white"
              onClick={toggleBookmark}
            >
              {bookmarked ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-white/62">Status</p>
              <p className="mt-2 text-lg font-semibold">{answered ? 'Respondida agora' : 'Aguardando resposta'}</p>
              <p className="mt-1 text-sm text-white/72">
                {answered ? 'O feedback ja esta visivel abaixo.' : 'Selecione uma alternativa para liberar a explicacao.'}
              </p>
            </div>
            <div className="rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-white/62">Contexto</p>
              <p className="mt-2 text-lg font-semibold">
                {hidePreviousAttempt
                  ? 'Revisao sem spoiler'
                  : sequenceContext
                    ? 'Modo sequencia'
                    : 'Banco de questoes'}
              </p>
              <p className="mt-1 text-sm text-white/72">
                {hidePreviousAttempt
                  ? 'Sem mostrar acerto anterior antes da nova tentativa.'
                  : sequenceContext
                    ? 'Voce esta percorrendo o recorte ativo sem voltar para a lista.'
                    : 'Voce pode manter o recorte e seguir para a proxima nao respondida.'}
              </p>
            </div>
            <div className="rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-white/62">
                {sequenceContext ? 'Progresso' : 'Apoio'}
              </p>
              <p className="mt-2 text-lg font-semibold">
                {sequenceContext
                  ? `${sequenceContext.currentPosition} de ${sequenceContext.totalCount}`
                  : bookmarked
                    ? 'Marcada'
                    : 'Nao marcada'}
              </p>
              <p className="mt-1 text-sm text-white/72">
                {sequenceContext
                  ? `${sequenceContext.unansweredCount} ainda abertas neste recorte.`
                  : 'Use o marcador para separar questoes que merecem retorno estrategico.'}
              </p>
            </div>
          </div>

          {sequenceContext && (
            <div className="mt-6 rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/62">Bloco atual</p>
                  <p className="mt-2 text-lg font-semibold">
                    {sequenceContext.answeredCount} respondidas, {sequenceContext.unansweredCount} abertas
                  </p>
                </div>
                <Badge className="border-white/14 bg-white/10 text-white">
                  <Layers3 className="h-3.5 w-3.5" />
                  {progressValue}% concluido
                </Badge>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-[linear-gradient(90deg,#db2777,#f9a8d4)] transition-all"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <Card className="border-white/65 bg-white/78 dark:border-white/10 dark:bg-card/84">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Enunciado</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Leia com atencao antes de abrir o feedback.
              </p>
            </div>
            {answered ? (
              selected === question.correct_answer ? (
                <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Voce acertou
                </Badge>
              ) : (
                <Badge className="border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300">
                  <XCircle className="h-3.5 w-3.5" />
                  Voce errou
                </Badge>
              )
            ) : (
              <Badge className="border-[#db2777]/18 bg-[#db2777]/8 text-[#be185d]">
                <Sparkles className="h-3.5 w-3.5" />
                Pronta para responder
              </Badge>
            )}
          </div>

          <p className="mt-6 whitespace-pre-line text-base leading-8 text-foreground sm:text-[1.05rem]">
            {question.statement}
          </p>

          {visibleHistory && (
            <div className="mt-8 grid gap-3 lg:grid-cols-4">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/72 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Historico</p>
                <p className="mt-2 text-2xl font-semibold">{visibleHistory.attemptsCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">tentativa(s) nesta questao</p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/72 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Ultimo resultado</p>
                <p className="mt-2 text-lg font-semibold">
                  {visibleHistory.lastAttemptCorrect === null
                    ? 'Sem resposta'
                    : visibleHistory.lastAttemptCorrect
                      ? 'Acerto'
                      : 'Erro'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatAttemptDate(visibleHistory.lastAttemptAt)}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/72 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Tempo medio</p>
                <p className="mt-2 text-lg font-semibold">
                  {formatAverageQuestionTime(visibleHistory.averageTimeSpentSeconds)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {visibleHistory.correctCount} acertos / {visibleHistory.incorrectCount} erros
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/72 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Estado</p>
                <div className="mt-2">
                  {visibleHistory.learningState === 'consolidada' && (
                    <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      Consolidada
                    </Badge>
                  )}
                  {visibleHistory.learningState === 'instavel' && (
                    <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      Instavel
                    </Badge>
                  )}
                  {visibleHistory.learningState === 'inedita' && (
                    <Badge className="border-[#f472b6]/18 bg-[#f472b6]/10 text-[#be185d]">
                      Inedita
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {visibleHistory.learningState === 'consolidada' &&
                    'O historico indica boa retencao nas ultimas tentativas.'}
                  {visibleHistory.learningState === 'instavel' &&
                    'A questao ainda oscila e merece nova repeticao no curto prazo.'}
                  {visibleHistory.learningState === 'inedita' &&
                    'Primeiro contato. Use a explicacao para construir a base.'}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-3">
            {alternatives.map((alt) => {
              const isCorrect = answered && alt === question.correct_answer
              const isWrongSelected = answered && alt === selected && alt !== question.correct_answer

              return (
                <button
                  key={alt}
                  type="button"
                  onClick={(event) => handleSelect(alt, event.timeStamp)}
                  disabled={answered}
                  className={cn(
                    'w-full rounded-[1.5rem] border p-4 text-left transition-all sm:p-5',
                    getAlternativeStyle(alt),
                    !answered && 'cursor-pointer'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold',
                        isCorrect
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : isWrongSelected
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                            : 'border-border/70 bg-background/80 text-foreground'
                      )}
                    >
                      {alt}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-7 sm:text-base">{alternativeTexts[alt]}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {answered && question.explanation && (
            <div className="mt-8 rounded-[1.75rem] border border-[#db2777]/14 bg-[linear-gradient(180deg,rgba(236,72,153,0.1),rgba(249,168,212,0.04))] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#db2777] text-white">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Explicacao comentada</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{question.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {lastAttempt && !answered && !hidePreviousAttempt && (
            <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/72 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Ultimo contato com essa questao</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Em {formatAttemptDate(lastAttempt.created_at)}, voce respondeu{' '}
                    <span className={lastAttempt.is_correct ? 'font-medium text-emerald-700 dark:text-emerald-300' : 'font-medium text-rose-700 dark:text-rose-300'}>
                      ({lastAttempt.selected_answer})
                    </span>
                    {lastAttempt.is_correct ? ' e acertou.' : ` e errou. A correta era (${question.correct_answer}).`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
