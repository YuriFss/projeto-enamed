'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, Bookmark, CheckCircle2, RotateCcw, Sparkles, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ReviewQueueItem } from '@/lib/review-ranking'
import { Specialty } from '@/lib/types'
import { getReviewTabMeta } from '@/lib/study-flow'
import { cn } from '@/lib/utils'

interface ReviewContentProps {
  tab: string
  items: ReviewQueueItem[]
  specialties: Specialty[]
  currentSpecialty?: string
}

const tabs = [
  { value: 'erradas', label: 'Erradas' },
  { value: 'marcadas', label: 'Marcadas' },
  { value: 'todas', label: 'Todas' },
]

function selectClassName() {
  return 'w-full rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary/40'
}

export function ReviewContent({ tab, items, specialties, currentSpecialty }: ReviewContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const meta = getReviewTabMeta(tab)

  function getQuestionHref(questionId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('source', 'review')
    const queryString = params.toString()
    return queryString ? `/questoes/${questionId}?${queryString}` : `/questoes/${questionId}`
  }

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/revisao?${params.toString()}`)
  }

  function getLeadingIcon(item: ReviewQueueItem) {
    if (tab === 'marcadas') return Bookmark
    if (item.is_correct) return CheckCircle2
    return XCircle
  }

  function getPriorityBadgeClass(priority: ReviewQueueItem['priority']) {
    if (priority === 'alta') {
      return 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'
    }

    if (priority === 'media') {
      return 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
    }

    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/65 bg-[linear-gradient(145deg,rgba(131,24,67,0.98),rgba(236,72,153,0.88))] text-white shadow-[0_35px_90px_-50px_rgba(219,39,119,0.55)]">
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_24%)] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/80">
              Revisao
            </span>
            <span className="rounded-full border border-white/16 bg-black/12 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/80">
              {tabs.find((item) => item.value === tab)?.label || 'Erradas'}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{meta.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78 sm:text-base">
            {meta.description}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-white/62">Fila atual</p>
              <p className="mt-2 text-3xl font-semibold">{items.length}</p>
              <p className="mt-1 text-sm text-white/72">questoes disponiveis neste recorte</p>
            </div>
            <div className="rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-white/62">Modo</p>
              <p className="mt-2 text-2xl font-semibold">Sem spoiler</p>
              <p className="mt-1 text-sm text-white/72">A resposta anterior nao aparece antes da nova tentativa.</p>
            </div>
            <div className="rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-white/62">Objetivo</p>
              <p className="mt-2 text-2xl font-semibold">Consolidar</p>
              <p className="mt-1 text-sm text-white/72">Use a fila para recuperar erros ou revisar itens marcados.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/65 bg-white/78 p-4 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-card/82">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-2xl border border-border/70 bg-background/70 p-1">
            {tabs.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => updateParam('tab', item.value)}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                  tab === item.value
                    ? 'bg-[linear-gradient(145deg,#be185d,#f472b6)] text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="min-w-[15rem] flex-1">
            <select
              className={selectClassName()}
              value={currentSpecialty || ''}
              onChange={(event) => updateParam('specialty', event.target.value)}
            >
              <option value="">Todas especialidades</option>
              {specialties.map((specialty) => (
                <option key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-white/70 dark:bg-card/75">
          <CardContent className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-muted">
              <RotateCcw className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 text-lg font-semibold">
              {tab === 'erradas' && 'Nenhuma questao errada ainda'}
              {tab === 'marcadas' && 'Nenhuma questao marcada'}
              {tab === 'todas' && 'Nenhuma questao respondida ainda'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Continue estudando para que a fila de revisao fique mais inteligente e util.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            if (!item.question) return null

            const question = item.question
            const Icon = getLeadingIcon(item)

            return (
              <Link key={item.id} href={getQuestionHref(question.id)} className="block">
                <Card className="overflow-hidden border-white/65 bg-white/80 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-50px_rgba(15,23,42,0.6)] dark:border-white/10 dark:bg-card/84">
                  <CardContent className="p-0">
                    <div className="flex flex-col gap-5 p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/75">
                            <Icon
                              className={cn(
                                'h-5 w-5',
                                tab === 'marcadas'
                                  ? 'text-[#be185d]'
                                  : item.is_correct
                                    ? 'text-emerald-600'
                                    : 'text-rose-600'
                              )}
                            />
                          </div>

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
                              <Badge className="border-[#db2777]/14 bg-[#db2777]/8 text-[#be185d]">
                                <Sparkles className="h-3.5 w-3.5" />
                                Pronta para refazer
                              </Badge>
                              <Badge className={getPriorityBadgeClass(item.priority)}>
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Prioridade {item.priority}
                              </Badge>
                            </div>

                            <p className="mt-4 text-base leading-7 text-foreground sm:text-lg">{question.statement}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.reason}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Abra para responder de novo sem ver sua alternativa anterior.
                          </p>
                          {item.priorityBadges.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.priorityBadges.map((badge) => (
                                <span
                                  key={`${item.id}-${badge}`}
                                  className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground"
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-[#be185d]">Refazer agora</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
