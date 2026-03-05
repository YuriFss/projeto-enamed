import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/get-user'
import {
  buildQuestionBrowserQueryString,
  getNextUnansweredQuestionId,
  sanitizeQuestionBrowserFilters,
} from '@/lib/question-browser'
import { QuestionView } from '@/components/question-view'

interface SearchParams {
  [key: string]: string | undefined
}

export default async function QuestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()
  const user = await getUser()
  const filters = sanitizeQuestionBrowserFilters(resolvedSearchParams)
  const questionQueryString = buildQuestionBrowserQueryString(resolvedSearchParams)
  const backHref = questionQueryString ? `/questoes?${questionQueryString}` : '/questoes'

  const { data: question } = await supabase
    .from('questions')
    .select('*, exam:exams(*), specialty:specialties(*), topic:topics(*)')
    .eq('id', id)
    .single()

  if (!question) {
    notFound()
  }

  // Check if bookmarked
  const { data: bookmark } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('question_id', id)
    .eq('user_id', user!.id)
    .maybeSingle()

  // Get last attempt
  const { data: lastAttempt } = await supabase
    .from('question_attempts')
    .select('*')
    .eq('question_id', id)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextQuestionId = await getNextUnansweredQuestionId({
    userId: user!.id,
    currentQuestionId: id,
    filters,
  })
  const nextQuestionHref = nextQuestionId
    ? questionQueryString
      ? `/questoes/${nextQuestionId}?${questionQueryString}`
      : `/questoes/${nextQuestionId}`
    : null

  return (
    <QuestionView
      question={question}
      isBookmarked={!!bookmark}
      lastAttempt={lastAttempt}
      userId={user!.id}
      backHref={backHref}
      nextQuestionHref={nextQuestionHref}
    />
  )
}
