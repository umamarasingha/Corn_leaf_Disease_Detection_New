export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface DiseaseDetection {
  id: string;
  userId: string;
  imageUrl: string;
  result: {
    disease: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
    treatment: string;
  };
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  content: string;
  images?: string[];
  likes: number;
  comments: Comment[];
  createdAt: string;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author: string;
  createdAt: string;
  category: 'research' | 'outbreak' | 'treatment' | 'general';
  isPublished: boolean;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
}

export interface ModelTrainingData {
  id: string;
  imageUrl: string;
  diseaseLabel: string;
  confidence: number;
  uploadedBy: string;
  uploadedAt: string;
  isVerified: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  totalDetections: number;
  totalPosts: number;
  activeUsers: number;
  diseaseDistribution: Record<string, number>;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'detection' | 'post' | 'login' | 'registration';
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
}

// Enhanced types for better API integration
export interface DetectionResult {
  disease: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  treatment: string;
  prevention: string;
  timestamp: string;
  imageUrl?: string;
}

export interface ChatResponse {
  message: string;
  suggestions: string[];
  timestamp: string;
}
