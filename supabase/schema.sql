-- ============================================================
-- AgencyOS — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'team_member' CHECK (role IN ('admin', 'team_lead', 'team_member', 'sales_executive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
          COALESCE(NEW.raw_user_meta_data->>'role', 'team_member'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT,
  contact_person TEXT,
  mobile TEXT,
  email TEXT,
  address TEXT,
  gst_number TEXT,
  pan_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS project_id_seq START 1000;

CREATE TABLE public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_code TEXT UNIQUE DEFAULT ('PRJ-' || nextval('project_id_seq')::TEXT),
  name TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  quoted_price NUMERIC(12,2) DEFAULT 0,
  start_date DATE,
  expected_completion DATE,
  team_lead_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','on_hold','delivered','completed')),
  delivery_date DATE,
  completion_date DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  deadline TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task file attachments
CREATE TABLE public.task_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs
CREATE TABLE public.activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES public.profiles(id),
  metadata JSONB,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVOICES / REVENUE
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS invoice_id_seq START 1001;

CREATE TABLE public.invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_number TEXT UNIQUE DEFAULT ('INV-' || nextval('invoice_id_seq')::TEXT),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  quoted_value NUMERIC(12,2) DEFAULT 0,
  final_billing NUMERIC(12,2) DEFAULT 0,
  amount_received NUMERIC(12,2) DEFAULT 0,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_date DATE,
  payment_mode TEXT CHECK (payment_mode IN ('bank_transfer','upi','cash','cheque','card','other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid','partially_paid','pending','overdue')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  expense_type TEXT NOT NULL CHECK (expense_type IN (
    'freelancer','designer','developer','advertising','travel',
    'software','hosting','miscellaneous'
  )),
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  bill_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SALES TARGETS
-- ============================================================
CREATE TABLE public.sales_targets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  service_type TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_type, month, year)
);

CREATE TABLE public.sales_closures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  target_id UUID REFERENCES public.sales_targets(id) ON DELETE CASCADE,
  closed_by UUID REFERENCES public.profiles(id),
  client_id UUID REFERENCES public.clients(id),
  project_id UUID REFERENCES public.projects(id),
  closed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','clients','projects','tasks','invoices','expenses']
  LOOP
    EXECUTE format('
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t);
  END LOOP;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_closures ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: users can see all profiles (for assignment dropdowns), edit own
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_admin" ON public.profiles FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');

-- Clients: admin + team_lead full, others read
CREATE POLICY "clients_select" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert" ON public.clients FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin','team_lead'));
CREATE POLICY "clients_update" ON public.clients FOR UPDATE TO authenticated USING (get_my_role() IN ('admin','team_lead'));
CREATE POLICY "clients_delete" ON public.clients FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- Projects: all authenticated can read, admin/team_lead can write
CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin','team_lead'));
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated USING (get_my_role() IN ('admin','team_lead'));
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- Tasks: all can read, team_lead can create/assign, member can update own
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin','team_lead'));
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated USING (
  get_my_role() IN ('admin','team_lead') OR assigned_to = auth.uid()
);
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE TO authenticated USING (get_my_role() IN ('admin','team_lead'));

-- Task files: all can read, assigned member + team_lead can upload
CREATE POLICY "task_files_select" ON public.task_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "task_files_insert" ON public.task_files FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "task_files_delete" ON public.task_files FOR DELETE TO authenticated USING (get_my_role() IN ('admin','team_lead'));

-- Activity logs: all can read, system inserts
CREATE POLICY "activity_select" ON public.activity_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_insert" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Finance: admin only
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT TO authenticated USING (get_my_role() IN ('admin','team_lead'));
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE TO authenticated USING (get_my_role() = 'admin');

CREATE POLICY "expenses_select" ON public.expenses FOR SELECT TO authenticated USING (get_my_role() IN ('admin','team_lead'));
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- Sales targets
CREATE POLICY "targets_select" ON public.sales_targets FOR SELECT TO authenticated USING (true);
CREATE POLICY "targets_insert" ON public.sales_targets FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "targets_update" ON public.sales_targets FOR UPDATE TO authenticated USING (get_my_role() = 'admin');

CREATE POLICY "closures_select" ON public.sales_closures FOR SELECT TO authenticated USING (true);
CREATE POLICY "closures_insert" ON public.sales_closures FOR INSERT TO authenticated WITH CHECK (
  get_my_role() IN ('admin','sales_executive')
);
