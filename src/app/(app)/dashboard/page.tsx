import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/get-user'
import { DashboardContent } from '@/components/dashboard-content'

export default async function DashboardPage() {
  const user = await getUser()
  const supabase = await createClient()

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
