# CREATE PAYMENT TABLES IN SUPABASE

## Instructions

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/rqvymrvqtkdzkeoaynfr/sql/new

2. Copy and paste the SQL below into the SQL Editor

3. Click "Run" to execute the SQL

4. After successful execution, run the Flutterwave integration test again

---

## SQL TO EXECUTE

```sql
-- Create payment_transaction table for tracking payment transactions
CREATE TABLE IF NOT EXISTS public.payment_transaction (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    reference TEXT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    gateway VARCHAR(20) NOT NULL CHECK (gateway IN ('PAYSTACK', 'FLUTTERWAVE', 'BANK_TRANSFER')),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'AWAITING_VERIFICATION')),
    gateway_response JSONB,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transaction_order_id ON public.payment_transaction(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_user_id ON public.payment_transaction(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_reference ON public.payment_transaction(reference);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_status ON public.payment_transaction(status);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_gateway ON public.payment_transaction(gateway);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_created_at ON public.payment_transaction(created_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for payment_transaction
DROP TRIGGER IF EXISTS update_payment_transaction_updated_at ON public.payment_transaction;
CREATE TRIGGER update_payment_transaction_updated_at
    BEFORE UPDATE ON public.payment_transaction
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create payment_receipt table for bank transfer receipts
CREATE TABLE IF NOT EXISTS public.payment_receipt (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES public.payment_transaction(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL,
    receipt_url TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    verification_notes TEXT,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payment_receipt
CREATE INDEX IF NOT EXISTS idx_payment_receipt_transaction_id ON public.payment_receipt(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipt_uploaded_by ON public.payment_receipt(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_payment_receipt_verification_status ON public.payment_receipt(verification_status);
CREATE INDEX IF NOT EXISTS idx_payment_receipt_created_at ON public.payment_receipt(created_at);

-- Create trigger for payment_receipt
DROP TRIGGER IF EXISTS update_payment_receipt_updated_at ON public.payment_receipt;
CREATE TRIGGER update_payment_receipt_updated_at
    BEFORE UPDATE ON public.payment_receipt
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comments for documentation
COMMENT ON TABLE public.payment_transaction IS 'Payment transactions for all payment gateways including Paystack, Flutterwave, and Bank Transfer';
COMMENT ON COLUMN public.payment_transaction.reference IS 'Unique reference for the payment transaction';
COMMENT ON COLUMN public.payment_transaction.gateway IS 'Payment gateway used (PAYSTACK, FLUTTERWAVE, BANK_TRANSFER)';
COMMENT ON COLUMN public.payment_transaction.status IS 'Current status of the payment transaction';
COMMENT ON COLUMN public.payment_transaction.gateway_response IS 'Response data from the payment gateway (JSON)';

COMMENT ON TABLE public.payment_receipt IS 'Payment receipts uploaded by customers for bank transfer payments';
COMMENT ON COLUMN public.payment_receipt.receipt_url IS 'URL to the uploaded receipt file in storage';
COMMENT ON COLUMN public.payment_receipt.verification_status IS 'Status of receipt verification by admin';

-- Verification query
SELECT 'Payment tables created successfully!' as status;
```

---

## Verification

After executing the SQL, you should see:
- `payment_transaction` table created
- `payment_receipt` table created  
- All indexes created
- Triggers created
- Comments added

You can verify by running:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payment_transaction', 'payment_receipt');
```

This should return both table names.

---

## Next Steps

Once the tables are created, you can test the Flutterwave integration by running:
```bash
node test-flutterwave-integration.js
```