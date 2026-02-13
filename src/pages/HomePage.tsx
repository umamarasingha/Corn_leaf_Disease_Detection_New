import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Camera, 
  Users, 
  MessageSquare, 
  Settings, 
  Leaf, 
  TrendingUp,
  Shield,
  BarChart3,
  ArrowRight
} from 'lucide-react';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  const features = [
    {
      icon: Camera,
      title: 'Disease Detection',
      description: 'AI-powered corn leaf disease detection with real-time analysis',
      path: '/detect',
      color: 'bg-green-500'
    },
    {
      icon: Users,
      title: 'Community Feed',
      description: 'Connect with farmers and share disease detection experiences',
      path: '/feed',
      color: 'bg-blue-500'
    },
    {
      icon: MessageSquare,
      title: 'AI Assistant',
      description: 'Get expert advice and treatment recommendations from our AI chatbot',
      path: '/chatbot',
      color: 'bg-purple-500'
    }
  ];

  const adminFeatures = [
    {
      icon: BarChart3,
      title: 'Dashboard',
      description: 'View system analytics and user statistics',
      path: '/admin/dashboard',
      color: 'bg-indigo-500'
    },
    {
      icon: Shield,
      title: 'Model Training',
      description: 'Train and manage AI disease detection models',
      path: '/admin/training',
      color: 'bg-orange-500'
    },
    {
      icon: Settings,
      title: 'Settings',
      description: 'Configure system settings and preferences',
      path: '/admin/settings',
      color: 'bg-gray-500'
    }
  ];

  const stats = [
    { label: 'Total Detections', value: '1,234', change: '+12%' },
    { label: 'Active Users', value: '89', change: '+5%' },
    { label: 'Accuracy Rate', value: '94.7%', change: '+2.3%' },
    { label: 'Diseases Detected', value: '6', change: '0%' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-white/20 rounded-2xl flex items-center justify-center">
                <Leaf className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to CornLeaf AI
            </h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              Advanced corn leaf disease detection powered by artificial intelligence
            </p>
            <div className="mt-8">
              <button
                onClick={() => navigate('/detect')}
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors inline-flex items-center"
              >
                Start Detection
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="w-full -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="flex items-center text-green-600 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Features */}
      <div className="w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Core Features
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need for effective corn disease detection and management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                onClick={() => navigate(feature.path)}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer p-8"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-lg flex items-center justify-center mb-6`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center text-primary-600 font-medium">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Features */}
      {isAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Admin Dashboard
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Manage system settings and monitor performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {adminFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  onClick={() => navigate(feature.path)}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer p-8 border-2 border-indigo-100"
                >
                  <div className={`w-16 h-16 ${feature.color} rounded-lg flex items-center justify-center mb-6`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-primary-600 font-medium">
                    Access Panel
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="w-full">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Detect Diseases?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Upload an image of your corn leaves and get instant AI-powered disease detection
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/detect')}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
              >
                <Camera className="h-5 w-5 mr-2" />
                Start Detection
              </button>
              <button
                onClick={() => navigate('/feed')}
                className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors inline-flex items-center justify-center"
              >
                <Users className="h-5 w-5 mr-2" />
                View Community
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
