-- Drop and recreate foreign key constraints with proper names
ALTER TABLE public.product DROP CONSTRAINT IF EXISTS product_category_id_fkey;
ALTER TABLE public.category DROP CONSTRAINT IF EXISTS category_parent_id_fkey;

-- Add foreign key constraints with explicit names
ALTER TABLE public.product
ADD CONSTRAINT product_category_id_fkey
FOREIGN KEY (category_id)
REFERENCES public.category(id)
ON DELETE SET NULL;

ALTER TABLE public.category
ADD CONSTRAINT category_parent_fkey
FOREIGN KEY (parent_id)
REFERENCES public.category(id)
ON DELETE SET NULL;

-- Create indexes for the foreign keys if they don't exist
CREATE INDEX IF NOT EXISTS idx_product_category_id ON public.product(category_id);
CREATE INDEX IF NOT EXISTS idx_category_parent_id ON public.category(parent_id);

-- Refresh the schema cache for Supabase
NOTIFY pgrst, 'reload schema';
