import type { LearningAnalytics, LearningCurveStats, LearningWindowStats } from './types'

interface AttemptWithLearningData {
  question_id: string
  is_correct: boolean
  time_spent_seconds: number
  created_at: string
}

const WINDOW_DAYS = [7, 14, 30] as const

function roundPercentage(value: number): number {
  return Number(value.toFixed(1))
}

function toAccuracy(correctAttempts: number, attempts: number): number {
  if (attempts === 0) return 0
  return roundPercentage((correctAttempts / attempts) * 100)
}

function buildWindowStats(
  attempts: AttemptWithLearningData[],
  now: Date,
  days: (typeof WINDOW_DAYS)[number]
): LearningWindowStats {
  const currentStart = new Date(now)
  currentStart.setDate(currentStart.getDate() - days)

  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - days)

  let currentAttempts = 0
  let currentCorrect = 0
  let currentTime = 0
  let previousAttempts = 0
  let previousCorrect = 0

  attempts.forEach((attempt) => {
    const createdAt = new Date(attempt.created_at)

    if (createdAt >= currentStart && createdAt <= now) {
      currentAttempts += 1
      currentTime += attempt.time_spent_seconds
      if (attempt.is_correct) {
        currentCorrect += 1
      }
      return
    }

    if (createdAt >= previousStart && createdAt < currentStart) {
      previousAttempts += 1
      if (attempt.is_correct) {
        previousCorrect += 1
      }
    }
  })

  const currentAccuracy = toAccuracy(currentCorrect, currentAttempts)
  const previousAccuracy = toAccuracy(previousCorrect, previousAttempts)

  return {
    days,
    attempts: currentAttempts,
    correct_attempts: currentCorrect,
    accuracy: currentAccuracy,
    average_time_seconds:
      currentAttempts > 0 ? Math.round(currentTime / currentAttempts) : 0,
    delta_vs_previous_window:
      previousAttempts > 0 ? roundPercentage(currentAccuracy - previousAccuracy) : null,
  }
}

function buildCurveStats(attempts: AttemptWithLearningData[]): LearningCurveStats {
  const attemptsByQuestion = new Map<string, AttemptWithLearningData[]>()

  attempts.forEach((attempt) => {
    const existing = attemptsByQuestion.get(attempt.question_id) || []
    existing.push(attempt)
    attemptsByQuestion.set(attempt.question_id, existing)
  })

  let firstAttemptCount = 0
  let firstAttemptCorrect = 0
  let repeatAttemptCount = 0
  let repeatAttemptCorrect = 0
  let questionsWithRepeats = 0
  let recoverableQuestions = 0
  let recoveredQuestions = 0

  attemptsByQuestion.forEach((questionAttempts) => {
    const orderedAttempts = [...questionAttempts].sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    )

    const [firstAttempt, ...repeatAttempts] = orderedAttempts

    if (!firstAttempt) return

    firstAttemptCount += 1
    if (firstAttempt.is_correct) {
      firstAttemptCorrect += 1
    }

    if (repeatAttempts.length > 0) {
      questionsWithRepeats += 1
    }

    repeatAttempts.forEach((attempt) => {
      repeatAttemptCount += 1
      if (attempt.is_correct) {
        repeatAttemptCorrect += 1
      }
    })

    if (!firstAttempt.is_correct) {
      recoverableQuestions += 1

      if (repeatAttempts.some((attempt) => attempt.is_correct)) {
        recoveredQuestions += 1
      }
    }
  })

  const firstAttemptAccuracy = toAccuracy(firstAttemptCorrect, firstAttemptCount)
  const repeatAttemptAccuracy = toAccuracy(repeatAttemptCorrect, repeatAttemptCount)
  const recoveryRate = toAccuracy(recoveredQuestions, recoverableQuestions)

  return {
    first_attempt_count: firstAttemptCount,
    first_attempt_accuracy: firstAttemptAccuracy,
    repeat_attempt_count: repeatAttemptCount,
    repeat_attempt_accuracy: repeatAttemptAccuracy,
    questions_with_repeats: questionsWithRepeats,
    recoverable_questions: recoverableQuestions,
    recovered_questions: recoveredQuestions,
    recovery_rate: recoveryRate,
    improvement_delta: roundPercentage(repeatAttemptAccuracy - firstAttemptAccuracy),
  }
}

export function buildLearningAnalytics(
  attempts: AttemptWithLearningData[],
  now: Date = new Date()
): LearningAnalytics {
  return {
    windows: WINDOW_DAYS.map((days) => buildWindowStats(attempts, now, days)),
    curve: buildCurveStats(attempts),
  }
}
