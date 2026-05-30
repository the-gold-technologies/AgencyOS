import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover active:scale-95',
        secondary: 'bg-bg-tertiary text-text border border-border hover:border-border-muted hover:bg-bg-secondary active:scale-95',
        ghost: 'text-text-secondary hover:text-text hover:bg-bg-tertiary active:scale-95',
        danger: 'bg-danger text-white hover:bg-danger/90 active:scale-95',
        success: 'bg-success text-white hover:bg-success/90 active:scale-95',
        outline: 'border border-border text-text-secondary hover:text-text hover:border-border-muted hover:bg-bg-tertiary active:scale-95',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs h-7',
        md: 'px-4 py-2 text-sm h-9',
        lg: 'px-5 py-2.5 text-sm h-10',
        xl: 'px-6 py-3 text-base h-12',
        icon: 'w-9 h-9 p-0',
        'icon-sm': 'w-7 h-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}
