const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testDirectRoute() {
  console.log('=== Testing Direct Route ===\n');

  try {
    // Test 1: Try root path
    console.log('Test 1: Try root path /api/community');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/community`);
      console.log('✓ Root path works');
      console.log('Response:', response.data);
    } catch (error) {
      console.error('✗ Root path failed:', error.response?.data || error.message);
    }

    // Test 2: Try posts path
    console.log('\nTest 2: Try /api/community/posts');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/community/posts`);
      console.log('✓ Posts path works');
      console.log('Response:', response.data);
    } catch (error) {
      console.error('✗ Posts path failed:', error.response?.data || error.message);
      console.error('Full error:', error);
    }

    // Test 3: Try with trailing slash
    console.log('\nTest 3: Try /api/community/posts/');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/community/posts/`);
      console.log('✓ Posts with trailing slash works');
      console.log('Response:', response.data);
    } catch (error) {
      console.error('✗ Posts with trailing slash failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDirectRoute();
