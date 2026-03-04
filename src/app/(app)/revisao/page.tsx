import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/get-user'
import { getSpecialties } from '@/lib/queries'
import { ReviewContent } from '@/components/review-content'

interface SearchParams {
  tab?: string
  specialty?: string
}

export default async function RevisaoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const tab = params.tab || 'erradas'
  const user = await getUser()
  const supabase = await createClient()

  const specialties = await getSpecialties()

  // Fetch attempts based on tab
  let attemptsQuery = supabase
    .from('question_attempts')
    .select('*, question:questions(*, specialty:specialties(*), exam:exams(*))')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  if (tab === 'erradas') {
    attemptsQuery = attemptsQuery.eq('is_correct', false)
  } else if (tab === 'marcadas') {
    // Get bookmarked questions instead
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('*, question:questions(*, specialty:specialties(*), exam:exams(*))')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    // Fetch specialties filter
    let filteredBookmarks = bookmarks || []
    if (params.specialty) {
      filteredBookmarks = filteredBookmarks.filter(
        (b) => b.question?.specialty_id === params.specialty
      )
    }

    return (
      <ReviewContent
        tab={tab}
        items={filteredBookmarks.map((b) => ({
          id: b.id,
          question: b.question,
          selected_answer: null,
          is_correct: null,
          created_at: b.created_at,
        }))}
        specialties={specialties}
        currentSpecialty={params.specialty}
      />
    )
  }

  if (params.specialty) {
    attemptsQuery = attemptsQuery.eq('question.specialty_id', params.specialty)
  }

  const { data: attempts } = await attemptsQuery

  // Filter by specialty (post-query since nested filter may not work)
  let filteredAttempts = attempts || []
  if (params.specialty) {
    filteredAttempts = filteredAttempts.filter(
      (a) => a.question?.specialty_id === params.specialty
    )
  }

  // Deduplicate — show only latest attempt per question
  const latestByQuestion = new Map<string, typeof filteredAttempts[0]>()
  filteredAttempts.forEach((a) => {
    if (!latestByQuestion.has(a.question_id)) {
      latestByQuestion.set(a.question_id, a)
    }
  })

  return (
    <ReviewContent
      tab={tab}
      items={Array.from(latestByQuestion.values()).map((a) => ({
        id: a.id,
        question: a.question,
        selected_answer: a.selected_answer,
        is_correct: a.is_correct,
        created_at: a.created_at,
      }))}
      specialties={specialties}
      currentSpecialty={params.specialty}
    />
  )
}
