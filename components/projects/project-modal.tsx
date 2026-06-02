'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, UploadCloud, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { Project, Client, Profile } from '@/types'
import { SERVICE_TYPES } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  client_id: z.string().optional(),
  service_type: z.string().min(1, 'Required'),
  quoted_price: z.coerce.number().min(0),
  start_date: z.string().optional(),
  expected_completion: z.string().optional(),
  team_lead_id: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'on_hold', 'delivered', 'completed']),
})

type FormInput = z.input<typeof schema>
type FormData = z.output<typeof schema>

interface ProjectModalProps {
  open: boolean
  onClose: () => void
  project: Project | null
  clients: Pick<Client, 'id' | 'name' | 'company_name'>[]
  profiles: Pick<Profile, 'id' | 'full_name' | 'role'>[]
  userRole?: string
}

export default function ProjectModal({ open, onClose, project, clients, profiles, userRole }: ProjectModalProps) {
  const supabase = createClient()
  const qc = useQueryClient()
  const isEdit = !!project
  
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const teamLeads = profiles.filter(p => ['admin', 'team_lead'].includes(p.role))

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInput, undefined, FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'pending', quoted_price: 0 },
  })

  useEffect(() => {
    if (open) {
      setFile(null)
      reset(project ? {
        name: project.name,
        client_id: project.client_id ?? '',
        service_type: project.service_type,
        quoted_price: project.quoted_price,
        start_date: project.start_date ?? '',
        expected_completion: project.expected_completion ?? '',
        team_lead_id: project.team_lead_id ?? '',
        status: project.status,
      } : { status: 'pending', quoted_price: 0 })
    }
  }, [open, project, reset])

  const onSubmit = async (data: FormData) => {
    const payload = {
      name: data.name,
      client_id: data.client_id || null,
      service_type: data.service_type,
      quoted_price: data.quoted_price,
      start_date: data.start_date || null,
      expected_completion: data.expected_completion || null,
      team_lead_id: data.team_lead_id || null,
      status: data.status,
    } as any

    setIsUploading(true)
    try {
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        const filePath = `deliverables/${fileName}`

        const { error: uploadError } = await supabase.storage.from('agencyos_files').upload(filePath, file)
        
        if (uploadError) {
          toast.error('Failed to upload deliverable file')
          console.error(uploadError)
        } else {
          const { data: publicUrlData } = supabase.storage.from('agencyos_files').getPublicUrl(filePath)
          payload.deliverable_url = publicUrlData.publicUrl
        }
      }

      if (isEdit) {
        if (data.status === 'completed' && !project?.completion_date) {
          payload.completion_date = new Date().toISOString()
        }
        const { error } = await supabase.from('projects').update(payload).eq('id', project.id)
        if (error) { toast.error('Failed to update project'); return }
        toast.success('Project updated')
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('projects').insert({ ...payload, created_by: user?.id })
        if (error) { toast.error('Failed to create project'); return }
        toast.success('Project created')
      }

      qc.invalidateQueries({ queryKey: ['projects'] })
      onClose()
    } finally {
      setIsUploading(false)
    }
  }

  const inputClass = "w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 !m-0" />
          <motion.div
            initial={{ opacity: 0, x: 'calc(100% + 1rem)' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 'calc(100% + 1rem)' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-4 top-4 bottom-4 w-[calc(100%-2rem)] max-w-lg bg-bg-secondary border border-border rounded-2xl z-50 flex flex-col shadow-2xl overflow-hidden !m-0"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-text">{isEdit ? 'Edit Project' : 'New Project'}</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-tertiary transition-all">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Project Name *</label>
                <input {...register('name')} placeholder="e.g. Company Website Redesign" className={inputClass} />
                {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Client</label>
                  <select {...register('client_id')} className={inputClass}>
                    <option value="">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company_name ? `(${c.company_name})` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Service Type *</label>
                  <select {...register('service_type')} className={inputClass}>
                    <option value="">Select service</option>
                    {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.service_type && <p className="text-xs text-danger mt-1">{errors.service_type.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Quoted Price (₹)</label>
                  <input {...register('quoted_price')} type="number" min="0" placeholder="50000" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Status</label>
                  <select {...register('status')} className={inputClass}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Start Date</label>
                  <input {...register('start_date')} type="date" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Expected Completion</label>
                  <input {...register('expected_completion')} type="date" className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Assign Team Lead</label>
                <select {...register('team_lead_id')} className={inputClass}>
                  <option value="">Select team lead</option>
                  {teamLeads.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>

              {/* File Upload for Deliverables */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Final Deliverable (Optional)</label>
                
                {project?.deliverable_url && !file && (
                  <div className="mb-3 p-3 bg-bg border border-border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={16} className="text-primary shrink-0" />
                      <span className="text-sm text-text truncate">Existing Deliverable File</span>
                    </div>
                    <a href={project.deliverable_url} target="_blank" className="text-xs font-medium text-primary hover:underline whitespace-nowrap">View</a>
                  </div>
                )}

                <div className="relative border border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors bg-bg/50">
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setFile(e.target.files[0])
                      }
                    }}
                  />
                  <div className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform text-text-muted">
                    <UploadCloud size={18} />
                  </div>
                  <p className="text-sm font-medium text-text">
                    {file ? file.name : (project?.deliverable_url ? 'Replace deliverable file' : 'Click or drag file to upload')}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">Upload final project files/zip</p>
                </div>
              </div>
            </form>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="secondary" onClick={onClose} disabled={isSubmitting || isUploading}>Cancel</Button>
              <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting || isUploading}>
                {isEdit ? 'Save Changes' : 'Create Project'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
