import assert from 'node:assert/strict'
import test from 'node:test'

import {
  EMPTY_LEARNING_ANALYTICS,
  normalizeDashboardAnalyticsPayload,
} from './dashboard-analytics.ts'

test('normalizeDashboardAnalyticsPayload returns empty defaults for invalid payloads', () => {
  assert.deepEqual(normalizeDashboardAnalyticsPayload(null), {
    learningAnalytics: EMPTY_LEARNING_ANALYTICS,
    topicStats: [],
  })
})

test('normalizeDashboardAnalyticsPayload keeps valid analytics and filters malformed topics', () => {
  const normalized = normalizeDashboardAnalyticsPayload({
    learningAnalytics: {
      windows: [
        { days: 7, attempts: 12, correct_attempts: 8, accuracy: 66.7, average_time_seconds: 41, delta_vs_previous_window: 5 },
        { days: 30, attempts: 40, correct_attempts: 25, accuracy: 62.5, average_time_seconds: 44, delta_vs_previous_window: null },
      ],
      curve: {
        first_attempt_count: 20,
        first_attempt_accuracy: 55,
        repeat_attempt_count: 6,
        repeat_attempt_accuracy: 66.7,
        questions_with_repeats: 5,
        recoverable_questions: 8,
        recovered_questions: 3,
        recovery_rate: 37.5,
        improvement_delta: 11.7,
      },
    },
    topicStats: [
      {
        topic_id: 'cardio',
        topic_name: 'Cardiologia',
        specialty_id: 'cm',
        specialty_name: 'Clinica Medica',
        total_attempts: 10,
        correct_attempts: 6,
        accuracy: 60,
      },
      { topic_id: 'broken' },
    ],
  })

  assert.deepEqual(normalized.learningAnalytics.windows, [
    { days: 7, attempts: 12, correct_attempts: 8, accuracy: 66.7, average_time_seconds: 41, delta_vs_previous_window: 5 },
    { days: 14, attempts: 0, correct_attempts: 0, accuracy: 0, average_time_seconds: 0, delta_vs_previous_window: null },
    { days: 30, attempts: 40, correct_attempts: 25, accuracy: 62.5, average_time_seconds: 44, delta_vs_previous_window: null },
  ])
  assert.equal(normalized.learningAnalytics.curve.repeat_attempt_accuracy, 66.7)
  assert.deepEqual(normalized.topicStats, [
    {
      topic_id: 'cardio',
      topic_name: 'Cardiologia',
      specialty_id: 'cm',
      specialty_name: 'Clinica Medica',
      total_attempts: 10,
      correct_attempts: 6,
      accuracy: 60,
    },
  ])
})
