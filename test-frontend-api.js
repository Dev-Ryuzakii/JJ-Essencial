require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Get the Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || "https://rqvymrvqtkdzkeoaynfr.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('Connecting to Supabase as anonymous user...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simulate the frontend API client
async function post(endpoint, data) {
  try {
    // First, sign in with the provided credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'faladerasaq22@gmail.com',
      password: '1234567890'
    });
    
    if (authError) {
      console.log('❌ Authentication error:', authError.message);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    console.log('✅ User authenticated successfully');
    
    // Set the auth token for subsequent requests
    const token = authData.session.access_token;
    
    // Make the API request to the backend (this would normally be to your NestJS app)
    // But we'll simulate it by directly calling the Supabase tables with the user's token
    console.log(`\nMaking POST request to: ${endpoint}`);
    
    if (endpoint === '/customer-support/chat') {
      // Simulate creating a support chat
      const { data: chatData, error: chatError } = await supabase
        .from('support_chat')
        .insert({
          user_id: authData.user.id,
          subject: data.subject,
          priority: data.priority || 'MEDIUM',
          status: 'OPEN'
        })
        .select()
        .single();
      
      if (chatError) {
        console.log('❌ Error creating support chat:', chatError.message);
        throw new Error(`Failed to create support ticket: ${chatError.message}`);
      }
      
      console.log('✅ Support chat created successfully');
      
      // Create the initial message
      const { data: messageData, error: messageError } = await supabase
        .from('chat_message')
        .insert({
          chat_id: chatData.id,
          sender_id: authData.user.id,
          message: data.initialMessage,
          is_admin: false
        })
        .select()
        .single();
      
      if (messageError) {
        console.log('❌ Error creating initial message:', messageError.message);
        // Clean up the chat we created
        await supabase.from('support_chat').delete().eq('id', chatData.id);
        throw new Error(`Failed to create support ticket: ${messageError.message}`);
      }
      
      console.log('✅ Initial message created successfully');
      
      // Get the complete chat with messages
      const { data: fullChat, error: fullChatError } = await supabase
        .from('support_chat')
        .select(`
          *,
          messages:chat_message (
            *,
            sender:sender_id (
              id,
              email,
              full_name
            )
          )
        `)
        .eq('id', chatData.id)
        .single();
      
      if (fullChatError) {
        console.log('❌ Error fetching complete chat:', fullChatError.message);
        // Clean up
        await supabase.from('chat_message').delete().eq('id', messageData.id);
        await supabase.from('support_chat').delete().eq('id', chatData.id);
        throw new Error(`Failed to create support ticket: ${fullChatError.message}`);
      }
      
      console.log('✅ Complete chat fetched successfully');
      
      // Clean up test data
      await supabase.from('chat_message').delete().eq('id', messageData.id);
      await supabase.from('support_chat').delete().eq('id', chatData.id);
      console.log('✅ Test data cleaned up');
      
      return { data: fullChat };
    }
    
    throw new Error(`Unknown endpoint: ${endpoint}`);
    
  } catch (error) {
    console.error('❌ API request failed:', error.message);
    throw error;
  }
}

async function testFrontendApi() {
  console.log('Testing frontend API simulation...');
  
  try {
    const response = await post('/customer-support/chat', {
      subject: 'Test Support Ticket',
      priority: 'MEDIUM',
      initialMessage: 'This is a test message for the support ticket.'
    });
    
    if (response.data) {
      console.log('✅ Ticket created successfully:', response.data.id);
    } else {
      throw new Error('Failed to create support ticket');
    }
    
  } catch (error) {
    console.error('❌ Error creating support ticket:', error.message);
    // This is the exact error message from the frontend guide
    throw new Error(error.response?.data?.message || error.message || 'Failed to create support ticket');
  }
}

testFrontendApi();