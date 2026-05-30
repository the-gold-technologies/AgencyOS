import { createClient } from '@/lib/supabase/server'
import ExpensesClient from '@/components/finance/expenses-client'

export default async function ExpensesPage() {
  const supabase = await createClient()
  const [{ data: expenses }, { data: projects }] = await Promise.all([
    supabase.from('expenses').select('*, project:projects(id,name,project_code)').order('date', { ascending: false }),
    supabase.from('projects').select('id, name, project_code'),
  ])
  return <ExpensesClient initialExpenses={expenses ?? []} projects={projects ?? []} />
}
