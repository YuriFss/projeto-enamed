import type { Question } from './types'

type ReviewTab = 'erradas' | 'marcadas' | 'todas'

export interface ReviewAttemptRecord {
  id: string
  question_id: string
  selected_answer: string | null
  is_correct: boolean
  created_at: string
  time_spent_seconds: number
  question: Question | null
}

export interface ReviewBookmarkRecord {
  id: string
  question_id: string
  created_at: string
  question: Question | null
}

export interface ReviewQueueItem {
  id: string
  question: Question | null
  selected_answer: string | null
  is_correct: boolean | null
  created_at: string
  priority: 'alta' | 'media' | 'baixa'
  priorityScore: number
  priorityBadges: string[]
  reason: string
}

interface ReviewQueueOptions {
  tab: ReviewTab
  attempts: ReviewAttemptRecord[]
  bookmarks: ReviewBookmarkRecord[]
  specialtyId?: string
  now?: Date
}

interface AttemptGroup {
  questionId: string
  latestAttempt: ReviewAttemptRecord
  attempts: ReviewAttemptRecord[]
  bookmark: ReviewBookmarkRecord | null
}

function getDaysSince(date: string, now: Date) {
  const diff = now.getTime() - new Date(date).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function getPriorityLabel(score: number) {
  if (score >= 70) return 'alta' as const
  if (score >= 40) return 'media' as const
  return 'baixa' as const
}

function buildPriority(group: AttemptGroup, tab: ReviewTab, now: Date) {
  const attemptsCount = group.attempts.length
  const correctCount = group.attempts.filter((attempt) => attempt.is_correct).length
  const incorrectCount = attemptsCount - correctCount
  const daysSinceLastAttempt = getDaysSince(group.latestAttempt.created_at, now)
  const badges: string[] = []
  let score = 0

  if (!group.latestAttempt.is_correct) {
    score += 45
    badges.push('Erro recente')
  }

  if (incorrectCount >= 2) {
    score += 18
    badges.push('Erros recorrentes')
  }

  if (attemptsCount >= 3 && correctCount / attemptsCount < 0.5) {
    score += 12
    badges.push('Baixa estabilidade')
  }

  if (daysSinceLastAttempt >= 10) {
    score += 14
    badges.push(`Sem revisar ha ${daysSinceLastAttempt} dias`)
  } else if (daysSinceLastAttempt >= 5) {
    score += 8
    badges.push('Revisao esfriando')
  }

  if (group.bookmark) {
    score += 10
    badges.push('Marcada manualmente')
  }

  if (tab === 'marcadas' && badges.length === 0) {
    score += 20
    badges.push('Marcada para revisao')
  }

  return {
    score,
    badges,
    priority: getPriorityLabel(score),
    reason: buildReason({
      tab,
      latestAttempt: group.latestAttempt,
      bookmark: group.bookmark,
      incorrectCount,
      daysSinceLastAttempt,
    }),
  }
}

function buildReason(args: {
  tab: ReviewTab
  latestAttempt: ReviewAttemptRecord
  bookmark: ReviewBookmarkRecord | null
  incorrectCount: number
  daysSinceLastAttempt: number
}) {
  const { tab, latestAttempt, bookmark, incorrectCount, daysSinceLastAttempt } = args

  if (tab === 'marcadas' && bookmark) {
    return incorrectCount > 0
      ? 'Marcada e com historico de erro para retomar com prioridade.'
      : 'Marcada manualmente para voltar ao ponto com mais calma.'
  }

  if (!latestAttempt.is_correct) {
    if (incorrectCount >= 2) {
      return 'Questao com erro recorrente e risco de repeticao.'
    }

    return daysSinceLastAttempt >= 7
      ? 'Erro antigo pedindo recuperacao antes de esfriar ainda mais.'
      : 'Erro recente pronto para correcao imediata.'
  }

  return daysSinceLastAttempt >= 7
    ? 'Questao respondida ha mais tempo, boa candidata para reforco.'
    : 'Questao respondida recentemente para medir estabilidade.'
}

function groupAttemptsByQuestion(
  attempts: ReviewAttemptRecord[],
  bookmarksByQuestion: Map<string, ReviewBookmarkRecord>
) {
  const grouped = new Map<string, AttemptGroup>()

  attempts.forEach((attempt) => {
    const existing = grouped.get(attempt.question_id)

    if (existing) {
      existing.attempts.push(attempt)
      return
    }

    grouped.set(attempt.question_id, {
      questionId: attempt.question_id,
      latestAttempt: attempt,
      attempts: [attempt],
      bookmark: bookmarksByQuestion.get(attempt.question_id) || null,
    })
  })

  return grouped
}

export function buildReviewQueue(options: ReviewQueueOptions): ReviewQueueItem[] {
  const { tab, attempts, bookmarks, specialtyId, now = new Date() } = options
  const filteredAttempts = attempts.filter((attempt) => {
    if (!attempt.question) {
      return false
    }

    if (specialtyId && attempt.question.specialty_id !== specialtyId) {
      return false
    }

    return true
  })
  const filteredBookmarks = bookmarks.filter((bookmark) => {
    if (!bookmark.question) {
      return false
    }

    if (specialtyId && bookmark.question.specialty_id !== specialtyId) {
      return false
    }

    return true
  })
  const bookmarksByQuestion = new Map(
    filteredBookmarks.map((bookmark) => [bookmark.question_id, bookmark] as const)
  )
  const groupedAttempts = groupAttemptsByQuestion(filteredAttempts, bookmarksByQuestion)

  if (tab === 'marcadas') {
    return filteredBookmarks
      .map((bookmark) => {
        const group = groupedAttempts.get(bookmark.question_id)

        if (group) {
          const priority = buildPriority(group, tab, now)
          return {
            id: bookmark.id,
            question: bookmark.question,
            selected_answer: group.latestAttempt.selected_answer,
            is_correct: group.latestAttempt.is_correct,
            created_at: bookmark.created_at,
            priority: priority.priority,
            priorityScore: priority.score,
            priorityBadges: priority.badges,
            reason: priority.reason,
          }
        }

        return {
          id: bookmark.id,
          question: bookmark.question,
          selected_answer: null,
          is_correct: null,
          created_at: bookmark.created_at,
          priority: 'media' as const,
          priorityScore: 20,
          priorityBadges: ['Marcada manualmente'],
          reason: 'Marcada manualmente para voltar ao ponto com mais calma.',
        }
      })
      .sort((a, b) => {
        if (a.priorityScore === b.priorityScore) {
          return b.created_at.localeCompare(a.created_at)
        }

        return b.priorityScore - a.priorityScore
      })
  }

  const candidates = [...groupedAttempts.values()].filter((group) => {
    if (tab === 'erradas') {
      return group.latestAttempt.is_correct === false
    }

    return true
  })

  return candidates
    .map((group) => {
      const priority = buildPriority(group, tab, now)
      return {
        id: group.latestAttempt.id,
        question: group.latestAttempt.question,
        selected_answer: group.latestAttempt.selected_answer,
        is_correct: group.latestAttempt.is_correct,
        created_at: group.latestAttempt.created_at,
        priority: priority.priority,
        priorityScore: priority.score,
        priorityBadges: priority.badges,
        reason: priority.reason,
      }
    })
    .sort((a, b) => {
      if (a.priorityScore === b.priorityScore) {
        return b.created_at.localeCompare(a.created_at)
      }

      return b.priorityScore - a.priorityScore
    })
}
