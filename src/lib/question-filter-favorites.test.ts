import test from 'node:test'
import assert from 'node:assert/strict'

import {
  addFavorite,
  buildFavoriteQueryString,
  createQuestionFilterFavorite,
  extractFavoriteFilters,
  parseStoredFavorites,
  removeFavorite,
} from './question-filter-favorites.ts'

test('favorite filters are extracted and serialized without page noise', () => {
  const filters = extractFavoriteFilters({
    type: 'ENARE',
    year: '2025',
    specialty: 'cm',
    topic: 'cardio',
    search: 'sepse',
    sort: 'most_wrong',
    page: '2',
  })

  assert.deepEqual(filters, {
    type: 'ENARE',
    year: '2025',
    specialty: 'cm',
    topic: 'cardio',
    search: 'sepse',
    sort: 'most_wrong',
  })
  assert.equal(
    buildFavoriteQueryString(filters),
    'type=ENARE&year=2025&specialty=cm&topic=cardio&search=sepse&sort=most_wrong'
  )
})

test('favorite filters ignore invalid sort values', () => {
  const filters = extractFavoriteFilters({
    specialty: 'cm',
    sort: 'unsupported-sort',
  })

  assert.deepEqual(filters, {
    specialty: 'cm',
  })
})

test('favorites can be added, parsed and removed safely', () => {
  const favorite = createQuestionFilterFavorite({
    label: 'Clinica focada',
    filters: { specialty: 'cm', status: 'unanswered' },
    now: new Date('2026-03-05T10:00:00.000Z'),
  })
  const favorites = addFavorite([], favorite)
  const parsed = parseStoredFavorites(JSON.stringify(favorites))

  assert.equal(parsed[0]?.label, 'Clinica focada')
  assert.equal(removeFavorite(parsed, favorite.id).length, 0)
  assert.deepEqual(parseStoredFavorites('invalid-json'), [])
})
