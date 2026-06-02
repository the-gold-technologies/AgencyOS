'use client'

import { useState } from 'react'
import { Calendar, ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export type DateFilterValue = 'all' | 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'custom'

interface DateFilterDropdownProps {
  value: DateFilterValue
  onChange: (value: DateFilterValue) => void
  onCustomDateChange?: (start: Date | null, end: Date | null) => void
}

const FILTER_OPTIONS: { value: DateFilterValue; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
]

export default function DateFilterDropdown({ value, onChange, onCustomDateChange }: DateFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Custom date state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleSelect = (val: DateFilterValue) => {
    onChange(val)
    if (val !== 'custom') {
      setIsOpen(false)
    }
  }

  const handleCustomApply = () => {
    if (onCustomDateChange) {
      onCustomDateChange(
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      )
    }
    setIsOpen(false)
  }

  const selectedLabel = FILTER_OPTIONS.find(o => o.value === value)?.label || 'All Time'

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 flex items-center gap-2 bg-bg-secondary border border-border rounded-lg text-sm font-medium text-text-secondary hover:text-text transition-colors shadow-sm"
      >
        <Calendar size={15} />
        {selectedLabel}
        <ChevronDown size={14} className={cn("transition-transform", isOpen ? "rotate-180" : "")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-56 bg-bg-secondary border border-border rounded-xl shadow-card z-50 overflow-hidden py-1"
            >
              {FILTER_OPTIONS.map(opt => (
                <button 
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)} 
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm font-medium flex items-center justify-between transition-colors",
                    value === opt.value ? "bg-primary/10 text-primary" : "text-text-secondary hover:bg-bg-tertiary hover:text-text"
                  )}
                >
                  {opt.label}
                  {value === opt.value && <Check size={14} />}
                </button>
              ))}

              {/* Custom Date Picker expansion */}
              {value === 'custom' && (
                <div className="px-4 py-3 border-t border-border mt-1 bg-bg/50 space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-bg border border-border rounded flex-1 focus:outline-none focus:border-primary/50 text-text" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">End Date</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-bg border border-border rounded flex-1 focus:outline-none focus:border-primary/50 text-text" 
                    />
                  </div>
                  <button 
                    onClick={handleCustomApply}
                    className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-1.5 rounded transition-colors"
                  >
                    Apply Range
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
