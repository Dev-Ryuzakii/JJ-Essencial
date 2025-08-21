-- Add sort_order column to category table
ALTER TABLE public.category 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing categories to have sequential sort_order
WITH RECURSIVE NumberedCategories AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.category
)
UPDATE public.category c
SET sort_order = nc.rn
FROM NumberedCategories nc
WHERE c.id = nc.id;
