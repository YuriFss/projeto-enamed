import type { LearningAnalytics, TopicStats } from './types'

export interface DashboardAnalyticsPayload {
  learningAnalytics: LearningAnalytics
  topicStats: TopicStats[]
}

export const EMPTY_LEARNING_ANALYTICS: LearningAnalytics = {
  windows: [
    {
      days: 7,
      attempts: 0,
      correct_attempts: 0,
      accuracy: 0,
      average_time_seconds: 0,
      delta_vs_previous_window: null,
    },
    {
      days: 14,
      attempts: 0,
      correct_attempts: 0,
      accuracy: 0,
      average_time_seconds: 0,
      delta_vs_previous_window: null,
    },
    {
      days: 30,
      attempts: 0,
      correct_attempts: 0,
      accuracy: 0,
      average_time_seconds: 0,
      delta_vs_previous_window: null,
    },
  ],
  curve: {
    first_attempt_count: 0,
    first_attempt_accuracy: 0,
    repeat_attempt_count: 0,
    repeat_attempt_accuracy: 0,
    questions_with_repeats: 0,
    recoverable_questions: 0,
    recovered_questions: 0,
    recovery_rate: 0,
    improvement_delta: 0,
  },
}

const WINDOW_DAYS = [7, 14, 30] as const

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function toNullableNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function normalizeLearningAnalytics(value: unknown): LearningAnalytics {
  if (!isObject(value)) {
    return EMPTY_LEARNING_ANALYTICS
  }

  const rawWindows = Array.isArray(value.windows) ? value.windows : null

  const windows = rawWindows
    ? WINDOW_DAYS.map((days) => {
        const rawWindow = rawWindows.find(
          (window): window is Record<string, unknown> =>
            isObject(window) && toNumber(window.days) === days
        )

        return {
          days,
          attempts: toNumber(rawWindow?.attempts),
          correct_attempts: toNumber(rawWindow?.correct_attempts),
          accuracy: toNumber(rawWindow?.accuracy),
          average_time_seconds: toNumber(rawWindow?.average_time_seconds),
          delta_vs_previous_window: toNullableNumber(rawWindow?.delta_vs_previous_window),
        }
      })
    : EMPTY_LEARNING_ANALYTICS.windows

  const curve = isObject(value.curve) ? value.curve : {}

  return {
    windows,
    curve: {
      first_attempt_count: toNumber(curve.first_attempt_count),
      first_attempt_accuracy: toNumber(curve.first_attempt_accuracy),
      repeat_attempt_count: toNumber(curve.repeat_attempt_count),
      repeat_attempt_accuracy: toNumber(curve.repeat_attempt_accuracy),
      questions_with_repeats: toNumber(curve.questions_with_repeats),
      recoverable_questions: toNumber(curve.recoverable_questions),
      recovered_questions: toNumber(curve.recovered_questions),
      recovery_rate: toNumber(curve.recovery_rate),
      improvement_delta: toNumber(curve.improvement_delta),
    },
  }
}

function normalizeTopicStats(value: unknown): TopicStats[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    if (!isObject(entry)) {
      return []
    }

    const topicId = typeof entry.topic_id === 'string' ? entry.topic_id : null
    const topicName = typeof entry.topic_name === 'string' ? entry.topic_name : null
    const specialtyId = typeof entry.specialty_id === 'string' ? entry.specialty_id : null
    const specialtyName = typeof entry.specialty_name === 'string' ? entry.specialty_name : null

    if (!topicId || !topicName || !specialtyId || !specialtyName) {
      return []
    }

    return [
      {
        topic_id: topicId,
        topic_name: topicName,
        specialty_id: specialtyId,
        specialty_name: specialtyName,
        total_attempts: toNumber(entry.total_attempts),
        correct_attempts: toNumber(entry.correct_attempts),
        accuracy: toNumber(entry.accuracy),
      },
    ]
  })
}

export function normalizeDashboardAnalyticsPayload(value: unknown): DashboardAnalyticsPayload {
  if (!isObject(value)) {
    return {
      learningAnalytics: EMPTY_LEARNING_ANALYTICS,
      topicStats: [],
    }
  }

  return {
    learningAnalytics: normalizeLearningAnalytics(value.learningAnalytics),
    topicStats: normalizeTopicStats(value.topicStats),
  }
}
