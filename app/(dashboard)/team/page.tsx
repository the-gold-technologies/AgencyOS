import { createClient } from '@/lib/supabase/server'
import TeamClient from '@/components/team/team-client'
import { redirect } from 'next/navigation'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const userRole = profile?.role || 'team_member'

  if (!['admin', 'team_lead'].includes(userRole)) {
    return redirect('/') // Restrict access to Team Members and Sales Executives
  }

  const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })

  return <TeamClient initialProfiles={profiles ?? []} userRole={userRole} />
}
