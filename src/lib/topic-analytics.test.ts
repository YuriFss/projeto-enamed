import test from 'node:test'
import assert from 'node:assert/strict'

import { buildTopicStats } from './topic-analytics.ts'

test('topic analytics aggregates attempts and sorts weaker topics first', () => {
  const stats = buildTopicStats([
    {
      is_correct: false,
      question: {
        specialty_id: 'cm',
        specialty: { name: 'Clinica Medica' },
        topic_id: 'cardio',
        topic: { id: 'cardio', name: 'Cardiologia' },
      },
    },
    {
      is_correct: true,
      question: {
        specialty_id: 'cm',
        specialty: { name: 'Clinica Medica' },
        topic_id: 'cardio',
        topic: { id: 'cardio', name: 'Cardiologia' },
      },
    },
    {
      is_correct: false,
      question: {
        specialty_id: 'ped',
        specialty: { name: 'Pediatria' },
        topic_id: 'neo',
        topic: { id: 'neo', name: 'Neonatologia' },
      },
    },
  ])

  assert.equal(stats[0]?.topic_name, 'Neonatologia')
  assert.equal(stats[0]?.accuracy, 0)
  assert.equal(stats[1]?.topic_name, 'Cardiologia')
  assert.equal(stats[1]?.accuracy, 50)
})
