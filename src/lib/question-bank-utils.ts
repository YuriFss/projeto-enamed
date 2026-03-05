import type { QuestionBankSort } from './types'

export interface CandidateQuestionLike {
  id: string
  number: number
  created_at: string
}

export interface QuestionAttemptStats {
  attemptsCount: number
  wrongCount: number
  lastAnsweredAt: string | null
}

export interface QuestionBankSortFilters {
  status?: 'answered' | 'unanswered'
  sort?: QuestionBankSort
}

function compareNaturalOrder(a: CandidateQuestionLike, b: CandidateQuestionLike) {
  if (a.number === b.number) {
    return a.id.localeCompare(b.id)
  }

  return a.number - b.number
}

export function sortQuestionCandidates(
  candidates: CandidateQuestionLike[],
  statsByQuestion: Map<string, QuestionAttemptStats>,
  filters: QuestionBankSortFilters
) {
  const filtered = candidates.filter((candidate) => {
    const attemptsCount = statsByQuestion.get(candidate.id)?.attemptsCount || 0

    if (filters.status === 'answered') {
      return attemptsCount > 0
    }

    if (filters.status === 'unanswered') {
      return attemptsCount === 0
    }

    return true
  })

  if (filters.sort === 'recent') {
    return [...filtered].sort((a, b) => {
      if (a.created_at === b.created_at) {
        return compareNaturalOrder(a, b)
      }

      return b.created_at.localeCompare(a.created_at)
    })
  }

  if (filters.sort === 'most_wrong') {
    return [...filtered].sort((a, b) => {
      const aStats = statsByQuestion.get(a.id)
      const bStats = statsByQuestion.get(b.id)
      const wrongDiff = (bStats?.wrongCount || 0) - (aStats?.wrongCount || 0)

      if (wrongDiff !== 0) {
        return wrongDiff
      }

      const attemptDiff = (bStats?.attemptsCount || 0) - (aStats?.attemptsCount || 0)
      if (attemptDiff !== 0) {
        return attemptDiff
      }

      return compareNaturalOrder(a, b)
    })
  }

  if (filters.sort === 'least_reviewed') {
    return [...filtered].sort((a, b) => {
      const aStats = statsByQuestion.get(a.id)
      const bStats = statsByQuestion.get(b.id)
      const attemptDiff = (aStats?.attemptsCount || 0) - (bStats?.attemptsCount || 0)

      if (attemptDiff !== 0) {
        return attemptDiff
      }

      const aLast = aStats?.lastAnsweredAt || ''
      const bLast = bStats?.lastAnsweredAt || ''
      if (aLast !== bLast) {
        return aLast.localeCompare(bLast)
      }

      return compareNaturalOrder(a, b)
    })
  }

  if (filters.status === 'answered') {
    return [...filtered].sort((a, b) => {
      const aLast = statsByQuestion.get(a.id)?.lastAnsweredAt || ''
      const bLast = statsByQuestion.get(b.id)?.lastAnsweredAt || ''

      if (aLast === bLast) {
        return compareNaturalOrder(a, b)
      }

      return aLast.localeCompare(bLast)
    })
  }

  return [...filtered].sort(compareNaturalOrder)
}
