'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'
import { revalidatePath } from 'next/cache'

export async function addTeamMember(data: {
  full_name: string
  email: string
  password?: string
  role: UserRole
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Ensure only admins or team_leads can add members
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  if (!profile || !['admin', 'team_lead'].includes(profile.role)) {
    return { error: 'Forbidden' }
  }

  // Team Leads can only add team members
  if (profile.role === 'team_lead' && data.role !== 'team_member') {
    return { error: 'Team Leads can only add Team Members' }
  }

  const adminClient = createAdminClient()

  // 1. Create the user in Auth
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password || 'Welcome@123',
    email_confirm: true,
  })

  if (authError) {
    return { error: authError.message }
  }

  const newUserId = authData.user.id

  // 2. Update the profile
  // Note: If you have a trigger that inserts a profile on signup, we might just need to update it.
  // We'll use upsert to be safe.
  const { error: profileError } = await adminClient.from('profiles').upsert({
    id: newUserId,
    full_name: data.full_name,
    role: data.role,
    updated_at: new Date().toISOString(),
  })

  if (profileError) {
    // Attempt rollback if profile fails
    await adminClient.auth.admin.deleteUser(newUserId)
    return { error: 'Failed to create profile' }
  }

  revalidatePath('/team')
  return { success: true }
}

export async function updateMemberRole(userId: string, newRole: UserRole) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  if (!profile || profile.role !== 'admin') {
    return { error: 'Only admins can update roles' }
  }

  const adminClient = createAdminClient()
  
  const { error } = await adminClient.from('profiles').update({
    role: newRole,
    updated_at: new Date().toISOString(),
  }).eq('id', userId)

  if (error) {
    return { error: 'Failed to update role' }
  }

  revalidatePath('/team')
  return { success: true }
}
