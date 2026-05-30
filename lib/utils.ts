import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isAfter } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy, hh:mm a')
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isOverdue(date: string | Date | null | undefined): boolean {
  if (!date) return false
  return isAfter(new Date(), new Date(date))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function calculateProfit(revenue: number, expenses: number): number {
  return revenue - expenses
}

export function calculateMargin(revenue: number, profit: number): number {
  if (revenue === 0) return 0
  return Math.round((profit / revenue) * 100)
}

export const SERVICE_TYPES = [
  'Website Development',
  'SEO',
  'Social Media Marketing',
  'PPC Management',
  'Content Marketing',
  'Email Marketing',
  'Graphic Design',
  'Video Production',
  'Other',
] as const

export const PROJECT_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-warning bg-warning-muted border-warning/30' },
  in_progress: { label: 'In Progress', color: 'text-info bg-info-muted border-info/30' },
  on_hold: { label: 'On Hold', color: 'text-text-secondary bg-border border-border-muted' },
  delivered: { label: 'Delivered', color: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30' },
  completed: { label: 'Completed', color: 'text-success bg-success-muted border-success/30' },
} as const

export const TASK_STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'text-text-secondary bg-border border-border-muted' },
  in_progress: { label: 'In Progress', color: 'text-info bg-info-muted border-info/30' },
  review: { label: 'Review', color: 'text-warning bg-warning-muted border-warning/30' },
  completed: { label: 'Completed', color: 'text-success bg-success-muted border-success/30' },
} as const

export const INVOICE_STATUS_CONFIG = {
  paid: { label: 'Paid', color: 'text-success bg-success-muted border-success/30' },
  partially_paid: { label: 'Partially Paid', color: 'text-warning bg-warning-muted border-warning/30' },
  pending: { label: 'Pending', color: 'text-text-secondary bg-border border-border-muted' },
  overdue: { label: 'Overdue', color: 'text-danger bg-danger-muted border-danger/30' },
} as const

export const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-text-secondary bg-border' },
  medium: { label: 'Medium', color: 'text-info bg-info-muted' },
  high: { label: 'High', color: 'text-warning bg-warning-muted' },
  urgent: { label: 'Urgent', color: 'text-danger bg-danger-muted' },
} as const
