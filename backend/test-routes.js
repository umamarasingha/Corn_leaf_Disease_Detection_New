const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testRoutes() {
  console.log('=== Testing Routes ===\n');

  // Test 1: Check if server is running
  console.log('Test 1: Check if server is running');
  try {
    const response = await axios.get(`${API_BASE_URL}/`);
    console.log('✓ Server is running');
    console.log('Response:', response.data.message);
  } catch (error) {
    console.error('✗ Server not accessible:', error.message);
    return;
  }

  // Test 2: Get community posts without auth
  console.log('\nTest 2: Get community posts WITHOUT authentication');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/community/posts`);
    console.log('✓ Get posts works without auth');
    console.log('Posts:', response.data.length);
  } catch (error) {
    console.error('✗ Get posts failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }

  // Test 3: Login first
  console.log('\nTest 3: Login');
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@cornleaf.app',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✓ Login successful');

    // Test 4: Get community posts WITH auth
    console.log('\nTest 4: Get community posts WITH authentication');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/community/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✓ Get posts works with auth');
      console.log('Posts:', response.data.length);
    } catch (error) {
      console.error('✗ Get posts failed:', error.response?.data || error.message);
      console.error('Status:', error.response?.status);
    }

    // Test 5: Create post with auth
    console.log('\nTest 5: Create post with authentication');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/community/posts`, {
        title: 'Test Post',
        content: 'Test content'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✓ Create post works');
      console.log('Post ID:', response.data.id);
    } catch (error) {
      console.error('✗ Create post failed:', error.response?.data || error.message);
      console.error('Status:', error.response?.status);
    }

  } catch (error) {
    console.error('✗ Login failed:', error.response?.data || error.message);
  }

  console.log('\n=== Tests Complete ===');
}

testRoutes();
