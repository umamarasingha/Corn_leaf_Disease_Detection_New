const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:8000';

async function testFileUpload() {
  console.log('=== Testing File Upload ===\n');

  try {
    // Login first to get token
    console.log('Login with admin credentials');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@cornleaf.app',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✓ Login successful\n');

    // Create a test image file
    const testImagePath = path.join(__dirname, 'test-image.txt');
    fs.writeFileSync(testImagePath, 'fake image content for testing');

    // Test 1: Disease detection upload
    console.log('Test 1: Disease detection image upload');
    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(testImagePath));

      const detectResponse = await axios.post(`${API_BASE_URL}/api/detection/analyze`, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✓ Disease detection upload works');
      console.log('Response:', detectResponse.data.message || 'Success');
    } catch (error) {
      console.error('✗ Disease detection upload failed:', error.response?.data || error.message);
    }

    // Test 2: Community post upload
    console.log('\nTest 2: Community post image upload');
    try {
      const formData = new FormData();
      formData.append('title', 'Test Post');
      formData.append('content', 'Test content');
      formData.append('image', fs.createReadStream(testImagePath));

      const postResponse = await axios.post(`${API_BASE_URL}/api/community/posts`, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✓ Community post upload works');
      console.log('Post ID:', postResponse.data.id);
    } catch (error) {
      console.error('✗ Community post upload failed:', error.response?.data || error.message);
    }

    // Test 3: News upload (admin only)
    console.log('\nTest 3: News image upload (admin only)');
    try {
      const formData = new FormData();
      formData.append('title', 'Test News');
      formData.append('content', 'Test news content');
      formData.append('image', fs.createReadStream(testImagePath));

      const newsResponse = await axios.post(`${API_BASE_URL}/api/news`, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✓ News upload works');
      console.log('News ID:', newsResponse.data.id);
    } catch (error) {
      console.error('✗ News upload failed:', error.response?.data || error.message);
    }

    // Cleanup
    fs.unlinkSync(testImagePath);
    console.log('\n=== File Upload Tests Complete ===');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testFileUpload();
