import test from 'node:test'
import assert from 'node:assert/strict'

import { buildSimulationResultInsights } from './simulation-result-insights.ts'

const questionBase = {
  id: 'q1',
  exam_id: 'e1',
  number: 1,
  statement: 'Questao',
  alternative_a: 'A',
  alternative_b: 'B',
  alternative_c: 'C',
  alternative_d: 'D',
  alternative_e: 'E',
  correct_answer: 'A' as const,
  explanation: null,
  specialty_id: 'cm',
  topic_id: 'cardio',
  difficulty: 'medio' as const,
  created_at: '2026-01-01T00:00:00.000Z',
}

test('simulation insights recommend weakest topic when performance is low', () => {
  const insights = buildSimulationResultInsights(
    [
      {
        id: 's1',
        session_id: 'sim',
        question_id: 'q1',
        position: 1,
        selected_answer: 'B',
        is_correct: false,
        time_spent_seconds: 80,
        flagged: false,
        question: {
          ...questionBase,
          specialty: { id: 'cm', name: 'Clinica Medica', color: '#0F766E' },
          topic: { id: 'cardio', specialty_id: 'cm', name: 'Cardiologia' },
        },
      },
      {
        id: 's2',
        session_id: 'sim',
        question_id: 'q2',
        position: 2,
        selected_answer: 'A',
        is_correct: true,
        time_spent_seconds: 50,
        flagged: false,
        question: {
          ...questionBase,
          id: 'q2',
          specialty: { id: 'ped', name: 'Pediatria', color: '#2563EB' },
          specialty_id: 'ped',
          topic_id: 'neo',
          topic: { id: 'neo', specialty_id: 'ped', name: 'Neonatologia' },
        },
      },
    ],
    130
  )

  assert.equal(insights.accuracy, 50)
  assert.equal(insights.weakestTopic?.name, 'Cardiologia')
  assert.match(insights.recommendedAction.href, /topic=cardio/)
  assert.match(insights.pacingSummary, /1min 5s|1min 5s por questao/i)
})
