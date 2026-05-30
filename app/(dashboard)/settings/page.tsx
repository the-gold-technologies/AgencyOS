import { createClient } from '@/lib/supabase/server'
import SettingsClient from '@/components/settings/settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profiles } = await supabase.from('profiles').select('*').order('full_name')
  const { data: currentProfile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  return <SettingsClient profiles={profiles ?? []} currentProfile={currentProfile} />
}
