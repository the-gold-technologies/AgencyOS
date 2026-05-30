import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  action?: React.ReactNode
  padding?: boolean
}

export function Card({ children, className, title, action, padding = true }: CardProps) {
  return (
    <div className={cn('rounded-xl bg-bg-secondary border border-border', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          {title && (
            <h3 className="text-sm font-semibold text-text">{title}</h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={cn(padding && 'p-5')}>{children}</div>
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl bg-bg-secondary border border-border p-5 animate-pulse', className)}>
      <div className="h-3 bg-bg-tertiary rounded w-1/3 mb-3" />
      <div className="h-8 bg-bg-tertiary rounded w-1/2 mb-2" />
      <div className="h-3 bg-bg-tertiary rounded w-1/4" />
    </div>
  )
}
