import { createClient } from '@/lib/supabase/server'
import AnalyticsClient from '@/components/analytics/analytics-client'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const now = new Date()

  const [{ data: invoices }, { data: expenses }, { data: projects }, { data: tasks }] = await Promise.all([
    supabase.from('invoices').select('amount_received, final_billing, created_at, status'),
    supabase.from('expenses').select('amount, created_at'),
    supabase.from('projects').select('status, service_type, quoted_price, created_at'),
    supabase.from('tasks').select('status, created_at, completion_date, assigned_to'),
  ])

  // Build 12-month data
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' })
    const revenue = (invoices ?? []).filter(inv => {
      const id = new Date(inv.created_at)
      return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear()
    }).reduce((s, inv) => s + (inv.amount_received || 0), 0)
    const expense = (expenses ?? []).filter(exp => {
      const ed = new Date(exp.created_at)
      return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear()
    }).reduce((s, exp) => s + (exp.amount || 0), 0)
    return { month: label, revenue, expenses: expense, profit: revenue - expense }
  })

  // Service wise revenue
  const serviceRevenue = (projects ?? []).reduce((acc, p) => {
    if (!acc[p.service_type]) acc[p.service_type] = 0
    acc[p.service_type] += p.quoted_price || 0
    return acc
  }, {} as Record<string, number>)

  const serviceData = Object.entries(serviceRevenue).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  return <AnalyticsClient monthlyData={monthlyData} serviceData={serviceData} projects={projects ?? []} tasks={tasks ?? []} />
}
