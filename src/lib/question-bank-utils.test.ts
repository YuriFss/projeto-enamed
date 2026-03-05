import test from 'node:test'
import assert from 'node:assert/strict'

import { sortQuestionCandidates } from './question-bank-utils.ts'

const candidates = [
  { id: 'q1', number: 1, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'q2', number: 2, created_at: '2026-03-05T10:00:00.000Z' },
  { id: 'q3', number: 3, created_at: '2026-03-03T10:00:00.000Z' },
]

const stats = new Map([
  ['q1', { attemptsCount: 1, wrongCount: 0, lastAnsweredAt: '2026-03-04T10:00:00.000Z' }],
  ['q2', { attemptsCount: 3, wrongCount: 2, lastAnsweredAt: '2026-03-05T10:00:00.000Z' }],
  ['q3', { attemptsCount: 0, wrongCount: 0, lastAnsweredAt: null }],
])

test('question bank sort supports recent and most wrong modes', () => {
  const recent = sortQuestionCandidates(candidates, stats, { sort: 'recent' })
  const mostWrong = sortQuestionCandidates(candidates, stats, { sort: 'most_wrong' })

  assert.deepEqual(recent.map((item) => item.id), ['q2', 'q3', 'q1'])
  assert.deepEqual(mostWrong.map((item) => item.id), ['q2', 'q1', 'q3'])
})

test('question bank sort supports least reviewed and unanswered filtering', () => {
  const leastReviewed = sortQuestionCandidates(candidates, stats, { sort: 'least_reviewed' })
  const unanswered = sortQuestionCandidates(candidates, stats, { status: 'unanswered' })

  assert.deepEqual(leastReviewed.map((item) => item.id), ['q3', 'q1', 'q2'])
  assert.deepEqual(unanswered.map((item) => item.id), ['q3'])
})
