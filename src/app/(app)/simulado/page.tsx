import { createClient } from '@/lib/supabase/server'
import { SimulationSetup } from '@/components/simulation-setup'

export default async function SimuladoPage() {
  const supabase = await createClient()

  const [{ data: exams }, { data: specialties }] = await Promise.all([
    supabase.from('exams').select('*').order('year', { ascending: false }),
    supabase.from('specialties').select('*').order('name'),
  ])

  const { data: { user } } = await supabase.auth.getUser()

  // Get in-progress session
  const { data: activeSession } = await supabase
    .from('simulation_sessions')
    .select('id')
    .eq('user_id', user!.id)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Simulado</h1>
      <SimulationSetup
        exams={exams || []}
        specialties={specialties || []}
        activeSessionId={activeSession?.id}
      />
    </div>
  )
}
