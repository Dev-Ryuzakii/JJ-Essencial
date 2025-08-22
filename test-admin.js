const axios = require('axios');

async function testAdminFunctionality() {
    const baseURL = 'http://localhost:3000/api/v1';
    
    console.log('🧪 Testing Admin System Functionality...\n');
    
    try {
        // 1. Test admin signin
        console.log('1️⃣ Testing admin signin...');
        const adminResponse = await axios.post(`${baseURL}/auth/admin/signin`, {
            email: 'jadesola0518@gmail.com',
            password: 'Amoke1805'
        });
        
        console.log('✅ Admin signin successful!');
        const adminToken = adminResponse.data.data.access_token;
        console.log('🔑 Admin token obtained');
        
        // Create headers for authenticated requests
        const adminHeaders = {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        };
        
        // 2. Test admin dashboard stats
        console.log('\n2️⃣ Testing admin dashboard stats...');
        const statsResponse = await axios.get(`${baseURL}/admin/dashboard/stats`, {
            headers: adminHeaders
        });
        
        console.log('✅ Dashboard stats retrieved:');
        console.log(JSON.stringify(statsResponse.data, null, 2));
        
        // 3. Test get all users
        console.log('\n3️⃣ Testing get all users...');
        const usersResponse = await axios.get(`${baseURL}/admin/users`, {
            headers: adminHeaders
        });
        
        console.log('✅ Users list retrieved:');
        console.log(`📊 Total users: ${usersResponse.data.data?.length || 0}`);
        if (usersResponse.data.data?.length > 0) {
            console.log('👤 First user:', usersResponse.data.data[0]);
        }
        
        // 4. Test get all categories
        console.log('\n4️⃣ Testing get all categories...');
        const categoriesResponse = await axios.get(`${baseURL}/admin/categories`, {
            headers: adminHeaders
        });
        
        console.log('✅ Categories list retrieved:');
        console.log(`📂 Total categories: ${categoriesResponse.data.data?.length || 0}`);
        if (categoriesResponse.data.data?.length > 0) {
            console.log('📁 Categories:', categoriesResponse.data.data);
        }
        
        // 5. Test create a new category
        console.log('\n5️⃣ Testing create new category...');
        const timestamp = Date.now();
        const newCategoryResponse = await axios.post(`${baseURL}/admin/categories`, {
            name: `Test Category ${timestamp}`,
            description: 'A test category created by API test',
            sortOrder: 100
        }, {
            headers: adminHeaders
        });
        
        console.log('✅ New category created:');
        console.log(JSON.stringify(newCategoryResponse.data, null, 2));
        
        // 6. Test get all products
        console.log('\n6️⃣ Testing get all products...');
        const productsResponse = await axios.get(`${baseURL}/admin/products`, {
            headers: adminHeaders
        });
        
        console.log('✅ Products list retrieved:');
        console.log(`🛍️ Total products: ${productsResponse.data.data?.length || 0}`);
        
        // 7. Test get all orders
        console.log('\n7️⃣ Testing get all orders...');
        const ordersResponse = await axios.get(`${baseURL}/admin/orders`, {
            headers: adminHeaders
        });
        
        console.log('✅ Orders list retrieved:');
        console.log(`📦 Total orders: ${ordersResponse.data.data?.length || 0}`);
        
        // 8. Test analytics endpoints
        console.log('\n8️⃣ Testing analytics endpoints...');
        const salesAnalyticsResponse = await axios.get(`${baseURL}/admin/analytics/sales`, {
            headers: adminHeaders
        });
        
        console.log('✅ Sales analytics retrieved:');
        console.log(JSON.stringify(salesAnalyticsResponse.data, null, 2));
        
        console.log('\n🎉 All admin functionality tests completed successfully!');
        console.log('\n📋 Summary:');
        console.log('✅ Admin authentication working');
        console.log('✅ Dashboard stats working');
        console.log('✅ User management working');
        console.log('✅ Category management working');
        console.log('✅ Product management working');
        console.log('✅ Analytics working');
        console.log('\n🚀 Your admin system is fully functional and ready for frontend integration!');
        
    } catch (error) {
        console.log('❌ Test failed:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n🔐 Authentication issue - check admin credentials');
        } else if (error.response?.status === 404) {
            console.log('\n🔧 Server might not be running. Please start it with: npm run start:dev');
        } else if (error.response?.status === 403) {
            console.log('\n🚫 Authorization issue - admin role verification failed');
        }
    }
}

testAdminFunctionality();
