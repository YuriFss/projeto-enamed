'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Sparkles, Target, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SimulationSession, SessionQuestion } from '@/lib/types'
import { buildSimulationResultInsights } from '@/lib/simulation-result-insights'

interface SimulationResultProps {
  session: SimulationSession
  sessionQuestions: SessionQuestion[]
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}min`
  return `${m}min ${s}s`
}

export function SimulationResult({ session, sessionQuestions }: SimulationResultProps) {
  const insights = buildSimulationResultInsights(sessionQuestions, session.time_spent_seconds)
  const specialtyRows = new Map<string, { name: string; color: string; total: number; correct: number }>()

  sessionQuestions.forEach((sq) => {
    const spec = sq.question?.specialty
    if (!spec) return
    const entry = specialtyRows.get(spec.id) || { name: spec.name, color: spec.color, total: 0, correct: 0 }
    entry.total += 1
    if (sq.is_correct) entry.correct += 1
    specialtyRows.set(spec.id, entry)
  })

  return (
    <div className="space-y-6">
      <Link href="/simulado" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Novo simulado
      </Link>

      <section className="overflow-hidden rounded-[2rem] border border-white/65 bg-[linear-gradient(145deg,rgba(131,24,67,0.98),rgba(236,72,153,0.88))] text-white shadow-[0_35px_90px_-50px_rgba(219,39,119,0.55)]">
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_24%)] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/80">
              Resultado do simulado
            </span>
            <span className="rounded-full border border-white/16 bg-black/12 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/80">
              {session.mode}
            </span>
          </div>

          <div className="mt-4 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                O simulado terminou. Agora vale transformar erro em plano.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
                O resultado abaixo resume desempenho, ritmo e onde voce deve revisar antes do proximo bloco.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={insights.recommendedAction.href}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-slate-900 shadow-lg transition hover:bg-white/92"
                >
                  {insights.recommendedAction.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/revisao?tab=erradas"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/16"
                >
                  Revisar erros
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              <div className="rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-white/62">Acuracia</p>
                <p className="mt-2 text-3xl font-semibold">{insights.accuracy}%</p>
                <p className="mt-1 text-sm text-white/72">
                  {insights.correctCount}/{insights.totalCount} acertos
                </p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-white/62">Tempo total</p>
                <p className="mt-2 text-3xl font-semibold">{formatTime(session.time_spent_seconds)}</p>
                <p className="mt-1 text-sm text-white/72">{insights.averageTimePerQuestion} por questao</p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-white/62">Ponto critico</p>
                <p className="mt-2 text-lg font-semibold">
                  {insights.weakestTopic?.name || insights.weakestSpecialty?.name || 'Sem alerta claro'}
                </p>
                <p className="mt-1 text-sm text-white/72">
                  {insights.weakestTopic
                    ? `${insights.weakestTopic.accuracy}% em ${insights.weakestTopic.specialtyName}.`
                    : insights.weakestSpecialty
                      ? `${insights.weakestSpecialty.accuracy}% na especialidade.`
                      : 'Continue fazendo simulados para ganhar leitura comparativa.'}
                </p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-white/62">Ritmo</p>
                <p className="mt-2 text-lg font-semibold">Leitura de pacing</p>
                <p className="mt-1 text-sm text-white/72">{insights.pacingSummary}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-white/70 bg-white/80 shadow-[0_25px_65px_-45px_rgba(15,23,42,0.45)] backdrop-blur-md dark:bg-card/85">
          <CardHeader>
            <Badge variant="outline" className="w-fit border-[#db2777]/20 bg-[#db2777]/8 text-[#be185d]">
              Proxima decisao
            </Badge>
            <CardTitle className="text-2xl">{insights.recommendedAction.title}</CardTitle>
            <CardDescription className="text-sm leading-6">
              {insights.recommendedAction.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Topico mais fraco</p>
              <p className="mt-2 text-base font-semibold">
                {insights.weakestTopic?.name || 'Sem topico dominante'}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {insights.weakestTopic
                  ? `${insights.weakestTopic.correct}/${insights.weakestTopic.total} acertos em ${insights.weakestTopic.specialtyName}.`
                  : 'Sem topicos suficientes para um recorte fino neste simulado.'}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Especialidade mais fraca</p>
              <p className="mt-2 text-base font-semibold">
                {insights.weakestSpecialty?.name || 'Sem especialidade dominante'}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {insights.weakestSpecialty
                  ? `${insights.weakestSpecialty.correct}/${insights.weakestSpecialty.total} acertos nessa area.`
                  : 'Ainda nao ha leitura forte por especialidade.'}
              </p>
            </div>

            <Link
              href={insights.recommendedAction.href}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(145deg,#be185d,#f472b6)] px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:opacity-95"
            >
              {insights.recommendedAction.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/80 shadow-[0_25px_65px_-45px_rgba(15,23,42,0.45)] backdrop-blur-md dark:bg-card/85">
          <CardHeader>
            <CardTitle className="text-xl">Por especialidade</CardTitle>
            <CardDescription className="text-sm leading-6">
              Veja rapidamente em que bloco o simulado apertou mais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from(specialtyRows.values()).map((spec) => {
              const pct = Math.round((spec.correct / spec.total) * 100)
              return (
                <div key={spec.name} className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p style={{ color: spec.color }} className="font-medium">
                        {spec.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {spec.correct}/{spec.total} acertos
                      </p>
                    </div>
                    <p className="text-2xl font-semibold">{pct}%</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: spec.color }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>

      <Card className="border-white/70 bg-white/80 shadow-[0_25px_65px_-45px_rgba(15,23,42,0.45)] backdrop-blur-md dark:bg-card/85">
        <CardHeader>
          <CardTitle className="text-xl">Questoes do simulado</CardTitle>
          <CardDescription className="text-sm leading-6">
            Revise item por item com atalho para voltar ao banco ou a revisao.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessionQuestions.map((sq) => (
              <Link
                key={sq.id}
                href={`/questoes/${sq.question_id}`}
                className="flex items-center gap-3 rounded-2xl border border-border/70 p-4 transition-colors hover:bg-muted/40"
              >
                {sq.is_correct ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 flex-shrink-0 text-rose-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{sq.question?.statement}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" />
                      Sua: ({sq.selected_answer})
                    </span>
                    {!sq.is_correct && (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <Sparkles className="h-3.5 w-3.5" />
                        Correta: ({sq.question?.correct_answer})
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {sq.time_spent_seconds}s
                    </span>
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
