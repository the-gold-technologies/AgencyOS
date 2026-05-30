// scripts/create-admin.mjs
// Run: node scripts/create-admin.mjs <email> <password>

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import ws from 'ws'

global.WebSocket = ws

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase URL or Service Role Key in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error('❌ Please provide an email and password.')
  console.log('Usage: node scripts/create-admin.mjs admin@agency.com yourpassword')
  process.exit(1)
}

async function createAdmin() {
  console.log(`Creating user ${email}...`)
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError) {
    console.error('❌ Failed to create user:', authError.message)
    process.exit(1)
  }

  console.log('✅ User created successfully in Auth.')
  const userId = authData.user.id

  console.log('Setting role to admin in profiles table...')
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId)

  if (profileError) {
    console.error('❌ Failed to set admin role:', profileError.message)
    process.exit(1)
  }

  console.log('✅ Admin setup complete! You can now log in.')
}

createAdmin()
