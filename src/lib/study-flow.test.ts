import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getQuestionBankFilterChips,
  getQuestionBankFocusLabel,
  getQuestionBankOverview,
  getReviewReason,
  getReviewTabMeta,
} from './study-flow.ts'

test('question bank chips include human readable labels', () => {
  const chips = getQuestionBankFilterChips(
    {
      type: 'ENAMED',
      year: '2025',
      specialty: 'cm',
      topic: 'cardio',
      difficulty: 'medio',
      status: 'unanswered',
      search: 'sepse',
      sort: 'most_wrong',
    },
    [{ id: 'cm', name: 'Clinica Medica', color: '#0F766E' }],
    [{ id: 'cardio', specialty_id: 'cm', name: 'Cardiologia' }]
  )

  assert.deepEqual(chips.map((chip) => chip.label), [
    'Prova: ENAMED',
    'Ano: 2025',
    'Especialidade: Clinica Medica',
    'Topico: Cardiologia',
    'Dificuldade: Medio',
    'Status: Nao respondidas',
    'Busca: sepse',
    'Ordenacao: Mais erradas',
  ])
})

test('question bank overview adapts to study mode', () => {
  assert.equal(getQuestionBankOverview(12, { status: 'answered' }), '12 questoes prontas para revisao no recorte atual.')
  assert.equal(getQuestionBankOverview(5, { status: 'unanswered' }), '5 questoes novas para avancar sem repetir.')
  assert.equal(getQuestionBankOverview(7, { search: 'pneumonia' }), '7 questoes encontradas para "pneumonia".')
  assert.equal(getQuestionBankOverview(0, {}), 'Nenhuma questao encontrada para o recorte atual.')
  assert.equal(getQuestionBankFocusLabel({ status: 'answered' }), 'Modo revisao')
})

test('review copy communicates the tab intent and reason', () => {
  const meta = getReviewTabMeta('erradas')
  assert.match(meta.title, /pontos fracos/i)

  const markedReason = getReviewReason('marcadas', '2026-03-01T10:00:00.000Z')
  assert.match(markedReason, /Marcada para revisitar desde/i)
})
