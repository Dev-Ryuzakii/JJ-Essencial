-- Add missing columns to product table to match Prisma schema
ALTER TABLE product ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE product ADD COLUMN IF NOT EXISTS category VARCHAR(255);
ALTER TABLE product ADD COLUMN IF NOT EXISTS brand VARCHAR(255);
ALTER TABLE product ADD COLUMN IF NOT EXISTS weight DECIMAL(8,2);
ALTER TABLE product ADD COLUMN IF NOT EXISTS dimensions VARCHAR(255);
ALTER TABLE product ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE product ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE product ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Update any existing products to have featured = false if null
UPDATE product SET featured = false WHERE featured IS NULL;

-- Add some sample featured products for testing
UPDATE product SET featured = true WHERE id IN (
    SELECT id FROM product ORDER BY created_at DESC LIMIT 2
);
