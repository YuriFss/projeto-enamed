'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  History,
  Layers3,
  Sparkles,
  TimerReset,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Question } from '@/lib/types'
import { formatAverageQuestionTime } from '@/lib/question-progress'

interface QuestionListProps {
  questions: Question[]
  currentPage: number
  totalPages: number
  totalCount: number
  answeredCount: number
  unansweredCount: number
  sequenceStartQuestionId: string | null
  detailQueryString?: string
  currentStatus?: string
  overview: string
  focusLabel: string
}

const difficultyClasses: Record<string, string> = {
  facil: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  medio: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  dificil: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

function formatAnsweredAt(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function QuestionList({
  questions,
  currentPage,
  totalPages,
  totalCount,
  answeredCount,
  unansweredCount,
  sequenceStartQuestionId,
  detailQueryString,
  currentStatus,
  overview,
  focusLabel,
}: QuestionListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/questoes?${params.toString()}`)
  }

  function buildQuestionHref(questionId: string, overrides?: Record<string, string>) {
    const params = new URLSearchParams(detailQueryString || '')
    params.set('view', 'sequence')
    Object.entries(overrides || {}).forEach(([key, value]) => {
      params.set(key, value)
    })
    const queryString = params.toString()
    return queryString ? `/questoes/${questionId}?${queryString}` : `/questoes/${questionId}`
  }

  const sequenceStartHref = sequenceStartQuestionId
    ? buildQuestionHref(sequenceStartQuestionId)
    : null

  if (questions.length === 0) {
    return (
      <Card className="border-dashed border-border/80 bg-white/70 dark:bg-card/75">
        <CardContent className="p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-muted">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-lg font-semibold">Nenhuma questao encontrada</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajuste o recorte para abrir mais questoes ou limpe os filtros para voltar ao banco completo.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-white/65 bg-white/76 p-4 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.45)] backdrop-blur-md dark:border-white/10 dark:bg-card/82">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{focusLabel}</p>
          <p className="mt-1 text-lg font-semibold">{overview}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pagina {currentPage} de {totalPages}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Banco visivel</p>
          <p className="mt-1 text-2xl font-semibold">{totalCount}</p>
          <p className="text-sm text-muted-foreground">questoes neste recorte</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
        <Card className="border-white/65 bg-white/80 dark:border-white/10 dark:bg-card/84">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Modo sequencia</p>
              <p className="text-xl font-semibold">Entre em fluxo e avance sem perder o recorte atual.</p>
              <p className="text-sm text-muted-foreground">
                Use navegacao continua com anterior, proxima, pular e progresso do bloco.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {sequenceStartHref && (
                <Button asChild className="rounded-2xl bg-[linear-gradient(145deg,#be185d,#f472b6)] text-white shadow-lg hover:opacity-95">
                  <Link href={sequenceStartHref}>
                    <Layers3 className="h-4 w-4" />
                    Iniciar sequencia
                  </Link>
                </Button>
              )}
              {unansweredCount > 0 && sequenceStartHref && currentStatus !== 'unanswered' && (
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link href={buildQuestionHref(sequenceStartQuestionId!, { status: 'unanswered' })}>
                    <TimerReset className="h-4 w-4" />
                    Ir direto nas novas
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card className="border-white/65 bg-white/80 dark:border-white/10 dark:bg-card/84">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Progresso no recorte</p>
              <p className="mt-2 text-3xl font-semibold">{answeredCount}</p>
              <p className="mt-1 text-sm text-muted-foreground">questoes ja tiveram alguma tentativa</p>
            </CardContent>
          </Card>
          <Card className="border-white/65 bg-white/80 dark:border-white/10 dark:bg-card/84">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Ainda abertas</p>
              <p className="mt-2 text-3xl font-semibold">{unansweredCount}</p>
              <p className="mt-1 text-sm text-muted-foreground">questoes ainda nao respondidas neste contexto</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question) => (
          <Link
            key={question.id}
            href={buildQuestionHref(question.id)}
            className="block"
          >
            <Card className="overflow-hidden border-white/65 bg-white/80 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-50px_rgba(15,23,42,0.6)] dark:border-white/10 dark:bg-card/84">
              <CardContent className="p-0">
                <div className="flex flex-col gap-5 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                          {question.exam?.type} {question.exam?.year}
                        </span>
                        <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                          Questao {question.number}
                        </span>
                        <Badge variant="outline" style={{ borderColor: question.specialty?.color, color: question.specialty?.color }}>
                          {question.specialty?.name}
                        </Badge>
                        <Badge className={difficultyClasses[question.difficulty]}>
                          {question.difficulty}
                        </Badge>
                        {question.isAnswered ? (
                          <Badge className="border-[#db2777]/18 bg-[#db2777]/8 text-[#be185d]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Respondida
                          </Badge>
                        ) : (
                          <Badge className="border-[#f472b6]/18 bg-[#f472b6]/10 text-[#be185d]">
                            <Sparkles className="h-3.5 w-3.5" />
                            Nova para voce
                          </Badge>
                        )}
                      </div>

                      <p className="mt-4 text-base leading-7 text-foreground sm:text-lg">
                        {question.statement}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-muted-foreground transition group-hover:text-foreground">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4 text-sm">
                    <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                      <span>{question.exam?.name}</span>
                      {question.history && (
                        <>
                          <span>{question.history.attemptsCount} tentativa(s)</span>
                          <span>Tempo medio {formatAverageQuestionTime(question.history.averageTimeSpentSeconds)}</span>
                        </>
                      )}
                      {currentStatus === 'answered' && question.lastAnsweredAt && (
                        <span className="inline-flex items-center gap-1.5">
                          <History className="h-4 w-4" />
                          Ultima resposta em {formatAnsweredAt(question.lastAnsweredAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {question.history?.learningState === 'consolidada' && (
                        <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          Consolidada
                        </Badge>
                      )}
                      {question.history?.learningState === 'instavel' && (
                        <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          Instavel
                        </Badge>
                      )}
                      {question.history?.learningState === 'inedita' && (
                        <Badge className="border-[#f472b6]/18 bg-[#f472b6]/10 text-[#be185d]">
                          Inedita
                        </Badge>
                      )}
                      <span className="font-medium text-[#be185d]">Abrir em sequencia</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-white/65 bg-white/76 p-4 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.45)] backdrop-blur-md dark:border-white/10 dark:bg-card/82">
          <p className="text-sm text-muted-foreground">
            Continue navegando sem perder os filtros aplicados.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-28 text-center text-sm text-muted-foreground">
              Pagina {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
