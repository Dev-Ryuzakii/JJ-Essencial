require('dotenv').config();
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testImageUpload() {
  console.log('Testing Image Upload API...');
  
  try {
    // First, let's get an admin token
    console.log('1. Getting admin token...');
    const authResponse = await fetch('http://localhost:3000/api/v1/auth/admin/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'jadesola0518@gmail.com',
        password: 'Amoke1805'
      })
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Failed to authenticate:', authResponse.status, errorText);
      return;
    }

    const authData = await authResponse.json();
    const token = authData.data.access_token;
    console.log('✅ Got admin token');

    // Create a test product first
    console.log('2. Creating test product...');
    const productResponse = await fetch('http://localhost:3000/api/v1/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Product for Image Upload',
        description: 'Test product description',
        price: 99.99,
        stock: 10,
        sku: 'TEST-IMG-001',
        categoryId: '6717c6b6-8e30-4bb7-bfcf-a37cc08c8570', // Using existing category ID
        isActive: true
      })
    });

    if (!productResponse.ok) {
      const errorText = await productResponse.text();
      console.error('Failed to create product:', productResponse.status, errorText);
      return;
    }

    const productData = await productResponse.json();
    const productId = productData.data.id;
    console.log('✅ Created test product:', productId);

    // Create a small test image buffer (1x1 PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x02, 0x11, 0x27, 0xDB, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    // Test image upload
    console.log('3. Testing image upload...');
    const form = new FormData();
    form.append('images', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    const uploadResponse = await fetch(`http://localhost:3000/api/v1/admin/products/${productId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });

    console.log('Upload response status:', uploadResponse.status);
    const uploadResponseText = await uploadResponse.text();
    console.log('Upload response:', uploadResponseText);

    if (uploadResponse.ok) {
      console.log('✅ Image upload successful!');
    } else {
      console.error('❌ Image upload failed');
    }

    // Clean up - delete the test product
    console.log('4. Cleaning up test product...');
    await fetch(`http://localhost:3000/api/v1/admin/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Check if we have the required dependencies
if (typeof fetch === 'undefined') {
  console.log('Installing required dependencies...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install node-fetch form-data', { stdio: 'inherit' });
    console.log('Dependencies installed. Please run the test again.');
  } catch (error) {
    console.error('Failed to install dependencies. Please run: npm install node-fetch form-data');
  }
} else {
  testImageUpload();
}
