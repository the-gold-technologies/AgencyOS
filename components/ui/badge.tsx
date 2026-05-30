import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'
}

const VARIANTS = {
  default: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success-muted text-success border-success/20',
  warning: 'bg-warning-muted text-warning border-warning/20',
  danger: 'bg-danger-muted text-danger border-danger/20',
  info: 'bg-info-muted text-info border-info/20',
  muted: 'bg-border text-text-secondary border-border-muted',
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

interface StatusDotProps {
  variant?: BadgeProps['variant']
}

export function StatusDot({ variant = 'default' }: StatusDotProps) {
  const DOT_COLORS = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    muted: 'bg-text-muted',
  }
  return (
    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_COLORS[variant])} />
  )
}
