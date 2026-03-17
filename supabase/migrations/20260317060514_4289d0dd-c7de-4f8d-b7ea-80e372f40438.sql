
-- Initialize sort_order for existing records based on created_at order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.promotions
)
UPDATE public.promotions p
SET sort_order = n.rn
FROM numbered n
WHERE p.id = n.id;
