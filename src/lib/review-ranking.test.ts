import test from 'node:test'
import assert from 'node:assert/strict'

import { buildReviewQueue } from './review-ranking.ts'

const question = {
  id: 'q1',
  exam_id: 'e1',
  number: 1,
  statement: 'Qual a conduta?',
  alternative_a: 'A',
  alternative_b: 'B',
  alternative_c: 'C',
  alternative_d: 'D',
  alternative_e: 'E',
  correct_answer: 'A' as const,
  explanation: null,
  specialty_id: 'cm',
  topic_id: null,
  difficulty: 'medio' as const,
  created_at: '2026-01-01T00:00:00.000Z',
}

test('review queue prioritizes recurring recent errors', () => {
  const items = buildReviewQueue({
    tab: 'erradas',
    now: new Date('2026-03-05T12:00:00.000Z'),
    attempts: [
      {
        id: 'a3',
        question_id: 'q1',
        selected_answer: 'B',
        is_correct: false,
        created_at: '2026-03-04T10:00:00.000Z',
        time_spent_seconds: 55,
        question,
      },
      {
        id: 'a2',
        question_id: 'q1',
        selected_answer: 'C',
        is_correct: false,
        created_at: '2026-02-24T10:00:00.000Z',
        time_spent_seconds: 48,
        question,
      },
      {
        id: 'a1',
        question_id: 'q2',
        selected_answer: 'A',
        is_correct: false,
        created_at: '2026-03-03T10:00:00.000Z',
        time_spent_seconds: 42,
        question: { ...question, id: 'q2', specialty_id: 'ped' },
      },
    ],
    bookmarks: [
      {
        id: 'b1',
        question_id: 'q1',
        created_at: '2026-03-01T09:00:00.000Z',
        question,
      },
    ],
  })

  assert.equal(items[0]?.question?.id, 'q1')
  assert.equal(items[0]?.priority, 'alta')
  assert.match(items[0]?.reason || '', /erro recorrente/i)
  assert.ok(items[0]?.priorityBadges.includes('Marcada manualmente'))
})

test('review queue for marked questions preserves manual marks without attempts', () => {
  const items = buildReviewQueue({
    tab: 'marcadas',
    now: new Date('2026-03-05T12:00:00.000Z'),
    attempts: [],
    bookmarks: [
      {
        id: 'b2',
        question_id: 'q3',
        created_at: '2026-03-02T09:00:00.000Z',
        question: { ...question, id: 'q3', specialty_id: 'go' },
      },
    ],
  })

  assert.equal(items.length, 1)
  assert.equal(items[0]?.priority, 'media')
  assert.match(items[0]?.reason || '', /marcada manualmente/i)
})
