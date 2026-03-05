import { createClient } from '@/lib/supabase/server'
import { getExams } from '@/lib/queries'
import { Exam, Question } from '@/lib/types'

export type QuestionStatusFilter = 'answered' | 'unanswered'

export interface QuestionBrowserFilters {
  year?: string
  type?: string
  specialty?: string
  difficulty?: string
  status?: QuestionStatusFilter
}

interface CandidateQuestion {
  id: string
  exam_id: string
  number: number
}

interface AttemptSummary {
  question_id: string
  created_at: string
}

interface QuestionBankData {
  questions: Question[]
  totalCount: number
  totalPages: number
  currentPage: number
  years: number[]
}

const ALLOWED_STATUSES = new Set<QuestionStatusFilter>(['answered', 'unanswered'])

export function sanitizeQuestionBrowserFilters(
  params: Record<string, string | undefined>
): QuestionBrowserFilters {
  const status = ALLOWED_STATUSES.has(params.status as QuestionStatusFilter)
    ? (params.status as QuestionStatusFilter)
    : undefined

  return {
    year: params.year || undefined,
    type: params.type || undefined,
    specialty: params.specialty || undefined,
    difficulty: params.difficulty || undefined,
    status,
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
    .select('id, exam_id, number')
    .order('number')
    .order('id')

  if (examIds.length > 0) {
    query = query.in('exam_id', examIds)
  }

  if (filters.specialty) {
    query = query.eq('specialty_id', filters.specialty)
  }

  if (filters.difficulty) {
    query = query.eq('difficulty', filters.difficulty)
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

async function getLatestAttemptsByQuestion(userId: string, questionIds: string[]) {
  if (questionIds.length === 0) {
    return new Map<string, string>()
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('question_attempts')
    .select('question_id, created_at')
    .eq('user_id', userId)
    .in('question_id', questionIds)
    .order('created_at', { ascending: false })

  const latestAttempts = new Map<string, string>()

  ;((data as AttemptSummary[] | null) || []).forEach((attempt) => {
    if (!latestAttempts.has(attempt.question_id)) {
      latestAttempts.set(attempt.question_id, attempt.created_at)
    }
  })

  return latestAttempts
}

function applyStatusFilterAndSort(
  candidates: CandidateQuestion[],
  latestAttemptByQuestion: Map<string, string>,
  filters: QuestionBrowserFilters
) {
  let filtered = candidates

  if (filters.status === 'answered') {
    filtered = filtered.filter((candidate) => latestAttemptByQuestion.has(candidate.id))
    filtered = [...filtered].sort((a, b) => {
      const aDate = latestAttemptByQuestion.get(a.id) || ''
      const bDate = latestAttemptByQuestion.get(b.id) || ''

      if (aDate === bDate) {
        if (a.number === b.number) {
          return a.id.localeCompare(b.id)
        }

        return a.number - b.number
      }

      return aDate.localeCompare(bDate)
    })
  }

  if (filters.status === 'unanswered') {
    filtered = filtered.filter((candidate) => !latestAttemptByQuestion.has(candidate.id))
  }

  return filtered
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
  const latestAttemptByQuestion = await getLatestAttemptsByQuestion(
    userId,
    candidates.map((candidate) => candidate.id)
  )

  const filteredCandidates = applyStatusFilterAndSort(candidates, latestAttemptByQuestion, filters)
  const totalCount = filteredCandidates.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const from = (safePage - 1) * pageSize
  const to = from + pageSize
  const pagedCandidates = filteredCandidates.slice(from, to)
  const questions = await getQuestionsByIds(pagedCandidates.map((candidate) => candidate.id))

  questions.forEach((question) => {
    question.isAnswered = latestAttemptByQuestion.has(question.id)
    question.lastAnsweredAt = latestAttemptByQuestion.get(question.id) || null
  })

  return {
    questions,
    totalCount,
    totalPages,
    currentPage: safePage,
    years,
  }
}

export async function getNextUnansweredQuestionId(args: {
  userId: string
  currentQuestionId: string
  filters: QuestionBrowserFilters
}) {
  const { userId, currentQuestionId, filters } = args

  if (filters.status === 'answered') {
    return null
  }

  const { candidates } = await getCandidateQuestions(filters)

  if (candidates.length === 0) {
    return null
  }

  const latestAttemptByQuestion = await getLatestAttemptsByQuestion(
    userId,
    candidates.map((candidate) => candidate.id)
  )
  const orderedCandidates = applyStatusFilterAndSort(candidates, latestAttemptByQuestion, filters)
  const currentIndex = orderedCandidates.findIndex((candidate) => candidate.id === currentQuestionId)

  if (currentIndex === -1) {
    return null
  }

  for (let index = currentIndex + 1; index < orderedCandidates.length; index += 1) {
    const candidate = orderedCandidates[index]
    if (!latestAttemptByQuestion.has(candidate.id)) {
      return candidate.id
    }
  }

  return null
}
