-- Create paymentTransaction table for tracking payment transactions
-- This table will store payment transaction records for all gateways

CREATE TABLE IF NOT EXISTS public.paymentTransaction (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    orderId UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    userId UUID NOT NULL,
    reference TEXT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    gateway VARCHAR(20) NOT NULL CHECK (gateway IN ('PAYSTACK', 'FLUTTERWAVE', 'BANK_TRANSFER')),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'AWAITING_VERIFICATION')),
    gatewayResponse JSONB,
    verifiedAt TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_paymentTransaction_orderId ON public.paymentTransaction(orderId);
CREATE INDEX IF NOT EXISTS idx_paymentTransaction_userId ON public.paymentTransaction(userId);
CREATE INDEX IF NOT EXISTS idx_paymentTransaction_reference ON public.paymentTransaction(reference);
CREATE INDEX IF NOT EXISTS idx_paymentTransaction_status ON public.paymentTransaction(status);
CREATE INDEX IF NOT EXISTS idx_paymentTransaction_gateway ON public.paymentTransaction(gateway);
CREATE INDEX IF NOT EXISTS idx_paymentTransaction_createdAt ON public.paymentTransaction(createdAt);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_paymentTransaction_updated_at ON public.paymentTransaction;
CREATE TRIGGER update_paymentTransaction_updated_at
    BEFORE UPDATE ON public.paymentTransaction
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comment
COMMENT ON TABLE public.paymentTransaction IS 'Payment transactions for all payment gateways including Paystack, Flutterwave, and Bank Transfer';
COMMENT ON COLUMN public.paymentTransaction.reference IS 'Unique reference for the payment transaction';
COMMENT ON COLUMN public.paymentTransaction.gateway IS 'Payment gateway used (PAYSTACK, FLUTTERWAVE, BANK_TRANSFER)';
COMMENT ON COLUMN public.paymentTransaction.status IS 'Current status of the payment transaction';
COMMENT ON COLUMN public.paymentTransaction.gatewayResponse IS 'Response data from the payment gateway (JSON)';

-- Create paymentReceipt table for bank transfer receipts
CREATE TABLE IF NOT EXISTS public.paymentReceipt (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transactionId UUID NOT NULL REFERENCES public.paymentTransaction(id) ON DELETE CASCADE,
    uploadedBy UUID NOT NULL,
    receiptUrl TEXT NOT NULL,
    originalName TEXT NOT NULL,
    fileSize INTEGER NOT NULL,
    verificationStatus VARCHAR(20) DEFAULT 'PENDING' CHECK (verificationStatus IN ('PENDING', 'APPROVED', 'REJECTED')),
    verificationNotes TEXT,
    verifiedBy UUID,
    verifiedAt TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for paymentReceipt
CREATE INDEX IF NOT EXISTS idx_paymentReceipt_transactionId ON public.paymentReceipt(transactionId);
CREATE INDEX IF NOT EXISTS idx_paymentReceipt_uploadedBy ON public.paymentReceipt(uploadedBy);
CREATE INDEX IF NOT EXISTS idx_paymentReceipt_verificationStatus ON public.paymentReceipt(verificationStatus);
CREATE INDEX IF NOT EXISTS idx_paymentReceipt_createdAt ON public.paymentReceipt(createdAt);

-- Add updated_at trigger for paymentReceipt
DROP TRIGGER IF EXISTS update_paymentReceipt_updated_at ON public.paymentReceipt;
CREATE TRIGGER update_paymentReceipt_updated_at
    BEFORE UPDATE ON public.paymentReceipt
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE public.paymentReceipt IS 'Payment receipts uploaded by customers for bank transfer payments';
COMMENT ON COLUMN public.paymentReceipt.receiptUrl IS 'URL to the uploaded receipt file in storage';
COMMENT ON COLUMN public.paymentReceipt.verificationStatus IS 'Status of receipt verification by admin';

SELECT 'Payment tables created successfully' as status;