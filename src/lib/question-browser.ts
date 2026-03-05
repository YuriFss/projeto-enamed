import { createClient } from '@/lib/supabase/server'
import { sortQuestionCandidates, type QuestionAttemptStats } from '@/lib/question-bank-utils'
import { buildQuestionFlowState, type QuestionFlowContext } from '@/lib/question-flow'
import { buildQuestionHistorySummary } from '@/lib/question-progress'
import { getExams } from '@/lib/queries'
import { Exam, Question, QuestionBankSort } from '@/lib/types'

export type QuestionStatusFilter = 'answered' | 'unanswered'

export interface QuestionBrowserFilters {
  year?: string
  type?: string
  specialty?: string
  topic?: string
  difficulty?: string
  status?: QuestionStatusFilter
  search?: string
  sort?: QuestionBankSort
}

interface CandidateQuestion {
  id: string
  exam_id: string
  number: number
  created_at: string
}

interface AttemptSummary {
  question_id: string
  created_at: string
}

interface AttemptRecord extends AttemptSummary {
  is_correct: boolean
  time_spent_seconds: number
}

interface QuestionBankData {
  questions: Question[]
  totalCount: number
  totalPages: number
  currentPage: number
  years: number[]
  answeredCount: number
  unansweredCount: number
  sequenceStartQuestionId: string | null
}

const ALLOWED_STATUSES = new Set<QuestionStatusFilter>(['answered', 'unanswered'])
const ALLOWED_SORTS = new Set<QuestionBankSort>(['recent', 'most_wrong', 'least_reviewed'])

export function sanitizeQuestionBrowserFilters(
  params: Record<string, string | undefined>
): QuestionBrowserFilters {
  const status = ALLOWED_STATUSES.has(params.status as QuestionStatusFilter)
    ? (params.status as QuestionStatusFilter)
    : undefined
  const sort = ALLOWED_SORTS.has(params.sort as QuestionBankSort)
    ? (params.sort as QuestionBankSort)
    : undefined

  return {
    year: params.year || undefined,
    type: params.type || undefined,
    specialty: params.specialty || undefined,
    topic: params.topic || undefined,
    difficulty: params.difficulty || undefined,
    status,
    search: params.search?.trim() || undefined,
    sort,
  }
}

export function buildQuestionBrowserQueryString(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value)
    }
  })

  return searchParams.toString()
}

function getFilteredExamIds(exams: Exam[], filters: QuestionBrowserFilters) {
  return exams
    .filter((exam) => {
      if (filters.year && exam.year !== Number(filters.year)) {
        return false
      }

      if (filters.type && exam.type !== filters.type) {
        return false
      }

      return true
    })
    .map((exam) => exam.id)
}

async function getCandidateQuestions(filters: QuestionBrowserFilters) {
  const supabase = await createClient()
  const exams = await getExams()

  const examIds = getFilteredExamIds(exams, filters)
  const hasExamFilter = Boolean(filters.year || filters.type)

  if (hasExamFilter && examIds.length === 0) {
    return { candidates: [] as CandidateQuestion[], years: getAvailableYears(exams) }
  }

  let query = supabase
    .from('questions')
    .select('id, exam_id, number, created_at')
    .order('number')
    .order('id')

  if (examIds.length > 0) {
    query = query.in('exam_id', examIds)
  }

  if (filters.specialty) {
    query = query.eq('specialty_id', filters.specialty)
  }

  if (filters.topic) {
    query = query.eq('topic_id', filters.topic)
  }

  if (filters.difficulty) {
    query = query.eq('difficulty', filters.difficulty)
  }

  if (filters.search) {
    query = query.ilike('statement', `%${filters.search}%`)
  }

  const { data } = await query

  return {
    candidates: (data as CandidateQuestion[] | null) || [],
    years: getAvailableYears(exams),
  }
}

function getAvailableYears(exams: Exam[]) {
  return [...new Set(exams.map((exam) => exam.year))].sort((a, b) => b - a)
}

function buildAttemptStatsByQuestion(
  attemptsByQuestion: Map<string, AttemptRecord[]>,
  questionIds: string[]
) {
  const stats = new Map<string, QuestionAttemptStats>()

  questionIds.forEach((questionId) => {
    const attempts = attemptsByQuestion.get(questionId) || []
    stats.set(questionId, {
      attemptsCount: attempts.length,
      wrongCount: attempts.filter((attempt) => !attempt.is_correct).length,
      lastAnsweredAt: attempts[0]?.created_at || null,
    })
  })

  return stats
}

async function getAttemptsForQuestionIds(userId: string, questionIds: string[]) {
  if (questionIds.length === 0) {
    return new Map<string, AttemptRecord[]>()
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('question_attempts')
    .select('question_id, created_at, is_correct, time_spent_seconds')
    .eq('user_id', userId)
    .in('question_id', questionIds)
    .order('created_at', { ascending: false })

  const attemptsByQuestion = new Map<string, AttemptRecord[]>()

  ;((data as AttemptRecord[] | null) || []).forEach((attempt) => {
    const existing = attemptsByQuestion.get(attempt.question_id)
    if (existing) {
      existing.push(attempt)
      return
    }

    attemptsByQuestion.set(attempt.question_id, [attempt])
  })

  return attemptsByQuestion
}

function applyStatusFilterAndSort(
  candidates: CandidateQuestion[],
  statsByQuestion: Map<string, QuestionAttemptStats>,
  filters: QuestionBrowserFilters
) {
  return sortQuestionCandidates(candidates, statsByQuestion, filters)
}

async function getQuestionsByIds(questionIds: string[]) {
  if (questionIds.length === 0) {
    return []
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('questions')
    .select('*, exam:exams(*), specialty:specialties(*)')
    .in('id', questionIds)

  const questionsById = new Map<string, Question>()
  ;((data as Question[] | null) || []).forEach((question) => {
    questionsById.set(question.id, question)
  })

  return questionIds
    .map((id) => questionsById.get(id))
    .filter((question): question is Question => Boolean(question))
}

export async function getQuestionBankData(args: {
  userId: string
  filters: QuestionBrowserFilters
  page: number
  pageSize: number
}): Promise<QuestionBankData> {
  const { userId, filters, page, pageSize } = args
  const { candidates, years } = await getCandidateQuestions(filters)
  const attemptsByQuestion = await getAttemptsForQuestionIds(
    userId,
    candidates.map((candidate) => candidate.id)
  )
  const statsByQuestion = buildAttemptStatsByQuestion(
    attemptsByQuestion,
    candidates.map((candidate) => candidate.id)
  )
  const latestAttemptByQuestion = new Map<string, string>()
  statsByQuestion.forEach((stats, questionId) => {
    if (stats.lastAnsweredAt) {
      latestAttemptByQuestion.set(questionId, stats.lastAnsweredAt)
    }
  })

  const filteredCandidates = applyStatusFilterAndSort(candidates, statsByQuestion, filters)
  const totalCount = filteredCandidates.length
  const answeredCount = filteredCandidates.filter((candidate) =>
    latestAttemptByQuestion.has(candidate.id)
  ).length
  const unansweredCount = totalCount - answeredCount
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const from = (safePage - 1) * pageSize
  const to = from + pageSize
  const pagedCandidates = filteredCandidates.slice(from, to)
  const questions = await getQuestionsByIds(pagedCandidates.map((candidate) => candidate.id))

  questions.forEach((question) => {
    question.isAnswered = latestAttemptByQuestion.has(question.id)
    question.lastAnsweredAt = latestAttemptByQuestion.get(question.id) || null
    question.history = buildQuestionHistorySummary(attemptsByQuestion.get(question.id) || [])
  })

  return {
    questions,
    totalCount,
    totalPages,
    currentPage: safePage,
    years,
    answeredCount,
    unansweredCount,
    sequenceStartQuestionId: filteredCandidates[0]?.id || null,
  }
}

export async function getQuestionFlowContext(args: {
  userId: string
  currentQuestionId: string
  filters: QuestionBrowserFilters
}): Promise<QuestionFlowContext | null> {
  const { userId, currentQuestionId, filters } = args
  const { candidates } = await getCandidateQuestions(filters)

  if (candidates.length === 0) {
    return null
  }

  const attemptsByQuestion = await getAttemptsForQuestionIds(
    userId,
    candidates.map((candidate) => candidate.id)
  )
  const statsByQuestion = buildAttemptStatsByQuestion(
    attemptsByQuestion,
    candidates.map((candidate) => candidate.id)
  )
  const latestAttemptByQuestion = new Map<string, string>()
  statsByQuestion.forEach((stats, questionId) => {
    if (stats.lastAnsweredAt) {
      latestAttemptByQuestion.set(questionId, stats.lastAnsweredAt)
    }
  })
  const orderedCandidates = applyStatusFilterAndSort(candidates, statsByQuestion, filters)
  return buildQuestionFlowState({
    orderedCandidates,
    latestAttemptByQuestion,
    currentQuestionId,
  })
}

export async function getNextUnansweredQuestionId(args: {
  userId: string
  currentQuestionId: string
  filters: QuestionBrowserFilters
}) {
  const flow = await getQuestionFlowContext(args)

  if (!flow || args.filters.status === 'answered') {
    return null
  }

  return flow.nextUnansweredQuestionId
}
