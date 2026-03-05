import { notFound } from 'next/navigation'
import { buildQuestionHistorySummary } from '@/lib/question-progress'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/get-user'
import {
  buildQuestionBrowserQueryString,
  getNextUnansweredQuestionId,
  getQuestionFlowContext,
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
  const isReviewMode = resolvedSearchParams.source === 'review'
  const isSequenceMode = resolvedSearchParams.view === 'sequence' && !isReviewMode
  const reviewParams = new URLSearchParams()

  if (resolvedSearchParams.tab) {
    reviewParams.set('tab', resolvedSearchParams.tab)
  }

  if (resolvedSearchParams.specialty) {
    reviewParams.set('specialty', resolvedSearchParams.specialty)
  }

  const backHref = isReviewMode
    ? reviewParams.toString()
      ? `/revisao?${reviewParams.toString()}`
      : '/revisao'
    : questionQueryString
      ? `/questoes?${questionQueryString}`
      : '/questoes'

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
  const { data: attempts } = await supabase
    .from('question_attempts')
    .select('*')
    .eq('question_id', id)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
  const lastAttempt = attempts?.[0] || null
  const historySummary = buildQuestionHistorySummary(attempts || [])

  const flowContext = isReviewMode
    ? null
    : await getQuestionFlowContext({
        userId: user!.id,
        currentQuestionId: id,
        filters,
      })
  const fallbackNextQuestionId =
    !flowContext && !isReviewMode
      ? await getNextUnansweredQuestionId({
          userId: user!.id,
          currentQuestionId: id,
          filters,
        })
      : null
  const previousQuestionHref =
    isSequenceMode && flowContext?.previousQuestionId
      ? questionQueryString
        ? `/questoes/${flowContext.previousQuestionId}?${questionQueryString}`
        : `/questoes/${flowContext.previousQuestionId}`
      : null
  const nextQuestionId = isSequenceMode
    ? flowContext?.nextQuestionId || null
    : flowContext?.nextUnansweredQuestionId || fallbackNextQuestionId
  const nextQuestionHref = isReviewMode
    ? null
    : nextQuestionId
      ? questionQueryString
        ? `/questoes/${nextQuestionId}?${questionQueryString}`
        : `/questoes/${nextQuestionId}`
      : null
  const skipQuestionHref =
    isSequenceMode && flowContext?.nextUnansweredQuestionId
      ? questionQueryString
        ? `/questoes/${flowContext.nextUnansweredQuestionId}?${questionQueryString}`
        : `/questoes/${flowContext.nextUnansweredQuestionId}`
      : null
  const contextTitle = isReviewMode ? 'Refazer em modo revisao' : 'Responder no fluxo atual'
  const contextDescription = isReviewMode
    ? 'A questao foi aberta a partir da revisao e permanece sem spoiler ate a nova tentativa.'
    : isSequenceMode
      ? 'Voce entrou no modo sequencia. Navegue com anterior, proxima e pular sem perder o recorte ativo.'
      : nextQuestionHref
        ? 'Responda mantendo o recorte atual. Ao finalizar, voce pode seguir para a proxima nao respondida.'
        : 'Esta questao esta dentro do contexto filtrado atual. Ajuste o recorte no banco quando quiser.'
  const backLabel = isReviewMode ? 'Voltar para revisao' : 'Voltar ao banco'
  const nextLabel = isSequenceMode ? 'Proxima da fila' : 'Proxima nao respondida'

  return (
    <QuestionView
      question={question}
      isBookmarked={!!bookmark}
      lastAttempt={lastAttempt}
      historySummary={historySummary}
      userId={user!.id}
      backHref={backHref}
      previousQuestionHref={previousQuestionHref}
      nextQuestionHref={nextQuestionHref}
      skipQuestionHref={skipQuestionHref}
      hidePreviousAttempt={isReviewMode}
      sequenceContext={
        isSequenceMode && flowContext
          ? {
              currentPosition: flowContext.currentIndex + 1,
              totalCount: flowContext.totalCount,
              answeredCount: flowContext.answeredCount,
              unansweredCount: flowContext.unansweredCount,
            }
          : null
      }
      contextTitle={contextTitle}
      contextDescription={contextDescription}
      backLabel={backLabel}
      nextLabel={nextLabel}
    />
  )
}
