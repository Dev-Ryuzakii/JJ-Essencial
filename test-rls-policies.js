require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Get the Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || "https://rqvymrvqtkdzkeoaynfr.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('Connecting to Supabase as anonymous user...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLSPolicies() {
  console.log('Testing RLS policies for support tables...');
  
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
    
    // Test creating a support chat with RLS enabled
    console.log('\nTesting support_chat creation with RLS...');
    const { data: chatData, error: chatError } = await supabase
      .from('support_chat')
      .insert({
        user_id: authData.user.id,
        subject: 'RLS Test Ticket',
        priority: 'MEDIUM',
        status: 'OPEN'
      })
      .select()
      .single();
    
    if (chatError) {
      console.log('❌ Error creating support chat with RLS:', chatError.message);
      // Check if it's a permission error
      if (chatError.message.includes('permission denied') || chatError.message.includes('not authorized')) {
        console.log('This indicates RLS policies might not be properly configured.');
      }
    } else {
      console.log('✅ Support chat created successfully with RLS');
      console.log('Chat ID:', chatData.id);
      
      // Test creating a message
      console.log('\nTesting chat_message creation with RLS...');
      const { data: messageData, error: messageError } = await supabase
        .from('chat_message')
        .insert({
          chat_id: chatData.id,
          sender_id: authData.user.id,
          message: 'Test message with RLS',
          is_admin: false
        })
        .select()
        .single();
      
      if (messageError) {
        console.log('❌ Error creating message with RLS:', messageError.message);
      } else {
        console.log('✅ Message created successfully with RLS');
        console.log('Message ID:', messageData.id);
        
        // Clean up
        await supabase.from('chat_message').delete().eq('id', messageData.id);
        await supabase.from('support_chat').delete().eq('id', chatData.id);
        console.log('✅ Test data cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testRLSPolicies();