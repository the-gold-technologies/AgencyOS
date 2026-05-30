import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  iconColor?: string
  className?: string
}

export default function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'bg-primary/10 text-primary',
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-bg-secondary border border-border p-5',
        'hover:border-border-muted transition-all duration-200 group',
        className
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconColor)}>
            <Icon size={14} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-text tracking-tight mb-3">
        {value}
      </div>

      {/* Change badge */}
      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
              isPositive
                ? 'bg-success-muted text-success'
                : 'bg-danger-muted text-danger'
            )}
          >
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(change)}%
          </span>
          {changeLabel && (
            <span className="text-xs text-text-muted">{changeLabel}</span>
          )}
        </div>
      )}

      {/* Decorative glow */}
      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-0 group-hover:opacity-5 bg-primary transition-opacity duration-300 blur-xl" />
    </div>
  )
}
