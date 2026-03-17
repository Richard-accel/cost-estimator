
-- Add diagnosis_code and comorbidity to historical_bills
ALTER TABLE public.historical_bills ADD COLUMN IF NOT EXISTS diagnosis_code text;
ALTER TABLE public.historical_bills ADD COLUMN IF NOT EXISTS comorbidity text;

-- Add diagnosis_code, comorbidity, age_group, gender to calculated_averages
ALTER TABLE public.calculated_averages ADD COLUMN IF NOT EXISTS diagnosis_code text;
ALTER TABLE public.calculated_averages ADD COLUMN IF NOT EXISTS comorbidity text;
ALTER TABLE public.calculated_averages ADD COLUMN IF NOT EXISTS age_group text;
ALTER TABLE public.calculated_averages ADD COLUMN IF NOT EXISTS gender text;
