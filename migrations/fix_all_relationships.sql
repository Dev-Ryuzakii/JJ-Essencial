-- Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS public.category
    DROP CONSTRAINT IF EXISTS category_parent_id_fkey;

ALTER TABLE IF EXISTS public.product
    DROP CONSTRAINT IF EXISTS product_category_id_fkey;

-- Recreate the self-referential foreign key for categories
ALTER TABLE public.category
    ADD CONSTRAINT category_parent_id_fkey 
    FOREIGN KEY (parent_id) 
    REFERENCES public.category(id) 
    ON DELETE SET NULL;

-- Recreate the product-category foreign key
ALTER TABLE public.product
    ADD CONSTRAINT product_category_id_fkey 
    FOREIGN KEY (category_id) 
    REFERENCES public.category(id) 
    ON DELETE SET NULL;

-- Create or update indexes
DROP INDEX IF EXISTS idx_category_parent_id;
DROP INDEX IF EXISTS idx_product_category_id;

CREATE INDEX idx_category_parent_id ON public.category(parent_id);
CREATE INDEX idx_product_category_id ON public.product(category_id);

-- Enable RLS for the category table if not already enabled
ALTER TABLE public.category ENABLE ROW LEVEL SECURITY;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
