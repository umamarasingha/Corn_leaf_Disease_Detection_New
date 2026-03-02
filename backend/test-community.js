const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testCommunity() {
  console.log('=== Testing Community Features ===\n');

  try {
    // Login first to get token
    console.log('Login with admin credentials');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@cornleaf.app',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✓ Login successful\n');

    // Test 1: Get all posts
    console.log('Test 1: Get all posts');
    try {
      const postsResponse = await axios.get(`${API_BASE_URL}/api/community/posts`);
      console.log('✓ Get posts works');
      console.log('Number of posts:', postsResponse.data.length);
    } catch (error) {
      console.error('✗ Get posts failed:', error.response?.data || error.message);
    }

    // Test 2: Create a post (without image for now)
    console.log('\nTest 2: Create a post');
    try {
      const createResponse = await axios.post(`${API_BASE_URL}/api/community/posts`, {
        title: 'Test Post',
        content: 'This is a test post created via API'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✓ Create post works');
      console.log('Post ID:', createResponse.data.id);
      const postId = createResponse.data.id;

      // Test 3: Get specific post
      console.log('\nTest 3: Get specific post');
      try {
        const postResponse = await axios.get(`${API_BASE_URL}/api/community/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✓ Get post works');
        console.log('Post title:', postResponse.data.title);
      } catch (error) {
        console.error('✗ Get post failed:', error.response?.data || error.message);
      }

      // Test 4: Like post
      console.log('\nTest 4: Like post');
      try {
        await axios.post(`${API_BASE_URL}/api/community/posts/${postId}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✓ Like post works');
      } catch (error) {
        console.error('✗ Like post failed:', error.response?.data || error.message);
      }

      // Test 5: Add comment
      console.log('\nTest 5: Add comment');
      try {
        await axios.post(`${API_BASE_URL}/api/community/posts/${postId}/comments`, {
          content: 'Test comment'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✓ Add comment works');
      } catch (error) {
        console.error('✗ Add comment failed:', error.response?.data || error.message);
      }

    } catch (error) {
      console.error('✗ Create post failed:', error.response?.data || error.message);
    }

    console.log('\n=== Community Tests Complete ===');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testCommunity();
