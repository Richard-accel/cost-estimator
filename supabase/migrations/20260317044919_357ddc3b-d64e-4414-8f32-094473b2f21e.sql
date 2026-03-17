CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL,
  procedure_code text,
  package_price numeric NOT NULL,
  original_price numeric,
  includes text[] DEFAULT '{}',
  valid_from date,
  valid_until date,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  badge_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read active promotions"
  ON public.promotions FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Group can manage promotions"
  ON public.promotions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'group'::app_role))
  WITH CHECK (has_role(auth.uid(), 'group'::app_role));