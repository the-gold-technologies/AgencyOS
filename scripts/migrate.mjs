// scripts/migrate.mjs
// Run: node scripts/migrate.mjs
// Runs the full AgencyOS schema against your Supabase database

import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

// Load .env.local
config({ path: '.env.local' })

const { Client } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DIRECT_URL = process.env.DIRECT_URL

if (!DIRECT_URL) {
  console.error('❌  DIRECT_URL is not set in .env.local')
  process.exit(1)
}

const schemaPath = join(__dirname, '../supabase/schema.sql')
const sql = readFileSync(schemaPath, 'utf8')

console.log('🔗  Connecting to Supabase...')
console.log(`   URL: ${DIRECT_URL.replace(/:([^@]+)@/, ':****@')}`)

const client = new Client({ connectionString: DIRECT_URL, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  console.log('✅  Connected!\n')

  console.log('🚀  Running migration...')
  await client.query(sql)

  console.log('\n✅  Migration completed successfully!')
  console.log('\nTables created:')
  const { rows } = await client.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename
  `)
  rows.forEach(r => console.log(`   ✓ ${r.tablename}`))

} catch (err) {
  console.error('\n❌  Migration failed:')
  console.error(err.message)
  if (err.hint) console.error('Hint:', err.hint)
  process.exit(1)
} finally {
  await client.end()
}
