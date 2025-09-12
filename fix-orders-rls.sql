-- Fix RLS policies for orders table

-- Enable RLS if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS orders_user_insert ON orders;
DROP POLICY IF EXISTS orders_user_select ON orders;
DROP POLICY IF EXISTS orders_user_update ON orders;

-- Allow authenticated users to insert orders for themselves
CREATE POLICY orders_user_insert ON orders
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Allow authenticated users to select their own orders
CREATE POLICY orders_user_select ON orders
FOR SELECT USING (auth.uid()::text = user_id);

-- Allow authenticated users to update their own orders
CREATE POLICY orders_user_update ON orders
FOR UPDATE USING (auth.uid()::text = user_id);

-- Also need policies for order_item table
ALTER TABLE order_item ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for order_item
DROP POLICY IF EXISTS order_item_user_insert ON order_item;
DROP POLICY IF EXISTS order_item_user_select ON order_item;

-- Allow authenticated users to insert order items for their own orders
CREATE POLICY order_item_user_insert ON order_item
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_item.order_id 
    AND orders.user_id = auth.uid()::text
  )
);

-- Allow authenticated users to select order items for their own orders
CREATE POLICY order_item_user_select ON order_item
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_item.order_id 
    AND orders.user_id = auth.uid()::text
  )
);