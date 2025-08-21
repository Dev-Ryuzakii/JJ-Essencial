-- Reset relationships
ALTER TABLE IF EXISTS public.category DROP CONSTRAINT IF EXISTS category_parent_id_fkey;
ALTER TABLE IF EXISTS public.product DROP CONSTRAINT IF EXISTS product_category_id_fkey;

-- Add the constraints back with simplified names
ALTER TABLE public.category
    ADD CONSTRAINT category_parent_id_fkey 
    FOREIGN KEY (parent_id) 
    REFERENCES public.category(id) 
    ON DELETE SET NULL;

ALTER TABLE public.product
    ADD CONSTRAINT product_category_id_fkey 
    FOREIGN KEY (category_id) 
    REFERENCES public.category(id) 
    ON DELETE SET NULL;

-- Create standard indexes
CREATE INDEX IF NOT EXISTS idx_category_parent ON public.category(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_category ON public.product(category_id);
CREATE INDEX IF NOT EXISTS idx_category_sort ON public.category(sort_order);

-- Refresh Supabase schema cache
NOTIFY pgrst, 'reload schema';

-- Insert test data if needed
INSERT INTO public.category (name, description, slug, sort_order)
VALUES 
    ('Test Category', 'Test Description', 'test-category', 1)
ON CONFLICT (slug) DO NOTHING;
