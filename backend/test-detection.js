const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:8000';

async function testDiseaseDetection() {
  console.log('=== Testing Disease Detection ===\n');

  try {
    // Login first
    console.log('Login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@cornleaf.app',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✓ Login successful');

    // Test 1: Get detection history
    console.log('\nTest 1: Get detection history');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/detection/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✓ Get history works');
      console.log('Detections:', response.data.length);
    } catch (error) {
      console.error('✗ Get history failed:', error.response?.data || error.message);
    }

    // Test 2: Upload an image for detection
    console.log('\nTest 2: Upload image for detection');
    try {
      // Create a simple test image file
      const testImagePath = 'test-image.jpg';
      const testImageData = Buffer.from('fake image data');

      const formData = new FormData();
      formData.append('image', testImageData, { filename: 'test-image.jpg', contentType: 'image/jpeg' });

      const response = await axios.post(`${API_BASE_URL}/api/detection/analyze`, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✓ Image upload works');
      console.log('Detection result:', response.data);
    } catch (error) {
      console.error('✗ Image upload failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testDiseaseDetection();
