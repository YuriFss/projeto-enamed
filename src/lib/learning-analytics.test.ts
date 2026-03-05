import assert from 'node:assert/strict'
import test from 'node:test'

import { buildLearningAnalytics } from './learning-analytics.ts'

const now = new Date('2026-03-05T12:00:00.000Z')

test('buildLearningAnalytics calculates 7/14/30 day windows and deltas', () => {
  const analytics = buildLearningAnalytics(
    [
      {
        question_id: 'q1',
        is_correct: true,
        time_spent_seconds: 40,
        created_at: '2026-03-04T10:00:00.000Z',
      },
      {
        question_id: 'q2',
        is_correct: false,
        time_spent_seconds: 80,
        created_at: '2026-03-02T10:00:00.000Z',
      },
      {
        question_id: 'q3',
        is_correct: true,
        time_spent_seconds: 70,
        created_at: '2026-02-28T10:00:00.000Z',
      },
      {
        question_id: 'q4',
        is_correct: false,
        time_spent_seconds: 50,
        created_at: '2026-02-25T10:00:00.000Z',
      },
      {
        question_id: 'q5',
        is_correct: true,
        time_spent_seconds: 60,
        created_at: '2026-02-22T10:00:00.000Z',
      },
      {
        question_id: 'q6',
        is_correct: false,
        time_spent_seconds: 90,
        created_at: '2026-02-20T10:00:00.000Z',
      },
      {
        question_id: 'q7',
        is_correct: true,
        time_spent_seconds: 55,
        created_at: '2026-02-10T10:00:00.000Z',
      },
    ],
    now
  )

  assert.deepEqual(analytics.windows, [
    {
      days: 7,
      attempts: 3,
      correct_attempts: 2,
      accuracy: 66.7,
      average_time_seconds: 63,
      delta_vs_previous_window: 33.4,
    },
    {
      days: 14,
      attempts: 6,
      correct_attempts: 3,
      accuracy: 50,
      average_time_seconds: 65,
      delta_vs_previous_window: -50,
    },
    {
      days: 30,
      attempts: 7,
      correct_attempts: 4,
      accuracy: 57.1,
      average_time_seconds: 64,
      delta_vs_previous_window: null,
    },
  ])
})

test('buildLearningAnalytics measures first attempt, repeats and recovery', () => {
  const analytics = buildLearningAnalytics(
    [
      {
        question_id: 'q1',
        is_correct: false,
        time_spent_seconds: 80,
        created_at: '2026-02-10T10:00:00.000Z',
      },
      {
        question_id: 'q1',
        is_correct: true,
        time_spent_seconds: 45,
        created_at: '2026-02-12T10:00:00.000Z',
      },
      {
        question_id: 'q2',
        is_correct: true,
        time_spent_seconds: 30,
        created_at: '2026-02-11T10:00:00.000Z',
      },
      {
        question_id: 'q2',
        is_correct: true,
        time_spent_seconds: 28,
        created_at: '2026-02-13T10:00:00.000Z',
      },
      {
        question_id: 'q3',
        is_correct: false,
        time_spent_seconds: 60,
        created_at: '2026-02-14T10:00:00.000Z',
      },
      {
        question_id: 'q3',
        is_correct: false,
        time_spent_seconds: 58,
        created_at: '2026-02-16T10:00:00.000Z',
      },
      {
        question_id: 'q4',
        is_correct: true,
        time_spent_seconds: 40,
        created_at: '2026-02-18T10:00:00.000Z',
      },
    ],
    now
  )

  assert.deepEqual(analytics.curve, {
    first_attempt_count: 4,
    first_attempt_accuracy: 50,
    repeat_attempt_count: 3,
    repeat_attempt_accuracy: 66.7,
    questions_with_repeats: 3,
    recoverable_questions: 2,
    recovered_questions: 1,
    recovery_rate: 50,
    improvement_delta: 16.7,
  })
})
