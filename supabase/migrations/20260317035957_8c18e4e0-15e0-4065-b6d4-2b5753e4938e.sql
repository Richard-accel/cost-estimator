
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('group', 'hospital', 'doctor');

-- 2. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Hospitals table
CREATE TABLE public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  state TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- 5. Doctors table
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  specialty TEXT,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- 6. Procedures table
CREATE TABLE public.procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

-- 7. Ward types
CREATE TABLE public.ward_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ward_types ENABLE ROW LEVEL SECURITY;

-- 8. Episode types
CREATE TABLE public.episode_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.episode_types ENABLE ROW LEVEL SECURITY;

-- 9. Payor types
CREATE TABLE public.payor_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payor_types ENABLE ROW LEVEL SECURITY;

-- 10. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 11. Ingestion batches
CREATE TABLE public.ingestion_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  year INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  record_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ingestion_batches ENABLE ROW LEVEL SECURITY;

-- 12. Historical bills
CREATE TABLE public.historical_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  procedure_code TEXT NOT NULL,
  episode_type TEXT,
  ward_type TEXT,
  age INTEGER,
  gender TEXT,
  total_bill NUMERIC NOT NULL,
  breakdown JSONB DEFAULT '{}',
  bill_date DATE,
  batch_id UUID REFERENCES public.ingestion_batches(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.historical_bills ENABLE ROW LEVEL SECURITY;

-- 13. Calculated averages
CREATE TABLE public.calculated_averages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  procedure_code TEXT NOT NULL,
  episode_type TEXT,
  ward_type TEXT,
  p50_total NUMERIC,
  p75_total NUMERIC,
  p50_breakdown JSONB DEFAULT '{}',
  p75_breakdown JSONB DEFAULT '{}',
  sample_size INTEGER DEFAULT 0,
  data_years TEXT[] DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calculated_averages ENABLE ROW LEVEL SECURITY;

-- 14. Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. RLS Policies

-- user_roles: users can read their own roles, group users can manage all
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Group users can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'group'))
  WITH CHECK (public.has_role(auth.uid(), 'group'));

-- profiles: users can read/update own, group can read all
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Group users can read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'group'));

-- hospitals: authenticated can read active, group can CRUD
CREATE POLICY "Authenticated can read active hospitals" ON public.hospitals
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Group users can manage hospitals" ON public.hospitals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'group'))
  WITH CHECK (public.has_role(auth.uid(), 'group'));

-- doctors: authenticated can read active, group can CRUD
CREATE POLICY "Authenticated can read active doctors" ON public.doctors
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Group users can manage doctors" ON public.doctors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'group'))
  WITH CHECK (public.has_role(auth.uid(), 'group'));

-- procedures: authenticated can read active, group can CRUD
CREATE POLICY "Authenticated can read active procedures" ON public.procedures
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Group users can manage procedures" ON public.procedures
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'group'))
  WITH CHECK (public.has_role(auth.uid(), 'group'));

-- ward_types, episode_types, payor_types: same pattern
CREATE POLICY "Authenticated can read active ward_types" ON public.ward_types
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Group can manage ward_types" ON public.ward_types
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'group'))
  WITH CHECK (public.has_role(auth.uid(), 'group'));

CREATE POLICY "Authenticated can read active episode_types" ON public.episode_types
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Group can manage episode_types" ON public.episode_types
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'group'))
  WITH CHECK (public.has_role(auth.uid(), 'group'));

CREATE POLICY "Authenticated can read active payor_types" ON public.payor_types
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Group can manage payor_types" ON public.payor_types
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'group'))
  WITH CHECK (public.has_role(auth.uid(), 'group'));

-- ingestion_batches: group can CRUD
CREATE POLICY "Group can manage ingestion_batches" ON public.ingestion_batches
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'group'))
  WITH CHECK (public.has_role(auth.uid(), 'group'));

-- historical_bills: group can CRUD
CREATE POLICY "Group can manage historical_bills" ON public.historical_bills
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'group'))
  WITH CHECK (public.has_role(auth.uid(), 'group'));

-- calculated_averages: authenticated can read, group can CRUD
CREATE POLICY "Authenticated can read calculated_averages" ON public.calculated_averages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Group can manage calculated_averages" ON public.calculated_averages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'group'))
  WITH CHECK (public.has_role(auth.uid(), 'group'));
