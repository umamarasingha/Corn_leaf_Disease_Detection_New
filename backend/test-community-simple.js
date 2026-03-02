const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testCommunityRoutes() {
  console.log('=== Testing Community Routes ===\n');

  try {
    // Test 1: Check if routes are mounted
    console.log('Test 1: Check if routes are mounted');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/community`);
      console.log('✓ Routes are mounted');
      console.log('Response:', response.data);
    } catch (error) {
      console.error('✗ Routes not mounted:', error.response?.data || error.message);
    }

    // Test 2: Try to get posts
    console.log('\nTest 2: Try to get posts');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/community/posts`);
      console.log('✓ Get posts works');
      console.log('Posts:', response.data);
    } catch (error) {
      console.error('✗ Get posts failed:', error.response?.data || error.message);
      console.error('Status:', error.response?.status);
    }

    // Test 3: Login and try to create a post
    console.log('\nTest 3: Login and try to create a post');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: 'admin@cornleaf.app',
        password: 'admin123'
      });
      const token = loginResponse.data.token;

      const createResponse = await axios.post(`${API_BASE_URL}/api/community/posts`, {
        title: 'Test Post',
        content: 'Test content'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✓ Create post works');
      console.log('Post ID:', createResponse.data.id);
    } catch (error) {
      console.error('✗ Create post failed:', error.response?.data || error.message);
      console.error('Status:', error.response?.status);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCommunityRoutes();
