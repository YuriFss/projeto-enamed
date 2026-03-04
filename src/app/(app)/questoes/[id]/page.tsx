import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/get-user'
import { QuestionView } from '@/components/question-view'

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getUser()

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

  return (
    <QuestionView
      question={question}
      isBookmarked={!!bookmark}
      lastAttempt={lastAttempt}
      userId={user!.id}
    />
  )
}
