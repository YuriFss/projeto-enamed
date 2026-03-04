import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/components/dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: stats },
    { data: specialtyStats },
    { data: weeklyAccuracy },
  ] = await Promise.all([
    supabase.rpc('get_dashboard_stats', { p_user_id: user!.id }),
    supabase.rpc('get_specialty_stats', { p_user_id: user!.id }),
    supabase.rpc('get_weekly_accuracy', { p_user_id: user!.id }),
  ])

  return (
    <DashboardContent
      stats={stats || {
        total_answered: 0,
        total_correct: 0,
        accuracy: 0,
        total_time_seconds: 0,
        study_streak: 0,
        total_sessions: 0,
      }}
      specialtyStats={specialtyStats || []}
      weeklyAccuracy={weeklyAccuracy || []}
    />
  )
}
