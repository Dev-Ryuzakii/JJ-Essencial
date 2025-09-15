require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Get the Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || "https://rqvymrvqtkdzkeoaynfr.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('Connecting to Supabase as anonymous user...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupportTicket() {
  console.log('Testing support ticket creation...');
  
  try {
    // First, let's sign in with the provided credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'faladerasaq22@gmail.com',
      password: '1234567890'
    });
    
    if (authError) {
      console.log('❌ Authentication error:', authError.message);
      return;
    }
    
    console.log('✅ User authenticated successfully');
    console.log('User ID:', authData.user.id);
    
    // Now try to create a support ticket
    const { data: ticketData, error: ticketError } = await supabase
      .from('support_chat')
      .insert({
        user_id: authData.user.id,
        subject: 'Test Support Ticket',
        priority: 'MEDIUM',
        status: 'OPEN'
      })
      .select()
      .single();
    
    if (ticketError) {
      console.log('❌ Error creating support ticket:', ticketError.message);
      return;
    }
    
    console.log('✅ Support ticket created successfully');
    console.log('Ticket ID:', ticketData.id);
    
    // Now add an initial message to the ticket
    const { data: messageData, error: messageError } = await supabase
      .from('chat_message')
      .insert({
        chat_id: ticketData.id,
        sender_id: authData.user.id,
        message: 'This is a test message for the support ticket.',
        is_admin: false
      })
      .select()
      .single();
    
    if (messageError) {
      console.log('❌ Error creating initial message:', messageError.message);
      // Try to clean up the ticket we created
      await supabase.from('support_chat').delete().eq('id', ticketData.id);
      return;
    }
    
    console.log('✅ Initial message created successfully');
    console.log('Message ID:', messageData.id);
    
    // Clean up - delete the test ticket
    const { error: deleteError } = await supabase.from('chat_message').delete().eq('id', messageData.id);
    const { error: deleteChatError } = await supabase.from('support_chat').delete().eq('id', ticketData.id);
    
    if (deleteError || deleteChatError) {
      console.log('⚠️  Warning: Error cleaning up test data');
    } else {
      console.log('✅ Test data cleaned up successfully');
    }
    
    console.log('\n🎉 All tests passed! The customer support system is working correctly.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testSupportTicket();