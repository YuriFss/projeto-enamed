import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/get-user'
import { getSpecialties } from '@/lib/queries'
import { buildReviewQueue } from '@/lib/review-ranking'
import { ReviewContent } from '@/components/review-content'

interface SearchParams {
  tab?: string
  specialty?: string
}

export default async function RevisaoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const tab = (params.tab || 'erradas') as 'erradas' | 'marcadas' | 'todas'
  const user = await getUser()
  const supabase = await createClient()

  const specialties = await getSpecialties()
  const attemptsQuery = supabase
    .from('question_attempts')
    .select('*, question:questions(*, specialty:specialties(*), exam:exams(*))')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
  const bookmarksQuery = supabase
    .from('bookmarks')
    .select('*, question:questions(*, specialty:specialties(*), exam:exams(*))')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
  const [{ data: attempts }, { data: bookmarks }] = await Promise.all([attemptsQuery, bookmarksQuery])
  const items = buildReviewQueue({
    tab,
    attempts:
      attempts?.map((attempt) => ({
        id: attempt.id,
        question_id: attempt.question_id,
        selected_answer: attempt.selected_answer,
        is_correct: attempt.is_correct,
        created_at: attempt.created_at,
        time_spent_seconds: attempt.time_spent_seconds,
        question: attempt.question,
      })) || [],
    bookmarks:
      bookmarks?.map((bookmark) => ({
        id: bookmark.id,
        question_id: bookmark.question_id,
        created_at: bookmark.created_at,
        question: bookmark.question,
      })) || [],
    specialtyId: params.specialty,
  })

  return (
    <ReviewContent
      tab={tab}
      items={items}
      specialties={specialties}
      currentSpecialty={params.specialty}
    />
  )
}
