-- Create project_files table
CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_files_select" ON public.project_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "project_files_insert" ON public.project_files FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "project_files_delete" ON public.project_files FOR DELETE TO authenticated USING (get_my_role() IN ('admin','team_lead'));
