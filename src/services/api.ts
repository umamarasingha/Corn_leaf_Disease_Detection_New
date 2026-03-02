import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create base axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a proxy handler to add our custom methods
const api = new Proxy(axiosInstance, {
  get(target, prop) {
    // If the property exists on the axios instance, return it
    if (prop in target) {
      // @ts-ignore
      return target[prop];
    }

    // Handle our custom methods
    switch (prop) {
      case 'validateToken':
        return async (token: string) => {
          const response = await axiosInstance.get('/api/auth/validate-token', { 
            headers: { Authorization: `Bearer ${token}` } 
          });
          return response.data;
        };
          
      case 'login':
        return async (email: string, password: string) => {
          const response = await axiosInstance.post('/api/auth/login', { email, password });
          return response.data;
        };
          
      case 'register':
        return async (email: string, password: string, name: string) => {
          const response = await axiosInstance.post('/api/auth/register', { email, password, name });
          return response.data;
        };
          
      case 'updateProfile':
        return async (userData: any) => {
          const response = await axiosInstance.put('/api/user/profile', userData);
          return response.data;
        };
          
      case 'changePassword':
        return async (currentPassword: string, newPassword: string) => {
          const response = await axiosInstance.put('/api/user/change-password', { currentPassword, newPassword });
          return response.data;
        };
          
      case 'getAdminStats':
        return async () => {
          const response = await axiosInstance.get('/api/admin/stats');
          return response.data;
        };
        
      case 'getAdminUsers':
        return async () => {
          const response = await axiosInstance.get('/api/admin/users');
          return response.data;
        };
        
      case 'updateUserRole':
        return async (userId: string, role: string) => {
          const response = await axiosInstance.put(`/api/admin/users/${userId}/role`, { role });
          return response.data;
        };
          
      case 'getUserRoleHistory':
        return async (userId: string) => {
          const response = await axiosInstance.get(`/api/admin/users/${userId}/role-history`);
          return response.data;
        };
          
      case 'sendChatMessage':
        return async (message: string) => {
          const response = await axiosInstance.post('/api/chat', { message });
          return response.data;
        };
          
      case 'getPosts':
        return async () => {
          const response = await axiosInstance.get('/api/community/posts');
          return response.data;
        };
        
      case 'createPost':
        return async (title: string, content: string, image?: File) => {
          const formData = new FormData();
          formData.append('title', title);
          formData.append('content', content);
          if (image) {
            formData.append('image', image);
          }
          const response = await axiosInstance.post('/api/community/posts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return response.data;
        };
        
      case 'likePost':
        return async (postId: string) => {
          const response = await axiosInstance.post(`/api/community/posts/${postId}/like`);
          return response.data;
        };
        
      case 'analyzeImage':
        return async (file: File) => {
          const formData = new FormData();
          formData.append('image', file);
          const response = await axiosInstance.post('/api/detection/analyze', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return response.data;
        };
        
      default:
        return undefined;
    }
  },
}) as any; // We use 'any' here to avoid TypeScript complaints about the proxy

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    // Log error details for debugging
    console.error('API Response Error:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      url: error?.config?.url,
      method: error?.config?.method
    });
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.warn('Unauthorized access - clearing token and redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.login(email, password),
  
  register: (userData: { name: string; email: string; password: string }) => 
    api.register(userData.email, userData.password, userData.name),
    
  verifyEmail: (token: string) =>
    api.post('/api/auth/verify-email', { token }),
    
  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),
    
  resetPassword: (token: string, password: string) => 
    api.post('/api/auth/reset-password', { token, password }),
    
  getMe: () => api.get('/api/auth/me'),
  
  // Add the missing methods that are used in AuthContext
  updateProfile: (userData: any) => api.updateProfile(userData),
  changePassword: (currentPassword: string, newPassword: string) => 
    api.changePassword(currentPassword, newPassword),
  validateToken: (token: string) => api.validateToken(token)
};

// Detection API
export const detectionAPI = {
  detectDisease: (formData: FormData) =>
    api.post('/api/detect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    
  getDetectionHistory: (userId: string) =>
    api.get(`/api/detection/history/${userId}`),
    
  getDetectionDetails: (detectionId: string) =>
    api.get(`/api/detection/${detectionId}`),
    
  deleteDetection: (detectionId: string) =>
    api.delete(`/api/detection/${detectionId}`),
    
  // Add the analyzeImage method that's used in DetectDisease
  analyzeImage: (file: File) => api.analyzeImage(file)
};

// Community API
export const communityAPI = {
  getPosts: () => api.getPosts(),
  
  createPost: (postData: { title: string; content: string; image?: File }) => 
    api.createPost(postData.title, postData.content, postData.image),
  
  getPost: (postId: string) => 
    api.get(`/api/community/posts/${postId}`),
    
  likePost: (postId: string) =>
    api.likePost(postId),
    
  addComment: (postId: string, content: string) =>
    api.post(`/api/community/posts/${postId}/comments`, { content }),
    
  deletePost: (postId: string) =>
    api.delete(`/api/community/posts/${postId}`),
};

// Admin API
export const adminAPI = {
  // Users
  getUsers: () => api.getAdminUsers(),
  
  getUser: (userId: string) =>
    api.get(`/api/admin/users/${userId}`),
    
  updateUser: (userId: string, userData: any) =>
    api.put(`/api/admin/users/${userId}`, userData),
    
  deleteUser: (userId: string) =>
    api.delete(`/api/admin/users/${userId}`),
    
  // Stats
  getStats: () => api.getAdminStats(),
  
  // Model Training
  startModelTraining: (trainingData: any) =>
    api.post('/api/admin/train-model', trainingData),
    
  getTrainingStatus: (jobId: string) =>
    api.get(`/api/admin/training/status/${jobId}`),
    
  // Data Export
  exportData: (dataType: string) =>
    api.get(`/api/admin/export/${dataType}`, { responseType: 'blob' }),
    
  // Add the missing methods used in UserManagement
  updateUserRole: (userId: string, role: string) => 
    api.updateUserRole(userId, role),
    
  getUserRoleHistory: (userId: string) =>
    api.getUserRoleHistory(userId)
};

// User Profile API
export const profileAPI = {
  updateProfile: (profileData: { name: string; avatar?: File }) => {
    const formData = new FormData();
    formData.append('name', profileData.name);
    if (profileData.avatar) {
      formData.append('avatar', profileData.avatar);
    }
    return api.put('/api/user/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.changePassword(currentPassword, newPassword),
    
  deleteAccount: () =>
    api.delete('/api/user/account'),
};

// Export the API instance as the default export
export default api;
