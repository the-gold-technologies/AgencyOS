import { createClient } from '@/lib/supabase/server'
import ActivityClient from '@/components/activity/activity-client'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Activity Logs | AgencyOS',
}

export default async function ActivityPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'team_member'

  const { data: activities } = await supabase
    .from('activity_logs')
    .select(`
      id,
      action,
      performed_at,
      metadata,
      performed_by:profiles!activity_logs_performed_by_fkey(full_name, avatar_url),
      task:tasks(title),
      project:projects(name)
    `)
    .order('performed_at', { ascending: false })
    .limit(100)

  return <ActivityClient initialActivities={(activities as any) || []} userRole={role} />
}
