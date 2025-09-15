require('dotenv').config();
const axios = require('axios');

async function testAuthenticatedApi() {
  console.log('Testing authenticated API call to create support ticket...');
  
  try {
    // First, authenticate to get a JWT token
    console.log('Authenticating user...');
    const authResponse = await axios.post('http://localhost:3000/api/v1/auth/signin', {
      email: 'faladerasaq22@gmail.com',
      password: '1234567890'
    });
    
    console.log('✅ Authentication successful');
    const token = authResponse.data.data.access_token;
    console.log('Token received:', token ? 'Yes' : 'No');
    
    // Now try to create a support ticket with the token
    console.log('\nCreating support ticket...');
    const ticketResponse = await axios.post('http://localhost:3000/api/v1/customer-support/chat', {
      subject: 'Test Support Ticket',
      priority: 'MEDIUM',
      initialMessage: 'This is a test message for the support ticket.'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Support ticket created successfully');
    console.log('Ticket ID:', ticketResponse.data.id);
    
    // Clean up - delete the test ticket
    // We would need admin privileges to do this directly, so we'll skip cleanup for now
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Network Error:', error.message);
    }
    
    // This is the exact error that would be thrown in the frontend
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create support ticket';
    throw new Error(errorMessage);
  }
}

testAuthenticatedApi().catch(error => {
  console.error('\n❌ Test failed:', error.message);
});