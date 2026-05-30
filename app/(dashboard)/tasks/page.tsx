import { createClient } from '@/lib/supabase/server'
import TasksClient from '@/components/tasks/tasks-client'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id || '').single()
  const userRole = profile?.role || 'team_member'

  const { data: teamLeadProjects } = await supabase.from('projects').select('id').eq('team_lead_id', user?.id || '')
  const projectIds = teamLeadProjects?.map(p => p.id) || []

  let tasksQuery = supabase.from('tasks')
    .select('*, assignee:profiles!tasks_assigned_to_fkey(id,full_name), assigner:profiles!tasks_assigned_by_fkey(id,full_name), project:projects(id,name,project_code), files:task_files(*)')
    .order('created_at', { ascending: false })

  if (userRole === 'team_lead') {
    const projectFilter = projectIds.length > 0 ? `project_id.in.(${projectIds.join(',')}),` : ''
    tasksQuery = tasksQuery.or(`${projectFilter}assigned_by.eq.${user?.id || ''},assigned_to.eq.${user?.id || ''}`)
  } else if (userRole === 'team_member') {
    tasksQuery = tasksQuery.eq('assigned_to', user?.id || '')
  }

  const [{ data: tasks }, { data: projects }, { data: profiles }] = await Promise.all([
    tasksQuery,
    supabase.from('projects').select('id, name, project_code').in('status', ['pending','in_progress','on_hold']),
    supabase.from('profiles').select('id, full_name, role'),
  ])

  return <TasksClient initialTasks={tasks ?? []} projects={projects ?? []} profiles={profiles ?? []} userRole={userRole} />
}
