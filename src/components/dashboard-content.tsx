'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  CalendarRange,
  ArrowRight,
  BookOpen,
  Brain,
  Clock3,
  Flame,
  RotateCcw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  buildDashboardInsights,
  formatAverageQuestionTime,
  DashboardStats,
  formatStudyTime,
} from '@/lib/dashboard-insights'
import { LearningAnalytics, SpecialtyStats, TopicStats, WeeklyAccuracy } from '@/lib/types'

const SpecialtyBarChart = dynamic(
  () => import('@/components/dashboard-charts').then((m) => m.SpecialtyBarChart),
  { loading: () => <div className="h-[260px] bg-muted/60 animate-pulse rounded-3xl" /> }
)

const WeeklyLineChart = dynamic(
  () => import('@/components/dashboard-charts').then((m) => m.WeeklyLineChart),
  { loading: () => <div className="h-[260px] bg-muted/60 animate-pulse rounded-3xl" /> }
)

interface DashboardContentProps {
  stats: DashboardStats
  specialtyStats: SpecialtyStats[]
  weeklyAccuracy: WeeklyAccuracy[]
  learningAnalytics: LearningAnalytics
  topicStats: TopicStats[]
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  steady: Target,
} as const

const windowDescriptions = {
  7: 'Pulso mais recente da rotina',
  14: 'Consistencia das duas ultimas semanas',
  30: 'Base real do seu ultimo ciclo',
} as const

function getWindowDeltaLabel(delta: number | null) {
  if (delta === null) return 'Sem base comparativa'
  if (delta > 0) return `+${delta} pts vs janela anterior`
  if (delta < 0) return `${delta} pts vs janela anterior`
  return 'Sem variacao relevante'
}

function getWindowDeltaTone(delta: number | null) {
  if (delta === null) return 'text-muted-foreground'
  if (delta > 0) return 'text-[#be185d]'
  if (delta < 0) return 'text-rose-600'
  return 'text-muted-foreground'
}

function getLearningCurveHeadline(learningAnalytics: LearningAnalytics) {
  const { curve } = learningAnalytics

  if (curve.repeat_attempt_count === 0) {
    return 'Voce ainda nao tem repeticoes suficientes para medir consolidacao.'
  }

  if (curve.improvement_delta >= 8) {
    return 'A repeticao esta convertendo erro em acerto com boa eficiencia.'
  }

  if (curve.improvement_delta <= -5) {
    return 'As repeticoes ainda nao estao melhorando o desempenho.'
  }

  return 'Sua curva de repeticao esta estavel, com ganho discreto.'
}

function getLearningCurveDescription(learningAnalytics: LearningAnalytics) {
  const { curve } = learningAnalytics

  if (curve.repeat_attempt_count === 0) {
    return 'Refazer questoes erradas ou marcadas vai liberar a comparacao entre primeira passada e consolidacao.'
  }

  if (curve.recoverable_questions === 0) {
    return 'Ainda nao houve erros iniciais suficientes para medir recuperacao de conteudo.'
  }

  return `${curve.recovered_questions} de ${curve.recoverable_questions} questoes erradas na primeira tentativa foram recuperadas depois.`
}

export function DashboardContent({
  stats,
  specialtyStats,
  weeklyAccuracy,
  learningAnalytics,
  topicStats,
}: DashboardContentProps) {
  const insights = buildDashboardInsights(
    stats,
    specialtyStats,
    weeklyAccuracy,
    topicStats,
    learningAnalytics
  )
  const TrendIcon = trendIcons[insights.trendDirection]

  const barData = specialtyStats.map((specialty) => ({
    name:
      specialty.specialty_name.length > 12
        ? `${specialty.specialty_name.slice(0, 12)}...`
        : specialty.specialty_name,
    accuracy: Number(specialty.accuracy),
    fill: specialty.specialty_color,
  }))

  const lineData = weeklyAccuracy.map((week) => ({
    week: week.week,
    accuracy: Number(week.accuracy),
    total: Number(week.total),
  }))

  const statCards = [
    {
      label: 'Questoes respondidas',
      value: String(stats.total_answered),
      icon: BookOpen,
      tone: 'from-[#be185d] to-[#f472b6]',
      supporting: insights.studyRhythm,
    },
    {
      label: 'Acuracia global',
      value: `${stats.accuracy}%`,
      icon: Target,
      tone: 'from-[#9d174d] to-[#ec4899]',
      supporting: insights.trendSummary,
    },
    {
      label: 'Tempo de estudo',
      value: formatStudyTime(stats.total_time_seconds),
      icon: Clock3,
      tone: 'from-[#fb7185] to-[#f9a8d4]',
      supporting: `${insights.averageTimePerQuestion} por questao`,
    },
    {
      label: 'Sequencia ativa',
      value: String(stats.study_streak),
      icon: Flame,
      tone: 'from-[#831843] to-[#fb7185]',
      supporting: insights.consistencySummary,
    },
  ]

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="overflow-hidden border-white/70 bg-[linear-gradient(135deg,#831843_0%,#db2777_52%,#fbcfe8_100%)] text-white shadow-[0_35px_90px_-40px_rgba(219,39,119,0.55)]">
          <CardContent className="relative p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.32),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_24%)]" />
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/20 bg-white/12 text-white backdrop-blur-sm">
                  Painel de performance
                </Badge>
                <Badge className="border-white/12 bg-black/15 text-white/90 backdrop-blur-sm">
                  {insights.studyRhythm}
                </Badge>
              </div>

              <div className="max-w-2xl space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                  Estude com direcao, nao no escuro.
                </h1>
                <p className="max-w-xl text-sm leading-6 text-white/82 sm:text-base">
                  Seu painel agora destaca desempenho, risco e proxima acao para transformar volume de questoes em ganho real de prova.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/64">Foco agora</p>
                  <p className="mt-2 text-lg font-semibold">
                    {insights.focusTopic?.topic_name || insights.focusSpecialty?.specialty_name || 'Construir historico'}
                  </p>
                  <p className="mt-1 text-sm text-white/72">
                    {insights.focusTopic
                      ? `${insights.focusTopic.accuracy}% de acuracia em ${insights.focusTopic.specialty_name}.`
                      : insights.focusSpecialty
                        ? `${insights.focusSpecialty.accuracy}% de acuracia nesta especialidade.`
                      : 'Responda questoes para liberar recomendacoes inteligentes.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/64">Tendencia</p>
                  <p className="mt-2 flex items-center gap-2 text-lg font-semibold">
                    <TrendIcon className="h-5 w-5" />
                    {insights.trendSummary}
                  </p>
                  <p className="mt-1 text-sm text-white/72">{insights.trendDescription}</p>
                </div>

                <div className="rounded-2xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/64">Melhor bloco</p>
                  <p className="mt-2 text-lg font-semibold">
                    {insights.strongestTopic?.topic_name || insights.strongestSpecialty?.specialty_name || 'Ainda sem destaque'}
                  </p>
                  <p className="mt-1 text-sm text-white/72">
                    {insights.strongestTopic
                      ? `${insights.strongestTopic.accuracy}% de acuracia em ${insights.strongestTopic.specialty_name}.`
                      : insights.strongestSpecialty
                        ? `${insights.strongestSpecialty.accuracy}% de acuracia. Continue usando essa base a seu favor.`
                      : 'Seu melhor bloco vai aparecer assim que voce acumular tentativas.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-white/92">
                  <Link href={insights.recommendedAction.href}>
                    {insights.recommendedAction.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/8 text-white hover:bg-white/14 hover:text-white">
                  <Link href="/questoes">Explorar banco</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/75 shadow-[0_35px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur-md dark:bg-card/85">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit border-[#db2777]/20 bg-[#db2777]/8 text-[#be185d]">
              Proxima decisao
            </Badge>
            <div>
              <CardTitle className="text-2xl">O que vale fazer agora</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6">
                Priorizacao automatica baseada no seu ritmo, nas quedas recentes e na especialidade com maior risco.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-3xl border border-[#db2777]/10 bg-[linear-gradient(180deg,rgba(236,72,153,0.1),rgba(249,168,212,0.04))] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#db2777] text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">{insights.recommendedAction.title}</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {insights.recommendedAction.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tempo medio</p>
                <p className="mt-2 text-2xl font-semibold">{insights.averageTimePerQuestion}</p>
                <p className="mt-1 text-sm text-muted-foreground">Quanto voce gasta, em media, por questao.</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sessoes concluidas</p>
                <p className="mt-2 text-2xl font-semibold">{stats.total_sessions}</p>
                <p className="mt-1 text-sm text-muted-foreground">Simulados completos registrados no seu historico.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Leitura rapida</p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                {insights.consistencySummary}.{' '}
                {insights.focusSpecialty
                  ? `O maior ponto de atencao esta em ${insights.focusSpecialty.specialty_name}.`
                  : 'Ainda nao ha especialidade critica identificada.'}
                {learningAnalytics.curve.repeat_attempt_count > 0
                  ? ` Sua recuperacao de erros esta em ${learningAnalytics.curve.recovery_rate}%.`
                  : ' Repeticoes ainda insuficientes para medir retencao.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="overflow-hidden border-white/70 bg-white/80 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.4)] backdrop-blur-md dark:bg-card/85">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-semibold tracking-tight">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.supporting}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/70 bg-white/78 shadow-[0_35px_90px_-60px_rgba(15,23,42,0.45)] backdrop-blur-md dark:bg-card/88">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Janelas de desempenho</CardTitle>
                <CardDescription className="mt-2 text-sm leading-6">
                  Leia seu momento em 7, 14 e 30 dias para separar oscilacao curta de tendencia real.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-[#be185d]/15 bg-[#be185d]/8 text-[#be185d]">
                7/14/30 dias
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {learningAnalytics.windows.map((window) => (
              <div
                key={window.days}
                className="rounded-3xl border border-border/70 bg-background/75 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Ultimos {window.days} dias
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">{window.accuracy}%</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#be185d]/10 text-[#be185d]">
                    <CalendarRange className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {windowDescriptions[window.days]}
                </p>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Volume</p>
                    <p className="mt-2 text-lg font-semibold">{window.attempts} tentativas</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tempo medio</p>
                    <p className="mt-2 text-lg font-semibold">
                      {formatAverageQuestionTime(window.average_time_seconds, 1)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Comparativo</p>
                    <p className={`mt-2 text-sm font-medium ${getWindowDeltaTone(window.delta_vs_previous_window)}`}>
                      {getWindowDeltaLabel(window.delta_vs_previous_window)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/78 shadow-[0_35px_90px_-60px_rgba(15,23,42,0.45)] backdrop-blur-md dark:bg-card/88">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Curva de aprendizado</CardTitle>
                <CardDescription className="mt-2 text-sm leading-6">
                  Compare como voce performa ao ver a questao pela primeira vez e ao voltar nela depois.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-[#be185d]/15 bg-[#be185d]/8 text-[#be185d]">
                Primeira vs repeticao
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-3xl border border-[#be185d]/10 bg-[linear-gradient(180deg,rgba(190,24,93,0.08),rgba(244,114,182,0.03))] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#be185d] text-white">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">{getLearningCurveHeadline(learningAnalytics)}</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {getLearningCurveDescription(learningAnalytics)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Primeira tentativa</p>
                <p className="mt-2 text-2xl font-semibold">
                  {learningAnalytics.curve.first_attempt_accuracy}%
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {learningAnalytics.curve.first_attempt_count} questoes avaliadas na primeira passada.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Repeticao</p>
                <p className="mt-2 text-2xl font-semibold">
                  {learningAnalytics.curve.repeat_attempt_accuracy}%
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {learningAnalytics.curve.repeat_attempt_count} respostas em questoes revisitadas.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ganho de repeticao</p>
                <p className={`mt-2 text-2xl font-semibold ${getWindowDeltaTone(learningAnalytics.curve.improvement_delta)}`}>
                  {learningAnalytics.curve.improvement_delta > 0 ? '+' : ''}
                  {learningAnalytics.curve.improvement_delta} pts
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Diferenca entre acuracia da repeticao e da primeira tentativa.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Recuperacao de erro</p>
                <p className="mt-2 text-2xl font-semibold">{learningAnalytics.curve.recovery_rate}%</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {learningAnalytics.curve.recovered_questions} de{' '}
                  {learningAnalytics.curve.recoverable_questions} erros iniciais corrigidos depois.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/70 bg-white/78 shadow-[0_35px_90px_-60px_rgba(15,23,42,0.45)] backdrop-blur-md dark:bg-card/88">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Evolucao recente</CardTitle>
                <CardDescription className="mt-2 text-sm leading-6">
                  Observe a direcao da sua acuracia semanal e ajuste a rotina antes de perder consistencia.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-[#db2777]/15 bg-[#db2777]/8 text-[#be185d]">
                {insights.trendSummary}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <WeeklyLineChart data={lineData} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/78 shadow-[0_35px_90px_-60px_rgba(15,23,42,0.45)] backdrop-blur-md dark:bg-card/88">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Radar de atencao</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6">
              Os blocos abaixo indicam onde voce ganha mais pontos se agir agora.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.weakPoints.length > 0 ? (
              insights.weakPoints.map((specialty, index) => (
                <div
                  key={specialty.specialty_id}
                  className="rounded-2xl border border-border/70 bg-background/75 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          Prioridade {index + 1}
                        </span>
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: specialty.specialty_color }}
                        />
                      </div>
                      <p className="text-base font-semibold">{specialty.specialty_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {specialty.correct_attempts}/{specialty.total_attempts} acertos no historico.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold">{specialty.accuracy}%</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">acuracia</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-border/80 bg-background/70 p-6 text-center">
                <Brain className="mx-auto h-10 w-10 text-muted-foreground/45" />
                <p className="mt-4 text-base font-medium">Seu radar vai aparecer aqui</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Assim que voce acumular tentativas, o painel destaca automaticamente os pontos fracos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/70 bg-white/78 shadow-[0_35px_90px_-60px_rgba(15,23,42,0.45)] backdrop-blur-md dark:bg-card/88">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Desempenho por especialidade</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6">
              Compare rapidamente suas areas mais fortes e as que ainda exigem repeticao estrategica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <SpecialtyBarChart data={barData} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/78 shadow-[0_35px_90px_-60px_rgba(15,23,42,0.45)] backdrop-blur-md dark:bg-card/88">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Topicos de maior impacto</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6">
              Onde a perda de ponto esta mais concentrada dentro das especialidades.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.topicWeakPoints.length > 0 ? (
              insights.topicWeakPoints.map((topic) => (
                <div key={topic.topic_id} className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {topic.specialty_name}
                      </p>
                      <p className="mt-2 text-base font-semibold">{topic.topic_name}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {topic.correct_attempts}/{topic.total_attempts} acertos no historico deste topico.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold">{topic.accuracy}%</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">acuracia</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Assim que voce responder questoes com topico definido, o painel passa a mostrar os pontos de maior impacto.
                </p>
              </div>
            )}

            <Button asChild className="w-full rounded-2xl">
              <Link href={insights.recommendedAction.href}>
                {insights.recommendedAction.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
