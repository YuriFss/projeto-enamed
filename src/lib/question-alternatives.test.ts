import test from 'node:test'
import assert from 'node:assert/strict'

import { getQuestionAlternatives } from './question-alternatives.ts'

test('question alternatives hide empty options', () => {
  const alternatives = getQuestionAlternatives({
    alternative_a: 'Opcao A',
    alternative_b: 'Opcao B',
    alternative_c: 'Opcao C',
    alternative_d: 'Opcao D',
    alternative_e: '   ',
  })

  assert.deepEqual(alternatives, [
    { key: 'A', text: 'Opcao A' },
    { key: 'B', text: 'Opcao B' },
    { key: 'C', text: 'Opcao C' },
    { key: 'D', text: 'Opcao D' },
  ])
})

test('question alternatives keep the fifth option when it exists', () => {
  const alternatives = getQuestionAlternatives({
    alternative_a: 'Opcao A',
    alternative_b: 'Opcao B',
    alternative_c: 'Opcao C',
    alternative_d: 'Opcao D',
    alternative_e: 'Opcao E',
  })

  assert.equal(alternatives.at(-1)?.key, 'E')
  assert.equal(alternatives.at(-1)?.text, 'Opcao E')
})
