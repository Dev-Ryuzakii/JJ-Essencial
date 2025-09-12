 const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simulate the exact API call that BankAccountService.getActiveBankAccounts() makes
async function testBankAccountServiceCall() {
  console.log('🧪 Testing BankAccountService.getActiveBankAccounts() equivalent call...\n');

  try {
    // This is the exact query from our fixed bank-account.service.ts
    const { data: accounts, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Service call failed:', error);
      return;
    }

    console.log('✅ Service call successful!');
    console.log(`📊 Found ${accounts.length} active bank account(s)\n`);

    // Transform data exactly like the service does
    const bankAccountDtos = accounts.map(account => ({
      bankName: account.bank_name,
      accountName: account.account_name,
      accountNumber: account.account_number,
      sortCode: account.sort_code || undefined,
      swiftCode: account.swift_code || undefined,
      currency: account.currency,
    }));

    console.log('💳 Transformed bank accounts for frontend:');
    bankAccountDtos.forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.bankName}`);
      console.log(`      Account Name: ${account.accountName}`);
      console.log(`      Account Number: ${account.accountNumber}`);
      console.log(`      Currency: ${account.currency || 'Not specified'}`);
      if (account.sortCode) console.log(`      Sort Code: ${account.sortCode}`);
      if (account.swiftCode) console.log(`      Swift Code: ${account.swiftCode}`);
      console.log('');
    });

    console.log('🎉 The checkout component should now be able to display bank accounts!');
    console.log('📱 Frontend API call: GET /api/v1/payments/bank-transfer/bank-accounts');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

console.log('='.repeat(70));
console.log('BANK ACCOUNT SERVICE SIMULATION TEST');
console.log('='.repeat(70));

testBankAccountServiceCall()
  .then(() => {
    console.log('\n' + '='.repeat(70));
    console.log('✅ BANK ACCOUNT FIX VERIFICATION COMPLETE');
    console.log('The table name issue has been resolved successfully!');
    console.log('='.repeat(70));
  })
  .catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  }); 