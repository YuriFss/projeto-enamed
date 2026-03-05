import { EMPTY_LEARNING_ANALYTICS } from './dashboard-analytics.ts'
import type { LearningAnalytics, SpecialtyStats, TopicStats, WeeklyAccuracy } from './types'

export interface DashboardStats {
  total_answered: number
  total_correct: number
  accuracy: number
  total_time_seconds: number
  study_streak: number
  total_sessions: number
}

export interface DashboardInsightModel {
  averageTimePerQuestion: string
  trendDelta: number
  trendDirection: 'up' | 'down' | 'steady'
  trendSummary: string
  trendDescription: string
  studyRhythm: string
  consistencySummary: string
  focusSpecialty: SpecialtyStats | null
  strongestSpecialty: SpecialtyStats | null
  weakPoints: SpecialtyStats[]
  focusTopic: TopicStats | null
  strongestTopic: TopicStats | null
  topicWeakPoints: TopicStats[]
  recommendedAction: {
    title: string
    description: string
    href: string
    cta: string
  }
}

export function formatStudyTime(seconds: number): string {
  if (seconds <= 0) return '0min'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) return `${hours}h ${minutes}min`
  return `${Math.max(1, minutes)}min`
}

export function formatAverageQuestionTime(totalTimeSeconds: number, totalAnswered: number): string {
  if (totalAnswered <= 0 || totalTimeSeconds <= 0) return '0s'

  const averageSeconds = Math.round(totalTimeSeconds / totalAnswered)
  const minutes = Math.floor(averageSeconds / 60)
  const seconds = averageSeconds % 60

  if (minutes > 0) return `${minutes}min ${seconds}s`
  return `${seconds}s`
}

function getTrend(weeklyAccuracy: WeeklyAccuracy[]) {
  if (weeklyAccuracy.length < 2) {
    return {
      delta: 0,
      direction: 'steady' as const,
      summary: 'Sem variacao suficiente',
      description: 'Responda em semanas diferentes para acompanhar a curva de evolucao.',
    }
  }

  const latest = Number(weeklyAccuracy[weeklyAccuracy.length - 1]?.accuracy || 0)
  const previous = Number(weeklyAccuracy[weeklyAccuracy.length - 2]?.accuracy || 0)
  const delta = Number((latest - previous).toFixed(1))

  if (delta > 2) {
    return {
      delta,
      direction: 'up' as const,
      summary: `+${delta} pts vs semana anterior`,
      description: 'Seu desempenho recente esta subindo. Vale consolidar com um simulado curto.',
    }
  }

  if (delta < -2) {
    return {
      delta,
      direction: 'down' as const,
      summary: `${delta} pts vs semana anterior`,
      description: 'Sua acuracia caiu. O melhor retorno agora vem da revisao das areas mais instaveis.',
    }
  }

  return {
    delta,
    direction: 'steady' as const,
    summary: 'Ritmo estavel',
    description: 'Voce manteve o nivel recente. O proximo ganho vem de aumentar consistencia ou volume.',
  }
}

function getStudyRhythm(totalAnswered: number): string {
  if (totalAnswered === 0) return 'Sem ritmo definido'
  if (totalAnswered < 40) return 'Ritmo inicial'
  if (totalAnswered < 150) return 'Ritmo consistente'
  return 'Ritmo forte'
}

function getConsistencySummary(studyStreak: number): string {
  if (studyStreak <= 0) return 'Nenhuma sequencia ativa'
  if (studyStreak === 1) return 'Hoje voce retomou a rotina'
  if (studyStreak < 5) return `${studyStreak} dias seguidos de estudo`
  if (studyStreak < 15) return `${studyStreak} dias seguidos. Boa consistencia`
  return `${studyStreak} dias seguidos. Excelente disciplina`
}

function getRecommendedAction(
  stats: DashboardStats,
  focusSpecialty: SpecialtyStats | null,
  focusTopic: TopicStats | null,
  trendDirection: 'up' | 'down' | 'steady',
  learningAnalytics: LearningAnalytics
) {
  const weekWindow = learningAnalytics.windows.find((window) => window.days === 7)
  const monthWindow = learningAnalytics.windows.find((window) => window.days === 30)
  const recoveryRate = learningAnalytics.curve.recovery_rate
  const improvementDelta = learningAnalytics.curve.improvement_delta

  if (stats.total_answered === 0) {
    return {
      title: 'Monte sua primeira sessao',
      description: 'Comece pelo banco de questoes para gerar dados e destravar recomendacoes personalizadas.',
      href: '/questoes',
      cta: 'Explorar questoes',
    }
  }

  if (
    weekWindow &&
    weekWindow.attempts >= 10 &&
    weekWindow.delta_vs_previous_window !== null &&
    weekWindow.delta_vs_previous_window <= -8 &&
    improvementDelta <= 3
  ) {
    return {
      title: 'Estancar a queda recente',
      description: `${weekWindow.delta_vs_previous_window} pts na ultima semana e repeticao com ganho de apenas ${improvementDelta} pts. Priorize a fila critica antes de expandir volume.`,
      href: '/revisao?tab=erradas',
      cta: 'Atacar revisao critica',
    }
  }

  if (learningAnalytics.curve.repeat_attempt_count >= 8 && recoveryRate < 45) {
    return {
      title: 'Recuperar erros que continuam escapando',
      description: `So ${recoveryRate}% dos erros iniciais foram recuperados nas repeticoes. Refaça a fila priorizada antes de abrir novos blocos.`,
      href: '/revisao?tab=erradas',
      cta: 'Abrir fila priorizada',
    }
  }

  if (focusTopic && Number(focusTopic.accuracy) < 70) {
    return {
      title: `Reforcar ${focusTopic.topic_name}`,
      description: `${focusTopic.correct_attempts}/${focusTopic.total_attempts} acertos em ${focusTopic.specialty_name}. Volte ao topico antes de ele esfriar.`,
      href: `/questoes?specialty=${focusTopic.specialty_id}&topic=${focusTopic.topic_id}&sort=most_wrong`,
      cta: 'Abrir topico critico',
    }
  }

  if (focusSpecialty && Number(focusSpecialty.accuracy) < 70) {
    return {
      title: `Corrigir lacunas em ${focusSpecialty.specialty_name}`,
      description: `${focusSpecialty.correct_attempts}/${focusSpecialty.total_attempts} acertos. Reforce essa especialidade antes do proximo simulado.`,
      href: `/revisao?tab=erradas&specialty=${focusSpecialty.specialty_id}`,
      cta: 'Ir para revisao',
    }
  }

  if (
    weekWindow &&
    monthWindow &&
    monthWindow.attempts >= 24 &&
    weekWindow.attempts <= Math.max(6, Math.round(monthWindow.attempts * 0.18))
  ) {
    return {
      title: 'Retomar volume com intencao',
      description: `Sua ultima semana ficou em ${weekWindow.attempts} tentativas dentro de uma base de ${monthWindow.attempts} no ultimo mes. Volte ao banco com recortes curtos.`,
      href: '/questoes?sort=least_reviewed',
      cta: 'Retomar banco',
    }
  }

  if (trendDirection === 'up' && stats.total_sessions < 3) {
    return {
      title: 'Transformar consistencia em prova',
      description: 'Seu ritmo melhorou. Agora vale validar isso em um simulado curto e cronometrado.',
      href: '/simulado',
      cta: 'Criar simulado',
    }
  }

  return {
    title: 'Manter volume com revisao ativa',
    description: 'Continue respondendo e revisando para consolidar as especialidades mais estudadas.',
    href: '/revisao?tab=todas',
    cta: 'Abrir revisao',
  }
}

export function buildDashboardInsights(
  stats: DashboardStats,
  specialtyStats: SpecialtyStats[],
  weeklyAccuracy: WeeklyAccuracy[],
  topicStats: TopicStats[] = [],
  learningAnalytics: LearningAnalytics = EMPTY_LEARNING_ANALYTICS
): DashboardInsightModel {
  const focusSpecialty = specialtyStats.length > 0 ? [...specialtyStats].sort((a, b) => a.accuracy - b.accuracy)[0] : null
  const strongestSpecialty = specialtyStats.length > 0 ? [...specialtyStats].sort((a, b) => b.accuracy - a.accuracy)[0] : null
  const weakPoints = [...specialtyStats].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3)
  const focusTopic = topicStats.length > 0 ? [...topicStats].sort((a, b) => a.accuracy - b.accuracy)[0] : null
  const strongestTopic = topicStats.length > 0 ? [...topicStats].sort((a, b) => b.accuracy - a.accuracy)[0] : null
  const topicWeakPoints = [...topicStats].sort((a, b) => a.accuracy - b.accuracy).slice(0, 4)
  const trend = getTrend(weeklyAccuracy)

  return {
    averageTimePerQuestion: formatAverageQuestionTime(stats.total_time_seconds, stats.total_answered),
    trendDelta: trend.delta,
    trendDirection: trend.direction,
    trendSummary: trend.summary,
    trendDescription: trend.description,
    studyRhythm: getStudyRhythm(stats.total_answered),
    consistencySummary: getConsistencySummary(stats.study_streak),
    focusSpecialty,
    strongestSpecialty,
    weakPoints,
    focusTopic,
    strongestTopic,
    topicWeakPoints,
    recommendedAction: getRecommendedAction(
      stats,
      focusSpecialty,
      focusTopic,
      trend.direction,
      learningAnalytics
    ),
  }
}
