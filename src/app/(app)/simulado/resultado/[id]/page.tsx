import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/get-user'
import { SimulationResult } from '@/components/simulation-result'

export default async function ResultadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('simulation_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!session || session.status !== 'completed') {
    notFound()
  }

  const { data: sessionQuestions } = await supabase
    .from('session_questions')
    .select('*, question:questions(*, specialty:specialties(*), exam:exams(*))')
    .eq('session_id', id)
    .order('position')

  return (
    <SimulationResult
      session={session}
      sessionQuestions={sessionQuestions || []}
    />
  )
}
