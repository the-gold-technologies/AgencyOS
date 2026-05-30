import { createClient } from '@/lib/supabase/server'
import RevenueClient from '@/components/finance/revenue-client'

export default async function RevenuePage() {
  const supabase = await createClient()
  const [{ data: invoices }, { data: projects }, { data: clients }] = await Promise.all([
    supabase.from('invoices').select('*, project:projects(id,name,project_code), client:clients(id,name)').order('created_at', { ascending: false }),
    supabase.from('projects').select('id, name, project_code'),
    supabase.from('clients').select('id, name'),
  ])

  return <RevenueClient initialInvoices={invoices ?? []} projects={projects ?? []} clients={clients ?? []} />
}
