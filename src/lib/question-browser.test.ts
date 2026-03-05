import test from 'node:test'
import assert from 'node:assert/strict'

import { buildQuestionFlowState } from './question-flow.ts'

test('question flow exposes previous, next and next unanswered navigation', () => {
  const flow = buildQuestionFlowState({
    currentQuestionId: 'q2',
    orderedCandidates: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }, { id: 'q4' }],
    latestAttemptByQuestion: new Map([
      ['q1', '2026-03-01T10:00:00.000Z'],
      ['q2', '2026-03-02T10:00:00.000Z'],
      ['q4', '2026-03-03T10:00:00.000Z'],
    ]),
  })

  assert.equal(flow?.currentIndex, 1)
  assert.equal(flow?.previousQuestionId, 'q1')
  assert.equal(flow?.nextQuestionId, 'q3')
  assert.equal(flow?.nextUnansweredQuestionId, 'q3')
  assert.equal(flow?.answeredCount, 3)
  assert.equal(flow?.unansweredCount, 1)
})

test('question flow returns null when current question is outside the filtered sequence', () => {
  const flow = buildQuestionFlowState({
    currentQuestionId: 'missing',
    orderedCandidates: [{ id: 'q1' }],
    latestAttemptByQuestion: new Map(),
  })

  assert.equal(flow, null)
})
