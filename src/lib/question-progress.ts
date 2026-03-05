import type { QuestionHistorySummary, QuestionAttempt } from './types'

type AttemptLike = Pick<
  QuestionAttempt,
  'created_at' | 'is_correct' | 'time_spent_seconds'
>

export function buildQuestionHistorySummary(
  attempts: AttemptLike[]
): QuestionHistorySummary {
  if (attempts.length === 0) {
    return {
      attemptsCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      averageTimeSpentSeconds: 0,
      lastAttemptAt: null,
      lastAttemptCorrect: null,
      learningState: 'inedita',
    }
  }

  const orderedAttempts = [...attempts].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  )
  const lastAttempt = orderedAttempts[0]
  const correctCount = orderedAttempts.filter((attempt) => attempt.is_correct).length
  const incorrectCount = orderedAttempts.length - correctCount
  const averageTimeSpentSeconds = Math.round(
    orderedAttempts.reduce((total, attempt) => total + attempt.time_spent_seconds, 0) /
      orderedAttempts.length
  )

  return {
    attemptsCount: orderedAttempts.length,
    correctCount,
    incorrectCount,
    averageTimeSpentSeconds,
    lastAttemptAt: lastAttempt.created_at,
    lastAttemptCorrect: lastAttempt.is_correct,
    learningState: getLearningState(orderedAttempts.map((attempt) => attempt.is_correct)),
  }
}

export function getLearningState(results: boolean[]) {
  if (results.length === 0) {
    return 'inedita' as const
  }

  const [lastResult, previousResult] = results

  if (lastResult && previousResult) {
    return 'consolidada' as const
  }

  const totalCorrect = results.filter(Boolean).length
  const accuracy = totalCorrect / results.length

  if (lastResult && results.length >= 3 && accuracy >= 0.7) {
    return 'consolidada' as const
  }

  return 'instavel' as const
}

export function formatAverageQuestionTime(seconds: number) {
  if (seconds <= 0) {
    return '0s'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}s`
  }

  if (remainingSeconds === 0) {
    return `${minutes}min`
  }

  return `${minutes}min ${remainingSeconds}s`
}

export function formatAttemptDate(date: string | null) {
  if (!date) {
    return 'Ainda nao respondida'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}
