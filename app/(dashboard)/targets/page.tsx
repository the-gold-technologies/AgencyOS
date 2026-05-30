import { createClient } from '@/lib/supabase/server'
import TargetsClient from '@/components/targets/targets-client'

export default async function TargetsPage() {
  const supabase = await createClient()
  const now = new Date()
  const [{ data: targets }, { data: closures }, { data: profiles }] = await Promise.all([
    supabase.from('sales_targets').select('*').eq('year', now.getFullYear()).order('month'),
    supabase.from('sales_closures').select('*, closer:profiles(full_name), client:clients(name)').order('closed_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, role').in('role', ['admin', 'sales_executive']),
  ])

  return <TargetsClient initialTargets={targets ?? []} initialClosures={closures ?? []} profiles={profiles ?? []} />
}
