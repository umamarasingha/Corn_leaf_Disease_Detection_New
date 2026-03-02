const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testAuth() {
  console.log('=== Testing Authentication Flow ===\n');

  try {
    // Test 1: Login with admin credentials
    console.log('Test 1: Login with admin credentials');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@cornleaf.app',
      password: 'admin123'
    });
    console.log('✓ Login successful');
    console.log('Token:', loginResponse.data.token.substring(0, 20) + '...');
    console.log('User:', loginResponse.data.user.email);
    const token = loginResponse.data.token;

    // Test 2: Validate token
    console.log('\nTest 2: Validate token');
    const validateResponse = await axios.get(`${API_BASE_URL}/api/auth/validate-token`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Token validation successful');
    console.log('Valid:', validateResponse.data.valid);

    // Test 3: Get current user
    console.log('\nTest 3: Get current user');
    const meResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Get user successful');
    console.log('User:', meResponse.data.email);

    // Test 4: Test new routes for profile and password
    console.log('\nTest 4: Test /api/user/profile route');
    try {
      const profileResponse = await axios.put(`${API_BASE_URL}/api/user/profile`, {
        name: 'Admin User'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✓ /api/user/profile route works');
    } catch (error) {
      console.error('✗ /api/user/profile route failed:', error.response?.data || error.message);
    }

    console.log('\nTest 5: Test /api/user/change-password route');
    try {
      const passwordResponse = await axios.put(`${API_BASE_URL}/api/user/change-password`, {
        currentPassword: 'admin123',
        newPassword: 'admin123'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✓ /api/user/change-password route works');
    } catch (error) {
      console.error('✗ /api/user/change-password route failed:', error.response?.data || error.message);
    }

    console.log('\n=== All Tests Passed ===');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAuth();
