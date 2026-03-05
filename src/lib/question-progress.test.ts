import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildQuestionHistorySummary,
  formatAttemptDate,
  formatAverageQuestionTime,
  getLearningState,
} from './question-progress.ts'

test('question history summary tracks attempts, correctness and timing', () => {
  const summary = buildQuestionHistorySummary([
    {
      created_at: '2026-03-04T10:00:00.000Z',
      is_correct: true,
      time_spent_seconds: 35,
    },
    {
      created_at: '2026-03-02T10:00:00.000Z',
      is_correct: true,
      time_spent_seconds: 55,
    },
    {
      created_at: '2026-03-01T10:00:00.000Z',
      is_correct: false,
      time_spent_seconds: 70,
    },
  ])

  assert.equal(summary.attemptsCount, 3)
  assert.equal(summary.correctCount, 2)
  assert.equal(summary.incorrectCount, 1)
  assert.equal(summary.averageTimeSpentSeconds, 53)
  assert.equal(summary.learningState, 'consolidada')
})

test('learning state stays unstable when accuracy oscillates', () => {
  assert.equal(getLearningState([false]), 'instavel')
  assert.equal(getLearningState([true, false, true]), 'instavel')
  assert.equal(getLearningState([]), 'inedita')
})

test('time and date formatters stay readable', () => {
  assert.equal(formatAverageQuestionTime(0), '0s')
  assert.equal(formatAverageQuestionTime(67), '1min 7s')
  assert.equal(formatAttemptDate(null), 'Ainda nao respondida')
  assert.match(formatAttemptDate('2026-03-04T10:00:00.000Z'), /\d{2}\/\d{2}\/\d{4}/)
})
