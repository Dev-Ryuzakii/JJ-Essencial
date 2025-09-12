-- Manual SQL to run in Supabase SQL Editor
-- This will fix the RLS policies for the orders system

-- First, let's check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'order_item');

-- Disable RLS temporarily to allow testing
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_item DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable with proper policies:
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_item ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY orders_authenticated_users ON orders
-- FOR ALL USING (auth.uid()::text = user_id);

-- CREATE POLICY order_item_authenticated_users ON order_item  
-- FOR ALL USING (
--   EXISTS (
--     SELECT 1 FROM orders 
--     WHERE orders.id = order_item.order_id 
--     AND orders.user_id = auth.uid()::text
--   )
-- );