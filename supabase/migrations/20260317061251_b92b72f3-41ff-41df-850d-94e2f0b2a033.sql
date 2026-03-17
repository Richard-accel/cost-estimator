
CREATE TABLE public.specialty_procedure_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty text NOT NULL,
  procedure_category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (specialty, procedure_category)
);

ALTER TABLE public.specialty_procedure_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read specialty mappings"
  ON public.specialty_procedure_categories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Group can manage specialty mappings"
  ON public.specialty_procedure_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'group'::app_role))
  WITH CHECK (has_role(auth.uid(), 'group'::app_role));
