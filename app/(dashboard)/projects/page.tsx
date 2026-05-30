import { createClient } from '@/lib/supabase/server'
import ProjectsClient from '@/components/projects/projects-client'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id || '').single()
  const userRole = profile?.role || 'team_member'

  let projectsQuery = supabase.from('projects')
    .select('*, client:clients(id,name,company_name), team_lead:profiles!projects_team_lead_id_fkey(id,full_name)')
    .order('created_at', { ascending: false })

  if (userRole === 'team_lead') {
    projectsQuery = projectsQuery.eq('team_lead_id', user?.id || '')
  }

  const [{ data: projects }, { data: clients }, { data: profiles }] = await Promise.all([
    projectsQuery,
    supabase.from('clients').select('id, name, company_name'),
    supabase.from('profiles').select('id, full_name, role'),
  ])

  return <ProjectsClient initialProjects={projects ?? []} clients={clients ?? []} profiles={profiles ?? []} userRole={userRole} />
}
