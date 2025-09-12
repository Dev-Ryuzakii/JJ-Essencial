const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPaymentTables() {
  try {
    console.log('🔄 Creating payment tables directly...');
    
    // First, create the paymentTransaction table
    console.log('📝 Creating paymentTransaction table...');
    
    const createTableSQL = `
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
    `;
    
    // Execute the SQL using rpc if available, otherwise will handle differently
    let result = await supabase.rpc('execute_sql', { query: createTableSQL });
    
    if (result.error && result.error.code === 'PGRST202') {
      console.log('🔧 Using alternative method to create table...');
      
      // Since exec_sql is not available, let's try to create a test record to trigger table creation
      // But first, let's try to query if table exists
      const { data: tableCheck, error: checkError } = await supabase
        .from('paymentTransaction')
        .select('*')
        .limit(1);
        
      if (checkError && checkError.code === 'PGRST106') {
        console.log('❌ Table does not exist. Manual creation required.');
        console.log('📋 Please execute this SQL in Supabase SQL Editor:');
        console.log('');
        console.log('-- ===========================================');
        console.log('-- EXECUTE THIS SQL IN SUPABASE SQL EDITOR');
        console.log('-- ===========================================');
        console.log('');
        console.log(`CREATE TABLE IF NOT EXISTS public.paymentTransaction (
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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for paymentTransaction
DROP TRIGGER IF EXISTS update_paymentTransaction_updated_at ON public.paymentTransaction;
CREATE TRIGGER update_paymentTransaction_updated_at
    BEFORE UPDATE ON public.paymentTransaction
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

-- Create trigger for paymentReceipt
DROP TRIGGER IF EXISTS update_paymentReceipt_updated_at ON public.paymentReceipt;
CREATE TRIGGER update_paymentReceipt_updated_at
    BEFORE UPDATE ON public.paymentReceipt
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();`);
        
        console.log('');
        console.log('-- ===========================================');
        console.log('');
        console.log('✋ Please copy and paste the above SQL into your Supabase SQL Editor and execute it.');
        console.log('🔗 Visit: https://supabase.com/dashboard/project/rqvymrvqtkdzkeoaynfr/sql/new');
        console.log('');
        console.log('After executing the SQL, run this script again to verify the tables.');
        
        return;
      } else {
        console.log('✅ paymentTransaction table already exists!');
      }
    } else if (result.error) {
      console.error('❌ Error creating table:', result.error);
      return;
    } else {
      console.log('✅ paymentTransaction table created successfully');
    }
    
    // Test if we can access the table
    console.log('🧪 Testing table access...');
    const { data: testData, error: testError } = await supabase
      .from('paymentTransaction')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.error('❌ Cannot access paymentTransaction table:', testError);
    } else {
      console.log('✅ paymentTransaction table is accessible');
      console.log('📊 Current records in table:', testData.length);
    }
    
  } catch (error) {
    console.error('❌ Exception occurred:', error);
  }
}

createPaymentTables();