import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SimulationActive } from '@/components/simulation-active'

export default async function SimulacaoActivaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: session } = await supabase
    .from('simulation_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!session) {
    notFound()
  }

  if (session.status === 'completed') {
    redirect(`/simulado/resultado/${id}`)
  }

  const { data: sessionQuestions } = await supabase
    .from('session_questions')
    .select('*, question:questions(*, exam:exams(*), specialty:specialties(*))')
    .eq('session_id', id)
    .order('position')

  return (
    <SimulationActive
      session={session}
      sessionQuestions={sessionQuestions || []}
      userId={user!.id}
    />
  )
}
